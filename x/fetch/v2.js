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
const RESPONSE = {
  json: res => res.json(),
  text: res => res.text(),
  blob: res => res.blob(),
  form: res => res.formData(),
  arraybuffer: res => res.arrayBuffer()
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
    } else if (RESPONSE[seg]) {
      if (responseType)
        throw new SyntaxError("multiple fetch response types: " + RESPONSE[seg] + ", " + seg);
      responseType = RESPONSE[seg];
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

//basic get fetch, returning text()
export async function basicFetch() {
  return (await fetch(this.value)).text();
}

//fetch.
export function fetchDotRule(name) {
  const { method = "get", responseType = "text", headers } = parseSegments(name, ".", dotMETHOD);
  return async function fetchDot() {
    return (await fetch(this.value, { method, headers }))[responseType]();
  };
}

//fetch_
export function fetch_Rule(name) {
  const { method = post, responseType = "text", headers } = parseSegments(name, "_", METHOD);
  return async function fetch_() {
    return (await fetch(this.value, { method, headers }))[responseType]();
  };
}