import { describe, it, expect } from 'vitest';
import { generatePlainTextReceipt, OrderData } from './escpos';

describe('generatePlainTextReceipt - layout v2', () => {
  const sampleOrder: OrderData = {
    orderNumber: 'P999',
    createdAt: new Date('2026-02-23T23:16:00-03:00'),
    deliveryType: 'delivery',
    customerName: 'João Silva',
    customerPhone: '11999998888',
    address: 'Rua das Flores, 123 - Centro',
    paymentMethod: 'pix',
    items: [
      {
        productName: 'X-BURGER ESPECIAL',
        quantity: 2,
        totalPrice: 67.80,
        complements: [
          { name: 'Bacon extra', price: 5.00 },
          { name: 'Queijo cheddar', price: 3.00 },
        ],
      },
      {
        productName: 'BATATA FRITA GRANDE',
        quantity: 1,
        totalPrice: 15.00,
      },
      {
        productName: 'REFRIGERANTE 600ML',
        quantity: 2,
        totalPrice: 16.00,
      },
    ],
    subtotal: 90.80,
    deliveryFee: 5.00,
    total: 95.80,
  };

  const sampleEstablishment = {
    name: 'Sushi Haruno',
    timezone: 'America/Sao_Paulo',
  };

  it('deve conter o nome do estabelecimento centralizado e em maiúsculas', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('SUSHI HARUNO');
  });

  it('deve conter header condensado: #P999 data | ENTREGA |', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    // Formato: #P999 DD/MM/YYYY - HH:MM | ENTREGA |
    expect(receipt).toMatch(/#P999\s+\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2} \| ENTREGA \|/);
  });

  it('NÃO deve conter PEDIDO: nem TIPO: como linhas separadas', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    // Não deve ter "PEDIDO:" como linha separada
    expect(receipt).not.toMatch(/^.*PEDIDO:.*$/m);
    // Não deve ter "TIPO:" como linha separada
    expect(receipt).not.toMatch(/^.*TIPO:.*$/m);
  });

  it('deve usar separadores duplos (=) antes e depois dos totais', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    const doubleLines = receipt.split('\n').filter(l => /^={10,}$/.test(l.trim()));
    expect(doubleLines.length).toBeGreaterThanOrEqual(2);
  });

  it('deve usar separadores simples (-) entre seções', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    const singleLines = receipt.split('\n').filter(l => /^-{10,}$/.test(l.trim()));
    expect(singleLines.length).toBeGreaterThanOrEqual(1);
  });

  it('deve exibir CLIENTE: com o nome na mesma linha', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('CLIENTE: Joao Silva');
  });

  it('deve formatar telefone com parênteses', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('Tel: (11) 99999-8888');
  });

  it('deve exibir seção ENDERECO', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('ENDERECO');
    expect(receipt).toContain('Rua das Flores, 123 - Centro');
  });

  it('deve exibir seção ITENS', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('ITENS');
  });

  it('deve exibir nome do item sem preço na mesma linha', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    const lines = receipt.split('\n');
    // Deve ter uma linha com "2x X-BURGER ESPECIAL" sem preço
    const itemLine = lines.find(l => l.includes('2x X-BURGER ESPECIAL'));
    expect(itemLine).toBeDefined();
    expect(itemLine).not.toContain('R$ 67,80');
  });

  it('deve exibir preço do item em linha separada alinhado à direita', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    // O preço R$ 67,80 deve estar em sua própria linha, alinhado à direita
    expect(receipt).toContain('R$ 67,80');
    expect(receipt).toContain('R$ 15,00');
    expect(receipt).toContain('R$ 16,00');
  });

  it('deve exibir complementos com pontos entre nome e preço', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toMatch(/\+ Bacon extra\s+\.+\s+R\$ 5,00/);
    expect(receipt).toMatch(/\+ Queijo cheddar\s+\.+\s+R\$ 3,00/);
  });

  it('complementos devem vir ANTES do preço do item', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    const lines = receipt.split('\n');
    const baconIdx = lines.findIndex(l => l.includes('Bacon extra'));
    const priceIdx = lines.findIndex((l, i) => i > baconIdx && l.trim().endsWith('R$ 67,80'));
    expect(baconIdx).toBeGreaterThan(-1);
    expect(priceIdx).toBeGreaterThan(baconIdx);
  });

  it('deve exibir subtotal e taxa de entrega', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('Subtotal:');
    expect(receipt).toContain('R$ 90,80');
    expect(receipt).toContain('Taxa entrega:');
  });

  it('deve exibir TOTAL com valor correto', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('TOTAL:');
    expect(receipt).toContain('R$ 95,80');
  });

  it('deve exibir PAGAMENTO: PIX', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('PAGAMENTO: PIX');
  });

  it('deve exibir rodapé com agradecimento', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment);
    expect(receipt).toContain('Obrigado pela preferencia!');
    expect(receipt).toContain('Volte sempre!');
  });

  it('deve funcionar com papel 58mm', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment, '58mm');
    expect(receipt).toContain('SUSHI HARUNO');
    const doubleLines = receipt.split('\n').filter(l => /^={10,}$/.test(l.trim()));
    expect(doubleLines[0].trim().length).toBe(32);
  });

  it('deve funcionar com papel 80mm', () => {
    const receipt = generatePlainTextReceipt(sampleOrder, sampleEstablishment, '80mm');
    const doubleLines = receipt.split('\n').filter(l => /^={10,}$/.test(l.trim()));
    expect(doubleLines[0].trim().length).toBe(48);
  });

  it('deve exibir | RETIRADA | para pedidos pickup', () => {
    const pickupOrder = { ...sampleOrder, deliveryType: 'pickup' as const };
    const receipt = generatePlainTextReceipt(pickupOrder, sampleEstablishment);
    expect(receipt).toContain('| RETIRADA |');
  });

  it('deve exibir troco para pagamento em dinheiro', () => {
    const cashOrder = { ...sampleOrder, paymentMethod: 'cash', changeFor: 100 };
    const receipt = generatePlainTextReceipt(cashOrder, sampleEstablishment);
    expect(receipt).toContain('PAGAMENTO: DINHEIRO');
    expect(receipt).toContain('Troco para: R$ 100,00');
    expect(receipt).toContain('Troco a devolver: R$ 4,20');
  });

  it('não deve exibir dados do cliente para pedidos de mesa', () => {
    const tableOrder = { ...sampleOrder, deliveryType: 'dine_in' as const, customerName: 'Mesa 5' };
    const receipt = generatePlainTextReceipt(tableOrder, sampleEstablishment);
    expect(receipt).not.toContain('CLIENTE:');
    expect(receipt).not.toContain('PAGAMENTO:');
  });

  it('deve exibir desconto quando aplicável', () => {
    const discountOrder = { ...sampleOrder, discount: 10.00, total: 85.80 };
    const receipt = generatePlainTextReceipt(discountOrder, sampleEstablishment);
    expect(receipt).toContain('Desconto:');
    expect(receipt).toContain('-R$ 10,00');
  });

  it('deve exibir | AGENDADO | para pedidos agendados', () => {
    const scheduledOrder = { ...sampleOrder, isScheduled: true, scheduledAt: new Date('2026-02-25T18:00:00-03:00') } as any;
    const receipt = generatePlainTextReceipt(scheduledOrder, sampleEstablishment);
    expect(receipt).toContain('| AGENDADO |');
    expect(receipt).toContain('AGENDADO PARA:');
  });
});
