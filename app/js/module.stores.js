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

function closeStore() {
    d.body.removeChild(C(".storeMap").el);
}

function getStoreToGeoMap(coordinates, city, title, shedule, phone, rsa_id) {
    let storeMap = C().create("div");
    storeMap.addclass("storeMap");

    let storeMapBg = C().create("div");
    storeMapBg.addclass("storeMap__bg");
    storeMapBg.el.addEventListener("click", e => closeStore());
    storeMap.append(storeMapBg);

    let storeMapBlock = C().create("div");
    storeMapBlock.addclass(["storeMap__block", "animate__animated", "animate__fadeInDown"]);
    storeMap.append(storeMapBlock);

    let mapCity = C().create("div");
    mapCity.addclass("storeMap__block_city");
    mapCity.text(city);
    storeMapBlock.append(mapCity);
    
    let mapClose = C().create("i");
    mapClose.addclass("icon-cancel");
    mapClose.id = "closeStore";
    mapCity.append(mapClose);
    mapClose.el.addEventListener("click", e => closeStore());
    
    let mapInfo = C().create("div");
    mapInfo.addclass("storeMap__block_info");
    storeMapBlock.append(mapInfo);

    let mapInfoItem = C().create("div");
    mapInfoItem.html("<span>Адрес:</span><span>" + title + "</span>");
    mapInfo.append(mapInfoItem);

    mapInfoItem = C().create("div");
    mapInfoItem.html("<span>Время работы:</span><span>" + shedule + "</span>");
    mapInfo.append(mapInfoItem);

    mapInfoItem = C().create("div");
    mapInfoItem.html("<span>Телефон:</span><span><a href='tel:+7" + phone.slice(1) + "'>" + phone + "</a></span>");
    mapInfo.append(mapInfoItem);

    let map = C().create("div");
    map.attr("id", "map");
    storeMapBlock.append(map);

    d.body.appendChild(storeMap.el);

    let x = parseFloat(coordinates.split(',')[0]),
            y = parseFloat(coordinates.split(',')[1]);

    var myMap = new ymaps.Map("map", {
        center: [x, y],
        zoom: 16
    });

    let objectManager = new ymaps.ObjectManager({
        clusterize: true,
        gridSize: 32,
        clusterDisableClickZoom: true
    });

    objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');

    objectManager.add({
        type: 'Feature',
        id: rsa_id,
        geometry: {
            type: 'Point',
            coordinates: [x, y]
        },
        properties: {
            hintContent: title,
            balloonContentHeader: ''
        }
    });

    myMap.geoObjects.add(objectManager);
}