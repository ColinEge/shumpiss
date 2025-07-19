// Shumpiss PWA Service Worker v1.0.0
const CACHE_NAME = "shumpiss-v1";
const STATIC_CACHE_NAME = "shumpiss-static-v1";

// Core app shell files to cache
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/app.css",
  "/manifest.json"
];

// Cache strategies for different types of requests
const CACHE_STRATEGIES = {
  // Cache first for static assets (CSS, JS, images)
  static: ["css", "js", "woff", "woff2", "ttf", "svg", "png", "jpg", "jpeg", "gif", "ico"],
  // Network first for API calls and dynamic content
  dynamic: ["json", "html"]
};

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing");
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      console.log("Service Worker: Caching static assets");
      // Cache the static assets with error handling
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.status === 200) {
            await cache.put(url, response);
            console.log("Cached:", url);
          } else {
            console.warn("Skipped caching (status not 200):", url, response.status);
          }
        } catch (error) {
          console.warn("Failed to cache:", url, error.message);
        }
      });
      
      await Promise.all(cachePromises);
      console.log("Service Worker: Static assets cached");
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("Service Worker: Activated");
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle requests from the same origin
  if (url.origin !== location.origin) {
    return;
  }

  // Determine cache strategy based on file extension
  const fileExtension = url.pathname.split('.').pop()?.toLowerCase();
  const isStatic = CACHE_STRATEGIES.static.includes(fileExtension || '');
  
  if (isStatic) {
    // Cache first strategy for static assets
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Return a fallback if available
          return caches.match("/");
        });
      })
    );
  } else {
    // Network first strategy for dynamic content
    event.respondWith(
      fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fall back to cache if network fails
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match("/");
        });
      })
    );
  }
});