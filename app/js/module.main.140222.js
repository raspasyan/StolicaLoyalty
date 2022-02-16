const cardImageW = 512;
const cardImageH = 328;
const cardImageSRC = "app/assets/backs/card_back.jpg";
const LS_LINK = "LS_walletData_081221_01";
const DOMAIN = "";
// const DOMAIN = "https://bonus.stolica-dv.ru";
const API_URL = DOMAIN + "/api";
const TERMS_URL = DOMAIN + "/politika-konfidentsialnosti";
const RULES_URL = DOMAIN + "/pravila";
const LS_TOKEN_LINK = "LS_BearerToken";
const SOURCE = "WEB2";

let lastPhone = "";
let secondsInterval = null;
let secondsLeft = 0;

let resetCodeTimer = null;
let resetCodeTimerValue = 0;

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
    title: "Профиль"
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
}
let currentSection = "";

let bearerToken   = "";
let currentUpdates = {
  personalHash:"",
  walletHash:"",
  storesHash: "",
  lastNews:"",
  lastPurchase:""
};
let currentCity = "";
let userActivityTimeout = null;

// Инициализация св-в приложения
document.addEventListener("DOMContentLoaded", function () {
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.register('/sw.js')
  //     .then((reg) => {
  //       // регистрация сработала
  //     }).catch((error) => {
  //       // регистрация прошла неудачно
  //     });
  // }
  initPopups();

  bearerToken = localStorage.getItem(LS_TOKEN_LINK);

  auth_phone.addEventListener("blur", e => { dropFail(e.target); auth_phone_popup.classList.remove("show"); });
  auth_phone.addEventListener("change", e => { reg_phone.value = auth_phone.value; reset_phone.value = auth_phone.value; });
  auth_phone.addEventListener("input", e => modifyInput(e.target));

  reg_phone.addEventListener("blur", e => { dropFail(e.target); reg_phone_popup.classList.remove("show"); });
  reg_phone.addEventListener("change", e => { auth_phone.value = reg_phone.value; reset_phone.value = reg_phone.value; });
  reg_phone.addEventListener("input", e => modifyInput(e.target));

  auth_pass.addEventListener("blur", e => { dropFail(e.target); auth_pass_popup.classList.remove("show"); });
  reg_pass.addEventListener("blur", e => { dropFail(e.target); reg_pass_popup.classList.remove("show"); });
  reg_confirmation_code.addEventListener("blur", e => { dropFail(e.target); reg_confirmation_code_popup.classList.remove("show"); });
  reg_birthdate.addEventListener("blur", e => { dropFail(e.target); reg_birthdate_popup.classList.remove("show"); });

  // Переход на пластиковую карту
  personal_changeCard_button.addEventListener("click", () => changeCard());

  // Смена пароля
  personal_new_pass.addEventListener("blur", e => { dropFail(e.target); personal_new_pass_popup.classList.remove("show"); });
  personal_new_pass_confirmation.addEventListener("blur", e => { dropFail(e.target); personal_new_pass_confirmation_popup.classList.remove("show"); });
  personal_changePassword_button.addEventListener("click", () => changeProfileData());

  // Привязка пластиковой карты
  set_card.addEventListener("click", () => setCard());

  // Вход без пароля
  reset_phone.addEventListener("blur", e => { dropFail(e.target); reset_phone_popup.classList.remove("show"); });
  reset_phone.addEventListener("change", e => { reg_phone.value = reset_phone.value; auth_phone.value = reset_phone.value; });
  reset_phone.addEventListener("input", e => { reset_button.disabled = (reset_phone.value ? false : true); modifyInput(e.target) });
  reset_confirmation_code.addEventListener("input", e => { reset_confirmation_button.disabled = (reset_confirmation_code.value.length == 4 ? false : true); });

  auth_pass_toggle.addEventListener("click", e => { auth_pass.type = (auth_pass.type == "password" ? "text" : "password"); auth_pass_toggle.style.color = (auth_pass.type == "password" ? "black" : "#4eb5e6"); });
  reg_pass_toggle.addEventListener("click", e => { reg_pass.type = (reg_pass.type == "password" ? "text" : "password"); reg_pass_confirm.type = (reg_pass_confirm.type == "password" ? "text" : "password"); reg_pass_toggle.style.color = (reg_pass.type == "password" ? "black" : "#4eb5e6"); });
  reg_pass_toggle_confirm.addEventListener("click", e => { reg_pass_confirm.type = (reg_pass_confirm.type == "password" ? "text" : "password"); reg_pass.type = (reg_pass.type == "password" ? "text" : "password"); reg_pass_toggle_confirm.style.color = (reg_pass_confirm.type == "password" ? "black" : "#4eb5e6"); });

  update_pass_toggle.addEventListener("click", e => { personal_new_pass.type = (personal_new_pass.type == "password" ? "text" : "password"); personal_new_pass_confirmation.type = (personal_new_pass_confirmation.type == "password" ? "text" : "password"); update_pass_toggle.style.color = (personal_new_pass.type == "password" ? "black" : "#4eb5e6"); });
  update_pass_toggle_confirm.addEventListener("click", e => { personal_new_pass_confirmation.type = (personal_new_pass_confirmation.type == "password" ? "text" : "password"); personal_new_pass.type = (personal_new_pass.type == "password" ? "text" : "password"); update_pass_toggle_confirm.style.color = (personal_new_pass_confirmation.type == "password" ? "black" : "#4eb5e6"); });

  reg_button.addEventListener("click", e => {
    if (checkReg()) showPopup("Подтверждение звонком", "Вам позвонят на номер\n" + reg_phone.value, "На звонок отвечать не требуется, введите последние четыре цифры номера телефона с которого совершён звонок", "Запросить звонок", reg);
  });

  reset_button.addEventListener("click", e => {
    if (canGetResetConfirmationCode()) showPopup("Подтверждение звонком", "Ожидайте звонок на номер:\n" + reg_phone.value, "На звонок отвечать не требуется, введите последние 4-ре цифры номера телефона входящего звонка.", "Запросить звонок", getResetConfirmationCode);
  });

  document.getElementById("transactions-details-button").addEventListener("click", e => {
    $("#transactions").toggleClass("transactionsOpen");
    $("#transactions-details-button").text((transactions.classList.contains("transactionsOpen")) ? "скрыть детализацию" : "открыть детализацию");
  });

  document.getElementById("feedback-submit").addEventListener("click", e => setFeedback());

  // Выбор города
  store_cities.addEventListener("change", e => {
    let stores = JSON.parse(e.target.options[e.target.selectedIndex].getAttribute("data-stores"));
    drawStoresInCity(stores);
  });

  let phoneMaskOptions = {
    mask: '+{7}(000)000-00-00',
    lazy: false
  };
  let feedbackPhoneMask       = IMask(document.getElementById('feedback-phone'), phoneMaskOptions);
  let authorizationPhoneMask  = IMask(document.getElementById('auth_phone'), phoneMaskOptions);
  let registrationPhoneMask   = IMask(document.getElementById('reg_phone'), phoneMaskOptions);
  let resetPhoneMask          = IMask(document.getElementById('reset_phone'), phoneMaskOptions);

  let dateMaskOptions = {
    mask: '00-00-0000',
    lazy: false
  };
  let registrationBirthdateMask = IMask(document.getElementById('reg_birthdate'), dateMaskOptions); 

  $('#reset_confirmation_code').mask('0000');
  // var feedbackPhoneMask = IMask(document.getElementById('feedback-phone'), maskOptions);

  // Навигация
  let elements = document.getElementsByClassName("bottom-nav-element");
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("pointerdown", function (e) {
      if (e.currentTarget.getAttribute("section")) drawSection(e.currentTarget.getAttribute("section"));
      $(".store_map").remove();
    });
  }

  // Сокрытие всплывающего окна
  overlay.addEventListener("click", function (e) {
    if (overlay.callback) {
      overlay.style.opacity = 0;
      overlay.style.display = "none";

      overlay.callback();
    } else {
      animate({
        duration: 333,
        timing: quad,
        draw: function (progress, options) {
          overlay.style.opacity = 1 - progress;
        },
        callback: function (options) {
          overlay.style.display = "none";
        }
      });
    }
  });

  checkUpdates(currentUpdates, () => {
    drawSection(localStorage.getItem("section"));
    document.body.addEventListener("pointerover", userActivity);
    document.body.addEventListener("pointerdown", userActivity)
  });
});

