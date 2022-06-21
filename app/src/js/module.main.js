/* global C, Notification, fetch, ymaps, Document, Window, attachEvent, DOMAIN, SOURCE, PLATFORM */

const API_URL = DOMAIN + "/api";
const TERMS_URL = DOMAIN + "/politika-konfidentsialnosti";
const RULES_URL = DOMAIN + "/pravila";
const REF_RULES_URL = DOMAIN + "/pravila-akcii";
const VERSION_URL = DOMAIN + "/version";
const LS_TOKEN = "LS_BearerToken";
const LS_CURR_UPDATE = "LS_CurrentUpdate";
const LS_CONTENTS = "LS_Contents";
const LS_NEED_UPDATE = "LS_NeedUpdate";
const LS_SECTION = "section";
const LS_PUSHID = "LS_pushID";

let lastPhone = "",
    secondsInterval = null,
    secondsLeft = 0,
    d = document,
    resetCodeTimer = null,
    resetCodeTimerValue = 0,
    viewNewApp = 1,
    currentBrightness;

const carouselSections = [
    "news",
    "stores",
    "wallet",
    "personal"
];

const sections = {
    "adult": {},
    "intro": {},
    "registration": {
        title: "Регистрация",
        prevSection: "pre-registration"
    },
    "pre-registration": {
        title: "Выбор города",
        prevSection: "intro"
    },
    "authorization": {
        title: "Вход",
        prevSection: "intro"
    },
    "reset": {
        title: "Сброс пароля",
        prevSection: "authorization"
    },
    "personal": {
        title: "Профиль",
        showMenu: true,
        needAuth: true
    },
    "wallet": {
        title: "Кошелек",
        showMenu: true,
        needAuth: true
    },
    "news": {
        title: "Новости",
        showMenu: true,
        needAuth: true
    },
    "refer": {
        title: "Приглашение",
        showMenu: true,
        prevSection: "personal",
        needAuth: true
    },
    "stores": {
        title: "Магазины",
        showMenu: true,
        needAuth: true
    },
    "reg_success": {
        title: "Регистрация завершена",
        showMenu: true,
        needAuth: true
    },
    "alerts": {
        title: "Подписки и уведомления",
        showMenu: true,
        needAuth: true
    },
    "personal_update": {
        title: "Смена данных",
        showMenu: true,
        prevSection: "personal",
        needAuth: true
    },
    "set_plastic": {
        title: "Привязка карты",
        showMenu: true,
        prevSection: "personal_update",
        needAuth: true
    },
    "setting_notify": {
        title: "Разрешения на уведомления",
        showMenu: true,
        prevSection: "personal_update",
        needAuth: true
    }
};

let currentSection = "",
    bearerToken = "",
    userActivityTimeout = null,
    initApp = true,
    clientInfo = "Сайт",
    clientDevice,
    tempUpdate = {
        personalHash: "",
        walletHash: "",
        storesHash: "",
        newsHash: "",
        lastPurchase: "",
        lastTransaction: ""
    };

const deviceType = () => {
    const ua = navigator.userAgent;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "mobile";
    } else if (/Mobile|Android|iPhone|iPad|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }

    return "desktop";
};

