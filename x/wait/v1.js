export function wait_(rule) {
  const [_, ms] = rule.split("_");
  return arg => new Promise(r => setTimeout(_ => r(arg), ms));
}