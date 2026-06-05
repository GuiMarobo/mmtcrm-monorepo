import Papa from 'papaparse'

export function downloadCsv<T>(opts: {
    rows: T[]
    filename: string
    columns: Array<keyof T | {
        key: keyof T
        header?: string
    }>
}): void {
    const cols = opts.columns.map((c) =>
        typeof c === 'object' ? c : { key: c, header: String(c) }
)

    const data = opts.rows.map((row) => {
        const out: Record<string, unknown> = {}
        for (const c of cols){
            out[c.header ?? String(c.key)] = row[c.key] ?? ''
        }
    return out
})

    const csv = Papa.unparse(data)

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = opts.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)


}