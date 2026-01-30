import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateStatusMessage } from './_core/uazapi';

describe('WhatsApp Integration', () => {
  describe('generateStatusMessage', () => {
    it('should generate message with default template for new order', () => {
      const message = generateStatusMessage(
        'new',
        '#P123',
        'João',
        'Restaurante Teste'
      );
      
      expect(message).toContain('João');
      expect(message).toContain('#P123');
      expect(message).toContain('Restaurante Teste');
      expect(message).toContain('recebido');
    });
    
    it('should generate message with default template for preparing', () => {
      const message = generateStatusMessage(
        'preparing',
        '#P456',
        'Maria',
        'Pizzaria'
      );
      
      expect(message).toContain('Maria');
      expect(message).toContain('#P456');
      expect(message).toContain('Pizzaria');
      expect(message).toContain('preparado');
    });
    
    it('should generate message with default template for ready', () => {
      const message = generateStatusMessage(
        'ready',
        '#P789',
        'Carlos',
        'Sushi Bar'
      );
      
      expect(message).toContain('Carlos');
      expect(message).toContain('#P789');
      expect(message).toContain('Sushi Bar');
      expect(message).toContain('pronto');
    });
    
    it('should generate message with default template for completed', () => {
      const message = generateStatusMessage(
        'completed',
        '#P101',
        'Ana',
        'Burger House'
      );
      
      expect(message).toContain('Ana');
      expect(message).toContain('#P101');
      expect(message).toContain('Burger House');
      expect(message).toContain('finalizado');
    });
    
    it('should generate message with default template for cancelled', () => {
      const message = generateStatusMessage(
        'cancelled',
        '#P202',
        'Pedro',
        'Café Central'
      );
      
      expect(message).toContain('Pedro');
      expect(message).toContain('#P202');
      expect(message).toContain('Café Central');
      expect(message).toContain('cancelado');
    });
    
    it('should use custom template when provided', () => {
      const customTemplate = 'Olá {{customerName}}, seu pedido {{orderNumber}} está na {{establishmentName}}!';
      
      const message = generateStatusMessage(
        'ready',
        '#P303',
        'Lucas',
        'Padaria',
        customTemplate
      );
      
      expect(message).toBe('Olá Lucas, seu pedido #P303 está na Padaria!');
    });
    
    it('should replace all occurrences of placeholders', () => {
      const customTemplate = '{{customerName}} - {{customerName}} - {{orderNumber}} - {{orderNumber}}';
      
      const message = generateStatusMessage(
        'new',
        '#P404',
        'Julia',
        'Lanchonete',
        customTemplate
      );
      
      expect(message).toBe('Julia - Julia - #P404 - #P404');
    });
    
    it('should handle empty customer name gracefully', () => {
      const message = generateStatusMessage(
        'new',
        '#P505',
        '',
        'Restaurante'
      );
      
      expect(message).toContain('#P505');
      expect(message).toContain('Restaurante');
    });
  });
  
  describe('Button message formatting', () => {
    // Função auxiliar para simular a remoção de formatação da primeira linha
    // (mesma lógica usada em sendButtonMessage)
    function removeFirstLineBoldFormatting(text: string): string {
      const lines = text.split('\n');
      if (lines.length > 0) {
        lines[0] = lines[0].replace(/\*([^*]+)\*/g, '$1');
      }
      return lines.join('\n');
    }
    
    it('should remove bold formatting from first line only', () => {
      const text = 'Olá *João*! 👋🏻 Boa tarde!\n\nSeu pedido *#P123* foi recebido!';
      const processed = removeFirstLineBoldFormatting(text);
      
      expect(processed).toBe('Olá João! 👋🏻 Boa tarde!\n\nSeu pedido *#P123* foi recebido!');
    });
    
    it('should remove multiple bold sections from first line', () => {
      const text = '*Nome*: *João* - *Pedido*: *#123*\n\nDetalhes do pedido';
      const processed = removeFirstLineBoldFormatting(text);
      
      expect(processed).toBe('Nome: João - Pedido: #123\n\nDetalhes do pedido');
    });
    
    it('should not affect lines after the first', () => {
      const text = 'Primeira linha sem negrito\n*Segunda* linha com *negrito*\n*Terceira* também';
      const processed = removeFirstLineBoldFormatting(text);
      
      expect(processed).toBe('Primeira linha sem negrito\n*Segunda* linha com *negrito*\n*Terceira* também');
    });
    
    it('should handle text without bold formatting', () => {
      const text = 'Texto simples sem formatação\nSegunda linha';
      const processed = removeFirstLineBoldFormatting(text);
      
      expect(processed).toBe('Texto simples sem formatação\nSegunda linha');
    });
    
    it('should handle single line text', () => {
      const text = 'Olá *Cliente*! Bem-vindo!';
      const processed = removeFirstLineBoldFormatting(text);
      
      expect(processed).toBe('Olá Cliente! Bem-vindo!');
    });
    
    it('should handle empty text', () => {
      const text = '';
      const processed = removeFirstLineBoldFormatting(text);
      
      expect(processed).toBe('');
    });
  });
});
