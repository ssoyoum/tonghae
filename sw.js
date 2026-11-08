// Retire the former browser app cache; installed native apps ship their own assets.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('tonghae-'))await caches.delete(key);
 await self.clients.claim();
})()));
// No fetch handler: the public page uses normal network requests.
