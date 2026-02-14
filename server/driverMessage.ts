/**
 * Helper function to build WhatsApp delivery notification message for drivers.
 * Follows the user-defined format with emojis, structured address, and troco info.
 */
export function buildDriverDeliveryMessage(order: {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentMethod: string;
  total: string;
  deliveryFee: string;
  notes: string | null;
  changeAmount: string | null;
}, deliveryFeeOverride?: number): string {
  const address = order.customerAddress || '';
  const fee = deliveryFeeOverride !== undefined ? deliveryFeeOverride : parseFloat(order.deliveryFee || '0');
  
  // Parse address parts: "Rua X, 123 - Apto 1, Bairro Y (Ref: ponto ref)"
  // Format: street, number[ - complement], neighborhood[ (Ref: reference)]
  let addressBlock = '';
  if (address) {
    // Split by comma to get parts
    const parts = address.split(',').map(p => p.trim());
    // First part: street
    const street = parts[0] || '';
    // Second part: number (may include complement after " - ")
    const numberPart = parts[1] || '';
    // Third part: neighborhood (may include reference in parentheses)
    const neighborhoodPart = parts.slice(2).join(',').trim();
    
    // Extract reference from neighborhood part if present
    const refMatch = neighborhoodPart.match(/^(.+?)\s*\(Ref:\s*(.+?)\)$/);
    const neighborhood = refMatch ? refMatch[1].trim() : neighborhoodPart;
    const reference = refMatch ? refMatch[2].trim() : '';
    
    addressBlock = `\n📍 *Endereço:*\n${street}, ${numberPart}\n${neighborhood}`;
    if (reference) {
      addressBlock += `\nRef: ${reference}`;
    }
  } else {
    addressBlock = `\n📍 *Endereço:* N/A`;
  }
  
  // Payment method label
  const paymentLabel = order.paymentMethod === 'cash' ? 'Dinheiro' 
    : order.paymentMethod === 'card' ? 'Cartão' 
    : order.paymentMethod === 'card_online' ? 'Cartão Online'
    : order.paymentMethod === 'pix' ? 'Pix' 
    : order.paymentMethod === 'boleto' ? 'Boleto'
    : order.paymentMethod;
  
  // Build change/troco info for cash payments
  let trocoBlock = '';
  if (order.paymentMethod === 'cash') {
    const changeAmount = parseFloat(order.changeAmount || '0');
    if (changeAmount > 0) {
      const trocoFormatted = `R$ ${changeAmount.toFixed(2).replace('.', ',')}`;
      trocoBlock = `\n💵 *Troco para:* ${trocoFormatted}`;
    } else {
      trocoBlock = `\n💵 *Troco:* Não precisa`;
    }
  }
  
  const message = `🛵 *NOVA ENTREGA*\n\n` +
    `📦 Pedido: ${order.orderNumber}\n` +
    `👤 Cliente: ${order.customerName || 'N/A'}\n` +
    `📞 Telefone: ${order.customerPhone || 'N/A'}\n` +
    addressBlock + `\n\n` +
    `💳 Pagamento: ${paymentLabel}\n` +
    `💰 Total: R$ ${parseFloat(order.total || '0').toFixed(2).replace('.', ',')}\n` +
    `🛵 Taxa de entrega: R$ ${fee.toFixed(2).replace('.', ',')}` +
    trocoBlock +
    (order.notes ? `\n\n*Observações:* ${order.notes}` : '');
  
  return message;
}
