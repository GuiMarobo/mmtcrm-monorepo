/* MMT Urbana CRM — Sidebar + Topbar layout */

function Sidebar({ route, setRoute, onLogout }) {
  const groups = [
    { label: "Principal", items: [
      { id: "dashboard", label: "Dashboard", icon: I.dashboard },
    ]},
    { label: "Vendas", items: [
      { id: "negociacoes", label: "Negociações", icon: I.deal, badge: "12" },
      { id: "clientes", label: "Clientes & Leads", icon: I.clients },
      { id: "orcamentos", label: "Orçamentos", icon: I.quote },
      { id: "pedidos", label: "Pedidos", icon: I.orders, badge: "4" },
    ]},
    { label: "Cadastros", items: [
      { id: "produtos", label: "Produtos", icon: I.product },
      { id: "usados", label: "Dispositivos Usados", icon: I.device },
    ]},
    { label: "Sistema", items: [
      { id: "usuarios", label: "Usuários", icon: I.users },
    ]},
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-name">MMT Urbana</div>
          <div className="brand-sub">CRM Comercial</div>
        </div>
      </div>
      <div className="org-switch">
        <div className="org-mark">SP</div>
        <div style={{minWidth:0}}>
          <div className="org-name">Loja Pinheiros</div>
          <div className="org-meta">São Paulo · Matriz</div>
        </div>
        <span className="chev">{I.chev}</span>
      </div>
      {groups.map(g => (
        <div className="nav-group" key={g.label}>
          <div className="nav-label">{g.label}</div>
          {g.items.map(it => (
            <div key={it.id}
                 className={"nav-item " + (route === it.id ? "active" : "")}
                 onClick={() => setRoute(it.id)}>
              <span className="nav-ico">{it.icon}</span>
              <span>{it.label}</span>
              {it.badge && <span className="nav-badge">{it.badge}</span>}
            </div>
          ))}
        </div>
      ))}
      <div style={{marginTop:"auto", padding: "8px 4px 0"}}>
        <div className="nav-item" onClick={onLogout}>
          <span className="nav-ico">{I.power}</span>
          <span>Sair</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ user }) {
  return (
    <div className="topbar">
      <div className="search">
        <span style={{color:"var(--text-3)"}}>{I.search}</span>
        <input placeholder="Buscar clientes, pedidos, produtos…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        <div className="icon-btn" title="Novo">{I.plus}</div>
        <div className="icon-btn" title="Mensagens">{I.chat}<span className="dot"></span></div>
        <div className="icon-btn" title="Notificações">{I.bell}<span className="dot"></span></div>
        <div className="avatar" title={user.name}>{user.avatar}</div>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
