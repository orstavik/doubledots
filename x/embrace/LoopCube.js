function compareSmall(old, now) {
  const exact = new Array(now.length);
  const unused = [];
  if (!old?.length)
    return { exact, unused };
  main: for (let o = 0; o < old.length; o++) {
    for (let n = 0; n < now.length; n++) {
      if (!exact[n] && old[o] === now[n]) {
        exact[n] = o;
        continue main;
      }
    }
    unused.push(o);
  }
  return { exact, unused };
}

function nodesBetween(start, end) {
  const res = [];
  for (let n = start.nextSibling; n < end; n = n.nextSibling)
    res.push(n);
  return res;
}

function moveToRes(n, o, now, old, scale) {
  n *= scale;
  o *= scale;
  for (let i = 0; i < scale; i++)
    now[n + i] = old[o + i];
}

export class LoopCube {
  constructor(template, start, end) {
    this.start = start;
    this.end = end;
    this.template = template;
    this.tl = template.childNodes.length;
    this.now = [];
  }

  step(now = []) {
    const scale = this.tl;
    const old = this.now;
    this.now = now;
    const { exact, unused } = compareSmall(old, now);

    const oldNodes = nodesBetween(this.start, this.end);
    const nowNodes = new Array(now.length * scale);
    const newDocFrags = [];
    for (let n = 0; n < exact.length; n++) {
      const o = exact[n];
      if (o != null) {
        moveToRes(n, o, nowNodes, oldNodes, scale);
      } else {
        if (unused.length)
          moveToRes(n, unused.pop(), nowNodes, oldNodes, scale);
        else {
          const news = this.template.cloneNode(true);
          newDocFrags.push(news);
          moveToRes(n, 0, nowNodes, news.childNodes, scale);
        }
      }
    }
    const removeNodes = [];
    for (let u = unused.pop(), i = 0; u != null; i++, u = unused.pop())
      moveToRes(i, u, removeNodes, oldNodes, scale);
    return { nowNodes, removeNodes, newDocFrags, scale };
  }
}