// Инициализация св-в приложения
d.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("deviceready", function () {
        let brightness = cordova.plugins.brightness;

        brightness.getBrightness((res) => {
            currentBrightness = res;
        }, (err) => {
            console.log(JSON.stringify(err));
        });
        
        clientDevice = `${device.platform} ${device.version} (${device.manufacturer} ${device.model})`;
        
        switch (device.platform) {
            case "Android":
                clientInfo = "Android v" + SOURCE;
                
                let messaging = cordova.plugins.firebase.messaging;
                
                messaging.getToken().then(function(token) {
                    C().setStor(LS_PUSHID, token);
                });
                messaging.onMessage(function(payload) {
                    let gcm = payload.gcm;
                    showPopup(gcm.title, gcm.body);
                });
                messaging.onBackgroundMessage(function(payload) {
                    //
                });
                break;
            case "iOS":
                clientInfo = "iOS v" + SOURCE;
                
                let push = window['APNSPushNotification'].init({
                        ios: {
                            alert: "true",
                            badge: "true",
                            sound: "true"
                        }
                    });
                push.on('registration', (data) => {
                    const token = data.registrationId;
                    C().setStor(LS_PUSHID, token);
                    //alert(token);
                    this.sendRegDetails(token);
                });
                push.on('other', (data) => {
                    //alert(data);
                });
                push.on('notification', (data) => {
                    //alert(data);
                    //showPopup(data.title, data.message);
                    window['cordova'].plugins.notification.local.schedule({
                        title: data.title,
                        text: data.message,
                        sound: data.sound,
                        at: new Date().getTime()
                    });
                });
                push.on('error', (e) => {
                    // e.message
                    //alert(e.message);
                });
                
                break;
        }
        
        document.addEventListener('backbutton', function (e) {
            e.preventDefault();
            
            if (!closeOpenOverlays()) {
                showPopup("Выйти из Столица.Бонусы?",
                        "",
                        "",
                        ["Да", "Нет"],
                        exitApp);
            }
        });
    });

    crashClearStorage();
    
    let updateStore = JSON.parse(C().getStor(LS_CURR_UPDATE));
    if (updateStore && updateStore.lastNews) {
        delete updateStore.lastNews;
        updateStore.newsHash = "";
        C().setStor(LS_CURR_UPDATE, JSON.stringify(updateStore));
    }
    
    initPopups();

    bearerToken = C().getStor(LS_TOKEN);

    C().setStor(LS_NEED_UPDATE, JSON.stringify({
        news: 1,
        personal: 1,
        stores: 1,
        wallet: 1,
        purchases: 1
    }));
    
    if (deviceType() !== "desktop" && !SOURCE && C().getStor("NOW_DATE") != new Date().toLocaleDateString()) {
        C(".alertUpdater__desc_name a").el.href = DOMAIN + "/application";
        show(C("#alertUpdater").el);
    }

    // Применим маску ко всем полям ввода номера телефона
    C('input[id*="-mask"]').els.forEach((inp) => {
        mask(inp);
        inp.addEventListener("input", (e) => {
            let phone = e.currentTarget.value;
            C('input[id*="-phone-mask"]').els.forEach((phn) => {
                phn.value = phone;
                setPhoneMask(phn);
            });
            C("#reset_button").el.disabled = (phone.length === 16 ? false : true);
        });
    });

    // Подключаем обработчики для Popup
    C('span[id*="-popup"]').els.forEach((pop) => {
        const inp = C("#" + pop.id.replace("-popup", "")).el;

        ["blur", "input"].map((evt) => {
            inp.addEventListener(evt, (e) => {
                dropFail(e.target);
                C("#" + e.target.id + "-popup").delclass("show");
            });
        });
    });
    
    C("#set_card").el.addEventListener("click", () => setCard());
    C("#auth-button").el.addEventListener("click", () => auth());

    C(".system_tabsHead > span label").els.forEach((label) => {
        label.addEventListener("click", (e) => {
            const el = e.currentTarget.parentNode,
                elCs = el.parentNode.parentNode.children[1].children,
                tabHeads = el.parentNode.children;

            [...tabHeads].map((tab) => tab.classList.remove("tab_h_active"));

            [...elCs].map((el) => el.classList.remove("tab_c_active"));

            el.classList.add("tab_h_active");
            elCs[el.dataset.tab].classList.add("tab_c_active");
        });
    });

    C("#reg-birthdate").el.addEventListener("input", (e) => validateBirthdate(e.target));

    C("#personal_changePassword_button").el.addEventListener("click", () => changeProfileData());

    C("#reset_confirmation_code").el.addEventListener("input", (e) => C("#reset_confirmation_button").el.disabled = (e.target.value.length === 4 ? false : true));

    C("#reg-confirmation-code").el.addEventListener("input", (e) => C("#confirmation_button").el.disabled = (e.target.value.length === 4 ? false : true));

    C("#reset-phone-mask").el.addEventListener("input", (e) => C("#reset_button").el.disabled = (e.target.value.length === 16 ? false : true));

    d.querySelectorAll("#personal-new-pass-confirmation, #personal-new-pass").forEach(() => {
        addEventListener("input", () => {
            const idInp = "#personal-new-pass",
                valEl = C(idInp).val(),
                valConf = C(idInp + "-confirmation").val();

            C("#personal_changePassword_button").el.disabled = (valEl === valConf) ? false : true;
        });
    });

    C("#personal-new-pass-confirmation").el.addEventListener("input", (e) => {
        let but = C("#personal_changePassword_button").el;
        const el = e.currentTarget,
            valPass = C("#personal-new-pass").val();

        but.disabled = (valPass === el.value) ? false : true;
    });

    passViewToggle();

    C("#reg-button").el.addEventListener("click", () => {
        if (checkReg()) {
            showPopup("Подтверждение звонком", "Вам позвонят на номер\n" + C("#reg-phone-mask").val(), "На звонок отвечать не требуется, введите последние четыре цифры номера телефона с которого совершён звонок", "Запросить звонок", reg);
        }
    });

    C('a[data-click="openBalanceView"]').el.addEventListener("click", (e) => {
        const el = C('.balance-view').el.classList;

        el.toggle('open');
        e.target.innerHTML = el.contains('open') ? "Скрыть" : "Подробнее...";
    });

    C("#reset_button").el.addEventListener("click", () => {
        if (canGetResetConfirmationCode()) {
            showPopup("Подтверждение звонком", "Ожидайте звонок на номер:\n" + C("#reset-phone-mask").val(), "На звонок отвечать не требуется, введите последние 4-ре цифры номера телефона входящего звонка.", "Запросить звонок", getResetConfirmationCode);
        }
    });

    C("#transactions-details-button").el.addEventListener("click", (e) => {
        const list = C("#transactions").el.classList,
            t = C(e.target);

        list.toggle("hidden");

        if (list.contains("hidden")) {
            t.text("история");
            t.delclass("active");
        } else {
            t.text("скрыть историю");
            t.addclass("active");
        }
    });

    C("#feedback-submit").el.addEventListener("click", () => setFeedback());

    // Выбор города
    C("#store_cities").el.addEventListener("change", (e) => drawStoresInCity(JSON.parse(e.target.options[e.target.selectedIndex].getAttribute("data-stores"))));

    // Навигация
    C(".bottomNav>li, .mainMenu__content_nav>li").els.forEach((el) => {
        el.addEventListener("click", (e) => {
            let section = e.currentTarget.dataset.section;

            closeNav();

            if (section) {
                drawSection(section);
            }
        });
    });

    // Сокрытие всплывающего окна
    C("#popupOverlay").el.addEventListener("click", (e) => {
        const el = e.currentTarget.classList;

        el.remove("animate__fadeIn", "animate__fadeOut", "animated", "animate__furious");
        el.add("animated", "animate__fadeOut", "animate__furious");

        promiseTimeout(() => {
            const cancel = C('#cancelText').el;

            if (cancel) {
                cancel.parentNode.removeChild(cancel);
            }
            hide("#popupOverlay");
            el.remove("animate__fadeIn", "animate__fadeOut", "animated", "animate__furious");
        }, 500);
    });

    renderSections();
    drawSection((bearerToken && C().getStor(LS_SECTION) !== "reg_success") ? 'wallet' : C().getStor(LS_SECTION));

    checkUpdates(() => {
        if (bearerToken) {
            d.body.addEventListener("pointerover", userActivity);
            d.body.addEventListener("pointerdown", userActivity);
        }
    });
});

