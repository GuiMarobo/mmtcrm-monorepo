/* MMT Urbana CRM — Usuários */

function RoleBadge({ role }) {
  const map = {
    "Administrador": "b-purple",
    "Vendedor": "b-blue",
    "Atendente": "b-amber",
    "Técnico": "b-green",
  };
  return <span className={"badge " + (map[role] || "b-gray")}><span className="dotb"></span>{role}</span>;
}

function UsuarioForm({ user, onClose, onSave }) {
  const empty = { name: "", email: "", phone: "", password: "", confirm: "", role: "Vendedor", status: "Ativo" };
  const [form, setForm] = React.useState(user ? {...user, password: "", confirm: ""} : empty);
  const [err, setErr] = React.useState("");
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const isEdit = !!user;
  const submit = () => {
    if (!isEdit && form.password !== form.confirm) {
      setErr("As senhas não conferem."); return;
    }
    onSave(form);
  };
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:640}}>
        <div className="modal-head">
          <div style={{flex:1}}>
            <div className="modal-title">{isEdit ? "Editar Usuário" : "Novo Usuário"}</div>
            <div className="modal-sub">Defina credenciais, perfil de acesso e status.</div>
          </div>
          <div className="row-action" onClick={onClose}>{I.x}</div>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Nome Completo</label>
            <input value={form.name} onChange={e=>set("name", e.target.value)} placeholder="Ex: Fernanda Costa"/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>E-mail corporativo</label>
              <input value={form.email} onChange={e=>set("email", e.target.value)} placeholder="nome@mmturbana.com.br"/>
            </div>
            <div className="field">
              <label>Telefone</label>
              <input value={form.phone || ""} onChange={e=>set("phone", e.target.value)} placeholder="(11) 90000-0000"/>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>{isEdit ? "Nova senha (opcional)" : "Senha"}</label>
              <input type="password" value={form.password} onChange={e=>set("password", e.target.value)} placeholder="Mín. 8 caracteres"/>
            </div>
            <div className="field">
              <label>Confirmar Senha</label>
              <input type="password" value={form.confirm} onChange={e=>set("confirm", e.target.value)} placeholder="Repita a senha"/>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Perfil</label>
              <select value={form.role} onChange={e=>set("role", e.target.value)}>
                <option>Administrador</option>
                <option>Vendedor</option>
                <option>Atendente</option>
                <option>Técnico</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e=>set("status", e.target.value)}>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
          {err && <div style={{color:"var(--red)", fontSize:12.5, marginTop:-4}}>{err}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit}>{I.check}<span>{isEdit ? "Salvar alterações" : "Criar usuário"}</span></button>
        </div>
      </div>
    </div>
  );
}

