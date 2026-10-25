# FlorArte · Fase 3: seguridad de producción

Corte: ejecución local del 24–25 de octubre de 2026, America/Guatemala. Rama de trabajo: `feature/seguridad-produccion`. Este reporte distingue código preparado, pruebas ejecutadas y operaciones productivas pendientes.

## 1. Protección de datos y cambios preexistentes

No se ejecutó SQL contra la base principal `florarte`, no se reiniciaron contenedores principales ni se modificaron sus volúmenes, roles o credenciales. Las pruebas sí reconstruyeron el esquema de la base temporal `florarte_test`. No se ejecutó `docker compose down -v`, prune, Flyway clean, despliegue AWS, publicación de imágenes, commit, push, merge o cambio de rama.

Se inspeccionaron los diffs preexistentes antes de editar. Se conservaron los cambios del usuario en `RecuperacionService`, `UserService`, `auth-mail.properties` y `ReporteTest`, incluidos los incrementos de `auth_version`; esta sesión añade cambios acotados sobre ellos. `RecuperacionService` y `auth-mail.properties` sí tenían cambios locales: el primero incrementa la versión al restablecer contraseña y el segundo requiere `AUTH_CODE_SECRET` independiente. Las pruebas finales se ejecutaron sobre el árbol de trabajo actual, sin copiar ni sustituir fuentes.

## 2. Problemas y soluciones

| Problema | Solución implementada |
|---|---|
| GestionTest, EventoTest y ArregloTest tenían contraseña vacía; configuración duplicada. | `PostgresTemporal` centraliza URL exacta local, usuario, contraseña obligatoria e identidad de clúster. ReporteTest y las dos clases Spring usan también el auxiliar. |
| El nombre florarte_test no demuestra qué servidor se está usando. | Script externo verifica contenedor, imagen 17, puerto, usuario/base y montajes; obtiene system_identifier. JDBC lo contrasta desde la conexión TCP antes de todo reset y Hikari al abrir conexiones físicas. |
| Reconstrucciones de esquema potencialmente simultáneas y sin historial Flyway real. | Paralelismo JUnit deshabilitado, ResourceLock compartido y reinicialización únicamente en tests con Flyway real; ya no se reproducen SQL manualmente sin historia. No ejecutar dos procesos Maven sobre el mismo contenedor temporal. |
| Tokens sin authVersion aceptaban implícitamente versión 0; el rol firmado no se contrastaba con la autoridad actual. | Se rechazan tokens sin firma válida, sujeto, `iat`, `exp`, rol vigente y `authVersion` entera no negativa. Se retiró el emisor auxiliar sin claims y se añadieron pruebas unitarias de claims, rol y firma. |
| El generador legado de hashes contenía una contraseña fija; creación de usuarios aceptaba 6 caracteres y no limitaba bytes BCrypt. | El generador ahora pide la contraseña sin eco, la confirma y genera BCrypt costo 12. Creación y actualización exigen mínimo 8 caracteres y máximo 72 bytes UTF-8. |
| Revocación incompleta o concurrente en actualización de cuenta. | Se conservó incremento de contraseña y se amplió a email/estado/persona, con transacción y bloqueo pesimista. V18 sigue cubriendo cambios directos y 2FA; recuperación mantiene incremento explícito. |
| Cambio de rol de persona no revocaba JWT/desafíos. | Nueva V19: solo instala función/trigger para cambios FUTUROS; no actualiza cuentas al migrar. Revoca versión, desafíos y recuperaciones de la cuenta afectada. |
| Empleado podía listar cuentas o consultar perfiles ajenos. | `/user/all` solo administrador; `/user/{id}` permite administrador o empleado propietario. Se conserva la consulta del propio perfil que usa el frontend. |
| Configuración privada no reproducible y posible reutilización de claves. | application.properties público sin secretos, credenciales externas obligatorias, sin URL de DB de respaldo; JWT y 2FA con claves obligatorias distintas de >=32 bytes. auth-mail externo del usuario conservado. |
| Configuración de producción sin validación global. | Perfil prod exige HTTPS externo para recuperación y CORS sin wildcard/rutas; SMTP externo no vacío; validate, Flyway habilitado con validación, clean deshabilitado y baseline automático deshabilitado; SQL logging apagado. |
| Errores internos podían mostrar mensajes de excepción. | Bajo prod se oculta RuntimeException interna; errores de autenticación no muestran email inexistente. Se mantienen mensajes de negocio/DTO. |
| V4 crea dos cuentas activas con hashes conocidos y personas de demo. | Callback SOLO prod ejecuta retirada de semillas dentro de la misma transacción V4, con bloqueo exclusivo y comprobación de tablas inicialmente vacías. V4 no se modifica. Tests prueban que otra conexión no puede leer las cuentas antes del commit. |
| Instalación existente con credenciales de demostración. | No elimina ni desactiva usuarios. El arranque prod se bloquea si aún hay hashes exactamente iguales a los de V4, leídos de la migración sin duplicarlos en código ni logs. Requiere revisión manual del propietario. Dev no aplica este callback. |
| Primer administrador de producción sin mecanismo seguro. | Bootstrap explícito, desactivado por defecto, solo con tablas persona/usuario vacías; hash BCrypt costo 12–16 desde archivo externo montado como secret. No recibe contraseña en claro, no sobrescribe cuentas existentes. |
| CI podía aprobar omitiendo integraciones o solo ejecutar dos clases. | Job PostgreSQL verifica identidad, ejecuta toda la suite y revisa XML de ocho clases obligatorias, incluyendo número de tests, fallos, errores y omisiones. Contraseña de servicio desde secret de CI; claves JWT/OTP efímeras distintas. |

