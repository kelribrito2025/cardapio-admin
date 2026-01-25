// Service Worker para Cardápio Admin PWA
const CACHE_NAME = 'cardapio-admin-v1';
const STATIC_CACHE = 'cardapio-static-v1';

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets em cache, ativando imediatamente');
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Limpar caches antigos
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Tomando controle de todas as páginas');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições (Network First para API, Cache First para assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições de API (sempre buscar da rede)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Ignorar SSE
  if (url.pathname.includes('/sse')) {
    return;
  }
  
  // Para outros recursos, usar Network First com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, adicionar ao cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request);
      })
  );
});

// Receber notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  let data = {
    title: 'Novo Pedido!',
    body: 'Você recebeu um novo pedido',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'new-order',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/pedidos'
    }
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Ver Pedido' },
      { action: 'close', title: 'Fechar' }
    ],
    // Configurações para garantir que a notificação apareça mesmo com tela desligada
    silent: false,
    renotify: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/pedidos';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já houver uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Se não houver janela aberta, abrir uma nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event);
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Responder com status
  if (event.data && event.data.type === 'GET_STATUS') {
    event.ports[0].postMessage({
      type: 'STATUS',
      isActive: true,
      cacheVersion: CACHE_NAME
    });
  }
});

// Sincronização em segundo plano (para quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Sincronizar pedidos pendentes quando voltar online
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker carregado');
