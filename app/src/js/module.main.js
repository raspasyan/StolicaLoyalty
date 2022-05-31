/* global Notification, fetch, ymaps, Document, Window, attachEvent, DOMAIN, SOURCE, PLATFORM */

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
    viewNewApp = 1;

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
    }
};

let currentSection = "",
    bearerToken = "",
    userActivityTimeout = null,
    initApp = true,
    clientInfo = "Сайт",
    tempUpdate = {
        personalHash: "",
        walletHash: "",
        storesHash: "",
        lastNews: "",
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
        window.pushNotification.registration(
            (token) => {
                C().setStor(LS_PUSHID, token);
                //console.log(token);
            },
            (error) => {
                //console.log(error);
            }
        );

        switch (device.platform) {
            case "Android":
                clientInfo = "Android v" + SOURCE;
                break;
            case "iOS":
                clientInfo = "iOS v" + SOURCE;
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

    // Переход на пластиковую карту
    C("#personal_changeCard_button").el.addEventListener("click", () => changeCard());

    C("#personal_changePassword_button").el.addEventListener("click", () => changeProfileData());

    // Привязка пластиковой карты
    C("#set_card").el.addEventListener("click", () => setCard());

    // Вход без пароля
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

function closeOpenOverlays() {
    const list = [".storeMap", "#overlay-menu", "#feedback", ".positionOverlay", ".newsOverlay", "#popupOverlay", ".topNav__back"];
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

async function api(method, data = "") {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": method,
            "data": data,
            "source": SOURCE
        })
    });
    return await response.json();
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

function hide(selector) {
    C(selector).el.style.display = "none";
}

