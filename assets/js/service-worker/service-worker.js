/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const CACHE_NAMES = {
	MAIN: 'ahsr-precache-v2',
	RUNTIME: 'runtime-v2',
	MAP_TILES: 'map-tiles-v2',
};

// A list of local resources we always want to be cached.
const PRECACHE_URLS = ['/', '/index.html', '/styles.css', '/init.js'];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
	event.waitUntil(
		caches
			.open(CACHE_NAMES.MAIN)
			.then(cache => cache.addAll(PRECACHE_URLS))
			.then(self.skipWaiting())
			.catch(console.warn)
	);
	event.waitUntil(
		caches.open(CACHE_NAMES.MAP_TILES).then(cache =>
			cache.addAll([
				'https://tile.openstreetmap.org/{z}/{x}/{y}.png', // Add other tiles as needed
			])
		)
	);
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
	const currentCaches = CACHE_NAMES.values();
	event.waitUntil(self.clients.claim());
	event.waitUntil(
		caches
			.keys()
			.then(cacheNames => {
				return cacheNames.filter(
					cacheName => !currentCaches.includes(cacheName)
				);
			})
			.then(cachesToDelete => {
				return Promise.all(
					cachesToDelete.map(cacheToDelete => {
						return caches.delete(cacheToDelete);
					})
				);
			})
	);
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
	console.log('Fetching:', event.request.url);
	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
			if (cachedResponse) {
				const networkResponse = fetch(event.request);
				const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
				networkResponse
					.then(res => {
						res.headers.get('date') &&
							new Date(res.headers.get('date')).getTime() + expirationTime >
								Date.now();
					})
					.catch(() => {});
				return cachedResponse;
			}

			// If the response is not in the cache, fetch it from the network and then add it to the cache
			const networkFetch = fetch(event.request)
				.then(response => {
					const url = new URL(event.request.url);console.log(url);
					if (
						!response ||
						response.status !== 200 ||
						response.type !== 'basic'
					) {
						return response;
					} else if (
						url.origin === location.origin &&
						url.pathname.includes('tile.openstreetmap')
					) {
						console.log(url);
					}
					const clonedResponse = response.clone();
					caches.open(CACHE_NAMES.RUNTIME).then(cache => {
						cache.put(event.request, clonedResponse);
					});
					return response;
				})
				.catch(() => {});
			return networkFetch;
		})
	);
});
