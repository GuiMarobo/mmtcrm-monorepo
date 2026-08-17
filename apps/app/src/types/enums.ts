export const ROLES = ['ADMIN', 'VENDEDOR', 'ATENDENTE', 'TECNICO'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  ATENDENTE: 'Atendente',
  TECNICO: 'Técnico',
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = ROLES.map((v) => ({
  value: v,
  label: ROLE_LABELS[v],
}))

export const USER_STATUSES = ['ATIVO', 'INATIVO'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
}

export const USER_STATUS_OPTIONS: { value: UserStatus; label: string }[] =
  USER_STATUSES.map((v) => ({ value: v, label: USER_STATUS_LABELS[v] }))

export const CLIENT_STATUSES = ['LEAD', 'ATIVO', 'INATIVO'] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  LEAD: 'Lead',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
}

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] =
  CLIENT_STATUSES.map((v) => ({ value: v, label: CLIENT_STATUS_LABELS[v] }))

export const LEAD_QUALIFICATIONS = [
  'NAO_QUALIFICADO',
  'QUALIFICADO',
  'ALTA_INTENCAO',
] as const
export type LeadQualification = (typeof LEAD_QUALIFICATIONS)[number]

export const LEAD_QUALIFICATION_LABELS: Record<LeadQualification, string> = {
  NAO_QUALIFICADO: 'Não Qualificado',
  QUALIFICADO: 'Qualificado',
  ALTA_INTENCAO: 'Alta Intenção',
}

export const LEAD_QUALIFICATION_OPTIONS: {
  value: LeadQualification
  label: string
}[] = LEAD_QUALIFICATIONS.map((v) => ({
  value: v,
  label: LEAD_QUALIFICATION_LABELS[v],
}))

export const LEAD_ORIGINS = [
  'WHATSAPP',
  'INSTAGRAM',
  'SITE',
  'INDICACAO',
  'OUTRO',
] as const
export type LeadOrigin = (typeof LEAD_ORIGINS)[number]

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  SITE: 'Site',
  INDICACAO: 'Indicação',
  OUTRO: 'Outro',
}

export const LEAD_ORIGIN_OPTIONS: { value: LeadOrigin; label: string }[] =
  LEAD_ORIGINS.map((v) => ({ value: v, label: LEAD_ORIGIN_LABELS[v] }))

export const NEGOTIATION_STATUSES = ['ABERTA', 'GANHA', 'PERDIDA'] as const
export type NegotiationStatus = (typeof NEGOTIATION_STATUSES)[number]

export const NEGOTIATION_STATUS_LABELS: Record<NegotiationStatus, string> = {
  ABERTA: 'Aberta',
  GANHA: 'Ganha',
  PERDIDA: 'Perdida',
}

export const NEGOTIATION_STATUS_OPTIONS: {
  value: NegotiationStatus
  label: string
}[] = NEGOTIATION_STATUSES.map((v) => ({
  value: v,
  label: NEGOTIATION_STATUS_LABELS[v],
}))

export const ORDER_STATUSES = [
  'EM_NEGOCIACAO',
  'COMPRA_APROVADA',
  'DESISTENCIA',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  EM_NEGOCIACAO: 'Em Negociação',
  COMPRA_APROVADA: 'Compra Aprovada',
  DESISTENCIA: 'Desistência',
}

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] =
  ORDER_STATUSES.map((v) => ({ value: v, label: ORDER_STATUS_LABELS[v] }))

export const PAYMENT_METHODS = [
  'PIX',
  'DINHEIRO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'BOLETO',
  'TRANSFERENCIA',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
}

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  PAYMENT_METHODS.map((v) => ({ value: v, label: PAYMENT_METHOD_LABELS[v] }))

export const ERASURE_SUBJECTS = ['CLIENTE', 'USUARIO'] as const
export type ErasureSubject = (typeof ERASURE_SUBJECTS)[number]

export const ERASURE_SUBJECT_LABELS: Record<ErasureSubject, string> = {
  CLIENTE: 'Cliente',
  USUARIO: 'Usuário',
}

export const ERASURE_SUBJECT_OPTIONS: { value: ErasureSubject; label: string }[] =
  ERASURE_SUBJECTS.map((v) => ({ value: v, label: ERASURE_SUBJECT_LABELS[v] }))

export const ERASURE_ACTIONS = ['ELIMINADO', 'ANONIMIZADO'] as const
export type ErasureAction = (typeof ERASURE_ACTIONS)[number]

export const ERASURE_ACTION_LABELS: Record<ErasureAction, string> = {
  ELIMINADO: 'Eliminado',
  ANONIMIZADO: 'Anonimizado',
}

export const ERASURE_ACTION_OPTIONS: { value: ErasureAction; label: string }[] =
  ERASURE_ACTIONS.map((v) => ({ value: v, label: ERASURE_ACTION_LABELS[v] }))
