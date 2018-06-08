const mwsCache = 'mws-rStage1-v26';
const cacheContent = [
    '/',
    '/js/main.js',
    '/js/idb.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/css/styles.css',
    '/index.html',
    '/restaurant.html',
    '/img/1.webp',
    '/img/2.webp',
    '/img/3.webp',
    '/img/4.webp',
    '/img/5.webp',
    '/img/6.webp',
    '/img/7.webp',
    '/img/8.webp',
    '/img/9.webp',
    '/img/10.webp'
]
/**
 * Service Worker Installation
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(mwsCache).then(cache => {
            return cache.addAll(cacheContent);
        })
    );
});

/**
 * Service Worker Fetch
 */
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if(response){
                return response; // return if valid response found in cache else fetch from internet
            } else { 
                return fetch(event.request).then(res => { 
                    return caches.open(mwsCache).then(cache => {
                        cache.put(event.request.url, res.clone()); //save the response from internet to cache
                        return res; //return the fetched response
                    })
                })
                .catch(err => {
                    console.log("error");
                });
            }
        })
    );
});

/**
 * Service Worker Activate
 */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return ( cacheName.startsWith('mws-rStage1') && 
                    mwsCache != cacheName
                );
                }).map(cacheName => {
                    console.log('Cache Deleted!');
                    return caches.delete(cacheName);
                })
            );
        })
    );
});