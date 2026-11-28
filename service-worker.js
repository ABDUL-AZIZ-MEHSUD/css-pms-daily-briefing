/* CSS/PMS Daily Briefing offline application shell. */
var CACHE_NAME = "css-pms-daily-briefing-shell-v1";
var BASE_URL = new URL(".", self.location.href);
var BASE_PATH = BASE_URL.pathname;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([
        BASE_PATH,
        BASE_PATH + "index.html",
        BASE_PATH + "firebase-config.js",
        BASE_PATH + "firebase-access.js"
      ]);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key.indexOf("css-pms-daily-briefing-") === 0 && key !== CACHE_NAME;
      }).map(function (key) { return caches.delete(key); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") {
      event.respondWith(fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match(BASE_PATH + "index.html");
        });
      }));
      return;
    }

    event.respondWith(fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () { return caches.match(request); }));
    return;
  }

  /* Cache Firebase SDK scripts after the first successful online load. */
  if (request.destination === "script" && /(^|\.)gstatic\.com$/.test(url.hostname)) {
    event.respondWith(caches.match(request).then(function (cached) {
      return cached || fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        return response;
      });
    }));
  }
});
