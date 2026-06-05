/* MMT Urbana CRM — Login screen */

function Login({ onLogin }) {
  const [email, setEmail] = React.useState("marcelo.tavares@mmturbana.com.br");
  const [password, setPassword] = React.useState("••••••••");
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e && e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: "Marcelo Tavares", avatar: "MT", email }); }, 600);
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-orb"></div>
        <div className="login-orb b"></div>
        <div style={{position:"relative", zIndex:1}}>
          <div className="brand">
            <div className="brand-mark">M</div>
            <div>
              <div className="brand-name">MMT Urbana</div>
              <div className="brand-sub" style={{color:"rgba(255,255,255,0.6)"}}>CRM Comercial</div>
            </div>
          </div>
        </div>
        <div className="login-pitch" style={{position:"relative", zIndex:1}}>
          <h2>Gestão comercial completa para revendedores Apple.</h2>
          <p>Acompanhe negociações, orçamentos e trade-in em um único lugar.
            Da chegada do lead à entrega do dispositivo, tudo conectado.</p>
          <div className="kpi-strip">
            <div className="kpi">
              <div className="label">Vendas (mês)</div>
              <div className="value">R$ 1,42M</div>
            </div>
            <div className="kpi">
              <div className="label">Negociações ativas</div>
              <div className="value">128</div>
            </div>
            <div className="kpi">
              <div className="label">Trade-in avaliados</div>
              <div className="value">312</div>
            </div>
          </div>
        </div>
      </div>
      <div className="login-right">
        <form className="login-card" onSubmit={submit}>
          <h1>Entrar</h1>
          <div className="lead">Use suas credenciais corporativas para acessar o sistema.</div>
          <div style={{height: 28}}></div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                   placeholder="seu.email@mmturbana.com.br" autoFocus />
          </div>
          <div className="field">
            <label>Senha</label>
            <div style={{position:"relative"}}>
              <input type={showPw ? "text" : "password"}
                     value={password}
                     onChange={e=>setPassword(e.target.value)}
                     placeholder="Sua senha"
                     style={{width:"100%", paddingRight:42}} />
              <div onClick={()=>setShowPw(!showPw)}
                   style={{position:"absolute", right:10, top:10, color:"var(--text-3)", cursor:"pointer"}}>
                {showPw ? I.eyeOff : I.eye}
              </div>
            </div>
          </div>
          <div className="login-row">
            <label className="remember" onClick={()=>setRemember(!remember)}>
              <span className={"checkbox " + (remember ? "checked" : "")}>
                {remember && I.check}
              </span>
              Lembrar de mim
            </label>
            <a className="forgot" href="#" onClick={e=>e.preventDefault()}>Esqueci minha senha</a>
          </div>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <div className="login-hint">
            Acesso restrito a colaboradores MMT Urbana. Solicite credenciais ao administrador.
          </div>
        </form>
      </div>
    </div>
  );
}

window.Login = Login;
