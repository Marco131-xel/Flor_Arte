# Correo, 2FA y recuperación de FlorArte

## Arquitectura y compatibilidad

Se conserva `/auth/login`, `AuthenticationManager`, `UserService`, el `PasswordEncoder` BCrypt y el JWT existente. Los roles y permisos de cada módulo permanecen en Spring Security. No existe un segundo sistema de usuarios.

El 2FA es **individual y está desactivado inicialmente**, para mantener el acceso de las cuentas actuales mientras se configura Gmail. Administradores y empleados pueden activarlo o desactivarlo en **Mi perfil → Verificación en dos pasos**, confirmando su contraseña actual y un código enviado al correo de acceso (`usuario.email`, no el correo opcional de la persona). El cambio renueva la sesión actual e invalida las anteriores.

Con 2FA activado, el login devuelve `requires2fa: true`, un `challengeId` aleatorio y los tiempos de espera. No entrega JWT, roles ni privilegios. React conserva el desafío únicamente en memoria. Un código válido devuelve la misma sesión definitiva que el login habitual, con `requires2fa: false`.

Los códigos tienen seis dígitos, se generan con `SecureRandom`, duran cinco minutos y se almacenan como HMAC-SHA256 con secreto del servidor. Hay cinco intentos por desafío, sin reiniciarlos al reenviar. Se permiten tres reenvíos separados por al menos 60 segundos, con un máximo absoluto de 15 minutos por desafío. Un nuevo login invalida los desafíos anteriores. Los bloqueos de filas impiden consumir el mismo código o enlace simultáneamente.

La recuperación usa tokens aleatorios de 256 bits y almacena únicamente SHA-256. Vencen a los 15 minutos y sirven una vez. Cada nueva solicitud invalida los enlaces anteriores; el restablecimiento invalida todos los pendientes, los desafíos 2FA y los JWT previos. La nueva contraseña se cifra con el encoder existente. Debe tener al menos ocho caracteres y no superar 72 bytes UTF-8, por el límite de BCrypt.

La migración **V18__seguridad_correo_2fa_y_recuperacion.sql** añade `usuario.twofa_habilitado`, `usuario.auth_version`, `desafio_2fa`, `recuperacion_password`, `limite_autenticacion` y un trigger para revocar accesos al cambiar contraseña, correo, estado, persona vinculada o configuración 2FA. No cambia V1–V17 ni elimina registros del negocio. Flyway la aplica al arrancar el backend; el despliegue necesita permisos para crear tablas, función y trigger. No se aplicó sobre tu base real durante el desarrollo.

Los JWT antiguos, sin `authVersion`, siguen válidos si la cuenta aún tiene versión cero. Después del primer cambio de seguridad son rechazados. Las autorizaciones siguen consultando los roles actuales de la cuenta.

## Gmail y variables de entorno del backend

Configura estas variables en el **proceso que ejecuta Spring Boot**, nunca en variables `VITE_`:

| Variable | Uso |
| --- | --- |
| `MAIL_USERNAME` | Cuenta Gmail que enviará los mensajes. |
| `MAIL_PASSWORD` | Contraseña de aplicación de Google. |
| `MAIL_FROM` | Opcional: remitente autorizado; si no existe, usa `MAIL_USERNAME`. |
| `AUTH_RECOVERY_URL` | URL completa de React, sin parámetros ni fragmentos. Desarrollo: `http://localhost:5173/restablecer-contrasena`. Producción: `https://tu-dominio/restablecer-contrasena`. |
| `AUTH_CODE_SECRET` | Opcional, recomendado: secreto aleatorio de al menos 32 bytes. Si no existe, utiliza la clave JWT existente. |
| `CORS_ALLOWED_ORIGINS` | Orígenes del frontend separados por comas. Por defecto: `http://localhost:5173`. |

No definas vacías las variables opcionales: elimínalas o asígnales valores válidos. La clave JWT existente debe conservarse como configuración privada del backend. Puedes generar `AUTH_CODE_SECRET` con `openssl rand -hex 32` y configurarlo en tu entorno privado; no lo publiques.

La plantilla del backend `.env.example` no contiene credenciales. Spring Boot **no carga archivos `.env` automáticamente**: configura las variables en tu IDE, servicio o contenedor, o exporta un archivo privado antes de iniciar Maven. `.env`, `.env.*` y los archivos privados de configuración siguen excluidos de Git.

