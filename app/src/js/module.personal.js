/* global C, LS_CONTENTS */

// Переход на пластиковую карту
C("#personal_changeCard_button").el.addEventListener("click", () => changeCard());

C('input[name="enablePushNotify"]').el.addEventListener("change", (e) => {
    changeEnableNotify("push", Number(e.currentTarget.checked));
});

C('input[name="enableSmsNotify"]').el.addEventListener("change", (e) => {
    changeEnableNotify("sms", Number(e.currentTarget.checked));
});

C('input[name="enableEmailNotify"]').el.addEventListener("change", (e) => {
    changeEnableNotify("email", Number(e.currentTarget.checked));
});

async function changeEnableNotify(type, value) {
    let result = await api("changeEnableNotify", {
                        value: value,
                        type: type
                    });

    if (result.status) {
        updateCashContent("personal", type, value);
    }
    
    if (result.description) {
        showPopup("", result.description);
    }
}

function updateCashContent(type, method, val) {
    let cacheContent = JSON.parse(C().getStor(LS_CONTENTS));
    
    cacheContent[type][method] = val;
    C().setStor(LS_CONTENTS, JSON.stringify(cacheContent));
}

async function updatePersonalData() {
    let result = await api("getProfileData");

    if (result.status) {
        const data = result.data;

        if (data.firstname || data.middlename || data.lastname) {
            C("#personal_name").text([data.firstname, data.middlename, data.lastname].join(" "));
        }

        if (data.birthdate) {
            let date = new Date((data.birthdate).replace(new RegExp("-", 'g'), "/"));

            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timezone: 'UTC'
            };
            
            if (date != "Invalid Date") {
                date = date.toLocaleString("ru", options);
            } else {
                date = "&nbsp;";
            }
            
            C("#personal_birthdate").html(date);
        }

        if (data.phone) {
            let a = data.phone.split('');
            C("#personal_phone").text('+' + a[0] + ' (' + a[1] + a[2] + a[3] + ') ' + a[4] + a[5] + a[6] + '-' + a[7] + a[8] + '-' + a[9] + a[10]);
        }

        C("#personalCardType").text((data.preferred_discount) ? "ДИСКОНТНАЯ" : "БОНУСНАЯ");

        if (data.discount !== data.preferred_discount) {
            show("#notMatchCardType");
            C("#notMatchCardTypeValue").text((data.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ"));
        } else {
            hide("#notMatchCardType");
        }
    } else {
        onErrorCatch(result);
    }
}

function drawPersonal(personal) {
    if (!permitRedrawSection('personal')) {
        return;
    }

    let notifyPushInp = C('input[name="enablePushNotify"]').el;
    notifyPushInp.checked = (personal.enable_push_notify && personal.enable_push_notify === 1);

    let notifySmsInp = C('input[name="enableSmsNotify"]').el;
    notifySmsInp.checked = (personal.enable_sms_notify && personal.enable_sms_notify === 1);

    let notifyEmailInp = C('input[name="enableEmailNotify"]').el;
    notifyEmailInp.checked = (personal.enable_email_notify && personal.enable_email_notify === 1);

    if (personal.firstname || personal.middlename || personal.lastname) {
        C("#personal_name").text([personal.firstname, personal.middlename, personal.lastname].join(" "));
    }

    if (personal.birthdate) {
        let date = new Date((personal.birthdate).replace(new RegExp("-", 'g'), "/"));

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timezone: 'UTC'
        };

        if (date != "Invalid Date") {
            date = date.toLocaleString("ru", options);
        } else {
            date = "&nbsp;";
        }
        
        C("#personal_birthdate").html(date);
    }
    
    if (personal.phone) {
        a = personal.phone.split('');
        C("#personal_phone").text('+' + a[0] + ' (' + a[1] + a[2] + a[3] + ') ' + a[4] + a[5] + a[6] + '-' + a[7] + a[8] + '-' + a[9] + a[10]);
    }

    C("#personalCardType").text((personal.preferred_discount) ? "ДИСКОНТНАЯ" : "БОНУСНАЯ");

    if (personal.discount !== personal.preferred_discount) {
        //notMatchCardType.style.display = "block";
        show("#notMatchCardType");
        C("#notMatchCardTypeValue").text((personal.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ"));
    } else {
        //notMatchCardType.style.display = "none";
        hide("#notMatchCardType");
    }
}

async function changeCard() {
    let title = "Внимание";
    
    if (C("#personal_new_card").val().length < 14) {
        attentionFocus(C("#personal_new_card").el);
        return;
    }

    C("#personal_changeCard_button").el.disabled = true;

    let result = await api("changeCard", {
                        new_card: C("#personal_new_card").val()
                    });

    C("#personal_changeCard_button").el.disabled = false;

    if (result.status) {
        C("#personal_new_pass").val("");
        C("#personal_new_pass_confirmation").val("");
        title = "";
    }
    
    if (result.description) {
        showPopup(title, result.description);
    }

}

async function changeProfileData() {
    const inpPass = "#personal-new-pass";
        
    C("#personal_changePassword_button").el.disabled = true;

    if (C(inpPass).val().length > 0 && C(inpPass).val() === C(inpPass+"-confirmation").val()) {
        await api("changePassword", {
                        new_password: C("#personal-new-pass").val()
                    });
    }
    
    let cardRes = await api("changeCardType", {
                            discount: C('input[name="systemChange"]:checked').val()
                        });
    
    if (cardRes.status) {
        showPopup("", "Данные профиля изменены!");
    } else {
        showPopup("Внимание", cardRes.description);
    }
    
    C("#personal_changePassword_button").el.disabled = false;
}

async function setCard() {
    let title;
    
    if (C("#plasticNumber").val().length < 10) {
        showPopup("Внимание", "Не указан номер карты!");
        return;
    }

    showLoader();
    C("#set_card").el.disabled = true;

    let result = await api("setCard", {
                        card_number: C("#plasticNumber").val()
                    });

    C("#personal_changePassword_button").el.disabled = false;

    hideLoader();
    C("#set_card").el.disabled = false;
    C("#plasticNumber").val("");

    title = result.status ? "" : "Внимание";
    
    if (result.description) {
        showPopup(title, result.description);
    }
}

let loadScanerScript = false;
let scanerIsEnable   = false;

C("#scanerQR").el.addEventListener("click", () => {
    if (loadScanerScript) {
        startScaner();
    } else {
        loadScaner();
    }
});

function loadScaner() {
    showLoader();
    loadScript('app/build/js/vendors/qrscan.min.js', () => {
        hideLoader();
        loadScanerScript = true;
        startScaner();
    });
}

let video = C().create("video").el;

function startScaner() {
    if (!scanerIsEnable) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            scanerIsEnable = true;
            promiseTimeout(stopStreamedVideo, 30000);
            requestAnimationFrame(tick);
        });
    } else {
        stopStreamedVideo();
    }
}
    
function tick() {
    let canvasElement = C("#canvas").el;
    let canvas        = canvasElement.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasElement.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width  = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        
        let imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
        });

        if (code) {
            C("#plasticNumber").el.value = code.data;
            stopStreamedVideo();
        }
    }

    requestAnimationFrame(tick);
}
    
function stopStreamedVideo() {
    if (!video.srcObject) return;
    
    video.srcObject.getTracks().forEach(function(track) {
        scanerIsEnable = false;
        track.stop();
    });
}