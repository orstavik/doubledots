const sharedResource = ["sunshine", "!"];

export function one(){
  this.ownerElement.textContent += sharedResource[0].repeat(1);
}

export function two(){
  this.ownerElement.textContent += sharedResource[1].repeat(2);
}