# FlorArte: pruebas automaticas en GitHub Actions

Configuracion preparada en `feature/seguridad-produccion`. La ejecucion en GitHub queda pendiente de publicar los archivos y configurar el secret de pruebas. No hay despliegue a AWS ni publicacion de imagenes.

## Activacion y jobs

`.github/workflows/backend-ci.yml` se activa con cualquier push a `feature/seguridad-produccion`, `develop` o `main`, y con pull requests dirigidos a `develop` o `main`. No filtra por rutas, para que un cambio no deje pendiente el chequeo obligatorio del backend. Tambien admite `workflow_dispatch`.

1. **Validar workflows y verificadores**: valida todos los workflows con actionlint 1.7.12, cuya descarga se contrasta con SHA-256; ejecuta los 22 tests Python; detecta archivos privados versionados y comprueba que existe el secret exclusivo de CI. Este job no ejecuta una suite Maven parcial.
2. **Suite completa Java 21 y PostgreSQL 17**: depende del primero. Instala Temurin 21, verifica el servicio PostgreSQL y ejecuta todas las pruebas con Maven Wrapper:

   ```bash
   ./mvnw -B -ntp \
     -Dflorarte.test.db=jdbc:postgresql://127.0.0.1:5544/florarte_test \
     clean verify
   ```

Los dos jobs usan runners hospedados `ubuntu-24.04`. No dependen de Docker, PostgreSQL ni variables de la computadora de desarrollo. El cache Maven guarda dependencias, no `target/`.

Los workflows de frontend y Docker tambien reconocen pushes a esta rama, respetando sus filtros de rutas. Docker solo construye imagenes (`push: false`); se corrigio el scope de su cache de backend. La construccion de la imagen no sustituye el chequeo obligatorio de la suite completa.

## PostgreSQL exclusivo de CI

| Configuracion | Valor |
|---|---|
| Servicio GitHub Actions | `postgres`, recreado para cada job |
| Imagen | `postgres:17` |
| Base y usuario | `florarte_test` |
| Puerto publicado | `127.0.0.1:5544:5432` |
| Almacenamiento | `tmpfs` en `/var/lib/postgresql/data`, limite 512 MiB |
| Montajes persistentes o bind mounts | Ninguno |
| Disponibilidad | Healthcheck TCP con `pg_isready` |
| URL permitida para Maven | `jdbc:postgresql://127.0.0.1:5544/florarte_test` |

GitHub administra la creacion y retirada del servicio en su runner desechable. No se ejecuta Compose ni se referencia el proyecto principal FlorArte. El nombre local `florarte-pg-test` no es necesario en CI: el verificador recibe el ID completo de `${{ job.services.postgres.id }}` con `--github-actions`.

El script `scripts/verificar-postgres-temporal.py` exige `GITHUB_ACTIONS=true`, ID coincidente, imagen 17, base/usuario correctos, puerto correspondiente y ausencia de montajes principales/bind. Exporta `FLORARTE_TEST_DB_SYSTEM_IDENTIFIER` y `FLORARTE_TEST_DB_CONTAINER_ID` mediante `$GITHUB_ENV`; ambos son metadatos de identidad, no contraseñas. `PostgresTemporal.java` conserva todas sus verificaciones JDBC antes de vaciar el esquema y la comprobacion de identidad de Hikari para cada conexion fisica nueva.

`DB_URL` apunta por defecto a `127.0.0.1:1/florarte_test`. Solo las propiedades dinamicas del auxiliar habilitan el destino verificado. No se usan credenciales SMTP reales.

## Secretos y archivos privados

En **Settings > Secrets and variables > Actions > New repository secret**, crear:

| Nombre | Contenido |
|---|---|
| `FLORARTE_TEST_DB_PASSWORD` | Una contraseña aleatoria exclusiva de CI; nunca una contraseña local ni de produccion |

El servicio recibe ese secret como `POSTGRES_PASSWORD`; Maven lo recibe como `FLORARTE_TEST_DB_PASSWORD`. No escribir su valor en YAML, comandos con argumentos literales, issues, logs, `.env.example` ni archivos del repositorio. El job de validacion falla con un mensaje explicito si falta el secret o solo contiene espacios.

