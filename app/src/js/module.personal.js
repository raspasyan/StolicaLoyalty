/* global C, fetch, API_URL, bearerToken */

function updatePersonalData() {
    getProfileData().then(result => {
        if (result.status) {
            if (result.data.firstname || result.data.middlename || result.data.lastname) {
                C("#personal_name").text([result.data.firstname, result.data.middlename, result.data.lastname].join(" "));
            }

            if (result.data.birthdate) {
                let date = new Date((result.data.birthdate).replace(new RegExp("-", 'g'), "/"));

                var options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timezone: 'UTC'
                };

                C("#personal_birthdate").text(date.toLocaleString("ru", options));
            }

            if (result.data.phone) {
                let a = result.data.phone.split('');
                C("#personal_phone").text('+' + a[0] + ' (' + a[1] + a[2] + a[3] + ') ' + a[4] + a[5] + a[6] + '-' + a[7] + a[8] + '-' + a[9] + a[10]);
            }

            C("#personalCardType").text((result.data.preferred_discount) ? "ДИСКОНТНАЯ" : "БОНУСНАЯ");

            if (result.data.discount !== result.data.preferred_discount) {
                //notMatchCardType.style.display = "block";
                show("#notMatchCardType");
                C("#notMatchCardTypeValue").text((result.data.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ"));
            } else {
                hide("#notMatchCardType");
            }
        } else {
            onErrorCatch(result);
        }
    });
}

function drawPersonal(personal) {
    let needUp = JSON.parse(C().getStor(LS_NEED_UPDATE));
    
    if (needUp.personal === 0) {
        return;
    }
    
    needUp.personal = 0;
    C().setStor(LS_NEED_UPDATE, JSON.stringify(needUp));
        
    if (personal.firstname || personal.middlename || personal.lastname) {
        C("#personal_name").text([personal.firstname, personal.middlename, personal.lastname].join(" "));
    }

    if (personal.birthdate) {
        let date = new Date((personal.birthdate).replace(new RegExp("-", 'g'), "/"));

        var options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timezone: 'UTC'
        };

        C("#personal_birthdate").text(date.toLocaleString("ru", options));
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

function getProfileData() {
    return fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": "getProfileData"
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

async function changePassword() {
    let result = false;
    if (C("#personal-new-pass").val().length === 0) {
        return result;
    }
    if (C("#personal-new-pass").val().length > 0 && C("#personal-new-pass").val().length < 6) {
        attentionFocus(C("#personal-new-pass").el);
        return result;
    }

    if (C("#personal-new-pass").val() !== C("#personal-new-pass-confirmation").val()) {
        attentionFocus(C("#personal-new-pass-confirmation").el);
        return result;
    }

    C("#personal_changePassword_button").el.disabled = true;

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": "changePassword",
            "data": {
                "new_password": C("#personal-new-pass").val()
            }
        })
    });

    result = await response.json();

    C("#personal_changePassword_button").el.disabled = false;

    return result;
}

async function changeCard() {
    if (C("#personal_new_card").val().length < 14) {
        attentionFocus(C("#personal_new_card").el);
        return;
    }

    C("#personal_changeCard_button").el.disabled = true;

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": "changeCard",
            "data": {
                "new_card": C("#personal_new_card").val()
            }
        })
    });

    let result = await response.json();

    C("#personal_changeCard_button").el.disabled = false;

    if (result.status) {
        if (result.description) showPopup("", result.description);
        C("#personal_new_pass").val("");
        C("#personal_new_pass_confirmation").val("");
    } else {
        if (result.description) showPopup("Внимание", result.description);
    }
}

function changeCardType() {
    return fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": "changeCardType",
            "data": {
                "discount": C('input[name="systemChange"]:checked').val()
            }
        })
    }).then(response => response.json()).catch(error => {
        return {
            status: false,
            description: error.message,
            error: error
        };
    });
}

function changeProfileData() {
    C("#personal_changePassword_button").el.disabled = true;

    let changePass = false;
    if (C("#personal-new-pass").val().length > 0) {
        changePassword().then(result => {
            if (result) {
                if (result.status) {
                    changePass = true;
                } else {
                    showPopup("Внимание", result.description);
                }
            }
        });
        setTimeout(() => {
            if (changePass) {
                changeCardType().then(result => {
                    if (result.status) {
                        showPopup("", "Данные профиля изменены!");
                        C("#personal_changePassword_button").el.disabled = false;
                    }
                });
            }
        }, 500);
    } else {
        changeCardType().then(result => {
            if (result.status) {
                showPopup("", "Тип карты изменен!");
                C("#personal_changePassword_button").el.disabled = false;
            }
        });
    }

}

async function setCard() {
    if (C("#plasticNumber").val().length < 10) {
        showPopup("Внимание", "Не указан номер карты!");
        return;
    }

    showLoader();
    C("#set_card").el.disabled = true;

    let body = {
        "method": "setCard",
        "data": {
            "card_number": C("#plasticNumber").val()
        }
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

    C("#personal_changePassword_button").el.disabled = false;

    hideLoader();
    C("#set_card").el.disabled = false;
    C("#plasticNumber").val("");

    if (result.status) {
        if (result.description) showPopup("", result.description);
    } else {
        if (result.description) showPopup("Внимание", result.description);
    }
}