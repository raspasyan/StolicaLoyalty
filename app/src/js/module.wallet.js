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
    if (!permitRedrawSection('wallet')) {
        return;
    }
    
   if (!purchases) {
        return false;
    }
    purchases.forEach(purchase => drawPurchase(purchase));
}

function drawPurchase(purchase) {
    let payEl     = C().create("div"),
        payRowEl  = C().create("div"),
        spanEl    = C().create("span"),
        totalDisc = Math.trunc(Math.abs(purchase.discount_amount) + Math.abs(purchase.payment_amount));

    payEl.addclass(["animate__animated", "animate__fadeIn"]);
    spanEl.el.style.fontWeight = "bold";
    spanEl.text("Всего скидка: ");
    payRowEl.append(spanEl);

    spanEl = C().create("span");
    spanEl.addclass("bad");
    spanEl.text((totalDisc ? "-" : "") + totalDisc + " руб");
    payRowEl.append(spanEl);

    // Чек-возврата
    if (!purchase.operation_type) {
        spanEl = C().create("span");
        spanEl.addclass("bad");
        spanEl.style("fontWeight", "bold");
        spanEl.style("textAlign", "right");
        spanEl.style("fontSize", "12px");
        spanEl.text("чек возврата");
        payRowEl.append(spanEl);
    }

    payEl.append(payRowEl);

    payRowEl = C().create("div");
    spanEl = C().create("span");
    spanEl.addclass("payment-amount");
    spanEl.style("fontWeight", "bold");
    spanEl.style("marginLeft", "20px");
    spanEl.text("из них бонусами: ");
    payRowEl.append(spanEl);

    spanEl = C().create("span");
    spanEl.addclass("bad");
    spanEl.text(Math.trunc(purchase.payment_amount));
    payRowEl.append(spanEl);

    payEl.append(payRowEl);

    // Начислено бонусов
    payRowEl = C().create("div");

    spanEl = C().create("span");
    spanEl.addclass("payment-amount");
    spanEl.style("fontWeight", "bold");
    spanEl.text("Начислено бонусов: ");
    payRowEl.append(spanEl);

    let cashbackAmount = Math.trunc(purchase.cashback_amount);
    spanEl = C().create("span");
    spanEl.addclass("good");
    spanEl.text((cashbackAmount > 0 ? "+" : "") + cashbackAmount);
    payRowEl.append(spanEl);

    payEl.append(payRowEl);

    // Дата
    payRowEl = C().create("div");
    payRowEl.addclass("payment-row-date");

    spanEl = C().create("span");
    spanEl.addclass("payment-amount");
    spanEl.text("Дата: ");
    payRowEl.append(spanEl);

    let date = new Date((purchase.operation_date).replace(new RegExp("-", 'g'), "/"));

    spanEl = C().create("span");
    spanEl.text(
        (["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"])[date.getDay()] + ", "
        + String(date.getDate()) + " "
        + (["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"])[date.getMonth()] + " "
        + String(date.getFullYear()) + " года, "
        + String(date.getHours()) + ":"
        + (String(date.getMinutes()).length === 1 ? "0" : "") + String(date.getMinutes()) + ":"
        + (String(date.getSeconds()).length === 1 ? "0" : "") + String(date.getSeconds()));
    payRowEl.append(spanEl);

    payEl.append(payRowEl);

    // Источник начисления
    payRowEl = C().create("div");
    payRowEl.addclass("payment-row-date");

    spanEl = C().create("span");
    spanEl.addclass("payment-amount");
    spanEl.text("Магазин: ");
    payRowEl.append(spanEl);

    if (purchase.store_title && purchase.store_description) {
        payRowEl.append(getGeolink(purchase.store_title, purchase.store_description));
    } else {
        spanEl = C().create("span");
        spanEl.text(purchase.store_title);
        payRowEl.append(spanEl);
    }

    payEl.append(payRowEl);

    // Детализация чека
    if (purchase.positions.length) {
        let payDetailsEl = C().create("details"),
            sumEl        = C().create("summary"),
            detDataEl    = C().create("div"),
            payRowEl     = C().create("div");
        
        payEl.append(payDetailsEl);

        sumEl.text("Подробнее");
        payDetailsEl.append(sumEl);

        detDataEl.addclass("details-data");
        payDetailsEl.append(detDataEl); 

        payRowEl.addclass(["payment-details", "neutral"]);
        
        ["Оплачено", "Скидка", "Начислено"].forEach(element => {
            let spanEl = C().create("span");
            spanEl.text(element);
            payRowEl.append(spanEl);
        });
        detDataEl.append(payRowEl);

        purchase.positions.forEach((position) => {
            let spanEl   = C().create("span"),
                payRowEl = C().create("div");
                
            payRowEl.addclass(["payment-details", "important"]);
            spanEl.text(Math.trunc(position.cost) + " руб");
            payRowEl.append(spanEl);

            spanEl = C().create("span");
            if (position.discount_amount) {
                spanEl.text(Math.trunc(position.discount_amount * -1) + " руб");
            } else {
                spanEl.text(Math.trunc(position.payment_amount) + " бонусов");
            }

            let posCashAmount = Math.trunc(position.cashback_amount);
            payRowEl.append(spanEl);
            spanEl = C().create("span");
            spanEl.text((posCashAmount > 0 ? "+" : "") + posCashAmount + " бонусов");
            payRowEl.append(spanEl);

            detDataEl.append(payRowEl);

            payRowEl = C().create("div");
            payRowEl.addclass(["payment-details", "payment-details-full"]);
            payRowEl.text((position.product_title ? position.product_title : "Загрузка.."));
            detDataEl.append(payRowEl);
        });
    }

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

function getGeolink(title, desc) {
    let wrap   = C().create("div"),
        linkEl = C().create("span");

    linkEl.addclass("ymaps-geolink");
    linkEl.attr("data-description", desc);
    linkEl.text(title);

    wrap.append(linkEl);

    return wrap;
}