function userActivity(e) {
  if (!userActivityTimeout) userActivityTimeout = setTimeout(checkUpdates, 3333, currentUpdates, () => {
    userActivityTimeout = null;
  });
}

function modifyInput(el) {
  if (el.value.length == 1 && +el.value[0] == 8) el.value = "+7-";
}

function openNav() {
  document.getElementById("topnav").style.width = "100%";
}

function closeNav() {
  document.getElementById("topnav").style.width = "0%";
}

function removeChildrens(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function routePrevSection() {
  let section = localStorage.getItem("section");
  if (sections[section] && sections[section].prevSection) drawSection(sections[section].prevSection);
}

function drawSection(section) {
  if (!section) section = "adult";

  switch (section) {
    default: {
      break;
    }

    case "pre-registration": {
      updateCities();

      break;
    }

    case "registration": {
      updateCities().then(result => {
        registration_cont.style.display = "";
        reg_confirmation.style.display = "none";
  
        prem.checked = true;
        discount.checked = false;
        document.getElementById("loyalty-system").style.display = (city.options[city.options.selectedIndex].getAttribute("default-discount") == 0 ? "none" : "");  
      });

      break;
    }

    case "personal": {
      //
      break;
    }

    case "stores": {
      //
      break;
    }

    case "wallet": {
      //
      break;
    }

    case "refer": {
      renderReferSection();

      break;
    }

    case "reg_success": {
      //
      break;
    }

    case "news": {
      //
      break;
    }
  }

  let sectionsElements = document.getElementsByClassName("section");
  for (let i = 0; i < sectionsElements.length; i++) {
    if (sectionsElements[i].id == section) {
      sectionsElements[i].style.display = "";
      sectionsElements[i].scrollIntoView();
    } else {
      sectionsElements[i].style.display = "none";
    }
    hideLoader();
  }

  document.getElementById("top-nav").style.display = (sections[section] && sections[section].title ? "" : "none");
  document.getElementById("top-nav-back").style.display = (sections[section] && sections[section].prevSection ? "" : "none");
  document.getElementById("top-nav-msg").style.display = (sections[section] && !sections[section].prevSection ? "" : "none");
  document.getElementById("top-nav-title").innerText = sections[section].title;
  document.getElementById("top-nav-menu").style.display = (sections[section] && sections[section].showMenu ? "" : "none");
  document.getElementById("top-nav-close").style.display = (["alerts"].indexOf(section) == -1 ? "none" : "");
  document.getElementById("bottom-nav").style.display = (sections[section] && sections[section].showMenu ? "" : "none");

  for (let i = 0; i < document.getElementById("bottom-nav").children.length; i++) {
    document.getElementById("bottom-nav").children[i].classList.remove("current-section");
    if (document.getElementById("bottom-nav").children[i].getAttribute("section") == section) document.getElementById("bottom-nav").children[i].classList.add("current-section");
  }

  localStorage.setItem("section", section);
}

function renderReferSection() {
  getReferLink().then((response) => {
    if (response.status) {
      if (!referQr.children.length) {
        let qrCanvas = document.createElement("canvas");
        qrCanvas.style.opacity = 0;
        let qr = new QRious({
          element: qrCanvas,
          size: 192,
          value: response.data.link
        });
        referQr.appendChild(qrCanvas);

        referLink.style.display = "";
        animate({
          duration: 1000,
          timing: quad,
          draw: function (progress, options) {
            qrCanvas.style.opacity = progress;
            referLink.style.opacity = progress;
          },
          callback: function (options) { }
        });

        referLinkTG.setAttribute("href", "https://t.me/share/url?url=" + response.data.link + "&text=Столица: бонусы&utm_source=ref_tg");
        referLinkWA.setAttribute("href", "https://api.whatsapp.com/send?text=Столица: бонусы " + response.data.link + "&utm_source=ref_wa");
      }

      if (response.data.referrals && response.data.referrals.length) response.data.referrals.forEach((ref_row) => {
        let tr = document.createElement("tr");

        let td = document.createElement("td");
        td.innerText = ref_row.last_sync;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = "7-***-***-" + ref_row.phone;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = (ref_row.gifted ? "Совершена покупка" : "Регистрация по приглашению");
        tr.appendChild(td);

        td = document.createElement("td");
        if (ref_row.gifted) td.style.fontWeight = "bold";
        td.innerText = (ref_row.gifted ? "+" + ref_row.referral_gift : "n/a");
        td.classList.add(ref_row.gifted ? "good" : "bad");
        tr.appendChild(td);

        referrals.appendChild(tr);
      });
    }
  });
}

function getGeolink(title, description) {
  let GeolinkElement = document.createElement("span");
  GeolinkElement.classList.add("ymaps-geolink");
  GeolinkElement.setAttribute("data-description", description);
  GeolinkElement.innerText = title;

  return GeolinkElement;
}

function getGeoMap() {
  return new ymaps.Map('map', {
    center: [48.4827, 135.084],
    zoom: 10
  }, {
    searchControlProvider: 'yandex#search'
  });
}

function getStoreToGeoMap(coordinates, city, title, shedule, phone, rsa_id) {
  $(".store_map").remove();
  $("body").append("<div class='store_map'><div class='store_map-bg'></div><div class='store_map-block'><div id='map_city'>" + city + "</div><div id='map_info'><div class='map_info-item'><span class='map_info-item-key'>Адрес:</span><span class='map_info-item-value'>" + title + "</span></div><div class='map_info-item'><span class='map_info-item-key'>Время работы:</span><span class='map_info-item-value'>" + shedule + "</span></div><div class='map_info-item'><span class='map_info-item-key'>Телефон:</span><span class='map_info-item-value'><a href='tel:+7" + phone.slice(1) + "'>" + phone + "</a></span></div></div><div id='map'></div></div>");


  let x = parseFloat(coordinates.split(',')[0]);
  let y = parseFloat(coordinates.split(',')[1]);

  var myMap = new ymaps.Map("map", {
    center: [x, y],
    zoom: 12
  });

  let objectManager = new ymaps.ObjectManager({
    clusterize: true,
    gridSize: 32,
    clusterDisableClickZoom: true
  });

  objectManager.objects.options.set('preset', 'islands#greenDotIcon');
  objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');

  objectManager.add({
    type: 'Feature',
    id: rsa_id,
    geometry: {
      type: 'Point',
      coordinates: [x, y]
    },
    properties: {
      hintContent: title,
      balloonContentHeader: '',
    }
  });

  myMap.geoObjects.add(objectManager);
}

$(document).on('click', '.store_block', function () {
  let coordinates = $(this).attr("data-coordinates");
  let title = $(this).find(".store_block-title").text();
  let shedule = $(this).find(".store_block-shedule").text();
  let phone = $(this).attr("data-phone");
  let city = $(this).attr("data-city");
  let rsa_id = $(this).attr("data-rsa");

  getStoreToGeoMap(coordinates, city, title, shedule, phone, rsa_id);
})

$(document).on("click", ".store_map-bg", function () {
  $(".store_map").remove();
})

function confirmAdult() {
  drawSection(localStorage.getItem("section"));
}

function showPopup(title, description, message, buttonText, callback) {
  if (!buttonText) buttonText = "Ок";
  if (!callback) callback = null;

  hideLoader();

  overlay.style.display = "";

  popupTitle.style.display = (title ? "" : "none");
  popupTitle.innerText = title;

  popupDescription.style.display = (description ? "" : "none");
  popupDescription.innerText = description;

  popupMessage.style.display = (message ? "" : "none");
  popupMessage.innerText = message;

  popupButton.innerText = buttonText;

  overlay.callback = callback;

  animate({
    duration: 333,
    timing: quad,
    draw: function (progress, options) {
      overlay.style.opacity = progress;
      // popupMessage.innerText = options.fullText.substring(0, options.fullText.length * progress);
    },
    fullText: message
  });
}

function showLoader() {
  loader.style.opacity = 1;
  loader.style.display = "";
}

function hideLoader(instant) {
  if (instant == undefined) instant = false;

  if (instant) {
    loader.style.display = "none";
  } else {
    animate({
      duration: 1000,
      timing: quad,
      draw: function (progress, options) {
        loader.style.opacity = 1 - progress;
      },
      callback: function (options) {
        loader.style.display = "none";
      }
    });
  }
}

function checkAuthorization() {
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
    },
    body: JSON.stringify({
      "method": "checkAuthorization"
    })
  })
  .then(response => response.json())
  .catch(error => {
    return {
      status: false,
      description: error.message,
      error: error
    }
  });
}

