/* global C, Intl, d, cardImageSRC, cardImageW, cardImageH */

function drawWallet(walletData) {
    if (!permitRedrawSection('wallet')) {
        return;
    }
    
    let cardEl   = C("#cardNumber"),
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
            
            C("#cardDataDiscount").el.style.display = "flex";
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
        
        let balance = (walletData.discount && discountBalance) ? walletData.discountValue : walletData.balance;
        if (balance !== undefined) {
            if (bonusEl.text !== balance) {
                bonusEl.el.classList.remove("load");
                
                for (let i = 1; i < 101; i=i+3) {
                    promiseTimeout(function(){
                        bonusEl.text(Math.trunc(balance * (i/100)));
                    }, (10*i));
                }
                promiseTimeout(function(){
                    bonusEl.text(Math.trunc(balance));
                }, 1000);
            }
            
            var activation = 0;

            if (walletData.activation !== undefined) {
                let blockBalanceEl = C().create("div"),
                    dateField      = C().create("span"),
                    amountField    = C().create("span"),
                    bonusField     = C().create("span");
                
                //document.querySelector(".wallet__balanceDetail").style.display = "block";
                show(".wallet__balanceDetail");
                activation = Math.trunc(walletData.activation);
                
                var today = new Date();
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

                walletData.life_times.forEach(el => {
                    let blockBalanceEl = C().create("div"),
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
    
    purchases.forEach(purchase => drawPurchase(purchase));
}

function drawPurchase(purchase) {
    let totalDisc = Math.trunc(Math.abs(purchase.discount_amount) + Math.abs(purchase.payment_amount)),
        cashback  = Math.trunc(purchase.cashback_amount),
        amount    = Math.trunc(purchase.payment_amount),
        date      = new Date((purchase.operation_date).replace(new RegExp("-", 'g'), "/")),
        dater     = (["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"])[date.getDay()] + ", "
                    + String(date.getDate()) + " "
                    + (["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"])[date.getMonth()] + " "
                    + String(date.getFullYear()) + " года, "
                    + String(date.getHours()) + ":"
                    + (String(date.getMinutes()).length === 1 ? "0" : "") + String(date.getMinutes()) + ":"
                    + (String(date.getSeconds()).length === 1 ? "0" : "") + String(date.getSeconds());

    let refund = (!purchase.operation_type) ? '<span class="bad b" style="font-size: 12px;text-align: right;">чек возврата</span>' : '';
    let linkStore = (purchase.store_title && purchase.store_description) ? '<span class="ymaps-geolink" data-description="' + purchase.store_description + '">' + purchase.store_title + '</span>' : '<span>' + purchase.store_title + '</span>';
    let tempDetails     = "";
    
    // Детализация чека
    if (purchase.positions.length) {
        let tempPositions = '';

        purchase.positions.forEach((position) => {
            let posCashAmount = Math.trunc(position.cashback_amount);

            tempPositions += '<div class="payment-details important">\n\
                                <span>' + Math.trunc(position.cost) + ' руб</span>\n\
                                <span>' + ((position.discount_amount) ? (Math.trunc(position.discount_amount * -1) + " руб") : (Math.trunc(position.payment_amount) + " бонусов")) + '</span>\n\
                                <span>' + (posCashAmount > 0 ? "+" : "") + posCashAmount + ' бонусов</span>\n\
                        </div>\n\
                        <div class="payment-details payment-details-full">' + (position.product_title ? position.product_title : "Загрузка..") + '</div>\n\
                        ';
        });
        
        tempDetails = '<details>\n\
                        <summary>Подробнее</summary>\n\
                        <div class="details-data">\n\
                            <div class="payment-details neutral">\n\
                                <span>Оплачено</span>\n\
                                <span>Скидка</span>\n\
                                <span>Начислено</span>\n\
                            </div>\n\
                            ' + tempPositions + '\n\
                        </div>\n\
                    </details>';

    }
    
    const temp = '<div class="animate__animated animate__fadeIn">\n\
                    <div>\n\
                        <span class="b">Всего скидка: </span>\n\
                        <span class="bad">' + (totalDisc ? "-" : "") + totalDisc + ' руб</span>\n\
                        ' + refund + '\n\
                    </div>\n\
                    <div>\n\
                        <span class="payment-amount b" style="margin-left: 20px;">из них бонусами: </span>\n\
                        <span class="bad">' + amount + '</span>\n\
                    </div>\n\
                    <div>\n\
                        <span class="payment-amount b">Начислено бонусов: </span>\n\
                        <span class="good">' + (cashback > 0 ? "+" : "") + cashback + '</span>\n\
                    </div>\n\
                    <div class="payment-row-date">\n\
                        <span class="payment-amount">Дата: </span>\n\
                        <span>' + dater + '</span>\n\
                    </div>\n\
                    <div class="payment-row-date">\n\
                        <span class="payment-amount">Магазин: </span>\n\
                        <div>\n\
                            ' + linkStore + '\n\
                        </div>\n\
                    </div>\n\
                    ' + tempDetails + '\n\
                </div>';
    
    let payEl = C().strToNode(temp);
    C("#transactions").el.prepend(payEl.el);
}

function drawBonusCard(cardNumber) {
    let cardImg = new Image(),
        qrEl    = C("#qrcode");
    
    cardImg.loaded = false;
    cardImg.src = cardImageSRC;
    cardImg.addEventListener("load", () => {
        let qrCanvas = C().create("img"),
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
            var dataURL = cardCanvas.toDataURL("image/jpeg"),
                link = d.createElement("a");
            link.href = dataURL;
            link.download = "Stolica - Bonus card - " + cardNumber + ".jpg";
            link.click();
        });
    });
}
