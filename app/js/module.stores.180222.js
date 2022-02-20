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
    document.getElementById("storesList").innerHTML = "";
    
    let delay = 1;
    stores.forEach(city => {
        let blockStoreElement = document.createElement("div");
        blockStoreElement.classList.add("store_block", "animate__animated", "animate__fadeInLeft");
        blockStoreElement.setAttribute("style", "--animate-duration: " + (delay / 5) + "s");
        blockStoreElement.addEventListener("click", e => getStoreToGeoMap(city.coordinates, city.title, city.store_title, city.shedule, city.phone, city.rsa_id));

        let storeTitle = document.createElement("div");
        storeTitle.classList.add("store_block-title");
        storeTitle.innerText = city.store_title;
        blockStoreElement.append(storeTitle);

        let storeShedule = document.createElement("div");
        storeShedule.classList.add("store_block-shedule");
        storeShedule.innerText = city.shedule;
        blockStoreElement.append(storeShedule);

        document.getElementById("storesList").append(blockStoreElement);

        if (delay < 10) delay++;
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