## 3. V4 y nuevas instalaciones: garantía y límites

V1–V18 conservan exactamente su contenido y checksum. El siguiente número disponible era V19; solo se agrega `V19__revocar_accesos_por_cambio_de_rol.sql`.

`SemillasProduccion` se registra como callback Flyway Spring bajo el perfil prod. Antes de ejecutar V4 exige una transacción y tablas usuario/persona vacías; mantiene un bloqueo exclusivo. Después de ejecutar V4 exige exactamente las dos filas esperadas en cada tabla y las elimina ANTES del commit de esa misma migración. Los roles y catálogos se conservan. Ante contenido inesperado se aborta/rollback; no se decide qué cuentas reales borrar. No se altera V4 ni se salta su checksum/historia. Las secuencias pueden comenzar el primer administrador después de los IDs consumidos por las semillas, lo cual es normal.

Si V4 ya está aplicada no se ejecuta esa retirada. La comprobación posterior de hashes de demostración es de solo lectura y bloquea prod si permanecen: no cambia passwords, estado ni personas. No detecta todas las contraseñas débiles posibles; detecta los hashes concretos predefinidos de la migración. La revisión de cuentas existentes sigue siendo responsabilidad del propietario.

**Decisión pendiente antes de usar prod sobre la instalación existente:** identificar ambas cuentas iniciales, confirmar cuáles son reales y cambiar por un proceso autorizado las contraseñas de aplicación que aún sean de demo, o retirar cuentas sin uso con aprobación. No se realizó esta operación. No implica rotar la contraseña PostgreSQL ni reiniciar el sistema actual.

Los datos demo de V4 permanecen para desarrollo/tests, separados de la inicialización prod por el perfil y callback. Herramientas externas que ejecuten migraciones SQL sin el callback no implementan esta protección: para producción se debe usar el arranque Spring Boot con prod y no un Flyway CLI configurado solo con los SQL.

## 4. Primer administrador (solo instalación nueva)

Archivos: `PrimerAdministradorService`, `PrimerAdministradorConfig`, `compose.bootstrap.yaml`, `scripts/generar-hash-bootstrap.py`.

1. Preparar un proyecto/volumen NUEVO, claramente distinto de `florarte_postgres_data`. Esta sesión no creó ni inició ese entorno productivo.
2. Crear un directorio privado 0700 FUERA del repositorio y generar un archivo nuevo:

```bash
python3 scripts/generar-hash-bootstrap.py --output /ruta/privada/administrador.bcrypt
```

Requiere módulo Python bcrypt instalado en un entorno separado. Solicita y confirma por terminal sin eco; no muestra el hash/contraseña y no sobrescribe archivos. Clave mínimo 12 caracteres, máximo 72 bytes UTF-8. El directorio 0700 protege el host; el archivo 0444 permite al UID 10001 del backend leer el secret montado. No se generó una contraseña real durante esta tarea.

