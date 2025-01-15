import { PrefixTable } from "./SHORT.js";


//$color-mono_yellow_4_10

const colorMonoPrefix = PrefixTable(
  {
    //PrefixConverter: 
    a: "",
  }, {
  //ArgumentConverter
  "chroma": [/c|chroma/, calc], // percent or 0<=x<=1
  "--color-mono-hue": [/|h|hue/, calc], //0<=x<=360
  "light": [/l|light/, calc], // percent or 0<=x<=1
  "pop-point": [/p|pop/],
  "start": [/a|start/], //must be a plain number
  "end": [/b|end/],
}
);



export class ColorMono {

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
    const input = colorMonoPrefix(args);
    //use pop-point, light, chroma to calculate a lightChromaTable.
    //pop-point defaults to 3
    const lightChroma = this.lightChroma;
    const res = {};
    res["--color-mono-hue"] = input["--color-mono-hue"];
    for (let i = 0; i < 10; i++) {
      const [light, chroma] = lightChroma[i];
      res["--color-mono-light-" + i] = `${light}%`;
      res["--color-mono-chroma-" + i] = `${chroma}`;
    }
    res.color = `var(--color-mono-${input.start})`;
    res["--background-color"] = `var(--color-mono-${input.end})`;
    res["--border-color"] = `var(--color-mono-${input.end+1})`;
    return res;
  }
}