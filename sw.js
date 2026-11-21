const VERSION = "xingyou-pwa-v3";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const INDEX_URL = new URL("./index.html", self.registration.scope).href;
const APP_SHELL = [
  INDEX_URL,
  new URL("./manifest.webmanifest", self.registration.scope).href,
  new URL("./sw.js", self.registration.scope).href,
  new URL("./icons/icon-192.png", self.registration.scope).href,
  new URL("./icons/icon-512.png", self.registration.scope).href
];
const CACHEABLE_DESTINATIONS = new Set(["script", "style", "image", "font", "manifest"]);
const NETWORK_TIMEOUT_MS = 4000;

const isSameOrigin = request => new URL(request.url).origin === self.location.origin;
const isUsableResponse = response => response && (response.ok || response.type === "opaque");

async function fetchWithTimeout(request, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    return await fetch(request, {...options, signal: controller.signal});
  } finally {
    clearTimeout(timeout);
  }
}

async function putInCache(cacheName, request, response) {
  if (!isUsableResponse(response)) return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      // Keep the currently active worker if a deployment is incomplete.
      .catch(error => {
        console.error("行遊 App Shell 快取失敗", error);
        throw error;
      })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("xingyou-pwa-") && ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function handleNavigation(request) {
  try {
    // Always check the network for HTML so published updates become visible.
    const response = await fetchWithTimeout(request, {cache: "no-store"});
    if (response.ok) {
      await putInCache(SHELL_CACHE, INDEX_URL, response);
      return response;
    }
  } catch (error) {
    // Offline or an unreachable network: use the cached App Shell below.
  }

  const cached = await caches.match(INDEX_URL);
  return cached || new Response(
    "目前無法載入行遊，請重新連線後再試一次。",
    {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}}
  );
}

async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(request);
    if (isUsableResponse(response)) {
      // Runtime cache lets fonts and future same-origin assets work offline
      // after their first successful online request.
      await putInCache(RUNTIME_CACHE, request, response);
    }
    return response;
  } catch (error) {
    // Do not return HTML for a missing CSS/JS/image request.
    return new Response("離線時找不到此資源", {
      status: 503,
      headers: {"Content-Type": "text/plain; charset=utf-8"}
    });
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || !isSameOrigin(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (CACHEABLE_DESTINATIONS.has(request.destination)) {
    event.respondWith(handleAsset(request));
  }
});
