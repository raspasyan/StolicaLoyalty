function updatePersonalData() {
    getProfileData().then(result => {
        if (result.status) {
            if (result.data.firstname || result.data.middlename || result.data.lastname) personal_name.innerText = [result.data.firstname, result.data.middlename, result.data.lastname].join(" ");

            if (result.data.birthdate) {
                let date = new Date((result.data.birthdate).replace(new RegExp("-", 'g'), "/"));

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
                personal_phone.innerText = '+' + a[0] + ' (' + a[1] + a[2] + a[3] + ') ' + a[4] + a[5] + a[6] + '-' + a[7] + a[8] + '-' + a[9] + a[10];
            }

            if (result.data.card_status !== 1) $("#replace_card").remove();

            personalCardType.innerText = (result.data.preferred_discount) ? "ДИСКОНТНАЯ" : "БОНУСНАЯ";

            if (result.data.discount != result.data.preferred_discount) {
                notMatchCardType.style.display = "block";
                notMatchCardTypeValue.innerText = (result.data.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ");
            } else {
                notMatchCardType.style.display = "none";
            }
        } else {
            onErrorCatch(result);
        }
    });
}

function drawPersonal(personal) {
    if (personal.firstname || personal.middlename || personal.lastname) personal_name.innerText = [personal.firstname, personal.middlename, personal.lastname].join(" ");

    if (personal.birthdate) {
        let date = new Date((personal.birthdate).replace(new RegExp("-", 'g'), "/"));

        var options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timezone: 'UTC'
        };

        personal_birthdate.innerText = date.toLocaleString("ru", options);
    }

    if (personal.phone) {
        a = personal.phone.split('');
        personal_phone.innerText = '+' + a[0] + ' (' + a[1] + a[2] + a[3] + ') ' + a[4] + a[5] + a[6] + '-' + a[7] + a[8] + '-' + a[9] + a[10];
    }

    if (personal.card_status !== 1) $("#replace_card").remove();

    personalCardType.innerText = (personal.preferred_discount) ? "ДИСКОНТНАЯ" : "БОНУСНАЯ";

    if (personal.discount != personal.preferred_discount) {
        notMatchCardType.style.display = "block";
        notMatchCardTypeValue.innerText = (personal.discount ? "БОНУСНОЙ" : "ДИСКОНТНОЙ");
    } else {
        notMatchCardType.style.display = "none";
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
        }
    });
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

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": "changePassword",
            "data": {
                "new_password": personal_new_pass.value,
            }
        })
    });

    result = await response.json();

    personal_changePassword_button.disabled = false;

    return result;
}

async function changeCard() {
    if (personal_new_card.value.length < 14) {
        attentionFocus(personal_new_card);
        return;
    }

    personal_changeCard_button.disabled = true;

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": "changeCard",
            "data": {
                "new_card": personal_new_card.value
            }
        })
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
                "discount": document.querySelector('input[name="systemChange"]:checked').value,
            }
        })
    }).then(response => response.json()).catch(error => {
        return {
            status: false,
            description: error.message,
            error: error
        }
    });
}

function changeProfileData() {
    let changePass = false;
    if (personal_new_pass.value.length > 0) {
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
                    }
                });
            }
        }, 500);
    }
    else {
        changeCardType().then(result => {
            if (result.status) {
                showPopup("", "Тип карты изменен!");
            }
        });
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

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
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