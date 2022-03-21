/* global C, d, fetch, currentCity, API_URL */

function drawStores(stores) {
    let cities = [];
    stores.forEach(item => {
        if (cities.indexOf(item.id) === -1) cities.push(item.id);
    });

    cities.forEach(cityId => {
        let storesInCity = [];
        stores.forEach(item => {
            if (item.id === cityId) {
                storesInCity.push(item);
            }
        });

        let option = C().create("option");
        option.val(cityId);
        option.attr("data-stores", JSON.stringify(storesInCity));
        option.text(storesInCity[0].title);
        C("#store_cities").append(option);

        if (storesInCity[0].title === currentCity) {
            option.attr("selected", true);
        }
    });

    let storesInCity = JSON.parse(C("#store_cities").el.options[C("#store_cities").el.selectedIndex].getAttribute("data-stores"));
    drawStoresInCity(storesInCity);
}

function drawStoresInCity(stores) {
    let list  = C(".storesList"),
        delay = 1;
    
    list.html("");
    
    stores.forEach(city => {
        let blockStoreElement = C().create("div");
        blockStoreElement.addclass(["storesList__block", "animate__animated", "animate__fadeInLeft"]);
        blockStoreElement.attr("style", "animation-duration: " + (delay / 5) + "s");
        blockStoreElement.el.addEventListener("click", e => getStoreToGeoMap(city.coordinates, city.title, city.store_title, city.shedule, city.phone, city.rsa_id));

        let storeTitle = C().create("div");
        storeTitle.addclass("storesList__block_title");
        storeTitle.text(city.store_title);
        blockStoreElement.el.append(storeTitle.el);

        let storeShedule = C().create("div");
        storeShedule.addclass("storesList__block_shedule");
        storeShedule.text(city.shedule);
        blockStoreElement.el.append(storeShedule.el);

        list.el.append(blockStoreElement.el);

        if (delay < 10) {
            delay++;
        }
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
        };
    });
}