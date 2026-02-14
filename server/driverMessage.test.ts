import { describe, it, expect } from 'vitest';
import { buildDriverDeliveryMessage } from './driverMessage';

describe('buildDriverDeliveryMessage', () => {
  const baseOrder = {
    orderNumber: '#P3',
    customerName: 'Kelri',
    customerPhone: '88 99929-0000',
    customerAddress: 'fdsf, 234, Bairro do Cruzeiro (Ref: fdsf)',
    paymentMethod: 'cash',
    total: '92.00',
    deliveryFee: '2.00',
    notes: null,
    changeAmount: null,
  };

  it('should include NOVA ENTREGA header with emoji', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('*NOVA ENTREGA*');
    expect(msg).toContain('🛵');
  });

  it('should include order number without double hash', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Pedido: #P3');
    expect(msg).not.toContain('##P3');
  });

  it('should include customer name and phone', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Cliente: Kelri');
    expect(msg).toContain('Telefone: 88 99929-0000');
  });

  it('should parse address into structured format with street, neighborhood, and reference', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('*Endereço:*');
    expect(msg).toContain('fdsf, 234');
    expect(msg).toContain('Bairro do Cruzeiro');
    expect(msg).toContain('Ref: fdsf');
  });

  it('should show "Dinheiro" for cash payment', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Pagamento: Dinheiro');
  });

  it('should show total and delivery fee', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('Total: R$ 92,00');
    expect(msg).toContain('Taxa de entrega: R$ 2,00');
  });

  it('should show "Troco: Não precisa" when cash payment with no changeAmount', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).toContain('💵');
    expect(msg).toContain('*Troco:* Não precisa');
  });

  it('should show troco value when cash payment with changeAmount', () => {
    const order = { ...baseOrder, changeAmount: '100.00' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('💵');
    expect(msg).toContain('*Troco para:* R$ 100,00');
    expect(msg).not.toContain('Não precisa');
  });

  it('should NOT show troco info when payment is card', () => {
    const order = { ...baseOrder, paymentMethod: 'card', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Cartão');
    expect(msg).not.toContain('Troco');
    expect(msg).not.toContain('💵');
  });

  it('should NOT show troco info when payment is pix', () => {
    const order = { ...baseOrder, paymentMethod: 'pix', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Pix');
    expect(msg).not.toContain('Troco');
    expect(msg).not.toContain('💵');
  });

  it('should show card_online as "Cartão Online"', () => {
    const order = { ...baseOrder, paymentMethod: 'card_online', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Cartão Online');
  });

  it('should show boleto as "Boleto"', () => {
    const order = { ...baseOrder, paymentMethod: 'boleto', changeAmount: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Pagamento: Boleto');
  });

  it('should include notes/observations when present', () => {
    const order = { ...baseOrder, notes: 'Sem cebola' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Observações:* Sem cebola');
  });

  it('should NOT include notes section when notes is null', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).not.toContain('Observações');
  });

  it('should NOT include Google Maps link in the message', () => {
    const msg = buildDriverDeliveryMessage(baseOrder);
    expect(msg).not.toContain('Abrir no mapa');
    expect(msg).not.toContain('google.com/maps');
  });

  it('should show N/A for missing address', () => {
    const order = { ...baseOrder, customerAddress: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Endereço:* N/A');
  });

  it('should show N/A for missing customer name', () => {
    const order = { ...baseOrder, customerName: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Cliente: N/A');
  });

  it('should show N/A for missing phone', () => {
    const order = { ...baseOrder, customerPhone: null };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Telefone: N/A');
  });

  it('should use deliveryFeeOverride when provided', () => {
    const msg = buildDriverDeliveryMessage(baseOrder, 5.50);
    expect(msg).toContain('Taxa de entrega: R$ 5,50');
    expect(msg).not.toContain('Taxa de entrega: R$ 2,00');
  });

  it('should handle address without reference', () => {
    const order = { ...baseOrder, customerAddress: 'Rua das Flores, 123, Centro' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Rua das Flores, 123');
    expect(msg).toContain('Centro');
    expect(msg).not.toContain('Ref:');
  });

  it('should handle address with complement', () => {
    const order = { ...baseOrder, customerAddress: 'Rua X, 100 - Apto 301, Bairro Y (Ref: perto do mercado)' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('Rua X, 100 - Apto 301');
    expect(msg).toContain('Bairro Y');
    expect(msg).toContain('Ref: perto do mercado');
  });

  it('should handle changeAmount with "0" as no change needed', () => {
    const order = { ...baseOrder, changeAmount: '0' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Troco:* Não precisa');
  });

  it('should handle changeAmount with "0.00" as no change needed', () => {
    const order = { ...baseOrder, changeAmount: '0.00' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Troco:* Não precisa');
  });

  it('should format large troco values correctly', () => {
    const order = { ...baseOrder, changeAmount: '200.00' };
    const msg = buildDriverDeliveryMessage(order);
    expect(msg).toContain('*Troco para:* R$ 200,00');
  });

  it('should produce the expected full message format for cash with troco', () => {
    const order = {
      orderNumber: '#P3',
      customerName: 'Kelri',
      customerPhone: '88 99929-0000',
      customerAddress: 'fdsf, 234, Bairro do Cruzeiro (Ref: fdsf)',
      paymentMethod: 'cash',
      total: '92.00',
      deliveryFee: '2.00',
      notes: null,
      changeAmount: '100.00',
    };
    const msg = buildDriverDeliveryMessage(order);
    
    // Verify key sections are in order
    const novaEntregaIdx = msg.indexOf('*NOVA ENTREGA*');
    const pedidoIdx = msg.indexOf('Pedido:');
    const clienteIdx = msg.indexOf('Cliente:');
    const telefoneIdx = msg.indexOf('Telefone:');
    const enderecoIdx = msg.indexOf('*Endereço:*');
    const pagamentoIdx = msg.indexOf('Pagamento:');
    const totalIdx = msg.indexOf('Total:');
    const taxaIdx = msg.indexOf('Taxa de entrega:');
    const trocoIdx = msg.indexOf('*Troco para:*');
    
    expect(novaEntregaIdx).toBeLessThan(pedidoIdx);
    expect(pedidoIdx).toBeLessThan(clienteIdx);
    expect(clienteIdx).toBeLessThan(telefoneIdx);
    expect(telefoneIdx).toBeLessThan(enderecoIdx);
    expect(enderecoIdx).toBeLessThan(pagamentoIdx);
    expect(pagamentoIdx).toBeLessThan(totalIdx);
    expect(totalIdx).toBeLessThan(taxaIdx);
    expect(taxaIdx).toBeLessThan(trocoIdx);
  });
});
