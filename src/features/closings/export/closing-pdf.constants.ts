export const PDF_LAYOUT = {
  page: {
    width: 595,
    height: 842,
  },
  title: {
    left: 109.0936,
    right: 545.187,
    top: 53.4131,
    bottom: 78.6513,
    fontSize: 12.21,
  },
  header: {
    top: 102.7157,
    middle: 115.3348,
    bottom: 127.6605,
    fontSize: 7.63,
  },
  columns: {
    left: 109.0936,
    no: 134.6253,
    name: 255.5341,
    resi: 376.4429,
    weight: 426.3324,
    unit: 485.6129,
    right: 545.187,
  },
  body: {
    rowHeight: 12.32565,
    firstRowTop: 127.66045,
    fontSize: 7.63,
    minFontSize: 6,
  },
  border: {
    width: 0.5869,
  },
  money: {
    unit: {
      rpX: 428.39,
      valueRight: 483.55,
    },
    total: {
      rpX: 487.67,
      valueRight: 542.83,
    },
  },
  text: {
    paddingLeft: 2.05,
    verticalTune: 0.9,
  },
  pagination: {
    firstPageRows: 53,
    continuationPageRows: 59,
  },
} as const;

export const PDF_LAYOUT_DEBUG = false;

export const RESI_LABEL = "NO RESI";

export const HEADER_SUBLINE_X1 = 426.039;
export const HEADER_SUBLINE_Y = PDF_LAYOUT.header.middle;

export const FONT_PATHS = {
  regular: "assets/fonts/regular.ttf",
  bold: "assets/fonts/bold.ttf",
} as const;