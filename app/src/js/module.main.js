/* global Notification, fetch, ymaps, Document, Window, attachEvent */

const cardImageW = 512,
      cardImageH = 328,
      cardImageSRC = "app/assets/backs/card_back.jpg";
// const DOMAIN = "https://bonus.stolica-dv.ru";
const API_URL = DOMAIN + "/api";
const TERMS_URL = DOMAIN + "/politika-konfidentsialnosti";
const RULES_URL = DOMAIN + "/pravila";
const REF_RULES_URL = DOMAIN + "/pravila-akcii";
const LS_TOKEN = "LS_BearerToken";
const LS_CURR_UPDATE = "LS_CurrentUpdate";
const LS_CONTENTS = "LS_Contents";
const LS_NEED_UPDATE = "LS_NeedUpdate";
const LS_SECTION = "section";

let lastPhone = "",
    secondsInterval = null,
    secondsLeft = 0,
    d = document,
    resetCodeTimer = null,
    resetCodeTimerValue = 0,
    viewNewApp = 1;

let sections = {
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
    tempUpdate = {
        "personalHash": "",
        "walletHash": "",
        "storesHash": "",
        "lastNews": "",
        "lastPurchase": "",
        "lastTransaction": ""
    };

// Инициализация св-в приложения
d.addEventListener("DOMContentLoaded", function () {
    /*
     if ('serviceWorker' in navigator) {
     window.addEventListener('load', function () {
     navigator.serviceWorker.register('/sw.js').then(function (registration) {
     console.log('ServiceWorker registration successful with scope: ', registration.scope);
     }, function (err) {
     console.log('ServiceWorker registration failed: ', err);
     });
     });
     } else {
     console.log('ServiceWorker do not work');
     }
     
     function notifyMe() {
     var notification = new Notification("Все еще работаешь?", {
     tag: "ache-mail",
     body: "Пора сделать паузу и отдохнуть"
     //icon : "https://itproger.com/img/notify.png"
     });
     }
     
     function notifySet() {
     if (!("Notification" in window)) {
     console.log("Ваш браузер не поддерживает уведомления.");
     } else if (Notification.permission === "granted") {
     //setTimeout(notifyMe, 2000);
     } else if (Notification.permission !== "denied") {
     Notification.requestPermission(function (permission) {
     if (!('permission' in Notification)) {
     Notification.permission = permission;
     }
     if (permission === "granted") {
     //setTimeout(notifyMe, 2000);
     }
     });
     }
     }
     notifySet();
     */
    
    crashClearStorage();
    initPopups();

    bearerToken = C().getStor(LS_TOKEN);
    
    C().setStor(LS_NEED_UPDATE, JSON.stringify({
            "news": 1,
            "personal": 1,
            "stores": 1,
            "wallet": 1,
            "purchases": 1
        }));
    
    // Применим маску ко всем полям ввода номера телефона
    C('input[id*="-mask"]').els.forEach(inp => {
        mask(inp);
        inp.addEventListener("input", e => {
            let phone = e.currentTarget.value;
            C('input[id*="-phone-mask"]').els.forEach(phn => {
                phn.value = phone;
                setPhoneMask(phn);
            });
            C("#reset_button").el.disabled = (phone.length === 16 ? false : true);
        });
    });

    // Подключаем обработчики для Popup
    C('span[id*="-popup"]').els.forEach(pop => {
        let inp = C("#" + pop.id.replace("-popup", "")).el;

        ["blur", "input"].forEach(evt => {
            inp.addEventListener(evt, e => {
                dropFail(e.target);
                C("#" + e.target.id + "-popup").delclass("show");
            });
        })
    });

    C("#auth-button").el.addEventListener("click", () => auth());

    C(".system_tabsHead > span label").els.forEach(label => {
        label.addEventListener("click", function (e) {
            let el = e.currentTarget.parentNode,
                    elCs = el.parentNode.parentNode.children[1].children,
                    tabHeads = el.parentNode.children;

            for (var i = 0; i < tabHeads.length; i++) {
                tabHeads[i].classList.remove("tab_h_active");
            }
            for (var i = 0; i < elCs.length; i++) {
                elCs[i].classList.remove("tab_c_active");
            }

            el.classList.add("tab_h_active");
            elCs[el.dataset.tab].classList.add("tab_c_active");
        });
    });

    C("#reg-birthdate").el.addEventListener("input", e => validateBirthdate(e.target));

    // Переход на пластиковую карту
    C("#personal_changeCard_button").el.addEventListener("click", () => changeCard());

    C("#personal_changePassword_button").el.addEventListener("click", () => changeProfileData());

    // Привязка пластиковой карты
    C("#set_card").el.addEventListener("click", () => setCard());

    // Вход без пароля
    C("#reset_confirmation_code").el.addEventListener("input", e => {
        C("#reset_confirmation_button").el.disabled = (e.target.value.length === 4 ? false : true);
    });

    C("#reg-confirmation-code").el.addEventListener("input", e => {
        C("#confirmation_button").el.disabled = (e.target.value.length === 4 ? false : true);
    });

    C("#reset-phone-mask").el.addEventListener("input", e => {
        C("#reset_button").el.disabled = (e.target.value.length === 16 ? false : true);
    });

    d.querySelectorAll("#personal-new-pass-confirmation, #personal-new-pass").forEach(() => {
        addEventListener("input", () => {
            let but = C("#personal_changePassword_button").el;

            if (C("#personal-new-pass").val() === C("#personal-new-pass-confirmation").val()) {
                but.disabled = false;
            } else {
                but.disabled = true;
            }
        });
    });

    C("#personal-new-pass-confirmation").el.addEventListener("input", e => {
        let but = C("#personal_changePassword_button").el,
                el = e.currentTarget;

        if (C("#" + el.id.replace("-confirmation", "")).val() === el.value) {
            but.disabled = false;
        } else {
            but.disabled = true;
        }
    });

    passViewToggle();

    C("#reg-button").el.addEventListener("click", () => {
        if (checkReg()) {
            showPopup("Подтверждение звонком", "Вам позвонят на номер\n" + C("#reg-phone-mask").val(), "На звонок отвечать не требуется, введите последние четыре цифры номера телефона с которого совершён звонок", "Запросить звонок", reg);
        }
    });

    C('a[data-click="openBalanceView"]').el.addEventListener("click", e => {
        let el = C('.balance-view').el.classList;
        el.toggle('open');
        e.target.innerHTML = el.contains('open') ? "Скрыть" : "Подробнее...";
    });

    C("#reset_button").el.addEventListener("click", () => {
        if (canGetResetConfirmationCode()) {
            showPopup("Подтверждение звонком", "Ожидайте звонок на номер:\n" + C("#reset-phone-mask").val(), "На звонок отвечать не требуется, введите последние 4-ре цифры номера телефона входящего звонка.", "Запросить звонок", getResetConfirmationCode);
        }
    });

    C("#transactions-details-button").el.addEventListener("click", e => {
        let list = C("#transactions").el.classList,
                t = C(e.target);

        list.toggle("hidden");

        if (list.contains("hidden")) {
            t.text("открыть детализацию");
            t.delclass("active");
        } else {
            t.text("скрыть детализацию");
            t.addclass("active");
        }
    });

    C("#feedback-submit").el.addEventListener("click", function () {
        setFeedback();
    });

    // Выбор города
    C("#store_cities").el.addEventListener("change", e => {
        drawStoresInCity(JSON.parse(e.target.options[e.target.selectedIndex].getAttribute("data-stores")));
    });

    // Навигация
    let els = C(".bottomNav>li, .mainMenu__content_nav>li").els;
    els.forEach(el => {
        el.addEventListener("click", e => {
            let section = e.currentTarget.dataset.section;

            closeNav();

            if (section) {
                drawSection(section);
            }
        });
    });

    // Сокрытие всплывающего окна
    C("#popupOverlay").el.addEventListener("click", function (e) {
        var el = e.currentTarget.classList;

        el.remove("animate__fadeIn", "animate__fadeOut", "animate__animated", "animate__furious");
        el.add("animate__animated", "animate__fadeOut", "animate__furious");
        if (e.currentTarget.callback) {
            e.currentTarget.callback();
            e.currentTarget.callback = null;
        }
        promiseTimeout(function () {
            hide("#popupOverlay");
            el.remove("animate__fadeIn", "animate__fadeOut", "animate__animated", "animate__furious");
        }, 500);
    });
    
    renderSections();
    drawSection((bearerToken) ? 'wallet' : C().getStor(LS_SECTION));
    
    checkUpdates(() => {
        if (bearerToken) {
            d.body.addEventListener("pointerover", userActivity);
            d.body.addEventListener("pointerdown", userActivity);
        }
    });
});

function permitRedrawSection(section) {
    let permit = true,
        needUp = JSON.parse(C().getStor(LS_NEED_UPDATE));
    
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
    C('input + i[class^="icon-eye"]').els.forEach(el => {
        el.addEventListener("click", e => {
            let i = e.currentTarget,
                inp = i.parentNode.children[0];

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
    let popups = C(".popup-text").els;

    popups.forEach(el => {
        el.addEventListener("click", function (e) {
            if (el.classList.contains("show"))
                el.classList.remove("show");
        });
    });
}

function userActivity() {
    if (!userActivityTimeout) {
        userActivityTimeout = setTimeout(checkUpdates, 3333);
    }
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
    await new Promise(resolve => setTimeout(resolve, ms));
    return fn();
}

function removeChildrens(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function routePrevSection() {
    let section = C().getStor(LS_SECTION);

    if (sections[section] && sections[section].prevSection) {
        drawSection(sections[section].prevSection);
    }
}

function renderSections() {
    if (!isEmpty(C().getStor(LS_CONTENTS))) {
        let contents = JSON.parse(C().getStor(LS_CONTENTS));
        
        drawPersonal(contents.personal);
        drawWallet(contents.wallet);
    }
}

function drawSection(section) {
    if (!section) {
        section = "adult";
    }

    switch (section) {
        default:
        {
            break;
        }

        case "pre-registration":
        {
            updateCities();
            break;
        }

        case "registration":
        {
            updateCities().then(result => {
                let city = C("#city").el;

                show("#registration_cont");
                hide("#reg_confirmation");

                C("#prem").el.checked = true;
                C("#discount").el.checked = false;
                if (city.options[city.options.selectedIndex].getAttribute("default-discount") === 0) {
                    hide("#loyalty-system");
                } else {
                    show("#loyalty-system");
                }
            });
            break;
        }

        case "personal":
        {
            break;
        }

        case "stores":
        {
            break;
        }

        case "wallet":
        {
            break;
        }

        case "refer":
        {
            renderReferSection();
            break;
        }

        case "reg_success":
        {
            break;
        }

        case "news":
        {
            break;
        }
    }

    let sectionEls = C(".main > div").els;
    sectionEls.forEach(function (el) {
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

    let bottomNav = C("footer").el;

    bottomNav.style.display = (sections[section] && sections[section].showMenu ? "" : "none");

    let bottomNavEls = C(".bottomNav > li").els;
    bottomNavEls.forEach(el => {
        el.classList.remove("current-section");

        if (el.dataset.section === section) {
            el.classList.add("current-section");
        }
    });

    C().setStor(LS_SECTION, section);
}

function renderReferSection() {
    getReferLink().then((response) => {
        let referQr = C("#referQr").el;
        if (response.status) {
            if (!referQr.children.length) {
                let qrCanvas = C().create("canvas").el,
                        qr = new QRious({
                            element: qrCanvas,
                            size: 192,
                            value: response.data.link
                        });

                referQr.appendChild(qrCanvas);
                qrCanvas.classList.add("animate__animated", "animate__fadeIn");

                show("#referLink");

                C("#referLinkTG").attr("href", "https://t.me/share/url?url=" + response.data.link + "&text=Столица: бонусы&utm_source=ref_tg");
                C("#referLinkWA").attr("href", "https://api.whatsapp.com/send?text=Столица: бонусы " + response.data.link + "&utm_source=ref_wa");
            }

            if (response.data.referrals && response.data.referrals.length)
                response.data.referrals.forEach((ref_row) => {
                    let tr = C().create("tr"),
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
    });
}

function confirmAdult() {
    drawSection(C().getStor(LS_SECTION));
}

function showPopup(title, desc, message, buttonText, callback) {
    let popupOverlay = C("#popupOverlay"),
        popupTitle = C("#popupTitle"),
        popupDesc = C("#popupDescription"),
        popupMessage = C("#popupMessage"),
        popupButton = C("#popupButton");

    if (!buttonText) {
        buttonText = "Ок";
    }

    if (!callback) {
        callback = null;
    } else {
        popupOverlay.el.callback = callback;
    }

    hideLoader();

    show("#popupOverlay");

    if (title) {
        show("#popupTitle");
        popupTitle.text(title);
    } else {
        hide("#popupTitle");
    }

    if (desc) {
        popupDesc.text(desc);
        show("#popupDescription");
    } else {
        hide("#popupDescription");
    }

    if (message) {
        popupMessage.text(message);
        show("#popupMessage");
    } else {
        hide("#popupMessage");
    }

    popupButton.text(buttonText);
    popupOverlay.delclass(["animate__fadeIn", "animate__fadeOut", "animate__animated", "animate__furious"]);
    popupOverlay.addclass(["animate__animated", "animate__fadeIn", "animate__furious"]);

}

function showLoader() {
    let loader = C("#loader");

    loader.style("opacity", 1);
    show("#loader");
}

function hideLoader() {
    let loader = C("#loader");

    loader.addclass(["animate__fadeOut", "animate__animated"]);
    promiseTimeout(function () {
        hide("#loader");
        loader.delclass(["animate__fadeOut", "animate__animated"]);
    }, 500);
}

function checkAuthorization() {
    return fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
                },
                body: JSON.stringify({
                    "method": "checkAuthorization",
                    "source": SOURCE
                })
            })
            .then(response => response.json())
            .catch(error => {
                return {
                    status: false,
                    description: error.message,
                    error: error
                };
            });
}

async function auth() {
    let authPhoneEl = C("#auth-phone-mask"),
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

    let body = {
        "method": "authorization",
        "data": {
            "phone": phone,
            "pass": authPassEl.val()
        },
        "source": SOURCE
    };

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    authButton.disabled = false;

    if (result.status) {
        clearLocalStorage();

        C().setStor(LS_TOKEN, result.data.token);
        C().setStor(LS_SECTION, "wallet");
        //drawSection("wallet");

        location.reload();
    } else {
        showPopup("", result.description);
    }
}

function checkReg() {
    let regPhoneEl = C("#reg-phone-mask"),
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
        trueDate = null,
        phone = getPhoneNumbers(regPhoneEl.val());

    if (regBdEl.val()) {
        let td = regBdEl.val().split("-");
        trueDate = [td[2], td[1], td[0]].join("-");
    }

    lastPhone = phone;

    regButtonEl.disabled = true;
    showLoader();

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            "method": "registration",
            "data": {
                "phone": phone,
                "pass": C("#reg-pass").val(),
                "firstname": C("#reg_firstname").val(),
                "birthdate": trueDate,
                "discount": (C("#discount").el.checked ? 1 : 0),
                "email": C("#reg_email").val(),
                "city": C("#city").val()
            },
            "source": SOURCE
        })
    });

    let result = await response.json();

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
            promiseTimeout(function () {
                showPopup("", result.description);
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

        let body = {
            "method": "confirmation",
            "data": {
                "phone": lastPhone,
                "code": regConfCodeEl.val()
            },
            "source": SOURCE
        },
                response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    },
                    body: JSON.stringify(body)
                }),
                result = await response.json();

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

        let body = {
            "method": "confirmationReset",
            "data": {
                "phone": lastPhone
            },
            "source": SOURCE
        };

        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify(body)
        });

        let result = await response.json();

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

        let body = {
            "method": "getResetConfirmationCode",
            "data": {
                "phone": resPhoneEl.val()
            },
            "source": SOURCE
        };

        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify(body)
        });

        let result = await response.json();

        if (result.status) {
            show("#reset_confirmation");
            resConfInfoEl.text(result.description);
            if (result.data.seconds_left)
                restartResetConfirmationTimer(result.data.seconds_left);
        } else {
            resButtonEl.disabled = false;
            promiseTimeout(function () {
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

    let body = {
            "method": "checkResetConfirmationCode",
            "data": {
                "phone": resPhoneEl.val(),
                "code": resConfCodeEl.val()
            },
            "source": SOURCE
        };

    let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify(body)
        });

    let result = await response.json();

    resConfButEl.el.disabled = false;

    if (result.status) {
        C().setStor(LS_SECTION, "wallet");
        C().setStor(LS_TOKEN, result.data.token);

        location.reload();
    } else {
        showPopup("Внимание", result.description, null, null, function () {
            resConfCodeEl.val("");
            resConfCodeEl.el.focus();
            C("#reset_confirmation_button").el.disabled = true;        
        });
    }
}

