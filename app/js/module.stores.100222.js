function drawStores(stores) {
    let cities = [];
    stores.forEach(item => {
        if (cities.indexOf(item.id) == -1) cities.push(item.id);
    });

    cities.forEach(cityId => {
        let storesInCity = [];
        stores.forEach(item => {
            if (item.id == cityId) storesInCity.push(item);
        });

        let option = document.createElement("option");
        option.value = cityId;
        option.setAttribute("data-stores", JSON.stringify(storesInCity));
        option.innerText = storesInCity[0].title;
        store_cities.appendChild(option);

        if (storesInCity[0].title == currentCity) option.setAttribute("selected", true)
    });

    let storesInCity = JSON.parse(store_cities.options[store_cities.selectedIndex].getAttribute("data-stores"));
    drawStoresInCity(storesInCity);
}

function drawStoresInCity(stores) {
    $("#storesList").html('');
    stores.forEach(city => {
        $("#storesList").append("<div class='store_block animate__animated animate__fadeInLeft' data-rsa='" + city.rsa_id + "' data-coordinates='" + city.coordinates + "' data-phone='" + city.phone + "' data-city='" + city.title + "'><div class='store_block-title'>" + city.store_title + "</div><div class='store_block-shedule'>" + city.shedule + "</div><span class='show_store'>></span></div>");
    });
}

function getStores() {
    return fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            "method": "getStores"
        })
    }).then(response => response.json()).catch(error => {
        return {
            status: false,
            description: error.message,
            error: error
        }
    });
}

async function getStoresList(city_id) {
    let body = {
        "method": "getStoresList",
        "city_id": city_id
    };

    let response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    $("#storesList").html('');

    result.data.forEach(city => {
        $("#storesList").append("<div class='store_block' data-rsa='" + city.rsa_id + "' data-coordinates='" + city.coordinates + "' data-phone='" + city.phone + "' data-city='" + city.city_name + "'><div class='store_block-title'>" + city.store_name + "</div><div class='store_block-shedule'>" + city.shedule + "</div><span class='show_store'>></span></div>");
    });
}