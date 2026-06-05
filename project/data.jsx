/* MMT Urbana CRM — Sample data */

const CLIENTS = [
  { id: 1, name: "Mariana Souza", email: "mariana.souza@gmail.com", phone: "(11) 98722-4310", cpf: "324.875.610-22", address: "Rua Augusta, 1240 — São Paulo, SP", origin: "Instagram", status: "Lead", qualif: "Alta Intenção", deals: 2, last: "20/05/2026", avatar: "MS", color: "#f59e0b" },
  { id: 2, name: "Rafael Lima", email: "rafael.lima@hotmail.com", phone: "(21) 99431-7765", cpf: "118.422.330-91", address: "Av. Atlântica, 880 — Rio de Janeiro, RJ", origin: "Indicação", status: "Ativo", qualif: "Qualificado", deals: 5, last: "19/05/2026", avatar: "RL", color: "#2f6dff" },
  { id: 3, name: "Beatriz Almeida", email: "bia.almeida@outlook.com", phone: "(31) 98123-5544", cpf: "742.115.880-43", address: "Rua Pernambuco, 220 — Belo Horizonte, MG", origin: "WhatsApp", status: "Ativo", qualif: "Alta Intenção", deals: 3, last: "18/05/2026", avatar: "BA", color: "#ef6f3a" },
  { id: 4, name: "Lucas Oliveira", email: "lucas.oliveira@gmail.com", phone: "(11) 97612-0089", cpf: "201.339.554-78", address: "Rua dos Pinheiros, 75 — São Paulo, SP", origin: "Site", status: "Lead", qualif: "Qualificado", deals: 1, last: "17/05/2026", avatar: "LO", color: "#16a34a" },
  { id: 5, name: "Camila Ferreira", email: "camila.ferreira@gmail.com", phone: "(48) 99812-3340", cpf: "554.220.118-33", address: "Av. Beira-Mar, 1200 — Florianópolis, SC", origin: "Instagram", status: "Ativo", qualif: "Alta Intenção", deals: 4, last: "16/05/2026", avatar: "CF", color: "#7c3aed" },
  { id: 6, name: "Thiago Martins", email: "thiago.martins@gmail.com", phone: "(85) 98775-2210", cpf: "983.114.207-55", address: "Av. Beira Mar, 4400 — Fortaleza, CE", origin: "WhatsApp", status: "Inativo", qualif: "Não Qualificado", deals: 0, last: "02/03/2026", avatar: "TM", color: "#475569" },
  { id: 7, name: "Juliana Pereira", email: "juliana.pereira@empresa.com.br", phone: "(11) 99102-8843", cpf: "412.880.119-04", address: "Rua Oscar Freire, 510 — São Paulo, SP", origin: "Indicação", status: "Ativo", qualif: "Qualificado", deals: 7, last: "15/05/2026", avatar: "JP", color: "#dc2626" },
  { id: 8, name: "André Cardoso", email: "andre.cardoso@gmail.com", phone: "(41) 98220-3344", cpf: "667.012.330-11", address: "Av. Sete de Setembro, 2200 — Curitiba, PR", origin: "Site", status: "Lead", qualif: "Não Qualificado", deals: 0, last: "12/05/2026", avatar: "AC", color: "#2f6dff" },
  { id: 9, name: "Patrícia Gomes", email: "patricia.gomes@gmail.com", phone: "(51) 99887-5510", cpf: "780.443.119-22", address: "Av. Ipiranga, 6681 — Porto Alegre, RS", origin: "WhatsApp", status: "Ativo", qualif: "Alta Intenção", deals: 6, last: "14/05/2026", avatar: "PG", color: "#f59e0b" },
  { id: 10, name: "Eduardo Ribeiro", email: "eduardo.ribeiro@gmail.com", phone: "(11) 98442-1117", cpf: "335.881.220-04", address: "Rua Vergueiro, 1800 — São Paulo, SP", origin: "Outro", status: "Lead", qualif: "Qualificado", deals: 1, last: "11/05/2026", avatar: "ER", color: "#16a34a" },
];

