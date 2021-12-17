var CACHE_NAME = "v3";
var urlsToCache = [
  // "/",
  // "/index.html",
  // "/skeleton.css",
  // "/normalize.css",
  // "/style.css",
  // "/script.js",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fitem_46150.jpg?v=1597727877370",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fballoon.png?v=1597712250379",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fballoon256.png?v=1597712259052",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Ftriangle-mosaic.png?v=1597715880174",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fitem_46172.jpg?v=1597727882883",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fitem_46239.jpg?v=1597727888313",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fbarcode.png?v=1597730840224",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Fharold.jpg?v=1597733166177",
  // "https://cdn.glitch.com/b8fb15c3-17a1-4ad0-b799-b55551892feb%2Flogo.png?v=1597989080702"
  "/app/js/animate.js",
  "/app/assets/logo_512.png",
    "/app/assets/card_back.jpg",
    "/api",
    "/app/js/app_250921.min.js"
];



self.addEventListener("install", function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});




self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }

      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== "basic") {
            console.log(response);
          return response;
        }

        var responseToCache = response.clone();

        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });


        return response;
      });
    })
  );
});