async function auth() {
  if (auth_phone.value == "") {
    auth_phone.scrollIntoView();
    auth_phone.classList.toggle("fail");
    auth_phone.focus();
    auth_phone_popup.classList.toggle("show");
    return;
  }
  if (auth_pass.value == "") {
    auth_pass.scrollIntoView();
    auth_pass.classList.toggle("fail");
    auth_pass.focus();
    auth_pass_popup.classList.toggle("show");
    return;
  }

  if (auth_phone.value && auth_pass.value) {
    auth_button.disabled = true;

    let body = {
      "method": "authorization",
      "data": {
        "phone": auth_phone.value,
        "pass": auth_pass.value
      }
    };

    let response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(body)
    });

    let result = await response.json();

    auth_button.disabled = false;

    if (result.status) {
      clearLocalStorage();

      localStorage.setItem("section", "wallet");
      localStorage.setItem(LS_TOKEN_LINK, result.data.token);

      location.reload();
      // drawSection("wallet");
    } else {
      showPopup("", result.description);
    }
  }
}

function checkReg() {
  if (reg_phone.value.length < 16) {
    reg_phone.scrollIntoView();
    reg_phone.classList.add("fail");
    reg_phone.focus();
    reg_phone_popup.classList.toggle("show");
    return 0;
  }
  // if (reg_card_type_digital.checked) {
  if (reg_pass.value.length < 6) {
    reg_pass.scrollIntoView();
    reg_pass.classList.add("fail");
    reg_pass.focus();
    reg_pass_popup.classList.toggle("show");
    return 0;
  }
  // } else {
  //   if (reg_cardNumber.value.length < 6) {
  //     reg_cardNumber.scrollIntoView();
  //     reg_cardNumber.classList.add("fail");
  //     reg_cardNumber.focus();
  //     reg_cardNumber_popup.classList.toggle("show");
  //     return 0;
  //   }
  // }

  let trueDate = null;

  if (reg_birthdate.value) {
    let td = reg_birthdate.value.split("-");
    trueDate = [td[2], td[1], td[0]].join("-");

    let bd = new Date(trueDate);
    let cd = new Date();
    if (cd.getFullYear() - bd.getFullYear() < 18 || reg_birthdate.value.length !== 10) {
      showPopup("Внимание", "Вам должно быть 18 лет!");
      return 0;
    }
  } else {
    reg_birthdate.scrollIntoView();
    reg_birthdate.classList.add("fail");
    reg_birthdate.focus();
    reg_birthdate_popup.classList.toggle("show");

    return 0;
  }

  if (reg_pass.value != reg_pass_confirm.value) {
    showPopup("Внимание", "Введенные пароли не совпадают!");
    return 0;
  }

  return 1;
}

