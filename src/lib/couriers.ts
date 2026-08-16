export const COURIERS = [
  "JNE",
  "J&T",
  "SiCepat",
  "TIKI",
  "Ninja Xpress",
  "ID Express",
  "AnterAja",
  "SAPX",
  "Lion Parcel",
  "Wahana",
  "Pos Indonesia",
  "RPX",
  "21 Express",
  "First Logistics",
  "SPX",
  "Lazada Logistics",
  "JD Logistics",
  "Paxel",
  "GoSend",
  "Grab",
  "Lalamove",
  "Borzo",
  "Deliveree",
  "Indah Logistik",
  "Sentral Cargo",
  "Dakota Cargo",
  "KAI Logistik",
  "ESL",
  "Alfatrex",
  "PopExpress",
  "Janio",
  "DHL",
  "FedEx",
] as const;

export function normalizeCourierName(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]/g, "");
}

export function matchCourier(value: string) {
  const normalized = normalizeCourierName(value);
  if (!normalized) return undefined;
  return COURIERS.find(
    (courier) => normalizeCourierName(courier) === normalized,
  );
}

export function filterCouriers(value: string) {
  const normalized = normalizeCourierName(value);
  if (!normalized) return [...COURIERS];
  return COURIERS.filter((courier) =>
    normalizeCourierName(courier).includes(normalized),
  );
}
