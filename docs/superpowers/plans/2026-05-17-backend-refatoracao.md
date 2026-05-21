# Backend MMT CRM — Plano de Refatoração Completo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os 15 problemas identificados na análise: segurança do repositório, bugs de build, estrutura de código e adição de JWT + Swagger.

**Architecture:** Correções incrementais por ordem de criticidade. JWT implementado com `@nestjs/jwt` + `passport-jwt`, guard global com decorator `@Public()` para rotas abertas. Swagger em `/docs` com autenticação Bearer.

**Tech Stack:** NestJS 11, TypeScript 5.7, Prisma 7, PostgreSQL, bcrypt, @nestjs/jwt, passport-jwt, @nestjs/swagger, class-validator

---

## Mapa de Arquivos

### Criar
- `backend-mmturbanacrm/.gitignore`
- `backend-mmturbanacrm/.env.example`
- `backend-mmturbanacrm/src/auth/strategies/jwt.strategy.ts`
- `backend-mmturbanacrm/src/auth/guards/jwt-auth.guard.ts`
- `backend-mmturbanacrm/src/auth/decorators/public.decorator.ts`

### Modificar
- `package.json` — mover bcrypt para dependencies, adicionar @nestjs/jwt etc.
- `tsconfig.json` — habilitar strictNullChecks
- `prisma/schema.prisma` — url no datasource, remover relações de models inexistentes
- `src/main.ts` — transform no ValidationPipe, CORS via env, Swagger
- `src/app/app.module.ts` — guard global via APP_GUARD
- `src/app/app.controller.ts` — health check + @Public()
- `src/app/app.service.ts` — limpar métodos não usados
- `src/auth/auth.module.ts` — JwtModule + PassportModule + JwtStrategy
- `src/auth/auth.service.ts` — retornar access_token no login
- `src/auth/auth.controller.ts` — @Public() no login
- `src/users/users.module.ts` — corrigir import path
- `src/users/users.service.ts` — corrigir import path + Prisma import + replace()
- `src/users/users.controller.ts` — @Public() no POST
- `src/users/dto/replace-user.dto.ts` — role e status obrigatórios
- `.env` — adicionar JWT_SECRET e JWT_EXPIRES_IN

### Deletar
- `src/users/entities/user.entity.ts` — código morto, não usado em lugar algum

---

## Task 1: .gitignore + .env.example

> **FAÇA ISSO ANTES DE QUALQUER COMMIT NO GITHUB.** O `.env` real com senha do banco não pode ir para o GitHub.

**Arquivos:**
- Criar: `.gitignore`
- Criar: `.env.example`

- [ ] **Step 1: Criar o .gitignore**

Crie o arquivo `backend-mmturbanacrm/.gitignore`:

```gitignore
# Dependências
node_modules/

# Build
dist/

# Prisma gerado automaticamente
generated/

# Variáveis de ambiente (NUNCA commitar o .env real)
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs/
*.log
npm-debug.log*

# Coverage de testes
coverage/
```

- [ ] **Step 2: Criar o .env.example**

Crie o arquivo `backend-mmturbanacrm/.env.example`:

```env
# Banco de dados PostgreSQL
# Formato: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/mmturbana?schema=public"

# JWT
# Gere um secret seguro rodando no terminal:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="sua-chave-secreta-muito-longa-e-aleatoria-minimo-32-caracteres"
JWT_EXPIRES_IN="7d"

# Servidor
PORT=3000

# CORS — URL do frontend em produção. Em dev, use *
CORS_ORIGIN="*"
```

- [ ] **Step 3: Gerar JWT_SECRET e atualizar o .env real**

