const RESPONSE_TYPES = {
  json: "json",
  text: "text",
  blob: "blob",
  form: "formData",
  formdata: "formData",
  bytes: "bytes",
  uint8array: "bytes",
  uint8: "bytes",
  clone: "clone",
  arraybuffer: "arrayBuffer",
  buffer: "arrayBuffer",
};
function parseResponseType(tail = "json") {
  if (!(tail in RESPONSE_TYPES))
    throw new SyntaxError("Unknown fetch- response type: " + tail);
  if (tail === "json")
    return async function jsonResponse(res) {
      const text = await res.text();
      return text ? JSON.parse(text) : undefined;
    };
  tail = RESPONSE_TYPES[tail];
  return function response(resp) { return resp[tail](); }
}

const METHOD = {
  post: 'POST',
  put: 'PUT',
  delete: 'DELETE',
  patch: 'PATCH',
};
const dotMETHOD = {
  get: 'GET',
  head: 'HEAD',
};
const HEADERS = {
  auth: ["credentials", 'include'],
  omit: ["credentials", 'omit'],

  nocache: ["cache", 'no-cache'],
  nostore: ["cache", 'no-store'],
  reload: ["cache", 'reload'],
  forcecache: ["cache", 'force-cache'],
  onlyifcached: ["cache", 'only-if-cached'],

  cors: ["mode", 'cors'],
  nocors: ["mode", 'no-cors'],
  sameorigin: ["mode", 'same-origin'],

  noreferrer: ["referrerPolicy", 'no-referrer'],
  origin: ["referrerPolicy", 'origin'],
  originwhencross: ["referrerPolicy", 'origin-when-cross-origin'],
  strictorigin: ["referrerPolicy", 'strict-origin'],
  strictorigincross: ["referrerPolicy", 'strict-origin-when-cross-origin'],
  unsafe: ["referrerPolicy", 'unsafe-url'],
  refsameorigin: ["referrerPolicy", 'same-origin'],
};
function parseSegments(name, splitter, methodMap) {
  const [, ...segments] = name.toLowerCase().split(splitter);
  let method;
  let responseType;
  const headers = {};
  for (let seg of segments) {
    if (methodMap[seg]) {
      if (method)
        throw new SyntaxError("multiple fetch methods: " + methodMap[seg] + ", " + seg);
      method = methodMap[seg];
    } else if (HEADERS[seg]) {
      const [type, value] = HEADERS[seg];
      if (type in headers)
        throw new SyntaxError("multiple fetch headers of same type: " + type + ", " + seg);
      headers[type] = value;
    } else {
      throw new SyntaxError("unknown fetch segment: " + seg);
    }
  }
  return { method, responseType, headers };
}

//Att! fetch defaults to .json(), not .text()!
async function basicFetch() {
  const resp = await fetch(this.value);
  let res;
  try { res = resp.json(); } catch (e) { res = undefined; }
  return res;
}

function fetchDashRule(name) {
  const [head, type, tail] = name.split(/([._])/);
  const responder = parseResponseType(tail);
  const m = type === "." ? "GET" : "POST";
  const { headers, method = m } = parseSegments(head, "-", type === "." ? dotMETHOD : METHOD);
  return type === "." ?
    async function fetchDash() {
      return responder(await fetch(this.value, { method, headers }));
    } :
    async function fetchDash_(body) {
      return responder(await fetch(this.value, { method, headers, body }));
    };
}

//fetch.
function fetchDotRule(name) {
  const [, tail] = name.split(".");
  const responder = parseResponseType(tail);
  return async function fetchDash() {
    return responder((await fetch(this.value, { method: "GET" })));
  }
}

//fetch_
function fetch_Rule(name) {
  const [, tail] = name.split("_");
  const responder = parseResponseType(tail);
  return async function fetch_(body) {
    return await responder(await fetch(this.value, { method: "POST", body }));
  };
}

export {
  fetchDashRule as "fetch-",
  fetchDotRule as "fetch.",
  fetch_Rule as fetch_,
  basicFetch as fetch,
}