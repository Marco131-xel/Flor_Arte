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
las migraciones pendientes, incluidas V9, V10, V11, V12, V13, V14 y V15, y reinicia el frontend.

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

## Arreglos

Administrador y empleado comparten el módulo **Arreglos**, con pestañas para
el catálogo y sus pedidos. Incluye creación, edición, detalle y eliminación,
paginación en el servidor y filtros de mes y estado en los pedidos.
Los selectores de flores, clientes y arreglos también consultan páginas, con búsqueda.

La migración V11 adapta la propuesta de base de datos: las referencias a persona
usan `BIGINT`; los registros tienen `creado_en` para controlar los permisos;
cada pedido guarda cantidad, nombre, precio unitario y total.
La migración V12 agrega `imagen_url` opcional a `arreglo`; la API lo expone como
`imagenUrl`. Crear y editar permiten guardar una URL HTTP o HTTPS de hasta 2048
caracteres y ver una vista previa. El catálogo y los pedidos muestran la imagen
actual del arreglo; cambiarla también actualiza su visualización en pedidos existentes.
`detalle_pedido_arreglo` conserva las flores y cantidades por unidad del momento
de la venta. Así, editar la composición o el precio del catálogo no cambia pedidos anteriores.

Crear un arreglo define un producto y **no consume stock**. Registrar su pedido
reserva las flores inmediatamente, igual que los pedidos de flores. Cancelar o
eliminar devuelve las flores; reactivar vuelve a descontarlas si hay existencias.
Modificar la cantidad ajusta únicamente la diferencia. El backend calcula los
importes y realiza stock, movimientos y pedido en una misma transacción.
No se puede eliminar un arreglo con pedidos registrados.

La capacidad mostrada es la cantidad posible de **cada arreglo** según las flores
disponibles. Las capacidades de distintos arreglos no se suman: pueden compartir flores.
El empleado edita o elimina durante 30 minutos desde la creación y puede cambiar
el estado del pedido en cualquier momento. El administrador no tiene ese límite temporal.

API: `GET /arreglo/{id}`, `POST /arreglo/create`, `PUT /arreglo/update/{id}`,
`DELETE /arreglo/delete/{id}`; las mismas operaciones para `/pedido_arreglo`, más
`PUT /pedido_arreglo/{id}/estado` con `{ "estado": "CONFIRMADO" }`.
Los listados usan `/gestion/arreglos/pagina` y `/gestion/pedidosArreglos/pagina`.

`ArregloTest` comprueba reservas, cancelaciones, historial, permisos, paginación,
reversión de transacciones y ventas simultáneas en PostgreSQL temporal.
La prueba de arranque también exige `florarte.test.db` y utiliza esa conexión,
sin cargar la base configurada para el uso normal del sistema.

## Eventos de clientes

El módulo **Gestionar Eventos** comparte calendario, agenda y formularios entre
administrador y empleado. La migración V13 crea `evento` y `detalle_evento` y
habilita el motivo `EVENTO` en los movimientos de inventario.
La propuesta se adapta con cliente y responsable (`BIGINT`), fecha y hora,
ubicación, descripción, días de preparación, estado textual, reserva aplicada
y una fecha de creación inmutable. La preparación empieza la fecha del evento
menos los días indicados; puede empezar en un mes distinto al de la celebración.

Los eventos se registran como **PENDIENTE**, sin consumir inventario: se pueden
planificar necesidades aunque todavía no haya suficientes flores. Al cambiar a
**CONFIRMADO** se validan y descuentan todas las flores en una sola transacción.
Si falta stock o una flor no está disponible, el evento permanece pendiente.
Un evento confirmado siempre reserva las flores, independientemente de su fecha.
Para planificar una fecha lejana sin reserva, conserva la solicitud pendiente.