No terminal, gere uma chave segura:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Abra o `.env` e adicione as novas variáveis:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/mmturbana?schema=public"
JWT_SECRET="cole-aqui-o-resultado-do-comando-acima"
JWT_EXPIRES_IN="7d"
PORT=3000
CORS_ORIGIN="*"
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add .gitignore and .env.example"
```

---

## Task 2: Mover bcrypt para dependencies

**Arquivos:**
- Modificar: `package.json`

- [ ] **Step 1: No package.json, mover `bcrypt` de devDependencies para dependencies**

Na seção `dependencies`, adicione `"bcrypt": "^6.0.0"`.
Na seção `devDependencies`, remova `"bcrypt": "^6.0.0"` (mantenha apenas `"@types/bcrypt": "^6.0.0"`).

Resultado final das seções relevantes:

```json
"dependencies": {
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/mapped-types": "*",
  "@nestjs/platform-express": "^11.0.1",
  "@prisma/adapter-pg": "^7.7.0",
  "@prisma/client": "^7.7.0",
  "bcrypt": "^6.0.0",
  "class-transformer": "^0.5.1",
  "class-validator": "^0.15.1",
  "dotenv": "^16.6.1",
  "pg": "^8.20.0",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1"
},
"devDependencies": {
  "@eslint/eslintrc": "^3.2.0",
  "@eslint/js": "^9.18.0",
  "@nestjs/cli": "^11.0.0",
  "@nestjs/schematics": "^11.0.0",
  "@nestjs/testing": "^11.0.1",
  "@types/bcrypt": "^6.0.0",
  "@types/express": "^5.0.0",
  ...
}
```

> `@types/bcrypt` fica em devDependencies — tipos TypeScript só são necessários em dev/build, não em runtime.

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "fix: move bcrypt to production dependencies"
```

---

## Task 3: Corrigir Import Paths

**Arquivos:**
- Modificar: `src/users/users.module.ts`
- Modificar: `src/users/users.service.ts`

- [ ] **Step 1: Corrigir import no users.module.ts**

No arquivo `src/users/users.module.ts`, linha com o import do PrismaModule:

```typescript
// ANTES (errado — sobe dois níveis e volta pra src, redundante):
import { PrismaModule } from '../../src/prisma/prisma.module'

// DEPOIS (correto — sobe um nível de users/ para src/, entra em prisma/):
import { PrismaModule } from '../prisma/prisma.module'
```

- [ ] **Step 2: Corrigir import no users.service.ts**

No arquivo `src/users/users.service.ts`:

```typescript
// ANTES:
import { PrismaService } from '../../src/prisma/prisma.service';

// DEPOIS:
import { PrismaService } from '../prisma/prisma.service';
```

- [ ] **Step 3: Verificar que o servidor ainda sobe**

```bash
npm run start:dev
```

Esperado: servidor sobe na porta 3000 sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/users/users.module.ts src/users/users.service.ts
git commit -m "fix: correct relative import paths in users module"
```

---

## Task 4: Corrigir Schema Prisma

**Arquivos:**
- Modificar: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar `url` no datasource**

No `prisma/schema.prisma`, atualize o bloco `datasource db`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 2: Remover relações com models inexistentes do Client**

No model `Client`, remova as linhas que referenciam `Negotiation`, `Quotation` e `Order` (models que ainda não existem no schema e causariam erro no migrate):

```prisma
model Client {
  id              String             @id @default(uuid())
  name            String
  email           String?
  phone           String?
  cpf             String?            @unique
  address         String?
  status          ClientStatus       @default(LEAD)
  qualification   LeadQualification  @default(NAO_QUALIFICADO)
  origin          LeadOrigin?
  notes           String?
  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")
  lastContactAt   DateTime?          @map("last_contact_at")

  @@map("clients")
}
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "fix: add DATABASE_URL to prisma datasource and remove undefined model relations"
```

---

## Task 5: Corrigir main.ts

**Arquivos:**
- Modificar: `src/main.ts`

- [ ] **Step 1: Atualizar main.ts com transform e CORS configurável**

```typescript
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application running on: ${await app.getUrl()}`);
}

bootstrap();
```

