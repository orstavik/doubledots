class Color {
  static hexToLinearRgb(hex) {
    hex = hex.slice(1);
    let bigint;
    if (hex.length === 3) {
      bigint = parseInt(hex.split('').map(char => char + char).join(''), 16);
    } else if (hex.length === 6) {
      bigint = parseInt(hex, 16);
    } else {
      throw new Error('Invalid HEX color.');
    }
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;

    const linearize = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return {
      R: linearize(r),
      G: linearize(g),
      B: linearize(b)
    };
  }

  static linearRgbToXyz({ R, G, B }) {
    const X = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
    const Y = 0.2126729 * R + 0.7151522 * G + 0.0721750 * B;
    const Z = 0.0193339 * R + 0.1191920 * G + 0.9503041 * B;
    return { X, Y, Z };
  }

  static xyzToOKLab({ X, Y, Z }) {
    const l = 0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z;
    const m = 0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z;
    const s = 0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z;

    const lCube = Math.cbrt(l);
    const mCube = Math.cbrt(m);
    const sCube = Math.cbrt(s);

    const L = 0.2104542553 * lCube + 0.7936177850 * mCube - 0.0040720468 * sCube;
    const a = 1.9779984951 * lCube - 2.4285922050 * mCube + 0.4505937099 * sCube;
    const b = 0.0259040371 * lCube + 0.7827717662 * mCube - 0.8086757660 * sCube;

    return { L, a, b };
  }

  static oklabToOklch({ L, a, b }) {
    const C = Math.sqrt(a * a + b * b);
    let H = Math.atan2(b, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    return { L, C, H };
  }

  static oklchToOklab({ L, C, H }) {
    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);
    return { L, a, b };
  }

  static oklabToXyz({ L, a, b }) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    const X = (1.2270138511 * l - 0.5577999807 * m + 0.2812561490 * s);
    const Y = (-0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s);
    const Z = (-0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s);
    return { X, Y, Z };
  }

  static xyzToRgb({ X, Y, Z }) {
    let R = 3.2406 * X + (-1.5372) * Y + (-0.4986) * Z;
    let G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    let B = 0.0557 * X + (-0.2040) * Y + 1.0570 * Z;

    const gammaCorrect = (channel) =>
      channel <= 0.0031308
        ? 12.92 * channel
        : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;

    R = Math.round(Math.min(Math.max(0, gammaCorrect(R)), 1) * 255);
    G = Math.round(Math.min(Math.max(0, gammaCorrect(G)), 1) * 255);
    B = Math.round(Math.min(Math.max(0, gammaCorrect(B)), 1) * 255);
    return { R, G, B };
  }

  static rgbToHex({ R, G, B }) {
    const toHex = (value) => value.toString(16).padStart(2, "0");
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  };

  static analyzeHex(hex) {
    const rgb = this.hexToLinearRgb(hex);
    const xyz = this.linearRgbToXyz(rgb);
    const lab = this.xyzToOKLab(xyz);
    const lch = this.oklabToOklch(lab);
    return { hex, ...rgb, ...xyz, ...lab, ...lch };
  }

  static analyzeLch(lch) {
    const lab = this.oklchToOklab(lch);
    const xyz = this.oklabToXyz(lab);
    const rgb = this.xyzToRgb(xyz);
    const hex = this.rgbToHex(rgb);
    return { ...lch, ...lab, ...xyz, ...rgb, hex };
  }

  static analyzeColors(colorMap) {
    const res = { ...colorMap };
    for (let name in colorMap)
      for (let [shade, hex] of Object.entries(colorMap[name]))
        res[name][shade] = this.analyzeHex(hex);
    return res;
  }
}

function flipKeys(grandpa) {
  const res = {};
  for (let outer in grandpa)
    for (let inner in grandpa[outer])
      (res[inner] ??= {})[outer] = grandpa[outer][inner];
  return res;
}




const TG_TAILWIND_GREYS = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
};
const TAILWIND = {
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },

  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },

  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
    950: '#1a2e05',
  },

  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },

  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },

  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },

  fuchsia: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },

  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },

  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
};