let startSwipeX = 0;
let stopSwipeX  = 0;
let startSwipeY = 0;
let stopSwipeY  = 0;

function checkSwipeX() {
    const currentSection = C().getStor(LS_SECTION);
    
    if (canSlidePages(currentSection)) {
        const diffX = stopSwipeX - startSwipeX;
        const diffY = Math.abs(stopSwipeY - startSwipeY);

        if (Math.abs(diffX) > 200 && diffY < 100) {
            let nextSection;
            
            if (diffX > 0) {
                nextSection = getPrevSection(currentSection);
            } else {
                nextSection = getNextSection(currentSection);
            }
            
            drawSection(nextSection);
        }
    }
}

function canSlidePages(currentSection) {
    return carouselSections.includes(currentSection);
}

function getNextSection(currentSection) {
    const i = carouselSections.indexOf(currentSection) + 1;
    let count = carouselSections.length;
    
    if (count === i) {
        return carouselSections[0];
    }
    
    return carouselSections[i];
}

function getPrevSection(currentSection) {
    const i = carouselSections.indexOf(currentSection) - 1;
    let count = carouselSections.length - 1;
    
    if (i < 0) {
        return carouselSections[count];
    }
    
    return carouselSections[i];
}

function closeOpenOverlays() {
    const list = [".storeMap", "#overlay-menu", "#feedback", ".qrcodeOverlay", ".positionOverlay", ".newsOverlay", "#popupOverlay", ".topNav__back", "#set_plastic"];
    let disp = (id) => {
        return C(id).el.style.display !== "none";
    };
    let rem = (id) => {
        const el = C(id).el;
        
        if (el) {
            el.parentNode.removeChild(el);
            return true;
        }
        
        return false;
    };
    let isFind = false;
    
    for (let id of list) {
        switch (id) {
            case ".storeMap": {
                isFind = rem(id);
                break;
            }
            
            case ".topNav__back": {
                if (disp(id)) {
                    routePrevSection();
                    isFind = true;
                }
                break;
            }
            
            case ".qrcodeOverlay": {
                document.addEventListener("deviceready", function() {
                    cordova.plugins.brightness.setBrightness(currentBrightness, (suc) => {}, (err) => {});
                });
            }
            
            default: {
                if (disp(id)) {
                    if (id === "#popupOverlay") {
                        rem("#cancelText");
                    }

                    hide(id);
                    isFind = true;
                }
                break;
            }
        }
        
        if (isFind) {
            C("body").delclass("hideOverflow");
            break;
        }
    }
    
    return isFind;
}

function exitApp() {
    navigator.app.exitApp();
}

function closeUpdater() {
    C().setStor("NOW_DATE", new Date().toLocaleDateString());
    hide(C("#alertUpdater").el);
}

function permitRedrawSection(section) {
    let permit = true;
    const needUp = JSON.parse(C().getStor(LS_NEED_UPDATE));

    if (needUp[section] === 0) {
        permit = false;
    }

    needUp[section] = 0;
    C().setStor(LS_NEED_UPDATE, JSON.stringify(needUp));

    return permit;
}

