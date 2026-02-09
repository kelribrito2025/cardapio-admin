/**
 * UAZAPI Integration Module
 * Handles WhatsApp connection and messaging via UAZAPI
 * Uses centralized credentials - each establishment gets its own instance
 */

// Get centralized credentials from environment
const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || '';
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN || '';

interface ConnectResponse {
  success: boolean;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string; // Base64 QR code image
  pairingCode?: string;
  message?: string;
}

interface StatusResponse {
  success: boolean;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string;
  pairingCode?: string;
  phone?: string;
  name?: string;
  message?: string;
}

interface SendTextResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

interface InstanceInfo {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected';
  token?: string;
  phone?: string;
  profileName?: string;
}

/**
 * Check if UAZAPI is configured
 */
export function isUazapiConfigured(): boolean {
  return Boolean(UAZAPI_BASE_URL && UAZAPI_ADMIN_TOKEN);
}

/**
 * Make an admin request to UAZAPI (for creating/managing instances)
 */
async function makeAdminRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!isUazapiConfigured()) {
    throw new Error('UAZAPI not configured');
  }

  const url = `${UAZAPI_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'admintoken': UAZAPI_ADMIN_TOKEN,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `UAZAPI error: ${response.status}`);
    }
    
    return data as T;
  } catch (error) {
    console.error('[UAZAPI] Admin request failed:', error);
    throw error;
  }
}

/**
 * Make an instance request to UAZAPI (for operations on a specific instance)
 */
async function makeInstanceRequest<T>(
  instanceToken: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!isUazapiConfigured()) {
    throw new Error('UAZAPI not configured');
  }

  const url = `${UAZAPI_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'token': instanceToken,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `UAZAPI error: ${response.status}`);
    }
    
    return data as T;
  } catch (error) {
    console.error('[UAZAPI] Instance request failed:', error);
    throw error;
  }
}

/**
 * Create a new instance for an establishment
 * Instance name will be based on establishment ID for uniqueness
 */
export async function createInstance(establishmentId: number, establishmentName: string): Promise<{
  success: boolean;
  instanceId?: string;
  instanceToken?: string;
  message?: string;
}> {
  try {
    const instanceName = `cardapio_${establishmentId}`;
    
    const response = await makeAdminRequest<{
      instance?: { id?: string; token?: string };
      token?: string;
      response?: string;
    }>('/instance/create', 'POST', {
      name: instanceName,
      // Optional: set webhook URL for receiving messages
      // webhook: `${process.env.VITE_APP_URL}/api/webhook/whatsapp/${establishmentId}`,
    });
    
    // A API retorna o token tanto no root quanto em instance.token
    const instanceToken = response.token || response.instance?.token;
    const instanceId = response.instance?.id || instanceName;
    
    console.log('[UAZAPI] Instance created:', { instanceId, hasToken: !!instanceToken });
    
    return {
      success: true,
      instanceId,
      instanceToken,
      message: response.response,
    };
  } catch (error) {
    // If instance already exists, try to get its token
    if (error instanceof Error && error.message.includes('already exists')) {
      const instances = await listInstances();
      const existing = instances.find(i => i.name === `cardapio_${establishmentId}`);
      if (existing) {
        return {
          success: true,
          instanceId: existing.id,
          message: 'Instance already exists',
        };
      }
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create instance',
    };
  }
}

/**
 * List all instances
 */
export async function listInstances(): Promise<InstanceInfo[]> {
  try {
    const response = await makeAdminRequest<Array<{
      id: string;
      name: string;
      status: string;
      phone?: string;
      profileName?: string;
    }>>('/instance/all', 'GET');
    
    return response.map(inst => ({
      id: inst.id,
      name: inst.name,
      status: (inst.status as 'disconnected' | 'connecting' | 'connected') || 'disconnected',
      phone: inst.phone,
      profileName: inst.profileName,
    }));
  } catch (error) {
    console.error('[UAZAPI] Failed to list instances:', error);
    return [];
  }
}

/**
 * Get or create instance for an establishment
 */
