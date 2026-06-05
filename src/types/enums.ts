/**
 * Enumerações de domínio espelhadas do backend (Prisma).
 *
 * Os valores aqui são exatamente as strings que a API aceita/retorna.
 * A camada de apresentação (components, badges, selects) consome `*_LABELS`
 * e `*_OPTIONS` para exibir rótulos em português sem acoplar o domínio à UI.
 */

// ─── User ───────────────────────────────────────────────────────────────────

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

// ─── Client ─────────────────────────────────────────────────────────────────

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
