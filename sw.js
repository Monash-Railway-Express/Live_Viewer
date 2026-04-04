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

// From https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
const addResourcesToCache = async (resources) => {
	const cache = await caches.open(cacheName);
	await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
	event.waitUntil(
		addResourcesToCache([
			"./",
			"./index.html",
			"./style.css",
			"./script.js",
			"./translate_row.js",
			"./sheet.json",
			"./spec.json",
			"./decode_bytes.js",
		]),
	);
});

/*
Prioritise retrieving resources from network, if network unavailable then fall back to cache.
From https://developer.chrome.com/docs/workbox/caching-strategies-overview#network_first_falling_back_to_cache
*/
self.addEventListener("fetch", (event) => {
	// Check if this is a navigation request
	if (event.request.mode === "navigate") {
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
	} else {
		return;
	}
});