export async function getOrCreateInstance(establishmentId: number, establishmentName: string): Promise<{
  success: boolean;
  instanceId?: string;
  instanceToken?: string;
  message?: string;
}> {
  const instanceName = `cardapio_${establishmentId}`;
  
  // First, check if instance already exists
  const instances = await listInstances();
  const existing = instances.find(i => i.name === instanceName);
  
  if (existing) {
    // Instance exists, return its token
    console.log('[UAZAPI] Instance already exists:', { instanceId: existing.id, hasToken: !!existing.token });
    return {
      success: true,
      instanceId: existing.id,
      instanceToken: existing.token, // Token vem da lista de instâncias
      message: 'Instance already exists',
    };
  }
  
  // Create new instance
  return createInstance(establishmentId, establishmentName);
}

/**
 * Connect instance to WhatsApp (generates QR code)
 */
export async function connectInstance(instanceToken: string): Promise<ConnectResponse> {
  try {
    const response = await makeInstanceRequest<{
      status?: { connected?: boolean };
      instance?: { status?: string; qrcode?: string; paircode?: string };
      qrcode?: string;
      pairingCode?: string;
      response?: string;
      message?: string;
    }>(instanceToken, '/instance/connect', 'POST', {});
    
    // A API pode retornar qrcode em diferentes lugares
    const qrcode = response.qrcode || response.instance?.qrcode;
    const pairingCode = response.pairingCode || response.instance?.paircode;
    const status = response.instance?.status || (response.status?.connected ? 'connected' : 'connecting');
    
    console.log('[UAZAPI] Connect response:', { hasQrcode: !!qrcode, status });
    
    return {
      success: true,
      status: (status as 'disconnected' | 'connecting' | 'connected') || 'connecting',
      qrcode,
      pairingCode,
      message: response.response || response.message,
    };
  } catch (error) {
    return {
      success: false,
      status: 'disconnected',
      message: error instanceof Error ? error.message : 'Failed to connect',
    };
  }
}

/**
 * Get instance status
 */
export async function getInstanceStatus(instanceToken: string): Promise<StatusResponse> {
  try {
    const response = await makeInstanceRequest<{
      instance?: {
        status?: string;
        qrcode?: string;
        paircode?: string;
        profileName?: string;
        owner?: string;
      };
      status?: { connected?: boolean; jid?: string; loggedIn?: boolean };
      qrcode?: string;
      pairingCode?: string;
      phone?: string;
      name?: string;
      message?: string;
    }>(instanceToken, '/instance/status', 'GET');
    
    // A API retorna status em diferentes lugares
    const isConnected = response.status?.connected || response.instance?.status === 'connected';
    const status = isConnected ? 'connected' : (response.instance?.status as 'disconnected' | 'connecting' | 'connected') || 'disconnected';
    const phone = response.instance?.owner || response.phone;
    const name = response.instance?.profileName || response.name;
    const qrcode = response.instance?.qrcode || response.qrcode;
    
    console.log('[UAZAPI] Status response:', { status, isConnected, phone, name });
    
    return {
      success: true,
      status,
      qrcode,
      pairingCode: response.instance?.paircode || response.pairingCode,
      phone,
      name,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      status: 'disconnected',
      message: error instanceof Error ? error.message : 'Failed to get status',
    };
  }
}

/**
 * Disconnect instance from WhatsApp
 */
export async function disconnectInstance(instanceToken: string): Promise<{ success: boolean; message?: string }> {
  try {
    await makeInstanceRequest(instanceToken, '/instance/disconnect', 'POST');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to disconnect',
    };
  }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(
  instanceToken: string,
  phone: string,
  text: string
): Promise<SendTextResponse> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    console.log('[UAZAPI] Enviando mensagem de texto para:', formattedPhone, '| tamanho:', text.length, 'chars');
    
    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/text', 'POST', {
      number: formattedPhone,
      text: text,
      delay: 1000, // 1 second delay to show "typing..."
    });
    
    console.log('[UAZAPI] ✅ Mensagem enviada com sucesso:', { phone: formattedPhone, messageId: response.id });
    
    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    console.error('[UAZAPI] ❌ Falha ao enviar mensagem:', { phone, error: error instanceof Error ? error.message : error });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Get greeting based on current time (Brazil timezone)
 */
function getGreeting(timezone: string = 'America/Sao_Paulo'): string {
  const now = new Date();
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const hour = localDate.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
}