3. Configurar BOOTSTRAP_ADMIN_HASH_PATH hacia ese archivo, correo y nombre, con secretos fuera de Git. Componer `compose.yaml`, `compose.prod.yaml` y, SOLO para ese primer arranque, `compose.bootstrap.yaml`.
4. El callback elimina semillas solo durante V4 nueva; el runner crea el administrador con BCrypt externo dentro de una transacción. Si existen personas o cuentas, falla sin sobrescribirlas.
5. Retirar el override bootstrap y el montaje para los arranques siguientes; confirmar primer acceso y habilitar 2FA. No mantener `BOOTSTRAP_ADMIN_ENABLED=true`.

No ejecutar estos pasos en el volumen principal actual. No se agrega un endpoint HTTP de bootstrap ni un password por defecto.

## 5. Variables obligatorias y desarrollo

| Variable | Uso |
|---|---|
| DB_URL, DB_USERNAME, DB_PASSWORD | Spring directo/IDE. Docker existente inyecta los equivalentes SPRING_DATASOURCE_* y conserva el usuario/base configurados. Nunca cambiar DB_PASSWORD de un volumen existente esperando que Compose rote la contraseña. |
| JWT_SECRET | Clave privada >=32 bytes; sin fallback. JWT_EXPIRATION opcional, default 3600, permitido 1–3600 segundos. |
| AUTH_CODE_SECRET | Clave privada >=32 bytes distinta de JWT_SECRET, sin heredar JWT. |
| MAIL_USERNAME, MAIL_PASSWORD | Gmail SMTP externos; obligatorios en prod. MAIL_FROM opcional, usa el remitente autorizado. |
| AUTH_RECOVERY_URL | Desarrollo acepta HTTP localhost; prod exige HTTPS externo sin query/fragmento/userinfo. |
| CORS_ALLOWED_ORIGINS | Desarrollo: orígenes locales concretos. No se añade wildcard. |
| PRODUCTION_CORS_ORIGINS | Producción: lista de orígenes HTTPS externos, sin ruta ni barra final. Override prod la pasa al CORS real. |
| SPRING_PROFILES_ACTIVE | dev para Compose local (default del compose), prod para endurecimiento. |
| BOOTSTRAP_ADMIN_ENABLED, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_HASH_FILE | Bootstrap opt-in. No obligatorio para arranques normales; debe quedar desactivado después del primer administrador. |
| FLORARTE_IMAGE_TAG | Obligatoria al componer prod; debe identificar una versión de backend/frontend que se pueda volver a seleccionar. El CI actual no publica imágenes. |
| FLORARTE_TEST_DB_PASSWORD | Solo pruebas, contraseña del contenedor temporal. |
| FLORARTE_TEST_DB_SYSTEM_IDENTIFIER, FLORARTE_TEST_DB_CONTAINER_ID | Prueba de identidad NO secreta emitida por el verificador; nunca inventarla para evadir validaciones. |

El application.properties local ya usaba variables al inspeccionarlo; se conservaron y endurecieron esas correcciones y se habilitó versionar únicamente configuraciones sanitizadas. Spring no lee .env automáticamente; exportar variables al proceso/IDE. Compose sí interpola su entorno/archivo privado. No se generó ni cambió ningún .env real y las credenciales de los servicios activos no se modificaron.

Los JWT previos sin authVersion se rechazarán cuando se despliegue este código; el usuario debe iniciar sesión nuevamente. La configuración 2FA se conserva. Las claves de pruebas generadas en CI no deben reutilizarse en negocio.

## 6. Pruebas realmente ejecutadas

Entorno final: árbol de trabajo actual, Java 21/Spring Boot 4.1.0 y contenedor temporal existente `florarte-pg-test` (`postgres:17`, loopback 5544, usuario/base `florarte_test`). El verificador acreditó ID, ausencia del volumen principal y `system_identifier`; cada conexión de prueba contrastó la huella. Las integraciones reconstruyeron el esquema de `florarte_test` con Flyway. No se consultó ni modificó la base `florarte`.

