/**
 * @file sw.js
 * @brief Service worker to cache webpage and resources.
 * 
 * @details
 * Caching to allow using the Live Viewer while not connected to the Internet (such as when connected to the CAN logger Wi-Fi).
 * Installation code from
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 * Fetch code from
 * https://developer.chrome.com/docs/workbox/caching-strategies-overview#network_first_falling_back_to_cache
 * 
 * @author Nhan Nguyen
 * 
 * @date 04/04/2026
 * 
 * @version 1.0.0
 * 
 * @organisation MREX
 */

const cacheName = "cache";

/*
Prioritise retrieving resources from network, if network unavailable then fall back to cache.
From https://developer.chrome.com/docs/workbox/caching-strategies-overview#network_first_falling_back_to_cache
*/
self.addEventListener("fetch", (event) => {
	if (!event.request.url.includes("localhost:8000") && !event.request.url.includes("https://monash-railway-express.github.io")) {
		return;
	}
	console.log(event.request.url);
	// Open the cache
	event.respondWith(caches.open(cacheName).then((cache) => {
		// Go to the network first
		return fetch(event.request.url).then((fetchedResponse) => {
			cache.put(event.request, fetchedResponse.clone());

			return fetchedResponse;
		}).catch(() => {
			// If the network is unavailable, get
			return cache.match(event.request.url);
		});
	}));
});