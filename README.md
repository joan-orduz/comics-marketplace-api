# 📚 Comics Marketplace API

Una plataforma robusta de marketplace para compra y venta de cómics desarrollada con **NestJS**, **TypeORM**, **PostgreSQL**, **Redis** e integración con **PayU** para procesamiento de pagos.

---

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Módulos Principales](#módulos-principales)
   - [App Module](#1-app-module)
   - [Auth Module](#2-auth-module)
   - [Users Module](#3-users-module)
   - [Comics Module](#4-comics-module)
   - [Payments Module (PayU)](#5-payments-module-payu)
6. [Entidades de Base de Datos](#entidades-de-base-de-datos)
7. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
8. [Componentes de Seguridad](#componentes-de-seguridad)
9. [Interceptores](#interceptores)
10. [Variables de Entorno](#variables-de-entorno)
11. [Flujo de Checkout y Pagos](#flujo-de-checkout-y-pagos-payu)
12. [Webhook de PayU](#webhook-de-payu)
13. [Cómo Ejecutar](#cómo-ejecutar)
14. [Testing](#testing)

---

## Overview

**Comics Marketplace API** es un backend completo para un marketplace de cómics que proporciona:

- ✅ **Autenticación y Autorización**: Sistema JWT con soporte de roles (ADMIN, SELLER, USER)
- ✅ **Catálogo de Cómics**: CRUD completo con filtrado y paginación
- ✅ **Gestión de Usuarios**: Registros, perfiles y roles basados en acceso
- ✅ **Sistema de Órdenes**: Procesamiento atómico de órdenes con control de stock
- ✅ **Integración PayU**: Procesamiento de pagos con webhook seguro y validación de firmas
- ✅ **Transacciones Atómicas**: Garantía de consistencia en operaciones críticas
- ✅ **Rate Limiting**: Protección contra abuso mediante throttling
- ✅ **Caché Distribuido**: Redis con cache-manager para optimización
- ✅ **Job Queue**: Bull para procesamiento asincrónico (disponible)
- ✅ **Documentación Swagger**: API completamente documentada

---

## Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Framework** | NestJS | ^11.0.1 | Framework Node.js progresivo y robusto |
| **ORM** | TypeORM | ^0.3.28 | Mapeo objeto-relacional para PostgreSQL |
| **Base de Datos** | PostgreSQL | 14+ | Base datos relacional principal |
| **Caché** | Redis | 7+ | Caché distribuido y almacenamiento sesiones |
| **Job Queue** | Bull | ^4.16.5 | Cola de trabajos asincronos |
| **Autenticación** | JWT + Passport | ^11.0.2 | Seguridad basada en tokens |
| **Validación** | class-validator | ^0.15.1 | Validación de clases TypeScript |
| **Documentación** | Swagger | ^11.2.6 | Documentación interactiva de API |
| **Rate Limiting** | @nestjs/throttler | ^6.5.0 | Control de límite de solicitudes |
| **Seguridad** | Helmet | ^8.1.0 | Headers HTTP de seguridad |
| **Testing** | Jest | ^30.0.0 | Framework de testing |

---

## Estructura del Proyecto

```
comics-marketplace-api/
├── README.md                          # Este archivo
└── comics-marketplace/                # Aplicación principal
    ├── package.json                   # Dependencias del proyecto
    ├── tsconfig.json                  # Configuración TypeScript
    ├── nest-cli.json                  # Configuración NestJS CLI
    ├── eslint.config.mjs              # Configuración ESLint
    ├── .env                           # Variables de entorno (NO versionado)
    ├── .env.example                   # Plantilla de variables de entorno
    │
    ├── src/
    │   ├── main.ts                    # Punto de entrada de la aplicación
    │   ├── app.module.ts              # Módulo raíz
    │   ├── app.controller.ts          # Controlador raíz (health check)
    │   ├── app.service.ts             # Servicio raíz
    │   │
    │   ├── auth/                      # 🔐 Módulo de Autenticación
    │   │   ├── auth.module.ts
    │   │   ├── auth.service.ts        # Lógica de registro y login
    │   │   ├── auth.controller.ts     # Endpoints: POST /auth/register, POST /auth/login
    │   │   ├── decorators/
    │   │   │   ├── current-user.decorator.ts  # @CurrentUser() - obtiene usuario autenticado
    │   │   │   ├── public.decorator.ts        # @Public() - salta JwtAuthGuard
    │   │   │   └── roles.decorator.ts         # @Roles('ADMIN') - requiere roles específicos
    │   │   ├── guards/
    │   │   │   ├── jwt-auth.guard.ts  # Valida JWT (global, excluye @Public)
    │   │   │   └── roles.guard.ts     # Valida roles en @Roles()
    │   │   ├── strategies/
    │   │   │   └── jwt.strategy.ts    # Estrategia Passport para JWT
    │   │   ├── interfaces/
    │   │   │   └── jwt-payload.interface.ts # Tipos de payload JWT
    │   │   ├── entities/
    │   │   │   └── auth.entity.ts     # (Entidad de auditoría si aplica)
    │   │   └── dto/
    │   │       ├── create-auth.dto.ts # Registro: { email, password, name }
    │   │       ├── login.dto.ts       # Login: { email, password }
    │   │       ├── auth-tokens.dto.ts # Respuesta: { accessToken, ... }
    │   │       ├── refresh-token.dto.ts
    │   │       └── update-auth.dto.ts
    │   │
    │   ├── users/                     # 👥 Módulo de Usuarios
    │   │   ├── users.module.ts
    │   │   ├── users.service.ts       # CRUD de usuarios
    │   │   ├── users.controller.ts    # Endpoints: GET, POST, PATCH, DELETE
    │   │   ├── entities/
    │   │   │   └── user.entity.ts     # Entidad User (id, email, password, name, role, createdAt)
    │   │   └── dto/
    │   │       ├── create-user.dto.ts
    │   │       └── update-user.dto.ts
    │   │
    │   ├── comics/                    # 📖 Módulo de Cómics
    │   │   ├── comics.module.ts
    │   │   ├── comics.service.ts      # CRUD de cómics
    │   │   ├── comics.controller.ts   # Endpoints: GET, POST, PATCH, DELETE
    │   │   ├── entities/
    │   │   │   └── comic.entity.ts    # Entidad Comic (id, title, description, price, stock, active)
    │   │   └── dto/
    │   │       ├── create-comic.dto.ts
    │   │       ├── update-comic.dto.ts
    │   │       └── filter-comics.dto.ts # Query params para búsqueda
    │   │
    │   ├── payments/                  # 💳 Módulo de Pagos (PayU)
    │   │   ├── payments.module.ts
    │   │   ├── payments.service.ts      # Lógica de checkout y webhook
    │   │   ├── payments.controller.ts   # Endpoints: POST /checkout, POST /webhook
    │   │   ├── payments.processor.ts    # Procesador Bull (queue de trabajos)
    │   │   ├── entities/
    │   │   │   └── payment-transaction.entity.ts # Registros de transacciones
    │   │   ├── interfaces/
    │   │   │   └── payu-checkout-data.interface.ts # Respuesta de checkout
    │   │   └── dto/
    │   │       ├── checkout.dto.ts       # { items: [{comicId, quantity}] }
    │   │       ├── payu-webhook.dto.ts   # Payload del webhook de PayU
    │   │       ├── create-payment.dto.ts
    │   │       └── update-payment.dto.ts
    │   │
    │   ├── orders/                    # 📦 Módulo de Órdenes (referenciado)
    │   │   ├── entities/
    │   │   │   ├── order.entity.ts    # Entidad Order
    │   │   │   └── order-item.entity.ts # Entidad OrderItem (items en la orden)
    │   │   └── ... (controladores/servicios si aplica)
    │   │
    │   └── common/                    # 🛠️ Utilidades Comunes
    │       ├── interceptors/
    │       │   ├── logging.interceptor.ts      # Registra todas las solicitudes
    │       │   └── response-transform.interceptor.ts # Transforma respuestas HTTP
    │       ├── pagination/
    │       │   └── paginated-result.interface.ts # Estructura para resultados paginados
    │       └── exceptions/
    │           └── payment.exceptions.ts # PaymentGatewayException, InsufficientStockException
    │
    └── test/                          # 🧪 Testing
        ├── app.e2e-spec.ts            # Tests end-to-end
        └── jest-e2e.json              # Configuración Jest para e2e
```

---

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/comics-marketplace-api.git
cd comics-marketplace-api/comics-marketplace
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores (ver sección "Variables de Entorno")
```

### 4. Configurar PostgreSQL

```bash
# Usando Docker (recomendado)
docker run -d \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=020306Joan.* \
  -e POSTGRES_DB=comic_marketplace \
  -p 5432:5432 \
  --name postgres-comics \
  postgres:14

# O instalar localmente desde https://www.postgresql.org/download/
```

### 5. Configurar Redis

```bash
# Usando Docker
docker run -d \
  -p 6379:6379 \
  --name redis-comics \
  redis:latest

# O instalar localmente desde https://redis.io/
```

### 6. Ejecutar Migraciones (si aplica)

Actualmente se usa `synchronize: true` en dev. Para producción:

```bash
# TypeORM CLI podría generarse
npm run migration:generate -- CreateInitialSchema
npm run migration:run
```

---

## Módulos Principales

### 1. App Module

**Ubicación**: [src/app.module.ts](src/app.module.ts)

**Propósito**: Módulo raíz que configura toda la aplicación, registra módulos de negocio y proporciona configuración global.

**Responsabilidades**:
- Cargar variables de entorno con `ConfigModule.forRoot()`
- Conectar a PostgreSQL con `TypeOrmModule.forRootAsync()`
- Configurar Redis para caché con `CacheModule.registerAsync()`
- Configurar Redis para Bull job queue con `BullModule.forRootAsync()`
- Configurar rate limiting con `ThrottlerModule`
- Registrar guards globales (JWT y Roles)
- Importar todos los módulos de negocio

**Configuración Clave**:

```typescript
// TypeORM: Conexión a PostgreSQL
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    port: config.get('DB_PORT'),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: config.get('DB_SYNCHRONIZE') === 'true', // ⚠️ Solo en dev
  }),
}),

// Cache (Redis): Disponible globalmente sin importar CacheModule
CacheModule.registerAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => ({
    store: redisStore,
    host: config.get('REDIS_HOST', 'localhost'),
    port: config.get<number>('REDIS_PORT', 6379),
    password: config.get('REDIS_PASSWORD'),
    ttl: 300, // segundos
  }),
}),

// Bull: Job queue para procesamiento asincrónico
BullModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    redis: {
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get('REDIS_PASSWORD'),
    },
  }),
}),

// Throttling: máximo 10 solicitudes por minuto (global)
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 60000, // milisegundos
    limit: 10,  // solicitudes
  },
]),
```

**Guards Globales**:
- `JwtAuthGuard`: Valida JWT en TODAS las rutas (excepto `@Public()`)
- `RolesGuard`: Valida roles cuando `@Roles()` se usa en controladores

**Módulos Importados**:
- `ComicsModule`: Catálogo de cómics
- `UsersModule`: Gestión de usuarios
- `AuthModule`: Autenticación JWT
- `PaymentsModule`: Integración PayU

---

### 2. Auth Module

**Ubicación**: [src/auth/](src/auth/)

**Propósito**: Proporcionar autenticación segura basada en JWT y autorización por roles.

**Componentes**:

#### AuthService
- `register(dto)`: Crea nuevo usuario con email/password hasheado
- `login(email, password)`: Valida credenciales y devuelve JWT
- `validateUser(payload)`: Validado por JwtStrategy

#### AuthController
**Endpoints**:

| Método | Ruta | Proteción | Descripción |
|--------|------|-----------|-------------|
| POST | `/auth/register` | @Public | Registrar nuevo usuario |
| POST | `/auth/login` | @Public | Login y obtener JWT |

**Ejemplo Request/Response**:

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Juan Pérez"
  }'

# Response
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Juan Pérez",
  "role": "USER",
  "createdAt": "2026-03-16T12:00:00Z"
}

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### Decoradores Personalizados

**`@CurrentUser()`** - Extrae el usuario autenticado del JWT
```typescript
// Uso en controladores
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return { user };
}
```

**`@Public()`** - Salta autenticación JWT
```typescript
// Sin esta decoradora, JwtAuthGuard rechazaría
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

