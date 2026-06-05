// Service Worker for Run Dog Run PWA
// Enables offline-first functionality with network fallback

const CACHE_NAME = 'rundogrun-cache-v1';

// Core assets to cache during installation
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  
  // ============ ADD YOUR CUSTOM ASSETS BELOW ============
  // Stylesheets:
  // './styles/main.css',
  // './styles/game.css',
  
  // Game JavaScript:
  // './js/game-loop.js',
  // './js/dog-controller.js',
  // './js/physics.js',
  
  // Images & Sprites:
  // './assets/sprites/dog.png',
  // './assets/sprites/obstacles.png',
  // './assets/backgrounds/level-1.png',
  
  // Audio Assets:
  // './assets/audio/bark.mp3',
  // './assets/audio/jump.mp3',
  // './assets/audio/game-over.mp3',
  
  // Add more assets as needed
  // ======================================================
];

// ============ INSTALL: Cache core assets ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).then(() => {
        // Activate immediately without waiting for other clients to close
        self.skipWaiting();
      });
    })
  );
});

// ============ ACTIVATE: Clean up old caches ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any caches that don't match the current version
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      });
    })
  );
});

// ============ FETCH: Network-first with offline fallback ============
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone and cache successful responses
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Network failed: serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Optional: Return a fallback for failed requests
          // Example: return a custom offline page
          // if (event.request.destination === 'document') {
          //   return caches.match('./offline.html');
          // }

          return new Response('Offline: Asset not cached', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
