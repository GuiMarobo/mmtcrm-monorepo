/* MMT Urbana CRM — Clientes & Leads */

function StatusBadge({ status }) {
  const map = {
    "Lead": "b-blue",
    "Ativo": "b-green",
    "Inativo": "b-gray",
  };
  return <span className={"badge " + (map[status] || "b-gray")}><span className="dotb"></span>{status}</span>;
}

function QualifBadge({ q }) {
  const map = { "Alta Intenção": "b-purple", "Qualificado": "b-amber", "Não Qualificado": "b-gray" };
  return <span className={"badge " + (map[q] || "b-gray")}>{q}</span>;
}

function ClienteForm({ client, onClose, onSave }) {
  const empty = {
    name: "", email: "", phone: "", cpf: "", address: "",
    origin: "WhatsApp", status: "Lead", qualif: "Não Qualificado"
  };
  const [form, setForm] = React.useState(client || empty);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const isEdit = !!client;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:640}}>
        <div className="modal-head">
          <div style={{flex:1}}>
            <div className="modal-title">{isEdit ? "Editar Cliente" : "Novo Cliente / Lead"}</div>
            <div className="modal-sub">Preencha os dados de contato e classificação.</div>
          </div>
          <div className="row-action" onClick={onClose}>{I.x}</div>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Nome Completo</label>
            <input value={form.name} onChange={e=>set("name", e.target.value)} placeholder="Ex: Mariana Souza"/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>E-mail</label>
              <input value={form.email} onChange={e=>set("email", e.target.value)} placeholder="email@exemplo.com"/>
            </div>
            <div className="field">
              <label>Telefone</label>
              <input value={form.phone} onChange={e=>set("phone", e.target.value)} placeholder="(11) 90000-0000"/>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>CPF</label>
              <input value={form.cpf} onChange={e=>set("cpf", e.target.value)} placeholder="000.000.000-00"/>
            </div>
            <div className="field">
              <label>Canal de Origem</label>
              <select value={form.origin} onChange={e=>set("origin", e.target.value)}>
                <option>WhatsApp</option>
                <option>Instagram</option>
                <option>Site</option>
                <option>Indicação</option>
                <option>Outro</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Endereço</label>
            <input value={form.address} onChange={e=>set("address", e.target.value)} placeholder="Rua, número — Cidade/UF"/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e=>set("status", e.target.value)}>
                <option>Lead</option>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
            <div className="field">
              <label>Qualificação</label>
              <select value={form.qualif} onChange={e=>set("qualif", e.target.value)}>
                <option>Não Qualificado</option>
                <option>Qualificado</option>
                <option>Alta Intenção</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave(form)}>
            {I.check}<span>{isEdit ? "Salvar alterações" : "Cadastrar cliente"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ContatoModal({ client, onClose, onSave }) {
  const [tipo, setTipo] = React.useState("WhatsApp");
  const [nota, setNota] = React.useState("");
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:520}}>
        <div className="modal-head">
          <div style={{flex:1}}>
            <div className="modal-title">Registrar Contato</div>
            <div className="modal-sub">{client.name} · {client.phone}</div>
          </div>
          <div className="row-action" onClick={onClose}>{I.x}</div>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Canal</label>
            <select value={tipo} onChange={e=>setTipo(e.target.value)}>
              <option>WhatsApp</option><option>Telefone</option>
              <option>E-mail</option><option>Presencial</option>
            </select>
          </div>
          <div className="field">
            <label>Observações</label>
            <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Resumo do contato, próximos passos…"/>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave({tipo, nota})}>Registrar contato</button>
        </div>
      </div>
    </div>
  );
}

