# MMT URBANA CRM — Guia Completo de Desenvolvimento

> **Projeto:** MMT URBANA CRM  
> **Empresa:** MMT Urbana Serviços Digitais LTDA  
> **Desenvolvedor:** Guilherme Marobo Fontana Martins  
> **Orientador:** Tiago Ravache  
> **Instituição:** UniFil — Bacharelado em Engenharia de Software  
> **Metodologia:** RUP (Rational Unified Process)  
> **Versão do Guia:** 1.0 — Abril/2026

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Pastas Recomendada](#4-estrutura-de-pastas-recomendada)
5. [Modelagem do Banco de Dados (Prisma Schema)](#5-modelagem-do-banco-de-dados-prisma-schema)
6. [Módulos e Funcionalidades](#6-módulos-e-funcionalidades)
   - 6.1 [Autenticação e Controle de Acesso](#61-autenticação-e-controle-de-acesso)
   - 6.2 [Gestão de Clientes e Leads](#62-gestão-de-clientes-e-leads)
   - 6.3 [Cadastro de Produtos e Serviços](#63-cadastro-de-produtos-e-serviços)
   - 6.4 [Gestão de Dispositivos Usados](#64-gestão-de-dispositivos-usados)
   - 6.5 [Emissão de Orçamentos Automatizados](#65-emissão-de-orçamentos-automatizados)
   - 6.6 [Gestão de Negociações](#66-gestão-de-negociações)
   - 6.7 [Emissão de Pedidos e Notas](#67-emissão-de-pedidos-e-notas)
   - 6.8 [Painel Administrativo (Dashboard)](#68-painel-administrativo-dashboard)
   - 6.9 [Gerenciamento de Usuários](#69-gerenciamento-de-usuários)
7. [Casos de Uso Detalhados](#7-casos-de-uso-detalhados)
8. [Regras de Negócio](#8-regras-de-negócio)
9. [Requisitos Não-Funcionais (FURPS+)](#9-requisitos-não-funcionais-furps)
10. [API REST — Endpoints por Módulo](#10-api-rest--endpoints-por-módulo)
11. [Telas e Interface do Usuário](#11-telas-e-interface-do-usuário)
12. [Segurança](#12-segurança)
13. [Desempenho e Qualidade](#13-desempenho-e-qualidade)
14. [Workflow AS-IS vs TO-BE](#14-workflow-as-is-vs-to-be)
15. [Plano de Releases](#15-plano-de-releases)
16. [Cronograma de Desenvolvimento](#16-cronograma-de-desenvolvimento)
17. [Glossário](#17-glossário)

---

## 1. Visão Geral do Projeto

### 1.1 Contexto

A empresa **MMT Urbana Serviços Digitais LTDA** atua no segmento de **revenda de dispositivos Apple** no mercado brasileiro. O modelo de negócio envolve a venda de dispositivos novos e a avaliação técnica de dispositivos usados recebidos como parte do pagamento (trade-in). Os principais canais de contato com clientes são **WhatsApp** e **Instagram**.

### 1.2 Problema

A operação comercial atual é **fragmentada entre três plataformas distintas** (Google Sheets, SaaS de terceiros e ferramentas do Google), o que causa:

- **Demora nas respostas** aos clientes nos canais WhatsApp e Instagram, resultando em perda de vendas.
- **Elaboração manual de orçamentos** com cálculos de parcelamento e valores de entrada à vista, consumindo tempo excessivo.
- **Ausência de rastreabilidade** das negociações e formalização digital das transações.
- **Falta de qualificação de leads**, sem critérios definidos para identificar clientes com real intenção de compra.
- **Informações de produtos dispersas** em planilhas sem controle centralizado.
- Ferramentas de CRM genéricas (RD Station, HubSpot, Pipedrive) **não atendem ao modelo de negócio** específico da empresa.

### 1.3 Solução

O **MMT URBANA CRM** é um sistema web SaaS desenvolvido sob medida, que unifica todas as operações comerciais em uma única plataforma com interface intuitiva, automatizando orçamentos e oferecendo gestão completa do ciclo de vendas.

### 1.4 Critérios de Êxito (definidos pelo Stakeholder)

- Aumento na quantidade de vendas.
- Redução no tempo de resposta aos clientes.
- Eliminação da fragmentação operacional entre múltiplas plataformas.

### 1.5 Stakeholder Principal

| Campo | Valor |
|-------|-------|
| **Nome** | Thiago Martins Ferreira |
| **Cargo** | Proprietário |
| **Empresa** | MMT Urbana Serviços Digitais LTDA |
| **Formação** | Engenharia da Computação |
| **Envolvimento** | Revisor de Requisitos |

---

## 2. Stack Tecnológica

### 2.1 Linguagem Principal

| Tecnologia | Uso |
|------------|-----|
| **TypeScript** | Linguagem principal em toda a stack (frontend + backend). Tipagem estática para segurança e manutenibilidade. |

### 2.2 Frontend

| Tecnologia | Versão Mínima | Justificativa |
|------------|---------------|---------------|
| **React.js** | 18+ | Framework para construção de interfaces modernas, responsivas e fluídas. |
| **TypeScript** | 5+ | Tipagem estática no frontend. |
| **React Router** | 6+ | Roteamento SPA. |
| **Axios** ou **Fetch API** | — | Comunicação HTTP com a API REST. |
| **CSS Modules** ou **Tailwind CSS** | — | Estilização da interface. |

### 2.3 Backend

| Tecnologia | Versão Mínima | Justificativa |
|------------|---------------|---------------|
| **NestJS** | 10+ | Framework modular baseado em princípios SOLID, com injeção de dependências nativa, Guards, Pipes e Interceptors. |
| **Node.js** | 18+ LTS | Runtime JavaScript server-side. |
| **TypeScript** | 5+ | Tipagem estática no backend. |
| **Prisma ORM** | 5+ | ORM type-safe com migrations versionadas e tipagem automática de entidades. |
| **PostgreSQL** | 15+ | Banco de dados relacional robusto com suporte a transações ACID. |
| **bcrypt** | — | Hashing seguro de senhas. |
| **jsonwebtoken (JWT)** | — | Autenticação stateless via tokens. |
| **class-validator** | — | Validação de DTOs nos Pipes do NestJS. |
| **class-transformer** | — | Transformação e serialização de objetos. |

### 2.4 Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| **Visual Studio Code** | IDE principal. |
| **Git** | Controle de versão. |
| **GitHub** | Repositório remoto para versionamento compartilhado. |
| **Postman** ou **Insomnia** | Testes de API. |
| **pgAdmin** ou **DBeaver** | Administração do PostgreSQL. |

### 2.5 Infraestrutura

| Fase | Hospedagem |
|------|------------|
| **Fase Inicial** | Servidor local. |
| **Fase Avançada** | Migração para Cloud (AWS, GCP, Azure ou similar). |

---

## 3. Arquitetura do Sistema

### 3.1 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR WEB                            │
│              (Chrome, Firefox, Safari, etc.)                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              FRONTEND (React.js + TypeScript)             │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐  │  │
│  │  │  Pages  │ │Components│ │  Hooks    │ │  Services  │  │  │
│  │  └─────────┘ └──────────┘ └───────────┘ └────────────┘  │  │
│  └───────────────────────┬───────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP/HTTPS (API REST - JSON)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────┼──────────────────────────────────────┐
│                          ▼                                      │
│              BACKEND (NestJS + TypeScript)                       │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Controllers│──│  Services  │──│ Repositories│                │
│  └──────┬─────┘  └────────────┘  └──────┬─────┘                │
│         │                                │                       │
│  ┌──────┴─────┐  ┌────────────┐  ┌──────┴─────┐                │
│  │   Guards   │  │   Pipes    │  │ Prisma ORM │                │
│  │  (Auth +   │  │(Validation)│  │            │                │
│  │   Roles)   │  └────────────┘  └──────┬─────┘                │
│  └────────────┘                         │                       │
│  ┌────────────┐                         │                       │
│  │Interceptors│                         │                       │
│  │  (Errors)  │                         │                       │
│  └────────────┘                         │                       │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────┐
                              │    PostgreSQL       │
                              │  (Banco Relacional) │
                              └────────────────────┘
```

### 3.2 Padrões Arquiteturais

- **Separação Frontend / Backend** via API REST.
- **Comunicação Stateless** com JSON como formato de troca de dados.
- **Arquitetura Modular** no backend (NestJS): cada domínio de negócio é um módulo independente.
- **Princípios SOLID** aplicados no backend.
- **Injeção de Dependências** nativa do NestJS.
- **Guards** para controle de acesso por roles.
- **Pipes** para validação de dados de entrada.
- **Interceptors** para tratamento padronizado de erros.
- **JWT** no cabeçalho `Authorization` para autenticação de requisições.

---

## 4. Estrutura de Pastas Recomendada

### 4.1 Backend (NestJS)

```
backend/
├── prisma/
│   ├── schema.prisma          # Definição do schema do banco
│   ├── migrations/            # Migrations versionadas
│   └── seed.ts                # Seed de dados iniciais
├── src/
│   ├── main.ts                # Bootstrap da aplicação
│   ├── app.module.ts          # Módulo raiz
│   │
│   ├── common/                # Recursos compartilhados
│   │   ├── decorators/        # Decorators customizados (@Roles, @CurrentUser)
│   │   ├── guards/            # AuthGuard, RolesGuard
│   │   ├── interceptors/      # ErrorInterceptor, TransformInterceptor
│   │   ├── pipes/             # ValidationPipe customizado
│   │   ├── filters/           # Exception filters
│   │   ├── enums/             # Role, Status, LeadQualification, etc.
│   │   └── dto/               # DTOs base (PaginationDto, etc.)
│   │
│   ├── auth/                  # Módulo de Autenticação
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/        # JwtStrategy
│   │   └── dto/               # LoginDto, TokenResponseDto
│   │
│   ├── users/                 # Módulo de Usuários
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/               # CreateUserDto, UpdateUserDto
│   │
│   ├── clients/               # Módulo de Clientes e Leads
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   └── dto/               # CreateClientDto, UpdateClientDto
│   │
│   ├── products/              # Módulo de Produtos e Serviços
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/               # CreateProductDto, UpdateProductDto
│   │
│   ├── used-devices/          # Módulo de Dispositivos Usados
│   │   ├── used-devices.module.ts
│   │   ├── used-devices.controller.ts
│   │   ├── used-devices.service.ts
│   │   └── dto/               # CreateUsedDeviceDto, UpdateUsedDeviceDto
│   │
│   ├── quotations/            # Módulo de Orçamentos
│   │   ├── quotations.module.ts
│   │   ├── quotations.controller.ts
│   │   ├── quotations.service.ts
│   │   └── dto/               # CreateQuotationDto, CalculateInstallmentsDto
│   │
│   ├── negotiations/          # Módulo de Negociações
│   │   ├── negotiations.module.ts
│   │   ├── negotiations.controller.ts
│   │   ├── negotiations.service.ts
│   │   └── dto/               # CreateNegotiationDto, UpdateNegotiationDto
│   │
│   ├── orders/                # Módulo de Pedidos e Notas
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── dto/               # CreateOrderDto, UpdateOrderDto
│   │
│   └── dashboard/             # Módulo do Dashboard
│       ├── dashboard.module.ts
│       ├── dashboard.controller.ts
│       └── dashboard.service.ts
│
├── test/                      # Testes e2e
├── .env                       # Variáveis de ambiente
├── .env.example               # Exemplo de variáveis
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### 4.2 Frontend (React.js)

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Componente raiz + rotas
│   │
│   ├── api/                   # Configuração do Axios e service layers
│   │   ├── axiosInstance.ts   # Instância configurada com interceptors
│   │   ├── authApi.ts
│   │   ├── clientsApi.ts
│   │   ├── productsApi.ts
│   │   ├── usedDevicesApi.ts
│   │   ├── quotationsApi.ts
│   │   ├── negotiationsApi.ts
│   │   ├── ordersApi.ts
│   │   ├── usersApi.ts
│   │   └── dashboardApi.ts
│   │
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Layout/            # Sidebar, Navbar, Footer
│   │   ├── Table/             # Tabela genérica com paginação e busca
│   │   ├── Modal/             # Modal genérico
│   │   ├── Form/              # Inputs, Selects, DatePickers
│   │   ├── StatusBadge/       # Badges de status coloridos
│   │   └── ProtectedRoute/    # Rota protegida por autenticação e roles
│   │
│   ├── pages/                 # Páginas/Telas do sistema
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Negotiations/
│   │   ├── Clients/
│   │   ├── Products/
│   │   ├── Quotation/
│   │   ├── Orders/
│   │   └── Admin/
│   │
│   ├── contexts/              # Context API
│   │   └── AuthContext.tsx     # Contexto de autenticação
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   └── useDebounce.ts
│   │
│   ├── types/                 # Interfaces e tipos TypeScript
│   │   ├── auth.types.ts
│   │   ├── client.types.ts
│   │   ├── product.types.ts
│   │   ├── negotiation.types.ts
│   │   ├── quotation.types.ts
│   │   ├── order.types.ts
│   │   └── user.types.ts
│   │
│   ├── utils/                 # Funções utilitárias
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   └── validators.ts
│   │
│   └── styles/                # Estilos globais
│       └── globals.css
│
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 5. Modelagem do Banco de Dados (Prisma Schema)

O schema abaixo representa todas as entidades necessárias para atender aos requisitos dos documentos RUP. Cada entidade é comentada com a rastreabilidade ao documento de origem.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum Role {
  ADMIN        // Administrador - privilégios máximos
  VENDEDOR     // Vendedor - negociações, orçamentos, clientes
  ATENDENTE    // Atendente - atendimento e qualificação de leads
  TECNICO      // Técnico - avaliação de dispositivos usados
}

enum UserStatus {
  ATIVO
  INATIVO
}

enum ClientStatus {
  LEAD         // Lead - ainda não qualificado
  ATIVO        // Cliente ativo com negociações
  INATIVO      // Cliente sem atividade recente
}

enum LeadQualification {
  NAO_QUALIFICADO
  QUALIFICADO
  ALTA_INTENCAO  // Alta intenção de compra
}

enum LeadOrigin {
  WHATSAPP
  INSTAGRAM
  SITE
  INDICACAO
  OUTRO
}

enum ProductCategory {
  IPHONE
  MACBOOK
  IPAD
  WATCH
  AIRPODS
  ACESSORIO
  SERVICO
}

enum ProductStatus {
  DISPONIVEL
  INDISPONIVEL
  DESCONTINUADO
}

enum DeviceCondition {
  EXCELENTE
  BOM
  REGULAR
  RUIM
  DEFEITUOSO
}

enum NegotiationStatus {
  EM_ANDAMENTO
  AGUARDANDO_AVALIACAO
  ORCAMENTO_ENVIADO
  CONCLUIDA
  CANCELADA
}

enum QuotationStatus {
  RASCUNHO
  EMITIDO
  APROVADO
  RECUSADO
  EXPIRADO
}

enum OrderStatus {
  PROCESSANDO
  CONCLUIDO
  AGUARDANDO_PAGAMENTO
  CANCELADO
}

enum PaymentMethod {
  PIX
  CARTAO_CREDITO
  CARTAO_DEBITO
  BOLETO
  TRANSFERENCIA
  DINHEIRO
}

// ============================================================
// ENTIDADES
// ============================================================

/// Usuários do sistema (Vendedor, Atendente, Técnico, Admin)
/// Ref: Documento Visão 5.1, Especificação Suplementar 4.3, 4.4
model User {
  id          String     @id @default(uuid())
  name        String
  email       String     @unique
  password    String     // Hash bcrypt
  role        Role       @default(VENDEDOR)
  status      UserStatus @default(ATIVO)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Relacionamentos
  negotiations   Negotiation[]   @relation("VendedorNegotiation")
  quotations     Quotation[]     @relation("VendedorQuotation")
  orders         Order[]         @relation("VendedorOrder")
  usedDevices    UsedDevice[]    @relation("TecnicoDevice")

  @@map("users")
}

/// Clientes e Leads
/// Ref: Documento Visão 5.2, Pedido do Investidor Seção 6
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

  // Relacionamentos
  negotiations    Negotiation[]
  quotations      Quotation[]
  orders          Order[]

  @@map("clients")
}

/// Produtos e Serviços (dispositivos Apple novos)
/// Ref: Documento Visão 5.3
model Product {
  id            String          @id @default(uuid())
  name          String          // Ex: "iPhone 15 Pro Max 256GB"
  category      ProductCategory
  brand         String          @default("Apple")
  model         String?         // Ex: "A3106"
  storage       String?         // Ex: "256GB"
  color         String?
  price         Decimal         @db.Decimal(12, 2)
  stock         Int             @default(0)
  status        ProductStatus   @default(DISPONIVEL)
  description   String?
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  // Relacionamentos
  negotiationItems  NegotiationItem[]
  quotationItems    QuotationItem[]
  orderItems        OrderItem[]

  @@map("products")
}

/// Dispositivos Usados (recebidos como parte do pagamento / trade-in)
/// Ref: Documento Visão 3.6.2, Caso de Uso "Gerenciar Dispositivo Usado"
model UsedDevice {
  id              String           @id @default(uuid())
  deviceName      String           @map("device_name")   // Ex: "iPhone 13 Pro"
  brand           String           @default("Apple")
  model           String?
  storage         String?
  color           String?
  serialNumber    String?          @map("serial_number")
  condition       DeviceCondition
  estimatedValue  Decimal          @db.Decimal(12, 2) @map("estimated_value")
  technicalNotes  String?          @map("technical_notes") // Laudo técnico
  evaluatedById   String?          @map("evaluated_by_id")
  evaluatedAt     DateTime?        @map("evaluated_at")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  // Relacionamentos
  evaluatedBy     User?            @relation("TecnicoDevice", fields: [evaluatedById], references: [id])
  negotiation     Negotiation?     @relation(fields: [negotiationId], references: [id])
  negotiationId   String?          @map("negotiation_id")
  quotation       Quotation?       @relation(fields: [quotationId], references: [id])
  quotationId     String?          @map("quotation_id")

  @@map("used_devices")
}

/// Negociações Comerciais
/// Ref: Documento Visão 5.5
model Negotiation {
  id            String              @id @default(uuid())
  clientId      String              @map("client_id")
  vendedorId    String              @map("vendedor_id")
  status        NegotiationStatus   @default(EM_ANDAMENTO)
  totalValue    Decimal?            @db.Decimal(12, 2) @map("total_value")
  notes         String?
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")
  closedAt      DateTime?           @map("closed_at")

  // Relacionamentos
  client        Client              @relation(fields: [clientId], references: [id])
  vendedor      User                @relation("VendedorNegotiation", fields: [vendedorId], references: [id])
  items         NegotiationItem[]
  usedDevices   UsedDevice[]
  quotations    Quotation[]
  orders        Order[]

  @@map("negotiations")
}

/// Itens de uma Negociação (produtos envolvidos)
model NegotiationItem {
  id              String      @id @default(uuid())
  negotiationId   String      @map("negotiation_id")
  productId       String      @map("product_id")
  quantity        Int         @default(1)
  unitPrice       Decimal     @db.Decimal(12, 2) @map("unit_price")

  // Relacionamentos
  negotiation     Negotiation @relation(fields: [negotiationId], references: [id], onDelete: Cascade)
  product         Product     @relation(fields: [productId], references: [id])

  @@map("negotiation_items")
}

/// Orçamentos Automatizados
/// Ref: Documento Visão 5.4, Principal dor do stakeholder
model Quotation {
  id                  String           @id @default(uuid())
  code                String           @unique // Ex: "ORC-001"
  clientId            String           @map("client_id")
  vendedorId          String           @map("vendedor_id")
  negotiationId       String?          @map("negotiation_id")
  status              QuotationStatus  @default(RASCUNHO)

  // Valores
  subtotal            Decimal          @db.Decimal(12, 2) // Soma dos itens
  usedDeviceDiscount  Decimal          @db.Decimal(12, 2) @default(0) @map("used_device_discount")
  downPayment         Decimal          @db.Decimal(12, 2) @default(0) @map("down_payment") // Entrada à vista
  totalValue          Decimal          @db.Decimal(12, 2) @map("total_value")
  remainingBalance    Decimal          @db.Decimal(12, 2) @map("remaining_balance") // Saldo restante
  installments        Int              @default(1) // Número de parcelas
  installmentValue    Decimal          @db.Decimal(12, 2) @default(0) @map("installment_value")
  interestRate        Decimal          @db.Decimal(5, 4) @default(0) @map("interest_rate") // Taxa de juros (0 = sem juros)

  notes               String?
  validUntil          DateTime?        @map("valid_until")
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")

  // Relacionamentos
  client              Client           @relation(fields: [clientId], references: [id])
  vendedor            User             @relation("VendedorQuotation", fields: [vendedorId], references: [id])
  negotiation         Negotiation?     @relation(fields: [negotiationId], references: [id])
  items               QuotationItem[]
  usedDevices         UsedDevice[]

  @@map("quotations")
}

/// Itens de um Orçamento
model QuotationItem {
  id            String    @id @default(uuid())
  quotationId   String    @map("quotation_id")
  productId     String    @map("product_id")
  quantity      Int       @default(1)
  unitPrice     Decimal   @db.Decimal(12, 2) @map("unit_price")

  // Relacionamentos
  quotation     Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  product       Product   @relation(fields: [productId], references: [id])

  @@map("quotation_items")
}

/// Pedidos e Notas
/// Ref: Documento Visão 5.7, Pedido do Investidor Seção 4
model Order {
  id              String        @id @default(uuid())
  code            String        @unique // Ex: "PED-001"
  clientId        String        @map("client_id")
  vendedorId      String        @map("vendedor_id")
  negotiationId   String?       @map("negotiation_id")
  status          OrderStatus   @default(PROCESSANDO)
  paymentMethod   PaymentMethod? @map("payment_method")
  totalValue      Decimal       @db.Decimal(12, 2) @map("total_value")
  notes           String?
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relacionamentos
  client          Client        @relation(fields: [clientId], references: [id])
  vendedor        User          @relation("VendedorOrder", fields: [vendedorId], references: [id])
  negotiation     Negotiation?  @relation(fields: [negotiationId], references: [id])
  items           OrderItem[]

  @@map("orders")
}

/// Itens de um Pedido
model OrderItem {
  id          String  @id @default(uuid())
  orderId     String  @map("order_id")
  productId   String  @map("product_id")
  quantity    Int     @default(1)
  unitPrice   Decimal @db.Decimal(12, 2) @map("unit_price")

  // Relacionamentos
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

---

## 6. Módulos e Funcionalidades

### 6.1 Autenticação e Controle de Acesso

**Referência:** Documento Visão 5.1 | Especificação Suplementar 4.3, 4.4 | Pedido do Investidor Seção 9  
**Prioridade:** Crítico | **Release:** 1.0 | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
Cada usuário realiza login com credenciais individuais. A autenticação utiliza tokens JWT e senhas armazenadas com hashing bcrypt. O controle de acesso é gerenciado por roles com Guards no backend.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| AUTH-01 | Login | Usuário informa e-mail e senha. O sistema valida as credenciais e retorna um token JWT. |
| AUTH-02 | Logout | Descarte do token no frontend (stateless no backend). |
| AUTH-03 | Verificação de Token | Middleware que valida o JWT em cada requisição protegida. |
| AUTH-04 | Controle por Roles | Guards que verificam se o role do usuário permite acessar o endpoint. |
| AUTH-05 | Refresh Token | (Opcional) Mecanismo de renovação do token sem novo login. |

#### Roles e Permissões

| Recurso | Admin | Vendedor | Atendente | Técnico |
|---------|:-----:|:--------:|:---------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ | ❌ |
| Gerenciar Negociações | ✅ | ✅ | ✅ | ❌ |
| Gerenciar Clientes/Leads | ✅ | ✅ | ✅ | ❌ |
| Gerenciar Produtos | ✅ | ✅ (leitura) | ✅ (leitura) | ❌ |
| Emitir Orçamentos | ✅ | ✅ | ✅ | ❌ |
| Gerenciar Pedidos | ✅ | ✅ | ✅ | ❌ |
| Avaliar Dispositivos Usados | ✅ | ❌ | ❌ | ✅ |
| Gerenciar Usuários | ✅ | ❌ | ❌ | ❌ |
| Configurar Sistema | ✅ | ❌ | ❌ | ❌ |

#### Implementação Backend

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status === 'INATIVO') {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}

// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// common/decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

#### Tela: Login (Figura 2 do Plano de Estágio)
- Campos: E-mail, Senha.
- Botão "Entrar".
- Logotipo "MMT URBANA CRM" no topo.
- Mensagem de erro em caso de credenciais inválidas.

---

### 6.2 Gestão de Clientes e Leads

**Referência:** Documento Visão 5.2 | Pedido do Investidor Seção 6  
**Prioridade:** Crítico | **Release:** 1.0 | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
Cadastro, consulta, edição e exclusão de clientes e leads. A qualificação de leads identifica potenciais clientes com real intenção de compra, reduzindo o tempo gasto com contatos sem potencial de conversão.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| CLI-01 | Listar Clientes/Leads | Tabela paginada com busca por nome, e-mail, telefone. Filtros por status e qualificação. |
| CLI-02 | Criar Cliente/Lead | Modal com campos: nome completo, e-mail, telefone, CPF, endereço, canal de origem, status e nível de qualificação. |
| CLI-03 | Editar Cliente/Lead | Atualização de qualquer campo, incluindo mudança de status (Lead → Ativo). |
| CLI-04 | Excluir Cliente/Lead | Soft delete ou exclusão com confirmação. |
| CLI-05 | Qualificar Lead | Alterar o nível de qualificação: Não Qualificado → Qualificado → Alta Intenção. |
| CLI-06 | Histórico de Contato | Registro automático da data do último contato. |
| CLI-07 | Visualizar Negociações | A partir do perfil do cliente, ver todas as negociações vinculadas. |

#### Campos do Formulário (Modal de Clientes — Figura 7)

| Campo | Tipo | Obrigatório | Validação |
|-------|------|:-----------:|-----------|
| Nome Completo | text | ✅ | Min 3 caracteres |
| E-mail | email | ❌ | Formato de e-mail válido |
| Telefone | tel | ❌ | Formato (XX) XXXXX-XXXX |
| CPF | text | ❌ | 11 dígitos, validação de CPF |
| Endereço | text | ❌ | — |
| Canal de Origem | select | ❌ | WhatsApp, Instagram, Site, Indicação, Outro |
| Status | select | ✅ | Lead, Ativo, Inativo |
| Qualificação | select | ✅ | Não Qualificado, Qualificado, Alta Intenção |

#### Tela: Clientes & Leads (Figura 6 do Plano de Estágio)
- Tabela com colunas: Nome, E-mail, Telefone, Status (badge colorido), Negociações (contagem), Último Contato.
- Campo de busca no topo.
- Botão "+ Novo Cliente" no canto superior direito.
- Badges de status: Lead (azul), Ativo (verde), Inativo (vermelho).

---

### 6.3 Cadastro de Produtos e Serviços

**Referência:** Documento Visão 5.3 | Pedido do Investidor Seção 4  
**Prioridade:** Crítico | **Release:** 1.0 | **Esforço:** Baixo (1-2 semanas) | **Risco:** Baixo

#### Descrição
Cadastro completo de dispositivos Apple novos e serviços oferecidos pela empresa. Centraliza informações que atualmente estão dispersas em planilhas.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| PRD-01 | Listar Produtos | Tabela paginada com busca por nome, categoria. Filtros por categoria e status. |
| PRD-02 | Criar Produto | Modal com campos detalhados do dispositivo. |
| PRD-03 | Editar Produto | Atualização de preço, estoque, status, etc. |
| PRD-04 | Excluir Produto | Soft delete ou exclusão com confirmação. |
| PRD-05 | Controle de Estoque | Quantidade disponível de cada produto. |
| PRD-06 | Consultar Estoque | Caso de uso incluído em "Gerenciar Produtos" (diagrama de caso de uso). |

#### Campos do Formulário (Modal de Produto — Figura 9)

| Campo | Tipo | Obrigatório | Validação |
|-------|------|:-----------:|-----------|
| Nome do Produto | text | ✅ | Min 3 caracteres |
| Categoria | select | ✅ | iPhone, MacBook, iPad, Watch, AirPods, Acessório, Serviço |
| Preço | currency | ✅ | Valor > 0, formato BRL |
| Estoque | number | ✅ | Valor >= 0, inteiro |
| Status | select | ✅ | Disponível, Indisponível, Descontinuado |
| Cor | text | ❌ | — |
| Armazenamento | text | ❌ | Ex: "256GB" |
| Modelo | text | ❌ | Ex: "A3106" |
| Descrição | textarea | ❌ | — |

#### Tela: Produtos & Serviços (Figura 8 do Plano de Estágio)
- Tabela com colunas: Produto, Categoria, Preço, Estoque, Status (badge colorido).
- Busca por nome.
- Botão "+ Novo Produto".
- Badges: Disponível (verde), Indisponível (vermelho).

---

### 6.4 Gestão de Dispositivos Usados

**Referência:** Documento Visão 3.6.2 | Caso de Uso "Gerenciar Dispositivo Usado" e "Estimar Valor de Dispositivo Usado"  
**Prioridade:** Importante | **Release:** 1.0 | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
O Técnico avalia dispositivos usados recebidos como parte do pagamento. Registra laudos técnicos e informa valores de avaliação que são refletidos automaticamente nos orçamentos.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| DEV-01 | Listar Dispositivos Usados | Tabela paginada com busca e filtros por condição. |
| DEV-02 | Registrar Dispositivo Usado | Cadastro com informações técnicas e estimativa de valor. |
| DEV-03 | Avaliar Dispositivo | Técnico registra condição, valor estimado e laudo técnico. |
| DEV-04 | Editar Avaliação | Atualização de valor ou condição. |
| DEV-05 | Vincular à Negociação | Associar o dispositivo usado a uma negociação ativa. |
| DEV-06 | Registrar como Entrada | Caso de uso estendido: registrar o dispositivo usado como entrada no orçamento. |

#### Campos

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| Nome do Dispositivo | text | ✅ |
| Marca | text | ✅ |
| Modelo | text | ❌ |
| Armazenamento | text | ❌ |
| Cor | text | ❌ |
| Número de Série | text | ❌ |
| Condição | select | ✅ |
| Valor Estimado (R$) | currency | ✅ |
| Notas Técnicas (Laudo) | textarea | ❌ |

---

### 6.5 Emissão de Orçamentos Automatizados

**Referência:** Documento Visão 5.4 | Pedido do Investidor Seção 6 (Orçamentos) — **Principal dor do stakeholder**  
**Prioridade:** Crítico | **Release:** 1.0 | **Esforço:** Alto (3-4 semanas) | **Risco:** Médio

#### Descrição
Criação de orçamentos com cálculo automático de parcelamentos e valores de entrada à vista, incluindo a avaliação de dispositivos usados recebidos como parte do pagamento. Elimina a necessidade de cálculos manuais em planilhas.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| ORC-01 | Criar Orçamento | Seleção de produto(s), cliente, dispositivo usado (opcional), entrada à vista e condições de parcelamento. |
| ORC-02 | Calcular Automaticamente | O sistema calcula: subtotal, desconto do dispositivo usado, saldo restante, valor da parcela. |
| ORC-03 | Simular Parcelamento | Seleção do número de parcelas (com ou sem juros) e visualização instantânea do valor da parcela. |
| ORC-04 | Vincular Dispositivo Usado | Abatimento automático do valor do dispositivo avaliado pelo técnico. |
| ORC-05 | Emitir Orçamento | Geração do orçamento com código sequencial (ORC-001, ORC-002, ...). |
| ORC-06 | Listar Orçamentos | Tabela com busca por código, cliente, status. |
| ORC-07 | Alterar Status | Rascunho → Emitido → Aprovado/Recusado/Expirado. |

#### Fórmula de Cálculo do Orçamento

```
Subtotal = Σ (quantidade × preço_unitário) para cada item

Desconto Dispositivo Usado = valor_estimado do UsedDevice (se houver)

Entrada à Vista = valor informado pelo vendedor

Saldo Restante = Subtotal - Desconto Dispositivo Usado - Entrada à Vista

Se parcelas > 1 e taxa_juros > 0:
    Valor Parcela = Saldo Restante × [taxa × (1+taxa)^n] / [(1+taxa)^n - 1]
Se parcelas > 1 e taxa_juros == 0 (sem juros):
    Valor Parcela = Saldo Restante / parcelas
Se parcelas == 1:
    Valor Parcela = Saldo Restante
```

#### Exemplo Visual (baseado na Figura 10 — Tela de Orçamento)

```
┌─────────────────────────────────────────────────────────┐
│ Simulador de Orçamento                                  │
│ Calcule parcelamentos e valores de entrada              │
├────────────────────────────┬────────────────────────────┤
│ Dados do Orçamento         │ Resultado                  │
│                            │                            │
│ Produto:                   │ Valor do Produto:          │
│ MacBook Pro 14" M3 Pro     │ R$ 19.999,00               │
│ — R$ 19.999,00             │                            │
│                            │ Dispositivo usado:         │
│ Valor Disp. Usado:         │ - R$ 3.999,00              │
│ R$ 3.999,00                │                            │
│                            │ Entrada à vista:           │
│ Entrada à Vista (R$):      │ - R$ 5.000,00              │
│ R$ 5.000,00                │                            │
│                            │ Saldo restante:            │
│ Parcelas:                  │ R$ 11.400,00               │
│ 10x sem juros              │                            │
│                            │ ┌────────────────────────┐ │
│ [📋 Calcular Orçamento]    │ │    10x de              │ │
│                            │ │    R$ 1.140,00         │ │
│                            │ └────────────────────────┘ │
└────────────────────────────┴────────────────────────────┘
```

#### Implementação do Cálculo (Backend)

```typescript
// quotations/quotations.service.ts

calculateQuotation(data: CalculateQuotationDto): QuotationResult {
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const usedDeviceDiscount = data.usedDeviceValue ?? 0;
  const downPayment = data.downPayment ?? 0;
  const remainingBalance = subtotal - usedDeviceDiscount - downPayment;

  if (remainingBalance < 0) {
    throw new BadRequestException(
      'O valor dos descontos excede o subtotal do orçamento.',
    );
  }

  let installmentValue: number;
  const installments = data.installments ?? 1;
  const interestRate = data.interestRate ?? 0;

  if (installments === 1) {
    installmentValue = remainingBalance;
  } else if (interestRate > 0) {
    // Price (tabela)
    const rate = interestRate;
    installmentValue =
      remainingBalance *
      ((rate * Math.pow(1 + rate, installments)) /
        (Math.pow(1 + rate, installments) - 1));
  } else {
    // Sem juros
    installmentValue = remainingBalance / installments;
  }

  return {
    subtotal,
    usedDeviceDiscount,
    downPayment,
    totalValue: subtotal,
    remainingBalance,
    installments,
    installmentValue: Math.round(installmentValue * 100) / 100,
    interestRate,
  };
}
```

---

### 6.6 Gestão de Negociações

**Referência:** Documento Visão 5.5  
**Prioridade:** Importante | **Release:** 1.0 | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
Visão completa de todas as negociações em andamento e concluídas, com rastreabilidade de cada etapa do processo comercial, desde o primeiro contato até o fechamento da venda.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| NEG-01 | Listar Negociações | Tabela com colunas: Cliente, Produto, Dispositivo Usado, Valor, Status, Vendedor, Data. |
| NEG-02 | Criar Negociação | Modal: vincular cliente, selecionar produto(s), informar dispositivo usado (opcional), valor total, vendedor responsável, status. |
| NEG-03 | Editar Negociação | Atualizar qualquer campo, especialmente status. |
| NEG-04 | Alterar Status | Em Andamento → Aguardando Avaliação → Orçamento Enviado → Concluída / Cancelada. |
| NEG-05 | Vincular Orçamento | Associar um orçamento emitido à negociação. |
| NEG-06 | Vincular Pedido | Associar um pedido emitido à negociação. |
| NEG-07 | Abrir Negociação | Caso de uso incluído em "Gerenciar Negociações" no diagrama. |

#### Fluxo de Status da Negociação

```
EM_ANDAMENTO → AGUARDANDO_AVALIACAO → ORCAMENTO_ENVIADO → CONCLUIDA
      │                                                        │
      └──────────────────── CANCELADA ◄─────────────────────────┘
```

#### Tela: Negociações (Figura 4 do Plano de Estágio)
- Tabela com colunas: Cliente, Produto, Dispositivo Usado, Valor (R$), Status (badge), Vendedor, Data.
- Campo de busca.
- Botão "+ Nova Negociação".
- Badges de status coloridos: Em Andamento (azul), Concluída (verde), Aguardando Avaliação (amarelo), Cancelada (vermelho).

---

### 6.7 Emissão de Pedidos e Notas

**Referência:** Documento Visão 5.7 | Pedido do Investidor Seção 4  
**Prioridade:** Importante | **Release:** 1.0 | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
Emissão de pedidos e notas vinculados às negociações comerciais, formalizando digitalmente as transações realizadas.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| PED-01 | Listar Pedidos | Tabela com: Nº Pedido (PED-001), Cliente, Itens, Valor, Status, Data. |
| PED-02 | Criar Pedido | Modal: cliente, produto(s), quantidade, valor total, método de pagamento, status, observações. |
| PED-03 | Editar Pedido | Atualização de status e informações. |
| PED-04 | Vincular à Negociação | Associar o pedido a uma negociação existente. |
| PED-05 | Alterar Status | Processando → Concluído / Aguardando Pagamento / Cancelado. |
| PED-06 | Código Sequencial | Geração automática: PED-001, PED-002, PED-003... |

#### Tela: Pedidos (Figura 11 do Plano de Estágio)
- Tabela com colunas: Nº Pedido (link), Cliente, Itens, Valor (R$), Status (badge), Data.
- Botão "+ Novo Pedido".
- Badges: Concluído (verde), Processando (azul), Aguardando Pagamento (amarelo), Cancelado (vermelho).

---

### 6.8 Painel Administrativo (Dashboard)

**Referência:** Documento Visão 5.6 | Plano de Estágio Seção 2.1.1  
**Prioridade:** Importante | **Release:** 2.0 (simplificado no 1.0) | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
Painel principal exibindo indicadores gerenciais sobre o desempenho comercial.

#### Indicadores (Cards do Dashboard — Figura 3)

| Indicador | Descrição | Cálculo |
|-----------|-----------|---------|
| **Vendas do Mês** | Valor total das negociações concluídas no mês | Soma de `totalValue` onde `status = CONCLUIDA` e `closedAt` no mês corrente |
| **Negociações Ativas** | Quantidade de negociações em andamento | Count onde `status IN (EM_ANDAMENTO, AGUARDANDO_AVALIACAO, ORCAMENTO_ENVIADO)` |
| **Novos Leads** | Quantidade de leads cadastrados no mês | Count de clientes com `status = LEAD` e `createdAt` no mês corrente |
| **Orçamentos Gerados** | Quantidade de orçamentos emitidos no mês | Count de orçamentos com `createdAt` no mês corrente |

#### Seções Adicionais

- **Negociações Recentes:** Lista das últimas 5 negociações com nome do cliente, produto, status e valor.
- **Leads Recentes:** Lista dos últimos 5 leads cadastrados com nome, e-mail e status de qualificação.
- **Comparativo com mês anterior:** Percentual de variação (ex: "+10% no mês anterior").

---

### 6.9 Gerenciamento de Usuários

**Referência:** Documento Visão 5.6 | Especificação Suplementar 4.4 | Caso de Uso "Gerenciar Usuários"  
**Prioridade:** Importante | **Release:** 1.0 (básico) / 2.0 (completo) | **Esforço:** Médio (2-3 semanas) | **Risco:** Baixo

#### Descrição
O Administrador pode criar, editar e desativar contas de usuários, definindo o perfil de acesso (role) de cada um.

#### Funcionalidades

| ID | Funcionalidade | Descrição |
|----|---------------|-----------|
| USR-01 | Listar Usuários | Tabela: Nome, E-mail, Perfil (badge), Status (badge). |
| USR-02 | Criar Usuário | Modal: nome completo, e-mail, senha, confirmar senha, perfil de acesso, status. |
| USR-03 | Editar Usuário | Alterar nome, e-mail, perfil, status. |
| USR-04 | Desativar Usuário | Alteração de status para Inativo (não excluir). |
| USR-05 | Atribuir Perfil | Caso de uso incluído: definir role do usuário. |
| USR-06 | Resetar Senha | (Opcional) Admin pode gerar nova senha temporária. |

#### Tela: Administração (Figura 13 do Plano de Estágio)
- Tabela: Nome, E-mail, Perfil (badge colorido por role), Status.
- Botão "+ Novo Usuário".
- Badges: Administrador (roxo), Vendedor (azul), Atendente (verde), Técnico (laranja).

---

## 7. Casos de Uso Detalhados

Baseado no diagrama de caso de uso (Figura 1 do Plano de Estágio):

### 7.1 Atores

| Ator | Descrição |
|------|-----------|
| **Vendedor/Atendente** | Funcionário que realiza negociações comerciais, emite orçamentos e gerencia clientes. |
| **Técnico** | Funcionário que avalia dispositivos usados e estima valores. |
| **Admin** | Usuário com privilégios máximos: gerencia usuários, produtos e todas as funcionalidades. |

### 7.2 Tabela de Casos de Uso

| ID | Caso de Uso | Atores | Tipo | Inclui/Estende |
|----|------------|--------|------|----------------|
| UC-01 | Fazer Login | Todos | Principal | — |
| UC-02 | Gerenciar Pedido | Vendedor, Admin | CRUD | — |
| UC-03 | Gerenciar Clientes | Vendedor, Admin | CRUD | — |
| UC-04 | Gerenciar Orçamento | Vendedor, Admin | CRUD | `<<include>>` Calcular Parcelamento |
| UC-05 | Calcular Parcelamento | Sistema | Incluído | — |
| UC-06 | Gerenciar Negociações | Vendedor, Admin | CRUD | `<<include>>` Abrir Negociação |
| UC-07 | Abrir Negociação | Sistema | Incluído | `<<extend>>` Registrar Dispositivo Usado como Entrada |
| UC-08 | Registrar Dispositivo Usado como Entrada | Vendedor | Extensão | — |
| UC-09 | Visualizar Dashboard | Vendedor, Admin | Consulta | — |
| UC-10 | Gerenciar Produtos | Admin | CRUD | `<<include>>` Consultar Estoque |
| UC-11 | Consultar Estoque | Admin, Vendedor | Consulta | — |
| UC-12 | Gerenciar Usuários | Admin | CRUD | `<<include>>` Atribuir Perfil de Acesso |
| UC-13 | Atribuir Perfil de Acesso | Admin | Incluído | — |
| UC-14 | Gerenciar Dispositivo Usado | Técnico, Admin | CRUD | `<<include>>` Estimar Valor de Dispositivo Usado |
| UC-15 | Estimar Valor de Dispositivo Usado | Técnico | Incluído | — |

---

## 8. Regras de Negócio

| ID | Regra | Módulo | Origem |
|----|-------|--------|--------|
| RN-01 | Cada usuário deve ter login individual com credenciais únicas. | Auth | Pedido do Investidor, Seção 9 |
| RN-02 | Senhas devem ser armazenadas com hashing bcrypt, nunca em texto puro. | Auth | Especificação Suplementar 4.3 |
| RN-03 | Somente o Admin pode criar, editar e desativar contas de usuários. | Usuários | Especificação Suplementar 4.4 |
| RN-04 | Vendedores/Atendentes podem criar e gerenciar negociações, clientes e orçamentos. | Vários | Documento Visão 3.6.1 |
| RN-05 | Técnicos podem apenas avaliar dispositivos usados e registrar laudos. | Dispositivos Usados | Documento Visão 3.6.2 |
| RN-06 | O orçamento deve calcular automaticamente o valor das parcelas com base no saldo restante. | Orçamentos | Documento Visão 5.4 |
| RN-07 | O valor do dispositivo usado avaliado deve ser abatido automaticamente no orçamento. | Orçamentos | Documento Visão 5.4, 3.7 |
| RN-08 | O estoque de um produto deve ser decrementado ao concluir um pedido. | Produtos/Pedidos | Lógica de negócio |
| RN-09 | Negociações devem ter rastreabilidade completa de todas as etapas. | Negociações | Documento Visão 5.5 |
| RN-10 | Pedidos devem ter código sequencial único (PED-001, PED-002, ...). | Pedidos | Documento Visão 5.7 |
| RN-11 | Orçamentos devem ter código sequencial único (ORC-001, ORC-002, ...). | Orçamentos | Lógica de negócio |
| RN-12 | Leads devem ser qualificados com nível: Não Qualificado, Qualificado, Alta Intenção. | Clientes | Pedido do Investidor, Seção 6 |
| RN-13 | O sistema não pode apresentar falhas em orçamentos (criticidade para o negócio). | Geral | Pedido do Investidor, Seção 9 |
| RN-14 | Dados de clientes, valores e credenciais são confidenciais e não podem ser vazados. | Geral | Especificação Suplementar 4.2 |
| RN-15 | Backup periódico e transações atômicas para prevenção contra perda de dados. | Banco de Dados | Especificação Suplementar 4.2 |

---

## 9. Requisitos Não-Funcionais (FURPS+)

Baseado na Especificação Suplementar (modelo FURPS+):

### 9.1 Funcionalidade (F)
- Todos os requisitos funcionais são capturados nos casos de uso e descritos na Seção 6 deste guia.

### 9.2 Utilidade / Usabilidade (U)

| Requisito | Descrição | Referência |
|-----------|-----------|------------|
| U-01 | O sistema requer conexão com a internet para uso. | Esp. Suplementar 3.1 |
| U-02 | Interface fácil e intuitiva, com baixa curva de aprendizado. | Esp. Suplementar 3.2 |
| U-03 | Design moderno, responsivo e fluído usando React.js + TypeScript. | Esp. Suplementar 3.2 |
| U-04 | Suporte ao usuário via contato direto com desenvolvedor ou admin. | Esp. Suplementar 3.3 |
| U-05 | Manual de instruções disponível para consulta. | Documento Visão 10.1 |

### 9.3 Confiabilidade (R)

| Requisito | Descrição | Referência |
|-----------|-----------|------------|
| R-01 | Sistema disponível 24/7, exceto manutenções programadas. | Esp. Suplementar 4.1 |
| R-02 | Não pode apresentar falhas em orçamentos (dado crítico). | Esp. Suplementar 4.1 |
| R-03 | Dados protegidos com backup periódico e transações atômicas. | Esp. Suplementar 4.2 |
| R-04 | Autenticação via JWT com senhas em bcrypt. | Esp. Suplementar 4.3 |
| R-05 | Controle de privilégios por roles e Guards. | Esp. Suplementar 4.4 |

### 9.4 Desempenho (P)

| Requisito | Descrição | Referência |
|-----------|-----------|------------|
| P-01 | Tempo de resposta < 5 segundos para operações comuns (consultas, listagens, cadastros). | Esp. Suplementar 5.1 |
| P-02 | Tempo de resposta < 10 segundos para cálculos complexos de orçamentos. | Esp. Suplementar 5.1 |
| P-03 | Requisições > 30 segundos caracterizam falha de conexão. | Esp. Suplementar 5.1 |
| P-04 | Suporte ao uso simultâneo pela equipe sem degradação perceptível. | Documento Visão 9.3 |

### 9.5 Suportabilidade (S)

| Requisito | Descrição | Referência |
|-----------|-----------|------------|
| S-01 | Compatível com Chrome, Firefox, Safari e similares (navegadores atualizados). | Esp. Suplementar 6.1 |
| S-02 | TypeScript em toda a stack para tipagem estática. | Esp. Suplementar 6.2 |
| S-03 | NestJS com arquitetura modular e princípios SOLID. | Esp. Suplementar 6.2 |
| S-04 | PostgreSQL + Prisma ORM com migrations versionadas. | Esp. Suplementar 6.2 |
| S-05 | Servidor local inicialmente, cloud em fase avançada. | Esp. Suplementar 6.3 |
| S-06 | Controle de versão com Git e GitHub. | Plano de Estágio 4.7 |
| S-07 | Todas as tecnologias são open source. | Esp. Suplementar 9 (Componentes) |

### 9.6 Restrições de Design

| Restrição | Descrição | Referência |
|-----------|-----------|------------|
| RD-01 | Plataforma Web acessada via navegador. | Esp. Suplementar 7.1 |
| RD-02 | Separação frontend (React.js) e backend (NestJS) via API REST. | Esp. Suplementar 7.1 |
| RD-03 | Arquitetura modular no backend. | Esp. Suplementar 7.1 |
| RD-04 | Princípios SOLID. | Esp. Suplementar 7.1 |
| RD-05 | Interface prioriza simplicidade e intuição. | Esp. Suplementar 7.1 |
| RD-06 | Comunicação HTTPS com JSON. | Esp. Suplementar 10.4 |
| RD-07 | Autenticação JWT no cabeçalho Authorization. | Esp. Suplementar 10.4 |

---

## 10. API REST — Endpoints por Módulo

### 10.1 Autenticação

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| POST | `/api/auth/login` | Login (retorna JWT) | Público |
| POST | `/api/auth/refresh` | Renovar token | Autenticado |
| GET | `/api/auth/me` | Dados do usuário logado | Autenticado |

### 10.2 Usuários

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/users` | Listar todos | Admin |
| GET | `/api/users/:id` | Buscar por ID | Admin |
| POST | `/api/users` | Criar usuário | Admin |
| PATCH | `/api/users/:id` | Editar usuário | Admin |
| PATCH | `/api/users/:id/status` | Ativar/Desativar | Admin |

### 10.3 Clientes e Leads

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/clients` | Listar (com paginação, busca, filtros) | Vendedor, Atendente, Admin |
| GET | `/api/clients/:id` | Buscar por ID | Vendedor, Atendente, Admin |
| POST | `/api/clients` | Criar cliente/lead | Vendedor, Atendente, Admin |
| PATCH | `/api/clients/:id` | Editar | Vendedor, Atendente, Admin |
| DELETE | `/api/clients/:id` | Excluir | Admin |

### 10.4 Produtos e Serviços

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/products` | Listar (com paginação, busca, filtros) | Todos autenticados |
| GET | `/api/products/:id` | Buscar por ID | Todos autenticados |
| POST | `/api/products` | Criar produto | Admin |
| PATCH | `/api/products/:id` | Editar produto | Admin |
| DELETE | `/api/products/:id` | Excluir produto | Admin |

### 10.5 Dispositivos Usados

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/used-devices` | Listar | Técnico, Admin |
| GET | `/api/used-devices/:id` | Buscar por ID | Técnico, Admin |
| POST | `/api/used-devices` | Registrar dispositivo | Técnico, Admin |
| PATCH | `/api/used-devices/:id` | Editar avaliação | Técnico, Admin |

### 10.6 Orçamentos

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/quotations` | Listar | Vendedor, Atendente, Admin |
| GET | `/api/quotations/:id` | Buscar por ID | Vendedor, Atendente, Admin |
| POST | `/api/quotations` | Criar orçamento | Vendedor, Atendente, Admin |
| PATCH | `/api/quotations/:id` | Editar | Vendedor, Atendente, Admin |
| POST | `/api/quotations/calculate` | Simular cálculo (sem salvar) | Vendedor, Atendente, Admin |

### 10.7 Negociações

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/negotiations` | Listar | Vendedor, Atendente, Admin |
| GET | `/api/negotiations/:id` | Buscar por ID | Vendedor, Atendente, Admin |
| POST | `/api/negotiations` | Criar | Vendedor, Atendente, Admin |
| PATCH | `/api/negotiations/:id` | Editar | Vendedor, Atendente, Admin |
| PATCH | `/api/negotiations/:id/status` | Alterar status | Vendedor, Atendente, Admin |

### 10.8 Pedidos

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/orders` | Listar | Vendedor, Atendente, Admin |
| GET | `/api/orders/:id` | Buscar por ID | Vendedor, Atendente, Admin |
| POST | `/api/orders` | Criar pedido | Vendedor, Atendente, Admin |
| PATCH | `/api/orders/:id` | Editar | Vendedor, Atendente, Admin |
| PATCH | `/api/orders/:id/status` | Alterar status | Vendedor, Atendente, Admin |

### 10.9 Dashboard

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/dashboard/summary` | KPIs do mês | Vendedor, Atendente, Admin |
| GET | `/api/dashboard/recent-negotiations` | Últimas 5 negociações | Vendedor, Atendente, Admin |
| GET | `/api/dashboard/recent-leads` | Últimos 5 leads | Vendedor, Atendente, Admin |

---

## 11. Telas e Interface do Usuário

Todas as telas seguem o design prototipado no Plano de Estágio, com as seguintes diretrizes:

### 11.1 Princípios de Design

- **Interface intuitiva** com baixa curva de aprendizado (conforme solicitação do stakeholder).
- **Visual moderno e fluído** usando React.js com TypeScript.
- **Responsividade** para acesso via computador, notebook e dispositivos móveis.
- **Identidade visual** da MMT Urbana: logotipo e cores corporativas.
- **Direitos autorais** no rodapé da aplicação.

### 11.2 Layout Geral

```
┌─────────────────────────────────────────────────────────────────┐
│  MMT URBANA [CRM]  | Dashboard | Negociações | Clientes |      │
│                     | Produtos  | Orçamento   | Pedidos  |      │
│                     | Admin     |             | 👤 Nome  |      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Título da Página]                        [+ Novo Registro]    │
│  Subtítulo descritivo                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔍 Buscar...                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Coluna 1 │ Coluna 2 │ Coluna 3 │ Coluna 4 │ Coluna 5 │      │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤      │
│  │ Dado     │ Dado     │ Dado     │ [Badge]  │ Data     │      │
│  │ Dado     │ Dado     │ Dado     │ [Badge]  │ Data     │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
│                                                                 │
│  ©MMT Urbana Serviços Digitais LTDA, 2026                      │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 Mapa de Telas

| Rota | Tela | Figura Ref. | Acesso |
|------|------|-------------|--------|
| `/login` | Tela de Login | Figura 2 | Público |
| `/dashboard` | Dashboard | Figura 3 | Vendedor, Atendente, Admin |
| `/negotiations` | Negociações | Figura 4 | Vendedor, Atendente, Admin |
| `/clients` | Clientes & Leads | Figura 6 | Vendedor, Atendente, Admin |
| `/products` | Produtos & Serviços | Figura 8 | Todos (CRUD: Admin) |
| `/quotation` | Simulador de Orçamento | Figura 10 | Vendedor, Atendente, Admin |
| `/orders` | Pedidos | Figura 11 | Vendedor, Atendente, Admin |
| `/admin` | Administração | Figura 13 | Admin |

---

## 12. Segurança

### 12.1 Autenticação

- **JWT (JSON Web Token)** no cabeçalho `Authorization: Bearer <token>`.
- Tokens com expiração configurável (ex: 8 horas).
- Senhas armazenadas com **bcrypt** (salt rounds: 10+).
- Comunicação via **HTTPS** obrigatório em produção.

### 12.2 Controle de Acesso

- **Guards** no NestJS verificam roles antes de executar qualquer endpoint.
- Decorator `@Roles(Role.ADMIN)` para restringir acesso.
- Usuários inativos (`status = INATIVO`) não conseguem se autenticar.

### 12.3 Validação de Dados

- **Pipes** de validação usando `class-validator` em todos os DTOs.
- Sanitização de inputs para prevenção de SQL Injection (Prisma já protege via prepared statements).
- Proteção contra XSS no frontend.

### 12.4 Integridade dos Dados

- Transações atômicas no PostgreSQL para operações críticas (ex: criar pedido + decrementar estoque).
- Backup periódico do banco de dados.
- Logs de auditoria para operações sensíveis (opcional, recomendado).

### 12.5 Variáveis de Ambiente

```env
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/mmt_urbana_crm"
JWT_SECRET="sua-chave-secreta-forte-aqui"
JWT_EXPIRATION="8h"
BCRYPT_SALT_ROUNDS=10
PORT=3000
NODE_ENV="development"
```

---

## 13. Desempenho e Qualidade

### 13.1 Metas de Performance

| Operação | Tempo Máximo | Classificação |
|----------|:------------:|---------------|
| Consultas, listagens, cadastros | < 5 segundos | Operação comum |
| Cálculos de orçamentos complexos | < 10 segundos | Operação complexa |
| Timeout de falha de conexão | > 30 segundos | Falha |

### 13.2 Boas Práticas

- Paginação em todas as listagens (evitar carregar todos os registros).
- Índices no PostgreSQL para campos de busca frequente (email, name, status).
- Lazy loading de componentes no frontend.
- Cache de consultas estáticas quando aplicável.
- Query optimization no Prisma (uso de `select` e `include` específicos).

### 13.3 Testes

- **Testes unitários** nos services do backend (especialmente cálculo de orçamentos).
- **Testes e2e** nos endpoints da API.
- **Testes de integração** com o banco de dados.

---

## 14. Workflow AS-IS vs TO-BE

### 14.1 Workflow AS-IS (Processo Atual)

Conforme documentado no BPMN (Figura 15 do Plano de Estágio), os problemas do processo atual são:

1. Atendimento manual com demora nos canais WhatsApp e Instagram.
2. Qualificação informal de leads sem critérios definidos.
3. Avaliação técnica de dispositivos usados sem registro formal.
4. Consulta de produtos em planilhas separadas (Google Sheets).
5. Cálculos manuais de orçamento com parcelamento e entrada à vista.
6. Conclusão da venda sem formalização de pedido ou nota.
7. Ausência de histórico registrado das negociações.
8. Processo fragmentado entre 3 plataformas: WhatsApp/Instagram, Google Sheets e SaaS de terceiros.

### 14.2 Workflow TO-BE (Processo com o MMT URBANA CRM)

Após a implantação do sistema, o fluxo esperado será:

1. **Recebimento do contato** → Cliente entra via WhatsApp/Instagram.
2. **Cadastro no CRM** → Vendedor registra o lead no sistema com canal de origem.
3. **Qualificação** → Sistema permite classificar o lead (Não Qualificado → Qualificado → Alta Intenção).
4. **Abertura de Negociação** → Vendedor cria negociação vinculando cliente e produto(s).
5. **Avaliação Técnica** → Se houver dispositivo usado, o Técnico avalia e registra laudo no sistema.
6. **Orçamento Automático** → Vendedor emite orçamento com cálculo automático de parcelamento, entrada à vista e abatimento do dispositivo usado.
7. **Envio ao Cliente** → Orçamento enviado e status atualizado.
8. **Fechamento** → Se aprovado, vendedor emite pedido vinculado à negociação.
9. **Registro Completo** → Todo o histórico fica registrado no sistema com rastreabilidade.

---

## 15. Plano de Releases

Baseado nos Atributos de Recursos do Documento Visão (Seção A.6):

### Release 1.0 — MVP (Escopo do TCC)

| Recurso | Benefício | Esforço | Risco | Status |
|---------|-----------|---------|-------|--------|
| Autenticação e Controle de Acesso | Crítico | Médio (2-3 sem.) | Baixo | Aprovado |
| Gestão de Clientes e Leads | Crítico | Médio (2-3 sem.) | Baixo | Aprovado |
| Cadastro de Produtos e Serviços | Crítico | Baixo (1-2 sem.) | Baixo | Aprovado |
| Emissão de Orçamentos Automatizados | Crítico | Alto (3-4 sem.) | Médio | Aprovado |
| Gestão de Negociações | Importante | Médio (2-3 sem.) | Baixo | Aprovado |
| Emissão de Pedidos e Notas | Importante | Médio (2-3 sem.) | Baixo | Aprovado |
| Gestão de Dispositivos Usados | Importante | Médio (2-3 sem.) | Baixo | Aprovado |
| Gerenciamento de Usuários (básico) | Importante | Médio (2-3 sem.) | Baixo | Aprovado |
| Dashboard (simplificado) | Importante | Baixo (1-2 sem.) | Baixo | Aprovado |

### Release 2.0 — Melhorias

| Recurso | Benefício | Status |
|---------|-----------|--------|
| Painel Administrativo Completo (relatórios gerenciais avançados) | Importante | Proposto |
| Dashboard com gráficos e comparativos | Importante | Proposto |
| Exportação de orçamentos em PDF | Útil | Proposto |
| Notificações internas | Útil | Proposto |

### Release 3.0 — Visão Futura

| Recurso | Benefício | Status |
|---------|-----------|--------|
| Integração com IA para atendimento no WhatsApp/Instagram | Útil | Proposto |
| IA para cálculos automatizados de orçamentos | Útil | Proposto |
| Migração para Cloud | Importante | Proposto |

---

## 16. Cronograma de Desenvolvimento

Baseado no cronograma do Plano de Estágio (Figura 16):

### Fase 1 — Elaboração e Início do Projeto (Fev-Mar/2026)
- ✅ Cronograma
- ✅ Documento de Início
- ✅ Pedido dos Investidores
- ✅ Protótipos (Telas)
- ✅ Diagrama de Caso de Uso

### Fase 2 — Definição e Planos do Projeto (Mar-Abr/2026)
- ✅ Workflow (As-Is) BPMN
- ✅ Glossário
- ✅ Especificação Suplementar
- ✅ Plano de Estágio Completo
- 🔄 Documento Visão (v2.0 validado)

### Fase 3 — Lançamento e Execução do Projeto (Abr-Out/2026)
- Desenvolvimento dos módulos do Release 1.0
- Ordem de desenvolvimento recomendada:
  1. Setup do projeto (backend + frontend + banco)
  2. Autenticação e Controle de Acesso
  3. Cadastro de Produtos e Serviços
  4. Gestão de Clientes e Leads
  5. Gestão de Dispositivos Usados
  6. Emissão de Orçamentos Automatizados
  7. Gestão de Negociações
  8. Emissão de Pedidos e Notas
  9. Dashboard
  10. Gerenciamento de Usuários

### Fase 4 — Controle e Desempenho (Contínuo)
- Testes e validação com stakeholder
- Ajustes de usabilidade
- Otimização de performance

### Fase 5 — Fechamento do Projeto (Nov-Dez/2026)
- Documentação final
- Manual do usuário
- Apresentação do TCC
- Entrega do sistema

---

## 17. Glossário

| Termo | Definição |
|-------|-----------|
| **CRM** | Customer Relationship Management — Sistema de gestão de relacionamento com o cliente. |
| **SaaS** | Software as a Service — Modelo de distribuição de software via web. |
| **Lead** | Potencial cliente que demonstrou interesse no produto ou serviço. |
| **Trade-in** | Prática de entregar um dispositivo usado como parte do pagamento de um novo. |
| **JWT** | JSON Web Token — Padrão de autenticação stateless. |
| **bcrypt** | Algoritmo de hashing para armazenamento seguro de senhas. |
| **ORM** | Object-Relational Mapping — Ferramenta que mapeia objetos para tabelas do banco. |
| **Guard** | Recurso do NestJS que protege rotas com base em condições (autenticação, roles). |
| **Pipe** | Recurso do NestJS para validação e transformação de dados de entrada. |
| **Interceptor** | Recurso do NestJS para tratamento de respostas e erros. |
| **DTO** | Data Transfer Object — Objeto que define a estrutura de dados transferidos entre camadas. |
| **SOLID** | Princípios de design orientado a objetos (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion). |
| **RUP** | Rational Unified Process — Metodologia de desenvolvimento de software iterativa e incremental. |
| **BPMN** | Business Process Model and Notation — Notação padrão para modelagem de processos de negócio. |
| **UML** | Unified Modeling Language — Linguagem padrão para modelagem de sistemas. |
| **API REST** | Interface de programação baseada em recursos HTTP (GET, POST, PATCH, DELETE). |
| **Stakeholder** | Parte interessada no projeto (no caso, o proprietário Thiago Martins Ferreira). |
| **Release** | Versão entregável do software com conjunto de funcionalidades definido. |

---

## Observações Finais

Este guia foi elaborado com base nos seguintes documentos RUP do projeto:

1. **Documento Visão** (v2.0) — MMTUrbana_InfVision
2. **Pedido do Investidor** (v2.0) — MMTUrbana_stkreq
3. **Especificação Suplementar** (v1.0) — MMTUrbana_sspc
4. **Plano de Estágio** — MMTUrbana_PlanoEstágio

Todos os requisitos, regras de negócio e restrições foram extraídos e consolidados a partir destes documentos, garantindo rastreabilidade completa entre os artefatos RUP e este guia de desenvolvimento.

---

> **©MMT Urbana Serviços Digitais LTDA, 2026**  
> Documento confidencial — Uso interno do projeto.
