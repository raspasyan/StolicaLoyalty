function drawWallet(walletData) {
    if (walletData.cardNumber) {
        document.getElementById("wallet-placeholder").style.display = "none";
        document.getElementById("wallet-loader").style.display = "none";
        document.getElementById("wallet-data").style.display = "";

        if (walletData.cardNumber && cardNumber.innerText != walletData.cardNumber) {
            cardNumber.innerText = walletData.cardNumber;
            animate({
                duration: 1000,
                timing: quad,
                draw: function (progress, options) {
                    cardNumber.style.opacity = progress;
                },
                callback: function () { }
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
            discountBalance = true;
        } else if (!walletData.discount && !walletData.preferredDiscount) {
            // Текущая: бонусы, предпочитаемая: бонусы
            cardType.innerText = "Бонусная карта";
            cardInfo.innerText = "Баланс";
            currencyType.innerText = "бонусов";
            cardDataBonusPreffered.style.display = "none";
            cardDataDiscount.style.display = "none";
        } else if (!walletData.discount && walletData.preferredDiscount) {
            // Текущая: бонусы, предпочитаемая: скидка
            cardType.innerText = "Бонусная карта";
            cardInfo.innerText = "Баланс";
            currencyType.innerText = "бонусов";
            cardDataBonusPreffered.style.display = "none";
            cardDataDiscount.style.display = "none";
        } else if (walletData.discount && !walletData.preferredDiscount) {
            // Текущая: скидка, предпочитаемая: бонусы
            cardType.innerText = "Дисконтная карта";
            cardInfo.innerText = "Баланс";
            currencyType.innerText = "бонусов";
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
                        bonuses.innerText = new Intl.NumberFormat('ru-RU').format(Number(Math.ceil(balance * progress)));
                        bonuses.style.opacity = progress;
                    },
                    callback: function (options) {
                        bonuses.innerText = new Intl.NumberFormat('ru-RU').format(Number(balance));
                    }
                });
            }
        } else {
            bonuses.innerText = "Не удалось загрузить с сервера.";
        }
    } else {
        document.getElementById("wallet-placeholder").style.display = "";
        document.getElementById("wallet-loader").style.display = "";
        document.getElementById("wallet-data").style.display = "none";
    }
}

function drawPurchases(purchases) {
    purchases.forEach(purchase => drawPurchase(purchase));
}

