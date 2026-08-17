interface PlaceholderProps {
  title: string
  hint: string
}

export function Placeholder({ title, hint }: PlaceholderProps) {
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{hint}</div>
        </div>
      </div>
      <div className="placeholder">
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧩</div>
        <h3>Tela em construção</h3>
        <p style={{ maxWidth: 420, margin: '4px auto 0', lineHeight: 1.55 }}>
          Este módulo será desenhado na próxima iteração. Comece pelas telas de
          <b> Login</b>, <b>Clientes &amp; Leads</b> e <b>Usuários</b>.
        </p>
      </div>
    </div>
  )
}