/**
 * Generate order status message based on template
 */
export function generateStatusMessage(
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled',
  orderNumber: string,
  customerName: string,
  establishmentName: string,
  template?: string | null,
  deliveryType?: 'delivery' | 'pickup' | 'dine_in' | null,
  cancellationReason?: string | null,
  orderItems?: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements?: Array<{ name: string; price: number }> | string | null;
    notes?: string | null;
  }> | null,
  orderTotal?: string | null,
  timezone?: string
): string {
  // Default templates
  const defaultTemplates: Record<string, string> = {
    new: `Olá {{customerName}}! 🎉 {{greeting}}!\n\nSeu pedido {{orderNumber}} foi recebido com sucesso!\n\nAguarde, em breve começaremos a preparar.\n\n{{establishmentName}}`,
    preparing: `Olá {{customerName}}! 👨‍🍳\n\nSeu pedido {{orderNumber}} está sendo preparado!\n\nEm breve estará pronto.\n\n{{establishmentName}}`,
    ready: `Olá {{customerName}}! ✅\n\nSeu pedido {{orderNumber}} está pronto!\n\nVocê já pode retirar ou aguardar a entrega.\n\n{{establishmentName}}`,
    completed: `Seu pedido {{orderNumber}} foi finalizado!\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*`,
    cancelled: `Olá {{customerName}}! ❌\n\nInfelizmente seu pedido {{orderNumber}} foi cancelado.\n\nMotivo: {{cancellationReason}}\n\n{{establishmentName}}`,
  };
  
  let messageTemplate = template || defaultTemplates[status] || defaultTemplates.new;
  
  // Substituir variáveis de tipo de entrega para status "ready"
  if (status === 'ready' && deliveryType) {
    // Mensagem para retirada
    const pickupMessage = 'Você já pode vir retirar. 😄';
    // Mensagem para delivery
    const deliveryMessage = '🛵 Nosso entregador já está a caminho.';
    // Mensagem para consumo no local
    const dineInMessage = 'Seu pedido está pronto! 🍽️';
    
    // Determinar a mensagem correta baseada no tipo de entrega
    const finalMessage = deliveryType === 'pickup' ? pickupMessage : deliveryType === 'dine_in' ? dineInMessage : deliveryMessage;
    
    // Substituir {{deliveryMessage}} se existir no template
    if (messageTemplate.includes('{{deliveryMessage}}')) {
      messageTemplate = messageTemplate.replace(
        /{{deliveryMessage}}/g,
        finalMessage
      );
    } else {
      // Se não tiver a variável, substituir a frase genérica
      messageTemplate = messageTemplate
        .replace(/Você já pode retirar ou aguardar a entrega\./g, finalMessage);
    }
  }
  
  // Substituir variável de motivo de cancelamento
  if (status === 'cancelled') {
    const reason = cancellationReason || 'Não informado';
    messageTemplate = messageTemplate.replace(/{{cancellationReason}}/g, reason);
  }
  
  // Substituir variável de saudação baseada no horário
  const greeting = getGreeting(timezone);
  messageTemplate = messageTemplate.replace(/{{greeting}}/g, greeting);
  
  // Gerar texto dos itens do pedido (sem preço individual, apenas total no final)
  let itensPedidoText = '';
  if (orderItems && orderItems.length > 0) {
    itensPedidoText = orderItems.map(item => {
      let itemText = `${item.quantity}x ${item.productName}`;
      
      // Adicionar complementos se existirem
      if (item.complements) {
        let complementsArray: Array<{ name: string; price: number; quantity?: number }> = [];
        if (typeof item.complements === 'string') {
          try {
            complementsArray = JSON.parse(item.complements);
          } catch (e) {
            // Se não for JSON válido, ignorar
          }
        } else if (Array.isArray(item.complements)) {
          complementsArray = item.complements;
        }
        
        if (complementsArray.length > 0) {
          const complementsText = complementsArray.map(c => {
            const qty = c.quantity || 1;
            if (qty > 1) {
              return `  + ${qty}x ${c.name}`;
            }
            return `  + ${c.name}`;
          }).join('\n');
          itemText += '\n' + complementsText;
        }
      }
      
      // Adicionar observações se existirem
      if (item.notes) {
        itemText += `\n  📝 ${item.notes}`;
      }
      
      return itemText;
    }).join('\n');
    
    // Adicionar total se fornecido
    if (orderTotal) {
      itensPedidoText += `\n\n💰 *Total: R$ ${parseFloat(orderTotal).toFixed(2).replace('.', ',')}*`;
    }
  }
  
  return messageTemplate
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{establishmentName}}/g, establishmentName)
    .replace(/{{itensPedido}}/g, itensPedidoText);
}

