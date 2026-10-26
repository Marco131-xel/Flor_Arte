<div align="center">

# FlorArte

### Sistema Web para la Gestión de FlorArte

<img src="./Documentacion/florarte.png" alt="Logo FlorArte" width="180">

<p>
Sistema web desarrollado para digitalizar y optimizar la gestión de inventario,
pedidos y operaciones de FlorArte.
</p>

</div>

---

## 📖 Descripción

**FlorArte** es un sistema web desarrollado para apoyar la gestión de un negocio
familiar dedicado a la venta de flores, elaboración de arreglos florales,
atención de pedidos y organización de eventos.

El sistema busca centralizar la información del negocio y facilitar el control
de sus principales procesos mediante una aplicación web moderna, segura y
escalable.

### Objetivos principales

- 🌷 Gestionar las flores disponibles.
- 📦 Controlar entradas y movimientos de inventario.
- 🛒 Gestionar pedidos de clientes.
- 👥 Administrar usuarios, personas y roles.
- 🔐 Controlar el acceso mediante autenticación y permisos.
- 🔔 Mostrar notificaciones relacionadas con las operaciones.
- 📊 Facilitar el control de la información del negocio.

---

## 🛠️ Tecnologías utilizadas

### Frontend

| Tecnología | Uso |
|---|---|
| React | Desarrollo de la interfaz |
| TypeScript | Tipado y desarrollo del frontend |
| Axios | Comunicación con la API REST |
| Bootstrap | Diseño y componentes visuales |
| React Router | Navegación y rutas |

### Backend

| Tecnología | Uso |
|---|---|
| Java | Lenguaje de programación |
| Spring Boot | Desarrollo de la API REST |
| Spring Security | Seguridad y autorización |
| JWT | Autenticación mediante tokens |
| Spring Data JPA | Persistencia de datos |
| Hibernate | ORM |
| Lombok | Reducción de código repetitivo |
| Flyway | Migraciones versionadas |

### Base de datos

- PostgreSQL

---

## 🏗️ Arquitectura

FlorArte utiliza una arquitectura de capas que separa la presentación,
la lógica de negocio y la persistencia de datos.

```text
┌──────────────────────────┐
│          USUARIO         │
│      Navegador Web       │
└────────────┬─────────────┘
             │ HTTPS
             ▼
┌──────────────────────────┐
│        FRONTEND          │
│    React + TypeScript    │
│    Axios + Bootstrap     │
└────────────┬─────────────┘
             │ REST / JSON
             ▼
┌──────────────────────────┐
│         BACKEND          │
│ Spring Boot + Java       │
│                          │
│ Controllers              │
│ DTOs                     │
│ Services                 │
│ Repositories             │
│ Security / JWT           │
└────────────┬─────────────┘
             │ JPA / Hibernate
             ▼
┌──────────────────────────┐
│       POSTGRESQL         │
│       Base de Datos      │
└──────────────────────────┘
```

---

## 🔐 Seguridad

El sistema utiliza **Spring Security** junto con **JWT (JSON Web Token)**
para controlar la autenticación y autorización.

### Roles

- 👑 **Administrador**
- 👤 **Empleado**
- 🧑‍💼 **Cliente**
- 🚚 **Proveedor**

El token JWT se utiliza para autenticar las solicitudes dirigidas a los
endpoints protegidos de la API.

---

## 📦 Módulos

### 👥 Usuarios y Personas

- Gestión de usuarios.
- Gestión de personas.
- Asignación de roles.
- Control de acceso.

### 🌷 Flores

- Registro de flores.
- Gestión de tipos de flor.
- Gestión de colores.
- Actualización de información.
- Consulta de flores.

### 📦 Inventario

- Registro de entradas.
- Detalle de entradas.
- Control de existencias.
- Movimientos de inventario.
- Registro de mermas.

### 🛒 Pedidos

- Registro de pedidos.
- Gestión de clientes.
- Detalle de pedidos.
- Control del estado de los pedidos.
- Validación de disponibilidad.

