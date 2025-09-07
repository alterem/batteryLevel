const CACHE_NAME = 'battery-monitor-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/BatteryDisplay.tsx',
  '/src/index.css',
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS.filter(asset => 
          !asset.includes('/src/') // 跳过源码文件，只缓存构建后的文件
        ));
      })
      .catch((error) => {
        console.warn('PWA: 缓存失败，但应用仍可正常使用', error);
      })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只拦截 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果有缓存，返回缓存
        if (cachedResponse) {
          return cachedResponse;
        }

        // 否则请求网络
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应用于缓存
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.warn('PWA: 网络请求失败', error);
            // 如果是页面请求失败，可以返回离线页面
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// 处理消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});