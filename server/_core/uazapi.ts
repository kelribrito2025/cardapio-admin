/**
 * UAZAPI Integration Module
 * Handles WhatsApp connection and messaging via UAZAPI
 */

interface UazapiConfig {
  subdomain: string;
  token: string;
}

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

/**
 * Build the base URL for UAZAPI requests
 */
function getBaseUrl(subdomain: string): string {
  return `https://${subdomain}.uazapi.com`;
}

/**
 * Make a request to UAZAPI
 */
async function makeRequest<T>(
  config: UazapiConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${getBaseUrl(config.subdomain)}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'token': config.token,
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
    console.error('[UAZAPI] Request failed:', error);
    throw error;
  }
}

/**
 * Connect instance to WhatsApp (generates QR code)
 */
export async function connectInstance(config: UazapiConfig): Promise<ConnectResponse> {
  try {
    const response = await makeRequest<{
      status?: string;
      qrcode?: string;
      pairingCode?: string;
      message?: string;
    }>(config, '/instance/connect', 'POST', {});
    
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
export async function getInstanceStatus(config: UazapiConfig): Promise<StatusResponse> {
  try {
    const response = await makeRequest<{
      status?: string;
      qrcode?: string;
      pairingCode?: string;
      phone?: string;
      name?: string;
      message?: string;
    }>(config, '/instance/status', 'GET');
    
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
export async function disconnectInstance(config: UazapiConfig): Promise<{ success: boolean; message?: string }> {
  try {
    await makeRequest(config, '/instance/disconnect', 'POST');
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
  config: UazapiConfig,
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
    
    const response = await makeRequest<{
      id?: string;
      message?: string;
    }>(config, '/send/text', 'POST', {
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
  config: UazapiConfig,
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
  
  return sendTextMessage(config, phone, message);
}
