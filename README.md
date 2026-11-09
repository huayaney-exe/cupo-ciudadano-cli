# cupo

**Consigue cupo para hacer deporte en Bogotá, desde la terminal.** Dile qué quieres hacer y cuándo; `cupo` busca en todos los sistemas de reservas públicos que conoce y te deja el cupo a un comando de distancia. Hoy cubre el [Portal Ciudadano del IDRD](https://portalciudadano.idrd.gov.co) (parques de toda la ciudad) y el [CEFE Chapinero](https://cefechapinero.com). Funciona para personas y para agentes de IA.

```text
$ cupo find --sport pool --date sab --from 6 --to 10

Piscinas · 2026-11-07 · 06:00–10:00 · IDRD · Portal Ciudadano (37) + CEFE Chapinero (2)

Dónde                                     Localidad  Libre                                 Reservar con
────────────────────────────────────────  ─────────  ────────────────────────────────────  ────────────────────────────────────────────────────────────
FONTANAR DEL RIO · CEFE - PISCINA OLIMP…  SUBA       06:00 (2) 07:00 (2) 08:00 (2) 09:00…  book idrd:17082 --date 2026-11-07 --hour 6 --lane 121
FONTANAR DEL RIO · CEFE - PISCINA OLIMP…  SUBA       06:00 (11) 07:00 (11) 08:00 (11) 09…  book idrd:17082 --date 2026-11-07 --hour 6 --lane 122
PARQUE DE LAS COMETAS · PISCINA SEMIOLI…  SUBA       06:00 (2) 08:00 (2) 09:00 (2)         book idrd:18181 --date 2026-11-07 --hour 6 --lane 100
CEFE Chapinero · Piscina Recreativa Occ…  CHAPINERO  08:00 (20) 09:00 (20)                 book cefe:5ca25176-94e5-4956-a327-8117624acc4c --date 2026-…
CEFE Chapinero · Piscina Semiolímpica     CHAPINERO  08:00 (30) 09:00 (30)                 book cefe:463e2980-59d9-4789-a6b1-7a0d035f561d --date 2026-…
Entre paréntesis: cupos cuando el espacio es compartido. `cupo book` muestra una vista previa antes de reservar.

Próximos pasos:
  → cupo book idrd:17082 --date 2026-11-07 --hour 6 --lane 121  vista previa de la reserva (no reserva nada)
```

> **Proyecto no oficial.** No está afiliado al IDRD ni al CEFE Chapinero. Usas tu propia cuenta de cada sistema. Nunca reserva ni paga sin que lo confirmes de forma explícita.

**Validado en vivo.** El 6 de noviembre de 2026 un agente de IA reservó y pagó una cancha de tenis del IDRD de punta a punta con este CLI: `find` → `book` → `pay pse` → pago PSE en Bancolombia → `pay status` con el pago **aprobado** y la reserva visible en el portal. La persona solo aprobó el pago en su banco. El detalle, y lo que sigue sin ejecutarse en vivo, está en [Estado del proyecto](#estado-del-proyecto).

---

## Contenido

- [El job](#el-job)
- [Requisitos e instalación](#requisitos-e-instalación)
- [Buscar](#buscar)
- [Reservar](#reservar)
- [Lo demás que cada sistema ofrece](#lo-demás-que-cada-sistema-ofrece)
- [Cómo te protege al reservar](#cómo-te-protege-al-reservar)
- [Para agentes de IA](#para-agentes-de-ia)
- [Solución de problemas](#solución-de-problemas)
- [Privacidad y archivos locales](#privacidad-y-archivos-locales)
- [Estado del proyecto](#estado-del-proyecto)
- [Desarrollo](#desarrollo)

---

## El job

Quieres nadar el sábado temprano, jugar tenis el viernes al salir del trabajo, o meter a tu hijo a un curso. Cada escenario público de Bogotá vive en un sistema distinto, con su propia cuenta, sus propias reglas y su propio formulario. `cupo` pone los tres pasos del job en tres comandos:

| Paso | Comando | Qué hace |
|---|---|---|
| ¿Dónde hay cupo? | `cupo find` | Busca en todos los proveedores a la vez. Cada fila trae el comando exacto para reservarla. |
| Resérvalo | `cupo book <id>` | Enruta al proveedor correcto por el id (`idrd:…` o `cefe:…`). Primero muestra una vista previa. |
| ¿Qué cubre cada sistema? | `cupo providers` | Mapa de proveedores, deportes, y si ya tienes sesión. |

Todo lo específico de cada sistema sigue disponible bajo su prefijo: `cupo idrd …` y `cupo cefe …`.

## Requisitos e instalación

- macOS o Linux, [Node.js](https://nodejs.org) 20 o superior (`node --version`).
- Buscar no requiere cuenta. Para reservar: tu cuenta del Portal Ciudadano, tu cuenta del CEFE Chapinero, o ambas.
- No necesitas Bun ni compilar: el repo trae el ejecutable listo en `dist/`.

```bash
git clone https://github.com/huayaney-exe/cupo-ciudadano-cli.git
cd cupo-ciudadano-cli
npm link
cupo doctor
```

`npm link` deja `cupo` disponible en cualquier carpeta (y `idrd`, el nombre anterior, como alias). `cupo doctor` revisa Node, la conexión con ambos proveedores y tus sesiones. Actualizar: `git pull` en la carpeta del repo. Desinstalar: `npm unlink -g cupo`.

## Buscar

```bash
cupo find --sport pool --date sab --from 6 --to 10     # nadar el sábado temprano, en todos lados
cupo find --sport tennis --date vie --from 16          # tenis el viernes en la tarde
cupo find --sport grill --date dom                     # asador el domingo
cupo find --sport pool --locality chapinero            # solo cerca de Chapinero
cupo find --sport pool --provider idrd                 # solo el IDRD
```

- `--sport`: `tennis` `padel` `pickleball` `synthetic` `natural` `pool` `grill` `gym` `coliseum` (también en español: `piscina`, `asador`, `gimnasio`, `coliseo`). Default `pool`.
- `--date`: `2026-11-07`, `hoy`, `mañana`, o `lun…dom` (próxima ocurrencia). Default mañana.
- `--from` / `--to`: `6`, `6am`, `18`, `06:30`.
- Entre paréntesis van los cupos cuando el espacio es compartido (piscinas, gimnasios). Las piscinas del IDRD se buscan carril por carril.

## Reservar

### Iniciar sesión una sola vez

```bash
cupo idrd auth login --email tu@correo.com --save
cupo cefe auth login --email tu@correo.com --save
```

La sesión del IDRD dura 8 horas y la del CEFE 12. El portal del IDRD revoca sus propios refresh tokens, así que sin más, cada 8 horas tocaría volver a escribir la contraseña. Con `--save` la contraseña queda guardada **fuera del repo y fuera de texto plano**: en el Llavero de macOS (`security`), o en `~/.cupo/env` con permisos 0600 en Linux. Desde ese momento, cuando una sesión vence, el CLI vuelve a entrar solo, también cuando lo opera un agente sin terminal. Nunca se guarda nada si no pasas `--save`, y solo se guarda después de que el portal aceptó la contraseña.

- `cupo idrd auth status` dice si hay contraseña guardada y dónde; `cupo doctor` también.
- `cupo idrd auth logout --forget` borra la contraseña guardada (igual con `cefe`).
- Si prefieres el archivo también en macOS: `CUPO_SECRETS=file`. Para prohibir guardar: `CUPO_SECRETS=none`.
- También puedes escribir el archivo a mano. El CLI lee `~/.cupo/env` (`IDRD_EMAIL`, `IDRD_PASSWORD`, `CEFE_EMAIL`, `CEFE_PASSWORD`) como si fueran variables de entorno. `chmod 600 ~/.cupo/env`; `doctor` avisa si otros usuarios pueden leerlo.

### Reservar y pagar

```bash
cupo book idrd:11537 --date vie --hour 16                    # vista previa: checks en vivo, nada se reserva
cupo book idrd:11537 --date vie --hour 16 --yes --confirm 11537@2026-11-06T16x1   # IDRD: irreversible, exige el intent
cupo book cefe:463e2980-… --date sab --time 07:15            # vista previa
cupo book cefe:463e2980-… --date sab --time 07:15 --yes      # CEFE: cancelable hasta 6 h antes
```

La vista previa corre contra el sistema real: disponibilidad en ese momento, reglas del proveedor, tu sesión, el killswitch. Solo si todo está en verde te imprime el comando para ejecutar. Las diferencias entre proveedores están en la propia salida:

| | IDRD | CEFE Chapinero |
|---|---|---|
| Sesión | `cupo idrd auth login --save` (o `IDRD_PASSWORD`); 8 h, se renueva sola con la contraseña guardada | `cupo cefe auth login --save` (o `CEFE_PASSWORD`); 12 h, igual |
| Unidad | horas en punto; piscinas por carril (`--lane`); coliseos por deporte (`--sport-id`); asadores por bloque | franjas de 60 min publicadas por la piscina (`--time 07:15`) |
| Reglas | máx. 2 h, 24 h de anticipación, semana publicada | una reserva por día, perfil completo (teléfono, estrato, nacimiento) |
| Cancelar | **no existe**: por eso exige `--yes --confirm <intent>` | hasta 6 h antes: `cupo cefe booking cancel <id> --yes` |
| Pagar | `cupo idrd pay pse <reserva> --bank <código> --yes` devuelve el link PSE; la retención dura **15 minutos**; `cupo idrd pay status <código de pago>` confirma el **Aprobado**; gratis se confirma solo | `--pay efectivo` (en la sede), `--pay wompi` (en la web), `--pay creditos`; 10.000 COP por persona desde el 5-nov-2026 |

### Una reserva paga, de punta a punta

Esta es la secuencia exacta que se ejecutó en vivo el 6-nov-2026 (cancha de tenis 3032, Cerros de Santa Bárbara Alta, domingo 17:00):

```bash
cupo idrd auth login
cupo find --sport tennis --date dom --from 17
cupo book idrd:3032 --date dom --hour 17
cupo book idrd:3032 --date dom --hour 17 --yes --confirm 3032@2026-11-08T17x1
cupo idrd pay banks
cupo idrd pay pse 875972 --bank 1007 --yes --open
cupo idrd pay status e4334d5c-da2a-11f1-b009-0242c0a81f05
```

1. La vista previa de `book` imprime el **intent** (`3032@2026-11-08T17x1`) que tienes que repetir en `--confirm`.
2. Al reservar de verdad, el portal devuelve el **número de reserva**, el **valor** y hasta qué hora queda retenido el cupo: **15 minutos** desde la creación. Si no pagas en ese tiempo, la reserva se libera sola.
3. `pay pse` crea la orden de pago en el banco que elijas (`pay banks` lista los códigos; `1007` es Bancolombia) e imprime el link PSE. Con `--open` lo abre en el navegador. Nadie más debe usar ese link.
4. Pagas en tu banco. El CLI no interviene.
5. `pay status` recibe el **código de pago** que imprimió `pay pse` (no el número de reserva) y lee el estado real en el portal: `Aprobado`. El comprobante queda en `https://portalciudadano.idrd.gov.co/app/pagos/comprobante/<código de pago>`.

Si el banco rechaza la transacción, `cupo idrd pay history` lo muestra como `FALLIDO` / `NOT_AUTHORIZED`: no se cobró nada y, pasados los 15 minutos, la reserva se libera. Para volver a intentarlo hay que reservar de nuevo con `cupo book` y generar otro link.

## Lo demás que cada sistema ofrece

`cupo providers` lo resume; `cupo idrd --help` y `cupo cefe --help` lo listan completo.

**IDRD** (`cupo idrd …`): `court list|get|lanes|sports`, `slot list|find`, `booking create|list`, `pay banks|pse|status|pending|history`, `gym status|quote|availability|active|buy|activate` (mensualidad de gimnasio CEFE), `activity list|get|programs|stages|categories|mine|subscribe|unsubscribe` (escuelas y programas), `profile list`. Cobertura verificada el 3-nov-2026: 320 canchas, 12 piscinas, 35 asadores, 5 gimnasios, 4 coliseos, 74 actividades en 45 sedes.

**CEFE Chapinero** (`cupo cefe …`): `pool list|get`, `slot list|find`, `booking create|list|cancel`, `course list|get|mine|enroll`, `class book|cancel`, `tournament list|get|mine|register|unregister`, `promo list`, `auth login|status|logout|register`, `me`. Las inscripciones a cursos y clases están deshabilitadas en la web desde julio de 2026; el CLI lo muestra como check en rojo.

## Cómo te protege al reservar

1. **Vista previa por defecto.** Sin `--yes`, `booking create` solo muestra lo que haría.
2. **Confirmación doble.** Para reservar de verdad necesitas `--yes` **y** `--confirm <código>`. El código lo imprime la vista previa e incluye cancha, fecha, hora y duración, así que no se puede reservar algo distinto por error.
3. **Revisión en vivo justo antes de reservar.** Se verifica que el horario siga libre, las reglas del portal (máximo 2 horas seguidas, 24 horas de anticipación, solo la semana publicada) y tu sesión.
4. **Registro antes de actuar.** Cada reserva o pago deja un registro en `~/.cupo/audit/` *antes* de llamar al portal.
5. **Killswitch.** `cupo killswitch on` bloquea cualquier reserva o pago, sin importar las opciones que se pasen.
6. **El pago es tuyo.** El CLI nunca toca tarjetas ni claves del banco. Para reservas pagas solo te entrega el link de PSE y, cuando quieras, lee el estado real del pago con `cupo idrd pay status <código>`.

Reglas del portal que conviene saber: la semana se publica los **lunes a las 9:00 a.m.**, se reserva con **24 horas** de anticipación como mínimo, se permiten **máximo 2 horas por día y 4 por semana**, y **no hay devolución** por inasistencia.

## Para agentes de IA

Empieza por `cupo schema`: trae `start` (los tres comandos del job), `providers` y cada comando con su `provider`. Luego `cupo providers` para saber dónde hay sesión.

- Si stdout no es una terminal, la salida es **JSON automático**, o con `--json`. Un objeto por ejecución:
  - éxito: `{ok: true, schemaVersion, command, data, nextSteps[]}`
  - error: `{ok: false, error: {code, message, hint}}`
- `nextSteps` siempre son comandos reales y ejecutables; en `cupo find`, cada resultado trae su `bookCommand`.
- Códigos de salida: `0` ok · `2` uso o regla · `3` falta sesión · `4` no existe · `5` rechazado (falta confirmación, killswitch, sin cupo) · `6` proveedor o red.
- Nunca se queda esperando: si falta algo, falla con un error estructurado. Contraseñas sin terminal: `IDRD_PASSWORD`, `CEFE_PASSWORD`, `--password-stdin`, o la guardada con `auth login --save`.
- Ante `auth/required` o `auth/expired` (salida 3), pídele a la persona que corra una vez `cupo idrd auth login --save` en su terminal. Después de eso la sesión se renueva sola y el agente no vuelve a toparse con ese error. Nunca pidas la contraseña por chat.
- El flujo completo (iniciar sesión, buscar, reservar, generar el pago y verificarlo) ya lo ejecutó un agente en vivo contra el IDRD; la persona solo eligió el banco y aprobó el pago. La secuencia está en [Una reserva paga, de punta a punta](#una-reserva-paga-de-punta-a-punta).
- Manual para agentes: [`skills/cupo/SKILL.md`](skills/cupo/SKILL.md). Instálalo con `npx skills add huayaney-exe/cupo-ciudadano-cli`.

## Solución de problemas

**`zsh: parse error near ')'` al pegar comandos.**
Pegaste líneas que tenían comentarios (`# …`). Por defecto zsh no acepta comentarios en la terminal interactiva. Los bloques de este README no tienen comentarios. Si quieres que zsh los acepte, ejecuta `setopt interactivecomments`, o agrégalo a tu `~/.zshrc`.

**`cupo: command not found` después de `npm link`.**
La carpeta de ejecutables globales de npm no está en tu `PATH`. Revisa cuál es con `npm prefix -g`; los ejecutables quedan en `<esa ruta>/bin`, y esa carpeta tiene que estar en tu `PATH`.

**`npm link` falla con `EEXIST: file already exists … /bin/idrd`.**
Tenías instalada la versión anterior, que se llamaba `idrd`. Reemplázala: `npm link --force`. Tus sesiones y reservas en `~/.idrd` se siguen usando tal cual.

**`auth/invalid-credentials` en `cupo cefe auth login`.**
El correo o la contraseña no coinciden con tu cuenta del CEFE Chapinero, que es distinta a la del IDRD. Pruébalos en [cefechapinero.com/login](https://cefechapinero.com/login).

**Me pide la contraseña cada vez.**
La sesión del IDRD dura 8 horas y el portal no deja renovarla con el refresh token. Guarda la contraseña una vez con `cupo idrd auth login --save` (Llavero de macOS o `~/.cupo/env`); desde ahí el CLI vuelve a entrar solo. `cupo idrd auth status` muestra si quedó guardada.

**`node: command not found` o una versión menor a 20.**
Instala Node 20 o superior desde [nodejs.org](https://nodejs.org), o con `brew install node`.

**`auth/invalid-credentials` en `cupo idrd auth login`.**
El correo o la contraseña no coinciden con tu cuenta del portal. Pruébalos directamente en [portalciudadano.idrd.gov.co](https://portalciudadano.idrd.gov.co).

**`auth/web-client` o `upstream/web-client`.**
El portal cambió su configuración de login. Borra `~/.cupo/web-client.json` y vuelve a intentar. Si sigue fallando, abre un issue.

**`rule/violation` o `slot/unavailable` al reservar.**
El horario no cumple una regla del portal o ya lo tomó otra persona. El mensaje dice cuál fue el problema. Corre `cupo idrd slot list <cancha> --date <día> --free` para ver alternativas.

**`upstream/error` con `HTTP 500` en `cupo idrd pay status`.**
Le pasaste el número de reserva. Ese comando recibe el **código de pago** (el UUID que imprime `pay pse`), no la reserva. Si lo perdiste, `cupo idrd pay history` lista todos tus pagos con su código.

**`cupo idrd pay history` muestra `FALLIDO` / `NOT_AUTHORIZED`.**
El banco rechazó la transacción. El CLI generó el link correctamente y no se cobró nada. La retención de la reserva vence 15 minutos después de crearla: si ya venció, vuelve a reservar con `cupo book` y genera un link nuevo.

**Cualquier otro error.**
`cupo doctor` muestra qué está fallando. Si agregas `DEBUG=1` antes del comando, verás el detalle técnico.

## Privacidad y archivos locales

Todo queda en tu equipo, en `~/.cupo/` (puedes cambiar la ubicación con `CUPO_HOME`):

| Archivo | Contenido |
|---|---|
| `config.json` | Solo tu correo, para no pedirlo cada vez |
| `env` | Solo si lo creas tú o pides `auth login --save` en Linux: `IDRD_PASSWORD`, `CEFE_PASSWORD` y correos, permisos 0600. En macOS `--save` usa el Llavero del sistema, no este archivo |
| `sessions/<perfil>/current.json` | Token de sesión, permisos 0600 |
| `web-client.json` | Configuración pública de login del portal, en caché por 7 días |
| `bookings/<perfil>/` | Reservas creadas desde este equipo, permisos 0600 |
| `audit/AAAA-MM-DD.jsonl` | Registro de reservas y pagos, sin tokens |
| `KILLSWITCH` | Si existe, toda escritura queda bloqueada |

Tu contraseña **solo** se guarda si pasas `--save`, y entonces va al Llavero de macOS o a `~/.cupo/env` con permisos 0600; `auth logout --forget` la borra. El CLI no envía datos a ningún servicio distinto del portal del IDRD, salvo una consulta a `api.ipify.org` para obtener tu IP pública, que la pasarela PSE exige al generar un pago.

## Estado del proyecto

Qué está verificado contra los sistemas reales y qué no.

| Parte | Estado |
|---|---|
| Buscar espacios y horarios: canchas (5 deportes), piscinas por carril, asadores, gimnasios, coliseos | ✅ Verificado contra el portal real, todas las páginas |
| Actividades, programas, sedes, categorías | ✅ Verificado contra el portal real |
| Inicio de sesión · Bancos PSE | ✅ Verificado contra el portal real |
| Reservar una cancha y pagarla por PSE (`book --yes --confirm`, `pay pse`, `pay status`) | ✅ **Ejecutado en vivo el 6-nov-2026**, operado por un agente: reserva de tenis creada, orden PSE con Bancolombia, pago aprobado y reserva visible en el portal. El 9-nov-2026 el banco rechazó un segundo pago: el CLI lo reportó como `FALLIDO` tal cual, no se cobró nada y la retención venció sola. |
| Tus reservas, historial y pagos pendientes (`booking list`, `pay history`, `pay pending`) | ✅ Verificados en vivo con la cuenta del autor |
| Reservar piscinas, asadores, gimnasios por hora y coliseos; confirmar reservas gratuitas | 🟡 Mismo flujo y mismas pruebas que las canchas, pero todavía sin una reserva real de esos tipos |
| Mensualidad de gimnasio (estado, cotización, compra, activación) | 🟡 Desde el código del portal, cubierto por pruebas con un simulador, sin ejecutar en vivo |
| Inscripción y retiro de actividades, perfiles | 🟡 Igual: desde el código del portal, sin ejecutar en vivo |
| Tope de 4 horas por semana | ℹ️ Lo valida el portal, no el CLI |
| Renovar la sesión del IDRD con el refresh token | ❌ Probado en vivo el 9-nov-2026: el portal responde "Token has been revoked". Por eso existe `auth login --save`, que vuelve a entrar con la contraseña guardada |
| CEFE Chapinero: piscinas, cupos, cursos, clases disponibles, promociones | ✅ Verificado contra cefechapinero.com |
| CEFE Chapinero: sesión, reservas, inscripciones, clases, torneos | 🟡 Desde el código de la web, sin ejecutar en vivo |
| Pago por Daviplata, calendario de recreación, programas sociales, pago Wompi desde el CLI | ❌ Fuera de alcance |

Cada reserva real queda guardada en `~/.cupo/bookings/` y cada reserva o pago en `~/.cupo/audit/`. Si el portal responde algo distinto a lo esperado, el error muestra su mensaje tal cual.

## Desarrollo

Para modificar el código necesitas [Bun](https://bun.sh):

```bash
bun install
bun run check
```

`bun run check` corre el typecheck, las pruebas y el build. Después de cambiar algo en `src/`, ejecuta `bun run build` y haz commit también de `dist/cupo.js`: es lo que usa quien instala sin Bun.

Para probar sin instalar:

```bash
bun run dev -- find --date vie
```

Más detalle:
- [`DESIGN.md`](DESIGN.md): decisiones de diseño, y qué está verificado y qué no.
- [`docs/recon.md`](docs/recon.md): cómo funciona la API del portal.
- [`friction.md`](friction.md): bitácora de construcción.

## Licencia

[MIT](LICENSE).