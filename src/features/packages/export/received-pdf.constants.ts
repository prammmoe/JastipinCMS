export const RECEIVED_PDF_LAYOUT = {
  page: { width: 595, height: 842 },
  margin: { left: 40, right: 40, top: 46, bottom: 42 },
  title: { fontSize: 13, gap: 5 },
  subtitle: { fontSize: 9, gap: 16 },
  header: { height: 18, fontSize: 9 },
  row: { height: 16.5, fontSize: 8.5, minFontSize: 6 },
  columns: {
    no: 40,
    tanggal: 78,
    nama: 145,
    resi: 290,
    berat: 470,
    right: 555,
  },
  text: { paddingLeft: 3 },
} as const;

export const RECEIVED_PDF_COLORS = {
  border: [0, 0, 0] as const,
  text: [0, 0, 0] as const,
} as const;
