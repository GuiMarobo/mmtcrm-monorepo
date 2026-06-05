/* MMT Urbana CRM — Dashboard */

function SparkArea({ data, w = 720, h = 200, color = "#2f6dff" }) {
  const max = Math.max(...data.map(d => d.v));
  const min = Math.min(...data.map(d => d.v));
  const padX = 16, padY = 14;
  const stepX = (w - padX*2) / (data.length - 1);
  const yFor = v => h - padY - ((v - min) / (max - min)) * (h - padY*2);
  const pts = data.map((d, i) => [padX + i * stepX, yFor(d.v)]);
  // Smooth bezier path
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const prev = pts[i-1];
    const cx = (prev[0] + p[0]) / 2;
    return `C ${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`;
  }).join(" ");
  const area = path + ` L ${pts[pts.length-1][0]} ${h - padY} L ${pts[0][0]} ${h - padY} Z`;
  const gridY = [0, 0.25, 0.5, 0.75, 1].map(t => padY + t * (h - padY*2));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {gridY.map((y, i) => (
        <line key={i} x1={padX} x2={w-padX} y1={y} y2={y}
              stroke="#eef0f3" strokeDasharray="3 4"/>
      ))}
      <path d={area} fill="url(#lineFill)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.2"/>
      {pts.map((p, i) => (
        <g key={i}>
          <text x={p[0]} y={h-2} fontSize="10.5" fill="#8a8f98" textAnchor="middle">{data[i].m}</text>
        </g>
      ))}
      {/* highlight Dec */}
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="5" fill="#fff" stroke={color} strokeWidth="2.5"/>
    </svg>
  );
}

function Donut({ items, size = 180, total }) {
  const sum = items.reduce((a,b)=>a+b.value, 0);
  const r = size/2 - 16; const c = size/2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = items.map((it, i) => {
    const len = (it.value / sum) * circ;
    const dash = `${len} ${circ - len}`;
    const seg = <circle key={i} cx={c} cy={c} r={r} fill="none"
                        stroke={it.color} strokeWidth="14"
                        strokeDasharray={dash}
                        strokeDashoffset={-offset}
                        transform={`rotate(-90 ${c} ${c})`}/>;
    offset += len;
    return seg;
  });
  return (
    <div style={{position:"relative", width: size, height: size, margin: "0 auto"}}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f3f5" strokeWidth="14"/>
        {segs}
      </svg>
      <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center", textAlign:"center"}}>
        <div>
          <div style={{color:"var(--text-3)", fontSize:11.5}}>Total</div>
          <div style={{fontSize:26, fontWeight:800, letterSpacing:"-0.02em"}}>{total}</div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Olá, {user.name.split(" ")[0]} 👋</div>
          <div className="page-sub">Suas vendas cresceram 12% este mês — bom dia para fechar negócios.</div>
        </div>
        <div className="page-actions">
          <button className="btn">{I.calendar}<span>10 Mai – 21 Mai, 2026</span><span style={{color:"var(--text-3)"}}>{I.chev}</span></button>
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
              <div style={{marginTop:8, display:"flex", alignItems:"baseline", gap:10}}>
                <div style={{fontSize:24, fontWeight:800, letterSpacing:"-0.02em"}}>R$ 7.137.250,00</div>
                <span className="badge b-green">{I.arrowUp}<span>20,08%</span></span>
                <span className="muted" style={{fontSize:12}}>+R$ 1.192.610 vs. ano anterior</span>
              </div>
            </div>
            <div style={{marginLeft:"auto"}}>
              <button className="select">Anual <span className="chev">{I.chev}</span></button>
            </div>
          </div>
          <div style={{padding: "10px 12px 14px"}}>
            <SparkArea data={DATA.SALES_DATA}/>
          </div>
        </div>
        <div className="card card-pad">
          <div style={{display:"flex", alignItems:"center"}}>
            <div className="chart-title">Traffic Sources</div>
            <div style={{marginLeft:"auto"}}>
              <button className="select">Mensal <span className="chev">{I.chev}</span></button>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <Donut items={DATA.TRAFFIC} total={462} />
          </div>
          <div className="donut-legend">
            {DATA.TRAFFIC.map(t => (
              <div className="legend-row" key={t.label}>
                <span className="legend-dot" style={{background:t.color}}></span>
                <span>{t.label}</span>
                <span className="value">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-grid two" style={{marginTop:18}}>
        <div className="card">
          <div className="chart-head">
            <div className="chart-title">Top Selling</div>
            <div style={{marginLeft:"auto"}}>
              <button className="select">Ordenar <span className="chev">{I.chev}</span></button>
            </div>
          </div>
          <div style={{padding: "12px 4px 6px"}}>
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
                {DATA.TOP_PRODUCTS.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="cell-user">
                        <div className="avatar-sm" style={{background: p.color, color:"#fff"}}>
                          {p.name.split(" ")[0].slice(0,2).toUpperCase()}
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
                      {p.status === "Disponível"
                        ? <span className="badge b-green"><span className="dotb"></span>Disponível</span>
                        : <span className="badge b-amber"><span className="dotb"></span>Estoque Baixo</span>}
                    </td>
                    <td className="num" style={{fontWeight:700}}>{p.earning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{display:"flex", alignItems:"center"}}>
            <div className="chart-title">Atividade recente</div>
            <a href="#" className="muted" style={{fontSize:12, marginLeft:"auto"}} onClick={e=>e.preventDefault()}>Ver tudo</a>
          </div>
          <div style={{marginTop:14, display:"flex", flexDirection:"column", gap:14}}>
            {[
              {who:"Fernanda Costa", what:"fechou pedido", obj:"PED-238 · iPhone 15 Pro 256GB", time:"há 14 min", color:"#16a34a", initials:"FC"},
              {who:"Bruno Henrique", what:"qualificou lead", obj:"Mariana Souza", time:"há 1h", color:"#2f6dff", initials:"BH"},
              {who:"Ricardo Andrade", what:"avaliou trade-in", obj:"iPhone 13 Pro 128GB — Bom", time:"há 2h", color:"#7c3aed", initials:"RA"},
              {who:"Larissa Mendes", what:"registrou contato", obj:"Beatriz Almeida — WhatsApp", time:"há 3h", color:"#ef6f3a", initials:"LM"},
              {who:"Diego Barbosa", what:"enviou orçamento", obj:"ORC-091 · R$ 12.499,00", time:"há 5h", color:"#dc2626", initials:"DB"},
            ].map((a, i) => (
              <div key={i} style={{display:"flex", gap:10, alignItems:"flex-start"}}>
                <div className="avatar-sm" style={{background:a.color, color:"#fff"}}>{a.initials}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13}}>
                    <b>{a.who}</b> <span className="muted">{a.what}</span> <b>{a.obj}</b>
                  </div>
                  <div className="muted" style={{fontSize:11.5, marginTop:2}}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
