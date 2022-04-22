/* global C, d, SOURCE */

const cardImageW = 512,
      cardImageH = 328,
      cardImageSRC = "app/assets/backs/card_back.jpg";

function drawWallet(walletData) {
    if (!permitRedrawSection('wallet')) {
        return;
    }
    
    const cardEl   = C("#cardNumber"),
          qrEl     = C("#qrcode").el,
          typeEl   = C("#cardType"),
          infoEl   = C("#cardInfo"),
          curEl    = C("#currencyType"),
          bonusEl  = C("#bonuses"),
          systemEl = C("#changeDiscountSystemValue");
    
    if (walletData.cardNumber) {
        hide("#wallet-placeholder");
        hide("#wallet-loader");
        show("#wallet-data");

        if (walletData.cardNumber && cardEl.text !== walletData.cardNumber) {
            cardEl.text(walletData.cardNumber);
            
            if (qrEl.codeNumber !== walletData.cardNumber) {
                if (qrEl.children.length) {
                    removeChildrens(qrEl);
                }
                drawBonusCard(walletData.cardNumber);
            }
        }

        C("#discountValue").text(walletData.discountValue + '%');

        let discountBalance = false;

        if (walletData.discount && walletData.preferredDiscount) {
            // Текущая: скидка, предпочитаемая: скидка
            typeEl.text("Дисконтная карта");
            infoEl.text("Ваша скидка");
            curEl.text("%");
            discountBalance = true;
        } else if (!walletData.discount && !walletData.preferredDiscount) {
            // Текущая: бонусы, предпочитаемая: бонусы
            typeEl.text("Бонусная карта");
            infoEl.text("Баланс");
            curEl.text("бонусов");
            
            hide("#cardDataBonusPreffered");
            hide("#cardDataDiscount");
        } else if (!walletData.discount && walletData.preferredDiscount) {
            // Текущая: бонусы, предпочитаемая: скидка
            typeEl.text("Бонусная карта");
            infoEl.text("Баланс");
            curEl.text("бонусов");
            
            hide("#cardDataBonusPreffered");
            hide("#cardDataDiscount");
        } else if (walletData.discount && !walletData.preferredDiscount) {
            // Текущая: скидка, предпочитаемая: бонусы
            typeEl.text("Дисконтная карта");
            infoEl.text("Баланс");
            curEl.text("бонусов");
            
            hide("#cardDataDiscount");
        }

        if (walletData.discount !== walletData.preferredDiscount) {
            show("#changeDiscountSystem");
            systemEl.text((walletData.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ"));
        } else {
            hide("#changeDiscountSystem");
            systemEl.text("");
        }
        
        const balance = (walletData.discount && discountBalance) ? walletData.discountValue : walletData.balance;
        if (balance !== undefined) {
            if (bonusEl.text !== balance) {
                bonusEl.el.classList.remove("load");
                
                for (let i = 1; i < 101; i=i+3) {
                    promiseTimeout(() => {
                        bonusEl.text(Math.trunc(balance * (i/100)));
                    }, (10*i));
                }
                promiseTimeout(() => {
                    bonusEl.text(Math.trunc(balance));
                }, 1000);
            }
            
            let activation = 0;

            if (walletData.activation !== undefined) {
                const blockBalanceEl = C().create("div"),
                      dateField      = C().create("span"),
                      amountField    = C().create("span"),
                      bonusField     = C().create("span");
                let today = new Date();
                
                //document.querySelector(".wallet__balanceDetail").style.display = "block";
                show(".wallet__balanceDetail");
                activation = Math.trunc(walletData.activation);
                
                today.setDate(today.getDate()+1);
                                
                dateField.text(today.toLocaleString('ru-Ru').replace(", ", "\r\n"));
                amountField.text("+" + activation);
                bonusField.text(" бонусов (активация)");
                
                blockBalanceEl.el.append(dateField.el);
                amountField.el.append(bonusField.el);
                blockBalanceEl.el.append(amountField.el);

                C(".balance-view").el.append(blockBalanceEl.el);
            }
            C("#currentBalance").html(Math.trunc((balance - activation)));
            
            if (walletData.life_times !== undefined) {
                //document.querySelector(".wallet__balanceDetail").style.display = "block";
                show(".wallet__balanceDetail");

                walletData.life_times.forEach((el) => {
                    const blockBalanceEl = C().create("div"),
                          dateField      = C().create("span"),
                          amountField    = C().create("span"),
                          bonusField     = C().create("span");
                    
                    dateField.text(new Date(el.date).toLocaleString('ru-Ru').replace(", ", "\r\n"));
                    amountField.text((el.amount > 0 ? "+" : "") + Math.trunc(el.amount));
                    bonusField.text(" бонусов (" + (el.amount > 0 ? "активация" : "списание") + ")");
                    
                    blockBalanceEl.el.append(dateField.el);
                    amountField.el.append(bonusField.el);
                    blockBalanceEl.el.append(amountField.el);

                    C(".balance-view").el.append(blockBalanceEl.el);
                });
            }
        } else {
            bonusEl.text("Не удалось загрузить с сервера.");
        }
        
    } else {
        show("#wallet-placeholder");
        show("#wallet-loader");
        hide("#wallet-data");
    }
}

function drawPurchases(purchases) {
    if (!purchases) {
        return false;
    }
    
    purchases.forEach((purchase) => drawPurchase(purchase));
    
    C("div[data-disable-purchase]").els.forEach((el) => {
            el.addEventListener("click", () => disablePurchase(el.dataset.disablePurchase));
    });
}

async function disablePurchase(id) {
    //showPopup(title, desc, message, buttonText, callback)
    showPopup('','', 'Вы уверены, что хотите скрыть чек? <p><small>Для того, чтобы вернуть чек напишите в <a href="#" onClick="showFeedback();return false;">службу технической поддержки</a>.</small></p>', ["Да","Нет"], async () => {
        let result = await api("disablePurchase", {
                                id
                            });

        let purEl = C("div[data-purchase-id='" + id + "']").el;
        purEl.classList.remove("animated", "animate__fadeIn");
        purEl.classList.add("animated", "animate__fadeOut");
        promiseTimeout(() => {
            purEl.classList.add("hudden");
        }, 1000);
        return result;
    });
}

function drawPurchase(purchase) {
    const totalDisc = Math.trunc(Math.abs(purchase.discount_amount) + Math.abs(purchase.payment_amount)),
          cashback  = Math.trunc(purchase.cashback_amount),
          amount    = Math.trunc(purchase.payment_amount),
          date      = new Date((purchase.operation_date).replace(new RegExp("-", 'g'), "/")),
          dater     = (["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"])[date.getDay()] + ", "
                        + String(date.getDate()) + " "
                        + (["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"])[date.getMonth()] + " "
                        + String(date.getFullYear()) + " года, "
                        + String(date.getHours()) + ":"
                        + (String(date.getMinutes()).length === 1 ? "0" : "") + String(date.getMinutes()) + ":"
                        + (String(date.getSeconds()).length === 1 ? "0" : "") + String(date.getSeconds()),
          refund = (!purchase.operation_type) ? '<span class="bad b" style="font-size: 12px;text-align: right;">чек возврата</span>' : '',
          linkStore = (purchase.store_title && purchase.store_description) ? '<span class="ymaps-geolink" data-description="' + purchase.store_description + '">' + purchase.store_title + '</span>' : '<span>' + purchase.store_title + '</span>';
    let tempDetails = "";
    
    // Детализация чека
    if (purchase.positions.length) {
        let tempPositions = '';

        purchase.positions.forEach((position) => {
            let posCashAmount = Math.trunc(position.cashback_amount);

            tempPositions += `<div class="payment-details important">
                                <span>${Math.trunc(position.cost)} руб</span>
                                <span>${((position.discount_amount) ? (Math.trunc(position.discount_amount * -1) + " руб") : (Math.trunc(position.payment_amount) + " бонусов"))}</span>
                                <span>${(posCashAmount > 0 ? "+" : "")}${posCashAmount} бонусов</span>
                            </div>
                            <div class="payment-details payment-details-full">${(position.product_title ? position.product_title : "Загрузка..")}</div>`;
        });
        
        tempDetails = `<details>
                        <summary>Подробнее</summary>
                        <div class="details-data">
                            <div class="payment-details neutral">
                                <span>Оплачено</span>
                                <span>Скидка</span>
                                <span>Начислено</span>
                            </div>
                            ${tempPositions}
                        </div>
                    </details>`;

    }
    
    const temp = `<div class="animated animate__fadeIn" data-purchase-id="${purchase.id}">
                    <div>
                        <span class="b">Всего скидка: </span>
                        <span class="bad">${(totalDisc ? "-" : "")}${totalDisc} руб</span>
                        ${refund}
                    </div>
                    <div>
                        <span class="payment-amount b" style="margin-left: 20px;">из них бонусами: </span>
                        <span class="bad">${amount}</span>
                    </div>
                    <div>
                        <span class="payment-amount b">Начислено бонусов: </span>
                        <span class="good">${(cashback > 0 ? "+" : "")}${cashback}</span>
                    </div>
                    <div class="payment-row-date">
                        <span class="payment-amount">Дата: </span>
                        <span>${dater}</span>
                    </div>
                    <div class="payment-row-date">
                        <span class="payment-amount">Магазин: </span>
                        <div>
                            ${linkStore}
                        </div>
                    </div>
                    <div class="delete" data-disable-purchase="${purchase.id}">Удалить</div>
                    ${tempDetails}
                </div>`;
    
    const payEl = C().strToNode(temp);
    C("#transactions").el.prepend(payEl.el);
}

function drawBonusCard(cardNumber) {
    const cardImg  = new Image(),
          qrEl     = C("#qrcode"),
          qrCanvas = C().create("img"),
          qr = new QRious({
                element: qrCanvas.el,
                size: 256,
                value: cardNumber,
                foreground: "#4062b7"
            });

    qrCanvas.el.width = "128";
    qrCanvas.el.height = "128";
    qrEl.el.cardNumber = cardNumber;
    qrEl.append(qrCanvas);

    show("#qrcode");
    
    cardImg.loaded = false;
    cardImg.src = cardImageSRC;
    cardImg.addEventListener("load", () => {
        const cardCanvas = d.createElement("canvas");
        cardCanvas.width = cardImageW;
        cardCanvas.height = cardImageH;

        const cardCanvasCtx = cardCanvas.getContext("2d");
        cardCanvasCtx.imageSmoothingEnabled = false;
        cardCanvasCtx.drawImage(cardImg, 0, 0, cardImageW, cardImageH);
        cardCanvasCtx.drawImage(qrCanvas.el, 192, 48, 128, 128);

        cardCanvasCtx.font = '32px sans-serif';
        cardCanvasCtx.textAlign = 'center';
        cardCanvasCtx.fillText(cardNumber.substr(0, 7), 256, 216);
        
        show("#downloadCard");

        C("#downloadCard").el.addEventListener("click", () => {
            const dataURL  = cardCanvasCtx.canvas.toDataURL("image/jpeg"),
                  fileName = "Stolica - Bonus card - " + cardNumber + ".jpg",
                  link     = d.createElement("a");

            link.href = dataURL;
            link.download = fileName;
            if (!SOURCE) {
                link.click();
            } else {
                const blob = dataURItoBlob(dataURL);
                download(fileName, blob, blob.type);
            }
        });
    });
}

function download(filename, data, mimeType) {
  const blob = new Blob([data], {
                type: mimeType
              });

    document.addEventListener("deviceready", function() {
      let storageLocation = "";

      switch (device.platform) {
        case "Android":
          storageLocation = cordova.file.externalRootDirectory + "Download/";
          break;

        case "iOS":
          storageLocation = cordova.file.documentsDirectory;
          break;
      }

      const folderPath = storageLocation;

      window.resolveLocalFileSystemURL(
        folderPath,
        function(dir) {
          dir.getFile(
            filename,
            {
              create: true
            },
            function(file) {
              file.createWriter(
                function(fileWriter) {
                  fileWriter.write(blob);

                  fileWriter.onwriteend = function() {
                    showPopup("Успешно", "", "Бонусная карта выгружена в память телефона");
                  };

                  fileWriter.onerror = function(err) {
                    console.error(JSON.stringify(err));
                  };
                },
                function(err) {
                  console.error(JSON.stringify(err));
                }
              );
            },
            function(err) {
              console.error(JSON.stringify(err));
            }
          );
        },
        function(err) {
          console.error(JSON.stringify(err));
        }
      );
    });
}

function dataURItoBlob(dataURI) {
  const isBase64 = dataURI.split(",")[0].split(";")[1] === "base64";
  let byteString;

  if (isBase64) {
    byteString = atob(dataURI.split(",")[1]);
  } else {
    byteString = dataURI.split(",")[1];
  }

  let mimeString = dataURI
    .split(",")[0]
    .split(":")[1]
    .split(";")[0];

  const ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  var blob = new Blob([ab], {
    type: mimeString
  });

  return blob;
}

if (SOURCE) {
    document.addEventListener("deviceready", function() {
      let storageLocation = "";

      if (device.platform === "Android") {
          var permissions = cordova.plugins.permissions;
            var list = [
              permissions.WRITE_EXTERNAL_STORAGE,
              permissions.READ_EXTERNAL_STORAGE,
              permissions.MANAGE_EXTERNAL_STORAGE
            ];

            permissions.hasPermission(list, function( status ){
                                                if( !status.hasPermission ) {
                                                  permissions.requestPermissions(
                                                    list,
                                                    function(status) {
                                                      if( !status.hasPermission ) error();
                                                    },
                                                    error);
                                                }
                                              });

            function error() {
              console.warn('Storage permission is not turned on');
            }

            function success( status ) {
              if( !status.hasPermission ) {

                permissions.requestPermissions(
                  list,
                  function(status) {
                    if( !status.hasPermission ) error();
                  },
                  error);
              }
            }
        }
    });
}