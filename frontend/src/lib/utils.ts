import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Redondea un monto a centavos, para que nunca aparezcan totales como $20.2993842 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

/**
 * Cantidad en kilos para cobrar un monto a granel ("$20 de jamón").
 * Se guarda con 6 decimales y hacia abajo: al redondear a centavos, el total da exactamente el monto pedido.
 */
export function weightQuantityForAmount(amount: number, pricePerKg: number): number {
  if (pricePerKg <= 0) return 0
  return Math.floor((amount / pricePerKg) * 1_000_000) / 1_000_000
}

/** Cantidad para mostrar: piezas enteras tal cual y kilos con máximo 3 decimales (0.106) */
export function formatQuantity(quantity: number): string {
  return String(Number(quantity.toFixed(3)))
}