/**
 * Send order status notification via WhatsApp
 */
export async function sendOrderStatusNotification(
  instanceToken: string,
  phone: string,
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled',
  data: {
    customerName: string;
    orderNumber: string;
    establishmentName: string;
    template?: string | null;
    deliveryType?: 'delivery' | 'pickup' | 'dine_in' | null;
    cancellationReason?: string | null;
    orderItems?: Array<{
      productName: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      complements?: Array<{ name: string; price: number }> | string | null;
      notes?: string | null;
    }> | null;
    orderTotal?: string | null;
    timezone?: string;
  }
): Promise<SendTextResponse> {
  const message = generateStatusMessage(
    status,
    data.orderNumber,
    data.customerName,
    data.establishmentName,
    data.template,
    data.deliveryType,
    data.cancellationReason,
    data.orderItems,
    data.orderTotal,
    data.timezone
  );
  
  return sendTextMessage(instanceToken, phone, message);
}


/**
 * Send a message with interactive buttons via WhatsApp
 * Used for order confirmation flow
 */
export async function sendButtonMessage(
  instanceToken: string,
  phone: string,
  text: string,
  buttons: Array<{ text: string; id: string }>,
  footerText?: string
): Promise<SendTextResponse> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    // Format buttons for UAZAPI: "texto|id"
    const choices = buttons.map(btn => `${btn.text}|${btn.id}`);
    
    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/menu', 'POST', {
      number: formattedPhone,
      type: 'button',
      text: text,
      choices: choices,
      footerText: footerText || '',
      delay: 1000,
    });
    
    console.log('[UAZAPI] Button message sent:', { phone: formattedPhone, buttonsCount: buttons.length });
    
    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    console.error('[UAZAPI] Failed to send button message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send button message',
    };
  }
}

/**
 * Send order confirmation request with buttons
 */
export async function sendOrderConfirmationRequest(
  instanceToken: string,
  phone: string,
  data: {
    customerName: string;
    orderNumber: string;
    establishmentName: string;
    orderItems: Array<{
      productName: string;
      quantity: number;
      unitPrice?: string;
      totalPrice?: string;
      complements?: Array<{ name: string; price: number }> | string | null;
      notes?: string | null;
    }>;
    orderTotal: string;
    template?: string | null;
    timezone?: string;
  }
): Promise<SendTextResponse> {
  const message = generateStatusMessage(
    'new',
    data.orderNumber,
    data.customerName,
    data.establishmentName,
    data.template,
    undefined, // deliveryType
    undefined, // cancellationReason
    data.orderItems.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice || '0',
      totalPrice: item.totalPrice || '0',
      complements: item.complements,
      notes: item.notes,
    })),
    data.orderTotal,
    data.timezone
  );

  // Button for confirmation (only confirm button)
  const buttons = [
    { text: '✅ Sim, Confirmo o Pedido.', id: `confirm_order_${data.orderNumber}` },
  ];

  return sendButtonMessage(
    instanceToken,
    phone,
    message,
    buttons,
    'Clique para confirmar seu pedido'
  );
}

/**
 * Configure webhook for an instance to receive message responses
 */
export async function configureWebhook(
  instanceToken: string,
  webhookUrl: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await makeInstanceRequest(instanceToken, '/webhook', 'POST', {
      enabled: true,
      url: webhookUrl,
      events: ['messages'],
      excludeMessages: ['wasSentByApi'], // Avoid loops
    });
    
    console.log('[UAZAPI] Webhook configured:', { url: webhookUrl });
    
    return { success: true };
  } catch (error) {
    console.error('[UAZAPI] Failed to configure webhook:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to configure webhook',
    };
  }
}
