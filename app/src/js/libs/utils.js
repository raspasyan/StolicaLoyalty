/* global C, versionApp, API_URL, bearerToken, platform */

function isEmpty(obj) {
    if (!obj || obj === "undefined") {
        return true;
    }

    return Object.keys(JSON.parse(obj)).length === 0;
}

function dropFail(el) {
    C(el).delclass("fail");
}

function showLoader() {
    C("#loader").style("opacity", 1);
    show("#loader");
}

function hideLoader() {
    const loader = C("#loader");

    loader.addclass(["animate__fadeOut", "animated"]);
    promiseTimeout(() => {
        hide("#loader");
        loader.delclass(["animate__fadeOut", "animated"]);
    }, 500);
}

function modifyInput(el) {
    if (el.value.length === 1 && +el.value[0] === 8) {
        el.value = "+7-";
    }
}

function removeLoadOption(id) {
    const b = C("option:disabled, div.temporary", C(id));

    if (!b.el) {
        return;
    }

    b.els.forEach((el) => el.parentNode.removeChild(el));
}

function hide(selector) {
    C(selector).el.style.display = "none";
}

function show(selector) {
    C(selector).el.style.display = "";
}

function linkToApp() {
    let link = 'market://details?id=com.stolica.bonuses';
    
    if (platform === "iOS") {
        //https:
        //itunes.apple.com/ru/app/id[APPLE_ID]
        link = 'https://apps.apple.com/ru/app/%D1%81%D1%82%D0%BE%D0%BB%D0%B8%D1%86%D0%B0-%D0%B1%D0%BE%D0%BD%D1%83%D1%81%D1%8B/id1590266964';
    }
    
    cordova.InAppBrowser.open(link, '_system');
}

async function api(method, data = "") {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Bearer " + (bearerToken ? bearerToken : "")
        },
        body: JSON.stringify({
            "method": method,
            "data": data,
            "source": versionApp
        })
    });
    return await response.json();
}

function loadScript(path, callback) {
    let script = document.createElement('script');
    script.onload = function () {
        callback();
    };
    script.src = path;

    document.head.appendChild(script);
}