`JWT_SECRET` y `AUTH_CODE_SECRET` se generan independientemente con OpenSSL en cada job: 32 bytes aleatorios cada uno, enmascarados con `::add-mask::` antes de exportarlos por `$GITHUB_ENV`. No requieren secrets adicionales en GitHub. Los identificadores del cluster se obtienen del servicio real; no configurarlos a mano como secrets o variables fijas.

Los `.gitignore` y `.dockerignore` excluyen `.env` y `.env.*`, salvo plantillas `.env.example`. El control de CI detecta `.env` privados, `.key`, `.pem`, `secrets/` y `.aws/` versionados. Este control ocurre despues del push: revisar el contenido del commit antes de publicarlo y conservar las credenciales fuera del repositorio. No es un scanner exhaustivo de secretos ni revisa el historial Git.

No se suben los reportes Surefire originales, sus propiedades, excepciones, salidas de pruebas ni dumps. El unico artefacto de este workflow es `backend-test-summary`, con un JSON de contadores numericos y un indicador booleano, retenido siete dias. El cache y los artefactos Docker tampoco reciben `.env`, excluidos de los contextos de construccion.

GitHub no entrega secrets a pull requests de forks ni a eventos de Dependabot. En esos casos la validacion falla por secret ausente; no se declara la suite aprobada. Una persona mantenedora debe revisar el codigo y probarlo desde una rama de confianza en el repositorio principal. No habilitar `pull_request_target` para ejecutar codigo no confiable con secrets. Si el repositorio usa Dependabot, gestionar por separado su secret de pruebas y politica de confianza antes de habilitar esas ejecuciones.

## Fallos, omisiones y artefactos

Maven conserva su codigo de salida: no hay `continue-on-error`, `testFailureIgnore`, filtros `-Dtest`, `skipTests` ni conversiones de errores en exito en el job de pruebas.

`scripts/comprobar-integraciones.py` se ejecuta tambien despues de un fallo. Exige reportes XML validos, las ocho integraciones obligatorias y al menos 159 pruebas en total; rechaza fallos, errores u omisiones de cualquier reporte, incluidas las pruebas unitarias. `clean` evita aceptar resultados antiguos. El JSON indica `valid: false` si la suite esta incompleta o falla. El upload del resumen no convierte en exito un paso Maven fallido.

El minimo 159 corresponde a la suite actual. Los tests nuevos pueden aumentar el total automaticamente; una reduccion intencional requiere revisar la suite y este umbral, sin usarlo para ocultar pruebas fallidas u omitidas.

## Comprobaciones locales de esta revision

