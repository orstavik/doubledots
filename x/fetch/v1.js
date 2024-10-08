export async function fetch_json() {
  return (await fetch(this.value)).json();
}
export async function fetch_text() {
  return (await fetch(this.value)).text();
}