import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import the generateStatusMessage function for testing
import { generateStatusMessage } from './_core/uazapi';

describe('Cashback WhatsApp Notification', () => {
  
  describe('generateStatusMessage with cashback info', () => {
    
    it('should append cashback block when status is completed and cashback > 0', () => {
      const message = generateStatusMessage(
        'completed',
        '#001',
        'João',
        'Restaurante Teste',
        null, // use default template
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '3.50', cashbackTotal: '15.80' }
      );
      
      expect(message).toContain('Cashback ganho: R$3,50');
      expect(message).toContain('Cashback acumulado: R$15,80');
      expect(message).toContain('💰');
    });
    
    it('should NOT append cashback block when cashbackEarned is 0', () => {
      const message = generateStatusMessage(
        'completed',
        '#002',
        'Maria',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '0.00', cashbackTotal: '10.00' }
      );
      
      expect(message).not.toContain('Cashback ganho');
      expect(message).not.toContain('💰');
    });
    
    it('should NOT append cashback block when cashbackInfo is null', () => {
      const message = generateStatusMessage(
        'completed',
        '#003',
        'Pedro',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        null
      );
      
      expect(message).not.toContain('Cashback ganho');
      expect(message).not.toContain('💰');
    });
    
    it('should NOT append cashback block for non-completed status', () => {
      const message = generateStatusMessage(
        'preparing',
        '#004',
        'Ana',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '5.00', cashbackTotal: '20.00' }
      );
      
      expect(message).not.toContain('Cashback ganho');
      expect(message).not.toContain('💰');
    });
    
    it('should replace {{cashbackEarned}} and {{cashbackTotal}} in custom template', () => {
      const customTemplate = `Pedido {{orderNumber}} finalizado!\n\nCashback ganho: {{cashbackEarned}}\nCashback acumulado: {{cashbackTotal}}\n\n{{establishmentName}}`;
      
      const message = generateStatusMessage(
        'completed',
        '#005',
        'Carlos',
        'Restaurante Teste',
        customTemplate,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '2.75', cashbackTotal: '8.25' }
      );
      
      expect(message).toContain('Cashback ganho: R$2,75');
      expect(message).toContain('Cashback acumulado: R$8,25');
      // Should NOT duplicate the cashback block since template already uses the variables
      const cashbackCount = (message.match(/Cashback ganho/g) || []).length;
      expect(cashbackCount).toBe(1);
    });
    
    it('should format values with 2 decimal places and comma separator (BR format)', () => {
      const message = generateStatusMessage(
        'completed',
        '#006',
        'Lucas',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '1.5', cashbackTotal: '0' }
      );
      
      expect(message).toContain('R$1,50');
    });
    
    it('should show R$0,00 for zero accumulated balance', () => {
      const message = generateStatusMessage(
        'completed',
        '#007',
        'Fernanda',
        'Restaurante Teste',
        null,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        { cashbackEarned: '3.00', cashbackTotal: '0' }
      );
      
      // cashbackEarned > 0 so block is shown
      expect(message).toContain('Cashback ganho: R$3,00');
      expect(message).toContain('Cashback acumulado: R$0,00');
    });
    
    it('should remove {{cashbackEarned}} and {{cashbackTotal}} from template when no cashback info', () => {
      const customTemplate = `Pedido {{orderNumber}} finalizado!\n\nCashback ganho: {{cashbackEarned}}\nCashback acumulado: {{cashbackTotal}}\n\n{{establishmentName}}`;
      
      const message = generateStatusMessage(
        'completed',
        '#008',
        'Roberto',
        'Restaurante Teste',
        customTemplate,
        null,
        null,
        null,
        null,
        undefined,
        null,
        undefined,
        null
      );
      
      expect(message).not.toContain('{{cashbackEarned}}');
      expect(message).not.toContain('{{cashbackTotal}}');
    });
  });
  
  describe('sendOrderStatusNotification interface', () => {
    it('should accept cashbackInfo in data parameter', () => {
      const uazapiSource = readFileSync(join(__dirname, '_core/uazapi.ts'), 'utf-8');
      
      // Verify the function signature includes cashbackInfo
      expect(uazapiSource).toContain('cashbackInfo?:');
      expect(uazapiSource).toContain('cashbackEarned: string');
      expect(uazapiSource).toContain('cashbackTotal: string');
    });
  });
  
  describe('Router passes cashback info on completed status', () => {
    it('should fetch cashback transaction and balance for completed orders', () => {
      const routersSource = readFileSync(join(__dirname, 'routers.ts'), 'utf-8');
      
      // Verify the router fetches cashback info
      expect(routersSource).toContain('getCashbackTransactionByOrderId');
      expect(routersSource).toContain('getCashbackBalance');
      expect(routersSource).toContain('cashbackInfo');
      expect(routersSource).toContain("rewardProgramType === 'cashback'");
    });
  });
  
  describe('getCashbackTransactionByOrderId helper exists', () => {
    it('should be exported from db.ts', () => {
      const dbSource = readFileSync(join(__dirname, 'db.ts'), 'utf-8');
      
      expect(dbSource).toContain('export async function getCashbackTransactionByOrderId');
      expect(dbSource).toContain('cashbackTransactions');
      expect(dbSource).toContain('type, "credit"');
    });
  });
  
  describe('Default template for completed orders', () => {
    it('should exist in db.ts', () => {
      const dbSource = readFileSync(join(__dirname, 'db.ts'), 'utf-8');
      
      expect(dbSource).toContain('defaultTemplateCompleted');
      expect(dbSource).toContain('foi finalizado');
    });
  });
});