> `transform: true` faz o NestJS converter automaticamente tipos nos DTOs (ex: string para number). `CORS_ORIGIN` via variável de ambiente permite restringir origens em produção sem alterar o código.

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "fix: add transform to ValidationPipe and configure CORS via env"
```

---

## Task 6: Corrigir Import do PrismaClientKnownRequestError

**Arquivos:**
- Modificar: `src/users/users.service.ts`

- [ ] **Step 1: Substituir o import incorreto**

No `src/users/users.service.ts`, remova:

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
```

Adicione (junto com os outros imports do Prisma/pg no topo do arquivo):

```typescript
import { Prisma } from '../../generated/prisma/client';
```

- [ ] **Step 2: Atualizar a verificação no método `remove()`**

```typescript
// ANTES:
if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {

// DEPOIS:
if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
```

- [ ] **Step 3: Verificar o build**

```bash
npm run build
```

Esperado: sem erros de compilação.

- [ ] **Step 4: Commit**

```bash
git add src/users/users.service.ts
git commit -m "fix: use correct Prisma namespace for PrismaClientKnownRequestError"
```

---

## Task 7: Corrigir replace() para atualizar role e status

**Arquivos:**
- Modificar: `src/users/users.service.ts`

- [ ] **Step 1: Substituir o método `replace()` completo**

```typescript
async replace(id: number, replaceUserDto: ReplaceUserDto) {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (replaceUserDto.email !== user.email) {
    await this.checkEmail(replaceUserDto.email, id);
  }

  const hashedPassword = await bcrypt.hash(replaceUserDto.password, 10);

  return this.prisma.user.update({
    where: { id },
    data: {
      name: replaceUserDto.name,
      email: replaceUserDto.email,
      password: hashedPassword,
      role: replaceUserDto.role,
      status: replaceUserDto.status,
    },
    select: this.userSelect,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/users/users.service.ts
git commit -m "fix: include role and status in PUT replace operation"
```

---

## Task 8: Corrigir ReplaceUserDto

**Arquivos:**
- Modificar: `src/users/dto/replace-user.dto.ts`

- [ ] **Step 1: Reescrever ReplaceUserDto com campos obrigatórios**

O `PUT` substitui o recurso inteiro, então `role` e `status` são obrigatórios (sem `@IsOptional()`). Substitua o arquivo:

```typescript
import { IsNotEmpty, IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { RoleEnum, UserStatusEnum } from './create-user.dto';

export class ReplaceUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(RoleEnum)
  role!: RoleEnum;

  @IsEnum(UserStatusEnum)
  status!: UserStatusEnum;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/users/dto/replace-user.dto.ts
git commit -m "fix: make role and status required in ReplaceUserDto (PUT is full replacement)"
```

---

## Task 9: Limpar Código Morto

**Arquivos:**
- Deletar: `src/users/entities/user.entity.ts`
- Modificar: `src/app/app.service.ts`
- Modificar: `src/app/app.controller.ts`

- [ ] **Step 1: Deletar user.entity.ts**

Delete o arquivo `src/users/entities/user.entity.ts` — não é referenciado em nenhum lugar do projeto.

No terminal (dentro do diretório backend):

```bash
del src\users\entities\user.entity.ts
```

Ou simplesmente delete pelo explorador de arquivos ou VSCode (botão direito → Delete).

- [ ] **Step 2: Reescrever AppService com health check**

Substitua `src/app/app.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

- [ ] **Step 3: Reescrever AppController com endpoint de health**

Substitua `src/app/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
```

> O `@Public()` será adicionado aqui na Task 10 (JWT). Por ora, o endpoint fica sem proteção, o que causará 401 depois que o guard global for aplicado.

- [ ] **Step 4: Testar o health check**

```bash
npm run start:dev
```

Acesse `http://localhost:3000/health`. Esperado:

