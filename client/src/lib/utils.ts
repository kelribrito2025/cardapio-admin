import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitaliza a primeira letra de uma string
 * @param value - String a ser capitalizada
 * @returns String com a primeira letra maiúscula
 */
export function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Handler para capitalizar automaticamente a primeira letra em inputs
 * @param setter - Função setState para atualizar o valor
 * @returns Handler de onChange para o input
 */
export function handleCapitalizeInput(setter: (value: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setter(capitalizeFirst(value));
  };
}

/**
 * Formata um valor numérico como moeda brasileira (R$)
 * @param value - Valor numérico ou string
 * @returns String formatada como moeda (ex: "R$ 10,50")
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata um valor de input como moeda brasileira (apenas números)
 * Remove caracteres não numéricos e formata como valor monetário
 * @param value - Valor do input
 * @returns Valor formatado para exibição (ex: "10,50")
 */
export function formatPriceInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Converte para centavos e depois para reais
  const cents = parseInt(numbers || '0', 10);
  const reais = cents / 100;
  
  // Formata com 2 casas decimais
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte valor formatado de moeda para número decimal
 * Detecta automaticamente se o valor está em formato brasileiro (vírgula) ou americano (ponto)
 * @param value - Valor formatado (ex: "10,50", "1.234,56", "10.50", "1234.56")
 * @returns Número decimal como string (ex: "10.50", "1234.56")
 */
export function parsePriceInput(value: string): string {
  if (!value) return '0';
  
  // Detectar o formato do valor
  // Formato brasileiro: usa vírgula como separador decimal (ex: "10,50" ou "1.234,56")
  // Formato americano: usa ponto como separador decimal (ex: "10.50" ou "1,234.56")
  
  const hasComma = value.includes(',');
  const hasDot = value.includes('.');
  
  let num: number;
  
  if (hasComma && hasDot) {
    // Tem ambos: verificar qual é o separador decimal
    const lastCommaIndex = value.lastIndexOf(',');
    const lastDotIndex = value.lastIndexOf('.');
    
    if (lastCommaIndex > lastDotIndex) {
      // Vírgula é o separador decimal (formato brasileiro: "1.234,56")
      const normalized = value.replace(/\./g, '').replace(',', '.');
      num = parseFloat(normalized);
    } else {
      // Ponto é o separador decimal (formato americano: "1,234.56")
      const normalized = value.replace(/,/g, '');
      num = parseFloat(normalized);
    }
  } else if (hasComma) {
    // Só tem vírgula: é separador decimal brasileiro (ex: "10,50")
    const normalized = value.replace(',', '.');
    num = parseFloat(normalized);
  } else if (hasDot) {
    // Só tem ponto: verificar se é separador decimal ou de milhar
    // Se tem exatamente 2 dígitos após o ponto, é decimal (ex: "10.50")
    // Se tem 3 dígitos após o ponto, é milhar (ex: "1.000")
    const parts = value.split('.');
    const afterDot = parts[parts.length - 1];
    
    if (afterDot.length === 2) {
      // É separador decimal (ex: "10.50")
      num = parseFloat(value);
    } else if (afterDot.length === 3 && parts.length === 2 && parts[0].length <= 3) {
      // É separador de milhar (ex: "1.000" = mil)
      const normalized = value.replace(/\./g, '');
      num = parseFloat(normalized);
    } else {
      // Assume que é separador decimal
      num = parseFloat(value);
    }
  } else {
    // Não tem separadores, é um número inteiro
    num = parseFloat(value);
  }
  
  return isNaN(num) ? '0' : num.toString();
}
