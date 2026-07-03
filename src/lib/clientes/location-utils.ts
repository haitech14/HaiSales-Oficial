export type UbicacionParts = {
  ciudad: string;
  provincia: string;
  distrito: string;
};

export function parseUbicacion(raw?: string | null): UbicacionParts {
  const empty: UbicacionParts = { ciudad: "—", provincia: "—", distrito: "—" };
  if (!raw || raw.trim() === "" || raw === "—") return empty;

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return empty;
  if (parts.length === 1) return { ciudad: parts[0], provincia: "—", distrito: "—" };
  if (parts.length === 2) return { ciudad: parts[0], provincia: parts[1], distrito: "—" };

  return {
    ciudad: parts[0],
    provincia: parts[1],
    distrito: parts.slice(2).join(", "),
  };
}

export function joinUbicacion(ciudad: string, provincia: string, distrito: string): string {
  const parts = [ciudad, provincia, distrito].filter((part) => part && part !== "—");
  return parts.join(", ");
}
