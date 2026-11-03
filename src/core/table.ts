import { bold, dim, padVisible, truncateVisible, visibleWidth } from "../cli/platform/style.js";

/** Aligned table using visible width (colored cells do not break columns). */
export function table(headers: string[], rows: string[][], maxWidths: number[] = []): string {
  const widths = headers.map((h, i) => {
    const natural = Math.max(visibleWidth(h), ...rows.map((r) => visibleWidth(r[i] ?? "")));
    return maxWidths[i] ? Math.min(natural, maxWidths[i]!) : natural;
  });
  const line = (cells: string[]) =>
    cells.map((c, i) => padVisible(truncateVisible(c ?? "", widths[i]!), widths[i]!)).join("  ").trimEnd();
  return [bold(line(headers)), dim(widths.map((w) => "─".repeat(w)).join("  ")), ...rows.map(line)].join("\n");
}