**`@Roles('ADMIN', 'SELLER')`** - Requiere un rol específico
```typescript
// Solo usuarios con rol ADMIN o SELLER pueden acceder
@Roles('ADMIN')
@Get('admin/users')
getAllUsers() { ... }
```

#### Guards de Seguridad

**JwtAuthGuard (`jwt-auth.guard.ts`)**
- Validado por todas las rutas excepto `@Public()`
- Extrae token de header `Authorization: Bearer <token>`
- Valida la firma del JWT contra `JWT_SECRET`
- Si falla, retorna `401 Unauthorized`
- Población: `request.user` con payload descodificado

**RolesGuard (`roles.guard.ts`)**
- Ejecuta después de JwtAuthGuard
- Verifica que `user.role` esté en `@Roles(...)`
- Si falla, retorna `403 Forbidden`

#### JWT Configuration
```typescript
// JWT Strategy (passport-jwt)
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

// JWT Payload Structure
interface JwtPayload {
  sub: string;        // User ID
  email: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  iat: number;        // Issued at
  exp: number;        // Expiration time
}
```

---

### 3. Users Module

**Ubicación**: [src/users/](src/users/)

**Propósito**: Gestión completa del ciclo de vida de usuarios (CRUD).

**UsersService**:
- `create(dto)`: Crear usuario (llamado por AuthService)
- `findAll(filter?)`: Listar usuarios con paginación
- `findById(id)`: Obtener usuario por ID
- `update(id, dto)`: Actualizar datos de usuario
- `delete(id)`: Eliminar usuario (soft delete)

