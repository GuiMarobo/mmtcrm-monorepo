/** Barrel de tipos do app. */
export * from './enums'
export * from './user.types'
export * from './client.types'
export * from './auth.types'
export * from './route.types'
export * from './import.types'

/* Tipos legados que ainda alimentam o Dashboard com dados mockados.  */
export interface Product {
  name: string
  sku: string
  price: string
  sold: number
  status: string
  earning: string
  color: string
}

export interface SalesPoint {
  m: string
  v: number
}

export interface TrafficItem {
  label: string
  value: number
  color: string
}

export type ContactChannel = 'WhatsApp' | 'Telefone' | 'E-mail' | 'Presencial'
