const mwsCache = 'mws-rStage1-v14';
const cacheContent = [
    '/',
    '/js/main.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/css/styles.css',
    '/css/responsive.css',
    '/index.html',
    '/restaurant.html',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg'
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