function Usuarios({ toast }) {
  const [list, setList] = React.useState(DATA.USERS);
  const [q, setQ] = React.useState("");
  const [fRole, setFRole] = React.useState("Todos");
  const [fStatus, setFStatus] = React.useState("Todos");
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [menuFor, setMenuFor] = React.useState(null);

  const filtered = list.filter(u => {
    const m = !q
      || u.name.toLowerCase().includes(q.toLowerCase())
      || u.email.toLowerCase().includes(q.toLowerCase());
    const r = fRole === "Todos" || u.role === fRole;
    const s = fStatus === "Todos" || u.status === fStatus;
    return m && r && s;
  });

  const stats = {
    total: list.length,
    ativos: list.filter(u=>u.status==="Ativo").length,
    admins: list.filter(u=>u.role==="Administrador").length,
    vendedores: list.filter(u=>u.role==="Vendedor").length,
  };

  const save = (form) => {
    if (editing) {
      setList(L => L.map(u => u.id === editing.id ? {...u, ...form} : u));
      toast(`Usuário "${form.name}" atualizado`);
    } else {
      const id = Math.max(...list.map(u=>u.id)) + 1;
      const avatar = form.name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
      const today = new Date().toLocaleDateString("pt-BR");
      setList(L => [{ ...form, id, joined: today, avatar, color: "#2f6dff" }, ...L]);
      toast(`Usuário "${form.name}" criado`);
    }
    setEditing(null); setCreating(false);
  };

  const toggleStatus = (u) => {
    const newStatus = u.status === "Ativo" ? "Inativo" : "Ativo";
    setList(L => L.map(x => x.id === u.id ? {...x, status: newStatus} : x));
    toast(`${u.name} ${newStatus === "Ativo" ? "ativado" : "desativado"}`);
    setMenuFor(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Usuários</div>
          <div className="page-sub">Gerencie a equipe, perfis de acesso e disponibilidade.</div>
        </div>
        <div className="page-actions">
          <button className="btn">{I.download}<span>Exportar</span></button>
          <button className="btn primary" onClick={()=>setCreating(true)}>{I.plus}<span>Novo usuário</span></button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Total de Usuários</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+2 este mês</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Usuários Ativos</div>
          <div className="stat-value">{stats.ativos}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>{Math.round((stats.ativos/stats.total)*100)}% da equipe</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Administradores</div>
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-delta delta-up">{I.spark}<span>Acesso completo</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Vendedores</div>
          <div className="stat-value">{stats.vendedores}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+1 este mês</span></div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="input grow">
            <span style={{color:"var(--text-3)"}}>{I.search}</span>
            <input placeholder="Buscar por nome ou e-mail…"
                   value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <button className="btn">{I.filter}<span>Filtros</span></button>
          <div style={{marginLeft:"auto", display:"flex", gap:8}}>
            <select className="select" value={fRole} onChange={e=>setFRole(e.target.value)}>
              <option value="Todos">Perfil: Todos</option>
              <option>Administrador</option><option>Vendedor</option>
              <option>Atendente</option><option>Técnico</option>
            </select>
            <select className="select" value={fStatus} onChange={e=>setFStatus(e.target.value)}>
              <option value="Todos">Status: Todos</option>
              <option>Ativo</option><option>Inativo</option>
            </select>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="cell-user">
                    <div className="avatar-sm" style={{background:u.color, color:"#fff"}}>{u.avatar}</div>
                    <div>
                      <div className="name">{u.name}</div>
                      <div className="sub">{u.phone}</div>
                    </div>
                  </div>
                </td>
                <td>{u.email}</td>
                <td><RoleBadge role={u.role}/></td>
                <td>
                  {u.status === "Ativo"
                    ? <span className="badge b-green"><span className="dotb"></span>Ativo</span>
                    : <span className="badge b-gray"><span className="dotb"></span>Inativo</span>}
                </td>
                <td>{u.joined}</td>
                <td style={{position:"relative", width:48}}>
                  <div className="row-action" onClick={()=>setMenuFor(menuFor === u.id ? null : u.id)}>{I.more}</div>
                  {menuFor === u.id && (
                    <div style={{position:"absolute", right:8, top:38, background:"#fff",
                          border:"1px solid var(--border-strong)", borderRadius:10,
                          boxShadow:"var(--shadow-md)", zIndex:10, minWidth:200, padding:6}}>
                      <div className="nav-item" onClick={()=>{setEditing(u); setMenuFor(null);}}>
                        <span className="nav-ico">{I.edit}</span><span>Editar</span>
                      </div>
                      <div className="nav-item" onClick={()=>toggleStatus(u)}>
                        <span className="nav-ico">{I.power}</span>
                        <span>{u.status === "Ativo" ? "Desativar" : "Ativar"} usuário</span>
                      </div>
                      <div className="nav-item" style={{color:"var(--red)"}}
                           onClick={()=>{setList(L=>L.filter(x=>x.id!==u.id)); setMenuFor(null); toast(`"${u.name}" removido`);}}>
                        <span className="nav-ico">{I.trash}</span><span>Excluir</span>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <div className="result">Mostrando 1–{filtered.length} de {list.length} usuários</div>
          <div className="page-controls">
            <span className="page-btn">{I.chevL}<span>Anterior</span></span>
            <span className="page-btn active">1</span>
            <span className="page-btn">2</span>
            <span className="page-btn"><span>Próximo</span>{I.chevR}</span>
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <UsuarioForm user={editing} onClose={()=>{setCreating(false); setEditing(null);}} onSave={save}/>
      )}
    </div>
  );
}

window.Usuarios = Usuarios;