const USERS = [
  { id: 1, name: "Marcelo Tavares", email: "marcelo.tavares@mmturbana.com.br", role: "Administrador", status: "Ativo", joined: "10/01/2025", phone: "(11) 99988-1100", avatar: "MT", color: "#0e1116" },
  { id: 2, name: "Fernanda Costa", email: "fernanda.costa@mmturbana.com.br", role: "Vendedor", status: "Ativo", joined: "15/02/2025", phone: "(11) 98877-2200", avatar: "FC", color: "#ef6f3a" },
  { id: 3, name: "Bruno Henrique", email: "bruno.henrique@mmturbana.com.br", role: "Vendedor", status: "Ativo", joined: "03/03/2025", phone: "(21) 97766-3300", avatar: "BH", color: "#2f6dff" },
  { id: 4, name: "Larissa Mendes", email: "larissa.mendes@mmturbana.com.br", role: "Atendente", status: "Ativo", joined: "22/03/2025", phone: "(11) 96655-4400", avatar: "LM", color: "#7c3aed" },
  { id: 5, name: "Ricardo Andrade", email: "ricardo.andrade@mmturbana.com.br", role: "Técnico", status: "Ativo", joined: "01/04/2025", phone: "(31) 95544-5500", avatar: "RA", color: "#16a34a" },
  { id: 6, name: "Vanessa Lopes", email: "vanessa.lopes@mmturbana.com.br", role: "Vendedor", status: "Inativo", joined: "14/04/2025", phone: "(11) 94433-6600", avatar: "VL", color: "#dc2626" },
  { id: 7, name: "Gabriel Nascimento", email: "gabriel.nasc@mmturbana.com.br", role: "Atendente", status: "Ativo", joined: "28/04/2025", phone: "(51) 93322-7700", avatar: "GN", color: "#f59e0b" },
  { id: 8, name: "Isabela Rocha", email: "isabela.rocha@mmturbana.com.br", role: "Técnico", status: "Ativo", joined: "10/05/2025", phone: "(11) 92211-8800", avatar: "IR", color: "#475569" },
  { id: 9, name: "Diego Barbosa", email: "diego.barbosa@mmturbana.com.br", role: "Vendedor", status: "Ativo", joined: "20/05/2025", phone: "(11) 91100-9900", avatar: "DB", color: "#2f6dff" },
  { id: 10, name: "Renata Pires", email: "renata.pires@mmturbana.com.br", role: "Administrador", status: "Ativo", joined: "02/06/2025", phone: "(11) 90099-1010", avatar: "RP", color: "#ef6f3a" },
];

const TOP_PRODUCTS = [
  { name: "iPhone 15 Pro Max 256GB", sku: "APL-15PM-256", price: "R$ 10.499,00", sold: 142, status: "Disponível", earning: "R$ 1.490.858,00", color: "#0e1116" },
  { name: "MacBook Air M3 13\" 512GB", sku: "APL-MBA-M3", price: "R$ 14.999,00", sold: 68, status: "Disponível", earning: "R$ 1.019.932,00", color: "#475569" },
  { name: "iPad Pro 11\" M4 256GB", sku: "APL-IPP-M4", price: "R$ 11.499,00", sold: 51, status: "Estoque Baixo", earning: "R$ 586.449,00", color: "#2f6dff" },
  { name: "Apple Watch Series 10", sku: "APL-AW10", price: "R$ 4.299,00", sold: 88, status: "Disponível", earning: "R$ 378.312,00", color: "#dc2626" },
  { name: "AirPods Pro 2 (USB-C)", sku: "APL-APP2", price: "R$ 2.099,00", sold: 124, status: "Disponível", earning: "R$ 260.276,00", color: "#16a34a" },
];

const SALES_DATA = [
  { m: "Jan", v: 412 }, { m: "Fev", v: 458 }, { m: "Mar", v: 502 },
  { m: "Abr", v: 489 }, { m: "Mai", v: 542 }, { m: "Jun", v: 581 },
  { m: "Jul", v: 624 }, { m: "Ago", v: 612 }, { m: "Set", v: 668 },
  { m: "Out", v: 702 }, { m: "Nov", v: 735 }, { m: "Dez", v: 814 },
];

const TRAFFIC = [
  { label: "WhatsApp", value: 184, color: "#22c55e" },
  { label: "Instagram", value: 142, color: "#ef4444" },
  { label: "Site", value: 88, color: "#2f6dff" },
  { label: "Indicação", value: 48, color: "#f59e0b" },
];

window.DATA = { CLIENTS, USERS, TOP_PRODUCTS, SALES_DATA, TRAFFIC };