```json
{
  "status": "ok",
  "timestamp": "2026-05-17T12:00:00.000Z"
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/app.service.ts src/app/app.controller.ts
git commit -m "refactor: replace unused AppService methods with health check endpoint"
```

---

## Task 10: Implementar JWT

> Essa é a maior e mais importante task. JWT garante que rotas protegidas só sejam acessadas por usuários autenticados.

**Como funciona o fluxo:**
1. Frontend faz `POST /auth/login` → recebe `access_token`
2. Frontend inclui o token em todas as requisições: `Authorization: Bearer <token>`
3. O guard global intercepta todas as requisições, valida o token e libera ou bloqueia
4. Rotas com `@Public()` passam sem verificação (login, health, criação de usuário)

**Arquivos:**
- Criar: `src/auth/decorators/public.decorator.ts`
- Criar: `src/auth/strategies/jwt.strategy.ts`
- Criar: `src/auth/guards/jwt-auth.guard.ts`
- Modificar: `src/auth/auth.module.ts`
- Modificar: `src/auth/auth.service.ts`
- Modificar: `src/auth/auth.controller.ts`
- Modificar: `src/app/app.module.ts`
- Modificar: `src/app/app.controller.ts`
- Modificar: `src/users/users.controller.ts`

- [ ] **Step 1: Instalar pacotes JWT**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

Esperado: pacotes instalados sem erros.

- [ ] **Step 2: Criar o decorator @Public()**

Crie `src/auth/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

> Esse decorator marca rotas que não precisam de JWT. Adicione `@Public()` acima de qualquer endpoint que deve ser acessível sem login.

- [ ] **Step 3: Criar a JWT Strategy**

Crie `src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

> A strategy extrai o token do header `Authorization: Bearer <token>`, valida a assinatura com o JWT_SECRET e retorna o payload. O objeto retornado fica disponível como `req.user` nas rotas protegidas.

- [ ] **Step 4: Criar o JWT Guard**

Crie `src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }
}
```

> O guard verifica se a rota tem `@Public()`. Se tiver, libera. Se não tiver, exige JWT válido.

- [ ] **Step 5: Atualizar AuthModule para incluir JWT**

Substitua `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'fallback-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

- [ ] **Step 6: Atualizar AuthService para retornar o token**

Substitua `src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    if (user.status !== 'ATIVO') {
      throw new UnauthorizedException('Usuário inativo');
    }

    return user;
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const { password, ...publicUser } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: publicUser,
    };
  }
}
```

- [ ] **Step 7: Marcar a rota de login como @Public()**

Substitua `src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }
}
```

- [ ] **Step 8: Aplicar o guard globalmente no AppModule**

Substitua `src/app/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

> `APP_GUARD` aplica o `JwtAuthGuard` em TODAS as rotas automaticamente. Só as rotas com `@Public()` ficam abertas.

- [ ] **Step 9: Adicionar @Public() no health check e no POST /users**

Atualize `src/app/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
```