const ACCENT_MATERIAL = {
  redA: {
    100: '#FF8A80',
    200: '#FF5252',
    400: '#FF1744',
    700: '#D50000',
  },
  pinkA: {
    100: '#FF80AB',
    200: '#FF4081',
    400: '#F50057',
    700: '#C51162',
  },
  purpleA: {
    100: '#EA80FC',
    200: '#E040FB',
    400: '#D500F9',
    700: '#AA00FF',
  },
  deepPurpleA: {
    100: '#B388FF',
    200: '#7C4DFF',
    400: '#651FFF',
    700: '#6200EA',
  },
  indigoA: {
    100: '#8C9EFF',
    200: '#536DFE',
    400: '#3D5AFE',
    700: '#304FFE',
  },
  blueA: {
    100: '#82B1FF',
    200: '#448AFF',
    400: '#2979FF',
    700: '#2962FF',
  },
  ligthBlueA: {
    100: '#80D8FF',
    200: '#40C4FF',
    400: '#00B0FF',
    700: '#0091EA',
  },
  cyanA: {
    100: '#84FFFF',
    200: '#18FFFF',
    400: '#00E5FF',
    700: '#00B8D4',
  },
  tealA: {
    100: '#A7FFEB',
    200: '#64FFDA',
    400: '#1DE9B6',
    700: '#00BFA5',
  },
  greenA: {
    100: '#B9F6CA',
    200: '#69F0AE',
    400: '#00E676',
    700: '#00C853',
  },
  ligthGreenA: {
    100: '#CCFF90',
    200: '#B2FF59',
    400: '#76FF03',
    700: '#64DD17',
  },
  limeA: {
    100: '#F4FF81',
    200: '#EEFF41',
    400: '#C6FF00',
    700: '#AEEA00',
  },
  yellowA: {
    100: '#FFFF8D',
    200: '#FFFF00',
    400: '#FFEA00',
    700: '#FFD600',
  },
  amberA: {
    100: '#FFE57F',
    200: '#FFD740',
    400: '#FFC400',
    700: '#FFAB00',
  },
  orangeA: {
    100: '#FFD180',
    200: '#FFAB40',
    400: '#FF9100',
    700: '#FF6D00',
  },
  deepOrangeA: {
    100: '#FF9E80',
    200: '#FF6E40',
    400: '#FF3D00',
    700: '#DD2C00',
  },
};
for (let t of Object.values(ACCENT_MATERIAL)) {
  t[50] = t[100];
  t[300] = t[200];
  t[500] = t[400];
  t[600] = t[400];
  t[800] = t[700];
  t[900] = t[700];
  t[950] = t[700];
}

const MATERIAL = {
  red: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  pink: {
    50: '#FCE4EC',
    100: '#F8BBD0',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63',
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F',
  },
  purple: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0',
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },
  deepPurple: {
    50: '#EDE7F6',
    100: '#D1C4E9',
    200: '#B39DDB',
    300: '#9575CD',
    400: '#7E57C2',
    500: '#673AB7',
    600: '#5E35B1',
    700: '#512DA8',
    800: '#4527A0',
    900: '#311B92',
  },
  indigo: {
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#3F51B5',
    600: '#3949AB',
    700: '#303F9F',
    800: '#283593',
    900: '#1A237E',
  },
  blue: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  lightBlue: {
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#03A9F4',
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B',
  },
  cyan: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00BCD4',
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
  },
  teal: {
    50: '#E0F2F1',
    100: '#B2DFDB',
    200: '#80CBC4',
    300: '#4DB6AC',
    400: '#26A69A',
    500: '#009688',
    600: '#00897B',
    700: '#00796B',
    800: '#00695C',
    900: '#004D40',
  },
  green: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  lightGreen: {
    50: '#F1F8E9',
    100: '#DCEDC8',
    200: '#C5E1A5',
    300: '#AED581',
    400: '#9CCC65',
    500: '#8BC34A',
    600: '#7CB342',
    700: '#689F38',
    800: '#558B2F',
    900: '#33691E',
  },
  lime: {
    50: '#F9FBE7',
    100: '#F0F4C3',
    200: '#E6EE9C',
    300: '#DCE775',
    400: '#D4E157',
    500: '#CDDC39',
    600: '#C0CA33',
    700: '#AFB42B',
    800: '#9E9D24',
    900: '#827717',
  },
  yellow: {
    50: '#FFFDE7',
    100: '#FFF9C4',
    200: '#FFF59D',
    300: '#FFF176',
    400: '#FFEE58',
    500: '#FFEB3B',
    600: '#FDD835',
    700: '#FBC02D',
    800: '#F9A825',
    900: '#F57F17',
  },
  amber: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },
  orange: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  deepOrange: {
    50: '#FBE9E7',
    100: '#FFCCBC',
    200: '#FFAB91',
    300: '#FF8A65',
    400: '#FF7043',
    500: '#FF5722',
    600: '#F4511E',
    700: '#E64A19',
    800: '#D84315',
    900: '#BF360C',
  },
};
// Object.values(MATERIAL).forEach(t => t[950] = t[900]);

