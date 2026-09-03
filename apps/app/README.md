# mmtcrm-app

Frontend do **MMT Urbana CRM** — SPA em React 18 + Vite 5 + TypeScript, com Material UI 9
(X Premium) e tema próprio.

## Rodar

```bash
cp .env.example .env          # VITE_API_URL e VITE_MUI_LICENSE_KEY
npm install
npm run dev                   # http://localhost:5173
```

Precisa da API rodando (por padrão em `http://localhost:3000`).

Sem `VITE_MUI_LICENSE_KEY` a aplicação funciona normalmente, mas o `DataGridPremium` exibe
marca d'água de licença.

## Verificação

```bash
npm run build     # roda tsc + vite build — é o type-check do projeto
```

Não há testes automatizados neste projeto.

## Documentação

| Onde | O quê |
|---|---|
| `CLAUDE.md` (nesta pasta) | Regras de código do frontend, mapa de `src/`, armadilhas |
| `../../context/` | Domínio, arquitetura, convenções, ADRs e specs do sistema inteiro |
| `../../docs/` | Documentação formal entregável (casos de uso UML, diagramas) |
