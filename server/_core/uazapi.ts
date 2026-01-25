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
      id?: string;
      token?: string;
      message?: string;
    }>('/instance/create', 'POST', {
      name: instanceName,
      // Optional: set webhook URL for receiving messages
      // webhook: `${process.env.VITE_APP_URL}/api/webhook/whatsapp/${establishmentId}`,
    });
    
    return {
      success: true,
      instanceId: response.id || instanceName,
      instanceToken: response.token,
      message: response.message,
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
    // Instance exists, we need to get its token
    // Note: The token is only returned on creation, so we may need to store it
    return {
      success: true,
      instanceId: existing.id,
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
      status?: string;
      qrcode?: string;
      pairingCode?: string;
      message?: string;
    }>(instanceToken, '/instance/connect', 'POST', {});
    
    return {
      success: true,
      status: (response.status as 'disconnected' | 'connecting' | 'connected') || 'connecting',
      qrcode: response.qrcode,
      pairingCode: response.pairingCode,
      message: response.message,
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
      status?: string;
      qrcode?: string;
      pairingCode?: string;
      phone?: string;
      name?: string;
      message?: string;
    }>(instanceToken, '/instance/status', 'GET');
    
    return {
      success: true,
      status: (response.status as 'disconnected' | 'connecting' | 'connected') || 'disconnected',
      qrcode: response.qrcode,
      pairingCode: response.pairingCode,
      phone: response.phone,
      name: response.name,
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
    
    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/text', 'POST', {
      number: formattedPhone,
      text: text,
      delay: 1000, // 1 second delay to show "typing..."
    });
    
    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message',
    };
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
  template?: string | null
): string {
  // Default templates
  const defaultTemplates: Record<string, string> = {
    new: `Olá {{customerName}}! 🎉\n\nSeu pedido {{orderNumber}} foi recebido com sucesso!\n\nAguarde, em breve começaremos a preparar.\n\n{{establishmentName}}`,
    preparing: `Olá {{customerName}}! 👨‍🍳\n\nSeu pedido {{orderNumber}} está sendo preparado!\n\nEm breve estará pronto.\n\n{{establishmentName}}`,
    ready: `Olá {{customerName}}! ✅\n\nSeu pedido {{orderNumber}} está pronto!\n\nVocê já pode retirar ou aguardar a entrega.\n\n{{establishmentName}}`,
    completed: `Olá {{customerName}}! 🙏\n\nSeu pedido {{orderNumber}} foi finalizado!\n\nObrigado pela preferência!\n\n{{establishmentName}}`,
    cancelled: `Olá {{customerName}}! ❌\n\nInfelizmente seu pedido {{orderNumber}} foi cancelado.\n\nEntre em contato conosco para mais informações.\n\n{{establishmentName}}`,
  };
  
  const messageTemplate = template || defaultTemplates[status] || defaultTemplates.new;
  
  return messageTemplate
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{establishmentName}}/g, establishmentName);
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
  }
): Promise<SendTextResponse> {
  const message = generateStatusMessage(
    status,
    data.orderNumber,
    data.customerName,
    data.establishmentName,
    data.template
  );
  
  return sendTextMessage(instanceToken, phone, message);
}
