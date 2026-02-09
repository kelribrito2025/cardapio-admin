import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { addConnection, removeConnection, sendHeartbeat, addOrderConnectionForMultiple, removeOrderConnectionFromMultiple, sendAllOrdersHeartbeat, sendEvent } from "./sse";
import { getUserByOpenId, getEstablishmentByUserId, getOrdersByOrderNumbers, getOrderById, getOrderItems, getOrderItemsWithPrinter, getEstablishmentById, getPrinterSettings, getActivePrinters, getTabById, getTabItems, getTableById } from "../db";
import { sdk } from "./sdk";
import { startScheduledCampaignJob } from "../scheduledCampaignJob";

// Função para gerar HTML do recibo otimizado para impressora térmica
// OTIMIZADO para melhor legibilidade em impressoras ESC POS 58mm/80mm
function generateReceiptHTML(
  order: any,
  items: any[],
  establishment: any,
  settings: any
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formatar telefone no formato (88) 9 9929-0000
  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    // Verifica se tem 11 dígitos (com 9 na frente) ou 10 dígitos
    if (digits.length === 11) {
      // Formato: (XX) 9 XXXX-XXXX
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      // Formato: (XX) XXXX-XXXX
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Retorna o número original se não se encaixar nos formatos
    return phone;
  };
  
  const deliveryTypeText = order.deliveryType === 'delivery' ? 'ENTREGA' : order.deliveryType === 'dine_in' ? (order.customerName?.startsWith('Mesa') ? order.customerName.toUpperCase() : 'CONSUMO') : 'RETIRADA';
  const paymentMethodText: Record<string, string> = {
    'cash': 'Dinheiro',
    'credit': 'Cartao Credito',
    'debit': 'Cartao Debito',
    'card': 'Cartao',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'card_online': 'Pagamento confirmado \u2013 Cart\u00e3o online'
  };
  
  // Configurar largura do papel
  const is58mm = settings?.paperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm'; // Largura real do papel térmico
  
  // Usar configurações de fonte salvas ou valores padrão
  const baseFontSize = `${settings?.fontSize || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = settings?.fontWeight || 500;
  const headerFontSize = `${settings?.titleFontSize || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = settings?.titleFontWeight || 700;
  const orderNumberSize = `${(settings?.titleFontSize || (is58mm ? 14 : 16)) + 4}px`;
  const itemFontSize = `${settings?.itemFontSize || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = settings?.itemFontWeight || 700;
  const totalFontSize = `${(settings?.titleFontSize || (is58mm ? 13 : 14)) - 2}px`;
  const smallFontSize = `${settings?.obsFontSize || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = settings?.obsFontWeight || 500;
  const showDividers = settings?.showDividers ?? false;
  const boxPadding = `${(settings as any)?.boxPadding || 12}px`;
  const itemBorderStyle = (settings as any)?.itemBorderStyle || 'rounded';
  
  // Logo URL (usa o personalizado ou o do estabelecimento)
  const logoUrl = settings?.logoUrl || establishment?.logo;
  
  // Mensagem de cabeçalho personalizada
  const headerMessage = settings?.headerMessage;
  
  let itemsHTML = '';
  for (const item of items) {
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
          <span>${formatCurrency(item.totalPrice)}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    // Parse complements if exists
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            // Suporta duas estruturas:
            // 1. Estrutura antiga com grupos: {items: [{name, price}]}
            // 2. Estrutura nova direta: {name, price}
            if (comp.items && Array.isArray(comp.items)) {
              // Estrutura antiga com grupos de complementos
              for (const ci of comp.items) {
                const qty = ci.quantity || 1;
                const qtyPrefix = qty > 1 ? `${qty}x ` : '';
                itemHTML += `<div class="item-complement">+ ${qtyPrefix}${ci.name}${ci.price > 0 ? ` (${formatCurrency(ci.price * qty)})` : ''}</div>`;
              }
            } else if (comp.name) {
              // Estrutura nova: array direto de complementos {name, price, quantity}
              const qty = comp.quantity || 1;
              const qtyPrefix = qty > 1 ? `${qty}x ` : '';
              itemHTML += `<div class="item-complement">+ ${qtyPrefix}${comp.name}${comp.price > 0 ? ` (${formatCurrency(comp.price * qty)})` : ''}</div>`;
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido ${order.orderNumber}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    html {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      background: #e5e5e0;
    }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%; 
      max-width: 320px;
      padding: 20px;
      background: #f5f5f0;
      color: #000;
      -webkit-font-smoothing: antialiased;
      margin: 0 auto;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html {
        background: #fff;
        display: block;
      }
      body {
        background: #fff;
        max-width: 100%;
        padding: 8px;
      }
      .delivery-badge {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .total-final {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    /* CABEÇALHO */
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .order-text {
      display: flex;
      flex-direction: column;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      display: inline-flex;
      align-items: center;
    }
    .date-icon {
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    .section-icon {
      width: 14px;
      height: 14px;
      margin-right: 4px;
      display: inline;
      vertical-align: middle;
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    
    /* DIVISOR */
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    .divider-double {
      ${showDividers ? 'border-top: 3px double #000;' : ''}
      margin: 12px 0;
    }
    
    /* CLIENTE */
    .customer { 
      margin: 10px 0; 
      font-size: ${itemFontSize};
    }
    .customer-label {
      font-weight: ${baseFontWeight};
    }
    .customer-value {
      display: block;
      margin-left: 0;
      word-wrap: break-word;
      font-weight: ${baseFontWeight};
    }
    .customer-row {
      margin: 6px 0;
    }
    
    /* ITENS */
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    
    /* TOTAIS */
    .totals { 
      margin: 12px 0; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin: 6px 0; 
      font-size: ${itemFontSize};
    }
    .total-final { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${headerFontWeight}; 
      font-size: ${itemFontSize}; 
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    
    /* SEÇÕES (Entrega, Pagamento, Cliente) */
    .section-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding};
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-bottom: 8px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    .section-inline {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .payment-badge {
      background: #000;
      color: #fff;
      padding: 4px 10px;
      font-weight: ${headerFontWeight};
      font-size: ${smallFontSize};
    }
    
    /* PAGAMENTO */
    .payment {
      margin: 10px 0;
      font-size: ${itemFontSize};
    }
    .payment-method {
      font-weight: ${baseFontWeight};
      font-size: ${itemFontSize};
    }
    
    /* OBSERVAÇÕES */
    .notes { 
      background: #f0f0f0; 
      padding: 8px; 
      margin: 10px 0; 
      font-size: ${smallFontSize};
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
    }
    
    /* QR CODE */
    .qrcode-box {
      padding: 12px 0;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 144px;
      height: 144px;
      display: block;
      margin: 0 auto;
    }
    
    /* RODAPÉ */
    .footer { 
      text-align: center; 
      margin-top: 16px; 
      font-size: ${smallFontSize}; 
    }
    .footer-thanks {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-top: 8px;
    }
    
    /* PRINT STYLES */
    @media print {
      body {
        width: ${paperWidth};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    <p>Sistema de Pedidos</p>
  </div>
  
  <div class="order-info">
    <div class="order-text">
      <div class="order-number">Pedido ${order.orderNumber}</div>
      <div class="order-date"><img src="/calendar-icon.png" class="date-icon" /> ${formatDate(order.createdAt)}</div>
    </div>
    <div class="delivery-badge">${deliveryTypeText}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${order.deliveryType === 'delivery' ? `
    <div class="total-row">
      <span>Taxa entrega:</span>
      <span>${formatCurrency(order.deliveryFee)}</span>
    </div>
    ` : ''}
    ${order.discount && parseFloat(order.discount) > 0 ? `
    <div class="total-row">
      <span>Desconto${order.couponCode ? ` (${order.couponCode})` : ''}:</span>
      <span>-${formatCurrency(order.discount)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
  </div>
  
  <hr class="divider">
  
  ${(() => {
    // Pedidos de mesa: não exibir seções de comanda, pagamento, troco e cliente
    const isTableOrder = order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa');
    if (isTableOrder) return '';
    
    let sections = '';
    
    // Seção de tipo de entrega
    if (order.deliveryType === 'delivery') {
      sections += `
      <div class="section-box">
        <div class="section-title">Endereço:</div>
        <div class="section-content">
          ${order.customerAddress || ''} - ${order.neighborhood || ''}
          ${order.addressComplement ? '<br>' + order.addressComplement : ''}
        </div>
      </div>`;
    } else if (order.deliveryType === 'dine_in') {
      sections += `
      <div class="section-box">
        <div class="section-content"><strong>Consumo:</strong> Cliente irá consumir no local</div>
      </div>`;
    } else {
      sections += `
      <div class="section-box">
        <div class="section-content"><strong>Retirada:</strong> Cliente irá retirar no estabelecimento</div>
      </div>`;
    }
     // Se\u00e7\u00e3o de pagamento
    const isCardOnline = order.paymentMethod === 'card_online';
    if (isCardOnline) {
      sections += `
      <div class="section-box">
        <div style="text-align: center;">
          <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center; gap: 4px;"><img src="/payment-icon.png" class="section-icon" /> ${paymentMethodText['card_online']}</span>
        </div>
      </div>`;
    } else {
      sections += `
      <div class="section-box">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;"><img src="/payment-icon.png" class="section-icon" /> Pagamento</span>
          <span style="font-weight: ${headerFontWeight};">${paymentMethodText[order.paymentMethod] || order.paymentMethod}</span>
        </div>
      </div>`;
    }    // Seção de troco
    if (order.paymentMethod === 'cash') {
      sections += `
      <div style="margin: 8px 0; text-align: center;">
        <div style="border-top: 1px dashed #000; margin-bottom: 8px;"></div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: ${baseFontSize}; font-weight: ${baseFontWeight};">
          <img src="/info-icon.svg" style="width: 16px; height: 16px;" alt="info" />
          <span>Obs: ${order.changeAmount ? `Troco para ${formatCurrency(order.changeAmount)}` : 'Não precisa de troco'}</span>
        </div>
        <div style="border-top: 1px dashed #000; margin-top: 8px;"></div>
      </div>`;
    }
    
    // Seção de cliente
    sections += `
    <div class="section-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;"><img src="/client-icon.png" style="width: 13px; height: 13px; margin-right: 4px;" /> Cliente</span>
        <span style="font-weight: ${headerFontWeight};">${order.customerName || 'Nao informado'}${order.customerPhone ? ' - ' + formatPhone(order.customerPhone) : ''}</span>
      </div>
    </div>`;
    
    return sections;
  })()}
  
  ${settings?.showQrCode && settings?.qrCodeUrl ? `
  <div class="qrcode-box">
    <div class="section-title">PIX - Escaneie para pagar</div>
    <img src="${settings.qrCodeUrl}" alt="QR Code PIX" />
  </div>
  ` : ''}
  
  ${order.notes && !order.notes.startsWith('Comanda da Mesa') ? `
  <div class="notes">
    <div class="notes-title">OBSERVACOES:</div>
    ${order.notes}
  </div>
  ` : ''}
  
  <div class="footer">
    ${settings?.footerMessage ? `<p>${settings.footerMessage}</p>` : ''}
    <p>Pedido realizado via v2.mindi.com.br</p>
  </div>
</body>
<script>
  // Auto-print quando a página carregar (apenas se não estiver em iframe)
  // Quando carregado via iframe, o código do cliente controla a impressão
  window.onload = function() {
    // Verifica se está em um iframe
    var isInIframe = window !== window.parent;
    if (!isInIframe) {
      // Pequeno delay para garantir que o conteúdo foi renderizado
      setTimeout(function() {
        window.print();
      }, 300);
    }
  };
</script>
</html>
  `.trim();
}

// Função para gerar HTML do recibo filtrado por setor
// Mostra apenas os itens do setor específico
function generateSectorReceiptHTML(
  order: any,
  items: any[],
  establishment: any,
  settings: any,
  sectorName: string
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const deliveryTypeText = order.deliveryType === 'delivery' ? 'ENTREGA' : order.deliveryType === 'dine_in' ? (order.customerName?.startsWith('Mesa') ? order.customerName.toUpperCase() : 'CONSUMO') : 'RETIRADA';
  
  // Formatar telefone no formato (88) 9 9929-0000
  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };
  
  // Configurar largura do papel
  const is58mm = settings?.paperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm';
  
  const baseFontSize = `${settings?.fontSize || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = settings?.fontWeight || 500;
  const headerFontSize = `${settings?.titleFontSize || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = settings?.titleFontWeight || 700;
  const orderNumberSize = `${(settings?.titleFontSize || (is58mm ? 14 : 16)) + 4}px`;
  const itemFontSize = `${settings?.itemFontSize || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = settings?.itemFontWeight || 700;
  const smallFontSize = `${settings?.obsFontSize || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = settings?.obsFontWeight || 500;
  const showDividers = settings?.showDividers ?? false;
  const boxPadding = `${(settings as any)?.boxPadding || 12}px`;
  const itemBorderStyle = (settings as any)?.itemBorderStyle || 'rounded';
  
  let itemsHTML = '';
  for (const item of items) {
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                itemHTML += `<div class="item-complement">+ ${ci.name}</div>`;
              }
            }
          }
        }
      } catch (e) {}
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido #${order.orderNumber} - ${sectorName}</title>
  <style>
    @page { size: ${paperWidth} auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%; 
      max-width: 100%;
      padding: 8px;
      background: #fff;
      color: #000;
    }
    .header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 2px solid #000;' : ''}
    }
    .sector-name {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      background: #000;
      color: #fff;
      padding: 8px 16px;
      margin-bottom: 8px;
      display: inline-block;
    }
    .order-number {
      font-size: ${headerFontSize};
      font-weight: ${headerFontWeight};
      margin-top: 8px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 4px 12px;
      margin-top: 8px;
    }
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    .customer-info {
      margin-top: 12px;
      padding: 8px;
      border: 2px solid #000;
      border-radius: 8px;
    }
    .customer-name {
      font-size: ${itemFontSize};
      font-weight: ${headerFontWeight};
    }
    @media print {
      body { width: ${paperWidth}; padding: 2mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="sector-name">${sectorName.toUpperCase()}</div>
    <div class="order-number">Pedido ${order.orderNumber}</div>
    <div class="order-date">${formatDate(order.createdAt)}</div>
    <div class="delivery-badge">${deliveryTypeText}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  ${(() => {
    const isTableOrder = order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa');
    if (isTableOrder) return '';
    return `<div class="customer-info">
    <div class="customer-name">${order.customerName || 'Cliente'}${order.customerPhone ? ' - ' + formatPhone(order.customerPhone) : ''}</div>
    ${order.deliveryType === 'delivery' && order.customerAddress ? `<div style="font-size: ${smallFontSize}; margin-top: 4px;">${order.customerAddress}</div>` : ''}
  </div>`;
  })()}
  
  ${order.notes && !(order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa')) ? `
  <div style="margin-top: 12px; padding: 8px; background: #f0f0f0; border: 2px solid #000;">
    <strong>OBS:</strong> ${order.notes}
  </div>
  ` : ''}
</body>
</html>
  `.trim();
}

// Função para gerar HTML do recibo de comanda (tab)
function generateTabReceiptHTML(
  tab: any,
  items: any[],
  table: any,
  establishment: any,
  settings: any
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Configurar largura do papel
  const is58mm = settings?.paperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm';
  
  const baseFontSize = `${settings?.fontSize || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = settings?.fontWeight || 500;
  const headerFontSize = `${settings?.titleFontSize || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = settings?.titleFontWeight || 700;
  const orderNumberSize = `${(settings?.titleFontSize || (is58mm ? 14 : 16)) + 4}px`;
  const itemFontSize = `${settings?.itemFontSize || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = settings?.itemFontWeight || 700;
  const smallFontSize = `${settings?.obsFontSize || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = settings?.obsFontWeight || 500;
  const showDividers = settings?.showDividers ?? false;
  const boxPadding = `${(settings as any)?.boxPadding || 12}px`;
  const itemBorderStyle = (settings as any)?.itemBorderStyle || 'rounded';
  
  let itemsHTML = '';
  let subtotal = 0;
  
  for (const item of items) {
    const itemTotal = parseFloat(item.totalPrice) || 0;
    subtotal += itemTotal;
    
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
          <span>${formatCurrency(itemTotal)}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    // Parse complements if exists
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                const qty = ci.quantity || 1;
                const qtyPrefix = qty > 1 ? `${qty}x ` : '';
                itemHTML += `<div class="item-complement">+ ${qtyPrefix}${ci.name}${ci.price > 0 ? ` (${formatCurrency(ci.price * qty)})` : ''}</div>`;
              }
            } else if (comp.name) {
              const qty = comp.quantity || 1;
              const qtyPrefix = qty > 1 ? `${qty}x ` : '';
              itemHTML += `<div class="item-complement">+ ${qtyPrefix}${comp.name}${comp.price > 0 ? ` (${formatCurrency(comp.price * qty)})` : ''}</div>`;
            }
          }
        }
      } catch (e) {}
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  const discount = parseFloat(tab.discount) || 0;
  const serviceCharge = parseFloat(tab.serviceCharge) || 0;
  const total = subtotal - discount + serviceCharge;
  
  // Gerar número da comanda baseado no ID da tab
  const tabNumber = `C${String(tab.id).padStart(3, '0')}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comanda ${tabNumber} - Mesa ${table?.number || tab.tableId}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    html {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      background: #e5e5e0;
    }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%; 
      max-width: 320px;
      padding: 20px;
      background: #f5f5f0;
      color: #000;
      -webkit-font-smoothing: antialiased;
      margin: 0 auto;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html {
        background: #fff;
        display: block;
      }
      body {
        background: #fff;
        max-width: 100%;
        padding: 8px;
      }
      .delivery-badge {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .total-final {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    /* CABEÇALHO */
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .order-text {
      display: flex;
      flex-direction: column;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      display: inline-flex;
      align-items: center;
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    
    /* DIVISOR */
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    
    /* ITENS */
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    
    /* TOTAIS */
    .totals { 
      margin: 12px 0; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin: 6px 0; 
      font-size: ${itemFontSize};
    }
    .total-final { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${headerFontWeight}; 
      font-size: ${itemFontSize}; 
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    
    /* SEÇÕES */
    .section-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding};
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-bottom: 8px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    
    /* OBSERVAÇÕES */
    .notes { 
      background: #f0f0f0; 
      padding: 8px; 
      margin: 10px 0; 
      font-size: ${smallFontSize};
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
    }
    
    /* QR CODE */
    .qrcode-box {
      padding: 12px 0;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 144px;
      height: 144px;
      display: block;
      margin: 0 auto;
    }
    
    /* RODAPÉ */
    .footer { 
      text-align: center; 
      margin-top: 16px; 
      font-size: ${smallFontSize}; 
    }
    .footer-thanks {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-top: 8px;
    }
    
    /* PRINT STYLES */
    @media print {
      body {
        width: ${paperWidth};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    <p>Sistema de Pedidos</p>
  </div>
  
  <div class="order-info">
    <div class="order-text">
      <div class="order-number">Comanda ${tabNumber}</div>
      <div class="order-date">📅 ${formatDate(tab.openedAt)}</div>
    </div>
    <div class="delivery-badge">Mesa ${table?.number || tab.tableId}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${discount > 0 ? `
    <div class="total-row">
      <span>Desconto:</span>
      <span>-${formatCurrency(discount)}</span>
    </div>
    ` : ''}
    ${serviceCharge > 0 ? `
    <div class="total-row">
      <span>Taxa de serviço:</span>
      <span>${formatCurrency(serviceCharge)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(total)}</span>
    </div>
  </div>
  
  
  ${settings?.showQrCode && settings?.qrCodeUrl ? `
  <div class="qrcode-box">
    <div class="section-title">PIX - Escaneie para pagar</div>
    <img src="${settings.qrCodeUrl}" alt="QR Code PIX" />
  </div>
  ` : ''}
  
  ${tab.notes ? `
  <div class="notes">
    <div class="notes-title">OBSERVACOES:</div>
    ${tab.notes}
  </div>
  ` : ''}
  
  <div class="footer">
    ${settings?.footerMessage ? `<p>${settings.footerMessage}</p>` : ''}
    <p>Pedido realizado via v2.mindi.com.br</p>
  </div>
</body>
<script>
  window.onload = function() {
    var isInIframe = window !== window.parent;
    if (!isInIframe) {
      setTimeout(function() {
        window.print();
      }, 300);
    }
  };
</script>
</html>
  `.trim();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST be registered BEFORE express.json() for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const { constructWebhookEvent, extractCheckoutMetadata } = await import("../stripe");
      const { addSmsCredit, getOrCreateSmsBalance } = await import("../db");
      
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        console.error("[Stripe Webhook] Sem header stripe-signature");
        return res.status(200).json({ verified: true, warning: "Missing signature" });
      }
      
      const event = constructWebhookEvent(req.body, signature);
      if (!event) {
        console.error("[Stripe Webhook] Assinatura inv\u00e1lida");
        return res.status(200).json({ verified: true, warning: "Invalid signature" });
      }
      
      // Detectar eventos de teste
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }
      
      console.log(`[Stripe Webhook] Evento recebido: ${event.type} (${event.id})`);
      
      // Processar assincronamente para responder r\u00e1pido
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const metadata = extractCheckoutMetadata(session);
        
        if (metadata.type === "sms_recharge" && metadata.establishmentId > 0) {
          const amountInReais = metadata.amountTotal / 100;
          
          console.log(`[Stripe Webhook] Recarga SMS: estabelecimento ${metadata.establishmentId}, valor R$ ${amountInReais.toFixed(2)}, ${metadata.smsCount} SMS`);
          
          // Creditar saldo SMS
          try {
            await addSmsCredit(
              metadata.establishmentId,
              amountInReais,
              `Recarga via cart\u00e3o - ${metadata.smsCount} SMS (Stripe: ${metadata.paymentIntentId})`
            );
            
            // Enviar SSE para atualizar saldo em tempo real
            const updatedBalance = await getOrCreateSmsBalance(metadata.establishmentId);
            sendEvent(metadata.establishmentId, "balanceUpdated", {
              balance: parseFloat(updatedBalance.balance as string),
              smsCount: metadata.smsCount,
            });
            
            console.log(`[Stripe Webhook] Saldo creditado com sucesso para estabelecimento ${metadata.establishmentId}`);
          } catch (creditError) {
            console.error("[Stripe Webhook] Erro ao creditar saldo:", creditError);
          }
        }
        
        // Processar pagamento de upgrade de plano
        if (session.metadata?.type === "plan_upgrade" && metadata.establishmentId > 0) {
          const planType = session.metadata.plan_type as 'basic' | 'pro' | 'enterprise';
          console.log(`[Stripe Webhook] Upgrade de plano: estabelecimento ${metadata.establishmentId}, plano: ${planType}`);
          
          try {
            const { activatePlan } = await import("../db");
            await activatePlan(metadata.establishmentId, planType);
            
            // Enviar SSE para notificar o frontend sobre a ativação do plano
            sendEvent(metadata.establishmentId, "planActivated", {
              planType,
              message: `Plano ${planType} ativado com sucesso!`,
            });
            
            console.log(`[Stripe Webhook] Plano ${planType} ativado com sucesso para estabelecimento ${metadata.establishmentId}`);
          } catch (planError) {
            console.error("[Stripe Webhook] Erro ao ativar plano:", planError);
          }
        }
        
        // Processar pagamento de pedido online via Stripe Connect
        if (session.metadata?.type === "online_order") {
          const estId = parseInt(session.metadata.establishment_id || "0");
          console.log(`[Stripe Webhook] Pedido online pago: estabelecimento ${estId}, session: ${session.id}`);
          
          try {
            // Buscar dados do pedido no banco (evita limite de 500 chars do metadata Stripe)
            const { getPendingOnlineOrder, completePendingOnlineOrder, createPublicOrder, getEstablishmentById, getPrinterSettings, addToPrintQueue } = await import("../db");
            const pendingOrder = await getPendingOnlineOrder(session.id);
            
            // Fallback: tentar metadata se não encontrar no banco (compatibilidade)
            let orderData: any = null;
            if (pendingOrder) {
              orderData = typeof pendingOrder.orderData === 'string' ? JSON.parse(pendingOrder.orderData) : pendingOrder.orderData;
              console.log(`[Stripe Webhook] Dados do pedido encontrados no banco para session ${session.id}`);
            } else {
              const orderDataStr = session.metadata.order_data;
              if (orderDataStr) {
                orderData = JSON.parse(orderDataStr);
                console.log(`[Stripe Webhook] Dados do pedido encontrados no metadata para session ${session.id}`);
              }
            }
            
            if (orderData && estId > 0) {
              
              // Criar o pedido no sistema
              const result = await createPublicOrder(
                {
                  establishmentId: estId,
                  customerName: orderData.customerName,
                  customerPhone: orderData.customerPhone,
                  customerAddress: orderData.customerAddress || null,
                  deliveryType: orderData.deliveryType || "delivery",
                  paymentMethod: "card_online",
                  subtotal: orderData.subtotal,
                  deliveryFee: orderData.deliveryFee || "0",
                  discount: orderData.discount || "0",
                  total: orderData.total,
                  notes: orderData.notes || null,
                  changeAmount: null,
                  couponCode: orderData.couponCode || null,
                  orderNumber: "",
                },
                (orderData.items || []).map((item: any) => ({
                  orderId: 0,
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  complements: (item.complements || []).map((c: any) => ({ ...c, quantity: c.quantity || 1 })),
                  notes: item.notes || null,
                }))
              );
              
              console.log(`[Stripe Webhook] Pedido online criado: #${result?.orderNumber} para estabelecimento ${estId}`);
              
              // Marcar pedido pendente como completo no banco
              if (result && pendingOrder) {
                try {
                  await completePendingOnlineOrder(session.id, result.orderId, result.orderNumber);
                  console.log(`[Stripe Webhook] Pedido pendente marcado como completo: session ${session.id}`);
                } catch (e) { console.error("[Stripe Webhook] Erro ao completar pedido pendente:", e); }
              }
              
              // Enviar SSE para notificar novo pedido
              if (result) {
                sendEvent(estId, "newOrder", {
                  orderId: result.orderId,
                  orderNumber: result.orderNumber,
                  paymentMethod: "card_online",
                });
                
                // Impressão automática
                try {
                  const printerSettingsData = await getPrinterSettings(estId);
                  if (printerSettingsData?.autoPrintEnabled && result.orderId) {
                    await addToPrintQueue({
                      establishmentId: estId,
                      orderId: result.orderId,
                      copies: 1,
                    });
                  }
                } catch (printError) {
                  console.error("[Stripe Webhook] Erro na impressão:", printError);
                }
                
                // Consumir cupom se usado
                if (orderData.couponId) {
                  try {
                    const { incrementCouponUsage } = await import("../db");
                    await incrementCouponUsage(orderData.couponId);
                  } catch (e) { console.error("[Stripe Webhook] Erro ao incrementar cupom:", e); }
                }
                
                // Consumir fidelidade se usado
                if (orderData.loyaltyCardId) {
                  try {
                    const { consumeLoyaltyCardCoupon } = await import("../db");
                    await consumeLoyaltyCardCoupon(orderData.loyaltyCardId);
                  } catch (e) { console.error("[Stripe Webhook] Erro ao consumir fidelidade:", e); }
                }
              }
            }
          } catch (orderError) {
            console.error("[Stripe Webhook] Erro ao criar pedido online:", orderError);
          }
        }
      }
      
      res.status(200).json({ verified: true, received: true });
    } catch (error) {
      console.error("[Stripe Webhook] Erro:", error);
      // Sempre retornar 200 para evitar retry do Stripe
      res.status(200).json({ verified: true, error: "Internal error" });
    }
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // SSE endpoint para pedidos em tempo real
  app.get("/api/orders/stream", async (req, res) => {
    try {
      // Extrair token do cookie ou header
      const token = req.cookies?.app_session_id || req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        console.log("[SSE] Sem token de autenticação");
        res.status(401).json({ error: "Unauthorized - no token" });
        return;
      }
      
      // Verificar token e obter usuário
      let payload;
      try {
        payload = await sdk.verifySession(token);
      } catch (verifyError) {
        console.log("[SSE] Erro ao verificar token:", verifyError);
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      
      if (!payload?.openId) {
        console.log("[SSE] Token sem openId");
        res.status(401).json({ error: "Invalid token - no openId" });
        return;
      }
      
      const user = await getUserByOpenId(payload.openId);
      if (!user) {
        console.log("[SSE] Usuário não encontrado para openId:", payload.openId);
        res.status(401).json({ error: "User not found" });
        return;
      }
      
      // Obter estabelecimento do usuário
      const establishment = await getEstablishmentByUserId(user.id);
      if (!establishment) {
        console.log("[SSE] Estabelecimento não encontrado para usuário:", user.id);
        res.status(404).json({ error: "Establishment not found" });
        return;
      }
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId: establishment.id })}\n\n`);
      
      // Adicionar conexão ao pool
      addConnection(establishment.id, res);
      
      // Configurar heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat(establishment.id);
      }, 30000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeConnection(establishment.id, res);
        console.log(`[SSE] Conexão fechada para estabelecimento ${establishment.id}`);
      });
      
    } catch (error) {
      console.error("[SSE] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // SSE endpoint para clientes acompanharem pedidos em tempo real (por orderNumbers)
  app.get("/api/orders/track/stream", async (req, res) => {
    try {
      const orderNumbersParam = req.query.orders as string;
      
      if (!orderNumbersParam) {
        console.log("[SSE-Order] Sem orderNumbers fornecidos");
        res.status(400).json({ error: "Order numbers required" });
        return;
      }
      
      // Parse dos orderNumbers (separados por vírgula)
      const orderNumbers = orderNumbersParam.split(',').map(o => o.trim()).filter(o => o.length > 0);
      
      if (orderNumbers.length === 0) {
        console.log("[SSE-Order] Lista de orderNumbers vazia");
        res.status(400).json({ error: "At least one order number required" });
        return;
      }
      
      console.log(`[SSE-Order] Iniciando conexão para pedidos: ${orderNumbers.join(', ')}`);
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ orders: orderNumbers })}\n\n`);
      
      // Buscar e enviar o status atual de cada pedido
      // Isso garante que o cliente receba o status correto mesmo que tenha se conectado depois de mudanças
      try {
        const currentOrders = await getOrdersByOrderNumbers(orderNumbers);
        console.log(`[SSE-Order] Enviando status atual de ${currentOrders.length} pedidos`);
        
        for (const order of currentOrders) {
          const statusUpdate = {
            orderNumber: order.orderNumber,
            status: order.status,
            cancellationReason: order.cancellationReason || undefined
          };
          res.write(`event: order_status_update\ndata: ${JSON.stringify(statusUpdate)}\n\n`);
          console.log(`[SSE-Order] Enviado status inicial: ${order.orderNumber} -> ${order.status}`);
        }
      } catch (error) {
        console.error('[SSE-Order] Erro ao buscar status inicial dos pedidos:', error);
      }
      
      // Adicionar conexão ao pool para cada pedido
      addOrderConnectionForMultiple(orderNumbers, res);
      
      // Configurar heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        // Enviar heartbeat genérico para esta conexão
        try {
          res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
        } catch (error) {
          console.error("[SSE-Order] Erro ao enviar heartbeat:", error);
        }
      }, 30000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeOrderConnectionFromMultiple(orderNumbers, res);
        console.log(`[SSE-Order] Conexão fechada para pedidos: ${orderNumbers.join(', ')}`);
      });
      
    } catch (error) {
      console.error("[SSE-Order] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Rota pública para gerar HTML do recibo de impressão (para app ESC POS)
  app.get("/api/print/receipt/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).send("ID do pedido inválido");
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).send("Pedido não encontrado");
        return;
      }
      
      const orderItemsList = await getOrderItems(orderId);
      const establishment = await getEstablishmentById(order.establishmentId);
      const settings = await getPrinterSettings(order.establishmentId);
      
      // Verificar se deve usar ESC/POS ou HTML
      const useEscPos = settings?.htmlPrintEnabled === false;
      
      if (useEscPos) {
        // Gerar recibo em formato texto puro ESC/POS
        const { generatePlainTextReceipt } = await import('../escpos');
        
        const orderData = {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          deliveryType: order.deliveryType as 'delivery' | 'pickup' | 'dine_in',
          customerName: order.customerName || undefined,
          customerPhone: order.customerPhone || undefined,
          address: order.customerAddress || undefined,
          paymentMethod: order.paymentMethod || undefined,
          changeFor: order.changeAmount ? parseFloat(order.changeAmount) : undefined,
          items: orderItemsList.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: parseFloat(item.totalPrice as any) || 0,
            notes: item.notes || undefined,
            complements: item.complements || undefined,
          })),
          subtotal: parseFloat(order.subtotal as any) || 0,
          deliveryFee: order.deliveryFee ? parseFloat(order.deliveryFee as any) : undefined,
          discount: order.discount ? parseFloat(order.discount as any) : undefined,
          total: parseFloat(order.total as any) || 0,
        };
        
        const textReceipt = generatePlainTextReceipt(
          orderData,
          establishment,
          (settings?.paperWidth as '58mm' | '80mm') || '80mm'
        );
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(textReceipt);
      } else {
        // Gerar HTML otimizado para impressora térmica 58mm/80mm
        const html = generateReceiptHTML(order, orderItemsList, establishment, settings);
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      }
    } catch (error) {
      console.error("[Print] Erro ao gerar recibo:", error);
      res.status(500).send("Erro ao gerar recibo");
    }
  });
  
  // Rota para teste de impressão com dados de exemplo
  // USA A MESMA FUNÇÃO generateReceiptHTML para garantir que o recibo de teste
  // seja EXATAMENTE igual ao recibo real de pedidos aceitos
  app.get("/api/print/test/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Criar pedido de exemplo com a mesma estrutura de um pedido real
      const sampleOrder = {
        orderNumber: "P999",
        createdAt: new Date(),
        deliveryType: "delivery",
        customerName: "João Silva",
        customerPhone: "11999998888",
        customerAddress: "Rua das Flores, 123 - Centro",
        subtotal: "90.80",
        deliveryFee: "5.00",
        discount: "0",
        total: "95.80",
        paymentMethod: "pix",
        changeAmount: null,
        couponCode: null,
        notes: null,
      };
      
      // Criar itens de exemplo com a mesma estrutura dos itens reais
      const sampleItems = [
        { 
          productName: "X-Burger Especial", 
          quantity: 2, 
          totalPrice: "67.80",
          notes: "Sem cebola",
          complements: JSON.stringify([{
            items: [
              { name: "Bacon extra", price: 5.00 },
              { name: "Queijo cheddar", price: 3.00 }
            ]
          }])
        },
        { 
          productName: "Batata Frita Grande", 
          quantity: 1, 
          totalPrice: "15.00",
          notes: null,
          complements: null
        },
        { 
          productName: "Refrigerante 600ml", 
          quantity: 2, 
          totalPrice: "16.00",
          notes: "Bem gelado",
          complements: null
        }
      ];
      
      // Verificar se deve usar ESC/POS ou HTML
      const useEscPos = settings?.htmlPrintEnabled === false;
      
      if (useEscPos) {
        // Gerar recibo em formato texto puro ESC/POS
        const { generatePlainTextReceipt } = await import('../escpos');
        
        const orderData = {
          orderNumber: sampleOrder.orderNumber,
          createdAt: sampleOrder.createdAt,
          deliveryType: sampleOrder.deliveryType as 'delivery' | 'pickup' | 'dine_in',
          customerName: sampleOrder.customerName,
          customerPhone: sampleOrder.customerPhone,
          address: sampleOrder.customerAddress,
          paymentMethod: sampleOrder.paymentMethod,
          items: sampleItems.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: parseFloat(item.totalPrice),
            notes: item.notes || undefined,
            complements: item.complements || undefined,
          })),
          subtotal: parseFloat(sampleOrder.subtotal),
          deliveryFee: parseFloat(sampleOrder.deliveryFee),
          discount: parseFloat(sampleOrder.discount),
          total: parseFloat(sampleOrder.total),
        };
        
        const textReceipt = generatePlainTextReceipt(
          orderData,
          establishment,
          (settings?.paperWidth as '58mm' | '80mm') || '80mm'
        );
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(textReceipt);
      } else {
        // Usar EXATAMENTE a mesma função que gera o recibo real
        const html = generateReceiptHTML(sampleOrder, sampleItems, establishment, settings);
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      }
    } catch (error) {
      console.error("[Print Test] Erro ao gerar recibo de teste:", error);
      res.status(500).send("Erro ao gerar recibo de teste");
    }
  });
  
  // Rota para impressão de texto personalizado
  app.get("/api/print/custom/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      const customText = req.query.text as string || '';
      
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Configurações de fonte
      const fontSize = settings?.fontSize || 12;
      const fontWeight = settings?.fontWeight || 500;
      const titleFontSize = settings?.titleFontSize || 16;
      const titleFontWeight = settings?.titleFontWeight || 700;
      const paperWidth = settings?.paperWidth || '80mm';
      const showDividers = settings?.showDividers ?? false;
      
      const maxWidth = paperWidth === "58mm" ? "220px" : "300px";
      const establishmentName = establishment?.name || "Restaurante";
      
      // Converter quebras de linha para <br>
      const formattedText = customText.replace(/\n/g, '<br>');
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Impressão Personalizada</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: ${fontSize}px; 
      font-weight: ${fontWeight};
      padding: 15px; 
      max-width: ${maxWidth}; 
      margin: 0 auto; 
      background: #fff;
      color: #333;
    }
    .receipt {
      background: #fff;
      padding: 8px;
    }
    .header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #ccc;' : ''}
    }
    .header h1 {
      font-size: ${titleFontSize + 4}px;
      font-weight: ${titleFontWeight};
      margin: 0;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 1px solid #ccc;' : ''}
      font-size: ${fontSize - 2}px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${establishmentName}</h1>
    </div>
    <div class="content">
      ${formattedText}
    </div>
    <div class="footer">
      <p>Cardapio Admin</p>
    </div>
  </div>
</body>
</html>
      `;
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("[Print Custom] Erro ao gerar impressão personalizada:", error);
      res.status(500).send("Erro ao gerar impressão personalizada");
    }
  });
  
  // Endpoint para gerar deep link do Multi Printer Print Service
  // Permite imprimir em múltiplas impressoras simultaneamente via app Android
  app.get("/api/print/multiprinter/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "ID do pedido inválido" });
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: "Pedido não encontrado" });
        return;
      }
      
      // Buscar impressoras ativas do estabelecimento
      const printers = await getActivePrinters(order.establishmentId);
      
      if (printers.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // URL pública do recibo
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const receiptUrl = `${baseUrl}/api/print/receipt/${orderId}`;
      
      // Gerar deep link para o app Multi Printer
      // Formato: print://escpos.org/escpos/mnps/print?mpjo=[{jobs}]
      // Usando printerIpAddr e printerPort para enviar diretamente para o IP da impressora
      const printJobs = printers.map((printer: any) => ({
        srcTp: "uri",
        srcObj: "html",
        src: encodeURIComponent(receiptUrl),
        printerIpAddr: printer.ipAddress,
        printerPort: String(printer.port || 9100),
        numCopies: 1,
        openCashDrawer: 0
      }));
      
      // O deep link usa o JSON array diretamente, encodado uma vez
      const deepLink = `print://escpos.org/escpos/mnps/print?mpjo=${encodeURIComponent(JSON.stringify(printJobs))}`;
      
      res.json({
        success: true,
        deepLink,
        receiptUrl,
        printers: printers.map((p: any) => ({ name: p.name, ip: p.ipAddress, port: p.port })),
        orderId,
        orderNumber: order.orderNumber
      });
    } catch (error) {
      console.error("[MultiPrinter] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });
  
  // Endpoint para gerar deep link de teste (sem pedido real)
  app.get("/api/print/multiprinter-test/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      if (isNaN(establishmentId)) {
        res.status(400).json({ error: "ID do estabelecimento inválido" });
        return;
      }
      
      // Buscar impressoras ativas do estabelecimento
      const printers = await getActivePrinters(establishmentId);
      
      if (printers.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // URL pública do recibo de teste
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const receiptUrl = `${baseUrl}/api/print/test/${establishmentId}`;
      
      // Gerar deep link para o app Multi Printer
      // Usando printerIpAddr e printerPort para enviar diretamente para o IP da impressora
      const printJobs = printers.map((printer: any) => ({
        srcTp: "uri",
        srcObj: "html",
        src: encodeURIComponent(receiptUrl),
        printerIpAddr: printer.ipAddress,
        printerPort: String(printer.port || 9100),
        numCopies: 1,
        openCashDrawer: 0
      }));
      
      const deepLink = `print://escpos.org/escpos/mnps/print?mpjo=${encodeURIComponent(JSON.stringify(printJobs))}`;
      
      res.json({
        success: true,
        deepLink,
        receiptUrl,
        printers: printers.map((p: any) => ({ name: p.name, ip: p.ipAddress, port: p.port }))
      });
    } catch (error) {
      console.error("[MultiPrinter Test] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });

  // Endpoint para gerar deep link com separação de itens por setor/impressora
  // Cada impressora recebe apenas os itens do seu setor
  app.get("/api/print/multiprinter-sectors/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "ID do pedido inválido" });
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: "Pedido não encontrado" });
        return;
      }
      
      // Buscar itens do pedido com informações da impressora
      const itemsWithPrinter = await getOrderItemsWithPrinter(orderId);
      
      // Buscar todas as impressoras ativas
      const allPrinters = await getActivePrinters(order.establishmentId);
      
      if (allPrinters.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // Agrupar itens por impressora
      const itemsByPrinter = new Map<number, typeof itemsWithPrinter>();
      const itemsWithoutPrinter: typeof itemsWithPrinter = [];
      
      for (const item of itemsWithPrinter) {
        if (item.printerId && item.printerActive) {
          if (!itemsByPrinter.has(item.printerId)) {
            itemsByPrinter.set(item.printerId, []);
          }
          itemsByPrinter.get(item.printerId)!.push(item);
        } else {
          // Itens sem impressora definida vão para todas as impressoras
          itemsWithoutPrinter.push(item);
        }
      }
      
      // URL base
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Gerar jobs de impressão
      const printJobs: any[] = [];
      const printersSummary: any[] = [];
      
      // Se há itens sem setor definido, precisamos enviar para todas as impressoras
      // Então geramos um job para cada impressora ativa
      if (itemsWithoutPrinter.length > 0) {
        // Itens sem setor vão para TODAS as impressoras
        for (const printer of allPrinters) {
          const receiptUrl = `${baseUrl}/api/print/receipt-sector/${orderId}/${printer.id}`;
          
          // Combinar itens do setor específico + itens sem setor
          const printerSpecificItems = itemsByPrinter.get(printer.id) || [];
          const allItemsForPrinter = [...printerSpecificItems, ...itemsWithoutPrinter];
          
          if (allItemsForPrinter.length > 0) {
            printJobs.push({
              srcTp: "uri",
              srcObj: "html",
              src: encodeURIComponent(receiptUrl),
              printerIpAddr: printer.ipAddress,
              printerPort: String(printer.port || 9100),
              numCopies: 1,
              openCashDrawer: 0
            });
            
            printersSummary.push({
              name: printer.name,
              ip: printer.ipAddress,
              port: printer.port,
              items: allItemsForPrinter.map((i: any) => i.productName)
            });
          }
        }
      } else {
        // Não há itens sem setor, enviar apenas para impressoras com itens associados
        for (const [printerId, items] of Array.from(itemsByPrinter.entries())) {
          const printer = allPrinters.find((p: any) => p.id === printerId);
          if (!printer) continue;
          
          // URL do recibo filtrado por setor
          const receiptUrl = `${baseUrl}/api/print/receipt-sector/${orderId}/${printerId}`;
          
          printJobs.push({
            srcTp: "uri",
            srcObj: "html",
            src: encodeURIComponent(receiptUrl),
            printerIpAddr: printer.ipAddress,
            printerPort: String(printer.port || 9100),
            numCopies: 1,
            openCashDrawer: 0
          });
          
          printersSummary.push({
            name: printer.name,
            ip: printer.ipAddress,
            port: printer.port,
            items: items.map((i: any) => i.productName)
          });
        }
      }
      
      if (printJobs.length === 0) {
        res.status(400).json({ error: "Nenhum item para imprimir" });
        return;
      }
      
      const deepLink = `print://escpos.org/escpos/mnps/print?mpjo=${encodeURIComponent(JSON.stringify(printJobs))}`;
      
      res.json({
        success: true,
        deepLink,
        printers: printersSummary,
        orderId,
        orderNumber: order.orderNumber,
        mode: "sectors"
      });
    } catch (error) {
      console.error("[MultiPrinter Sectors] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });
  
  // Endpoint para gerar recibo filtrado por setor/impressora
  // Usa o mesmo layout completo do recibo normal, apenas filtrando os itens por setor
  app.get("/api/print/receipt-sector/:orderId/:printerId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const printerId = parseInt(req.params.printerId);
      
      if (isNaN(orderId) || isNaN(printerId)) {
        res.status(400).send("Parâmetros inválidos");
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).send("Pedido não encontrado");
        return;
      }
      
      // Buscar todos os itens do pedido
      const allOrderItems = await getOrderItems(orderId);
      
      // Buscar itens com informação de impressora para filtrar
      const itemsWithPrinter = await getOrderItemsWithPrinter(orderId);
      
      // Filtrar IDs dos itens desta impressora específica
      const sectorSpecificItemIds = itemsWithPrinter
        .filter((item: any) => item.printerId === printerId)
        .map((item: any) => item.id);
      
      // Filtrar IDs dos itens sem setor definido (printerId = null) - vão para todas as impressoras
      const noSectorItemIds = itemsWithPrinter
        .filter((item: any) => item.printerId === null || item.printerId === undefined)
        .map((item: any) => item.id);
      
      // Combinar: itens deste setor + itens sem setor (que vão para todas)
      const allSectorItemIds = [...sectorSpecificItemIds, ...noSectorItemIds];
      
      // Filtrar os itens completos do pedido
      const sectorItems = allOrderItems.filter((item: any) => allSectorItemIds.includes(item.id));
      
      if (sectorItems.length === 0) {
        res.status(404).send("Nenhum item para esta impressora");
        return;
      }
      
      const establishment = await getEstablishmentById(order.establishmentId);
      const settings = await getPrinterSettings(order.establishmentId);
      
      // Usar o mesmo layout completo do recibo normal, apenas com itens filtrados
      const html = generateReceiptHTML(order, sectorItems, establishment, settings);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error("[Receipt Sector] Erro:", error);
      res.status(500).send("Erro ao gerar recibo");
    }
  });

  // Rota para gerar HTML do recibo de comanda (tab) para impressão
  app.get("/api/print/tab-receipt/:tabId", async (req, res) => {
    try {
      const tabId = parseInt(req.params.tabId);
      if (isNaN(tabId)) {
        res.status(400).send("ID da comanda inválido");
        return;
      }
      
      const tab = await getTabById(tabId);
      if (!tab) {
        res.status(404).send("Comanda não encontrada");
        return;
      }
      
      const tabItemsList = await getTabItems(tabId);
      const table = tab.tableId ? await getTableById(tab.tableId) : null;
      const establishment = await getEstablishmentById(tab.establishmentId);
      const settings = await getPrinterSettings(tab.establishmentId);
      
      // Gerar HTML do recibo da comanda
      const html = generateTabReceiptHTML(tab, tabItemsList, table, establishment, settings);
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("[Print Tab] Erro ao gerar recibo:", error);
      res.status(500).send("Erro ao gerar recibo da comanda");
    }
  });

  // Endpoint para gerar deep link de impressão de comanda em múltiplas impressoras Android
  app.get("/api/print/multiprinter-tab/:tabId", async (req, res) => {
    try {
      const tabId = parseInt(req.params.tabId);
      if (isNaN(tabId)) {
        res.status(400).json({ error: "ID da comanda inválido" });
        return;
      }
      
      const tab = await getTabById(tabId);
      if (!tab) {
        res.status(404).json({ error: "Comanda não encontrada" });
        return;
      }
      
      // Buscar impressoras ativas do estabelecimento
      const printers = await getActivePrinters(tab.establishmentId);
      
      if (printers.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // URL pública do recibo da comanda
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const receiptUrl = `${baseUrl}/api/print/tab-receipt/${tabId}`;
      
      // Gerar deep link para o app Multi Printer
      const printJobs = printers.map((printer: any) => ({
        srcTp: "uri",
        srcData: receiptUrl,
        printerIpAddr: printer.ipAddress || "",
        printerPort: printer.port || 9100,
        printerName: printer.name || "Impressora",
        copies: 1
      }));
      
      const deepLinkData = encodeURIComponent(JSON.stringify(printJobs));
      const deepLink = `multiprinter://print?data=${deepLinkData}`;
      
      res.json({
        success: true,
        deepLink,
        printers: printers.map((p: any) => ({ name: p.name, ip: p.ipAddress })),
        tabId
      });
    } catch (error) {
      console.error("[MultiPrinter Tab] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });

  // Webhook para receber respostas dos botões do WhatsApp (UAZAPI)
  app.post("/api/webhook/whatsapp/:establishmentId", express.json(), async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      const body = req.body;
      
      console.log('[WhatsApp Webhook] Recebido:', JSON.stringify(body, null, 2));
      
      // Verificar se é uma resposta de botão
      // A UAZAPI envia o payload em diferentes formatos:
      // - Direto no body (quando addUrlEvents está ativo)
      // - Em body.message ou body.data
      const message = body.message || body.data || body;
      
      // O campo correto para botões na UAZAPI é 'buttonOrListid'
      // Também verificamos outros campos possíveis para compatibilidade
      const buttonId = message?.buttonOrListid || message?.buttonId || message?.selectedButtonId || message?.selectedId || body?.buttonOrListid;
      const messageText = message?.text || message?.body || message?.conversation;
      const senderPhone = message?.sender || message?.from || body?.sender || body?.from;
      
      if (buttonId) {
        console.log('[WhatsApp Webhook] Botão clicado:', buttonId);
        console.log('[WhatsApp Webhook] Sender phone:', senderPhone);
        
        // Extrair o número do pedido do buttonId
        // Formato: confirm_order_#P123 ou cancel_order_#P123
        const confirmMatch = buttonId.match(/confirm_order_(#P\d+)/);
        const cancelMatch = buttonId.match(/cancel_order_(#P\d+)/);
        
        if (confirmMatch) {
          const orderNumber = confirmMatch[1];
          console.log('[WhatsApp Webhook] Pedido confirmado:', orderNumber);
          
          // Buscar e atualizar o pedido
          const { confirmOrderByNumber } = await import('../db');
          const result = await confirmOrderByNumber(establishmentId, orderNumber);
          console.log('[WhatsApp Webhook] Resultado confirmação:', result);
          
          // Mensagem de confirmação removida - o estabelecimento pode configurar suas próprias notificações
          if (result.success) {
            console.log('[WhatsApp Webhook] Pedido confirmado com sucesso, sem mensagem automática');
          }
        } else if (cancelMatch) {
          const orderNumber = cancelMatch[1];
          console.log('[WhatsApp Webhook] Pedido cancelado pelo cliente:', orderNumber);
          
          // Buscar e cancelar o pedido
          const { cancelOrderByNumber } = await import('../db');
          const result = await cancelOrderByNumber(establishmentId, orderNumber, 'Cancelado pelo cliente via WhatsApp');
          console.log('[WhatsApp Webhook] Resultado cancelamento:', result);
          
          if (result.success) {
            // Enviar mensagem de cancelamento
            const { getWhatsappConfig } = await import('../db');
            const { sendTextMessage } = await import('./uazapi');
            const config = await getWhatsappConfig(establishmentId);
            
            // Usar senderPhone que já foi extraído acima
            if (config?.instanceToken && senderPhone) {
              const phone = senderPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
              await sendTextMessage(
                config.instanceToken,
                phone,
                `❌ Seu pedido ${orderNumber} foi cancelado conforme solicitado.\n\nSe mudar de ideia, faça um novo pedido pelo nosso cardápio!`
              );
            }
          }
        }
      } else {
        // Log para debug quando não encontrar buttonId
        console.log('[WhatsApp Webhook] Nenhum buttonId encontrado. Campos disponíveis:', {
          hasMessage: !!body.message,
          hasData: !!body.data,
          messageKeys: body.message ? Object.keys(body.message) : [],
          dataKeys: body.data ? Object.keys(body.data) : [],
          bodyKeys: Object.keys(body),
        });
      }
      
      // Sempre responder 200 para o webhook
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[WhatsApp Webhook] Erro:', error);
      res.status(200).json({ success: false, error: 'Internal error' });
    }
  });

  // iFood Webhook endpoint
  app.post("/api/ifood/webhook", async (req, res) => {
    try {
      console.log('[iFood Webhook] Evento recebido:', JSON.stringify(req.body).substring(0, 500));
      
      const events = Array.isArray(req.body) ? req.body : [req.body];
      
      for (const event of events) {
        if (!event.id || !event.code || !event.orderId) {
          console.log('[iFood Webhook] Evento inválido, ignorando');
          continue;
        }
        
        // Processar evento via tRPC (internamente)
        try {
          // Import dinâmico para evitar dependência circular
          const { processIfoodWebhookEvent } = await import('../ifood');
          await processIfoodWebhookEvent(event);
        } catch (processError) {
          console.error('[iFood Webhook] Erro ao processar evento:', processError);
        }
      }
      
      // Sempre responder 200 para o webhook
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[iFood Webhook] Erro:', error);
      res.status(200).json({ success: false, error: 'Internal error' });
    }
  });

  // ============ MENU IMPORT SSE ============
  // In-memory store for import progress per establishment
  const importProgressMap = new Map<number, { progress: number; message: string; status: 'idle' | 'running' | 'done' | 'error'; result?: any; error?: string }>();
  
  // SSE endpoint for menu import progress
  app.get("/api/menu-import/progress/:establishmentId", async (req, res) => {
    try {
      const token = req.cookies?.app_session_id || req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      let payload;
      try {
        payload = await sdk.verifySession(token);
      } catch {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      
      if (!payload?.openId) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      
      const establishmentId = parseInt(req.params.establishmentId);
      
      // SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      
      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId })}\n\n`);
      
      // Poll progress every 500ms
      const interval = setInterval(() => {
        const state = importProgressMap.get(establishmentId);
        if (state) {
          res.write(`event: progress\ndata: ${JSON.stringify(state)}\n\n`);
          if (state.status === 'done' || state.status === 'error') {
            clearInterval(interval);
            setTimeout(() => {
              importProgressMap.delete(establishmentId);
              res.end();
            }, 1000);
          }
        }
      }, 500);
      
      req.on("close", () => {
        clearInterval(interval);
      });
    } catch (error) {
      console.error("[Menu Import SSE] Error:", error);
      res.status(500).json({ error: "Internal error" });
    }
  });
  
  // POST endpoint to start menu import
  app.post("/api/menu-import/start", async (req, res) => {
    try {
      const token = req.cookies?.app_session_id || req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      let payload;
      try {
        payload = await sdk.verifySession(token);
      } catch {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      
      if (!payload?.openId) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      
      const user = await getUserByOpenId(payload.openId);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      
      const establishment = await getEstablishmentByUserId(user.id);
      if (!establishment) {
        res.status(404).json({ error: "Establishment not found" });
        return;
      }
      
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: "URL is required" });
        return;
      }
      
      // Check if import is already running
      const currentState = importProgressMap.get(establishment.id);
      if (currentState?.status === 'running') {
        res.status(409).json({ error: "Uma importação já está em andamento" });
        return;
      }
      
      // Initialize progress
      importProgressMap.set(establishment.id, { progress: 0, message: 'Iniciando...', status: 'running' });
      
      // Return immediately, import runs in background
      res.json({ success: true, message: "Import started" });
      
      // Run import asynchronously
      (async () => {
        try {
          const { importMenu } = await import("../menuImport");
          const result = await importMenu(
            establishment.id,
            url,
            (progress: number, message: string) => {
              importProgressMap.set(establishment.id, { progress, message, status: 'running' });
            }
          );
          
          importProgressMap.set(establishment.id, {
            progress: 100,
            message: 'Importação concluída!',
            status: 'done',
            result,
          });
        } catch (error: any) {
          console.error("[Menu Import] Error:", error);
          importProgressMap.set(establishment.id, {
            progress: 0,
            message: error.message || 'Erro durante a importação',
            status: 'error',
            error: error.message || 'Erro desconhecido',
          });
        }
      })();
    } catch (error) {
      console.error("[Menu Import] Error:", error);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Iniciar job de processamento de campanhas agendadas
    startScheduledCampaignJob();
  });
}

startServer().catch(console.error);
