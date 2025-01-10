export class Color {

  static container(css, args) {

    const res = {};
    //
    //blalblabla
    res["border-color"] = "red";
    return res;
    //$color_border[red] => this will be inherited for all elements that set border-style,
    //because we have set the default value of border-color to be inherit.
  }
}