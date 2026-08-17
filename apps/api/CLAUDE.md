# mmtcrm-api — backend

API REST do MMT Urbana CRM. **NestJS 11 + Prisma 7 + PostgreSQL.**

> Contexto do sistema inteiro: [../context/](../context/) e [../CLAUDE.md](../CLAUDE.md).
> Feature nova começa por uma spec — ver [../context/specs/README.md](../context/specs/README.md).

## Comandos

```bash
npm run start:dev                       # watch → http://localhost:3000 (Swagger em /docs)
npm run lint && npm run build           # verificação obrigatória antes de "pronto"
npx prisma migrate dev --name <nome>    # nova migration
npx prisma db seed                      # admin@mmturbana.com / admin12345
npx prisma studio                       # inspecionar o banco
```

## Mapa

```
prisma/schema.prisma        fonte de verdade do banco
prisma/migrations/          histórico versionado — nunca editar migration aplicada
generated/prisma/           Prisma Client gerado — NUNCA editar à mão
src/main.ts                 ValidationPipe global, CORS, Swagger, porta
src/app/app.module.ts       registra os 3 guards globais (APP_GUARD)
src/prisma/                 PrismaService (Pool pg + adapter); falha no boot sem DATABASE_URL
src/auth/                   login, JWT, guards (jwt, roles, must-change-password), decorators
src/users/                  CRUD da equipe — ADMIN apenas
src/clients/                CRUD + ações de domínio + métricas
src/clients/import/         pipeline de importação CSV (parse → valida → dedupe → grava)
```

## Regras do backend

1. **Controller sem regra de negócio.** Rota, pipes, DTO, `@Roles` e delegação ao service.
2. **`select` explícito** em toda query que retorna entidade com campo sensível.
   `password` **nunca** sai da API — nem em erro, nem em log.
3. **`ensureExists`** privado antes de update/delete → `NotFoundException`.
4. **Unicidade** validada no service com `ConflictException` (mensagem amigável), além do
   `@unique` no schema. Hoje: `User.email` e `Client.cpf`.
5. **Toda resposta de cliente carrega métricas** (`negotiationsCount`, `ordersCount`,
   `revenue`) — o contrato é uniforme em todos os endpoints de cliente.
6. **PATCH** é parcial e não pode apagar campo obrigatório; **PUT** substitui por completo.
7. **Rota nova é privada por padrão.** Precisa de `@Public()` para não exigir token, e
   `@SkipMustChangePassword()` se tiver que funcionar antes da troca de senha.
8. **Swagger sempre:** `@ApiOperation` + `@ApiResponse` dos status que a rota realmente retorna.
9. Comentários são permitidos **aqui** (diferente do frontend), mas só para explicar
   *por quê* — regra de negócio, decisão não óbvia.

## Módulo novo — esqueleto

```
src/<recurso>/
├── <recurso>.module.ts
├── <recurso>.controller.ts
├── <recurso>.service.ts
└── dto/
    ├── create-<recurso>.dto.ts
    ├── update-<recurso>.dto.ts    PartialType(Create…)
    └── replace-<recurso>.dto.ts
```

Registrar o módulo em `app.module.ts` e conferir se o frontend precisa de tipos novos
(`../mmtcrm-app/src/types/`) — os contratos são duplicados de propósito
([ADR 0004](../context/decisoes/0004-contratos-duplicados-sem-pacote-compartilhado.md)).

## Semântica de erro

| Status | Quando |
|---|---|
| 400 | validação de DTO |
| 401 | token ausente/inválido |
| 403 | perfil sem permissão **ou** `mustChangePassword` pendente |
| 404 | recurso inexistente |
| 409 | conflito de unicidade |

## Armadilhas conhecidas

- `Decimal` do Prisma não é `number` — converter explicitamente na borda da resposta.
- `Client.id` é UUID (`ParseUUIDPipe`), `User.id` é Int (`ParseIntPipe`).
  Ver [ADR 0003](../context/decisoes/0003-id-uuid-para-cliente-int-para-usuario.md).
- Apagar cliente **cascateia** negociações/pedidos; apagar usuário só **desvincula** o
  vendedor (`SetNull`) — histórico de vendas não se perde.
- `whitelist: true` no `ValidationPipe`: campo que não está no DTO é silenciosamente
  descartado. Se um campo "sumiu", quase sempre é o DTO que não o declara.
- Os guards são globais: qualquer rota nova já nasce protegida pelos três.