1. Activa la verificación en dos pasos de tu cuenta Google.
2. Crea una contraseña de aplicación para FlorArte desde [Contraseñas de aplicación de Google](https://myaccount.google.com/apppasswords). Usa los 16 caracteres, sin espacios, como `MAIL_PASSWORD`; no uses la contraseña normal de Gmail. Google puede no ofrecer esta opción en algunas cuentas administradas o configuraciones de seguridad. [Guía oficial](https://support.google.com/mail/answer/185833?hl=es).
3. Configura las variables del backend y reinícialo.
4. Mantén `VITE_API_URL` apuntando al backend y reinicia React si cambias su configuración.

El envío utiliza `smtp.gmail.com:587`, autenticación y STARTTLS obligatorio, verificando la identidad del servidor. Hay límites de cinco segundos para conexión, lectura y escritura. El servicio usa `JavaMailSender`; los errores SMTP no exponen detalles internos ni secretos. [SMTP de Gmail](https://support.google.com/mail/answer/7104828?hl=es), [correo en Spring Boot](https://docs.spring.io/spring-boot/reference/io/email.html).

Los mensajes HTML incluyen los colores, logo incrustado y datos de FlorArte. El logo no requiere descargar imágenes desde un servidor externo. La recuperación se envía en segundo plano para que la respuesta HTTP no dependa de los tiempos de Gmail; siempre responde con el mismo mensaje para cuentas existentes, desconocidas o inactivas. Los fallos de entrega quedan en logs como categorías, sin direcciones, códigos, enlaces ni credenciales. Si una entrega asíncrona falla, el usuario debe solicitar otro enlace; no hay cola de correo persistente ni reintentos automáticos.

## Prueba manual con correos reales

Usa una cuenta de prueba activa cuyo **correo de acceso** puedas consultar:

1. Entra con el login habitual y abre Mi perfil. Activa 2FA introduciendo la contraseña actual.
2. Comprueba el correo de FlorArte y su logo; introduce el código de seis dígitos. Revisa también Spam.
3. Cierra sesión e inicia nuevamente: primero debe aparecer la pantalla de código; solo después de verificarlo se abre el panel.
4. Prueba un código incorrecto, el reenvío después de 60 segundos y un código vencido después de cinco minutos.
5. En el login, selecciona «¿Olvidaste tu contraseña?». Solicita el enlace y abre el correo.
6. El enlace abre `/restablecer-contrasena#token=...`; la página retira inmediatamente el fragmento de la barra de direcciones. Introduce y confirma una contraseña nueva.
7. La contraseña anterior y el enlace utilizado deben dejar de funcionar. Inicia sesión con la nueva contraseña; si tenías 2FA activado, se sigue solicitando.
8. Abre un módulo desde una sesión anterior en otro navegador: su JWT se rechaza y el frontend regresa al login cuando una consulta protegida recibe 401.

## Seguridad de la página de recuperación

El token viaja en el fragmento de la URL, que no se envía al servidor, y se retira **antes de cargar los recursos**. Permanece en memoria hasta completar o abandonar el formulario; recargar la página exige abrir el enlace del correo nuevamente. No se escribe en localStorage ni sessionStorage. Las contraseñas y los códigos tampoco se almacenan allí.

La página usa `no-referrer`, imágenes y fuentes locales. En producción, sirve React con HTTPS y configura el servidor para devolver `index.html` en `/restablecer-contrasena` y `/recuperar-contrasena`. No agregues analítica ni recursos externos a estas pantallas. Estas medidas siguen las [recomendaciones de OWASP para recuperación](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Endpoints y límites

Los endpoints públicos solo aceptan POST:

- `/auth/login`: credenciales; sesión definitiva o desafío 2FA.
- `/auth/2fa/verificar`: `{challengeId, codigo}`.
- `/auth/2fa/reenviar`: `{challengeId}`.
- `/auth/recuperacion/solicitar`: `{correo}`; respuesta genérica.
- `/auth/recuperacion/restablecer`: `{token, contrasena, confirmacion}`.

Los endpoints `/auth/2fa/configuracion` (GET) y `/auth/2fa/configuracion/{iniciar,verificar,reenviar}` (POST) requieren un JWT definitivo y rol administrador o empleado. `iniciar` recibe `{habilitado, contrasena}`. Los desafíos de configuración solo sirven para el usuario autenticado y no pueden utilizarse en la verificación pública del login.

Los límites se guardan en PostgreSQL, con claves HMAC, y funcionan entre varias instancias del backend. Por ventanas de 15 minutos: login 10 por correo y 30 por IP; recuperación 3 por correo y 10 por IP; verificación de login 60 por IP; reenvíos de login 30 por IP; restablecimiento 30 por IP; inicio de configuración 5 por usuario y verificación de configuración 30 por usuario. Se devuelve 429 al excederlos. Los registros temporales expirados hace más de un día se limpian cada hora.

Se usa la IP que ve `HttpServletRequest`, sin confiar directamente en `X-Forwarded-For`. Si despliegas detrás de un proxy, configura una cadena de proxies confiables para que el límite no agrupe a todos los usuarios bajo la IP del proxy.

## Pruebas reproducibles sin correo real

Backend: `SeguridadCorreoIntegrationTest` usa Spring Boot, HTTP, BCrypt, JWT, PostgreSQL y un reloj controlado, sustituyendo `CorreoService` por un mock. `CorreoServiceTest` simula `JavaMailSender` y sus fallos. Las pruebas de integración solo aceptan una URL local con puerto explícito y base **florarte_test**, usuario **florarte_test**, contraseña vacía. Debe ser una base **desechable**: las pruebas existentes de otros módulos reconstruyen su esquema.

Desde el backend:

```bash
./mvnw -Dtest=SeguridadCorreoIntegrationTest,CorreoServiceTest \
  -Dflorarte.test.db=jdbc:postgresql://127.0.0.1:55441/florarte_test test
```

Para la suite completa, usa una base desechable con esquema vacío y `-Dsurefire.runOrder=alphabetical`, porque las pruebas anteriores de módulos reconstruyen el esquema sin historial Flyway:

```bash
./mvnw -Dsurefire.runOrder=alphabetical \
  -Dflorarte.test.db=jdbc:postgresql://127.0.0.1:55441/florarte_test test
```

Frontend: las ocho pruebas de `tests/auth.browser.mjs` simulan las respuestas del backend. Comprueban ambos tipos de login, códigos incorrectos, caducidad y reenvío, recuperación, token en memoria, ausencia de recursos externos, configuración desde el perfil y tamaño móvil.

```bash
npm install
npx playwright install chromium
npm run dev -- --host 127.0.0.1 --port 5175
# En otra terminal:
npm run test:auth
```

Usa `FLORARTE_TEST_URL` para otra dirección del frontend, o `CHROMIUM_EXECUTABLE_PATH` para un Chromium ya instalado.

## Archivos de esta implementación

Backend, bajo `Flor_Arte_Backend`:

- Modificados: `pom.xml`, `.gitignore`, `AuthController`, `AuthService`, `User`, `SecurityConfig`, `JwtUtil`, `JwtAuthenticationFilter`, `GlobalExceptionHandler`.
- Nuevos: `.env.example`, `CorreoConfig`, `SeguridadCorreoDTO`, `FlujoAuthException`, `CorreoService`, `SecretosAuth`, `LimiteAuthService`, `DesafioAuthService`, `RecuperacionService`, `auth-mail.properties`, `mail/florarte.png`, migración V18, `SeguridadCorreoIntegrationTest`, `CorreoServiceTest`.

Frontend:

- Modificados: `index.html`, `src/main.tsx`, `src/components/login/LoginForm.tsx`, `src/services/authService.ts`, `src/services/apiService.ts`, `src/types/auth.ts`, `src/routes/AppRoutes.tsx`, `src/pages/shared/perfil/Perfil.tsx`, `src/styles/empleado/style.css`, `src/styles/admin/landing.module.css`, `src/styles/login.module.css`, `package.json`, `package-lock.json`, `README.md`.
- Nuevos: `src/components/login/AuthLayout.tsx`, `CodigoCorreo.tsx`, `SeguridadCorreo.tsx`, `src/pages/auth/RecuperarContrasena.tsx`, `RestablecerContrasena.tsx`, `src/styles/fuentes.css`, `public/fonts/` (fuentes y licencias), `tests/auth.browser.mjs` y esta guía.