| Comprobación final | Resultado |
|---|---|
| `./mvnw -B -ntp -Dflorarte.test.db=jdbc:postgresql://127.0.0.1:5544/florarte_test test` | Aprobada al final: 159 ejecutadas, 159 superadas, 0 fallidas, 0 errores, 0 omitidas. Incluye compilación del backend y tests unitarios e integración. |
| Ocho integraciones obligatorias y reporte XML | 109 casos, todos aprobados: Gestión 13, Eventos 18, Arreglos 11, Reportes 21, SeguridadCorreo 38, arranque 3, inicialización prod 4, arranque prod 1. |
| `JwtUtilTest` y `UserServicePasswordTest` | 6 casos incluidos en el total: claims/firma/rol y límites de longitud/bytes BCrypt. |
| Verificador de contenedores, unittest Python | 6 superadas: acepta temporal; rechaza proyecto/volumen principal, base/usuario incorrectos, puerto/host público incorrecto y bind mount. |
| `scripts/test_verificador_postgres.py` | 6 superadas. Rechaza proyecto/volumen principal, host/puerto/base/usuario incorrectos y bind mounts. |
| `git diff --check`; migraciones V1–V18 | Aprobados; no hay cambios en V1–V18. Solo se añade V19. |
| Compose `config --quiet` | Base, base+prod y base+prod+bootstrap correctos con variables sintéticas; no se ejecutó `up`, build ni restart. |
| Scanner dirigido de secretos | Sin claves privadas, claves AWS ni contraseña literal en código/configuración de producción. Los valores de ensayo permanecen solo en tests. |
| `actionlint` | En la revision original no estaba instalado. En la revision posterior de CI se valido con actionlint 1.7.12: ver `CI_GITHUB_ACTIONS.md`. |

Los 38 casos de SeguridadCorreo incluyen los 32 originales (uno adaptado para exigir rechazo de JWT sin versión) y seis regresiones: cambio de password por servicio, correo, estado inactivo, claims inválidos, rol y lectura de cuenta ajena. Permanecen los tests de 2FA, recuperación, revocación por reset, concurrencia, cuenta inactiva y habilitar/deshabilitar 2FA. Los tests prod prueban callback registrado por Spring y exposición transaccional, mantenimiento de usuarios existentes y bootstrap sin sobrescritura.

La ejecución final se realizó con permisos para el agente de Mockito y PostgreSQL temporal: 159/159 pasaron. Un intento unitario restringido tuvo 29 errores de inicialización por bloqueo del attach dinámico de Byte Buddy y 109 omisiones explícitas por no habilitar la propiedad PostgreSQL; no se contabilizó como suite aprobada. Dos intentos completos posteriores detectaron errores reales de fixture en `FlorArteBackendApplicationTests` (colisión del par tipo/color y después límite de 50 caracteres); se corrigieron con nombres únicos válidos, se verificó esa clase 3/3 y se repitió toda la suite con 0 errores/omisiones. No se enviaron correos reales (correo mock), no se probó AWS, HTTPS público, restauración de backup ni GitHub Actions remoto. El generador de administrador se inspeccionó y su ayuda se validó; no se generó una credencial real. La configuración `prod` se probó mediante Spring Boot y PostgreSQL temporal, no contra infraestructura pública.

## 7. Comandos para repetir con seguridad

Desde la raíz del repositorio, con contraseña temporal exportada fuera del historial, sin imprimirla:

```bash
(
  set +x
  set -euo pipefail
  read -rsp 'Password del PostgreSQL TEMPORAL: ' FLORARTE_TEST_DB_PASSWORD
  printf '\n'
  export FLORARTE_TEST_DB_PASSWORD
  export JWT_SECRET="$(openssl rand -hex 32)"
  export AUTH_CODE_SECRET="$(openssl rand -hex 32)"
  export MAIL_USERNAME='' MAIL_PASSWORD='' MAIL_FROM=''
  export DB_URL=jdbc:postgresql://127.0.0.1:1/florarte_test
  export DB_USERNAME=florarte_test DB_PASSWORD=solo-para-evitar-fallback
  unset SPRING_PROFILES_ACTIVE BOOTSTRAP_ADMIN_ENABLED
  python3 scripts/test_verificador_postgres.py
  prueba_identidad=$(mktemp /tmp/florarte-identidad.XXXXXX)
  python3 scripts/verificar-postgres-temporal.py --container florarte-pg-test \
    --port 5544 --output-env "$prueba_identidad"
  set -a
  . "$prueba_identidad"
  set +a
  cd Flor_Arte_Backend
  ./mvnw -B -ntp -Dflorarte.test.db=jdbc:postgresql://127.0.0.1:5544/florarte_test test
  python3 ../scripts/comprobar-integraciones.py
)
```