function crashClearStorage() {
    if (!C().getStor('crash')) {
        C().delStor(LS_CURR_UPDATE);
        C().delStor(LS_CONTENTS);
        C().setStor('crash', 1);

        if (C().getStor('crash_clear')) {
            C().delStor('crash_clear');
        }
    }
}

function passViewToggle() {
    C('input + i[class^="icon-eye"]').els.forEach((el) => {
        el.addEventListener("click", (e) => {
            const i = e.currentTarget;
            let inp = i.parentNode.children[0];

            i.classList.remove("icon-eye", "icon-eye-off");

            inp.type = (inp.type === "password" ? "text" : "password");
            if (inp.type === "password") {
                i.classList.add("icon-eye-off");
            } else {
                i.classList.add("icon-eye");
            }
        });
    });
}

function initPopups() {
    C(".popup-text").els.forEach((el) => {
        el.addEventListener("click", () => {
            if (el.classList.contains("show")) {
                el.classList.remove("show");
            }
        });
    });
}

function userActivity() {
    if (!userActivityTimeout) {
        userActivityTimeout = setTimeout(checkUpdates, 3333);
    }
}

function openNav() {
    show("#overlay-menu");
}

function closeNav() {
    hide("#overlay-menu");
}

async function promiseTimeout(fn, ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return fn();
}