function Clientes({ toast }) {
  const [list, setList] = React.useState(DATA.CLIENTS);
  const [q, setQ] = React.useState("");
  const [fStatus, setFStatus] = React.useState("Todos");
  const [fQualif, setFQualif] = React.useState("Todas");
  const [editing, setEditing] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [contacting, setContacting] = React.useState(null);
  const [menuFor, setMenuFor] = React.useState(null);
  const [selected, setSelected] = React.useState(new Set());

  const filtered = list.filter(c => {
    const matches = !q
      || c.name.toLowerCase().includes(q.toLowerCase())
      || c.email.toLowerCase().includes(q.toLowerCase())
      || c.phone.includes(q);
    const s = fStatus === "Todos" || c.status === fStatus;
    const qu = fQualif === "Todas" || c.qualif === fQualif;
    return matches && s && qu;
  });

  const stats = {
    total: list.length,
    leads: list.filter(c=>c.status==="Lead").length,
    ativos: list.filter(c=>c.status==="Ativo").length,
    alta: list.filter(c=>c.qualif==="Alta Intenção").length,
  };

  const save = (form) => {
    if (editing) {
      setList(L => L.map(c => c.id === editing.id ? {...c, ...form} : c));
      toast(`Cliente "${form.name}" atualizado`);
    } else {
      const id = Math.max(...list.map(c=>c.id)) + 1;
      const avatar = form.name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
      setList(L => [{ ...form, id, deals: 0, last: "Hoje", avatar, color: "#2f6dff" }, ...L]);
      toast(`Cliente "${form.name}" cadastrado`);
    }
    setEditing(null); setCreating(false);
  };

  const qualificar = (c) => {
    setList(L => L.map(x => x.id === c.id ? {...x, qualif: "Qualificado"} : x));
    toast(`Lead "${c.name}" qualificado`);
    setMenuFor(null);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };
  const toggleOne = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Clientes & Leads</div>
          <div className="page-sub">Gerencie a base de contatos e classifique leads por intenção.</div>
        </div>
        <div className="page-actions">
          <button className="btn">{I.upload}<span>Importar</span></button>
          <button className="btn">{I.download}<span>Exportar</span></button>
          <button className="btn primary" onClick={()=>setCreating(true)}>{I.plus}<span>Novo cliente</span></button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Total de Contatos</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+12 este mês</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Leads em aberto</div>
          <div className="stat-value">{stats.leads}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+4 esta semana</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Clientes Ativos</div>
          <div className="stat-value">{stats.ativos}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+8,3%</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Alta Intenção</div>
          <div className="stat-value">{stats.alta}</div>
          <div className="stat-delta delta-up">{I.arrowUp}<span>+5,1%</span></div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="input grow">
            <span style={{color:"var(--text-3)"}}>{I.search}</span>
            <input placeholder="Buscar por nome, e-mail ou telefone…"
                   value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <button className="btn">{I.filter}<span>Filtros</span></button>
          <div style={{marginLeft:"auto", display:"flex", gap:8}}>
            <select className="select" value={fStatus} onChange={e=>setFStatus(e.target.value)}>
              <option value="Todos">Status: Todos</option>
              <option>Lead</option><option>Ativo</option><option>Inativo</option>
            </select>
            <select className="select" value={fQualif} onChange={e=>setFQualif(e.target.value)}>
              <option value="Todas">Qualificação: Todas</option>
              <option>Não Qualificado</option>
              <option>Qualificado</option>
              <option>Alta Intenção</option>
            </select>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th className="checkbox-col">
                <div className={"checkbox " + (selected.size && selected.size === filtered.length ? "checked" : "")}
                     onClick={toggleAll}>
                  {selected.size === filtered.length && filtered.length > 0 && I.check}
                </div>
              </th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Qualificação</th>
              <th className="num">Negociações</th>
              <th>Último Contato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="checkbox-col">
                  <div className={"checkbox " + (selected.has(c.id) ? "checked" : "")}
                       onClick={()=>toggleOne(c.id)}>
                    {selected.has(c.id) && I.check}
                  </div>
                </td>
                <td>
                  <div className="cell-user">
                    <div className="avatar-sm" style={{background:c.color, color:"#fff"}}>{c.avatar}</div>
                    <div>
                      <div className="name">{c.name}</div>
                      <div className="sub">{c.origin} · CPF {c.cpf}</div>
                    </div>
                  </div>
                </td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td><StatusBadge status={c.status}/></td>
                <td><QualifBadge q={c.qualif}/></td>
                <td className="num"><b>{c.deals}</b></td>
                <td>{c.last}</td>
                <td style={{position:"relative", width:48}}>
                  <div className="row-action" onClick={()=>setMenuFor(menuFor === c.id ? null : c.id)}>{I.more}</div>
                  {menuFor === c.id && (
                    <div style={{position:"absolute", right:8, top:38, background:"#fff",
                          border:"1px solid var(--border-strong)", borderRadius:10,
                          boxShadow:"var(--shadow-md)", zIndex:10, minWidth:200, padding:6}}>
                      <div className="nav-item" onClick={()=>{setEditing(c); setMenuFor(null);}}>
                        <span className="nav-ico">{I.edit}</span><span>Editar</span>
                      </div>
                      {c.qualif !== "Qualificado" && c.qualif !== "Alta Intenção" && (
                        <div className="nav-item" onClick={()=>qualificar(c)}>
                          <span className="nav-ico">{I.star}</span><span>Qualificar lead</span>
                        </div>
                      )}
                      <div className="nav-item" onClick={()=>{setContacting(c); setMenuFor(null);}}>
                        <span className="nav-ico">{I.phone}</span><span>Registrar contato</span>
                      </div>
                      <div className="nav-item" style={{color:"var(--red)"}}
                           onClick={()=>{setList(L=>L.filter(x=>x.id!==c.id)); setMenuFor(null); toast(`"${c.name}" removido`);}}>
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
          <div className="result">Mostrando 1–{filtered.length} de {list.length} contatos</div>
          <div className="page-controls">
            <span className="page-btn">{I.chevL}<span>Anterior</span></span>
            <span className="page-btn active">1</span>
            <span className="page-btn">2</span>
            <span className="page-btn">3</span>
            <span className="page-btn"><span>Próximo</span>{I.chevR}</span>
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <ClienteForm client={editing} onClose={()=>{setCreating(false); setEditing(null);}} onSave={save}/>
      )}
      {contacting && (
        <ContatoModal client={contacting} onClose={()=>setContacting(null)}
                      onSave={(data)=>{ setContacting(null); toast(`Contato registrado com ${contacting.name}`); }}/>
      )}
    </div>
  );
}

window.Clientes = Clientes;
