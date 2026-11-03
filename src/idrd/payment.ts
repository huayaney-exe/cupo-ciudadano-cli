import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteJson } from "../cli/foundation/atomic-write.js";
import { fail } from "../core/errors.js";
import { request } from "../core/http.js";
import { paths } from "../core/paths.js";
import { cleanText } from "../core/sanitize.js";

export const RECEIPT_BASE = "https://portalciudadano.idrd.gov.co/app/pagos/comprobante/";

/** Normalized view of the booking the portal returns from POST …/payment. */
export type BookingRecord = {
  bookingId: string;
  courtId: number;
  date: string;
  startHour: string;
  finalHour: string;
  amount: number;
  free: boolean;
  concept: string;
  parkId: unknown;
  serviceId: unknown;
  holdUntil: string | null;
  createdAt: string;
  raw: Record<string, unknown>;
};

export function normalizeBooking(raw: Record<string, unknown>, ctx: { courtId: number; date: string; startHour: string; finalHour: string }): BookingRecord {
  const id = raw.booking_id ?? raw.id ?? raw.citizen_schedule_id;
  if (id === undefined || id === null) fail("upstream/bad-booking", "El portal respondió sin id de reserva.", cleanText(JSON.stringify(raw), 200));
  const amount = Number(raw.amount ?? 0);
  return {
    bookingId: String(id),
    courtId: ctx.courtId,
    date: ctx.date,
    startHour: ctx.startHour,
    finalHour: ctx.finalHour,
    amount,
    free: amount === 0,
    concept: cleanText(raw.concept, 200),
    parkId: raw.park_id,
    serviceId: raw.service_id,
    // The portal shows a countdown from created_at to complete payment.
    holdUntil: typeof raw.created_at === "string" ? raw.created_at : null,
    createdAt: new Date().toISOString(),
    raw,
  };
}

/** Local ledger so `pay` can rebuild the payment payload after `booking create`. */
export function saveBooking(profile: string | undefined, b: BookingRecord): void {
  atomicWriteJson(join(paths.bookings(profile), `${b.bookingId}.json`), b, { mode: 0o600 });
}

export function loadBooking(profile: string | undefined, bookingId: string): BookingRecord {
  try {
    return JSON.parse(readFileSync(join(paths.bookings(profile), `${bookingId}.json`), "utf8")) as BookingRecord;
  } catch {
    return fail("not-found/booking", `No tengo registrada la reserva ${bookingId} en este equipo.`, "Solo se puede pagar una reserva creada con `idrd booking create`.");
  }
}

export function localBookings(profile?: string): BookingRecord[] {
  try {
    return readdirSync(paths.bookings(profile))
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(paths.bookings(profile), f), "utf8")) as BookingRecord);
  } catch {
    return [];
  }
}

/** The payment gateway asks for the payer's public IP. Use the real one or stop. */
export async function publicIp(): Promise<string> {
  try {
    const res = await request<{ ip?: string }>("https://api.ipify.org", "/", { query: { format: "json" }, timeoutMs: 8000, retries: 1 });
    if (res.status === 200 && res.body?.ip && /^[0-9a-f.:]+$/i.test(res.body.ip)) return res.body.ip;
  } catch {
    /* fall through */
  }
  return fail("network/no-public-ip", "No pude determinar tu IP pública, que la pasarela PSE exige.", "Revisa tu conexión y vuelve a intentar.");
}

/** Mirrors the portal's own payment form (same field names it sends). */
export function paymentPayload(b: BookingRecord, opts: { bankCode: string; ip: string }): Record<string, unknown> {
  const r = b.raw;
  const phone = r.phone === null || r.phone === undefined ? r.phone : String(r.phone);
  const person = (r.person_type_id as string) || "N";
  return {
    reservationId: r.booking_id ?? b.bookingId,
    permitTypeSelected: "PO",
    permitNumber: "999",
    name: r.name,
    lastName: r.surname,
    phone,
    email: r.email,
    address: r.address,
    documentTypeSelected: r.document_type_id,
    document: r.document,
    parkSelected: r.park_id,
    serviceParkSelected: r.service_id,
    isTheSame: true,
    documentTypeSelectedPayer: r.document_type_id,
    documentPayer: r.document,
    namePayer: r.name,
    lastNamePayer: r.surname,
    phonePayer: phone,
    emailPayer: r.email,
    addressPayer: r.address,
    concept: r.concept,
    totalPay: b.free ? 0 : b.amount,
    typePersonSelected: person,
    typePersonSelectedPayer: person,
    BankTypeSelected: b.free ? "0" : opts.bankCode,
    redirect_url: RECEIPT_BASE,
    ip_address: opts.ip,
    sport_id: null,
  };
}