function removeChildrens(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function routePrevSection() {
    const section = C().getStor(LS_SECTION);

    if (sections[section] && sections[section].prevSection) {
        drawSection(sections[section].prevSection);
    }
}

function renderSections() {
    if (!isEmpty(C().getStor(LS_CONTENTS))) {
        const contents = JSON.parse(C().getStor(LS_CONTENTS));

        drawPersonal(contents.personal);
        drawWallet(contents.wallet);
    }
}

async function drawSection(section) {
    if (!section) {
        section = "adult";
    }

    if (section === "wallet") {
        C("main.main").addclass("noback");
    } else {
        C("main.main").delclass("noback");
    }

    switch (section) {
        default: {
            break;
        }

        case "pre-registration": {
            await updateCities();
            break;
        }

        case "registration": {
            await updateCities();
            const city = C("#city").el;

            show("#registration_cont");
            hide("#reg_confirmation");

            C("#prem").el.checked = true;
            C("#discount").el.checked = false;

            if (city.options[city.options.selectedIndex].getAttribute("default-discount") === 0) {
                hide("#loyalty-system");
            } else {
                show("#loyalty-system");
            }

            break;
        }

        case "personal": {
            break;
        }

        case "stores": {
            break;
        }

        case "wallet": {
            break;
        }

        case "refer": {
            renderReferSection();
            break;
        }

        case "reg_success": {
            break;
        }

        case "news": {
            break;
        }
        
        case "set_plastic": {
            break;
        }
    }

    C(".main > div").els.forEach((el) => {
        if (el.id === section) {
            if (!el.classList.contains("active")) {
                el.classList.add("active");
            }
            C(".main").el.scrollIntoView();
        } else {
            el.classList.remove("active");
        }
        hideLoader();
    });

    C("header").el.style.display = (sections[section] && sections[section].title ? "" : "none");
    C(".topNav__back").el.style.display = (sections[section] && sections[section].prevSection ? "" : "none");
    C(".topNav__msg").el.style.display = (sections[section] && !sections[section].prevSection ? "" : "none");
    C("header h6").text(sections[section].title);
    C(".topNav__menu").el.style.display = (sections[section] && sections[section].showMenu ? "" : "none");
    //C(".topNav__close").el.style.display = (["alerts"].indexOf(section) === -1 ? "none" : "");
    C(".topNav__close").el.style.display = "none";

    C("footer").el.style.display = (sections[section] && sections[section].showMenu ? "" : "none");

    C(".bottomNav > li").els.forEach((el) => {
        el.classList.remove("current-section");

        if (el.dataset.section === section) {
            el.classList.add("current-section");
        }
    });

    C().setStor(LS_SECTION, section);
}

async function renderReferSection() {
    let response = await getReferLink();
    const referQr = C("#referQr").el;

    if (response.status) {
        const { data } = response;

        if (!referQr.children.length) {
            const qrCanvas = C().create("canvas").el;
            let qr = new QRious({
                element: qrCanvas,
                size: 192,
                value: data.link
            });

            referQr.appendChild(qrCanvas);
            qrCanvas.classList.add("animated", "animate__fadeIn");

            show("#referLink");

            C("#referLinkTG").attr("href", "https://t.me/share/url?url=" + data.link + "&text=Столица: бонусы&utm_source=ref_tg");
            C("#referLinkWA").attr("href", "https://api.whatsapp.com/send?text=Столица: бонусы " + data.link + "&utm_source=ref_wa");
        }

        if (data.referrals && data.referrals.length)
            data.referrals.map((ref_row) => {
                const tr = C().create("tr"),
                    td = C().create("td");

                td.text(ref_row.last_sync);
                tr.append(td);

                td = C().create("td");
                td.text("7-***-***-" + ref_row.phone);
                tr.append(td);

                td = C().create("td");
                td.text((ref_row.gifted ? "Совершена покупка" : "Регистрация по приглашению"));
                tr.append(td);

                td = C().create("td");
                if (ref_row.gifted) {
                    td.style("fontWeight", "bold");
                }
                td.text((ref_row.gifted ? "+" + ref_row.referral_gift : "n/a"));
                td.addclass(ref_row.gifted ? "good" : "bad");
                tr.append(td);

                C("#referrals").append(tr);
            });
    }
}

function confirmAdult() {
    drawSection(C().getStor(LS_SECTION));
}

function showPopup(title, desc, message, buttonText, callback) {
    const pOverlay = C("#popupOverlay"),
        pTitle = C("#popupTitle"),
        pDesc = C("#popupDescription"),
        pMessage = C("#popupMessage"),
        pButton = C("#popupButton");
    let cancelText;

    if (Array.isArray(buttonText)) {
        cancelText = buttonText[1];
        buttonText = buttonText[0];
    }

    if (!buttonText) {
        buttonText = "Ок";
    }

    hideLoader();

    show("#popupOverlay");

    if (title) {
        show("#popupTitle");
        pTitle.text(title);
    } else {
        hide("#popupTitle");
    }

    if (desc) {
        pDesc.html(desc);
        show("#popupDescription");
    } else {
        hide("#popupDescription");
    }

    if (message) {
        pMessage.html(message);
        show("#popupMessage");
    } else {
        hide("#popupMessage");
    }

    if (cancelText) {
        const but = C().create('button');

        but.addclass('button');
        but.text(cancelText);
        but.el.id = "cancelText";
        C('#popupCont').append(but);
    }

    pButton.el.addEventListener("click", () => {
        if (callback) {
            callback();
            callback = null;
        }
    });

    pButton.text(buttonText);
    pOverlay.delclass(["animate__fadeIn", "animate__fadeOut", "animated", "animate__furious"]);
    pOverlay.addclass(["animated", "animate__fadeIn", "animate__furious"]);

}

async function checkAuthorization() {
    return await api("checkAuthorization");
}

async function auth() {
    const authPhoneEl = C("#auth-phone-mask"),
        authPassEl = C("#auth-pass"),
        authPassPop = C("#auth-pass-popup"),
        phone = getPhoneNumbers(C("#auth-phone-mask").val()),
        authButton = C("#auth-button").el;

    if (!phone || phone.length !== 11) {
        showInputPopup("auth-phone-mask");
        return;
    } else {
        authPhoneEl.delclass("fail");
    }

    if (authPassEl.val() === "") {
        authPassEl.el.scrollIntoView();
        authPassEl.togclass("fail");
        authPassEl.el.focus();
        authPassPop.togclass("show");
        return;
    }

    authButton.disabled = true;

    let result = await api("authorization", {
        phone,
        pass: authPassEl.val()
    });

    authButton.disabled = false;

    if (result.status) {
        clearLocalStorage();

        C().setStor(LS_TOKEN, result.data.token);
        C().setStor(LS_SECTION, "wallet");

        location.reload();
    } else {
        showPopup("", result.description);
    }
}

function checkReg() {
    const regPhoneEl = C("#reg-phone-mask"),
        regBdEl = C("#reg-birthdate").el,
        regPassEl = C("#reg-pass"),
        regPassConfEl = C("#reg-pass-confirm"),
        phone = getPhoneNumbers(regPhoneEl.val());

    if (phone.length !== 11) {
        showInputPopup("reg-phone-mask");
        return 0;
    } else {
        regPhoneEl.delclass("fail");
    }

    if (regPassEl.val().length < 6) {
        showInputPopup("reg-pass");
        return 0;
    }

    if (!validateBirthdate(regBdEl, true)) {
        return 0;
    }

    if (regPassEl.val() !== regPassConfEl.val()) {
        showPopup("Внимание", "Введенные пароли не совпадают!");
        return 0;
    }

    return 1;
}

async function reg() {
    let regPhoneEl = C("#reg-phone-mask"),
        regBdEl = C("#reg-birthdate"),
        regButtonEl = C("#reg-button").el,
        phone = getPhoneNumbers(regPhoneEl.val()),
        birthdate;


    if (regBdEl.val()) {
        let td = regBdEl.val().split("-");
        birthdate = [td[2], td[1], td[0]].join("-");
    }

    lastPhone = phone;

    regButtonEl.disabled = true;
    showLoader();

    let result = await api("registration", {
        phone,
        birthdate,
        pass: C("#reg-pass").val(),
        firstname: C("#reg_firstname").val(),
        discount: (C("#discount").el.checked ? 1 : 0),
        email: C("#reg_email").val(),
        city: C("#city").val()
    });

    regButtonEl.disabled = false;
    hideLoader();

    if (result.status) {
        if (result.data && result.data.need_confirmation) {
            let regConfCode = C("#reg-confirmation-code");

            hide("#registration_cont");
            show("#reg_confirmation");
            regConfCode.el.scrollIntoView();
            regConfCode.togclass("fail");
            regConfCode.el.focus();

            // Запускаем таймер отсчета для повторной отправки
            setConfirmationTimeout(result);
        }
    } else {

        if (result.description) {
            promiseTimeout(() => {
                showPopup("", `${result.description}, возможно вам нужно <a href="" onclick="drawSection('reset');return false;">восстановить пароль</a>?`);
            }, 1000);
        }
    }
}

function setConfirmationTimeout(result) {
    let regConfRemindEl = C("#reg_confirmation_remind"),
        regConfCodePopupEl = C("#reg-confirmation-code-popup"),
        regConfInfoEl = C("#reg_confirmation_info");

    hide("#confirmation_button_reset");
    secondsLeft = result.data.seconds_left;
    regConfCodePopupEl.text(result.description);
    regConfInfoEl.text(result.description);
    regConfRemindEl.text("Повторная отправка будет доступна через " + secondsLeft + " сек.");

    if (secondsInterval) {
        clearInterval(secondsInterval);
    }

    secondsInterval = setInterval(() => {
        secondsLeft--;
        regConfRemindEl.text("Повторная отправка будет доступна через " + secondsLeft + " сек.");
        if (secondsLeft <= 0) {
            clearInterval(secondsInterval);
            regConfRemindEl.text("");
            show("#confirmation_button_reset");
        }
    }, 1000);
}

async function confirmation() {
    let regConfCodeEl = C("#reg-confirmation-code"),
        regConfCodePopupEl = C("#reg-confirmation-code-popup"),
        confButtonEl = C("#confirmation_button");

    if (regConfCodeEl.val().length < 4) {
        regConfCodeEl.el.scrollIntoView();
        regConfCodeEl.addclass("fail");
        regConfCodeEl.el.focus();
        regConfCodePopupEl.togclass("show");
        return;
    }

    if (lastPhone && regConfCodeEl.val()) {
        confButtonEl.el.disabled = true;
        showLoader();

        let result = await api("confirmation", {
            phone: lastPhone,
            code: regConfCodeEl.val()
        });

        confButtonEl.el.disabled = false;
        hideLoader();

        if (result.status) {
            clearLocalStorage();

            C().setStor(LS_SECTION, "reg_success");
            C().setStor(LS_TOKEN, result.data.token);

            location.reload();
            // if (result.data.setNewPassword == undefined) {
            //   drawSection("reg_success");
            // } else {
            //   drawSection("intro");
            // }
        } else {
            if (result.description) {
                regConfCodeEl.val("");
                showPopup("Внимание", result.description);
            }
        }
    }
}

async function confirmationReset() {
    let confButtonReset = C("#confirmation_button_reset").el;
    if (lastPhone) {
        confButtonReset.disabled = true;

        let result = await api("confirmationReset", {
            phone: lastPhone
        });

        confButtonReset.disabled = false;

        if (result.status) {
            setConfirmationTimeout(result);
        }
    }
}

function canGetResetConfirmationCode() {
    let resetPhoneEl = C("#reset-phone-mask"),
        resetPhonePopEl = C("#reset-phone-popup");

    if (resetPhoneEl.val().length < 16) {
        resetPhoneEl.el.scrollIntoView();
        resetPhoneEl.addclass("fail");
        resetPhoneEl.el.focus();
        resetPhonePopEl.togclass("show");
        return 0;
    }

    return 1;
}

async function getResetConfirmationCode() {
    let resPhoneEl = C("#reset-phone-mask"),
        resButtonEl = C("#reset_button").el,
        resConfInfoEl = C("#reset_confirmation_info");

    if (resPhoneEl.val()) {
        resButtonEl.disabled = true;

        let result = await api("getResetConfirmationCode", {
            phone: resPhoneEl.val()
        });

        if (result.status) {
            show("#reset_confirmation");
            resConfInfoEl.text(result.description);
            if (result.data.seconds_left) {
                restartResetConfirmationTimer(result.data.seconds_left);
            }
        } else {
            resButtonEl.disabled = false;
            promiseTimeout(() => {
                showPopup("Внимание", result.description);
            }, 1000);
        }
    }
}

function restartResetConfirmationTimer(seconds) {
    let resConfTimeEl = C("#reset_confirmation_time");

    resetCodeTimerValue = seconds - 1;

    show("#reset_confirmation_time");
    resConfTimeEl.text(resetCodeTimerValue + " сек.");

    if (resetCodeTimer) {
        clearInterval(resetCodeTimer);
    }

    resetCodeTimer = setInterval(() => {
        show("#reset_confirmation_time");
        resConfTimeEl.text(resetCodeTimerValue + " сек.");
        resetCodeTimerValue--;

        if (!resetCodeTimerValue) {
            C("#reset_button").el.disabled = false;
            hide("#reset_confirmation_time");
            if (resetCodeTimer)
                clearInterval(resetCodeTimer);
        }
    }, 1000);
}

async function checkResetConfirmationCode() {
    let resPhoneEl = C("#reset-phone"),
        resConfCodeEl = C("#reset_confirmation_code"),
        resPhonePopEl = C("#reset-phone-popup"),
        resConfButEl = C("#reset_confirmation_button");

    if (resPhoneEl.val().length < 16) {
        resPhoneEl.el.scrollIntoView();
        resPhoneEl.addclass("fail");
        resPhoneEl.el.focus();
        resPhonePopEl.togclass("show");
        return;
    }

    if (resConfCodeEl.val().length < 4) {
        resConfCodeEl.el.scrollIntoView();
        resConfCodeEl.addclass("fail");
        resConfCodeEl.el.focus();
        return;
    }

    resConfButEl.el.disabled = true;

    let result = await api("checkResetConfirmationCode", {
        phone: resPhoneEl.val(),
        code: resConfCodeEl.val()
    });

    resConfButEl.el.disabled = false;

    if (result.status) {
        C().setStor(LS_SECTION, "wallet");
        C().setStor(LS_TOKEN, result.data.token);

        location.reload();
    } else {
        showPopup("Внимание", result.description, null, null, () => {
            resConfCodeEl.val("");
            resConfCodeEl.el.focus();
            C("#reset_confirmation_button").el.disabled = true;
        });
    }
}

async function getReferLink() {
    return await api("getReferLink");
}

async function getResetConfirmationSms() {
    const resPhoneEl = C("#reset-phone-mask"),
        resButtonEl = C("#reset_button").el,
        resConfInfoEl = C("#reset_confirmation_info");

    if (resPhoneEl.val()) {
        resButtonEl.disabled = true;

        let result = await api("getResetConfirmationSms", {
            "phone": resPhoneEl.val()
        });

        if (result.status) {
            show("#reset_confirmation");
            resConfInfoEl.text(result.description);
            if (result.data.seconds_left)
                restartResetConfirmationTimer(result.data.seconds_left);
        } else {
            resButtonEl.disabled = false;
            promiseTimeout(() => {
                showPopup("Внимание", result.description);
            }, 1000);
        }
    }
}

function attentionFocus(el) {
    el.scrollIntoView();
    el.classList.add("fail");
    el.focus();
    C("#" + el.id + "-popup").togclass("show");
}

async function logOff() {
    showLoader();

    let result = await api("logOff");

    if (result.status) {
        clearLocalStorage();
        location.reload();
    }

    return result;
}

async function updateCities() {
    const city = C("#city");

    if (city.el.children.length > 2) {
        return;
    }

    let result = await api("getCities");

    if (result.status) {
        removeLoadOption("#city");

        result.data.map((el) => {
            let option = C().create("option");

            option.val(el.id);
            option.text(el.title);
            option.attr("default-discount", el.default_discount);

            if (el.status === 2) {
                option.el.selected = "selected";
            }

            city.append(option);
        });
    }
}

function clearLocalStorage() {
    localStorage.clear();
}

function showRequestSms() {
    showPopup("Вам не позвонили?",
        "",
        "Попробуйте получить код подтверждения с помощью СМС<br><br>Если это вам не помогло, обратитесь в <a href=\"#\" onClick=\"showFeedback()\">службу поддержки</a>",
        ["Отправить код", "Попробую позже"],
        getResetConfirmationSms);
}

function showTerms() {
    show("#terms");
    C("body").addclass("hideOverflow");
    C("#terms").el.getElementsByTagName("iframe")[0].src = TERMS_URL;
}

function showRules() {
    show("#terms");
    C("body").addclass("hideOverflow");
    C("#terms").el.getElementsByTagName("iframe")[0].src = RULES_URL;
}

function showRefRules() {
    show("#terms");
    C("body").addclass("hideOverflow");
    C("#terms").el.getElementsByTagName("iframe")[0].src = REF_RULES_URL;
}

function closeTerms() {
    hide("#terms");
    C("body").delclass("hideOverflow");
    C("#terms").el.getElementsByTagName("iframe")[0].src = "";
}

function showIndicator() {
    show("#top-nav-indicator");
}

function hideIndicator() {
    hide("#top-nav-indicator");
}

function showFeedback() {
    show("#feedback");
    d.body.classList.add("hideOverflow");
}

function hideFeedback() {
    hide("#feedback");
    d.body.classList.remove("hideOverflow");
}

function showInputPopup(id) {
    const et = C("#" + id);

    et.el.scrollIntoView();
    et.addclass("fail");
    et.el.focus();

    C("#" + id + "-popup").addclass("show");
}

async function setFeedback() {
    const phone = getPhoneNumbers(C("#feedback-phone-mask").val()),
        message = C("#feedback-message").val(),
        submitBut = C("#feedback-submit").el;

    if (phone.length !== 11) {
        showInputPopup("feedback-phone-mask");
        return;
    }

    if (message.length < 3) {
        showInputPopup("feedback-message");
        return;
    }

    submitBut.disabled = true;
    showLoader();

    let result = await api("setFeedback", {
        phone,
        name: C("#feedback-name").val(),
        email: C("#feedback-email").val(),
        reason: C("#feedback-reason").val(),
        message: C("#feedback-message").val() + " (Источник: " + clientInfo + ")"
    });

    if (result.status) {
        showPopup("Готово", "Ваше сообщение передано оператору");
        hideFeedback();
        C("#feedback-message").val("");
    } else {
        onErrorCatch(result);
    }

    submitBut.disabled = false;
    hideLoader();
}

function onErrorCatch(error) {
    showPopup("Внимание", error.description);
    console.warn(error);
}

function setNeedUpdate(contents, result, section) {
    const needUp = JSON.parse(C().getStor(LS_NEED_UPDATE));

    if (contents[section] !== result.data[section]) {
        needUp[section] = 1;
    }

    C().setStor(LS_NEED_UPDATE, JSON.stringify(needUp));
}

async function checkUpdates(callback) {
    if (!bearerToken && callback) callback();

    if (!bearerToken) return;

    const result = await getUpdates();
    const { data, status } = result;

    if (viewNewApp && SOURCE) {
        fetch(VERSION_URL + "?platform=" + PLATFORM).then(r => r.text()).then(t => {
            if (Number(t) > Number(SOURCE)) {
                showPopup("Внимание", "Вышла новая версия, пожалуйста, обновите приложение!");
            }
            viewNewApp = null;
        });
    }
    
    const curSection = C().getStor(LS_SECTION),
          updates = !isEmpty(C().getStor(LS_CURR_UPDATE)) ? JSON.parse(C().getStor(LS_CURR_UPDATE)) : tempUpdate;
    let contents = !isEmpty(C().getStor(LS_CONTENTS)) ? JSON.parse(C().getStor(LS_CONTENTS)) : { "personal": "", "wallet": "" };

    if (status) {
        if (data.news.length) {
            updates.newsHash = data.newsHash;
            drawNews(data.news);
        }
        
        if (data.storesHash) {
            updates.storesHash = data.storesHash;
            drawStores(data.stores);
        }
        
        if (data.personalHash) {
            setNeedUpdate(contents, result, 'personal');
            contents.personal = data.personal;
            updates.personalHash = data.personalHash;

            let userName = data.personal.firstname + " " + data.personal.middlename;
            C("#feedback-name").val((userName ? userName : ""));
        }
        
        if (data.walletHash) {
            setNeedUpdate(contents, result, 'wallet');
            contents.wallet = data.wallet;
            updates.walletHash = data.walletHash;
        }
        
        if (data.lastPurchase) {
            updates.lastPurchase = data.lastPurchase;
            drawPurchases(data.purchases, data.transactions);
        }

        if (data.transactions.length) {
            updates.lastTransaction = data.transactions[data.transactions.length - 1].date;
            if (!data.lastPurchase) {
                drawPurchases([], data.transactions);
            }
        }

        // Всех авторизованных отправляем на страницу кошелька
        if (sections[curSection] && !sections[curSection].needAuth) {
            C().setStor(LS_SECTION, "wallet");
        }

        C().setStor(LS_CURR_UPDATE, JSON.stringify(updates));
        C().setStor(LS_CONTENTS, JSON.stringify(contents));
        
        renderSections();
    } else {
        // Не авторизованных отправляем на авторизацию
        if (sections[curSection] && sections[curSection].needAuth) {
            logOff();
        }
    }

    if (bearerToken) {
        if (callback) {
            callback();
        }

        //await api("updateWalletData");
        userActivityTimeout = null;
    }
}

async function getUpdates() {
    let data = !isEmpty(C().getStor(LS_CURR_UPDATE)) ? JSON.parse(C().getStor(LS_CURR_UPDATE)) : tempUpdate;
    const contents = !isEmpty(C().getStor(LS_CONTENTS)) ? JSON.parse(C().getStor(LS_CONTENTS)) : { "personal": "", "wallet": "" };

    if (contents.personal === "") {
        data = tempUpdate;
    }
    
    if (initApp) {
        data.newsHash = "";
        data.storesHash = "";
        data.lastPurchase = "";
        data.lastTransaction = "";
        initApp = false;
    }
    
    data.pushId = C().getStor(LS_PUSHID);
    
    if (clientDevice) {
        data.clientDevice = clientDevice;
    }
    
    return await api("getUpdates", data);
}

