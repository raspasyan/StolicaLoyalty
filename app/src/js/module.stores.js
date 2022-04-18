/* global C, d, LS_CONTENTS */

function drawStores(stores) {
    let cities = [],
        currentCity = 'Хабаровск';
    const contents    = JSON.parse(C().getStor(LS_CONTENTS));

    if (contents && contents.personal && contents.personal.city) {
        currentCity = contents.personal.city;
    }

    stores.forEach((item) => {
        if (cities.indexOf(item.id) === -1) {
            cities.push(item.id);
        }
    });
    
    removeLoadOption("#store_cities");
    
    cities.forEach((cityId) => {
        const storesInCity = [];
        
        stores.forEach((item) => {
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

    const storesInCity = JSON.parse(C("#store_cities").el.options[C("#store_cities").el.selectedIndex].getAttribute("data-stores"));
    drawStoresInCity(storesInCity);
}

function drawStoresInCity(stores) {
    let list  = C(".storesList"),
        delay = 1;
    
    list.html("");
    
    stores.forEach((city) => {
        const temp = `<div class="storesList__block animated animate__fadeInLeft" style="animation-duration: ${(delay / 5)}s">
                        <div class="storesList__block_title">${city.store_title}</div>
                        <div class="storesList__block_shedule">${city.shedule}</div>
                      </div>`;
        
        const store = C().strToNode(temp);

        store.el.addEventListener("click", () => getStoreToGeoMap(city.coordinates, city.title, city.store_title, city.shedule, city.phone, city.rsa_id));

        list.el.append(store.el);

        if (delay < 10) {
            delay++;
        }
    });
}

async function getStores() {
    return await api("getStores");
}

function closeStore() {
    d.body.removeChild(C(".storeMap").el);
}

function getStoreToGeoMap(coordinates, city, title, shedule, phone, rsa_id) {
    const temp = `<div class="storeMap">
                    <div class="storeMap__bg"></div>
                    <div class="storeMap__block animated animate__fadeInDown">
                        <div class="storeMap__block_city">${city}<i class="icon-cancel"></i></div>
                        <div class="storeMap__block_info">
                            <div>
                                <span>Адрес:</span>
                                <span>${title}</span>
                            </div>
                            <div>
                                <span>Время работы:</span>
                                <span>${shedule}</span>
                            </div>
                            <div>
                                <span>Телефон:</span>
                                <span><a href="tel:+7${phone.slice(1)}">${phone}</a></span>
                            </div>
                        </div>
                        <div id="map"></div>
                    </div>
                  </div>`;
    
    const storeMap = C().strToNode(temp);
    
    C("div>div", storeMap).el.addEventListener("click", () => closeStore());
    C("i", storeMap).el.addEventListener("click", () => closeStore());
    d.body.appendChild(storeMap.el);

    const x = parseFloat(coordinates.split(',')[0]),
          y = parseFloat(coordinates.split(',')[1]);

    const myMap = new ymaps.Map("map", {
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