async function reg() {
  let trueDate = null;

  if (reg_birthdate.value) {
    let td = reg_birthdate.value.split("-");
    trueDate = [td[2], td[1], td[0]].join("-");
  }

  lastPhone = reg_phone.value;

  reg_button.disabled = true;
  showLoader();

  let response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify({
      "method": "registration",
      "data": {
        "phone": reg_phone.value,
        "pass": reg_pass.value,
        "firstname": reg_firstname.value,
        "birthdate": trueDate,
        "discount": (discount.checked ? 1 : 0),
        "email": reg_email.value,
        "city": city.value
      }
    })
  });

  let result = await response.json();

  reg_button.disabled = false;
  hideLoader();

  if (result.status) {
    if (result.data && result.data.need_confirmation) {
      // Скрываем блок регистрации
      registration_cont.style.display = "none";

      // Демонстрируем блок ввода подтверждения
      reg_confirmation.style.display = "";
      reg_confirmation_code.scrollIntoView();
      reg_confirmation_code.classList.toggle("fail");
      reg_confirmation_code.focus();
      reg_confirmation_code_popup.classList.toggle("show");

      // Запускаем таймер отсчета для повторной отправки
      setConfirmationTimeout(result);
    }
  } else {
    if (result.description) showPopup("", result.description);
  }
}