async function getReferLink() {
    let body = {
            "method": "getReferLink",
            "source": SOURCE
        };

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    return result;
}

function attentionFocus(el) {
    el.scrollIntoView();
    el.classList.add("fail");
    el.focus();
    C("#" + el.id + "-popup").togclass("show");
}

async function logOff() {
    let body = {
            "method": "logOff",
            "source": SOURCE
        };
        
    showLoader();
    
    let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify(body)
        }),
        result = await response.json();
    
    if (result.status) {
        clearLocalStorage();
        location.reload();
    }

    return result;
}

async function updateCities() {
    let city = C("#city");

    if (!city.el.children.length) {
        let response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    },
                    body: JSON.stringify({
                        "method": "getCities",
                        "source": SOURCE
                    })
                }),
            result = await response.json();

        if (result.status) {
            result.data.forEach(el => {
                let option = C().create("option");

                option.val(el.id);
                option.text(el.title);
                option.attr("default-discount", el.default_discount);

                if (el.status === 2)
                    option.el.selected = "selected";
                city.append(option);
            });
        }
    }
}

function dropFail(el) {
    C(el).delclass("fail");
}

function clearLocalStorage() {
    C().delStor(LS_TOKEN);
    C().delStor(LS_SECTION);
    C().delStor(LS_CURR_UPDATE);
    C().delStor(LS_CONTENTS);
}

