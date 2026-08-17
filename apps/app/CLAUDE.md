# mmtcrm-app — frontend

SPA do MMT Urbana CRM. **React 18 + Vite 5 + TypeScript**, UI própria em CSS puro.

> Contexto do sistema inteiro: [../context/](../context/) e [../CLAUDE.md](../CLAUDE.md).
> Feature nova começa por uma spec — ver [../context/specs/README.md](../context/specs/README.md).

## Comandos

```bash
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build — é o type-check; obrigatório antes de "pronto"
```

Backend em outra URL? `VITE_API_URL` no `.env`.

## Mapa

```
src/App.tsx                 shell + roteamento por estado + guardas de tela
src/main.tsx                entrada; importa styles/index.css
src/icons.tsx               TODOS os ícones SVG, no objeto I
src/api/http.ts             único lugar que chama fetch; Bearer, 204, ApiError, logout no 401
src/api/*Api.ts             um arquivo por recurso, fino
src/contexts/AuthContext    sessão (user + token) em localStorage / sessionStorage
src/hooks/                  useToast, useClickOutside
src/pages/                  orquestradoras finas
src/components/ui/          biblioteca própria (barrel index.ts)
src/components/<dominio>/   componentes de domínio (clients, users)
src/types/enums.ts          enums espelhados do Prisma + LABELS pt-BR + OPTIONS
src/utils/                  format, validators, csv (PapaParse), xlsx (ExcelJS)
src/styles/                 CSS por responsabilidade, agregado em index.css; tokens.css
```

## Regras do frontend

1. **Sem comentários.** Nenhum, em nenhum arquivo de `src/`. Única exceção:
   `/// <reference types="vite/client" />` em `vite-env.d.ts`.
   Ver [ADR 0005](../context/decisoes/0005-sem-comentarios-no-frontend.md).
2. **Sem Tailwind, shadcn, MUI ou qualquer lib de UI.** Componente novo vai em
   `components/ui/` e é exportado pelo barrel.
   Ver [ADR 0002](../context/decisoes/0002-ui-propria-sem-tailwind.md).
3. **Sem dado fake.** Nenhum número, delta, badge ou lista hardcoded para preencher tela.
   Se o backend não fornece, ou se cria o endpoint (spec!), ou não se mostra.
4. **CSS só por token.** Cores, espaços e raios de `styles/tokens.css`. Sem `style={{}}`
   inline, sem CSS-in-JS. Tema claro.
5. **Página fina.** `pages/*.tsx` orquestra estado e chamadas; o visual vive em
   componentes. Passou de ~300 linhas, extraia.
6. **Estado local por padrão.** Global só a sessão. Nada de Redux/Zustand/React Query
   sem ADR.
7. **Nunca `fetch` direto** numa página — sempre por `api/<recurso>Api.ts`.
8. **Ícone novo** entra em `src/icons.tsx`, não solto no componente.
9. **Toda ação de escrita termina em toast** (`useToast`), sucesso ou erro.
10. **Formatação e validação** sempre por `utils/format.ts` e `utils/validators.ts` —
    telefone, CPF (com dígito verificador), moeda e data já estão lá.

## Espelhamento de enums (obrigatório)

Enum novo ou alterado no Prisma exige, em `src/types/enums.ts`, o trio:

```ts
export const X_STATUSES = [...] as const
export type XStatus = (typeof X_STATUSES)[number]
export const X_STATUS_LABELS: Record<XStatus, string> = { ... }   // pt-BR
export const X_STATUS_OPTIONS = X_STATUSES.map(v => ({ value: v, label: X_STATUS_LABELS[v] }))
```

Os contratos são duplicados de propósito —
[ADR 0004](../context/decisoes/0004-contratos-duplicados-sem-pacote-compartilhado.md).

## Estados de tela

Toda listagem/consulta precisa tratar os quatro: **carregando · vazio · com dados · erro**.
Existem primitivos para isso em `components/ui/Table.tsx` (`TableEmpty`, `TableError`).

## Armadilhas conhecidas

- Rota nova precisa entrar em `types/route.types.ts` **e** na `Sidebar`, e ser tratada no
  `switch` do `App.tsx` — senão a tela some silenciosamente.
- A guarda de tela por perfil é só UX; a autorização real é do backend. Nunca confie nela
  para esconder dado sensível.
- 401 vindo do backend dispara logout automático em `http.ts` — se a sessão "cai sozinha",
  procure por token expirado ou rota exigindo perfil diferente.
- `Client.id` é `string` (UUID) e `User.id` é `number`. Não unifique.
- Não há roteador: refresh volta ao dashboard, e não existe URL por tela.
  Ver [ADR 0001](../context/decisoes/0001-roteamento-por-estado-sem-react-router.md).
