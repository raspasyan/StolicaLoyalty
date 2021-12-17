const cardImageW = 512;
const cardImageH = 328;
const cardImageSRC = "app/assets/card_back.jpg";

let lastPhone = "";
let secondsInterval = null;
let secondsLeft = 0;

let resetCodeTimer = null;
let resetCodeTimerValue = 0;

// Таймер на обновление св-в кошелька
let walletUpdater = null;

let prevSection = null;

let exceptions = ["adult", "intro", "pre-registration", "registration", "reg_success", "authorization", "reset"];
let navTitle = {
  registration: "Регистрация",
  authorization: "Вход",
  reset: "Сброс пароля",
  personal: "Профиль",
  wallet: "Кошелек",
  news: "Новости",
  stores: "Магазины",
  refer: "Приглашение",
  reg_success: "Профиль",
  alerts: "Подписки и уведомления",
  personal_update: "Смена данных",
  set_plastic: "Смена данных"
};

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

  auth_phone.addEventListener("blur",             (e) => { dropFail(e.target); auth_phone_popup.classList.remove("show"); });
  auth_phone.addEventListener("change",           (e) => { reg_phone.value = auth_phone.value; reset_phone.value = auth_phone.value; });
  auth_phone.addEventListener("input",            (e) => modifyInput(e.target));

  reg_phone.addEventListener("blur",              (e) => { dropFail(e.target); reg_phone_popup.classList.remove("show"); });
  reg_phone.addEventListener("change",            (e) => { auth_phone.value = reg_phone.value; reset_phone.value = reg_phone.value; });
  reg_phone.addEventListener("input",             (e) => modifyInput(e.target));

  auth_pass.addEventListener("blur",              (e) => { dropFail(e.target); auth_pass_popup.classList.remove("show"); });
  reg_pass.addEventListener("blur",               (e) => { dropFail(e.target); reg_pass_popup.classList.remove("show"); });
  // reg_cardNumber.addEventListener("blur",         (e) => { dropFail(e.target); reg_cardNumber_popup.classList.remove("show"); });
  reg_confirmation_code.addEventListener("blur",  (e) => { dropFail(e.target); reg_confirmation_code_popup.classList.remove("show"); });
  reg_birthdate.addEventListener("blur",          (e) => { dropFail(e.target); reg_birthdate_popup.classList.remove("show"); });

  // Переход на пластиковую карту
  personal_changeCard_button.addEventListener("click", () => {changeCard();});

  // Смена пароля
  personal_new_pass.addEventListener("blur", (e) => { dropFail(e.target); personal_new_pass_popup.classList.remove("show"); });
  personal_new_pass_confirmation.addEventListener("blur", (e) => { dropFail(e.target); personal_new_pass_confirmation_popup.classList.remove("show"); });
  personal_changePassword_button.addEventListener("click", () => {changeProfileData();});

  // Смена типа карты
  //$('.system_tabs-head-item-change').click(function (){changeCardType();});

  // Привязка пластиковой карты
  set_card.addEventListener("click", () => setCard());

  // Вход без пароля
  reset_phone.addEventListener("blur", (e) => { dropFail(e.target); reset_phone_popup.classList.remove("show"); });
  reset_phone.addEventListener("change", (e) => {reg_phone.value = reset_phone.value; auth_phone.value = reset_phone.value;});
  reset_phone.addEventListener("input", (e) => {reset_button.disabled = (reset_phone.value ? false : true); modifyInput(e.target)});
  reset_confirmation_code.addEventListener("input", (e) => {reset_confirmation_button.disabled = (reset_confirmation_code.value.length == 4 ? false : true);});
  $('#reset_phone').mask('+7-000-000-00-00');
  $('#reset_confirmation_code').mask('0000');

  auth_pass_toggle.addEventListener("click", (e) => {auth_pass.type = (auth_pass.type == "password" ? "text" : "password"); auth_pass_toggle.style.color = (auth_pass.type == "password" ? "black" : "#4eb5e6");});
  reg_pass_toggle.addEventListener("click", (e) => {reg_pass.type = (reg_pass.type == "password" ? "text" : "password"); reg_pass_confirm.type = (reg_pass_confirm.type == "password" ? "text" : "password");  reg_pass_toggle.style.color = (reg_pass.type == "password" ? "black" : "#4eb5e6");});
  reg_pass_toggle_confirm.addEventListener("click", (e) => {reg_pass_confirm.type = (reg_pass_confirm.type == "password" ? "text" : "password"); reg_pass.type = (reg_pass.type == "password" ? "text" : "password"); reg_pass_toggle_confirm.style.color = (reg_pass_confirm.type == "password" ? "black" : "#4eb5e6");});

  update_pass_toggle.addEventListener("click", (e) => {personal_new_pass.type = (personal_new_pass.type == "password" ? "text" : "password"); personal_new_pass_confirmation.type = (personal_new_pass_confirmation.type == "password" ? "text" : "password"); update_pass_toggle.style.color = (personal_new_pass.type == "password" ? "black" : "#4eb5e6");});
  update_pass_toggle_confirm.addEventListener("click", (e) => {personal_new_pass_confirmation.type = (personal_new_pass_confirmation.type == "password" ? "text" : "password"); personal_new_pass.type = (personal_new_pass.type == "password" ? "text" : "password"); update_pass_toggle_confirm.style.color = (personal_new_pass_confirmation.type == "password" ? "black" : "#4eb5e6");});
  // reg_card_type_digital.addEventListener("change", (e) => {changeCardType();});
  // reg_card_type_analog.addEventListener("change", (e) => {changeCardType();});
  // changeCardType();

  reg_button.addEventListener("click", (e) => {
    if (checkReg()) showPopup("Подтверждение звонком", "Вам позвонят на номер\n" + reg_phone.value, "На звонок отвечать не требуется, введите последние четыре цифры номера телефона с которого совершён звонок", "Запросить звонок", reg);
  });

  reset_button.addEventListener("click", (e) => {
    if (canGetResetConfirmationCode()) showPopup("Подтверждение звонком", "Ожидайте звонок на номер:\n" + reg_phone.value, "На звонок отвечать не требуется, введите последние 4-ре цифры номера телефона входящего звонка.", "Запросить звонок", getResetConfirmationCode);
  });

  document.getElementById("transactions-details-button").addEventListener("click", (e) => {
    $("#transactions").toggleClass("transactionsOpen");
    $("#transactions-details-button").text((transactions.classList.contains("transactionsOpen")) ? "скрыть детализацию" : "открыть детализацию");
  });

  // Выбор города
  store_cities.addEventListener("change",           (e) => { getStoresList(store_cities.value) });

  $('#auth_phone').mask('+7-000-000-00-00');
  $('#reg_phone').mask('+7-000-000-00-00');
  $('#reg_birthdate').mask('00-00-0000');

  // Навигация
  let elements = document.getElementsByClassName("bottom-nav-element");
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", function (e) {
      if (e.currentTarget.getAttribute("section")) routeSection(e.currentTarget.getAttribute("section"));$(".store_map").remove();
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

  //Маршрутизация
  routeSection(localStorage.getItem("section"));
});

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
  routeSection(prevSection);
}