Atualize `src/users/users.controller.ts` (adicione o import e o `@Public()` no `create`):

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ReplaceUserDto } from './dto/replace-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  updatePartial(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updatePartial(id, updateUserDto);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() replaceUserDto: ReplaceUserDto) {
    return this.usersService.replace(id, replaceUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
```

> `POST /users` é público para permitir criar o primeiro usuário admin. Depois de configurado, você pode proteger essa rota e usar seeds ou um painel admin.

- [ ] **Step 10: Testar o fluxo completo de autenticação**

Suba o servidor: `npm run start:dev`

**Criar um usuário admin (POST /users é público):**
```json
POST http://localhost:3000/users
{
  "name": "Admin MMT",
  "email": "admin@mmturbana.com",
  "password": "senha12345",
  "role": "ADMIN"
}
```
Esperado: `201 Created` com dados do usuário (sem senha).

**Fazer login:**
```json
POST http://localhost:3000/auth/login
{
  "email": "admin@mmturbana.com",
  "password": "senha12345"
}
```
Esperado:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin MMT",
    "email": "admin@mmturbana.com",
    "role": "ADMIN",
    "status": "ATIVO",
    ...
  }
}
```

**Acessar rota protegida SEM token:**
```
GET http://localhost:3000/users
```
Esperado: `401 Unauthorized`

**Acessar rota protegida COM token:**
```
GET http://localhost:3000/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Esperado: `200 OK` com lista de usuários.

- [ ] **Step 11: Commit**

```bash
git add src/auth/ src/app/app.module.ts src/app/app.controller.ts src/users/users.controller.ts package.json package-lock.json
git commit -m "feat: implement JWT authentication with global guard and @Public decorator"
```

---

## Task 11: Adicionar Swagger

**Arquivos:**
- Modificar: `package.json` (nova dependência)
- Modificar: `src/main.ts`

- [ ] **Step 1: Instalar @nestjs/swagger**

```bash
npm install @nestjs/swagger
```

- [ ] **Step 2: Configurar Swagger no main.ts**

Substitua `src/main.ts`:

```typescript
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  const config = new DocumentBuilder()
    .setTitle('MMT Urbana CRM API')
    .setDescription('API do sistema CRM da MMT Urbana — Revenda Apple')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application running on: ${await app.getUrl()}`);
  console.log(`Swagger docs: ${await app.getUrl()}/docs`);
}

bootstrap();
```

- [ ] **Step 3: Verificar que o Swagger funciona**

Suba o servidor (`npm run start:dev`) e acesse no navegador:

```
http://localhost:3000/docs
```

Esperado: página Swagger com todos os endpoints listados.

> Para testar rotas protegidas no Swagger: clique em **"Authorize"** no canto superior direito e cole o `access_token` do login.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts package.json package-lock.json
git commit -m "feat: add Swagger/OpenAPI documentation at /docs"
```

---

## Task 12: Ativar strictNullChecks

**Arquivos:**
- Modificar: `tsconfig.json`

- [ ] **Step 1: Atualizar tsconfig.json**

Substitua o conteúdo de `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 2: Verificar erros de compilação**

```bash
npm run build
```

Se aparecerem erros, os mais comuns são:

- `Object is possibly 'undefined'`: adicione verificação `if (x)` antes de usar, ou `x!` se tem certeza que não é undefined
- `Parameter 'x' implicitly has an 'any' type`: adicione tipagem explícita ao parâmetro

O TypeScript vai indicar exatamente arquivo e linha de cada erro.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: enable strict TypeScript checks (strictNullChecks, noImplicitAny)"
```

---

## Ordem de Execução

Execute as tasks nessa ordem para evitar dependências quebradas:

| # | Task | Motivo |
|---|------|--------|
| 1 | `.gitignore + .env.example` | **Antes de qualquer commit** — credenciais não podem ir pro GitHub |
| 2 | Schema Prisma (Task 4) | Base para tudo que usa o banco |
| 3 | Import Paths (Task 3) | Corrige estrutura antes de adicionar mais código |
| 4 | bcrypt em dependencies (Task 2) | Necessário para build de produção |
| 5 | PrismaClientKnownRequestError (Task 6) | Corrige import antes de mais alterações no service |
| 6 | replace() com role/status (Task 7) | Bugfix no service |
| 7 | ReplaceUserDto (Task 8) | DTO alinhado com o bugfix do service |
| 8 | Código morto (Task 9) | Limpar antes de adicionar mais |
| 9 | main.ts (Task 5) | Preparação para o Swagger que vem depois |
| 10 | **JWT (Task 10)** | Feature principal — reserve ±30 min |
| 11 | Swagger (Task 11) | Depende do JWT estar funcionando |
| 12 | strictNullChecks (Task 12) | Por último — pode gerar ajustes no código anterior |
