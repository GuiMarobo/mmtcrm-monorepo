/** Pequenos helpers de formatação (datas, telefone). */

/** Converte ISO-8601 vindo da API em `dd/mm/aaaa`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

/** Telefone simples, exibindo o valor cru quando não dá pra formatar. */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—'
  return raw
}