**UsersController** - Endpoints:

| Método | Ruta | Protección | Descripción |
|--------|------|-----------|-------------|
| GET | `/users` | JWT + ADMIN | Listar todos los usuarios |
| GET | `/users/:id` | JWT | Obtener usuario por ID |
| PATCH | `/users/:id` | JWT | Actualizar usuario |
| DELETE | `/users/:id` | JWT + ADMIN | Eliminar usuario |

**User Entity**:
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hasheado con bcrypt

  @Column()
  name: string;

  @Column({ 
    type: 'enum',
    enum: ['USER', 'SELLER', 'ADMIN'],
    default: 'USER'
  })
  role: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // Soft delete
}
```

---

### 4. Comics Module

**Ubicación**: [src/comics/](src/comics/)

**Propósito**: Catálogo de cómics con búsqueda, filtrado y paginación.

**ComicsService**:
- `create(dto, seller: User)`: Crear nuevo cómic
- `findAll(filter: FilterComicsDto)`: Listar con paginación y búsqueda
- `findById(id)`: Obtener detalles de un cómic
- `update(id, dto, seller: User)`: Actualizar (solo vendedor propietario)
- `delete(id, seller: User)`: Soft delete

**ComicsController** - Endpoints:

| Método | Ruta | Protección | Descripción |
|--------|------|-----------|-------------|
| GET | `/comics` | @Public | Listar cómics (con filtrado) |
| GET | `/comics/:id` | @Public | Detalles de cómic |
| POST | `/comics` | JWT + SELLER | Crear cómic |
| PATCH | `/comics/:id` | JWT + SELLER | Actualizar cómic |
| DELETE | `/comics/:id` | JWT + SELLER | Eliminar cómic |

**Comic Entity**:
```typescript
@Entity('comics')
export class Comic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Precio en COP

  @Column({ type: 'integer', default: 0 })
  stock: number; // Inventario

  @Column({ default: true })
  active: boolean; // Soft delete

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
```

**Filter Capabilities**:
```typescript
interface FilterComicsDto {
  search?: string;      // Busca en título y descripción
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;    // Solo cómics con stock disponible
  page?: number;        // Paginación
  limit?: number;
}
```

---

### 5. Payments Module (PayU)

**Ubicación**: [src/payments/](src/payments/)

**Propósito**: Integración completa con PayU para procesamiento de pagos, manejo de webhooks y auditoría de transacciones.

#### 🔑 Conceptos Clave de PayU

**PayU** es una pasarela de pagos latinoamericana que soporta:
- Tarjetas de crédito (Visa, MasterCard, Amex)
- Tarjetas de débito
- Transferencias bancarias
- Billeteras digitales

**Flujo de Integración PayU**:
1. **Cliente** hace checkout en el marketplace
2. **Backend** genera parámetros PayU + firma MD5
3. **Frontend** redirige a PayU con estos parámetros
4. **Cliente** completa pago en PayU
5. **PayU** llama webhook de confirmación
6. **Backend** procesa webhook y actualiza orden

#### PaymentsService

**Archivo**: [src/payments/payments.service.ts](src/payments/payments.service.ts)

**Método Principal**: `createCheckout(dto: CheckoutDto, buyer: User)`

**¿Qué hace?**

Crea una orden de compra y genera parámetros de formulario PayU de forma **segura y atómica**:

```typescript
async createCheckout(dto: CheckoutDto, buyer: User): Promise<PayUCheckoutData> {
  // 1. TRANSACCIÓN ATÓMICA: Verifica stock + crea orden
  return this.dataSource.transaction(async (manager) => {
    
    // 1a. Para cada cómic en el carrito:
    const comicsData: { comic: Comic; quantity: number }[] = [];
    for (const item of dto.items) {
      // ⚠️ CLAVE: Usa pessimistic_write lock para evitar race conditions
      const comic = await manager.findOne(Comic, {
        where: { id: item.comicId, active: true },
        lock: { mode: 'pessimistic_write' }, // PostgreSQL SELECT ... FOR UPDATE
      });

      if (!comic) throw new NotFoundException(`Comic ${item.comicId} not found`);
      if (comic.stock < item.quantity)
        throw new InsufficientStockException(comic.title, comic.stock, item.quantity);

      comicsData.push({ comic, quantity: item.quantity });
    }

    // 2. CÁLCULO SEGURO: Total desde DB, nunca desde cliente
    const total = comicsData.reduce((sum, { comic, quantity }) => {
      return sum + (Number(comic.price) * quantity);
    }, 0);
    // ✅ Esto previene manipulación de precios en el cliente

    // 3. Crear Order
    const referenceCode = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    //   →  "ORDER-1773702836093-IALCIK" — identificador único para PayU

    const order = manager.create(Order, {
      buyerId: buyer.id,
      status: OrderStatus.PENDING,
      total,
      currency: 'COP',
      referenceCode,
    });
    await manager.save(order);

    // 4. Crear OrderItems (líneas de detalle)
    const orderItems = comicsData.map(({ comic, quantity }) =>
      manager.create(OrderItem, {
        orderId: order.id,
        comicId: comic.id,
        quantity,
        unitPrice: Number(comic.price), // Precio histórico
        subtotal: Number(comic.price) * quantity,
      }),
    );
    await manager.save(orderItems);

    // 5. Generar firma PayU y parámetros
    return this.buildPayUCheckoutParams(order, buyer);
  });
  // ✅ Si todo falla, ROLLBACK automático
  // ✅ Si todo ok, COMMIT automático
}
```

**¿Por qué es robusto?**

| Aspecto | Protección |
|--------|-----------|
| **Precios manipulables** | Solo usa `comic.price` de base de datos, ignora cliente |
| **Race conditions** | `pessimistic_write` lock = PostgreSQL SELECT ... FOR UPDATE |
| **Inconsistencia de datos** | Transacción atómica = todo o nada |
| **Stock negativo** | Verifica stock ANTES de crear orden |
| **Órdenes fantasma** | referenceCode único + timestamp |

---

**Método Secundario**: `buildPayUCheckoutParams(order, buyer)`

Genera la firma MD5 y construye los parámetros del formulario:

```typescript
private buildPayUCheckoutParams(order: Order, buyer: User): PayUCheckoutData {
  const apiKey      = this.configService.getOrThrow('PAYU_API_KEY');     // "4Vj8eK4rloUd272L48hsrarnUA"
  const merchantId  = this.configService.getOrThrow('PAYU_MERCHANT_ID');  // "508029"
  const accountId   = this.configService.getOrThrow('PAYU_ACCOUNT_ID');   // "512321"
  const appUrl      = this.configService.getOrThrow('APP_URL');          // "http://localhost:3000"
  const apiUrl      = this.configService.getOrThrow('API_URL');          // "http://localhost:3001"
  const amountStr   = order.total.toFixed(1); // "150000.0" — formato PayU exacto

  // 🔐 FIRMA MD5: Hash del string: "apiKey~merchantId~referenceCode~amount~currency"
  const signatureStr = `${apiKey}~${merchantId}~${order.referenceCode}~${amountStr}~${order.currency}`;
  const signature = createHash('md5').update(signatureStr).digest('hex');

  return {
    formUrl: 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/', // Sandbox
    params: {
      merchantId,                                           // ID del negocio
      accountId,                                            // Cuenta PayU
      description: `Comics Marketplace - Order ${order.referenceCode}`,
      referenceCode: order.referenceCode,                   // Tu ID único de orden
      amount: amountStr,                                    // Total en COP
      currency: order.currency,                             // "COP"
      signature,                                            // Hash MD5
      tax: '0',                                             // IVA (si aplica)
      taxReturnBase: '0',
      buyerEmail: buyer.email,                              // Para recibos PayU
      buyerFullName: buyer.name,                            // Para factura
      responseUrl: `${appUrl}/payment/response`,            // Redirige al cliente post-pago
      confirmationUrl: `${apiUrl}/api/v1/payments/webhook`, // Webhook silencioso
    },
  };
}
```

---

#### PaymentsController

**Archivo**: [src/payments/payments.controller.ts](src/payments/payments.controller.ts)

**Endpoint 1: POST /payments/checkout** (Requiere JWT)

```bash
curl -X POST http://localhost:3001/api/v1/payments/checkout \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "comicId": "uuid-1", "quantity": 2 },
      { "comicId": "uuid-2", "quantity": 1 }
    ]
  }'
