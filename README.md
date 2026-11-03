# idrd

CLI **no oficial** del [Portal Ciudadano del IDRD](https://portalciudadano.idrd.gov.co) (Bogotá) para canchas públicas: ver disponibilidad real, reservar y obtener el link de pago PSE. Hecho para que un agente lo opere y una persona lo supervise.

> No está afiliado al IDRD. Usa tu propia cuenta del portal. Las reservas **no se pueden cancelar**: el CLI nunca reserva sin una confirmación explícita.

## Instalar

```bash
git clone https://github.com/huayaney-exe/portal-ciudadano-cli.git
cd portal-ciudadano-cli
bun install
bun run build     # genera dist/idrd.js (corre con Node >= 20, no necesita Bun)
npm link          # deja `idrd` en tu PATH
idrd doctor
```

## Uso rápido

```bash
idrd find --date vie --from 6 --to 9            # horas libres de tenis en todas las canchas
idrd find --sport padel --date sab               # pádel, pickleball, synthetic, natural
idrd slot list 11537 --date mie --free           # una cancha en detalle
idrd court get 11537                             # dirección, superficie, reglas clave

idrd auth login --email tu@correo.com            # pide la contraseña sin mostrarla; no la guarda
idrd booking create 11537 --date vie --hour 16   # VISTA PREVIA: no reserva nada
idrd booking create 11537 --date vie --hour 16 --yes --confirm 11537@2026-11-06T16x1   # reserva real
idrd pay pse <bookingId> --bank 1007 --yes       # si cobra: link de pago PSE
```

Fechas: `YYYY-MM-DD`, `hoy`, `mañana` o un día (`lun`, `mar`, `mie`, `jue`, `vie`, `sab`, `dom` → próxima ocurrencia).
Horas: `6`, `6am`, `"6:00 AM"`, `18`, `6pm`.

## Cómo protege una reserva

1. **Vista previa por defecto.** Sin `--yes`, `booking create` solo muestra qué haría y verifica en vivo: disponibilidad (lo reservable menos lo ya reservado), reglas del portal (máx. 2 h seguidas, 24 h de anticipación, solo la semana publicada), sesión y killswitch.
2. **Doble confirmación.** Para ejecutar hacen falta `--yes` **y** `--confirm <intent>`, donde el intent lo imprime la vista previa y amarra cancha, fecha, hora y duración.
3. **Auditoría antes de llamar.** Cada escritura deja un registro `pending` en `~/.idrd/audit/` *antes* de llamar al portal, y luego `ok` o `error`.
4. **Killswitch.** `idrd killswitch on` bloquea toda reserva y pago, sin importar los flags.
5. **El pago lo haces tú.** Si la reserva es gratis, se confirma sola. Si cobra, recibes el `bank_url` de PSE y pagas en tu banco.

## Para agentes

- Salida JSON automática cuando stdout no es una terminal (o `--json`). Un objeto por ejecución:
  `{ok, schemaVersion, command, data, nextSteps[]}` / `{ok:false, error:{code, message, hint}}`.
- `idrd schema` devuelve el contrato completo y versionado.
- Códigos de salida: `0` ok · `2` uso/regla · `3` sesión · `4` no existe · `5` rechazado (aprobación, killswitch, horario ocupado) · `6` portal/red.
- Nunca pregunta en modo no interactivo: falla con un error estructurado.
- Contraseña sin TTY: `IDRD_PASSWORD=… idrd auth login --email …` o `--password-stdin`.
- Login: el portal usa un cliente OAuth web público (el mismo que recibe cualquier navegador). El CLI lo descubre del frontend del portal y lo cachea una semana; se puede fijar con `IDRD_CLIENT_ID` / `IDRD_CLIENT_SECRET`.
- Manual completo: [`skills/idrd/SKILL.md`](skills/idrd/SKILL.md) (instalable con `npx skills add huayaney-exe/portal-ciudadano-cli`).

## Archivos locales

`~/.idrd/` (o `IDRD_HOME`): `config.json` (solo tu correo), `web-client.json` (config pública de login del portal, caché 0600), `sessions/<perfil>/current.json` (token, 0600), `bookings/<perfil>/` (reservas creadas aquí, 0600), `audit/AAAA-MM-DD.jsonl`, `KILLSWITCH`.

## Primera reserva real (pendiente)

Todo el flujo de escritura está implementado según el código del propio portal y cubierto por pruebas contra un simulador, pero **todavía no se ha ejecutado una reserva real**. La primera vez:

```bash
idrd auth login --email tu@correo.com
idrd booking create <id> --date <día> --hour <h>      # revisa que todos los checks estén en verde
idrd booking create … --yes --confirm <intent>
cat ~/.idrd/bookings/default/*.json                    # respuesta real del portal: confirma la forma
```

Si algo no coincide, el error trae el mensaje del portal y el audit log queda con el detalle.

## Desarrollo

```bash
bun run check     # typecheck + 66 pruebas + build
bun run dev -- find --date vie
```

Diseño, decisiones y lo verificado vs. no verificado: [`DESIGN.md`](DESIGN.md). Reconocimiento del portal: [`docs/recon.md`](docs/recon.md). Bitácora de fricción: [`friction.md`](friction.md).

## Licencia

MIT. Proyecto personal no oficial; no está afiliado ni respaldado por el IDRD.