function setConfirmationTimeout(result) {
  confirmation_button_reset.style.display = "none";
  secondsLeft = result.data.seconds_left;
  reg_confirmation_code_popup.innerText = result.description;
  reg_confirmation_info.innerText = result.description;
  reg_confirmation_remind.innerText = "Повторная отправка будет доступна через " + secondsLeft + " сек.";
  if (secondsInterval) clearInterval(secondsInterval);
  secondsInterval = setInterval(() => {
    secondsLeft--;
    reg_confirmation_remind.innerText = "Повторная отправка будет доступна через " + secondsLeft + " сек.";
    if (secondsLeft <= 0) {
      clearInterval(secondsInterval);
      reg_confirmation_remind.innerText = "";

      confirmation_button_reset.style.display = "";
    }
  }, 1000)
}

async function confirmation() {
  if (reg_confirmation_code.value.length < 4) {
    reg_confirmation_code.scrollIntoView();
    reg_confirmation_code.classList.add("fail");
    reg_confirmation_code.focus();
    reg_confirmation_code_popup.classList.toggle("show");
    return;
  }

  if (lastPhone && reg_confirmation_code.value) {
    confirmation_button.disabled = true;
    showLoader();

    let body = {
      "method": "confirmation",
      "data": {
        "phone": lastPhone,
        "code": reg_confirmation_code.value
      }
    };

    let response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(body)
    });

    let result = await response.json();

    confirmation_button.disabled = false;
    hideLoader();

    if (result.status) {
      if (result.data.setNewPassword == undefined) {
        drawSection("reg_success");
      } else {
        drawSection("intro");
      }
    } else {
      if (result.description) {
        reg_confirmation_code.value = "";
        showPopup("Внимание", result.description);
      }
    }
  }
}