function loadScript(src) {
    return new Promise(function (resolve, reject) {
        let script = d.createElement('script');

        script.src = src;
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Ошибка загрузки скрипта ${src}`));
        d.head.append(script);
    });
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
    let et = C("#" + id);

    et.el.scrollIntoView();
    et.addclass("fail");
    et.el.focus();

    C("#" + id + "-popup").addclass("show");
}

function setFeedback() {
    let phone = getPhoneNumbers(C("#feedback-phone-mask").val()),
        message = C("#feedback-message").val(),
        fbSubmitBut = C("#feedback-submit").el;

    if (phone.length !== 11) {
        showInputPopup("feedback-phone-mask");
        return;
    }

    if (message.length < 3) {
        showInputPopup("feedback-message");
        return;
    }

    fbSubmitBut.disabled = true;
    showLoader();

    API_setFeedback(JSON.stringify({
        "method": "setFeedback",
        "data": {
            "name": C("#feedback-name").val(),
            "phone": phone,
            "email": C("#feedback-email").val(),
            "reason": C("#feedback-reason").val(),
            "message": C("#feedback-message").val()
        },
        "source": SOURCE
    }))
            .then(result => {
                if (result.status) {
                    showPopup("Готово", "Ваше сообщение передано оператору");
                    hideFeedback();
                    C("#feedback-message").val("");
                } else {
                    onErrorCatch(result);
                }
            })
            .finally(() => {
                fbSubmitBut.disabled = false;
                hideLoader();
            });
}

function API_setFeedback(body) {
            return fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8"
                },
                body: body
            })
            .then(response => response.json())
            .catch(error => {
                return {
                    status: false,
                    description: error.message,
                    error: error
                };
            });
}

function isEmpty(obj) {
    if (!obj || obj==="undefined") {
        return true;
    }
    
    return Object.keys(JSON.parse(obj)).length === 0;
}

function onErrorCatch(error) {
    showPopup("Внимание", error.description);
    console.warn(error);
}

function setNeedUpdate(contents, result, section) {
    let needUp = JSON.parse(C().getStor(LS_NEED_UPDATE));

    if (contents[section] !== result.data[section] ) {
        needUp[section] = 1;
    }
    
    C().setStor(LS_NEED_UPDATE, JSON.stringify(needUp));
}

function checkUpdates(callback) {
    if (!bearerToken && callback) {
        callback();
    }

    getUpdates().then(result => {
                if (viewNewApp && SOURCE && SOURCE !== result.data.versionApp) {
                    showPopup("Внимание", "Вышла новая версия, пожалуйста, обновите приложение!");
                    viewNewApp = null;
                }

                let currentSection = C().getStor(LS_SECTION),
                    updates  = !isEmpty(C().getStor(LS_CURR_UPDATE)) ? JSON.parse(C().getStor(LS_CURR_UPDATE)) : tempUpdate,
                    contents = !isEmpty(C().getStor(LS_CONTENTS)) ? JSON.parse(C().getStor(LS_CONTENTS)) : {"personal": "", "wallet": ""};

                if (result.status) {
                    if (result.data.news.length) {
                        updates.lastNews = result.data.news.reduce((newLastId, element) => (element.id > newLastId ? element.id : updates.lastNews), updates.lastNews);
                        drawNews(result.data.news);
                    }
                    if (result.data.storesHash) {
                        updates.storesHash = result.data.storesHash;
                        drawStores(result.data.stores);
                    }
                    if (result.data.personalHash) {
                        setNeedUpdate(contents, result, 'personal');
                        contents.personal = result.data.personal;
                        updates.personalHash = result.data.personalHash;

                        let userName = result.data.personal.firstname + " " + result.data.personal.middlename;
                        C("#feedback-name").val((userName ? userName : ""));
                    }
                    if (result.data.walletHash) {
                        setNeedUpdate(contents, result, 'wallet');
                        contents.wallet = result.data.wallet;
                        updates.walletHash = result.data.walletHash;
                    }
                    if (result.data.lastPurchase) {
                        updates.lastPurchase = result.data.lastPurchase;
                        drawPurchases(result.data.purchases);
                    }

                    if (result.data.transactions.length) {
                        updates.lastTransaction = result.data.transactions[result.data.transactions.length - 1].date;
                    }

                    // Всех авторизованных отправляем на страницу кошелька
                    if (sections[currentSection] && !sections[currentSection].needAuth) {
                        C().setStor(LS_SECTION, "wallet");
                    }

                    C().setStor(LS_CURR_UPDATE, JSON.stringify(updates));
                    C().setStor(LS_CONTENTS, JSON.stringify(contents));
                    renderSections();
                } else {
                    // Не авторизованных отправляем на авторизацию
                    if (sections[currentSection] && sections[currentSection].needAuth) {
                        logOff();
                    }
                }
            })
            .finally(() => {
                if (callback) {
                    callback();
                }
                if (bearerToken) {
                    updateWalletData();
                }
            });
}

function getUpdates() {
    let data = !isEmpty(C().getStor(LS_CURR_UPDATE)) ? JSON.parse(C().getStor(LS_CURR_UPDATE)) : tempUpdate;
    
    if (initApp) {
        data.lastNews = 0;
        data.storesHash = "";
        initApp = false;
    }
    
    return fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
                },
                body: JSON.stringify({
                    "method": "getUpdates",
                    "data": data,
                    "source": SOURCE
                })
            })
            .then(response => response.json())
            .catch(error => {
                return {
                    status: false,
                    description: error.message,
                    error: error
                };
            });
}

async function updateWalletData() {
    return fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
                },
                body: JSON.stringify({
                    "method": "updateWalletData",
                    "source": SOURCE
                })
            })
            .then(response => response.json())
            .catch(error => {
                return {
                    status: false,
                    description: error.message,
                    error: error
                };
            })
            .finally(() => {
                userActivityTimeout = null;
            });
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
    inp.addEventListener("input", e => setPhoneMask(e.target));
}

function setPhoneMask(inp, mask) {
    let id = inp.id,
            phone = inp.value,
            hideId = "#" + id.replace("-mask", "");

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
    let phone = value.match(/\d/g),
            newPhone = mask;

    if (!full) {
        full = false;
    }

    phone.forEach(e => newPhone = newPhone.replace(/_/, e));

    if (!full) {
        newPhone = newPhone.replace(/\)_|-_|_/g, "");
    }

    return newPhone;
}

function validateBirthdate(el, isSubmit) {
    let res = false,
            i = 0;

    if (!isSubmit) {
        isSubmit = false;
    }

    el.value = el.value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1-$2").replace(/-(\d{2})(\d)/, "-$1-$2").replace(/(\d{4})\d+/, "$1");

    if (el.value.length > 9) {
        let td = el.value.split("-");
        bd = new Date(td[2], --td[1], td[0]),
                cd = new Date(),
                age = (cd - bd);

        if (age < 568036800000 || age > 3155760000000 || bd == "Invalid Date") {
            showInputPopup("reg-birthdate");
        } else {
            res = true;
        }
    } else if (isSubmit) {
        showInputPopup("reg-birthdate");
    }

    return res;
}

var C = function (s, p) {

    this.isC = true;

    this.isNodeList = function (nodes) {
        var stringRepr = Object.prototype.toString.call(nodes);

        return typeof nodes === 'object' &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) &&
                (typeof nodes.length === 'number') &&
                (nodes.length === 0 || (typeof nodes[0] === "object" && nodes[0].nodeType > 0));
    },
    this.isNode = function (obj) {
        //return obj instanceof HTMLElement;
        if (obj && obj.nodeType) {
            return true;
        } else {
            return false;
        }
    },
    this.isDocument = function (obj) {
        return obj instanceof Document || obj instanceof Window;
    },
    this.isclass = function (cl) {
        return this.els[0].classList.contains(cl);
    },
    this.defineEls = function () {
        if (this.isNode(s) || this.isDocument(s)) {
            return [s];
        } else if (this.isNodeList(s)) {
            return s;
        } else {
            if (p && p.isC) {
                p = p.els[0];
            }

            return this.isNode(p) ? p.querySelectorAll(s) : document.querySelectorAll(s);
        }
    },
    this.defineEl = function () {
        return this.els[0];
    },
    this.els = this.defineEls(),
    this.el = this.defineEl(),
    this.on = function (type, s, fn, except) {
        var p = this;

        this.bind(type, function (e) {
            var el;

            if (p.isNode(s) || p.isNodeList(s)) {
                el = s;
            } else {
                el = C(s).els;
            }

            var t = e.target,
                    ex = except || false;

            while (t && t !== this) {
                if (ex) {
                    var goto = false;
                    C(ex).els.forEach(function (item, index, array) {
                        if (item === t) {
                            goto = true;
                        }
                    });
                    if (goto) {
                        break;
                    }
                }

                for (var i = 0; i < el.length; i++) {
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
    this.strToNode = function (h) {
      var terk;

      if (!this.isNode(h)) {
        var div = this.create('div');

        div.html(h);
        terk = [div.el.children[0]];
      } else {
        terk = [h];
      }

      this.els = terk;
      this.el  = terk[0];

      return this;
    },
    this.attr = function (attr, value) {
        if (value === "undefined") {
            return this.el.getAttribute(attr);
        }

        for (var i = 0; i < this.els.length; i++) {
            this.els[i].setAttribute(attr, value);
        }

        return this;
    },
    this.create = function (tag) {
        var el = document.createElement(tag);
        this.els = [el];
        this.el = el;

        return this;
    },
    this.append = function (el) {
        this.el.append(el.el);
    },
    this.style = function (st, val) {
        for (var i = 0; i < this.els.length; i++) {
            this.els[i].style[st] = val;
        }

        return this;
    },
    this.addclass = function (cl) {
        if (!Array.isArray(cl)) {
            cl = [cl];
        }

        for (var i = 0; i < this.els.length; i++) {
            for (var y = 0; y < cl.length; y++) {
                this.els[i].classList.add(cl[y]);
            }
        }

        return this;
    },
    this.togclass = function (cl) {
        for (var i = 0; i < this.els.length; i++) {
            this.els[i].classList.toggle(cl);
        }

        return this;
    },
    this.delclass = function (cl) {
        if (!Array.isArray(cl)) {
            cl = [cl];
        }

        for (var i = 0; i < this.els.length; i++) {
            for (var y = 0; y < cl.length; y++) {
                this.els[i].classList.remove(cl[y]);
            }
        }

        return this;
    },
    this.delStor = function (key) {
        localStorage.removeItem(key);
        return this;
    },
    this.setStor = function (key, val) {
        localStorage.setItem(key, val);
        return this;
    },
    this.getStor = function (key) {
        return localStorage.getItem(key);
    },
    this.bind = function (type, fn) {
        var addEvent, z;

        if (!type || !fn) {
            return this;
        }

        if (typeof addEventListener === "function") {
            addEvent = function (el, type, fn) {
                el.addEventListener(type, fn, false);
            };
        } else if (typeof attachEvent === "function") {
            addEvent = function (el, type, fn) {
                el.attachEvent("on" + type, fn);
            };
        } else {
            return this;
        }

        if (this.isNodeList(this.els)) {
            for (z = 0; z < this.els.length; z++) {
                addEvent(this.els[z], type, fn);
            }
        } else if (this.isNode(this.els[0]) || this.isDocument(this.els[0])) {
            addEvent(this.els[0], type, fn);
        } else if (this.els.length > 0) {
            for (z = 0; z < this.els.length; z++) {
                addEvent(this.els[z], type, fn);
            }
        }

        return this;
    },
    this.html = function (text) {
        if (!arguments.length && text !== '') {
            return this.els[0].innerHTML;
        }

        for (var i = 0; i < this.els.length; i++) {
            this.els[i].innerHTML = text;
        }

        return this;
    },
    this.text = function (text) {
        if (!arguments.length && text !== '') {
            return this.els[0].innerText;
        }

        for (var i = 0; i < this.els.length; i++) {
            this.els[i].innerText = text;
        }

        return this;
    },
    this.val = function (value) {
        if (!arguments.length && value !== '') {
            return this.els[0].value;
        }

        for (var i = 0; i < this.els.length; i++) {
            this.els[i].value = value;
        }

        return this;
    };

    if (this instanceof C) {
        return this.C;
    } else {
        return new C(s, p);
    }

};