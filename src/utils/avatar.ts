/**
 * Utilitários para o avatar (iniciais + cor determinística).
 *
 * Mantidos isolados para que componentes apenas consumam o `displayProfile`
 * sem se preocupar com a regra de derivação.
 */

const PALETTE = [
  '#2f6dff', '#ef6f3a', '#16a34a', '#7c3aed',
  '#dc2626', '#f59e0b', '#0e1116', '#475569',
] as const

/** Iniciais (até 2 letras) a partir do nome completo. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Cor estável a partir de uma chave (id, e-mail ou nome). */
export function colorFromKey(key: string | number): string {
  const s = String(key)
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

export interface DisplayProfile {
  initials: string
  color: string
}

export function displayProfile(name: string, key: string | number): DisplayProfile {
  return { initials: initialsOf(name), color: colorFromKey(key) }
}
