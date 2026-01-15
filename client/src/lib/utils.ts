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
