var CACHE = 'bulkup-v1';
var ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS.map(function(url){
        return new Request(url, {mode: 'no-cors'});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Don't intercept API calls — always go network for those
  if(e.request.url.indexOf('openrouter.ai')>-1 || e.request.url.indexOf('api.anthropic')>-1){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(!response||response.status!==200||response.type==='opaque') return response;
        var clone=response.clone();
        caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});
        return response;
      }).catch(function(){
        return caches.match('/index.html');
      });
    })
  );
});
