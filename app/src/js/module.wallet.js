/* global C, d, SOURCE, Intl */

const cardImageW = 512,
      cardImageH = 328,
      cardImageSRC = "app/assets/backs/card_back.jpg";

function yana(val, plus, notnull) {
    let format = new Intl.NumberFormat('ru-RU').format(Math.trunc(val));
    
    if (notnull) {
        return "";
    }
    
    if (plus && val > 0) {
        return plus + format;
    }
    
    return format;
}

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
        
        C(".nearBurn").el.style.display = "none";
        
        if (walletData.lifeTimes && walletData.lifeTimes.length > 0) {
            let listBurns = walletData.lifeTimes,
                sumBurns  = 0;

            listBurns.forEach((ob) => {
                if (ob.amount < 0) {
                    sumBurns += ob.amount;
                }
            });
            
            if (sumBurns < 0) {
                C(".nearBurn span").text(yana(Math.abs(sumBurns/100)));
                C(".nearBurn").el.style.display = "block";
            }
        }
        
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
                        bonusEl.text(yana(balance * (i/100)));
                    }, (10*i));
                }
                promiseTimeout(() => {
                    bonusEl.text(yana(balance));
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
                activation = walletData.activation;
                
                today.setDate(today.getDate()+1);
                                
                dateField.text(today.toLocaleString('ru-Ru').replace(", ", "\r\n"));
                amountField.text("+" + activation);
                bonusField.text(" бонусов (активация)");
                
                blockBalanceEl.el.append(dateField.el);
                amountField.el.append(bonusField.el);
                blockBalanceEl.el.append(amountField.el);

                C(".balance-view").el.append(blockBalanceEl.el);
            }
            C("#currentBalance").html(yana((balance - activation)));
        } else {
            bonusEl.text("Не удалось загрузить с сервера.");
        }
        
    } else {
        show("#wallet-placeholder");
        show("#wallet-loader");
        hide("#wallet-data");
    }
}

function drawPurchases(purchases, transactions) {
    if (!purchases && !transactions) {
        return false;
    }
    
    const tempTransactions = transactions.reduce(function(acc, el, i, arr) {
        acc.push({ id: el.id,
                   operation_date: el.date, 
                   store_title: el.description,
                   store_description: el.type,
                   cashback_amount: (el.amount/100),
                   date: new Date(el.date) });
        return acc;
    }, []);
    
    let tempPurchases = purchases.reduce(function(acc, el, i, arr) {
        el.date = new Date(el.operation_date);
        acc.push(el);
        return acc;
    }, []);
    
    tempPurchases.push(...tempTransactions);
    
    const sortList = tempPurchases.sort((a, b) => a.date - b.date);
    
    sortList.forEach((purchase) => drawPurchase(purchase));
    
    C("span[data-disable-purchase]").els.forEach((el) => {
        let type = (el.classList.contains("purch")) ? "purch" : "trans";
        el.addEventListener("click", () => disablePurchase(el.dataset.disablePurchase, type));
    });
}

async function disablePurchase(id, type) {
    showPopup('', 
              '', 
              'Вы уверены, что хотите скрыть чек? <p><small>Для того, чтобы вернуть чек напишите в <a href="#" onClick="showFeedback();return false;">службу технической поддержки</a>.</small></p>', 
              ["Да", "Нет"], 
              async () => {
                        let apiMethod = (type==="purch") ? "disablePurchase" : "disableTransaction";
                        let result    = await api(apiMethod, {id});
                        let purEl     = C("div[data-purchase-id='" + id + "']");

                        purEl.delclass(["animated", "animate__fadeIn"]);
                        purEl.addclass(["animated", "animate__fadeOut"]);
                        promiseTimeout(() => {
                            purEl.addclass("hudden");
                            hide('[data-purchase-id="' + id + '"]');
                        }, 1000);
                        
                        return result;
                    });
}

