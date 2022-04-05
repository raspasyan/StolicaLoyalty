/* global C, d, fetch, API_URL, LS_CONTENTS, SOURCE */

function drawStores(stores) {
    let cities = [],
        contents = JSON.parse(C().getStor(LS_CONTENTS)),
        currentCity = 'Хабаровск';

    if (contents && contents.personal) {
        currentCity = contents.personal.city;
    }

    stores.forEach(item => {
        if (cities.indexOf(item.id) === -1) {
            cities.push(item.id);
        }
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
        const temp = '<div class="storesList__block animate__animated animate__fadeInLeft" style="animation-duration: ' + (delay / 5) + 's">\n\
                        <div class="storesList__block_title">' + city.store_title + '</div>\n\
                        <div class="storesList__block_shedule">' + city.shedule + '</div>\n\
                      </div>';
        
        let store = C().strToNode(temp);

        store.el.addEventListener("click", () => getStoreToGeoMap(city.coordinates, city.title, city.store_title, city.shedule, city.phone, city.rsa_id));

        list.el.append(store.el);

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
            "method": "getStores",
            "source": SOURCE
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
    const temp = '<div class="storeMap">\n\
                    <div class="storeMap__bg"></div>\n\
                    <div class="storeMap__block animate__animated animate__fadeInDown">\n\
                        <div class="storeMap__block_city">' + city + '<i class="icon-cancel"></i></div>\n\
                        <div class="storeMap__block_info">\n\
                            <div>\n\
                                <span>Адрес:</span>\n\
                                <span>' + title + '</span>\n\
                            </div>\n\
                            <div>\n\
                                <span>Время работы:</span>\n\
                                <span>' + shedule + '</span>\n\
                            </div>\n\
                            <div>\n\
                                <span>Телефон:</span>\n\
                                <span><a href="tel:+7' + phone.slice(1) + '">' + phone + '</a></span>\n\
                            </div>\n\
                        </div>\n\
                        <div id="map"></div>\n\
                    </div>\n\
                  </div>';
    
    let storeMap = C().strToNode(temp);
    
    C("div>div", storeMap).el.addEventListener("click", () => closeStore());
    C("i", storeMap).el.addEventListener("click", () => closeStore());
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