Flujo: `PENDIENTE → CONFIRMADO → TRABAJANDO → REALIZADO → PAGADO`.
Trabajando se permite a partir del día del evento, usando la fecha de Guatemala;
el cambio es manual. Pendiente, confirmado y trabajando pueden cancelarse.
Cancelar devuelve las flores reservadas una sola vez. Un cancelado puede
reabrirse como pendiente y confirmarse de nuevo después de validar el stock.
Realizado y pagado conservan el consumo de flores; ya no admiten cancelación ni
eliminación y conservan la composición como historial. Pagado es un estado de
seguimiento; este módulo no procesa cobros.

Modificar la composición de un evento reservado ajusta la diferencia de stock.
Eliminar un evento reservado devuelve sus flores. El empleado puede editar o
eliminar durante los primeros 30 minutos; el estado se cambia sin ese límite.
El servidor aplica las reglas aunque se llame directamente a la API.

El calendario obtiene resúmenes por día, sin descargar todos los eventos.
La agenda carga páginas de 10, 20 o 50, con filtros de mes/año, año completo,
día, estado, búsqueda de cliente/evento/ubicación y fecha de inicio de preparación.
Cada día muestra eventos, solicitudes pendientes, flores reservadas y preparación.
**Sin eventos** significa sin registros para los filtros; no garantiza disponibilidad
de flores o del local. Pueden coincidir varios eventos en un día si hay existencias.
Inicio muestra la cantidad de eventos futuros sin finalizar; las notificaciones
incluyen hasta cinco eventos de los próximos siete días.

API: `GET /evento/calendario`, `GET /evento/pagina`, `GET /evento/{id}`,
`POST /evento/create`, `PUT /evento/update/{id}`, `DELETE /evento/delete/{id}`,
`PUT /evento/{id}/estado`. Calendario acepta `anio`, `mes`, `estado`, `q`.
Agenda añade `dia`, `pagina`, `tamano`, `preparacion` y admite `mes=0` para el año.

`EventoTest` verifica stock, transacciones, reservas simultáneas, permisos,
transiciones de estados, calendario y preparación entre meses. Requiere la
misma base temporal `florarte_test` descrita en Verificación. Reinicia el backend
para que Flyway aplique V13 antes de usar este módulo.

## Reportes

Solo el administrador puede consultar **Reportes**, tanto en la página como
en la API. El empleado no tiene menú ni ruta de reportes. No se modifican
datos desde los reportes. Los filtros de día, semana (lunes a domingo), mes y año
se aplican en el servidor, con inicio inclusivo y fin exclusivo. Los rankings
se calculan **después** de filtrar y devuelven hasta cinco resultados; los empates
se resuelven por ID. El historial de merma se pagina con 10, 20 o 50 registros.

Flyway V14 crea las vistas operativas: `vw_reporte_clientes`,
`vw_reporte_demanda_flores`, `vw_reporte_arreglos`, `vw_reporte_compras`,
`vw_reporte_compras_flores` y `vw_reporte_mermas`.
V15 agrega el importe y la fecha de pago de eventos y crea
`vw_reporte_ingresos`, `vw_reporte_ingresos_diarios`,
`vw_reporte_perdidas_diarias` y `vw_reporte_gastos_mensuales`.
El backend consulta estas vistas; no descarga los historiales para calcularlos
en el navegador. Las vistas son normales, por lo que reflejan los datos vigentes.

Criterios de los reportes:

- **Ingresos:** pedidos de flores y arreglos `ENTREGADO`, por fecha del pedido;
  eventos `PAGADO`, por fecha del pago. Se muestran los tres módulos y su total.
  Los pedidos no registran una fecha de entrega o de cobro; su fecha comercial
  es la referencia disponible, sin afirmar que sean cobros de ese día.
- **Balance:** ingresos conocidos menos compras de inventario del período.
  No es ganancia neta ni margen: aún faltan otros gastos y un costo asignado
  a cada venta. La pérdida por merma se informa por separado y no vuelve a
  restarse del importe de compras.
