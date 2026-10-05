# FlorArte — Frontend

## Configuración del backend

Copia `.env.example` a `.env` y ajusta la dirección base del backend:

```env
VITE_API_URL=http://localhost:8080
```

No agregues `/auth` ni `/login`: cada servicio añade su propia ruta. La misma
dirección se utiliza para iniciar sesión y para las demás consultas.
Si falta la variable o está vacía, la aplicación mostrará un error de configuración
en la consola del navegador.

Después de cambiar `.env`, reinicia `npm run dev`.
Para producción, configura `VITE_API_URL` en el entorno de compilación o en
`.env.production` con la dirección pública de tu backend antes de ejecutar
`npm run build`. La dirección queda incorporada al compilado; cambiarla requiere
volver a compilar. Una variable del entorno de ejecución de la compilación tiene
prioridad sobre los archivos `.env`.

Los archivos `.env` se excluyen de Git; `.env.example` sirve como plantilla.
Las variables `VITE_` son públicas en el navegador y no deben contener contraseñas
ni claves privadas.

## Paneles de administración y empleado

Los listados y el catálogo de tipos de flor comparten componentes de diseño, filtros y paginación. Solicitan
10, 20 o 50 registros al servidor mediante `GET /gestion/{modulo}/pagina`;
los conteos e importes corresponden a **todos los resultados del filtro**.
Pedidos, entradas de inventario y mermas permiten seleccionar mes y año con un calendario de meses.
Las notificaciones y los contadores de inicio usan consultas resumidas, sin
descargar el historial completo. Los selectores de los formularios conservan
sus servicios de catálogo existentes.

Este frontend requiere los cambios correspondientes de `Flor_Arte_Backend`.
Reinicia el backend para que Flyway aplique
las migraciones pendientes, incluidas V9 y V10, y reinicia el frontend.

Los campos opcionales de persona (DPI, correo y teléfono) se normalizan a `null`
cuando están vacíos. La migración V10 corrige los valores vacíos anteriores.
Nombre y rol son obligatorios, según el esquema de la base de datos.

Los pedidos incluyen la acción **Estado** para confirmar, preparar, entregar o
cancelar sin modificar los detalles. El empleado puede cambiar el estado en
cualquier momento; el plazo de 30 minutos aplica a la edición de datos y eliminación.

El empleado puede editar flores, entradas, pedidos y mermas durante los primeros
30 minutos desde su creación y puede eliminarlos dentro del mismo plazo. El servidor comprueba
el plazo, incluso si se accede directamente a la API. Cambiar la fecha comercial
o guardar una modificación no reinicia el tiempo. El administrador conserva la
edición sin límite de tiempo y la eliminación según las restricciones de cada
operación. Los registros anteriores a V9 quedan fuera del plazo del empleado,
porque no contaban con una fecha de creación fiable.

Los detalles tienen desplazamiento interno y un único botón de cierre; también
se cierran con Escape. En celular los listados se presentan como tarjetas y el
menú lateral empieza cerrado. El perfil utiliza iniciales, sin fotografía.

### Verificación

```sh
npm run build
```

En el backend, las pruebas `PersonaOpcionalesTest`, `ReglasEdicionTest`, `MermaStockTest` y
`PedidoCompletoTest` cubren el plazo y los ajustes de existencias.
`GestionTest` comprueba las consultas con PostgreSQL; requiere explícitamente
`-Dflorarte.test.db=jdbc:postgresql://127.0.0.1:PUERTO/florarte_test` y el usuario
`florarte_test`. Úsalo con una instancia temporal: reinicia el esquema `public`
de esa base antes de cada prueba. Sin esa propiedad se omite esa prueba.

## Notas de la plantilla React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