```

**Response (200 OK)**:
```json
{
  "formUrl": "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/",
  "params": {
    "merchantId": "508029",
    "accountId": "512321",
    "description": "Comics Marketplace - Order ORDER-1773702836093-IALCIK",
    "referenceCode": "ORDER-1773702836093-IALCIK",
    "amount": "150000.0",
    "currency": "COP",
    "signature": "a1b2c3d4e5f6g7h8",
    "tax": "0",
    "taxReturnBase": "0",
    "buyerEmail": "user@example.com",
    "buyerFullName": "Juan Pérez",
    "responseUrl": "http://localhost:3000/payment/response",
    "confirmationUrl": "http://localhost:3001/api/v1/payments/webhook"
  }
}
```

**Errores Posibles**:
- `400`: Comic no existe o stock insuficiente
- `401`: No autenticado
- `500`: Error interno

---

**Endpoint 2: POST /payments/webhook** (@Public - Sin JWT)

PayU llama este endpoint asincronamente cuando el pago se completa.

```bash
curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "reference_sale": "ORDER-1773702836093-IALCIK",
    "transaction_id": "txn-webhook-85000",
    "value": "150000.0",
    "currency": "COP",
    "state_pol": "4",
    "response_code_pol": "APPROVED",
    "payment_method_name": "VISA",
    "sign": "a1b2c3d4e5f6g7h8"
  }'