### 🔔 Notificaciones

El frontend muestra notificaciones relacionadas con las operaciones del sistema,
incluyendo alertas de stock bajo, pedidos pendientes y otras situaciones
relevantes.

---

## 📁 Estructura del proyecto

### Backend

```text
backend/
└── src/
    └── main/
        ├── java/
        │   └── com/florarte/backend/
        │       ├── controllers/
        │       ├── dtos/
        │       ├── entities/
        │       ├── repositories/
        │       ├── services/
        │       ├── security/
        │       ├── enums/
        │       ├── exceptions/
        │       ├── utils/
        │       └── config/
        │
        └── resources/
            ├── application.properties
            └── db/
                └── migration/
```

### Frontend

```text
frontend/
└── src/
    ├── components/
    ├── pages/
    ├── router/
    ├── services/
    ├── styles/
    ├── types/
    ├── images/
    ├── App.tsx
    └── main.tsx
```

---

## 🗄️ Migraciones de base de datos

Las modificaciones de la estructura de PostgreSQL son administradas mediante
**Flyway**.

```text
db/migration/
├── V1__...
├── V2__...
├── V3__...
└── ...
```

Las migraciones permiten mantener un historial versionado de los cambios
realizados en la base de datos.

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd FlorArte
```

### 2. Configurar PostgreSQL

Crear la base de datos correspondiente y configurar las credenciales del
backend.

> No subir credenciales reales al repositorio.

### 3. Ejecutar el Backend

```bash
./mvnw spring-boot:run
```

En Windows:

```bash
mvnw.cmd spring-boot:run
```

### 4. Ejecutar el Frontend

```bash
npm install
npm run dev
```

---

## 🌿 GitFlow

El desarrollo utiliza una estrategia basada en GitFlow.

```text
main
 │
 └── develop
      │
      ├── feature/autenticacion
      ├── feature/usuarios
      ├── feature/flores
      ├── feature/inventario
      └── feature/pedidos
```

### Ramas principales

- `main` → versión estable.
- `develop` → integración del desarrollo.
- `feature/*` → desarrollo de funcionalidades.
- `hotfix/*` → correcciones urgentes.

---

## 📋 Gestión del proyecto

La planificación y seguimiento del desarrollo se realiza mediante **Jira**
utilizando Scrum.

Se utilizan:

- Épicas.
- Historias de Usuario.
- Product Backlog.
- Sprints.
- Criterios de aceptación.

### Flujo de trabajo

```text
Por hacer
    ↓
En curso
    ↓
En revisión
    ↓
Finalizado
```

---

## 🤖 Uso de Inteligencia Artificial

Durante el desarrollo se utilizaron herramientas de Inteligencia Artificial
como apoyo al proceso de programación.

### Backend — AGY

Utilizado como apoyo para:

- Estructuración del backend.
- Generación de clases.
- Servicios.
- Controladores.
- DTOs.
- Repositorios.
- Seguridad y lógica de negocio.

### Frontend — Claude

Utilizado como apoyo para:

- Diseño de interfaces.
- Estilos.
- Componentes.
- Funcionalidades.
- Corrección de errores.
- Mejoras de experiencia de usuario.

El código generado o sugerido mediante IA fue revisado, adaptado, probado e
integrado al proyecto durante el proceso de desarrollo.

---

## 👨‍💻 Estado del proyecto

- [x] React + TypeScript
- [x] Spring Boot + Java
- [x] PostgreSQL
- [x] Arquitectura por capas
- [x] Autenticación
- [x] JWT
- [x] Spring Security
- [x] Roles y permisos
- [x] Gestión de usuarios
- [x] Gestión de personas
- [x] Gestión de flores
- [x] Gestión de colores
- [x] Gestión de tipos de flor
- [x] Inventario
- [x] Entradas de inventario
- [x] Notificaciones
- [x] Gestión de pedidos
- [x] Migraciones con Flyway

---

<div align="center">

### 🌸 FlorArte

**React • Spring Boot • PostgreSQL**

</div>
