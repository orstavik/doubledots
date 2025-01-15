import { PrefixTable } from "./SHORT.js";
import { parseColor as color } from "./Color.js";

//$palette_[red,blue]_pop[,4]
const palettePrefix = PrefixTable({
  //ArgumentConverter
  // "chroma": [/c|chroma/, calc], // percent or 0<=x<=1
  // "--color-mono-hue": [/|h|hue/, calc], //0<=x<=360
  // "light": [/l|light/, calc], // percent or 0<=x<=1
  // "start": [/a|start/], //must be a plain number
  // "end": [/b|end/],
  "color": [/|c|color/, [color]]
  // "pop-point": [/p|pop/],
});

export class Palette {

  static lightChroma = [
    [99, 0.05],
    [90, 0.1],
    [80, 0.2],
    [72, 0.35],
    [67, 0.31],
    [50, 0.27],
    [35, 0.25],
    [25, 0.2],
    [13, 0.2],
    [5, 0.2],
  ];

  static parse(args) {
    const input = palettePrefix(args);
    const color = input.color?.[0] ?? "black";
    const abcd = new Array(10).fill().map((_, i) => String.fromCharCode(97 + i));
    const lights = new Array(19).fill().map((_, i) => 5 + i * 5);

    const res = {};
    for (let name of abcd)
      for (let light of lights)
        res["--color-" + name + light] = `oklch(from ${color} ${light}% c h)`;
    return res;
  }
}