La contraseña solicitada debe ser la del contenedor de prueba temporal; nunca usar la de producción. `AUTH_CODE_SECRET` debe generarse de nuevo e independientemente de `JWT_SECRET`. El URL de fallback apunta intencionalmente a un puerto cerrado. No ejecutar procesos Maven simultáneos ni apuntar a una base clonada dentro del clúster productivo. Si el contenedor no existe/no se acredita o la huella no coincide, detener la operación. El verificador es de solo lectura; el auxiliar JDBC bloquea antes de cualquier `DROP` si base, usuario o huella no coinciden.

En CI, el script recibe el ID completo `${{ job.services.postgres.id }}`; el job obtiene FLORARTE_TEST_DB_PASSWORD de un secret exclusivo y genera dos claves efímeras distintas con OpenSSL. Se requieren ese secret y permiso de ejecutar servicios Docker. PR de forks sin secret no podrán correr ese job: deben revisarse mediante un flujo autorizado, sin quitar validaciones ni habilitar pull_request_target para ejecutar código no confiable con secretos. La configuracion actual ejecuta la suite completa en un unico job Maven y rechaza cualquier fallo u omision en los reportes; preparacion del secret, artefactos y publicacion de la rama se describen en [CI_GITHUB_ACTIONS.md](CI_GITHUB_ACTIONS.md).

## 8. Pendientes antes de AWS

- Resolver la revisión de hashes de cuentas demo V4 en una instalación ya migrada; el perfil `prod` falla sin modificarlas.
- Configurar TLS/reverse proxy real, dominio y DNS; la configuración Compose no instala certificados ni infraestructura.
- Crear credenciales SMTP de aplicación y verificar entrega con un destinatario autorizado.
- Configurar `FLORARTE_TEST_DB_PASSWORD` en GitHub Actions y observar ejecución remota de los dos jobs backend.
- Aprobar roles PostgreSQL de mínimo privilegio, definir gestión externa/rotación de secretos y probar restauración en un entorno aislado.
- Completar auditoría por recurso, pruebas de carga y seguridad de infraestructura; esta fase no es una certificación ni un pentest.

Los contenedores existentes conservan la imagen anterior. No hay despliegue AWS, publicación de imágenes, CD ni ejecución remota de GitHub Actions verificados.

## 9. Despliegue, reversión y backups

Los comandos siguientes son procedimientos para un host de producción planificado; no se ejecutaron aquí. Use un proyecto Compose dedicado (`florarte-prod`) para que su volumen tenga un nombre distinto al proyecto activo `florarte`. Mantenga el archivo de variables fuera del repositorio y restrinja sus permisos. `compose.prod.yaml` exige `FLORARTE_IMAGE_TAG` y asigna esa etiqueta a backend y frontend; el pipeline actual solo construye imágenes CI y no las publica a un registry.

Preflight y despliegue inicial de una instalación nueva:

```bash
export FLORARTE_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
docker compose -p florarte-prod -f compose.yaml -f compose.prod.yaml config --quiet
docker compose -p florarte-prod -f compose.yaml -f compose.prod.yaml build backend frontend
# Solo en volumen nuevo y para una sola ejecución, añadir -f compose.bootstrap.yaml.
docker compose -p florarte-prod -f compose.yaml -f compose.prod.yaml up -d
```

Para un primer administrador, añadir `-f compose.bootstrap.yaml` únicamente al `up` inicial, comprobar que la creación terminó y retirar ese override en el siguiente arranque. Antes de actualizar una instalación existente, exportar backup, comprobar las cuentas existentes y confirmar la versión de imagen que se usará. No reutilizar el volumen actual de desarrollo como volumen de producción.

Backup lógico PostgreSQL en formato custom, en una ruta privada del host:

```bash
umask 077
set -o noclobber
backup_file="/ruta/privada/florarte-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose -p florarte-prod -f compose.yaml -f compose.prod.yaml exec -T db \
  sh -ec 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U florarte_app -d florarte -Fc' \
  > "$backup_file"
pg_restore --list "$backup_file" >/dev/null
```

