import type * as ExcelJS from 'exceljs'
import type { Client } from '../types'
import {
  CLIENT_STATUS_LABELS,
  LEAD_ORIGIN_LABELS,
  LEAD_QUALIFICATION_LABELS,
} from '../types'
import { formatCurrency, maskCpf, maskPhone } from './format'

const BRAND   = 'FF2F6DFF'
const BRAND50 = 'FFEAF1FF'
const WHITE   = 'FFFFFFFF'
const GRAY100 = 'FFF9FAFB'
const BORDER  = 'FFE5E7EB'

export interface ExportMeta {
  exportedAt: Date
  exportedBy: string
  totalInSystem: number
  filtersApplied: string[]
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function borderAll(): Partial<ExcelJS.Borders> {
  const s: ExcelJS.BorderStyle = 'thin'
  const c: Partial<ExcelJS.Color> = { argb: BORDER }
  return { top: { style: s, color: c }, bottom: { style: s, color: c }, left: { style: s, color: c }, right: { style: s, color: c } }
}

function applyHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border = borderAll()
  })
  row.height = 28
}

function applyDataRow(row: ExcelJS.Row, isAlt: boolean) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? BRAND50 : WHITE } }
    cell.alignment = { vertical: 'middle', wrapText: false }
    cell.border = borderAll()
    cell.font = { size: 10.5 }
  })
  row.height = 22
}

const COLUMN_COUNT = 14

function buildClientesSheet(wb: ExcelJS.Workbook, rows: Client[]) {
  const ws = wb.addWorksheet('Clientes', {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  ws.columns = [
    { key: 'name',              width: 32 },
    { key: 'phone',             width: 18 },
    { key: 'email',             width: 30 },
    { key: 'cpf',               width: 17 },
    { key: 'address',           width: 38 },
    { key: 'status',            width: 12 },
    { key: 'qualification',     width: 18 },
    { key: 'origin',            width: 14 },
    { key: 'lastContactAt',     width: 16 },
    { key: 'createdAt',         width: 14 },
    { key: 'negotiationsCount', width: 14 },
    { key: 'ordersCount',       width: 10 },
    { key: 'revenue',           width: 16 },
    { key: 'notes',             width: 40 },
  ]

  const titleRow = ws.addRow(['MMT URBANA CRM'])
  ws.mergeCells(1, 1, 1, COLUMN_COUNT)
  const titleCell = titleRow.getCell(1)
  titleCell.value = 'MMT URBANA CRM'
  titleCell.font = { bold: true, size: 28, color: { argb: WHITE } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 60

  const headerRow = ws.addRow([
    'Nome', 'Telefone', 'E-mail', 'CPF', 'Endereço',
    'Status', 'Qualificação', 'Origem',
    'Último Contato', 'Cadastro',
    'Negociações', 'Pedidos', 'Receita Total', 'Observações',
  ])
  applyHeader(headerRow)

  rows.forEach((c, i) => {
    const row = ws.addRow({
      name:              c.name,
      phone:             maskPhone(c.phone) || '-',
      email:             c.email || '-',
      cpf:               maskCpf(c.cpf) || '-',
      address:           c.address || '-',
      status:            CLIENT_STATUS_LABELS[c.status],
      qualification:     LEAD_QUALIFICATION_LABELS[c.qualification],
      origin:            c.origin ? LEAD_ORIGIN_LABELS[c.origin] : '-',
      lastContactAt:     fmtDate(c.lastContactAt),
      createdAt:         fmtDate(c.createdAt),
      negotiationsCount: c.negotiationsCount,
      ordersCount:       c.ordersCount,
      revenue:           c.revenue,
      notes:             c.notes || '-',
    })

    applyDataRow(row, i % 2 === 1)

    const revenueCell = row.getCell('revenue')
    revenueCell.numFmt = 'R$ #,##0.00'
    revenueCell.alignment = { horizontal: 'right', vertical: 'middle' }

    const negCell = row.getCell('negotiationsCount')
    negCell.alignment = { horizontal: 'center', vertical: 'middle' }

    const ordCell = row.getCell('ordersCount')
    ordCell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
}

function buildResumoSheet(wb: ExcelJS.Workbook, rows: Client[], meta: ExportMeta) {
  const ws = wb.addWorksheet('Resumo')
  ws.getColumn(1).width = 28
  ws.getColumn(2).width = 26

  function section(title: string) {
    const row = ws.addRow([title])
    row.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    ws.mergeCells(row.number, 1, row.number, 2)
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    row.height = 24
  }

  function kv(label: string, value: string | number) {
    const row = ws.addRow([label, value])
    row.getCell(1).font = { bold: true, size: 10.5, color: { argb: 'FF374151' } }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY100 } }
    row.getCell(2).font = { size: 10.5 }
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } }
    row.getCell(1).border = borderAll()
    row.getCell(2).border = borderAll()
    row.height = 20
  }

  function gap() { ws.addRow([]) }

  const ativos    = rows.filter(c => c.status === 'ATIVO').length
  const leads     = rows.filter(c => c.status === 'LEAD').length
  const inativos  = rows.filter(c => c.status === 'INATIVO').length
  const total     = rows.length
  const receita   = rows.reduce((s, c) => s + c.revenue, 0)
  const ticketMedio = ativos > 0
    ? rows.filter(c => c.status === 'ATIVO').reduce((s, c) => s + c.revenue, 0) / ativos
    : 0
  const comEmail    = rows.filter(c => c.email).length
  const comTelefone = rows.filter(c => c.phone).length
  const comCpf      = rows.filter(c => c.cpf).length
  const comEndereco = rows.filter(c => c.address).length
  const indicados   = rows.filter(c => c.origin === 'INDICACAO').length
  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%'

  section('Exportação')
  kv('Exportado por', meta.exportedBy)
  kv('Exportado em', fmtDateTime(meta.exportedAt))
  kv('Filtros aplicados', meta.filtersApplied.length ? meta.filtersApplied.join(' | ') : 'Nenhum')
  kv('Exibindo', `${total} de ${meta.totalInSystem} clientes`)

  gap()

  section('Composição')
  kv('Total de clientes', total)
  kv('Ativos', `${ativos} (${pct(ativos)})`)
  kv('Leads', `${leads} (${pct(leads)})`)
  kv('Inativos', `${inativos} (${pct(inativos)})`)
  kv('Indicados', `${indicados} (${pct(indicados)})`)

  gap()

  section('Financeiro')
  kv('Receita total', formatCurrency(receita))
  kv('Ticket médio (ativos)', formatCurrency(ticketMedio))

  gap()

  section('Completude dos Dados')
  kv('Com e-mail', `${comEmail} (${pct(comEmail)})`)
  kv('Com telefone', `${comTelefone} (${pct(comTelefone)})`)
  kv('Com CPF', `${comCpf} (${pct(comCpf)})`)
  kv('Com endereço', `${comEndereco} (${pct(comEndereco)})`)
}

export async function downloadClientesXlsx(rows: Client[], meta: ExportMeta): Promise<void> {
  const { default: Excel } = await import('exceljs')
  const wb = new Excel.Workbook()
  wb.creator = 'MMT Urbana CRM'
  wb.created = meta.exportedAt

  buildClientesSheet(wb, rows)
  buildResumoSheet(wb, rows, meta)

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = meta.exportedAt.toISOString().slice(0, 10)
  a.download = `MMTUrbana_Clientes_${date}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