- actionlint 1.7.12: los tres workflows aprobados; binario verificado por SHA-256. ShellCheck no esta instalado localmente; se comprobaron ademas los bloques Bash con `bash -n` y los pasos de secretos/archivos con casos controlados. actionlint puede usar ShellCheck en el runner Ubuntu donde esta disponible.
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`: 22 aprobadas. Incluye identidad de servicios de CI, rechazos de base principal/montajes/puertos, fallos, errores, omisiones, reportes invalidos y resumen sin contenido privado.
- `clean verify` local contra el contenedor temporal verificado, usando ademas `--github-actions` con ID completo y un contexto simulado: `BUILD SUCCESS`, 159 pruebas, 0 fallos, 0 errores, 0 omitidas, 20 clases. Esta comprobacion no es una ejecucion remota de GitHub Actions.
- Fallo Maven controlado: una prueba deliberadamente fallida en un proyecto temporal bajo `/tmp`, usando una copia del mismo `pom.xml` y el mismo Wrapper; `BUILD FAILURE` y codigo de salida 1. No se alteraron las pruebas del backend.
- Controles de archivos privados y secret ausente/blanco: rechazos comprobados. Generacion y enmascaramiento de JWT/OTP comprobados sin imprimir los valores.
- Revision dirigida de patrones de claves privadas, AWS y GitHub en 321 archivos versionados o preparados: sin coincidencias. Esta comprobacion no garantiza detectar contraseñas arbitrarias ni reemplaza revisar el commit.
- `git diff --check`: aprobado.

La ejecucion real del servicio y de las acciones en GitHub sigue pendiente. No se configura un runner local como equivalente al runner remoto.

## Archivos de esta revision

| Archivo modificado o nuevo | Cambio |
|---|---|
| `.github/workflows/backend-ci.yml` | Activacion en la feature, validacion previa, suite completa con PostgreSQL temporal y artefacto de contadores |
| `.github/workflows/frontend-ci.yml` | Activacion de pushes de la feature, conservando filtros de rutas |
| `.github/workflows/docker-ci.yml` | Activacion de la feature y correccion de scope en el cache de backend |
| `scripts/comprobar-integraciones.py` | Control global de fallos/errores/omisiones, minimo 159, XML validos y resumen sin salidas privadas |
| `scripts/test_comprobar_integraciones.py` | Nuevo: regresiones de la validacion de reportes y del resumen |
| `scripts/test_verificador_postgres.py` | Cobertura adicional de identidad y bloqueos en modo GitHub Actions |
| `CI_GITHUB_ACTIONS.md` | Nuevo: configuracion, evidencias, limitaciones e instrucciones de publicacion |
| `SEGURIDAD_PRODUCCION_FASE3.md` | Referencia al flujo actual y actualizacion del estado de actionlint |

Tambien se revisaron, sin modificarlos: `PostgresTemporal.java`, `scripts/verificar-postgres-temporal.py`, `pom.xml`, configuracion del Maven Wrapper y JUnit, Dockerfiles, plantillas `.env.example`, reglas `.gitignore` y `.dockerignore`. Se conservaron los demas cambios de Fase 3 que ya estaban en el arbol de trabajo. No se hicieron commits, push ni despliegues.

## Publicar y comprobar

1. Crear el secret anterior y comprobar que GitHub Actions esta habilitado para el repositorio. Sus politicas deben permitir las acciones utilizadas, servicios Docker y descarga de la herramienta actionlint.
2. Revisar `git status --short` y seleccionar explicitamente los archivos de Fase 3 que se van a publicar. Hay archivos nuevos de backend, migraciones, tests y scripts que necesitan estar incluidos: consultar `SEGURIDAD_PRODUCCION_FASE3.md`, seccion 12. Publicar solo los YAML sin sus archivos de soporte producira un fallo de CI.
3. Preparar el commit manualmente. Usar `git add -- <rutas-revisadas>` para archivos nuevos y `git add -p` para cambios existentes. Revisar `git diff --cached --name-only` y `git diff --cached`; no agregar archivos `.env` con `-f`.
4. Ejecutar manualmente, una vez revisado el contenido:

   ```bash
   git diff --cached --check
   git commit -m "ci: ejecutar suite completa con PostgreSQL temporal verificado"
   git push -u origin feature/seguridad-produccion
   ```

5. En **Actions > FlorArte - Backend CI**, abrir la ejecucion del push y comprobar el SHA/rama, ambos jobs verdes, `Tests run: 159, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` y el artefacto `backend-test-summary` con `valid: true` y `passed: 159`. Un total mayor es valido si se añadieron pruebas.
6. Abrir el PR hacia `develop` o `main` y comprobar otra ejecucion correcta. Configurar los dos checks actuales como obligatorios en la proteccion de la rama, actualizando nombres de checks anteriores si estaban registrados.

`Run workflow` requiere que el workflow con `workflow_dispatch` exista en la rama predeterminada. Para la primera comprobacion de esta feature usar el push automatico; cuando este disponible la ejecucion manual, seleccionar expresamente `feature/seguridad-produccion`.

Referencias: [servicios PostgreSQL de GitHub Actions](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers), [secrets y restricciones de forks/Dependabot](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [actionlint 1.7.12](https://github.com/rhysd/actionlint/releases/tag/v1.7.12).
