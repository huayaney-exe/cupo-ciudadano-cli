import { approveGate } from "../cli/agent/trust-ladder.js";
import { beginAudit } from "../cli/foundation/audit-lifecycle.js";
import { getKillswitchState } from "../cli/safety/killswitch.js";
import { bold, danger, dim, muted, ok, strong, warn } from "../cli/platform/style.js";
import { positional, requireStr, str } from "../core/args.js";
import { AppError, fail } from "../core/errors.js";
import { appHome, paths, profileName } from "../core/paths.js";
import { table } from "../core/table.js";
import {
  getActivity, listActivities, listBeneficiaries, listCategories, listPrograms, listProfiles, listStages, listSubscriptions, subscribe, unsubscribe, type Activity,
} from "../idrd/api.js";
import { accessToken } from "../idrd/auth.js";
import type { Ctx } from "./context.js";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function ids(ctx: Ctx, key: string): number[] | undefined {
  const v = str(ctx.args, key);
  if (!v) return undefined;
  const out = v.split(",").map((x) => Number(x.trim()));
  if (out.some((n) => !Number.isInteger(n) || n <= 0)) fail("usage/bad-arg", `--${key} debe ser una lista de ids, ej. 43,27.`);
  return out;
}

function activityId(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) fail("usage/bad-id", `Id de actividad inválido: ${raw}.`, "Usa el id de `cupo idrd activity list`.");
  return n;
}

/**
 * Schools and programs with enrolment (Escuelas de mi Barrio, Deporte de 0 a
 * 100, …). The portal filters by program and stage server-side; text, price,
 * age and remaining places are filtered here after reading every page.
 */
export async function activityList(ctx: Ctx) {
  let acts = await listActivities({ programIds: ids(ctx, "program"), stageIds: ids(ctx, "stage") });
  const text = str(ctx.args, "text") ?? str(ctx.args, "q");
  if (text) acts = acts.filter((a) => fold(`${a.name} ${a.program} ${a.stage} ${a.parkName} ${a.address}`).includes(fold(text)));
  const loc = str(ctx.args, "locality");
  if (loc) acts = acts.filter((a) => fold(`${a.stage} ${a.parkName} ${a.address}`).includes(fold(loc)));
  if (ctx.args.free) acts = acts.filter((a) => !a.paid);
  if (ctx.args.paid) acts = acts.filter((a) => a.paid);
  if (ctx.args.available) acts = acts.filter((a) => a.left > 0 && a.open && a.active);
  const age = str(ctx.args, "age") ? Number(str(ctx.args, "age")) : undefined;
  if (age !== undefined) acts = acts.filter((a) => (a.minAge ?? 0) <= age && age <= (a.maxAge ?? 200));
  acts.sort((a, b) => a.program.localeCompare(b.program) || a.name.localeCompare(b.name));
  const first = acts[0];
  return {
    data: acts,
    human: () =>
      acts.length === 0
        ? "No hay actividades con esos filtros."
        : `${bold(`Actividades: ${acts.length}`)}\n\n${table(
            ["ID", "Actividad", "Dónde", "Cuándo", "Edad", "Cupos", "Costo"],
            acts.map((a) => [
              strong(String(a.id)),
              a.name,
              a.stage || a.parkName,
              `${a.weekdays} ${a.hours}`.trim(),
              a.minAge !== null || a.maxAge !== null ? `${a.minAge ?? ""}–${a.maxAge ?? ""}` : "",
              a.left > 0 ? ok(`${a.left}/${a.quota}`) : muted(`0/${a.quota}`),
              a.paid ? `${a.rate} ${a.rateValue ?? ""}`.trim() : muted("gratis"),
            ]),
            [7, 30, 24, 28, 7, 8, 12],
          )}`,
    nextSteps: first
      ? [
          { command: `cupo idrd activity get ${first.id}`, description: "detalle, consentimientos y reglamento" },
          { command: `cupo idrd activity subscribe ${first.id} --person <profileId>`, description: "vista previa de la inscripción" },
        ]
      : [{ command: "cupo idrd activity programs", description: "ver programas con cupos" }],
  };
}

