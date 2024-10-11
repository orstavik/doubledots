const sharedResource = ["sunshine", "!"];

export function threeFour() {
  this.ownerElement.textContent += ":three-four is threeFour";
}

export class FiveSix extends AttrCustom {
  upgrade() {
    this.ownerElement.textContent += "five-six: is FiveSix";
    this.dispatchEvent(new Event("five-six"));
  }
}