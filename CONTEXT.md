# CONTEXT — MMT Urbana CRM

> **Arquivo vivo.** Atualizado pelo `/grill-with-docs` a cada sessão de refinamento.
> É a entrada principal que as Matt skills leem antes de qualquer sessão.
> Para o contexto completo, os arquivos em `context/` são a fonte de verdade.

---

## O que é o sistema

CRM comercial da **MMT Urbana** (revenda Apple) para centralizar a base de clientes e
leads, a equipe de vendas e o ciclo comercial de negociação até pedido.

**Por que existe:** a operação vivia em planilhas — sem rastreio de contato, sem
histórico de negociação, sem controle de quem acessa o quê. O CRM substitui isso.

Contexto completo: [context/produto.md](context/produto.md)

---

## Perfis de usuário

| Perfil | O que faz |
|---|---|
| **ADMIN** | Tudo, inclusive gerenciar equipe e ver métricas gerais |
| **VENDEDOR** | Trabalhar leads e clientes, conduzir negociações até pedido |
| **ATENDENTE** | Cadastrar e qualificar leads, registrar contato |
| **TECNICO** | Avaliar aparelhos usados (perfil existe, tela ainda não) |

---

## Glossário

Vocabulário canônico do negócio. Use estes termos em specs, ADRs, UI e commits — sem sinônimos.

Glossário completo: [context/glossario.md](context/glossario.md)

| Termo | Significado no sistema |
|---|---|
| **Lead** | Cliente com `status = LEAD`: entrou na base mas ainda não comprou. Não é tabela separada. |
| **Cliente ativo** | `status = ATIVO`. Tem (ou teve) negociação/compra. |
| **Cliente inativo** | `status = INATIVO`. Sem atividade recente; não é exclusão. |
| **Qualificação** | Quão perto da compra o lead está: `NAO_QUALIFICADO → QUALIFICADO → ALTA_INTENCAO`. |
| **Origem** | Canal por onde o lead chegou: WhatsApp, Instagram, Site, Indicação, Outro. |
| **Registrar contato** | Grava `lastContactAt = agora`. Não guarda histórico — só a última data. |
| **Negociação** | Tratativa comercial: `ABERTA → GANHA / PERDIDA`. |
| **Pedido** | Fecha uma negociação ganha. Relação 1:1 com a negociação. |
| **Orçamento** | Proposta formal com validade. *(alvo — não implementado)* |
| **Aparelho usado** | Dispositivo dado como entrada, avaliado por TECNICO. *(alvo — não implementado)* |
| **Pipeline** | Valor somado das negociações `ABERTA`. |
| **NOT_DELETED** | Filtro `deletedAt: null` aplicado em toda consulta do sistema. Ver ADR 0008. |
| **Transição** | Mudança de estado da Negociação via operação de domínio (`convert`, `cancel`, `reopen`) — nunca escrita direta no campo `status`. |
| **Troca de senha obrigatória** | Flag `mustChangePassword`. Bloqueia todas as rotas (403) até o usuário trocar a senha. |
| **Tema** | `src/theme/` — `createTheme` do MUI. Única fonte de cor, espaço e raio no frontend. |

---

## Estado do sistema (implementado vs. alvo)

**Modelo implementado:** 5 tabelas — `users`, `clients`, `negotiations`, `orders`, `data_erasure_logs`.

**Não existe no schema (alvo):** `Product`, `NegotiationItem`, `Quotation`, `UsedDevice`.

Estado completo com divergências documentadas: [context/dominio.md](context/dominio.md)
Roadmap de implementação: [context/roadmap.md](context/roadmap.md)

---

## Decisões vigentes

Índice completo com justificativas: [context/decisoes/README.md](context/decisoes/README.md)

| ADR | Decisão | Para não esquecer |
|---|---|---|
| [0001](context/decisoes/0001-roteamento-por-estado-sem-react-router.md) | Roteamento por estado, sem React Router | `App.tsx` com `useState<Route>` — sem URL por tela |
| [0003](context/decisoes/0003-id-uuid-para-cliente-int-para-usuario.md) | UUID para Cliente, Int para Usuário | Clientes vêm de importação em massa; UUID evita colisão |
| [0004](context/decisoes/0004-contratos-duplicados-sem-pacote-compartilhado.md) | Contratos duplicados entre api e app | DTO no back ↔ `types/` no front, sincronizados manualmente |
| [0005](context/decisoes/0005-sem-comentarios-no-frontend.md) | Frontend sem comentários | Nenhum: nem banner, nem JSDoc, nem inline |
| [0006](context/decisoes/0006-dominio-anemico-em-services.md) | Domínio anêmico: regra nos services | Métodos do diagrama de classes viram métodos de service |
| [0007](context/decisoes/0007-troca-de-senha-obrigatoria.md) | Troca de senha obrigatória no 1º acesso | `mustChangePassword = true` ao criar — admin nunca sabe a senha final |
| [0008](context/decisoes/0008-exclusao-logica-com-not-deleted.md) | Exclusão lógica com NOT_DELETED | Nada é apagado; `deletedAt` + índice único parcial |
| [0009](context/decisoes/0009-eliminar-sem-historico-anonimizar-com-historico.md) | LGPD: apagar sem histórico, anonimizar com histórico | Operação `POST /clients/:id/erase`, exclusiva do ADMIN |
| [0010](context/decisoes/0010-adocao-do-mui-substitui-0002.md) | UI sobre MUI com tema próprio | Sem CSS, sem `style={{}}`, sem valor cru — tudo pelo tema |
| [0011](context/decisoes/0011-dnd-kit-para-o-quadro-de-negociacoes.md) | @dnd-kit no quadro de Negociações | Drag nunca é o único caminho — há comando equivalente no card |

---

## Invariantes que não podem ser violadas

Qualquer spec que viole uma destas regras precisa de ADR antes de ser aprovada.

- **Nenhuma exclusão física comum** — sempre `deletedAt` em cascata (ADR 0008)
- **Eliminação LGPD é operação separada**, só ADMIN (ADR 0009)
- **Senha nunca sai da API** — `select` explícito em todo service
- **Negociação tem máquina de estados fechada**: `ABERTA→GANHA`, `ABERTA→PERDIDA`, `GANHA→ABERTA`, `PERDIDA→ABERTA`. `GANHA↔PERDIDA` direto é recusado no service.
- **UI é MUI puro com tema** — sem arquivo `.css`, sem `style={{}}`, sem valor cru de cor/espaço (ADR 0010)
- **Backend é fonte de verdade** — frontend valida só para UX; toda validação real é do backend
- **Sem dado fake** — nenhum número, delta ou lista hardcoded. Se o backend não fornece, não se mostra.
- **Reabrir negociação ganha preserva o pedido** como `DESISTENCIA` — o `@unique` de `Order.negotiationId` nunca pode ser removido

---

## Arquitetura resumida

```
apps/app (SPA React + MUI)  ──HTTP/JSON + Bearer JWT──►  apps/api (NestJS 11)
                                                                  │ Prisma 7
                                                                  ▼
                                                            PostgreSQL
```

Camadas do backend: `Controller → Service → PrismaService`. Regra mora no Service.
Camadas do frontend: `pages/ → components/<dominio>/ → api/<recurso>Api.ts`

Arquitetura completa: [context/arquitetura.md](context/arquitetura.md)
Convenções de código: [context/convencoes.md](context/convencoes.md)