export async function activityGet(ctx: Ctx) {
  const id = activityId(positional(ctx.args, 0, "id"));
  const a = await getActivity(id);
  return {
    data: a,
    human: () =>
      [
        bold(`${a.name} · ${a.program}`),
        `${muted("Dónde")}   ${a.stage || a.parkName} · ${a.address}`,
        `${muted("Cuándo")}  ${a.weekdays} ${a.hours} · ${a.startDate.slice(0, 10)} → ${a.endDate.slice(0, 10)}`,
        `${muted("Quién")}   ${a.minAge ?? "?"}–${a.maxAge ?? "?"} años${a.disability ? " · personas en situación de discapacidad" : ""}${a.teams ? " · por equipos" : ""}`,
        `${muted("Cupos")}   ${a.left} libres de ${a.quota} · ${a.open && a.active ? ok("inscripciones abiertas") : warn("inscripciones cerradas")}`,
        `${muted("Costo")}   ${a.paid ? `${a.rate} ${a.rateValue ?? ""}` : "gratis"}`,
        a.consent.length ? dim(`  ${a.consent.length} consentimiento(s) por aceptar (ver --json)`) : "",
        a.regulations.length ? dim(`  ${a.regulations.length} reglamento(s) (ver --json)`) : "",
      ].filter(Boolean).join("\n"),
    nextSteps: [{ command: `cupo idrd activity subscribe ${id} --person <profileId>`, description: "vista previa de la inscripción" }],
  };
}

export async function activityPrograms() {
  const rows = await listPrograms();
  return {
    data: rows,
    human: () => rows.map((r) => `  ${strong(String(r.id).padEnd(4))} ${r.name}${r.count ? muted(`  (${r.count})`) : ""}`).join("\n"),
    nextSteps: [{ command: `cupo idrd activity list --program ${rows.find((r) => (r.count ?? 0) > 0)?.id ?? rows[0]?.id ?? 1}`, description: "actividades de un programa" }],
  };
}

export async function activityStages() {
  const rows = await listStages();
  return {
    data: rows,
    human: () => rows.map((r) => `  ${strong(String(r.id).padEnd(4))} ${r.name}${r.parkName ? muted(` · ${r.parkName}`) : ""}${r.count ? muted(`  (${r.count})`) : ""}`).join("\n"),
    nextSteps: [{ command: `cupo idrd activity list --stage ${rows[0]?.id ?? 1}`, description: "actividades de un escenario" }],
  };
}

export async function activityCategories() {
  const rows = await listCategories();
  return { data: rows, human: () => rows.map((r) => `  ${r.value.padEnd(22)} ${muted(r.name)}`).join("\n") };
}

export async function activityMine(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const subs = await listSubscriptions(token);
  return {
    data: subs,
    human: () => (subs.length === 0 ? "Sin inscripciones." : subs.map((s) => `  • ${JSON.stringify(s).slice(0, 160)}`).join("\n")),
  };
}

export async function profileList(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const [profiles, beneficiaries] = await Promise.all([listProfiles(token), listBeneficiaries(token).catch(() => [])]);
  const data = { profiles, beneficiaries };
  return {
    data,
    human: () =>
      profiles.length === 0
        ? "Sin perfiles. Completa tu perfil en el portal."
        : profiles.map((p) => `  ${strong(String(p.id ?? p.profile_id ?? "?").padEnd(8))} ${String(p.name ?? p.full_name ?? "")} ${muted(`doc ${String(p.document ?? "")}${p.age !== undefined ? ` · ${String(p.age)} años` : ""}${p.verified === false ? " · sin verificar" : ""}`)}`).join("\n"),
  };
}

function profileIdOf(p: Record<string, unknown>): number {
  return Number(p.id ?? p.profile_id);
}