- **Merma:** cantidad por flor y pérdida = cantidad × costo unitario guardado.
  V16 añade `costo_unitario` a cada movimiento. El formulario propone el promedio
  ponderado de compras anteriores, editable para corregir la referencia; si no hay
  compras se exige ingresar el costo. Cero es válido si es explícito. El costo se
  conserva al editar solo la cantidad y no cambia al modificar compras o precios.
  Los registros antiguos sin costo guardado siguen usando la estimación de compras
  anteriores; si tampoco existe, se indica **Sin valorar** y el total es parcial.
  No se inventan costos históricos ni se aplica valoración FIFO.
- **Demanda:** flores de pedidos y arreglos entregados, más eventos realizados
  o pagados. Las flores por arreglo se multiplican por la cantidad vendida,
  usando la composición guardada con el pedido.
- **Clientes:** solicitudes de pedidos, arreglos y eventos, excluyendo canceladas.
  Clientes con más arreglos se ordenan por unidades; los otros rankings, por
  número de solicitudes.
- **Arreglos solicitados:** unidades de arreglos, excluyendo pedidos cancelados.
- **Compras a proveedores:** flores por unidades recibidas y proveedores por
  importe comprado. Los totales usan cabeceras para evitar duplicaciones.
- **Gasto por mes:** compras de inventario agrupadas por mes dentro del filtro;
  si se consulta un día o una semana, el importe corresponde solo a ese rango.

Eventos permiten registrar un **importe acordado** opcional al crear/editar.
Para pasar a pagado se exige un importe conocido; si no se registró antes, puede
capturarse al cambiar ese estado, también para empleados fuera del plazo de edición.
Si ya existe un importe acordado, el cambio de estado no permite reemplazarlo.
El pago registra su fecha usando la zona de Guatemala y no descuenta flores de nuevo.
Repetir el estado pagado conserva la fecha de pago. Para corregir un importe se
utiliza la edición del evento con los permisos habituales.
Los eventos históricos pagados conservan importe/fecha desconocidos. Los reportes
advierten de importes incompletos y usan la fecha del evento cuando no existe la
de pago, identificándola como estimada. No se inventan montos ni fechas de cobro.

API de consulta: `/reporte/financieros`, `/reporte/operativos` y
`/reporte/mermas/pagina`, con `periodo=DIA|SEMANA|MES|ANIO` y `fecha=AAAA-MM-DD`.
Merma añade `pagina` y `tamano`. `ReporteTest` verifica las vistas con PostgreSQL
temporal: totales, estados, unidades de arreglos, rankings, semanas entre años,
costos sin compras futuras, datos desconocidos, permisos y paginación.
Reinicia el backend para aplicar V14, V15 y V16 antes de usar Reportes.

## Resumen de inicio

Los dos paneles consultan `/gestion/resumen`: pedidos y arreglos pendientes,
en proceso y listos; eventos de hoy y de los próximos siete días; unidades
actuales de inventario, variedades con stock bajo (1–5) y agotadas (0), entradas
y unidades de merma del mes actual. Los pedidos de flores y de arreglos se
cuentan por separado y enlazan a su módulo correspondiente. La agenda y alertas
muestran hasta cinco registros, calculados en el servidor, con fechas de Guatemala.
El botón **Actualizar resumen** renueva los datos sin recargar la página.

Solo el administrador recibe las cifras financieras mensuales (ingresos conocidos,
compras, balance y pérdidas), eventos realizados por cobrar y estadísticas de
usuarios. El balance no es ganancia neta. Los datos desconocidos se advierten como
totales parciales. El endpoint del empleado omite estos campos financieros.

El endpoint `/movimiento_inventario/costo/{idFlor}` propone el costo de referencia
para registrar una merma; ambos roles pueden registrar el costo y consultar las
pérdidas de cada merma dentro del módulo de inventario con los permisos habituales.


## Recibos y comprobantes