function drawPurchase(purchase) {
    // Контейнер
    let paymentElement = document.createElement("div");
    paymentElement.classList.add("payment", "animate__animated", "animate__fadeIn");

    // Бонусы
    let paymentRowElement = null;
    let spanElement = null;

    // Всего скидка
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");

    spanElement = document.createElement("span");
    spanElement.style.fontWeight = "bold";
    spanElement.innerText = "Всего скидка: ";
    paymentRowElement.appendChild(spanElement);

    let totalDiscount = Math.abs(Number(purchase.discount_amount)) + Math.abs(Number(purchase.payment_amount));
    spanElement = document.createElement("span");
    spanElement.classList.add("bad");
    spanElement.innerText = (totalDiscount ? "-" : "") + new Intl.NumberFormat('ru-RU').format(totalDiscount) + " руб";
    paymentRowElement.appendChild(spanElement);

    // Чек-возврата
    if (!purchase.operation_type) {
        spanElement = document.createElement("span");
        spanElement.classList.add("bad");
        spanElement.style.fontWeight = "bold";
        spanElement.style.textAlign = "right";
        spanElement.style.fontSize = "12px";
        spanElement.innerText = "чек возврата";
        paymentRowElement.appendChild(spanElement);
    }

    paymentElement.appendChild(paymentRowElement);

    // Из них бонусами
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");

    spanElement = document.createElement("span");
    spanElement.classList.add("payment-amount");
    spanElement.style.fontWeight = "bold";
    spanElement.style.marginLeft = "20px";
    spanElement.innerText = "из них бонусами: ";
    paymentRowElement.appendChild(spanElement);

    spanElement = document.createElement("span");
    spanElement.classList.add("bad");
    spanElement.innerText = new Intl.NumberFormat('ru-RU').format(Number(purchase.payment_amount));
    paymentRowElement.appendChild(spanElement);

    paymentElement.appendChild(paymentRowElement);

    // Начислено бонусов
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row");

    spanElement = document.createElement("span");
    spanElement.classList.add("payment-amount");
    spanElement.style.fontWeight = "bold";
    spanElement.innerText = "Начислено бонусов: ";
    paymentRowElement.appendChild(spanElement);

    let cashbackAmount = Number(purchase.cashback_amount);
    spanElement = document.createElement("span");
    spanElement.classList.add("good");
    spanElement.innerText = (cashbackAmount > 0 ? "+" : "") + new Intl.NumberFormat('ru-RU').format(cashbackAmount);
    paymentRowElement.appendChild(spanElement);

    paymentElement.appendChild(paymentRowElement);

    // Дата
    paymentRowElement = document.createElement("div");
    paymentRowElement.classList.add("payment-row", "payment-row-date");

    spanElement = document.createElement("span");
    spanElement.classList.add("payment-amount");
    spanElement.innerText = "Дата: ";
    paymentRowElement.appendChild(spanElement);

    let date = new Date((purchase.operation_date).replace(new RegExp("-", 'g'), "/"));

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
    paymentRowElement.classList.add("payment-row", "payment-row-date");

    spanElement = document.createElement("span");
    spanElement.classList.add("payment-amount");
    spanElement.innerText = "Магазин: ";
    paymentRowElement.appendChild(spanElement);

    if (purchase.store_title && purchase.store_description) {
        paymentRowElement.appendChild(getGeolink(purchase.store_title, purchase.store_description));
    } else {
        spanElement = document.createElement("span");
        spanElement.innerText = purchase.store_title;
        paymentRowElement.appendChild(spanElement);
    }

    paymentElement.append(paymentRowElement);

    // Детализация чека
    if (purchase.positions.length) {
        let paymentDetailsElement = document.createElement("details");
        paymentDetailsElement.addEventListener("click", e => {

        });
        paymentElement.appendChild(paymentDetailsElement);

        let summaryElement = document.createElement("summary");
        summaryElement.innerText = "Подробнее";
        paymentDetailsElement.append(summaryElement);

        let detailsDataElement = document.createElement("div");
        detailsDataElement.classList.add("details-data");
        paymentDetailsElement.append(detailsDataElement); 

        paymentRowElement = document.createElement("div");
        paymentRowElement.classList.add("payment-details", "neutral");
        ["Оплачено", "Скидка", "Начислено"].forEach(element => {
            let spanElement = document.createElement("span");
            spanElement.innerText = element;
            paymentRowElement.appendChild(spanElement);
        });
        detailsDataElement.appendChild(paymentRowElement);

        purchase.positions.forEach((position) => {
            paymentRowElement = document.createElement("div");
            paymentRowElement.classList.add("payment-details", "important");
            let spanElement = undefined;
            spanElement = document.createElement("span");
            spanElement.innerText = new Intl.NumberFormat('ru-RU').format(Number(position.cost)) + " руб";
            paymentRowElement.appendChild(spanElement);

            spanElement = document.createElement("span");
            if (Number(position.discount_amount)) {
                spanElement.innerText = new Intl.NumberFormat('ru-RU').format(Number(position.discount_amount) * -1) + " руб";
            } else {
                spanElement.innerText = new Intl.NumberFormat('ru-RU').format(Number(position.payment_amount)) + " бонусов";
            }

            let positionCashbackAmount = Number(position.cashback_amount)
            paymentRowElement.appendChild(spanElement);
            spanElement = document.createElement("span");
            spanElement.innerText = (positionCashbackAmount > 0 ? "+" : "") + new Intl.NumberFormat('ru-RU').format(positionCashbackAmount) + " бонусов";
            paymentRowElement.appendChild(spanElement);

            detailsDataElement.appendChild(paymentRowElement);

            paymentRowElement = document.createElement("div");
            paymentRowElement.classList.add("payment-details", "payment-details-full");
            paymentRowElement.innerText = (position.product_title ? position.product_title : "Загрузка..");
            detailsDataElement.appendChild(paymentRowElement);
        });
    }

    transactions.prepend(paymentElement);
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
            callback: function (options) { }
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
        cardCanvasCtx.fillText(cardNumber.substr(0, 7), 256, 216);

        downloadCard.style.display = "";
        animate({
            duration: 1000,
            timing: quad,
            draw: function (progress, options) {
                downloadCard.style.opacity = progress;
            },
            callback: function (options) { }
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