Guardar el archivo fuera del host de la base, cifrarlo en reposo, aplicar retención y registrar su checksum sin publicar el dump. La restauración debe ensayarse en un clúster y una base separados, vacíos y aislados:

```bash
case "$FLORARTE_RESTORE_DB" in florarte_restore_*) ;; *) exit 1 ;; esac
createdb --maintenance-db="$FLORARTE_RESTORE_ADMIN_URL" "$FLORARTE_RESTORE_DB"
pg_restore --exit-on-error --no-owner --no-privileges \
  --dbname="$FLORARTE_RESTORE_DB_URL" "$backup_file"
```

`FLORARTE_RESTORE_ADMIN_URL` y `FLORARTE_RESTORE_DB_URL` deben apuntar al clúster de recuperación aislado; la base destino debe llamarse `florarte_restore_*`, nunca `florarte`. No usar `--clean` ni restaurar sobre la base productiva activa. Validar Flyway, conteos funcionales y acceso de la aplicación en el entorno aislado antes de planificar un cambio de conexión. La restauración y la recuperación ante desastre no se han probado en esta tarea.

Reversión de aplicación: seleccionar la etiqueta anterior en `FLORARTE_IMAGE_TAG`, ejecutar `docker compose ... config --quiet` y actualizar los servicios de aplicación sin bajar ni borrar volúmenes. Mantener las migraciones hacia delante si la versión anterior es compatible con el esquema expandido. No deshacer migraciones manualmente; si el esquema requiere volver atrás, restaurar el backup en una base paralela y validar antes de cambiar el destino. No se configuró un registry ni una reversión automática.

## 10. Configuración externa y checklist de producción

- [ ] Crear infraestructura AWS, red privada, almacenamiento y política de IAM; no hay cuenta, región ni despliegue AWS verificado.
- [ ] Configurar dominio, proxy inverso y TLS público; `compose.prod.yaml` solo exige orígenes HTTPS y no instala certificados.
- [ ] Crear credenciales SMTP de aplicación, verificar remitente y entregar un correo de prueba autorizado.
- [ ] Añadir el secret `FLORARTE_TEST_DB_PASSWORD` en GitHub Actions. El pipeline genera `JWT_SECRET` y `AUTH_CODE_SECRET` efímeros; no requiere guardarlos en GitHub.
- [ ] Observar CI remoto, incluidos los dos jobs backend; no hay ejecución GitHub remota verificada en esta revisión.
- [ ] Resolver la revisión de hashes de cuentas demo V4 en una instalación ya migrada; el perfil `prod` falla de forma cerrada mientras permanezcan.
- [ ] Definir secretos de producción en un gestor externo, rotación, retención, alertas y recuperación de acceso.
- [ ] Aprobar roles PostgreSQL de mínimo privilegio, ejecutar backup y restauración de ensayo, y verificar monitoreo, carga y recuperación.
- [ ] Ejecutar Compose con proyecto y volumen nuevos, usar una etiqueta de imagen inmutable y completar bootstrap de administrador una sola vez.

## 11. Referencias de diseño

Código real: config/SemillasProduccion, config/ProduccionSegura, config/PrimerAdministradorConfig, services/PrimerAdministradorService, services/UserService, jwt/JwtAuthenticationFilter, migraciones V18/V19 y tests.

El uso de callbacks transaccionales se contrastó con la documentación oficial de Flyway: https://documentation.red-gate.com/flyway/reference/usage/api-java/api-hooks . Las garantías concretas se verificaron con PostgreSQL 17; no se dedujeron únicamente de esa documentación.

## 12. Archivos preparados (modificados o nuevos)