Administrador y empleado pueden emitir y consultar **Recibos y comprobantes**.
Se selecciona una operación existente (pedido de flores, pedido de arreglos,
evento o entrada de inventario) mediante listas paginadas, filtro por mes y búsqueda.
Las compras generan un **Comprobante de compra** para documentar el gasto registrado.
El documento incluye el logo, dirección, correo y teléfono de FlorArte, cliente o
proveedor, fecha, estado al emitir, detalle, precio unitario y total de la operación.
Los PDF tienen encabezados repetidos, número de página y espacio para firmas.

V17 crea `comprobante`, con numeración única y una copia JSON de los datos de la
operación y empresa. Emitir de nuevo devuelve el comprobante existente sin duplicarlo.
Las copias se conservan aunque cambie o se elimine la operación; no se editan ni
eliminan desde este módulo. El estado mostrado es el de emisión, y generar un
comprobante no cambia estados, inventario ni registra un pago. No se emiten nuevas
copias para operaciones canceladas, sin detalle o sin importe (incluido evento sin
precio acordado). Los documentos son comprobantes internos de la operación; no se
implementa emisión fiscal ni se afirma un cobro que el sistema no haya registrado.

API: `POST /comprobante` con `{tipo, idOrigen}`, `GET /comprobante/{id}` y
`GET /comprobante/pagina` con `pagina`, `tamano` (máximo 50), `tipo`, `mes` y `q`.
Los meses de emisión se filtran según Guatemala. Ambos roles tienen acceso; clientes
y proveedores no pueden emitir ni consultar comprobantes.

## Exportación de reportes

Solo el administrador puede usar **Exportar PDF** y **Exportar Excel** en Reportes.
La exportación consulta `/reporte/exportacion` y toma una instantánea consistente de
las vistas bajo la misma transacción. Respeta día, semana, mes o año seleccionado e
incluye resumen financiero, ocho rankings Top 5, gastos mensuales y **todo** el detalle
de merma del período, independientemente de la página visible. Los datos sin importe
se conservan como desconocidos y los costos estimados se identifican.

PDF incluye el logo en los encabezados y paginación. Excel genera un `.xlsx` real con
11 hojas, logo incrustado, números editables, formato de moneda, filtros y encabezados
congelados. No se generan fórmulas a partir de nombres de clientes o proveedores.
Para limitar memoria en el navegador se admite un máximo de 10,000 mermas por
exportación: si se supera, se pide reducir el período y no se trunca el archivo.
Las librerías de PDF/Excel se cargan solo al exportar y los archivos se generan localmente,
sin enviar los documentos a terceros. El logo se obtiene de `/images/florarte.png`.

Reinicia el backend para aplicar V17 antes de emitir comprobantes. Las pruebas de
`ReporteTest` incluyen copias históricas, reemisión, cuatro tipos de operación,
permisos, paginación y exportaciones completas y con límite.

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

## Gmail, verificación en dos pasos y recuperación

El login conserva la autenticación y los roles existentes. El 2FA se configura
individualmente desde Mi perfil; las cuentas actuales lo tienen desactivado inicialmente.
Consulta [la guía de seguridad por correo](SEGURIDAD_CORREO.md) para configurar Gmail,
las variables privadas del backend, la migración V18 y las pruebas automáticas y manuales.

## Enviar comprobantes PDF por correo

En **Recibos y comprobantes**, abre un documento con el botón de ver y selecciona
**Enviar por correo**. El correo registrado al emitir el comprobante se precarga;
si falta, puedes escribirlo. Comprueba el destinatario y pulsa **Enviar PDF**.
El correo introducido se usa solo para ese envío y no cambia el comprobante histórico
ni el registro de la persona.

