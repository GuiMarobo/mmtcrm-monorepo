/**
 * Dados mockados que ainda alimentam o Dashboard.
 *
 * O Dashboard ainda não tem endpoint correspondente no backend (Release 1.0
 * cobre apenas Autenticação/Usuários e Clientes). Quando o módulo
 * `dashboard` for implementado, os arrays abaixo devem ser substituídos por
 * chamadas a `dashboardApi`.
 */

import type { Product, SalesPoint, TrafficItem } from './types'

export const TOP_PRODUCTS: Product[] = [
  { name: 'iPhone 15 Pro Max 256GB', sku: 'APL-15PM-256', price: 'R$ 10.499,00', sold: 142, status: 'Disponível', earning: 'R$ 1.490.858,00', color: '#0e1116' },
  { name: 'MacBook Air M3 13" 512GB', sku: 'APL-MBA-M3', price: 'R$ 14.999,00', sold: 68, status: 'Disponível', earning: 'R$ 1.019.932,00', color: '#475569' },
  { name: 'iPad Pro 11" M4 256GB', sku: 'APL-IPP-M4', price: 'R$ 11.499,00', sold: 51, status: 'Estoque Baixo', earning: 'R$ 586.449,00', color: '#2f6dff' },
  { name: 'Apple Watch Series 10', sku: 'APL-AW10', price: 'R$ 4.299,00', sold: 88, status: 'Disponível', earning: 'R$ 378.312,00', color: '#dc2626' },
  { name: 'AirPods Pro 2 (USB-C)', sku: 'APL-APP2', price: 'R$ 2.099,00', sold: 124, status: 'Disponível', earning: 'R$ 260.276,00', color: '#16a34a' },
]

export const SALES_DATA: SalesPoint[] = [
  { m: 'Jan', v: 412 }, { m: 'Fev', v: 458 }, { m: 'Mar', v: 502 },
  { m: 'Abr', v: 489 }, { m: 'Mai', v: 542 }, { m: 'Jun', v: 581 },
  { m: 'Jul', v: 624 }, { m: 'Ago', v: 612 }, { m: 'Set', v: 668 },
  { m: 'Out', v: 702 }, { m: 'Nov', v: 735 }, { m: 'Dez', v: 814 },
]

export const TRAFFIC: TrafficItem[] = [
  { label: 'WhatsApp', value: 184, color: '#22c55e' },
  { label: 'Instagram', value: 142, color: '#ef4444' },
  { label: 'Site', value: 88, color: '#2f6dff' },
  { label: 'Indicação', value: 48, color: '#f59e0b' },
]
