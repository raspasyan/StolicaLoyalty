/* global C */

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
            "source": SOURCE
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