async function confirmationReset() {
  if (lastPhone) {
    confirmation_button_reset.disabled = true;

    let body = {
      "method": "confirmationReset",
      "data": {
        "phone": lastPhone
      }
    };

    let response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(body)
    });

    let result = await response.json();

    confirmation_button_reset.disabled = false;

    if (result.status) setConfirmationTimeout(result);
  }
}

function canGetResetConfirmationCode() {
  if (reset_phone.value.length < 16) {
    reset_phone.scrollIntoView();
    reset_phone.classList.add("fail");
    reset_phone.focus();
    reset_phone_popup.classList.toggle("show");
    return 0;
  }

  return 1;
}

async function getResetConfirmationCode() {
  if (reset_phone.value) {
    reset_button.disabled = true;

    let body = {
      "method": "getResetConfirmationCode",
      "data": {
        "phone": reset_phone.value
      }
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
      reset_confirmation.style.opacity = 0;
      reset_confirmation.style.display = "";

      animate({
        duration: 1000,
        timing: quad,
        draw: function (progress, options) {
          reset_confirmation.style.opacity = progress;
        },
        callback: function (options) { }
      });

      reset_confirmation_info.innerText = result.description;
      if (result.data.seconds_left) restartResetConfirmationTimer(result.data.seconds_left);
    } else {
      reset_button.disabled = false;
      showPopup("Внимание", result.description);
    }
  }
}