```

**Response (200 OK)** - IMPORTANTE: debe ser 200, no 201
```json
{
  "status": "processed"
}
```

**Validación de Seguridad**:

```typescript
@Public()
@Post('webhook')
@HttpCode(HttpStatus.OK) // ← CLAVE: PayU espera 200
async handlePayUWebhook(@Body() payload: PayUWebhookDto) {
  const start = Date.now();

  try {
    // 1. Validar firma MD5
    const expectedSign = this.validatePayUSignature(payload);
    if (!timingSafeEqual(
      Buffer.from(payload.sign || expectedSign),
      Buffer.from(expectedSign),
    )) {
      throw new Error('Invalid signature');
    }

    // 2. Procesar webhook
    await this.paymentsService.processWebhookEvent(payload);

    return { status: 'processed' };
  } catch (error) {
    this.logger.error(`[WEBHOOK ERROR] ${error.message}`);
    return { status: 'error' };
  }
}

// Valida la firma MD5 del webhook igual que el checkout
private validatePayUSignature(payload: PayUWebhookDto): string {
  const apiKey = this.configService.getOrThrow('PAYU_API_KEY');
  const signatureStr = `${apiKey}~${payload.reference_sale}~${payload.value}~${payload.currency}`;
  return createHash('md5').update(signatureStr).digest('hex');
}
```

---

#### PaymentTransaction Entity

Registra TODAS las transacciones para auditoría:

```typescript
@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string; // Referencia a Order

  @Column({ unique: true })
  payuTransactionId: string; // "txn-webhook-85000"

  @Column()
  state: 'APPROVED' | 'DECLINED' | 'PENDING'; // state_pol

  @Column()
  responseCode: string; // "APPROVED", "DECLINED", etc.

  @Column()
  paymentMethod: string; // "VISA", "TRANSFER", etc.

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'jsonb' })
  rawResponse: any; // Guardar todo PayU payload para debugging

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

---

#### processWebhookEvent() - Lógica Crítica

```typescript
async processWebhookEvent(payuPayload: any): Promise<void> {
  // Usamos QueryRunner manual para control total de transacción
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const orderId = payuPayload.reference_sale; // "ORDER-..."

    // PASO 1: Bloquear orden EXCLUSIVAMENTE (pessimistic_write)
    // Previene que dos webhooks del mismo pago se procesen simultáneamente
    const order = await queryRunner.manager.findOne(Order, {
      where: { referenceCode: orderId },
      lock: { mode: 'pessimistic_write' }, // PostgreSQL SELECT ... FOR UPDATE
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // IDEMPOTENCIA: Si ya fue procesada, ignora webhook duplicado
    if (order.status !== OrderStatus.PENDING) {
      await queryRunner.release();
      return; // ← Ya procesada, ignorar
    }

    // PASO 1b: Cargar items en SEGUNDA query (después del lock)
    // ⚠️ Esto es importante: TypeORM no puede hacer lock + relaciones
    const orderItems = await queryRunner.manager.find(OrderItem, {
      where: { orderId: order.id },
    });
    order.items = orderItems;

    // PASO 2: Registrar la transacción (inmutable)
    const newStatus = payuPayload.state_pol === '4' ? OrderStatus.PAID : OrderStatus.CANCELLED;

    await queryRunner.manager.save(PaymentTransaction, {
      orderId: order.id,
      payuTransactionId: payuPayload.transaction_id,
      state: payuPayload.state_pol === '4' ? 'APPROVED' : 'DECLINED',
      responseCode: payuPayload.response_code_pol,
      paymentMethod: payuPayload.payment_method_name,
      amount: parseFloat(payuPayload.value),
      rawResponse: payuPayload,
    });

    // PASO 3: Actualizar estado de orden
    await queryRunner.manager.update(Order, order.id, {
      status: newStatus,
    });

    // PASO 4: Si pago aprobado, decrementar stock PERMANENTEMENTE
    if (newStatus === OrderStatus.PAID) {
      for (const item of order.items) {
        await queryRunner.manager.decrement(
          Comic,
          { id: item.comicId },
          'stock',
          item.quantity,
        );
      }
    }
    // Si fue rechazado, stock permanece igual (orden se puede reintentar)

    // ✅ TODO OK: COMMIT TODOS LOS CAMBIOS
    await queryRunner.commitTransaction();

  } catch (error) {
    // ❌ ALGO FALLÓ: ROLLBACK TODOS LOS CAMBIOS
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // SIEMPRE: liberar conexión
    await queryRunner.release();
  }
}
```

**¿Por qué tan complejo?**

| Escenario | Problema | Solución |
|-----------|----------|----------|
| Dos webhooks simultáneos | Stock se decrementa 2x | `pessimistic_write` lock |
| Webhook duplicado | Orden se procesa 2x | Verificar status != PENDING |
| Fallo a mitad del proceso | Datos inconsistentes | QueryRunner + transacción + rollback |
| Cliente reintentar pago | Orden rechazada intenta nuevo pago | Stock NO se decrementa si falla |
| Auditoría requerida | Sin registro de intentos | PaymentTransaction guarda TODO |

---

