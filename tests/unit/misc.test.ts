import { describe, expect, test } from "bun:test";
import { parseArgs } from "../../src/core/args.ts";
import { cleanBlock, cleanText } from "../../src/core/sanitize.ts";
import { exitCodeFor } from "../../src/core/errors.ts";
import { normalizeBooking, paymentPayload } from "../../src/idrd/payment.ts";

describe("args", () => {
  test("a boolean flag does not swallow the next positional", () => {
    const a = parseArgs(["court", "get", "--json", "11537"]);
    expect(a._).toEqual(["court", "get", "11537"]);
    expect(a.json).toBe(true);
  });
  test("value flags and kebab-case", () => {
    const a = parseArgs(["find", "--date", "vie", "--dry-run", "--from=6"]);
    expect(a).toMatchObject({ date: "vie", dryRun: true, from: "6" });
  });
});

describe("sanitize", () => {
  test("repairs double-encoded UTF-8 from the portal", () => {
    expect(cleanText("CANCHA DE TENNIS NÂ° 1")).toBe("CANCHA DE TENNIS N° 1");
    expect(cleanText("PEÃ‘ALOSA")).toBe("PEÑALOSA");
    expect(cleanText("Engativá")).toBe("Engativá");
  });
  test("strips escapes and bidi controls from untrusted text", () => {
    expect(cleanText("a\u001b[31mb‮c\u0007d")).toBe("abcd");
  });
  test("caps length", () => {
    expect(cleanText("x".repeat(50), 10)).toHaveLength(10);
    expect(cleanBlock("line1\n\n\n\nline2")).toBe("line1\n\nline2");
  });
});

test("exit codes by error family", () => {
  expect(exitCodeFor("usage/bad-date")).toBe(2);
  expect(exitCodeFor("auth/required")).toBe(3);
  expect(exitCodeFor("not-found/booking")).toBe(4);
  expect(exitCodeFor("approval/required")).toBe(5);
  expect(exitCodeFor("slot/unavailable")).toBe(5);
  expect(exitCodeFor("upstream/error")).toBe(6);
  expect(exitCodeFor("weird")).toBe(1);
});

describe("payment payload", () => {
  const raw = { booking_id: 77, amount: 12000, name: "Ana", surname: "Ruiz", phone: 3001234567, email: "a@b.co", address: "Cl 1", document_type_id: "CE", document: "123", park_id: 5, service_id: 9, concept: "Tenis 1h", person_type_id: "N", created_at: "2099-01-01T00:00:00Z" };
  const ctx = { courtId: 11537, date: "2026-11-05", startHour: "4:00 PM", finalHour: "5:00 PM" };
  test("paid booking maps to the portal's own field names", () => {
    const b = normalizeBooking(raw, ctx);
    expect(b).toMatchObject({ bookingId: "77", amount: 12000, free: false });
    const p = paymentPayload(b, { bankCode: "1007", ip: "190.1.2.3" });
    expect(p).toMatchObject({ reservationId: 77, totalPay: 12000, BankTypeSelected: "1007", documentPayer: "123", phone: "3001234567", parkSelected: 5, serviceParkSelected: 9, ip_address: "190.1.2.3" });
  });
  test("free booking forces bank 0 and total 0", () => {
    const b = normalizeBooking({ ...raw, amount: 0 }, ctx);
    expect(b.free).toBe(true);
    expect(paymentPayload(b, { bankCode: "1007", ip: "1.1.1.1" })).toMatchObject({ BankTypeSelected: "0", totalPay: 0 });
  });
  test("a response without an id is rejected", () => {
    expect(() => normalizeBooking({ amount: 0 }, ctx)).toThrow();
  });
});