function restartResetConfirmationTimer(seconds) {
  resetCodeTimerValue = seconds - 1;

  reset_confirmation_time.style.display = "";
  reset_confirmation_time.innerText = resetCodeTimerValue + " сек.";

  if (resetCodeTimer) clearInterval(resetCodeTimer);
  resetCodeTimer = setInterval(() => {
    reset_confirmation_time.style.display = "";
    reset_confirmation_time.innerText = resetCodeTimerValue + " сек.";
    resetCodeTimerValue--;

    if (!resetCodeTimerValue) {
      reset_button.disabled = false;
      reset_confirmation_time.style.display = "none";
      if (resetCodeTimer) clearInterval(resetCodeTimer);
    }
  }, 1000);
}

async function checkResetConfirmationCode() {
  if (reset_phone.value.length < 16) {
    reset_phone.scrollIntoView();
    reset_phone.classList.add("fail");
    reset_phone.focus();
    reset_phone_popup.classList.toggle("show");
    return;
  }

  if (reset_confirmation_code.value.length < 4) {
    reset_confirmation_code.scrollIntoView();
    reset_confirmation_code.classList.add("fail");
    reset_confirmation_code.focus();
    return;
  }

  reset_confirmation_button.disabled = true;

  let body = {
    "method": "checkResetConfirmationCode",
    "data": {
      "phone": reset_phone.value,
      "code": reset_confirmation_code.value
    }
  };

  let response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  reset_confirmation_button.disabled = false;

  if (result.status) {
    drawSection("wallet");
  } else {
    showPopup("Внимание", result.description, null, null, function () { reset_confirmation_code.value = ""; reset_confirmation_code.focus(); });
  }
}

async function getReferLink() {
  let body = {
    "method": "getReferLink"
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

function attentionFocus(element) {
  element.scrollIntoView();
  element.classList.add("fail");
  element.focus();
  document.getElementById(element.getAttribute("popup_id")).classList.toggle("show");
}

async function logOff() {
  let body = {
    "method": "logOff"
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
    clearLocalStorage();

    location.reload();
  }

  return result;
}

async function updateCities() {
  if (!city.children.length) {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify({
        "method": "getCities"
      })
    });

    let result = await response.json();

    if (result.status) {
      result.data.forEach(element => {
        let option = document.createElement("option");
        option.value = element.id;
        option.innerText = element.title;
        option.setAttribute("default-discount", element.default_discount);
        if (element.status == 2) option.selected = "selected";
        city.appendChild(option);
      });
    }
  }
}

function dropFail(element) {
  if (element.value && element.classList.contains("fail")) element.classList.remove("fail");
}

function clearLocalStorage() {
  localStorage.removeItem("walletData");
  localStorage.removeItem("LS_walletData");
  localStorage.removeItem("LS_walletData_02");
  localStorage.removeItem("LS_walletData_03");
  localStorage.removeItem("LS_walletData_04");
  localStorage.removeItem("LS_walletData_05");
  localStorage.removeItem("LS_walletData_06");
  localStorage.removeItem("LS_walletData_081221");

  localStorage.removeItem(LS_LINK);
  localStorage.removeItem(LS_TOKEN_LINK);
  localStorage.removeItem("section");
}

$(".system_tabs-head-item").click(function () {
  $(this).addClass("tab_h_active");
  $(this).siblings(".system_tabs-head-item").removeClass("tab_h_active");
  let tabIndex = $(".system_tabs-head-item").index(this);
  tabIndex++;

  $(".system_tabs-content-item").removeClass("tab_c_active");
  $(".system_tabs-content-item:nth-child(" + tabIndex + ")").addClass("tab_c_active");
})