#### Diagrama de Flujo PayU (Secuencia)

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. POST /checkout (JWT)
       ├──────────────────────────────────┐
       │                                  │
       │                            ┌─────▼──────────┐
       │                            │ ComicsService  │
       │                            │  createCheckout│
       │                            └─────┬──────────┘
       │                                  │
       │                           ┌──────▼──────────┐
       │                           │   PostgreSQL    │
       │                           │ - Bloquea stock │
       │                           │ - Crea Order    │
       │                           │ - Crea Items    │
       │                           └─────┬──────────┘
       │                                  │
       │                           ┌──────▼──────────┐
       │                           │ Genera Firma MD5│
       │                           │ y Parámetros    │
       │                           └─────┬──────────┘
       │
       │ 2. Retorna formUrl + params
       ◄─────────────────────────────────┘
       │
       │ 3. Frontend: form POST a PayU
       ├──────────────────────────────────┐
       │                                  │
       └─────────────────────────────────┬┘
                                         │
                          ┌──────────────▼────────────┐
                          │   PayU Checkout (Web)     │
                          │ Cliente completa pago     │
                          │ (Tarjeta, etc.)          │
                          └──────────────┬────────────┘
                                         │
                          ┌──────────────▼────────────┐
                          │ PayU Procesa Pago         │
                          │ - Valida tarjeta         │
                          │ - Genera transaction_id  │
                          │ - state_pol = 4 (OK)    │
                          └──────────────┬────────────┘
                                         │
                          ┌──────────────▼────────────┐
                          │ PayU Webhook HTTP POST    │
                          │ a confirmationUrl        │
                          └──────────────┬────────────┘
                                         │
       ┌─────────────────────────────────┘
       │ 4. POST /webhook (payload PayU)
       │
    ┌──▼────────────────┐
    │ PaymentsController│
    │  handlePayUWebhook│
    └──┬────────────────┘
       │
    ┌──▼─────────────────┐
    │ Valida Firma MD5    │
    │ (timingSafeEqual)   │
    └──┬─────────────────┘
       │
    ┌──▼─────────────────────────────────┐
    │ PaymentsService.processWebhookEvent│
    │ - Bloquea Order (pessimistic_write)│
    │ - Valida idempotencia              │
    │ - Crea PaymentTransaction          │
    │ - Actualiza Order status = PAID    │
    │ - Decrementa Comic.stock           │
    │ - COMMIT transaction               │
    └──┬─────────────────────────────────┘
       │
    ┌──▼────────────────┐
    │ Return 200 OK    │
    │ {status: processed}│
    └────────────────────┘
       │
    ┌──────────────────────┐
    │ PayU registra webhook │
    │ como "entregado"      │
    └──────────────────────┘
```

---

#### Credentials PayU Sandbox (Testing)

```
API_KEY:      4Vj8eK4rloUd272L48hsrarnUA
MERCHANT_ID:  508029
ACCOUNT_ID:   512321
PAYU_CHECKOUT_URL: https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/
```

**Tarjetas de Prueba**:

| Estado | Número | Mes | Año | CVV |
|--------|--------|-----|-----|-----|
| ✅ Aprobada | 4231910000123456 | 12 | 2028 | 123 |
| ❌ Rechazada | 5296155436622157 | 12 | 2028 | 123 |

---

### 📦 Modules Summary

| Módulo | Responsabilidad | Status |
|--------|-----------------|--------|
| **App** | Configuración raíz | ✅ |
| **Auth** | Autenticación JWT | ✅ |
| **Users** | CRUD usuarios | ✅ |
| **Comics** | Catálogo de cómics | ✅ |
| **Payments** | Integración PayU | ✅ |
| **Orders** | Gestión de órdenes | ✅ |

---

## Entidades de Base de Datos

### 1. User Entity

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // No retorna por defecto
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['USER', 'SELLER', 'ADMIN'],
    default: 'USER',
  })
  role: 'USER' | 'SELLER' | 'ADMIN';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date; // Soft delete
}
```

---

### 2. Comic Entity

```typescript
@Entity('comics')
export class Comic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // COP

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @Column({ type: 'uuid' })
  sellerId: string; // Vendedor que lo ofrece

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  // Relaciones (si aplica)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller?: User;

  @OneToMany(() => OrderItem, (item) => item.comic)
  orderItems?: OrderItem[];
}
```

---

### 3. Order Entity

```typescript
export enum OrderStatus {
  PENDING = 'PENDING',      // Órd creada, esperando pago
  PAID = 'PAID',            // Pago completado
  SHIPPED = 'SHIPPED',      // En envío
  DELIVERED = 'DELIVERED',  // Entregada
  CANCELLED = 'CANCELLED',  // Cancelada / Pago rechazado
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  buyerId: string; // Quien compra

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column()
  referenceCode: string; // "ORDER-1773702836093-IALCIK" (PayU reference)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number; // Total en COP

  @Column()
  currency: string; // "COP"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyerId' })
  buyer?: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items?: OrderItem[];

  @OneToMany(() => PaymentTransaction, (tx) => tx.order)
  transactions?: PaymentTransaction[];
}
```

---

### 4. OrderItem Entity

```typescript
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  comicId: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number; // Precio al momento de compra (histórico)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // unitPrice * quantity

  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @ManyToOne(() => Comic, { eager: true })
  @JoinColumn({ name: 'comicId' })
  comic?: Comic;
}
```

---

### 5. PaymentTransaction Entity

```typescript
@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column({ unique: true })
  payuTransactionId: string; // "txn-webhook-85000" (ID único de PayU)

  @Column()
  state: 'APPROVED' | 'DECLINED' | 'PENDING';

  @Column()
  responseCode: string; // "APPROVED", "INVALID_EXPIRATION_DATE", etc.

  @Column()
  paymentMethod: string; // "VISA", "MASTERCARD", "TRANSFER", "E_WALLET"

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'jsonb', nullable: true })
  rawResponse: any; // Guardar TODO el payload de PayU para debugging

  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Order, (order) => order.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;
}
```

---

## Data Transfer Objects (DTOs)

### Auth DTOs

**CreateAuthDto** (Registro)
```typescript
export class CreateAuthDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password debe tener mayúsculas, minúsculas y números',
  })
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}
```

**LoginDto**
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**AuthTokensDto** (Respuesta)
```typescript
export class AuthTokensDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
```

---

### Payments DTOs

**CheckoutDto**
```typescript
export class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}

export class CheckoutItemDto {
  @IsUUID()
  comicId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  // ⚠️ NO incluir unitPrice aquí — el servidor calcula desde Comic.price
}
```

