/* MMT Urbana CRM — Dashboard */

import { I } from '../icons'
import { SALES_DATA, TOP_PRODUCTS, TRAFFIC } from '../data'
import { SparkArea } from '../components/charts/SparkArea'
import { Donut } from '../components/charts/Donut'
import type { AuthUser } from '../types'

interface ActivityEntry {
  who: string
  what: string
  obj: string
  time: string
  color: string
  initials: string
}

const ACTIVITY: ActivityEntry[] = [
  { who: 'Fernanda Costa', what: 'fechou pedido', obj: 'PED-238 · iPhone 15 Pro 256GB', time: 'há 14 min', color: '#16a34a', initials: 'FC' },
  { who: 'Bruno Henrique', what: 'qualificou lead', obj: 'Mariana Souza', time: 'há 1h', color: '#2f6dff', initials: 'BH' },
  { who: 'Ricardo Andrade', what: 'avaliou trade-in', obj: 'iPhone 13 Pro 128GB — Bom', time: 'há 2h', color: '#7c3aed', initials: 'RA' },
  { who: 'Larissa Mendes', what: 'registrou contato', obj: 'Beatriz Almeida — WhatsApp', time: 'há 3h', color: '#ef6f3a', initials: 'LM' },
  { who: 'Diego Barbosa', what: 'enviou orçamento', obj: 'ORC-091 · R$ 12.499,00', time: 'há 5h', color: '#dc2626', initials: 'DB' },
]

interface DashboardProps {
  user: AuthUser
}

export function Dashboard({ user }: DashboardProps) {
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Olá, {user.name.split(' ')[0]} 👋</div>
          <div className="page-sub">
            Suas vendas cresceram 12% este mês — bom dia para fechar negócios.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn">
            {I.calendar}
            <span>10 Mai – 21 Mai, 2026</span>
            <span style={{ color: 'var(--text-3)' }}>{I.chev}</span>
          </button>
          <button className="btn primary">{I.download}<span>Exportar</span></button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Vendas do Mês</div>
          <div className="stat-value">R$ 1.420.860,00</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+12,0% vs. mês anterior</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Total de Pedidos</div>
          <div className="stat-value">238</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+8,4% vs. mês anterior</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Negociações Ativas</div>
          <div className="stat-value">128</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+10,2% vs. mês anterior</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Novos Leads</div>
          <div className="stat-value">86</div>
          <div className="stat-delta delta-down">{I.arrowDown}<span>−3,1% vs. mês anterior</span></div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Sales Report</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  R$ 7.137.250,00
                </div>
                <span className="badge b-green">{I.arrowUp}<span>20,08%</span></span>
                <span className="muted" style={{ fontSize: 12 }}>
                  +R$ 1.192.610 vs. ano anterior
                </span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="select">Anual <span className="chev">{I.chev}</span></button>
            </div>
          </div>
          <div style={{ padding: '10px 12px 14px' }}>
            <SparkArea data={SALES_DATA} />
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="chart-title">Traffic Sources</div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="select">Mensal <span className="chev">{I.chev}</span></button>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Donut items={TRAFFIC} total={462} />
          </div>
          <div className="donut-legend">
            {TRAFFIC.map((t) => (
              <div className="legend-row" key={t.label}>
                <span className="legend-dot" style={{ background: t.color }} />
                <span>{t.label}</span>
                <span className="value">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-grid two" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="chart-head">
            <div className="chart-title">Top Selling</div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="select">Ordenar <span className="chev">{I.chev}</span></button>
            </div>
          </div>
          <div style={{ padding: '12px 4px 6px' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Vendidos</th>
                  <th>Disponibilidade</th>
                  <th className="num">Receita</th>
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="cell-user">
                        <div className="avatar-sm" style={{ background: p.color, color: '#fff' }}>
                          {p.name.split(' ')[0].slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="name">{p.name}</div>
                          <div className="sub">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.price}</td>
                    <td>{p.sold} un</td>
                    <td>
                      {p.status === 'Disponível' ? (
                        <span className="badge b-green"><span className="dotb" />Disponível</span>
                      ) : (
                        <span className="badge b-amber"><span className="dotb" />Estoque Baixo</span>
                      )}
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>{p.earning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="chart-title">Atividade recente</div>
            <a
              href="#"
              className="muted"
              style={{ fontSize: 12, marginLeft: 'auto' }}
              onClick={(e) => e.preventDefault()}
            >
              Ver tudo
            </a>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div className="avatar-sm" style={{ background: a.color, color: '#fff' }}>
                  {a.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>
                    <b>{a.who}</b> <span className="muted">{a.what}</span> <b>{a.obj}</b>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
