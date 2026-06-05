/* MMT Urbana CRM — App shell + routing */

function Placeholder({ title, hint }) {
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{hint}</div>
        </div>
      </div>
      <div className="placeholder">
        <div style={{fontSize:32, marginBottom:8}}>🧩</div>
        <h3>Tela em construção</h3>
        <p style={{maxWidth:420, margin:"4px auto 0", lineHeight:1.55}}>
          Este módulo será desenhado na próxima iteração. Comece pelas telas de
          <b> Login</b>, <b>Clientes & Leads</b> e <b>Usuários</b>.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = React.useState(null);
  const [route, setRoute] = React.useState("dashboard");
  const [toastMsg, setToastMsg] = React.useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => setToastMsg(null), 2400);
  };

  if (!user) return <Login onLogin={(u)=>{ setUser(u); showToast(`Bem-vindo, ${u.name.split(" ")[0]}!`); }}/>;

  const pages = {
    dashboard: <Dashboard user={user}/>,
    clientes: <Clientes toast={showToast}/>,
    usuarios: <Usuarios toast={showToast}/>,
    negociacoes: <Placeholder title="Negociações" hint="Pipeline de vendas com trade-in." />,
    orcamentos: <Placeholder title="Orçamentos" hint="Simulador de orçamento e propostas." />,
    pedidos: <Placeholder title="Pedidos" hint="Gerenciamento de pedidos e entregas." />,
    produtos: <Placeholder title="Produtos" hint="Catálogo de dispositivos Apple." />,
    usados: <Placeholder title="Dispositivos Usados" hint="Avaliação e laudo de trade-in." />,
  };

  return (
    <div className="app-shell">
      <Sidebar route={route} setRoute={setRoute} onLogout={()=>{setUser(null); setRoute("dashboard");}}/>
      <div className="main-col" data-screen-label={"App / " + route}>
        <Topbar user={user}/>
        <div className="content">
          {pages[route] || pages.dashboard}
        </div>
      </div>
      {toastMsg && <div className="toast">{I.check}<span>{toastMsg}</span></div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App/>);