export async function activitySubscribe(ctx: Ctx) {
  const id = activityId(positional(ctx.args, 0, "id"));
  const profileId = Number(requireStr(ctx.args, "person", "--person"));
  if (!Number.isInteger(profileId) || profileId <= 0) fail("usage/bad-arg", "--person debe ser el id numérico de `cupo idrd profile list`.");
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const intent = `activity${id}@profile${profileId}`;
  const { token } = await accessToken(ctx.flags.profile);
  const [a, profiles, subs] = await Promise.all([getActivity(id), listProfiles(token), listSubscriptions(token).catch(() => [])]);
  const person = profiles.find((p) => profileIdOf(p) === profileId);
  const age = person && person.age !== undefined && person.age !== null ? Number(person.age) : null;
  const already = subs.some((s) => Number(s.schedule_id ?? s.citizen_schedule_id ?? s.id) === id && Number(s.profile_id) === profileId);
  const k = getKillswitchState(appHome());
  const checks = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "perfil", ok: Boolean(person), detail: person ? `${String(person.name ?? "")} (${String(person.document ?? "")})` : `no encontré el perfil ${profileId} en tu cuenta` },
    { name: "verificado", ok: !person || person.verified !== false, detail: person?.verified === false ? "el perfil no está verificado" : "ok" },
    { name: "inscripciones", ok: a.open && a.active, detail: a.open && a.active ? "abiertas" : "cerradas" },
    { name: "cupos", ok: a.left > 0, detail: `${a.left} libres de ${a.quota}` },
    { name: "edad", ok: age === null || ((a.minAge ?? 0) <= age && age <= (a.maxAge ?? 200)), detail: age === null ? "sin edad en el perfil" : `${age} años (${a.minAge ?? "?"}–${a.maxAge ?? "?"})` },
    { name: "repetida", ok: !already, detail: already ? "este perfil ya está inscrito" : "no estaba inscrito" },
  ];
  const ready = checks.every((c) => c.ok);
  const summary = `${a.name} · ${a.stage || a.parkName} · ${a.weekdays} ${a.hours}`;
  const body = { profile_id: profileId, terms: true, consent: a.consent.map((c) => (c && typeof c === "object" && "id" in c ? (c as { id: unknown }).id : c)) };

  if (!live) {
    beginAudit(paths.audit(), { kind: "activity.subscribe", command: "activity subscribe", tier: "T2", profile: profileName(ctx.flags.profile), meta: { activityId: id, profileId, ready } }).dryRun();
    return {
      data: { dryRun: true, intent, ready, summary, request: { method: "POST", path: `/api/profiles/${profileId}/schedules/${id}`, body }, checks, consent: a.consent, regulations: a.regulations },
      human: () =>
        [
          bold("Vista previa — no se inscribió a nadie"),
          `${muted("Qué")}  ${summary}`,
          "",
          ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(14)} ${muted(c.detail)}`),
          "",
          a.consent.length ? warn(`! Al confirmar aceptas ${a.consent.length} consentimiento(s) y los términos del IDRD.`) : "",
          ready ? `${dim("Para inscribir de verdad:")}\n  cupo idrd activity subscribe ${id} --person ${profileId} --yes --confirm ${strong(intent)}` : danger("No se puede inscribir mientras haya checks en rojo."),
        ].filter(Boolean).join("\n"),
      nextSteps: ready ? [{ command: `cupo idrd activity subscribe ${id} --person ${profileId} --yes --confirm ${intent}`, description: "INSCRIPCIÓN REAL (se puede deshacer con activity unsubscribe)" }] : [],
    };
  }

  if (k.active) fail("safety/killswitch", "Killswitch activo: escrituras bloqueadas.", "Desactívalo con `cupo killswitch off`.");
  const failed = checks.find((c) => !c.ok);
  if (failed) fail("safety/precheck", `No inscribo: ${failed.name} — ${failed.detail}`);
  await approveGate(
    { cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } },
    { title: "Inscripción", summary },
    { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent },
  );
  const au = beginAudit(paths.audit(), { kind: "activity.subscribe", command: "activity subscribe", tier: "T2", profile: profileName(ctx.flags.profile), meta: { activityId: id, profileId } });
  try {
    const res = await subscribe(token, profileId, id, body);
    au.complete({ details: res.details });
    return {
      data: { activityId: id, profileId, message: res.message, subscriptionId: res.details },
      human: () => `${ok("✓")} ${res.message || "Preinscripción registrada."}${res.details ? ` ${muted(`(#${String(res.details)})`)}` : ""}\n  ${dim("Revisa tu correo o `cupo idrd activity mine` para el estado.")}`,
      nextSteps: [{ command: "cupo idrd activity mine", description: "ver estado de la inscripción" }],
    };
  } catch (e) {
    au.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function activityUnsubscribe(ctx: Ctx) {
  const subId = positional(ctx.args, 0, "subscriptionId");
  const { token } = await accessToken(ctx.flags.profile);
  if (getKillswitchState(appHome()).active) fail("safety/killswitch", "Killswitch activo: escrituras bloqueadas.", "Desactívalo con `cupo killswitch off`.");
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Desinscribir", summary: `inscripción ${subId}` }, { trust: "T2", yes: ctx.args.yes === true });
  const au = beginAudit(paths.audit(), { kind: "activity.unsubscribe", command: "activity unsubscribe", tier: "T2", profile: profileName(ctx.flags.profile), meta: { subscriptionId: subId } });
  try {
    await unsubscribe(token, subId);
    au.complete({});
  } catch (e) {
    au.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { subscriptionId: subId, unsubscribed: true }, human: () => `${ok("✓")} Inscripción ${subId} retirada.` };
}

export type { Activity };
