/**
 * Service Worker cho CVA Thống Kê Cuộc Thi Trực Tuyến PWA
 */

const CACHE_NAME = "cva-thitructuyen-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/config.js",
  "./js/teachers_data.js",
  "./js/drive_service.js",
  "./js/firebase_service.js",
  "./js/export_service.js",
  "./js/app.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/favicon.png"
];

// Cài đặt Service Worker và lưu đệm App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt và dọn dẹp cache cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Chiến lược Cache-First với Network Fallback cho tài nguyên tĩnh
self.addEventListener("fetch", (event) => {
  const reqUrl = new URL(event.request.url);

  // Bỏ qua các yêu cầu Firebase, Google Drive API, Google Apps Script và CDN để luôn lấy dữ liệu mới nhất
  if (
    reqUrl.hostname.includes("firebaseio.com") ||
    reqUrl.hostname.includes("googleapis.com") ||
    reqUrl.hostname.includes("script.google.com") ||
    reqUrl.hostname.includes("script.googleusercontent.com") ||
    reqUrl.hostname.includes("gstatic.com") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cập nhật ngầm trong cache (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Offline mode
          });
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
