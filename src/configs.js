const edificiosConfig = [
  [-27.5, 0.2, -27.5, 3],
  [-7.49, 0.2, -27.5, 3],
  [12.51, 0.2, -27.5, 3],
  [-22.5, 0.2, -17.49, 2, true, true, true],
  [-7.5, 0.2, -17.49, 3, true, true, true],
  [12.5, 0.2, -17.49, 2, true, true, true],
  [-22.5, 0.2, -12.49, 2, false, false, false],
  [-7.5, 0.2, -12.49, 3, false, false, false],
  [12.5, 0.2, -12.49, 2, false, false, false],
  [-22.5, 0.2, -2.49, 2, true, true, true],
  [-7.5, 0.2, -2.49, 3, true, true, true],
  [12.5, 0.2, -2.49, 2, true, true, true],
  [-22.5, 0.2, 2.49, 2, false, false, false],
  [-7.5, 0.2, 2.49, 3, false, false, false],
  [12.5, 0.2, 2.49, 2, false, false, false],
  [-22.5, 0.2, 12.49, 2, true, true, true],
  [-7.5, 0.2, 12.49, 3, true, true, true],
  [12.5, 0.2, 12.49, 2, true, true, true],
  [-22.5, 0.2, 17.49, 2, false, false, false],
  [-7.5, 0.2, 17.49, 3, false, false, false],
  [12.5, 0.2, 17.49, 2, false, false, false],
  [-27.5, 0.2, 27.49, 3, true, true, true],
  [-12.48, 0.2, 27.49, 3, true, true, true],
  [2.48, 0.2, 27.49, 3, true, true, true],
  [12.48, 0.2, 27.49, 3, true, true, true],
];

const callesPeatonales = [
  [-12.49, 0, -32.5],
  [7.51, 0, -32.5],
  [7.51, 0, -22.5],
  [-12.49, 0, -22.5],
  [7.51, 0, -7.5],
  [-12.49, 0, -7.5],
  [7.51, 0, 7.5],
  [-12.49, 0, 7.5],
];

const callesConGiro = [
  [-27.5, 0, -27.49, 1, 1, false],
  [22.5, 0, -27.49, 1, 1, true, false],
  [-27.5, 0, 17.49, 1, 1, true, true],
  [22.5, 0, 17.5, 1, 1, true, true, true],
];
const callesRectasX = [
  [-7.49, 0, -27.49, 3, 0, true],
  [-22.49, 0, -27.49, 2, 0, true],
  [12.49, 0, -27.49, 2, 0, true],
  [-22.49, 0, -12.5, 2, 0, true, true],
  [-7.49, 0, -12.5, 3, 0, true, true],
  [12.49, 0, -12.5, 2, 0, true, true],
  [-12.49, 0, -17.5, 1, 0, false, true],
  [7.49, 0, -17.5, 1, 0, false, true],
  [-22.49, 0, 2.5, 2, 0, true, true],
  [-7.49, 0, 2.5, 3, 0, true, true],
  [12.49, 0, 2.5, 2, 0, true, true],
  [-12.49, 0, -2.5, 1, 0, false, true],
  [7.49, 0, -2.5, 1, 0, false, true],
  [-22.49, 0, 17.5, 2, 0, true, true],
  [-7.49, 0, 17.5, 3, 0, true, true],
  [12.49, 0, 17.5, 2, 0, true, true],
  [-12.49, 0, 12.5, 1, 0, false, true],
  [7.49, 0, 12.5, 1, 0, false, true],
];

const callesRectasY = [
  [-27.5, 0, -22.49, 2, 0, false, true],
  [22.49, 0, -22.5, 2, 0, false, true],
  [-27.5, 0, -7.49, 2, 0, false, true],
  [22.49, 0, -7.5, 2, 0, false, true],
  [-27.5, 0, 7.5, 2, 0, false, true],
  [22.49, 0, 7.5, 2, 0, false, true],
];
const callesTresDirecciones = [
  [-27.5, 0, -12.5, 1, 3, false, true],
  [22.5, 0, -12.5, 1, 3, true, true, true],
  [-27.5, 0, 2.5, 1, 3, false, true],
  [22.5, 0, 2.5, 1, 3, true, true, true],
  [-12.5, 0, 17.5, 1, 3, true, true],
  [7.5, 0, 17.5, 1, 3, true, true],
];
const callesMultidireccional = [
  [-12.49, 0, -27.49, 1, 2, true],
  [7.49, 0, -27.49, 1, 2, true],
  [-12.49, 0, -12.5, 1, 2, true, true],
  [7.49, 0, -12.5, 1, 2, true],
  [-12.49, 0, 2.5, 1, 2, true, true],
  [7.49, 0, 2.5, 1, 2, true],
];

export {
  edificiosConfig,
  callesPeatonales,
  callesConGiro,
  callesRectasX,
  callesRectasY,
  callesTresDirecciones,
  callesMultidireccional,
};