- Modificado: [.github/workflows/backend-ci.yml](.github/workflows/backend-ci.yml).
- Modificado: [.gitignore](.gitignore).
- Modificado: [Flor_Arte_Backend/.env.example](Flor_Arte_Backend/.env.example).
- Modificado: [Flor_Arte_Backend/.gitignore](Flor_Arte_Backend/.gitignore).
- Nuevo: [Flor_Arte_Backend/src/main/java/com/florarte/backend/config/PrimerAdministradorConfig.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/config/PrimerAdministradorConfig.java).
- Nuevo: [Flor_Arte_Backend/src/main/java/com/florarte/backend/config/ProduccionSegura.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/config/ProduccionSegura.java).
- Nuevo: [Flor_Arte_Backend/src/main/java/com/florarte/backend/config/SemillasProduccion.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/config/SemillasProduccion.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/controllers/UserController.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/controllers/UserController.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/exceptions/GlobalExceptionHandler.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/exceptions/GlobalExceptionHandler.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/jwt/JwtAuthenticationFilter.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/jwt/JwtAuthenticationFilter.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/jwt/JwtUtil.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/jwt/JwtUtil.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/repositories/UserRepository.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/repositories/UserRepository.java).
- Nuevo: [Flor_Arte_Backend/src/main/java/com/florarte/backend/services/PrimerAdministradorService.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/services/PrimerAdministradorService.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/services/ReglasEdicion.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/services/ReglasEdicion.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/services/SecretosAuth.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/services/SecretosAuth.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/services/UserService.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/services/UserService.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/services/RecuperacionService.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/services/RecuperacionService.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/utils/GenerarHash.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/utils/GenerarHash.java).
- Modificado: [Flor_Arte_Backend/src/main/java/com/florarte/backend/dtos/NewUserDto.java](Flor_Arte_Backend/src/main/java/com/florarte/backend/dtos/NewUserDto.java).
- Nuevo: [Flor_Arte_Backend/src/main/resources/application-prod.properties](Flor_Arte_Backend/src/main/resources/application-prod.properties).
- Modificado: [Flor_Arte_Backend/src/main/resources/application.properties](Flor_Arte_Backend/src/main/resources/application.properties).
- Modificado: [Flor_Arte_Backend/src/main/resources/auth-mail.properties](Flor_Arte_Backend/src/main/resources/auth-mail.properties).
- Nuevo: [Flor_Arte_Backend/src/main/resources/db/migration/V19__revocar_accesos_por_cambio_de_rol.sql](Flor_Arte_Backend/src/main/resources/db/migration/V19__revocar_accesos_por_cambio_de_rol.sql).
- Modificado: [Flor_Arte_Backend/src/test/java/com/florarte/backend/FlorArteBackendApplicationTests.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/FlorArteBackendApplicationTests.java).
- Modificado: [Flor_Arte_Backend/src/test/java/com/florarte/backend/SeguridadCorreoIntegrationTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/SeguridadCorreoIntegrationTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/config/InicializacionProduccionTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/config/InicializacionProduccionTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/config/PrimerAdministradorConfigTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/config/PrimerAdministradorConfigTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/config/ProduccionArranqueIntegrationTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/config/ProduccionArranqueIntegrationTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/config/ProduccionSeguraTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/config/ProduccionSeguraTest.java).
- Modificado: [Flor_Arte_Backend/src/test/java/com/florarte/backend/controllers/GestionTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/controllers/GestionTest.java).
- Modificado: [Flor_Arte_Backend/src/test/java/com/florarte/backend/services/ArregloTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/services/ArregloTest.java).
- Modificado: [Flor_Arte_Backend/src/test/java/com/florarte/backend/services/EventoTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/services/EventoTest.java).
- Modificado: [Flor_Arte_Backend/src/test/java/com/florarte/backend/services/ReporteTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/services/ReporteTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/support/PostgresTemporal.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/support/PostgresTemporal.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/support/PostgresTemporalTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/support/PostgresTemporalTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/jwt/JwtUtilTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/jwt/JwtUtilTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/java/com/florarte/backend/services/UserServicePasswordTest.java](Flor_Arte_Backend/src/test/java/com/florarte/backend/services/UserServicePasswordTest.java).
- Nuevo: [Flor_Arte_Backend/src/test/resources/junit-platform.properties](Flor_Arte_Backend/src/test/resources/junit-platform.properties).
- Nuevo: [compose.bootstrap.yaml](compose.bootstrap.yaml).
- Nuevo: [compose.prod.yaml](compose.prod.yaml).
- Modificado: [compose.yaml](compose.yaml).
- Nuevo: [scripts/comprobar-integraciones.py](scripts/comprobar-integraciones.py).
- Nuevo: [scripts/generar-hash-bootstrap.py](scripts/generar-hash-bootstrap.py).
- Nuevo: [scripts/test_verificador_postgres.py](scripts/test_verificador_postgres.py).
- Nuevo: [scripts/verificar-postgres-temporal.py](scripts/verificar-postgres-temporal.py).