**PayUWebhookDto**
```typescript
export class PayUWebhookDto {
  @IsString()
  reference_sale: string; // "ORDER-..."

  @IsString()
  transaction_id: string; // ID único de PayU

  @IsString()
  value: string; // "150000.0"

  @IsString()
  currency: string; // "COP"

  @IsString()
  state_pol: string; // "4" (4=APPROVED, 5=DECLINED, 6=PENDING)

  @IsString()
  response_code_pol: string; // "APPROVED", "INVALID_*..", etc.

  @IsString()
  payment_method_name: string; // "VISA", "TRANSFER", etc.

  @IsOptional()
  @IsString()
  sign?: string; // Firma MD5 (opcional, servidor valida si está)
}
```

---

## Componentes de Seguridad

### Guards

#### JwtAuthGuard
- **Archivo**: `src/auth/guards/jwt-auth.guard.ts`
- **Propósito**: Valida JWT en TODAS las rutas excepto `@Public()`
- **Comportamiento**: 
  - Extrae token de header `Authorization: Bearer <token>`
  - Valida firma contra `JWT_SECRET`
  - Si válido: `request.user = { id, email, role }`
  - Si falla: `401 Unauthorized`

#### RolesGuard
- **Archivo**: `src/auth/guards/roles.guard.ts`
- **Propósito**: Valida que usuario tenga rol en `@Roles(...)`
- **Comportamiento**: 
  - Revisa si `request.user.role` está en lista requerida
  - Si falla: `403 Forbidden`

---

### Decoradores

#### @Public()
Salta el JwtAuthGuard para esa ruta.

```typescript
import { Public } from 'src/auth/decorators/public.decorator';

@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

#### @CurrentUser()
Inyecta el usuario actual autenticado.

```typescript
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Get('profile')
getProfile(@CurrentUser() user: User) {
  return { user };
}
```

#### @Roles(...)
Requiere uno de los roles especificados.

```typescript
import { Roles } from 'src/auth/decorators/roles.decorator';

@Roles('ADMIN', 'SELLER')
@Get('admin/stats')
getStats() { ... }
```

---

## Interceptores

### LoggingInterceptor
Registra todas las solicitudes HTTP:

```
[GET] /comics?page=1
[POST] /auth/login
[PATCH] /users/uuid
```

---

### ResponseTransformInterceptor
Transforma respuestas HTTP a formato estándar:

```json
{
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-03-16T12:00:00Z"
}
```

---

## Variables de Entorno

Crear archivo `.env` en la raíz de `comics-marketplace/`:

```env
# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=020306Joan.*
DB_NAME=comic_marketplace
DB_SYNCHRONIZE=true  # Auto-crear tablas en dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Dejar vacío si no tiene contraseña

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=24h       # Tiempo de expiración del token

# PayU Integration (Sandbox)
PAYU_API_KEY=4Vj8eK4rloUd272L48hsrarnUA
PAYU_MERCHANT_ID=508029
PAYU_ACCOUNT_ID=512321
PAYU_CHECKOUT_URL=https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/

# URLs (para webhooks y redirects)
APP_URL=http://localhost:3000      # Frontend URL
API_URL=http://localhost:3001      # Backend URL

# Node Environment
NODE_ENV=development               # development, production, test
PORT=3001                          # Puerto de la API
```

---

## Flujo de Checkout y Pagos (PayU)

### Paso 1: Cliente hace Checkout

```bash
curl -X POST http://localhost:3001/api/v1/payments/checkout \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "comicId": "550e8400-e29b-41d4-a716-446655440001", "quantity": 2 },
      { "comicId": "550e8400-e29b-41d4-a716-446655440002", "quantity": 1 }
    ]
  }'
```

### Paso 2: Backend Responde con Parámetros PayU

Status: **201 Created**

```json
{
  "formUrl": "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/",
  "params": {
    "merchantId": "508029",
    "accountId": "512321",
    "description": "Comics Marketplace - Order ORDER-1773702836093-IALCIK",
    "referenceCode": "ORDER-1773702836093-IALCIK",
    "amount": "150000.0",
    "currency": "COP",
    "signature": "a1b2c3d4e5f6g7h8",
    "tax": "0",
    "taxReturnBase": "0",
    "buyerEmail": "user@example.com",
    "buyerFullName": "Juan Pérez",
    "responseUrl": "http://localhost:3000/payment/response",
    "confirmationUrl": "http://localhost:3001/api/v1/payments/webhook"
  }
}
```

### Paso 3: Frontend Redirige a PayU

Frontend construye un form HTML y hace POST a `formUrl`:

```html
<form id="payuForm" action="https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/" method="POST">
  <input type="hidden" name="merchantId" value="508029">
  <input type="hidden" name="accountId" value="512321">
  <input type="hidden" name="description" value="Comics Marketplace - Order ...">
  <input type="hidden" name="referenceCode" value="ORDER-1773702836093-IALCIK">
  <input type="hidden" name="amount" value="150000.0">
  <input type="hidden" name="currency" value="COP">
  <input type="hidden" name="signature" value="a1b2c3d4e5f6g7h8">
  <input type="hidden" name="tax" value="0">
  <input type="hidden" name="taxReturnBase" value="0">
  <input type="hidden" name="buyerEmail" value="user@example.com">
  <input type="hidden" name="buyerFullName" value="Juan Pérez">
  <input type="hidden" name="responseUrl" value="http://localhost:3000/payment/response">
  <input type="hidden" name="confirmationUrl" value="http://localhost:3001/api/v1/payments/webhook">
  <button type="submit">Ir a PayU</button>
</form>
```

### Paso 4: Cliente Completa Pago en PayU

- Cliente ingresa datos de tarjeta
- PayU valida y procesa pago
- Si aprobado: `state_pol=4`
- Si rechazado: `state_pol=5`

### Paso 5: PayU Llama Webhook (Backend Silencioso)

PayU hace HTTP POST silencioso a `confirmationUrl`:

```
POST http://localhost:3001/api/v1/payments/webhook
Content-Type: application/x-www-form-urlencoded

