import webpush from 'web-push';

// Chaves VAPID geradas para este projeto
// IMPORTANTE: Em produção, mover para variáveis de ambiente
const VAPID_PUBLIC_KEY = 'BI2RhjU9SPQsYco2y8ya-lGGTufzi5ItbotBMoNkAJx-n9iPjjOED6I8zzbA6jnDEsy24Ap3JyXZU9Z-xguCAF0';
const VAPID_PRIVATE_KEY = 'y4e5PY8AYoNt-EZVDLpgJ0Etu-GqTnwHDm9ZZf0yJMs';

// Configurar web-push
webpush.setVapidDetails(
  'mailto:admin@cardapio.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  data?: {
    url?: string;
    orderId?: number;
    orderNumber?: string;
    [key: string]: unknown;
  };
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Enviar notificação push para uma subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 horas
        urgency: 'high'
      }
    );

    console.log('[WebPush] Notificação enviada com sucesso');
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    console.error('[WebPush] Erro ao enviar notificação:', err.message);
    
    // Se o erro for 410 (Gone), a subscription não é mais válida
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('[WebPush] Subscription inválida, deve ser removida');
      return false;
    }
    
    throw error;
  }
}

/**
 * Enviar notificação de novo pedido
 */
export async function sendNewOrderNotification(
  subscription: PushSubscriptionData,
  orderData: {
    orderId: number;
    orderNumber: string;
    customerName: string;
    total: number;
  }
): Promise<boolean> {
  const payload: PushPayload = {
    title: '🔔 Novo Pedido!',
    body: `Pedido ${orderData.orderNumber} de ${orderData.customerName} - R$ ${orderData.total.toFixed(2).replace('.', ',')}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: `order-${orderData.orderId}`,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/pedidos',
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber
    },
    actions: [
      { action: 'open', title: 'Ver Pedido' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  return sendPushNotification(subscription, payload);
}

/**
 * Retorna a chave pública VAPID para o cliente
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export default {
  sendPushNotification,
  sendNewOrderNotification,
  getVapidPublicKey
};