function show(selector) {
    C(selector).el.style.display = "";
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

function removeLoadOption(id) {
    const b = C("option:disabled, div.temporary", C(id));

    if (!b.el) {
        return;
    }

    b.els.forEach((el) => el.parentNode.removeChild(el));
}

function modifyInput(el) {
    if (el.value.length === 1 && +el.value[0] === 8) {
        el.value = "+7-";
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

function showLoader() {
    C("#loader").style("opacity", 1);
    show("#loader");
}

function hideLoader() {
    const loader = C("#loader");

    loader.addclass(["animate__fadeOut", "animated"]);
    promiseTimeout(() => {
        hide("#loader");
        loader.delclass(["animate__fadeOut", "animated"]);
    }, 500);
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

function dropFail(el) {
    C(el).delclass("fail");
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

function isEmpty(obj) {
    if (!obj || obj === "undefined") {
        return true;
    }

    return Object.keys(JSON.parse(obj)).length === 0;
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

    // if (viewNewApp && SOURCE && SOURCE.replace("APP_", "") < data.versionApp.replace("APP_", "")) {
    //     showPopup("Внимание", "Вышла новая версия, пожалуйста, обновите приложение!");
    //     viewNewApp = null;
    // }

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
            updates.lastNews = data.news.reduce((newLastId, element) => (element.id > newLastId ? element.id : updates.lastNews), updates.lastNews);
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

        await api("updateWalletData");
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
        data.lastNews = 0;
        data.storesHash = "";
        data.lastPurchase = "";
        data.lastTransaction = "";
        initApp = false;
    }
    
    data.pushId = C().getStor(LS_PUSHID);
    
    return await api("getUpdates", data);
}

function mask(inp) {
    let underlay = document.createElement('input'),
        attr = {};

    attr.id = inp.id.replace("-mask", "");
    attr.disabled = "disabled";
    attr.type = inp.getAttribute("type");

    for (let key in attr) {
        underlay.setAttribute(key, attr[key]);
    }

    inp.parentNode.insertBefore(underlay, inp);
    setPhoneMask(inp, false);
    inp.addEventListener("click", () => { inp.selectionStart = inp.value.length; });
    inp.addEventListener("input", (e) => setPhoneMask(e.target));
}

function setPhoneMask(inp, mask) {
    const hideId = "#" + inp.id.replace("-mask", "");
    let phone = inp.value;

    if (phone === "") {
        phone = "7";
    }
    if (!mask) {
        mask = "+_(___)___-__-__";
    }

    phone = getPhoneNumbers(phone);

    C(inp).val(getValueByMask(phone, mask));
    C(hideId).val(getValueByMask(phone, mask, true));
}

function getPhoneNumbers(value) {
    let phone = value.replace(/\D/g, "");

    if (phone) {
        phone = phone.replace(/^([^7])/, "7$1").replace(/^(\d{11})(.+)/, "$1");
    } else {
        phone = "7";
    }

    return phone;
}

function getValueByMask(value, mask, full) {
    const phone = value.match(/\d/g);
    let newPhone = mask;

    phone.map((e) => newPhone = newPhone.replace(/_/, e));

    if (!full) {
        newPhone = newPhone.replace(/\)_|-_|_/g, "");
    }

    return newPhone;
}

function validateBirthdate(el, isSubmit) {
    if (!isSubmit) {
        isSubmit = false;
    }

    el.value = el.value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1-$2").replace(/-(\d{2})(\d)/, "-$1-$2").replace(/(\d{4})\d+/, "$1");

    if (el.value.length > 9) {
        let td = el.value.split("-"),
            bd = new Date(td[2], --td[1], td[0]),
            cd = new Date(),
            age = (cd - bd);

        if (age < 568036800000 || age > 3155760000000 || bd == "Invalid Date") {
            showInputPopup("reg-birthdate");
        } else {
            return true;
        }
    } else if (isSubmit) {
        showInputPopup("reg-birthdate");
    }

    return false;
}

const C = function (s, p) {
    this.isC = true,
        this.isNodeList = (nodes) => {
            const stringRepr = Object.prototype.toString.call(nodes);

            return typeof nodes === 'object' &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) &&
                (typeof nodes.length === 'number') &&
                (nodes.length === 0 || (typeof nodes[0] === "object" && nodes[0].nodeType > 0));
        },
        this.isNode = (obj) => {
            if (obj && obj.nodeType) {
                return true;
            } else {
                return false;
            }
        },
        this.isDocument = (obj) => {
            return obj instanceof Document || obj instanceof Window;
        },
        this.isclass = (cl) => {
            return this.els[0].classList.contains(cl);
        },
        this.defineEls = () => {
            if (this.isNode(s) || this.isDocument(s)) {
                return [s];
            } else if (this.isNodeList(s)) {
                return s;
            } else {
                if (p && p.isC) {
                    p = p.els[0];
                }

                return this.isNode(p) ? p.querySelectorAll(s) : d.querySelectorAll(s);
            }
        },
        this.defineEl = () => {
            return this.els[0];
        },
        this.els = this.defineEls(),
        this.el = this.defineEl(),
        this.on = (type, s, fn, except) => {
            const p = this;
            let i;

            this.bind(type, (e) => {
                const el = (p.isNode(s) || p.isNodeList(s)) ? s : C(s).els,
                    ex = except || false;
                let t = e.target;

                while (t && t !== this) {
                    if (ex) {
                        for (i = 0; i < C(ex).els.length; i++) {
                            if (t === C(ex).els[i]) {
                                break;
                            }
                        }
                    }

                    for (i = 0; i < el.length; i++) {
                        if (t === el[i]) {
                            fn(e, t);
                            break;
                        }
                    }

                    if (t) {
                        t = t.parentNode;
                    } else {
                        break;
                    }
                }
            });

            return this;
        },
        this.strToNode = (h) => {
            let terk;

            if (!this.isNode(h)) {
                const div = this.create('div');

                div.html(h);
                terk = [div.el.children[0]];
            } else {
                terk = [h];
            }

            this.els = terk;
            this.el = terk[0];

            return this;
        },
        this.attr = (attr, value) => {
            if (!value) {
                return this.el.getAttribute(attr);
            }

            this.els.forEach((el) => {
                el.setAttribute(attr, value);
            });

            return this;
        },
        this.create = (tag) => {
            const el = d.createElement(tag);
            this.els = [el];
            this.el = el;

            return this;
        },
        this.append = (el) => {
            this.el.append(el.el);
        },
        this.style = (st, val) => {
            this.els.forEach((el) => {
                el.style[st] = val;
            });

            return this;
        },
        this.addclass = (cls) => {
            if (!Array.isArray(cls)) {
                cls = [cls];
            }

            this.els.forEach((el) => {
                cls.forEach((cl) => {
                    el.classList.add(cl);
                });
            });

            return this;
        },
        this.togclass = (cl) => {
            this.els.forEach((el) => {
                el.classList.toggle(cl);
            });

            return this;
        },
        this.delclass = (cls) => {
            if (!Array.isArray(cls)) {
                cls = [cls];
            }

            this.els.forEach((el) => {
                cls.forEach((cl) => {
                    el.classList.remove(cl);
                });
            });

            return this;
        },
        this.delStor = (key) => {
            localStorage.removeItem(key);
            return this;
        },
        this.setStor = (key, val) => {
            localStorage.setItem(key, val);
            return this;
        },
        this.getStor = (key) => {
            return localStorage.getItem(key);
        },
        this.bind = (type, fn) => {
            let addEvent;

            if (!type || !fn) {
                return this;
            }

            if (typeof addEventListener === "function") {
                addEvent = (el, type, fn) => {
                    el.addEventListener(type, fn, false);
                };
            } else if (typeof attachEvent === "function") {
                addEvent = (el, type, fn) => {
                    el.attachEvent("on" + type, fn);
                };
            } else {
                return this;
            }

            if (this.isNodeList(this.els) || this.els.length > 0) {
                this.els.forEach((el) => {
                    addEvent(el, type, fn);
                });
            } else if (this.isNode(this.els[0]) || this.isDocument(this.els[0])) {
                addEvent(this.els[0], type, fn);
            }

            return this;
        },
        this.html = (html) => {
            if (html !== "" && !html) {
                return this.els[0].innerHTML;
            }

            this.els.forEach((el) => {
                el.innerHTML = html;
            });

            return this;
        },
        this.text = (text) => {
            if (text !== "" && !text) {
                return this.els[0].innerText;
            }

            this.els.forEach((el) => {
                el.innerText = text;
            });

            return this;
        },
        this.val = (value) => {
            if (value !== "" && !value) {
                return this.els[0].value;
            }

            this.els.forEach((el) => {
                el.value = value;
            });

            return this;
        };

    if (this instanceof C) {
        return this.C;
    } else {
        return new C(s, p);
    }

};