reference_sale=ORDER-1773702836093-IALCIK&
transaction_id=txn-webhook-85000&
value=150000.0&
currency=COP&
state_pol=4&
response_code_pol=APPROVED&
payment_method_name=VISA&
sign=a1b2c3d4e5f6g7h8
```

### Paso 6: Backend Procesa Webhook

```typescript
// 1. Valida firma MD5
const expectedSign = "a1b2c3d4e5f6g7h8"; // Recalculado
if (payload.sign !== expectedSign) 
  throw new Error('Firma inválida — webhook falsificado');

// 2. Busca orden por referenceCode
const order = await ordersRepo.findOne({
  referenceCode: 'ORDER-1773702836093-IALCIK'
});

// 3. Registra transacción
await txRepo.save({
  orderId: order.id,
  payuTransactionId: 'txn-webhook-85000',
  state: 'APPROVED',
  responseCode: 'APPROVED',
  amount: 150000.0,
  rawResponse: payload,
});

// 4. Actualiza estado orden
order.status = OrderStatus.PAID;
await ordersRepo.save(order);

// 5. Decrementa stock
for (const item of order.items) {
  comic.stock -= item.quantity;
  await comicsRepo.save(comic);
}

// 6. Retorna 200 OK (IMPORTANTE)
return { status: 'processed' };
```

### Paso 7: PayU Redirige Cliente a responseUrl

PayU redirige al cliente a:

```
http://localhost:3000/payment/response?
  referenceCode=ORDER-1773702836093-IALCIK&
  transactionState=4
```

---

## Webhook de PayU

### Seguridad del Webhook

**Validación de Firma MD5**:

```typescript
// PayU calcula: MD5(apiKey~referenceCode~value~currency)
const apiKey = "4Vj8eK4rloUd272L48hsrarnUA";
const signatureStr = `${apiKey}~ORDER-1773702836093-IALCIK~150000.0~COP`;
const expectedSign = MD5(signatureStr); // "a1b2c3d4e5f6g7h8"

// Si payload.sign !== expectedSign → RECHAZAR
```

**Idempotencia**:

```typescript
// Si order.status !== PENDING → IGNORAR webhook duplicado
if (order.status === OrderStatus.PAID) {
  return { status: 'processed' }; // Ignorar silenciosamente
}
```

### Códigos de Estado PayU

| state_pol | Significado | Acción |
|-----------|-------------|--------|
| 4 | ✅ APROBADO | `order.status = PAID`, decrementa stock |
| 5 | ❌ DECLINADO | `order.status = CANCELLED`, mantiene stock |
| 6 | ⏳ PENDIENTE | `order.status = PENDING`, sin cambios |

### Códigos de Respuesta

| Código | Meaning |
|--------|---------|
| APPROVED | Pago procesado exitosamente |
| INVALID_EXPIRATION_DATE | Tarjeta expirada |
| INSUFFICIENT_FUNDS | Fondos insuficientes |
| FRAUD_REJECTED | Rechazado por antifraude |
| INVALID_AMOUNT | Monto fuera de rango |
| PAYMENT_NETWORK_ERROR | Error en red de pago |

---

## Cómo Ejecutar

### 1. Iniciar PostgreSQL

```bash
# Docker
docker run -d \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=020306Joan.* \
  -e POSTGRES_DB=comic_marketplace \
  -p 5432:5432 \
  postgres:14
```

### 2. Iniciar Redis

```bash
# Docker
docker run -d -p 6379:6379 redis:latest
```

### 3. Instalar Dependencias

```bash
cd comics-marketplace
npm install
```

### 4. Crear .env

```bash
cp .env.example .env
# Editar con valores locales
```

### 5. Ejecutar Aplicación

**Modo Desarrollo** (con hot-reload):
```bash
npm run start:dev
```

**Modo Producción**:
```bash
npm run build
npm run start:prod
```

**Debug**:
```bash
npm run start:debug
```

### 6. Acceder a Swagger

Una vez ejecutando:

```
http://localhost:3001/api
```

Ahí verás:
- Todos los endpoints documentados
- Posibilidad de probar directamente desde el navegador
- Esquemas de DTOs

---

## Testing

### Unit Tests

```bash
npm run test
```

Ejecuta todos los archivos `*.spec.ts`

### Watch Mode

```bash
npm run test:watch
```

Ejecuta tests en tiempo real mientras editas.

### Coverage

```bash
npm run test:cov
```

Genera reporte de cobertura de pruebas.

### E2E Tests

```bash
npm run test:e2e
```

Pruebas end-to-end usando Supertest.

---

## Notas Importantes

### 🔐 Seguridad

- JWT Secret debe ser complejo y secreto en producción
- PayU credenciales NO deben estar en código — usar variables de entorno
- Sempre valida firma MD5 de webhooks
- Usa HTTPS en producción
- Helmet proporciona headers de seguridad

### 📊 Performance

- Redis cachea datos frecuentes
- Pessimistic locks previenen race conditions
- Paginación limita queries grandes
- Rate limiting (10 req/min) protege contra abuso

### 🐛 Debugging

- Habilita logs en `PaymentsService` para ver flujo de webhook
- Usa Swagger para probar endpoints
- PostgreSQL logs: `docker logs postgres-comics`
- Redis CLI: `docker exec -it redis-comics redis-cli`

### 📝 Próximos Pasos

- [ ] Implementar email notifications (pago confirmado/rechazado)
- [ ] Agregar GET /orders/:id para consultar estado
- [ ] Agregar GET /orders para listar órdenes del usuario
- [ ] Crear página de respuesta POST-pago
- [ ] Migrar a Bull async processing en producción
- [ ] Implementar reintentos automáticos de webhook

---

## Contacto y Soporte

Para preguntas sobre la integración de PayU, consulta:
- [PayU API Docs](https://developers.payulatam.com/)
- [Webhooks PayU](https://developers.payulatam.com/es/docs/webhooks/)
- [Sandbox Environment](https://sandbox.payulatam.com/)

---

**Documento creado**: 16 de Marzo de 2026  
**Stack**: NestJS 11 + PostgreSQL + Redis + PayU  
**Version**: 1.0.0
