# mmtcrm-api

Backend do **MMT Urbana CRM** — API REST em NestJS 11 + Prisma 7 + PostgreSQL.

## Rodar

```bash
cp .env.example .env          # ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate deploy     # aplica as migrations
npx prisma db seed            # cria o admin inicial
npm run start:dev             # http://localhost:3000
```

Swagger em `http://localhost:3000/docs`.
Credenciais do seed: `admin@mmturbana.com` / `admin12345`.

Variáveis: `DATABASE_URL` (obrigatória — a aplicação não sobe sem ela), `JWT_SECRET`,
`JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`.

## Verificação

```bash
npm run lint && npm run build
```

Não há testes automatizados neste projeto: o `jest` está configurado e não existe nenhum
`*.spec.ts`.

## Documentação

Este README é só o essencial para subir o projeto. O resto está fora do pacote:

| Onde | O quê |
|---|---|
| `CLAUDE.md` (nesta pasta) | Regras de código do backend, mapa dos módulos, armadilhas |
| `../../context/` | Domínio, arquitetura, convenções, ADRs e specs do sistema inteiro |
| `../../docs/` | Documentação formal entregável (casos de uso UML, diagramas) |
