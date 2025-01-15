import { PrefixTable } from "./SHORT.js";

//$color-lab_7_yellow_4_10

const colorLabPrefix = PrefixTable(
  {
    //PrefixConverter: 
    fg: "",
  }, {
  //ArgumentConverter
  "white": [/w|white/], // percent or -1<=x<=1
  "black": [/b|black/], // percent or -1<=x<=1
  "hue": [/h|hue/],     // 0<=x<=360
  "size": [/|s|size/],  // how many colors in the palette, 1<=x<=9, int only
  "fg": [/fg/],         // must be a plain number
  "bg": [/bg/],
}
);



export class ColorLab {

  static laeMustFixThis({ white = .5, black = .5, hue = 0, size = 7 }) {
    //here, we would iterate the size and then get the values in the bezier curves for the values that are there.
    //this will be calculated against the l a b values in css.
    //calculate magic
    return [
      [0.9, .99, 0.05],
      [0.9, .90, 0.1],
      [0.9, .80, 0.2],
      [0.9, .72, 0.35],
      [0.9, .67, 0.31],
      [0.9, .50, 0.27],
      [0.9, .35, 0.25],
      [0.9, .25, 0.2],
      [0.9, .13, 0.2],
    ];
  }

  static parse(args) {
    const input = colorLabPrefix(args);
    //task 1: calculcate a color schema
    if (input.size) {
      const table = this.laeMustFixThis(input);
      const res = {};
      for (let i = 0; i < table.length; i++) {
        const [lf, af, bf] = table[i];
        res["--color-lab-l-" + i] = lf;
        res["--color-lab-a-" + i] = af;
        res["--color-lab-b-" + i] = bf;
      }
    }
    //task 2: assign the color/background-color/border-color etc to points in the color schema
    res.color = `var(--color-lab-${input.fg})`;
    res["--background-color"] = `var(--color-lab-${input.bg})`;
    res["--border-color"] = `var(--color-lab-${input.bg + 1})`;
    return res;
  }
}

//<div class="$color-lab_7_fg5_bg2_w.65"> does both task 1 and 2
//  ---
//     <div class="$color-lab_fg8_bg3"> does only task 2, reusing task 1 from above.