El backend genera el adjunto desde los datos guardados, con logo, detalle, total y
paginación, usando [Apache PDFBox](https://pdfbox.apache.org/). Reutiliza el Gmail SMTP
ya configurado para 2FA y recuperación; no requiere variables nuevas ni migraciones.
Reinicia el backend después de actualizarlo para habilitar `POST /comprobante/{id}/correo`.
Administrador y empleado pueden enviar recibos de pedidos, arreglos y eventos, además
de comprobantes de inventario para proveedores.

Se confirma el envío cuando SMTP lo acepta; revisa Spam si el destinatario no lo ve.
Los fallos de SMTP se muestran en pantalla. Hay un máximo de tres intentos de envío
por comprobante y 30 por usuario en cada ventana de 15 minutos; los intentos fallidos
también cuentan para evitar abusos. Los correos de pruebas son simulados.

Con Vite en `http://127.0.0.1:5175`, ejecuta `npm run test:recibos` para probar el
formulario, la validación, los errores, ambos roles y la vista móvil sin enviar correos.
Las pruebas backend de PDF, adjuntos y autorización están en `ComprobantePdfTest`,
`CorreoServiceTest` y `SeguridadCorreoIntegrationTest`.

## Eliminar comprobantes y descargar su PDF

El botón de papelera está disponible en el historial y en la vista del documento.
La eliminación pide confirmación y conserva la operación original y su inventario.
Los administradores pueden eliminar cualquier comprobante; los empleados, durante
los primeros 30 minutos desde su emisión. El backend valida el plazo aunque se
intente ejecutar la acción directamente. Puedes emitir un nuevo comprobante si la
operación original sigue siendo válida; recibirá otro número de documento.

El estado de la operación no se muestra en la vista ni en el PDF. Su dato histórico
se conserva internamente. La descarga y el correo usan el mismo generador del backend,
con número destacado, información del cliente, tabla, total y paginación. No se
necesitan migraciones nuevas. Reinicia el backend para habilitar `GET /comprobante/{id}/pdf`
y `DELETE /comprobante/{id}`.

Las pruebas de confirmación, permisos y descarga se ejecutan con
`npm run test:recibos:acciones` y una API simulada (Vite en el puerto 5175).

## Regreso de los formularios y recuperación solicitada por administrador

Los formularios de gestión regresan al listado de su módulo después de un guardado
correcto. Usuarios y personas regresan a su pestaña en Contactos; las mermas regresan
al inventario con la pestaña Mermas seleccionada. La edición del perfil vuelve a
Mi perfil. Los errores de guardado conservan el formulario y sus datos. Los formularios
modales de colores y tipos de flor cierran el formulario y actualizan el catálogo.
La generación de comprobantes vuelve al historial y muestra una confirmación.

En **Usuarios del sistema → Editar usuario → Enviar cambio de contraseña**, el
administrador puede solicitar un enlace de recuperación para un empleado activo.
Se usa el correo de acceso guardado en el backend; guarda primero cualquier cambio
de correo o estado. La solicitud no modifica la contraseña: el empleado la cambia
mediante el enlace de 15 minutos, de un solo uso. La ruta protegida es
`POST /auth/recuperacion/empleado/{id}`, exclusiva del administrador, con límites de
10 solicitudes por administrador y tres por empleado en ventanas de 15 minutos.
Reutiliza Gmail y la configuración de recuperación existentes; no requiere migraciones.

El encabezado de todos los correos alinea el logo a la izquierda y el nombre/lema a
su derecha. Los PDF muestran el número de documento y el total como texto sobre
fondo blanco, manteniendo el resto del diseño.

`npm run test:formularios` comprueba las rutas de regreso y los flujos de guardado y
solicitud administrativa con API simulada (Vite en el puerto 5175). No envía correos.

## Mensajes de login y confirmación de cuentas

La activación o desactivación desde Editar usuario pide confirmación en una ventana
con el estilo de FlorArte. Cancelar no modifica la cuenta. El login presenta mensajes
en español para credenciales incorrectas, validación, conexión, cuenta sin acceso y
límites de intentos; no muestra mensajes técnicos como «Bad Request».
`npm run test:login:estados` verifica estos casos y el color del enlace de recuperación
con la API simulada (Vite en el puerto 5175).
