# idrd

**Los parques públicos de Bogotá desde la terminal.** Todo lo que se reserva en el [Portal Ciudadano](https://portalciudadano.idrd.gov.co) del IDRD: canchas de tenis, pádel, pickleball y fútbol, piscinas por carril, asadores, gimnasios CEFE (por hora o mensualidad) y coliseos; además las escuelas y programas deportivos con inscripción, y los pagos de tu cuenta. Busca horas libres, revisa un espacio y resérvalo con tu cuenta. Funciona para personas y para agentes de IA.

```text
$ idrd find --date vie

Tenis · 2026-11-06 · todo el día · 45 canchas revisadas

ID     Parque            Localidad  Libre
─────  ────────────────  ─────────  ───────────────
11537  SAN ANDRES        ENGATIVA   4–10 PM
11538  SAN ANDRES        ENGATIVA   4–10 PM
11592  SAN ANDRES        ENGATIVA   4–10 PM
11593  SAN ANDRES        ENGATIVA   4–7 PM, 9–10 PM
11611  FONTANAR DEL RIO  SUBA       6–10 PM
11612  FONTANAR DEL RIO  SUBA       7–10 PM

Próximos pasos:
  → idrd booking create 11537 --date 2026-11-06 --hour 16  vista previa de la reserva (no reserva nada)
```

> **Proyecto no oficial.** No está afiliado ni respaldado por el IDRD. Usa tu propia cuenta. Las reservas del portal **no se pueden cancelar**, así que el CLI nunca reserva sin que lo confirmes de forma explícita.

---

## Contenido

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Primeros pasos](#primeros-pasos)
- [Comandos](#comandos)
- [Cómo te protege al reservar](#cómo-te-protege-al-reservar)
- [Para agentes de IA](#para-agentes-de-ia)
- [Solución de problemas](#solución-de-problemas)
- [Privacidad y archivos locales](#privacidad-y-archivos-locales)
- [Estado del proyecto](#estado-del-proyecto)
- [Desarrollo](#desarrollo)

---

## Requisitos

- macOS o Linux
- [Node.js](https://nodejs.org) 20 o superior. Revísalo con `node --version`.
- Una cuenta del Portal Ciudadano, **solo para reservar**. Buscar canchas y horarios no requiere cuenta.

No necesitas Bun ni compilar nada: el repo trae el ejecutable listo en `dist/`.

## Instalación

Copia y pega el bloque completo en tu terminal:

```bash
git clone https://github.com/huayaney-exe/portal-ciudadano-cli.git
cd portal-ciudadano-cli
npm link
idrd doctor
```

`npm link` deja el comando `idrd` disponible en cualquier carpeta. `idrd doctor` confirma que todo está bien: versión de Node, conexión con el portal y estado de la sesión.

**Actualizar** a la última versión, desde la carpeta del repo:

```bash
git pull
```

**Desinstalar:**

```bash
npm unlink -g idrd-cli
```

## Primeros pasos

### 1. Buscar horas libres

En todas las canchas de tenis, un día y una franja horaria:

```bash
idrd find --date vie --from 6 --to 9
```

Otro deporte, o filtrando por localidad:

```bash
idrd find --sport padel --date sab
idrd find --date mañana --locality usaquen
```

Una cancha en detalle, y su información (dirección, superficie, reglas):

```bash
idrd slot list 11537 --date mie --free
idrd court get 11537
```

### 2. Iniciar sesión

```bash
idrd auth login --email tu@correo.com
```

Te pide la contraseña sin mostrarla en pantalla y **no la guarda**: solo se guarda el token de sesión, que dura 8 horas y se renueva solo.

### 3. Reservar

Primero la **vista previa**, que no reserva nada:

```bash
idrd booking create 11537 --date vie --hour 16
```

La vista previa verifica en vivo que el horario siga libre, que cumpla las reglas del portal y que tu sesión sea válida. Al final te muestra el comando exacto para reservar de verdad, con un código de confirmación como este:

```bash
idrd booking create 11537 --date vie --hour 16 --yes --confirm 11537@2026-11-06T16x1
```

- Si la reserva es **gratis**, queda confirmada y recibes el link del comprobante.
- Si **cobra**, elige tu banco y genera el link de pago PSE. El pago lo haces tú en tu banco:

```bash
idrd pay banks
idrd pay pse <id-de-la-reserva> --bank 1007 --yes
```

## Comandos

Tipos de espacio (`--sport`): `tennis`, `padel`, `pickleball`, `synthetic`, `natural`, `pool`, `grill`, `gym`, `coliseum` (también en español: `piscina`, `asador`, `gimnasio`, `coliseo`).

| Comando | Qué hace | ¿Cuenta? |
|---|---|---|
| `idrd find` | Busca horas libres en todos los espacios de un tipo (piscinas: carril por carril, con cupos) | No |
| `idrd slot list <id>` | Horas de un espacio en una fecha: libres, reservadas, cupos o bloques | No |
| `idrd court list` | Lista los espacios reservables de un tipo (lee todas las páginas del portal) | No |
| `idrd court get <id>` | Tipo, dirección, horario del parque, superficie, reglas; carriles o deportes | No |
| `idrd court lanes <piscina>` / `court sports <coliseo>` | Carriles de una piscina / deportes de un coliseo | No |
| `idrd auth login` / `status` / `logout` | Iniciar sesión, ver el estado, cerrar sesión | — |
| `idrd booking create <id>` | Vista previa de la reserva, o reserva real con `--yes --confirm` (`--lane` piscinas, `--sport-id` coliseos, `--document` y `--adult-*` para CEFE) | Sí |
| `idrd booking list` | Tus reservas | Sí |
| `idrd pay banks` / `pay pse <reserva>` / `pay status <código>` | Bancos PSE, link de pago, estado de un pago | No / Sí / Sí |
| `idrd pay pending` / `pay history` | Pagos pendientes e historial de tu cuenta | Sí |
| `idrd gym status` / `quote` / `availability` / `active` | Mensualidad de un gimnasio CEFE: estado, precio y vigencia, cupos | Sí |
| `idrd gym buy <gimnasio>` / `gym activate` | Compra la mensualidad (vista previa, luego `--yes --confirm`) y la activa tras pagar | Sí |
| `idrd activity list` | Escuelas y programas con inscripción; filtros por programa, sede, texto, edad, costo y cupos | No |
| `idrd activity get` / `programs` / `stages` / `categories` | Detalle, programas, sedes (los CEFE son sedes), categorías | No |
| `idrd profile list` / `activity mine` | Perfiles de tu cuenta (titular y beneficiarios) e inscripciones | Sí |
| `idrd activity subscribe <actividad> --person <perfil>` / `unsubscribe` | Inscribe un perfil (vista previa, luego `--yes --confirm`) o retira la inscripción | Sí |
| `idrd doctor` | Diagnóstico del entorno y la conexión | No |
| `idrd killswitch on` / `off` | Bloquea o desbloquea toda escritura (reservas, pagos, inscripciones) | No |
| `idrd schema` | Contrato completo en JSON, para agentes | No |

Ayuda de cualquier comando: `idrd <comando> --help`.

```bash
idrd find --sport piscina --date sab --from 6 --to 10   # cupos en todas las piscinas, carril por carril
idrd find --sport asador --date dom                     # asadores libres (bloque de día completo)
idrd slot list 16893 --lane 3 --date sab                # piscina CEFE San Cristóbal, carril 3
idrd slot list 16892 --sport-id 3 --date sab            # coliseo, baloncesto
idrd activity list --available --age 8 --free           # escuelas con cupo para un niño de 8 años
idrd activity list --stage 3                            # actividades del CEFE San Cristóbal
```

**Opciones frecuentes**

| Opción | Ejemplos | Default |
|---|---|---|
| `--date` | `2026-11-06`, `hoy`, `mañana`, `lun`, `mar`, `mie`, `jue`, `vie`, `sab`, `dom` | hoy (en `find`, mañana) |
| `--hour`, `--from`, `--to` | `6`, `6am`, `"6:00 AM"`, `18`, `6pm` | todo el día |
| `--sport` | `tennis`, `padel`, `pickleball`, `synthetic`, `natural`, `pool`, `grill`, `gym`, `coliseum` | `tennis` |
| `--hours` | canchas: `1` o `2`; otros espacios: dentro del bloque publicado; asadores: el bloque completo | `1` |
| `--lane` / `--sport-id` | piscinas: carril (`court lanes`); coliseos: deporte (`court sports`) | — |

Los nombres de día apuntan a la **próxima** ocurrencia, contando hoy. Todas las horas son de Bogotá.

Cobertura del portal (3 nov 2026, en vivo): 320 canchas, 12 piscinas, 35 asadores, 5 gimnasios, 4 coliseos; 74 actividades en 45 sedes y 29 programas.

## Cómo te protege al reservar

1. **Vista previa por defecto.** Sin `--yes`, `booking create` solo muestra lo que haría.
2. **Confirmación doble.** Para reservar de verdad necesitas `--yes` **y** `--confirm <código>`. El código lo imprime la vista previa e incluye cancha, fecha, hora y duración, así que no se puede reservar algo distinto por error.
3. **Revisión en vivo justo antes de reservar.** Se verifica que el horario siga libre, las reglas del portal (máximo 2 horas seguidas, 24 horas de anticipación, solo la semana publicada) y tu sesión.
4. **Registro antes de actuar.** Cada reserva o pago deja un registro en `~/.idrd/audit/` *antes* de llamar al portal.
5. **Killswitch.** `idrd killswitch on` bloquea cualquier reserva o pago, sin importar las opciones que se pasen.
6. **El pago es tuyo.** El CLI nunca toca tarjetas ni claves del banco. Para reservas pagas solo te entrega el link de PSE.

Reglas del portal que conviene saber: la semana se publica los **lunes a las 9:00 a.m.**, se reserva con **24 horas** de anticipación como mínimo, se permiten **máximo 2 horas por día y 4 por semana**, y **no hay devolución** por inasistencia.

## Para agentes de IA

- Si stdout no es una terminal, la salida es **JSON automático**, o con `--json`. Es un objeto por ejecución:
  - éxito: `{ok: true, schemaVersion, command, data, nextSteps[]}`
  - error: `{ok: false, error: {code, message, hint}}`
- `idrd schema` devuelve el contrato completo y versionado.
- Códigos de salida: `0` ok · `2` uso o regla · `3` falta sesión · `4` no existe · `5` rechazado (falta confirmación, killswitch, horario ocupado) · `6` portal o red.
- Nunca se queda esperando una respuesta: si falta algo, falla con un error estructurado.
- Login sin terminal: variable `IDRD_PASSWORD` u opción `--password-stdin`.
- Manual para agentes: [`skills/idrd/SKILL.md`](skills/idrd/SKILL.md). Instálalo con `npx skills add huayaney-exe/portal-ciudadano-cli`.

## Solución de problemas

**`zsh: parse error near ')'` al pegar comandos.**
Pegaste líneas que tenían comentarios (`# …`). Por defecto zsh no acepta comentarios en la terminal interactiva. Los bloques de este README no tienen comentarios. Si quieres que zsh los acepte, ejecuta `setopt interactivecomments`, o agrégalo a tu `~/.zshrc`.

**`idrd: command not found` después de `npm link`.**
La carpeta de ejecutables globales de npm no está en tu `PATH`. Revisa cuál es con `npm prefix -g`; los ejecutables quedan en `<esa ruta>/bin`, y esa carpeta tiene que estar en tu `PATH`.

**`node: command not found` o una versión menor a 20.**
Instala Node 20 o superior desde [nodejs.org](https://nodejs.org), o con `brew install node`.

**`auth/invalid-credentials`.**
El correo o la contraseña no coinciden con tu cuenta del portal. Pruébalos directamente en [portalciudadano.idrd.gov.co](https://portalciudadano.idrd.gov.co).

**`auth/web-client` o `upstream/web-client`.**
El portal cambió su configuración de login. Borra `~/.idrd/web-client.json` y vuelve a intentar. Si sigue fallando, abre un issue.

**`rule/violation` o `slot/unavailable` al reservar.**
El horario no cumple una regla del portal o ya lo tomó otra persona. El mensaje dice cuál fue el problema. Corre `idrd slot list <cancha> --date <día> --free` para ver alternativas.

**Cualquier otro error.**
`idrd doctor` muestra qué está fallando. Si agregas `DEBUG=1` antes del comando, verás el detalle técnico.

## Privacidad y archivos locales

Todo queda en tu equipo, en `~/.idrd/` (puedes cambiar la ubicación con `IDRD_HOME`):

| Archivo | Contenido |
|---|---|
| `config.json` | Solo tu correo, para no pedirlo cada vez |
| `sessions/<perfil>/current.json` | Token de sesión, permisos 0600 |
| `web-client.json` | Configuración pública de login del portal, en caché por 7 días |
| `bookings/<perfil>/` | Reservas creadas desde este equipo, permisos 0600 |
| `audit/AAAA-MM-DD.jsonl` | Registro de reservas y pagos, sin tokens |
| `KILLSWITCH` | Si existe, toda escritura queda bloqueada |

Tu contraseña **nunca** se guarda en disco. El CLI no envía datos a ningún servicio distinto del portal del IDRD, salvo una consulta a `api.ipify.org` para obtener tu IP pública, que la pasarela PSE exige al generar un pago.

## Estado del proyecto

| Parte | Estado |
|---|---|
| Buscar espacios y horarios: canchas (5 deportes), piscinas por carril, asadores, gimnasios, coliseos | ✅ Verificado contra el portal real, todas las páginas |
| Actividades, programas, sedes, categorías | ✅ Verificado contra el portal real |
| Inicio de sesión · Bancos PSE | ✅ Verificado contra el portal real |
| Crear reserva y confirmar reserva gratuita o pago PSE | 🟡 Implementado a partir del código del propio portal y cubierto por pruebas con un simulador. **Todavía no se ha ejecutado una reserva real.** |
| Mensualidad de gimnasio (estado, cotización, compra, activación) | 🟡 Igual: desde el código del portal, sin ejecutar en vivo |
| Inscripción y retiro de actividades, perfiles, pagos pendientes e historial | 🟡 Igual: desde el código del portal, sin ejecutar en vivo |
| Tope de 4 horas por semana | ℹ️ Lo valida el portal, no el CLI |
| Pago por Daviplata, calendario de recreación, programas sociales | ❌ Fuera de alcance |

Si haces la primera reserva real, tu respuesta queda guardada en `~/.idrd/bookings/`. Si algo no coincide con lo esperado, el error muestra el mensaje del portal.

## Desarrollo

Para modificar el código necesitas [Bun](https://bun.sh):

```bash
bun install
bun run check
```

`bun run check` corre el typecheck, las 66 pruebas y el build. Después de cambiar algo en `src/`, ejecuta `bun run build` y haz commit también de `dist/idrd.js`: es lo que usa quien instala sin Bun.

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