const MG_MATERIAL_GREYS = {
  brown: {
    50: '#EFEBE9',
    100: '#D7CCC8',
    200: '#BCAAA4',
    300: '#A1887F',
    400: '#8D6E63',
    500: '#795548',
    600: '#6D4C41',
    700: '#5D4037',
    800: '#4E342E',
    900: '#3E2723',
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  blueGrey: {
    50: '#ECEFF1',
    100: '#CFD8DC',
    200: '#B0BEC5',
    300: '#90A4AE',
    400: '#78909C',
    500: '#607D8B',
    600: '#546E7A',
    700: '#455A64',
    800: '#37474F',
    900: '#263238',
  },
};
// Object.values(MG_MATERIAL_GREYS).forEach(t => t[950] = t[900]);

export const Palettes = {
  TAILWIND,
  MATERIAL,
  ACCENT_MATERIAL,
  MG_MATERIAL_GREYS,
  TG_TAILWIND_GREYS,
};

for (let key in Palettes)
  Palettes[key] = Color.analyzeColors(Palettes[key]);

class ColorPaletteGeneratorLCH {
  static isolateProperty(dict, key1, key2) {
    const res = {};
    for (let name in dict)
      res[name] = dict[name][key1][key2];
    return res;
  }

  static singleProp(dict, prop) {
    const res = {};
    for (let name in dict)
      for (let key in dict[name])
        (res[name] ??= {})[key] = dict[name][key][prop];
    return res;
  }

  static averageProps(dict, key2) {
    const res = {};
    for (let name in dict)
      for (let key1 in dict[name])
        (res[key1] ??= []).push(dict[name][key1][key2]);
    for (let prop in res)
      res[prop] = res[prop].reduce(((a, b) => a + b), 0) / res[prop].length;
    return res;
  }

  static make(OG) {
    const hues = this.singleProp(OG, "H");
    const chromas = this.singleProp(OG, "C");
    const lights = this.singleProp(OG, "L");

    const res = {};
    for (let [color, table] of Object.entries(hues))
      for (let [l1000, H] of Object.entries(table)) {
        const C = chromas[color][l1000];
        let L = 1.05 - (l1000 / 1350);
        L = lights[color][l1000];
        (res[color] ??= {})[l1000] = Color.analyzeLch({ L, C, H });
      }
    return res;
  }

  static make2(OG) {
    const hues = this.isolateProperty(OG, 600, "H");
    const chromas = this.averageProps(OG, "C");
    console.log(JSON.stringify(hues, null, 2));
    console.log(JSON.stringify(chromas, null, 2));
    // const chromas = this.singleProp(OG, "C");
    const lights = this.singleProp(OG, "L");

    const res = {};
    for (let [color, table] of Object.entries(OG)) {
      const H = hues[color];
      for (let [l1000, _] of Object.entries(table)) {
        const C = chromas[l1000];
        // const C = chromas[color][l1000];
        let L = 1.05 - (l1000 / 1350);
        L = lights[color][l1000];
        (res[color] ??= {})[l1000] = Color.analyzeLch({ L, C, H });
      }
    }
    return res;
  }

  static make3(OG) {
    const hues = this.singleProp(OG, "H");
    const chromas = this.singleProp(OG, "C");
    const res = {};
    for (let [color, table] of Object.entries(OG)) {
      const tableH = hues[color];
      const H = tableH[600];
      const tableC = chromas[color];
      const amus = this.approximateGaussianParams(tableC);
      const { A, mu, sigma } = amus;
      for (let [l1000, _] of Object.entries(table)) {
        const C = this.gaussian(l1000, A, mu, sigma);
        let L = 1.05 - (l1000 / 1350);
        // if (color === "emerald") {
        //   console.log(_.L, L);
        //   console.log(_.C, C);
        //   console.log(_.H, H);
        //   // debugger
        // }
        (res[color] ??= {})[l1000] = { ...Color.analyzeLch({ L, C, H }), A, mu, sigma };
      }
    }
    return res;
  }

  static approximateGaussianParams(dictXY) {

    function parabolicPeak([x0, y0], [x1, y1], [x2, y2]) {
      const denom = (x0 - x1) * (x0 - x2) * (x1 - x2);
      if (Math.abs(denom) < 1e-12)
        return [x1, y1];
      const a = (x2 * (y1 - y0) + x1 * (y0 - y2) + x0 * (y2 - y1)) / denom;
      const b = (x2 * x2 * (y0 - y1) + x1 * x1 * (y2 - y0) + x0 * x0 * (y1 - y2)) / denom;
      const c = (x1 * x2 * (x1 - x2) * y0
        + x2 * x0 * (x2 - x0) * y1
        + x0 * x1 * (x0 - x1) * y2) / denom;
      const xV = -b / (2 * a);
      const yV = (a * xV * xV) + (b * xV) + c;
      return [xV, yV];
    }

    function lineCrossesY(line, y) {
      for (let i = 1; i < line.length; i++) {
        const [x1, y1] = line[i - 1];
        const [x2, y2] = line[i];
        if ((y1 - y) * (y2 - y) <= 0)
          return x1 + (y - y1) / (y2 - y1) * (x2 - x1);
      }
      return line.length / 2;
    }

    const XYs = Object.entries(dictXY)
      .map(([k, v]) => [parseFloat(k), parseFloat(v)])
      .sort(([a], [b]) => a - b);
    let peak = 0;
    for (let i = 1; i < XYs.length; i++)
      if (XYs[peak][1] < XYs[i][1])
        peak = i;
    const [mu, A] = parabolicPeak(XYs[peak - 1], XYs[peak], XYs[peak + 1]);

    const half = (A - XYs[0][1]) / 2;
    const leftCross = lineCrossesY(XYs.slice(0, peak), half);
    const rightCross = lineCrossesY(XYs.slice(peak), half);
    const sigma = (rightCross - leftCross) / 2.35482;
    return { A, mu, sigma };
  }
  static gaussian(x, A, mu, sigma) {
    return A * Math.exp(-Math.pow(x - mu, 2) / (2 * sigma ** 2));
  }
}
Palettes.LM_LCH_MATERIAL = ColorPaletteGeneratorLCH.make2(Palettes.MATERIAL);
for (let color in Palettes.TAILWIND) {
  const c50 = Palettes.TAILWIND[color][50].C;
  const c950 = Palettes.TAILWIND[color][950].C;
  const step = (c950 - c50) / 900;
  for (let shade in Palettes.TAILWIND[color]) {
    const { C, a, b } = Palettes.TAILWIND[color][shade];
    // normalized c curve. Once it is normalized, it forms almost a straight line.
    // const c = c50 + step * (parseInt(shade) - 50);
    // Palettes.TAILWIND[color][shade].C -= c;
    Palettes.TAILWIND[color][shade].ab = Math.abs(a) + Math.abs(b);
  }
}

Palettes.LT_LCH_TAILWIND = ColorPaletteGeneratorLCH.make2(Palettes.TAILWIND);
// Palettes.LT_LCH_TAILWIND = ColorPaletteGeneratorLCH.make3(Palettes.TAILWIND);