async function routeSection(section) {
  if (!section) section = "adult";

  prevSection = localStorage.getItem("section");

  if (section == "adult") {
    drawSection(section);
  } else {
    checkAuthorization().then(result => {
      if (result.status) {
        if (!feedback_form.getAttribute("phone") && result.data.phone) {
          feedback_form.setAttribute("phone", result.data.phone);
          let userName = result.data.firstname + " " + result.data.middlename;
          feedback_form.src += "&answer_short_text_7059155=" + result.data.phone + (userName ? "&answer_short_text_96201=" + userName : "");
        }

        if (["wallet", "news", "personal", "stores", "refer"].indexOf(section) == -1) section = "wallet";
        drawSection(section);
      } else {
        drawSection("intro");
      }
    });
  }
}

function drawSection(section) {
  switch (section) {
    default: {
      break;
    }

    case "registration": {
      registration_cont.style.display = "";
      reg_confirmation.style.display = "none";

      prem.checked = true;
      discount.checked = false;
      document.getElementById("loyalty-system").style.display = (city.options[city.options.selectedIndex].getAttribute("default-discount") == 0 ? "none" : "");

      break;
    }

    case "personal": {
      getProfileData().then(result => {
        if (result.status) {

          if (result.data.firstname || result.data.middlename || result.data.lastname) personal_name.innerText = [result.data.firstname, result.data.middlename, result.data.lastname].join(" ");

          if (result.data.birthdate) {
            let date = new Date((result.data.birthdate).replace(new RegExp("-",'g'),"/"));

            var options = {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timezone: 'UTC'
            };

            personal_birthdate.innerText = date.toLocaleString("ru", options);
          }


          if (result.data.phone) {
            a = result.data.phone.split('');
            personal_phone.innerText = '+' + a[0] + '-' + a[1] + a[2] + a[3] + '-' + a[4] + a[5] + a[6] + '-' + a[7] + a[8] + '-' + a[9] + a[10];
          }

          if (result.data.card_status !== 1) {
            $("#replace_card").remove();
          }

          personalCardType.innerText = (result.data.preferred_discount) ? "ДИСКОНТНАЯ" : "БОНУСНАЯ";

<<<<<<< HEAD:app/js/app_271021.min.js

          if (result.data.discount) {
            if (!result.data.preferred_discount) {
              // Текущая: бонусы, предпочитаемая: скидка
              notMatchCardType.style.display = "block";
              notMatchCardTypeValue.innerText = "ДИСКОНТНОЙ";
              notMatchCardTypeDeadline.innerText = new Date().toLocaleDateString() + " 23:55";
            }
          } else {
            if (result.data.preferred_discount) {
              // Текущая: скидка, предпочитаемая: бонусы
              notMatchCardType.style.display = "block";
              notMatchCardTypeValue.innerText = "БОНУСНОЙ";
              notMatchCardTypeDeadline.innerText = new Date().toLocaleDateString() + " 23:55";
            }
=======
          if (result.data.discount != result.data.preferred_discount) {
            notMatchCardType.style.display = "block";
            notMatchCardTypeValue.innerText = (result.data.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ");
          } else {
            notMatchCardType.style.display = "none";
>>>>>>> fbe07a08689eb8345e1adb2bc71f8e52a767fa11:app/js/app_2511216.js
          }
        } else {
          showPopup("Внимание", "Возникла ошибка при запросе данных с сервера. Повторите попытку позднее.");
        }
      });

      break;
    }

    case "stores": {
      if (!storesList.children.length) {
        let city_id = false;
        getStores().then(result => {
          if (result.status) {
            result.cities.forEach(city => {
              let option = document.createElement("option");
              option.value = city.id;
              option.innerText = city.name;
              store_cities.appendChild(option);
            })
            city_id = result.cities[0].id;
            getStoresList(city_id);
          }

        }).catch(error => {
          console.warn(error);
          showPopup("Внимание", "Произошла ошибка, попробуйте позже.");
        });

      }

      break;
    }

    case "wallet": {
      updateWalletData(true);

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
  }

  let sections = document.getElementsByClassName("section");
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].id == section) {
      sections[i].style.display = "";
      sections[i].scrollIntoView();
    } else {
      sections[i].style.display = "none";
    }

    document.getElementById("top-nav").style.display = (["adult", "intro", "pre-registration"].indexOf(section) == -1 ? "" : "none");
    document.getElementById("top-nav-back").style.display = (["authorization", "registration", "reset", "personal_update", "set_plastic"].indexOf(section) == -1 ? "none" : "");
    document.getElementById("top-nav-msg").style.display = (["personal", "wallet", "stores", "news"].indexOf(section) == -1 ? "none" : "");
    document.getElementById("top-nav-title").innerText = (navTitle[section] ? navTitle[section] : "");
    document.getElementById("top-nav-menu").style.display = (exceptions.indexOf(section) == -1 ? "" : "none");
    document.getElementById("top-nav-close").style.display = (["alerts"].indexOf(section) == -1 ? "none" : "");
    document.getElementById("bottomnav").style.display = (exceptions.indexOf(section) == -1 ? "" : "none");

    hideLoader();
  }

  for (let i = 0; i < bottomnav.children.length; i++) {
    bottomnav.children[i].classList.remove("current-section");
    if (bottomnav.children[i].getAttribute("section") == section) bottomnav.children[i].classList.add("current-section");
  }

  updateCities();

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
          callback: function (options) {}
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
  $("body").append("<div class='store_map'><div class='store_map-bg'></div><div class='store_map-block'><div id='map_city'>" + city + "</div><div id='map_info'><div class='map_info-item'><span class='map_info-item-key'>Адрес:</span><span class='map_info-item-value'>" + title + "</span></div><div class='map_info-item'><span class='map_info-item-key'>Время работы:</span><span class='map_info-item-value'>" + shedule + "</span></div><div class='map_info-item'><span class='map_info-item-key'>Телефон:</span><span class='map_info-item-value'><a href='tel:+" + phone + "'>" + phone + "</a></span></div></div><div id='map'></div></div>");


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

$(document).on('click', '.store_block', function (){
  let coordinates = $(this).attr("data-coordinates");
  let title = $(this).find(".store_block-title").text();
  let shedule = $(this).find(".store_block-shedule").text();
  let phone = $(this).attr("data-phone");
  let city = $(this).attr("data-city");
  let rsa_id = $(this).attr("data-rsa");

  getStoreToGeoMap(coordinates, city, title, shedule, phone, rsa_id);
})


$(document).on("click", ".store_map-bg", function(){
  $(".store_map").remove();
})

async function updateWalletData(onlyBalance) {
  if (!onlyBalance) onlyBalance = false;

  let lastId = 0;
  let walletData = JSON.parse(localStorage.getItem("LS_walletData_06"));
  if (walletData) {
    if (onlyBalance) {
      drawWalletData(walletData);
      drawPurchases(walletData.purchases);
    } else {
      if (walletData.purchases.length) lastId = walletData.purchases[0].id;
    }
  } else {
    walletData = {
      balance: 0,
      cardNumber: "",
      discount: 0,
      preferredDiscount: 0,
      discountValue: 0,
      purchases: []
    }
  }


  // Сперва подгружаем баланс и номер карты, затем отдельно транзакции
  getWalletData(lastId, onlyBalance).then(result => {
    if (result.status) {
      if (walletData.discountValue != result.data.discountValue || walletData.discount != result.data.discount || walletData.cardNumber != result.data.cardNumber || walletData.balance != result.data.balance || walletData.preferredDiscount != result.data.preferredDiscount) {
        walletData.cardNumber         = result.data.cardNumber;
        walletData.balance            = result.data.balance;
        walletData.discount           = result.data.discount;
        walletData.preferredDiscount  = result.data.preferredDiscount;
        walletData.discountValue      = result.data.discountValue;
        drawWalletData(walletData);
      }

      // Кешируем чеки при появлении новых
      if (result.data.purchases && result.data.purchases.length) walletData.purchases = result.data.purchases;
      // Отрисовываем чеки из кеша или при появлении новых
      if ((onlyBalance && walletData.purchases.length) || (!onlyBalance && result.data.purchases.length)) drawPurchases(walletData.purchases);

      if (result.data.cardNumber) localStorage.setItem("LS_walletData_06", JSON.stringify(walletData));

      if (onlyBalance || localStorage.getItem("section") == "wallet") walletUpdater = setTimeout(updateWalletData, 15000);
    }
  }).catch(error => {
    console.warn(error);
     //showPopup("Внимание", "Произошла ошибка при загрузке транзакций, попробуйте позже.");
    if (onlyBalance || localStorage.getItem("section") == "wallet") walletUpdater = setTimeout(updateWalletData, 15000);
  });
}

function drawWalletData(walletData) {
  if (walletData.cardNumber && cardNumber.innerText != walletData.cardNumber) {
    cardNumber.innerText = walletData.cardNumber;
    animate({
      duration: 1000,
      timing: quad,
      draw: function (progress, options) {
        cardNumber.style.opacity = progress;
      },
      callback: function (options) {}
    });

    if (qrcode.codeNumber != walletData.cardNumber) {
      if (qrcode.children.length) removeChildrens(qrcode);
      drawBonusCard(walletData.cardNumber);
    }
  }

  discountValue.innerText = walletData.discountValue + '%';

  let discountBalance = false;

  if (walletData.discount && walletData.preferredDiscount) {
    // Текущая: скидка, предпочитаемая: скидка
    cardType.innerText = "Дисконтная карта";
    cardInfo.innerText = "Ваша скидка";
    currencyType.innerText = "%";
    cardDataDiscount.style.display = "flex";
    // cardDataBonus.style.display = "none";
    discountBalance = true;
  } else if (!walletData.discount && !walletData.preferredDiscount) {
    // Текущая: бонусы, предпочитаемая: бонусы
    cardType.innerText = "Бонусная карта";
    cardInfo.innerText = "Баланс";
    currencyType.innerText = "бонусов";
    cardDataBonusPreffered.style.display = "none";
    // cardDataBonus.style.display = "none";
    cardDataDiscount.style.display = "none";
  } else if (!walletData.discount && walletData.preferredDiscount) {
    // Текущая: бонусы, предпочитаемая: скидка
    cardType.innerText = "Бонусная карта";
    cardInfo.innerText = "Баланс";
    currencyType.innerText = "бонусов";
    cardDataBonusPreffered.style.display = "none";
    // cardDataBonus.style.display = "none";
    cardDataDiscount.style.display = "none";
  } else if (walletData.discount && !walletData.preferredDiscount) {
    // Текущая: скидка, предпочитаемая: бонусы
    cardType.innerText = "Дисконтная карта";
    cardInfo.innerText = "Баланс";
    currencyType.innerText = "бонусов";
    // cardDataBonus.style.display = "flex";
    cardDataDiscount.style.display = "none";
  }

  if (walletData.discount != walletData.preferredDiscount) {
    changeDiscountSystem.style.display = "";
    changeDiscountSystemValue.innerText = (walletData.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ");
  } else {
    changeDiscountSystem.style.display = "none";
    changeDiscountSystemValue.innerText = "";
  }

  let balance = (walletData.discount && discountBalance) ? walletData.discountValue : walletData.balance;

  if (balance != undefined) {
    if (bonuses.innerText != balance) {
      bonuses.classList.remove("load");
      animate({
        duration: 1000,
        timing: quad,
        draw: function (progress, options) {
          bonuses.innerText = Math.ceil(balance * progress);
          bonuses.style.opacity = progress;
        },
        callback: function (options) {
          bonuses.innerText = balance;
        }
      });
    }
  } else {
    bonuses.innerText = "Не удалось загрузить с сервера.";
  }
}

function drawPurchases(purchases) {
  removeChildrens(transactions);

  purchases.forEach(purchase => {
    try {
      drawPurchase(purchase);
    } catch (error) {
      console.warn(error);
      showPopup("Внимание", "Произошла ошибка при визуализации транзакций, попробуйте позже.");
    }
  });
}

function drawPurchase(purchase) {
  // Контейнер
  let paymentElement = document.createElement("div");
  paymentElement.classList.add("payment");

  // Бонусы
  let paymentRowElement = null;
  let spanElement = null;

  if (Number(purchase.cashback_amount) != 0) {
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");

    spanElement = document.createElement("span");
    spanElement.classList.add("payment-amount");
    spanElement.style.fontWeight = "bold";
    spanElement.innerText = "+" + Number(purchase.cashback_amount) + " бонусов - ";
    paymentRowElement.appendChild(spanElement);

    spanElement = document.createElement("span");
    spanElement.classList.add("good");
    spanElement.innerText = "начисление";
    paymentRowElement.appendChild(spanElement);

    paymentElement.appendChild(paymentRowElement);
  }
  if (Number(purchase.payment_amount) != 0) {
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");

    spanElement = document.createElement("span");
    spanElement.classList.add("payment-amount");
    spanElement.style.fontWeight = "bold";
    spanElement.innerText = Number(purchase.payment_amount) + " бонусов - ";
    paymentRowElement.appendChild(spanElement);

    spanElement = document.createElement("span");
    spanElement.classList.add("bad");
    spanElement.innerText = "списание";
    paymentRowElement.appendChild(spanElement);

    paymentElement.appendChild(paymentRowElement);
  }
  if (Number(purchase.discount_amount) != 0) {
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");

    spanElement = document.createElement("span");
    spanElement.style.fontWeight = "bold";
    spanElement.innerText = Number(purchase.discount_amount) + " ₽, ";
    paymentRowElement.appendChild(spanElement);

    spanElement = document.createElement("span");
    spanElement.classList.add("good");
    spanElement.innerText = "скидка";
    paymentRowElement.appendChild(spanElement);

    paymentElement.appendChild(paymentRowElement);
  }

  // Дата
  paymentRowElement = document.createElement("div");
  paymentRowElement.classList.add("payment-row");

  spanElement = document.createElement("span");
  spanElement.classList.add("payment-amount");
  spanElement.innerText = "Дата: ";
  paymentRowElement.appendChild(spanElement);

  let date = new Date((purchase.operation_date).replace(new RegExp("-",'g'),"/"));

  spanElement = document.createElement("span");
  spanElement.innerText =
      (["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"])[date.getDay()] + ", "
      + String(date.getDate()) + " "
      + (["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"])[date.getMonth()] + " "
      + String(date.getFullYear()) + " года, "
      + String(date.getHours()) + ":"
      + (String(date.getMinutes()).length == 1 ? "0" : "") + String(date.getMinutes()) + ":"
      + (String(date.getSeconds()).length == 1 ? "0" : "") + String(date.getSeconds());
  paymentRowElement.appendChild(spanElement);

  paymentElement.appendChild(paymentRowElement);

  // Источник начисления
  paymentRowElement = document.createElement("div");
  paymentRowElement.classList.add("payment-row");

  spanElement = document.createElement("span");
  spanElement.classList.add("payment-amount");
  spanElement.innerText = "Источник: ";
  paymentRowElement.appendChild(spanElement);

  if (purchase.store_title && purchase.store_description) {
    paymentRowElement.appendChild(getGeolink(purchase.store_title, purchase.store_description));
  } else {
    spanElement = document.createElement("span");
    spanElement.innerText = purchase.store_title;
    paymentRowElement.appendChild(spanElement);
  }

  paymentElement.appendChild(paymentRowElement);

  // Детализация чека
  if (purchase.positions.length) {
    let paymentDetailsElement = document.createElement("details");
    paymentElement.appendChild(paymentDetailsElement);

    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");
    paymentRowElement.classList.add("neutral");
    paymentRowElement.classList.add("payment-details");
    paymentRowElement.classList.add("payment-header");
    ["Оплачено", "Скидка", "Начислено"].forEach(element => {
      let spanElement = document.createElement("span");
      spanElement.innerText = element;
      paymentRowElement.appendChild(spanElement);
    });
    paymentDetailsElement.appendChild(paymentRowElement);

    purchase.positions.forEach((position) => {
      paymentRowElement = document.createElement("div");
      paymentRowElement.classList.add("payment-row");
      paymentRowElement.classList.add("payment-details");
      paymentRowElement.classList.add("payment-header");

      let spanElement = undefined;
      spanElement = document.createElement("span");
      spanElement.innerText = Number(position.amount) + " ₽";
      spanElement.style.fontWeight = "bold";
      paymentRowElement.appendChild(spanElement);

      spanElement = document.createElement("span");
      if (Number(position.discount_amount)) {
        spanElement.innerText = Number(position.discount_amount) + " ₽";
      } else {
        spanElement.innerText = Number(position.payment_amount) + " бонусов";
      }

      paymentRowElement.appendChild(spanElement);
      paymentRowElement.classList.add("payment-position-amount");
      spanElement = document.createElement("span");
      spanElement.innerText = "+" + Number(position.cashback_amount) + " бонусов";
      spanElement.style.fontWeight = "bold";
      paymentRowElement.appendChild(spanElement);

      paymentDetailsElement.appendChild(paymentRowElement);

      paymentRowElement = document.createElement("div");
      paymentRowElement.classList.add("payment-row");
      paymentRowElement.classList.add("payment-position");
      paymentRowElement.innerText = (position.product_title ? position.product_title : "Загрузка..");
      paymentDetailsElement.appendChild(paymentRowElement);
    });
  }

  transactions.appendChild(paymentElement);
}

function drawBonusCard(cardNumber) {
  let cardImage = new Image();
  cardImage.loaded = false;
  cardImage.src = cardImageSRC;
  cardImage.addEventListener("load", (e) => {

    let qrCanvas = document.createElement("canvas");
    let qr = new QRious({
      element: qrCanvas,
      size: 128,
      value: cardNumber,
      foreground: "#4062b7"
    });

    qrcode.cardNumber = cardNumber;
    qrcode.appendChild(qrCanvas);
    qrcode.style.display = "";
    animate({
      duration: 1000,
      timing: quad,
      draw: function (progress, options) {
        qrcode.style.opacity = progress;
      },
      callback: function (options) {}
    });

    let cardCanvas = document.createElement("canvas");
    cardCanvas.width = cardImageW;
    cardCanvas.height = cardImageH;

    let cardCanvasCtx = cardCanvas.getContext("2d");
    cardCanvasCtx.imageSmoothingEnabled = false;
    cardCanvasCtx.drawImage(cardImage, 0, 0, cardImageW, cardImageH);
    cardCanvasCtx.drawImage(qrCanvas, 192, 48, 128, 128);

    cardCanvasCtx.font = '32px sans-serif';
    cardCanvasCtx.textAlign = 'center';
    cardCanvasCtx.fillText(cardNumber.substr(0,7), 256, 216);

    downloadCard.style.display = "";
    animate({
      duration: 1000,
      timing: quad,
      draw: function (progress, options) {
        downloadCard.style.opacity = progress;
      },
      callback: function (options) {}
    });

    downloadCard.addEventListener("click", () => {
      var dataURL = cardCanvas.toDataURL("image/jpeg");
      var link = document.createElement("a");
      link.href = dataURL;
      link.download = "Stolica - Bonus card - " + cardNumber + ".jpg";
      link.click();
    });
  });
}

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

async function checkAuthorization() {
  let body = {
    "method": "checkAuthorization"
  }

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  return result;
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

    let response = await fetch("/api", {
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
    trueDate = [td[2],td[1],td[0]].join("-");

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

  let body = {
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
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
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

    let response = await fetch("/api", {
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

    let response = await fetch("/api", {
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

    let response = await fetch("/api", {
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
        callback: function (options) {}
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

  let response = await fetch("/api", {
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
    showPopup("Внимание", result.description, null, null, function() {reset_confirmation_code.value = ""; reset_confirmation_code.focus();});
  }
}

async function getProfileData() {
  let body = {
    "method": "getProfileData"
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  return result;
}

async function getWalletData(lastId, onlyBalance) {
  if (!onlyBalance) onlyBalance = false;

  let body = {
    "method": "getWalletData",
    "data": {
      "last_id": lastId,
      "only_balance": onlyBalance,
      "source": 'website'
    }
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  return result;
}

async function getReferLink() {
  let body = {
    "method": "getReferLink"
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  return result;
}

async function getStores() {
  let body = {
    "method": "getStores"
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  return result;
}

async function getStoresList(city_id) {
  let body = {
    "method": "getStoresList",
    "city_id": city_id
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  $("#storesList").html('');

  result.data.forEach(city => {
    $("#storesList").append("<div class='store_block' data-rsa='" + city.rsa_id + "' data-coordinates='" + city.coordinates +"' data-phone='" + city.phone + "' data-city='" + city.city_name + "'><div class='store_block-title'>" + city.store_name +"</div><div class='store_block-shedule'>" + city.shedule + "</div><span class='show_store'>></span></div>");
  });
}

async function changeCard() {
  if (personal_new_card.value.length < 14) {
    attentionFocus(personal_new_card);
    return;
  }


  personal_changeCard_button.disabled = true;

  let body = {
    "method": "changeCard",
    "data": {
      "new_card": personal_new_card.value
    }
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();


  personal_changeCard_button.disabled = false;

  if (result.status) {
    if (result.description) showPopup("", result.description);
    personal_new_pass.value = "";
    personal_new_pass_confirmation.value = "";
  } else {
    if (result.description) showPopup("Внимание", result.description);
  }
}

async function changePassword() {
  let result = false;
  if (personal_new_pass.value.length == 0) {
    return result;
  }
  if (personal_new_pass.value.length > 0 && personal_new_pass.value.length < 6) {
    attentionFocus(personal_new_pass);
    return result;
  }

  if (personal_new_pass.value != personal_new_pass_confirmation.value) {
    attentionFocus(personal_new_pass_confirmation);
    return result;
  }


  personal_changePassword_button.disabled = true;

  let body = {
    "method": "changePassword",
    "data": {
      "new_password": personal_new_pass.value,
    }
  };


  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });


  result = await response.json();

  personal_changePassword_button.disabled = false;

  return result;

}

async function changeCardType() {

  let body = {
    "method": "changeCardType",
    "data": {
      "discount": document.querySelector('input[name="systemChange"]:checked').value,
    }
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  return result;

  // personal_changePassword_button.disabled = false;
  //
  // if (result.status) {
  //   if (result.description) showPopup("", result.description);
  // } else {
  //   if (result.description) showPopup("Внимание", result.description);
  // }

}

function changeProfileData(){
  let changePass = false;
  if (personal_new_pass.value.length > 0){
    changePassword().then(result => {
      if (result){
        if (result.status) {
          changePass = true;
        } else {
          showPopup("Внимание", result.description);
        }
      }
    });
    setTimeout(() => {
      if(changePass){
        changeCardType().then(result => {
          if(result.status){
            showPopup("", "Данные профиля изменены!");
          }
        });
      }
    }, 500);
  }
  else{
    changeCardType().then(result => {
      if(result.status){
        showPopup("", "Тип карты изменен!");
      }
    });
  }

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

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  if (result.status) {
    clearLocalStorage();

    localStorage.removeItem("section");

    location.reload();
  }

  return result;
}

async function updateCities() {
  if (!city.children.length) {
    let body = {
      "method": "getCities"
    };
  
    let response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(body)
    });
  
    let result = await response.json();
  
    if (result.status) {
      result.data.forEach(element => {
        let option = document.createElement("option");
        option.value = element.id;
        option.innerText = element.title;
        option.setAttribute("default-discount", element.default_discount);
        if (!element.default_discount) option.selected="selected";
        city.appendChild(option);
      });
    }
  }
}

async function setCard() {
  if (plasticNumber.value.length < 10) {
    showPopup("Внимание", "Не указан номер карты!");
    return;
  }

  showLoader();
  set_card.disabled = true;

  let body = {
    "method": "setCard",
    "data": {
      "card_number": plasticNumber.value,
    }
  };

  let response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  let result = await response.json();

  personal_changePassword_button.disabled = false;

  hideLoader();
  set_card.disabled = false;
  plasticNumber.value = "";

  if (result.status) {
    if (result.description) showPopup("", result.description);
  } else {
    if (result.description) showPopup("Внимание", result.description);
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
}

$(".system_tabs-head-item").click(function(){
  $(this).addClass("tab_h_active");
  $(this).siblings(".system_tabs-head-item").removeClass("tab_h_active");
  let tabIndex = $(".system_tabs-head-item").index(this);
  tabIndex++;

  $(".system_tabs-content-item").removeClass("tab_c_active");
  $(".system_tabs-content-item:nth-child("+ tabIndex +")").addClass("tab_c_active");
})

$(".system_tabs-head-item-change").click(function(){
  $(this).addClass("tab_h_active");
  $(this).siblings(".system_tabs-head-item-change").removeClass("tab_h_active");
  let tabIndex = $(".system_tabs-head-item-change").index(this);
  tabIndex++;

  $(".system_tabs-content-item-change").removeClass("tab_c_active");
  $(".system_tabs-content-item-change:nth-child("+ tabIndex +")").addClass("tab_c_active");
})