$(".system_tabs-head-item-change").click(function () {
  $(this).addClass("tab_h_active");
  $(this).siblings(".system_tabs-head-item-change").removeClass("tab_h_active");
  let tabIndex = $(".system_tabs-head-item-change").index(this);
  tabIndex++;

  $(".system_tabs-content-item-change").removeClass("tab_c_active");
  $(".system_tabs-content-item-change:nth-child(" + tabIndex + ")").addClass("tab_c_active");
})

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    let script = document.createElement('script');
    script.src = src;

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Ошибка загрузки скрипта ${src}`));

    document.head.append(script);
  });
}

function showTerms() {
  document.getElementById("terms").style.display = "";
  document.getElementById("terms").getElementsByTagName("iframe")[0].src = TERMS_URL;
}

function showRules() {
  document.getElementById("terms").style.display = "";
  document.getElementById("terms").getElementsByTagName("iframe")[0].src = RULES_URL;
}

function showIndicator() {
  document.getElementById("top-nav-indicator").style.display = "";
}

function hideIndicator() {
  document.getElementById("top-nav-indicator").style.display = "none";
}

function showFeedback() {
  document.getElementById("feedback").style.display = "";
  document.body.classList.add("overlay-show");
}

function hideFeedback() {
  document.getElementById('feedback').style.display='none';
  document.body.classList.remove("overlay-show");
}

function setFeedback() {
  let feedbackSubmitButton = document.getElementById("feedback-submit");
  feedbackSubmitButton.disabled = true;
  showLoader();

  API_setFeedback(JSON.stringify({
    "method": "setFeedback",
    "data": {
      "name": document.getElementById("feedback-name").value,
      "phone": document.getElementById("feedback-phone").value,
      "email": document.getElementById("feedback-email").value,
      "reason": document.getElementById("feedback-reason").value,
      "message": document.getElementById("feedback-message").value
    }
  }))
  .then(result => {
    console.log(result);
    if (result.status) {
      showPopup("Готово", "Ваше сообщение передано оператору");
      hideFeedback();
      document.getElementById("feedback-message").value = "";
    } else {
      onErrorCatch(result);
    }
  })
  .finally(() => {
    feedbackSubmitButton.disabled = false;
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
    }
  });
}

function onErrorCatch(error) {
  showPopup("Внимание", error.description);
  console.warn(error);
}

function checkUpdates(lastUpdates, callback) {
  getUpdates(lastUpdates).then(result => {
    if (result.status) {
      if (result.data.news.length) {
        drawNews(result.data.news);
        currentUpdates.lastNews = result.data.news.reduce((newLastId, element) => (element.id > newLastId ? element.id : currentUpdates.lastNews), currentUpdates.lastNews);                
      }
      if (result.data.personalHash) {
        drawPersonal(result.data.personal);
        currentUpdates.personalHash = result.data.personalHash;

        let userName = result.data.personal.firstname + " " + result.data.personal.middlename;
        document.getElementById("feedback-name").value = (userName ? userName : "");

        if (result.data.personal.city) currentCity = result.data.personal.city;
      }
      if (result.data.storesHash) {
        drawStores(result.data.stores);
        currentUpdates.storesHash = result.data.storesHash;
      }
      if (result.data.walletHash) {
        drawWallet(result.data.wallet);
        currentUpdates.walletHash = result.data.walletHash;
      }
      if (result.data.lastPurchase) {
        drawPurchases(result.data.purchases);
        currentUpdates.lastPurchase = result.data.lastPurchase;
      }
    } else {
      if (sections[localStorage.getItem("section")] && sections[localStorage.getItem("section")].needAuth) logOff();
    }
  })
  .finally(() => {
    if (callback) callback();

    updateWalletData();
  });
}

function getUpdates(lastUpdates) {
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
    },
    body: JSON.stringify({
      "method": "getUpdates",
      "data": lastUpdates,
      "source": SOURCE
    })
  })
  .then(response => response.json())
  .catch(error => {
    return {
      status: false,
      description: error.message,
      error: error
    }
  });
}

function updateWalletData() {
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
    },
    body: JSON.stringify({
      "method": "updateWalletData"
    })
  })
  .then(response => response.json())
  .catch(error => {
    return {
      status: false,
      description: error.message,
      error: error
    }
  });
}