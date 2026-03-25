// SSC Focus - Service Worker
// Caches the entire app for 100% offline use

var CACHE = 'sscfocus-v20';
var FILES = [
  '/',
  '/index.html'
];

// Install: cache all files immediately
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(FILES);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

// Activate: delete old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', function(e){
  // Only handle GET requests
  if(e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached){
        // Serve from cache immediately
        // Also update cache in background
        fetch(e.request).then(function(fresh){
          if(fresh && fresh.status === 200){
            caches.open(CACHE).then(function(cache){
              cache.put(e.request, fresh);
            });
          }
        }).catch(function(){});
        return cached;
      }
      // Not in cache - try network, then cache it
      return fetch(e.request).then(function(response){
        if(!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE).then(function(cache){
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function(){
        // Offline and not cached - return cached homepage as fallback
        return caches.match('/index.html');
      });
    })
  );
});