function drawPurchase(purchase) {
    const {discount_amount, payment_amount, cashback_amount, store_description} = purchase;
    const totalDisc = (discount_amount || payment_amount) ? "-" + yana(Math.abs(discount_amount) + Math.abs(payment_amount)) : "",
          cashback  = (cashback_amount > 0) ? "+" + yana(cashback_amount) : yana(cashback_amount),
          amount    = payment_amount ? yana(payment_amount) : "",
          onlyDate  = purchase.operation_date.substr(0, 10).split("-").reverse().join("."),
          refund    = (!purchase.operation_type) ? '<span class="bad" style="font-size: 12px;text-align: right;">чек возврата</span>' : '',
          linkStore = '<span>' + purchase.store_title + '</span>';
    let tempPositions = '',
        tempOld       = '';

    if (purchase.positions && purchase.positions.length) {

        purchase.positions.forEach((position) => {
            const {cashback_amount, count, cost, product_title, discount_amount, payment_amount} = position;
            let counter = "_";
                
            if (count) {
                let tmpCounter = count.split(".");
                counter = tmpCounter[1] > 0 ? count : tmpCounter[0];
            }
            
            let discount  = discount_amount ? (yana(discount_amount, "-") + " руб") : (yana(payment_amount) + " бонусов");
            tempPositions += `<div class="payment-details payment-details-full">
                                <span>
                                    ${(product_title || "Загрузка..")}
                                </span>
                                <span>
                                    x ${counter} шт
                                </span>
                            </div>
                            <div class="payment-details import">
                                <span class="b">${yana(cost)} руб</span>
                                <span class="bad b">${discount}</span>
                                <span class="good b">${yana(cashback_amount, "+")} Б</span>
                            </div>`;
        });
    }
    
    let icon = "basket",
        name = "Покупка";
    
    if (store_description==="Expiration") {
        icon = "clock";
        name = "Сгорание";
    }
    
    if (store_description==="Bonus") {
        icon = "gift";
        name = "Подарок";
    }
    
    let type = {icon, name}
    
    if (purchase.positions) {
        tempOld = ` <h4><center>Детализация</center></h4>
                    <div class="payment-row-date">
                        <span>${onlyDate}</span>
                        <span><i class="icon-cancel" onClick="closePositions()"></i></span>
                    </div>
                    <div class="payment-row">
                        <span>Всего скидка: </span>
                        <span class="bad">${totalDisc} <span>Р</span></span>
                        ${refund}
                    </div>
                    <div class="payment-row">
                        <span class="payment-amount" style="margin-left: 20px;">из них бонусами: </span>
                        <span class="bad">${(amount ? (amount + " <span>Б</span>") : "")}</span>
                    </div>
                    <div class="payment-row">
                        <span class="payment-amount">Начислено бонусов: </span>
                        <span class="good">${(cashback ? (cashback + " <span>Б</span>") : "")}</span>
                    </div>
                    <div class="payment-row-store">
                        <span class="payment-amount">Магазин: </span>
                        <span>
                            ${linkStore}
                        </span>
                    </div>
                    <div class="payment-details important">
                        <span>Оплачено</span>
                        <span>Скидка</span>
                        <span>Начислено</span>
                    </div>
                    ${tempPositions}
                    <center><button onClick="closePositions()">Закрыть</button></center>`;
        }
        
    let typeTrans = type.name==="Покупка" ? "purch" : "trans";
    const disablePurchase = purchase.id ? `<span class="delete ${typeTrans}" data-disable-purchase="${purchase.id}"><i class="icon-cancel"></i></span>` : '';
    const temp = `<div class="animated animate__fadeIn" data-purchase-id="${purchase.id}">
                    <div>
                        <span>${onlyDate}</span>
                        <span>&nbsp;</span>
                        ${disablePurchase}
                    </div>
                    <div class="purchase__row">
                        <span class="type"><span class="ring"><i class="${type.icon}"></i></span> <span>${type.name}</span></span>
                        <span class="bad">${(amount ? (amount + " <span>Б</span>") : "")}</span>
                        <span class="${(cashback_amount > 0 ? "good" : "bad")}">${(cashback ? (cashback + " <span>Б</span>") : "")}</span>
                    </div>
                </div>`;
    
    const elList = C().strToNode(temp).el;
    C("#transactions").el.prepend(elList);
    
    if (purchase.positions) {
        C(".purchase__row", elList).el.addEventListener("click", () => fillOverlay(tempOld));
    }
}

function fillOverlay(html) {
    const el = C(".positionOverlay");

    show(".positionOverlay");
    C(".positionOverlay__cont").html(html);
    d.body.classList.add("hideOverflow");
}

function openNearBurning() {
    if (!isEmpty(C().getStor(LS_CONTENTS))) {
        const contents = JSON.parse(C().getStor(LS_CONTENTS)),
              burnList = contents.wallet.lifeTimes;
        let burnHtml     = '',
            burnListHtml = '';
        
        burnList.forEach((ob) => {
            const date   = ob.date.split("T")[0].split("-").reverse().join("."),
                  amount = ob.amount / 100;
            if (amount < 0) {
                burnListHtml += `<div class="payment-burn">
                                    <span>Дата сгорания:</span>
                                    <span class="bad">${date}</span>
                                </div>
                                <div class="payment-row-amount bad">${yana(amount)} <span>Б</span></div>`;
            }
        });
        
        burnHtml = `<h4><center>Ближайшие сгорания</center></h4>
                        <div class="close-positions"><i class="icon-cancel" onClick="closePositions()"></i></div>
                        ${burnListHtml}
                    <center><button onClick="closePositions()">Закрыть</button></center>`;
        
        fillOverlay(burnHtml);
    }
}

function closePositions() {
    C(".positionOverlay__cont").html("");
    hide(".positionOverlay");
    d.body.classList.remove("hideOverflow");
}

function drawBonusCard(cardNumber) {
    const qrEl = C("#qrcode");
    let cardImg  = new Image(),
        qrCanvas = C().create("img"),
        qr = new QRious({
              element: qrCanvas.el,
              size: 256,
              value: cardNumber,
              foreground: "#4062b7"
          });

    qrCanvas.el.width  = "128";
    qrCanvas.el.height = "128";
    qrEl.el.cardNumber = cardNumber;
    qrEl.append(qrCanvas);

    show("#qrcode");
    
    cardImg.loaded = false;
    cardImg.src = cardImageSRC;
    cardImg.addEventListener("load", () => {
        let cardCanvas = d.createElement("canvas");
        cardCanvas.width = cardImageW;
        cardCanvas.height = cardImageH;

        let cardCanvasCtx = cardCanvas.getContext("2d");
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