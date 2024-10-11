//utility function
function replaceAll(str, stringMap = {}, count = 0) {
  str = str.replace(/(['`])([^\1]*?)\1/g, (_, p1, p2) => {
    const placeholder = `"${++count}"`;
    stringMap[count] = p1 + p2 + p1;
    return placeholder;
  });
  return { str, stringMap };
}

//words custom to js
function propertyPath(x) {
  if (x[0] === "@" && identifier(x = x.slice(1)))
    return o => o[x];
}

function setPath(x) {
  if (x[0] === "$" && int(x = x.slice(1)))
    return ar => ar.at(x);
}

const ALL = x => x;
function all(x) {
  if (x === "*" || x === "")
    return ALL;
}

function wild(x) {
  const first = x.slice(-1) === "*" ? "^" : "";
  const last = x[0] === "*" ? "$" : "";
  if (!first && !last)
    return;
  let body = x.slice(1 * !!last, -1 * !!first);
  if (identifier(body))
    return new RegExp(first + body + last);
}

//true, flase, null, "num", number
function primitive(x) {
  return x === "true" ? true :
    x === "false" ? false :
      x === "null" ? null :
        /^"[^"]*"$/.exec(x) ? x :
          number(x);
}

function int(x) {
  const i = parseInt(x);
  if (i.toString() === x)
    return i;
}

function identifier(x) {
  return /^[/a-zA-Z0-9_-]+$/.exec(x) ? x : undefined;
}

//todo will this work with numbers with "e"?
function number(x) {
  const num = Number(x);
  if (isNaN(num))
    return;
  if (num.toString() === x)
    return num;
  if (x[0] !== "0")
    return;
  x = x.toLowerCase();
  if ((x[1] === "x" && num.toString(16) === x.slice(2)) ||
    (x[1] === "o" && num.toString(8) === x.slice(2)) ||
    (x[1] === "b" && num.toString(2) === x.slice(2)))
    return num;
  while (x[0] === "0")
    x = x.slice(1);
  if (num.toString() === x)
    return num;
}


//simple higher order functions
// * <arrayIndex> ::= <int>
// * <arraySlice> ::= <int> ".." <int>
function arraySlice(x) {
  let [start, end, error] = x.split("..");
  if (end && !error) {
    start = int(start);
    end = int(end);
    if (start !== undefined && end !== undefined)
      return ar => ar.slice(start, end);
  }
}

function arrayAt(x) {
  const i = int(x);
  if (i !== undefined)
    return ar => ar.at(i);
}

function arrayCondition(x) {
  const expression = expression(x);
  return ar => ar.map(o => expression(o) ? o : undefined);
}

function numberValue(x) {
  const num = number(x);
  if (num !== undefined)
    return num;
  const prop = propertyPath(x);
  if (prop !== undefined)
    return o => o[prop];
}

const OPERATORS = {
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "==": (a, b) => a == b,
  "!=": (a, b) => a != b,
  "*=": (a, b) => new RegExp(b.replace(/\*/g, ".*")).test(a),
};

function doCompare(funcs, value) {
  for (let i = 1; i < funcs.length; i += 2) {
    let a = funcs[i - 1], op = funcs[i], b = funcs[i + 1];
    a = typeof a === "function" ? a(value) : a;
    b = typeof b === "function" ? b(value) : b;
    if (!op(a, b))
      return false;
  }
  return true;
}

function wildComparator(x) {
  let [left, right, error] = x.split("*=").map(part => part.trim());
  if (right && !error) {
    left = propertyPath(left);
    right = wild(right);
    right = new RegExp(right.replace(/\*/g, ".*"));
    if (left !== undefined && right !== undefined)
      return value => left(value).match(right);
  }
}
function numComparator(x) {
  let parts = x.split(/^(>=|<=|>|<)$/).map(part => part.trim());
  if (parts.length === 1)
    return primitive(x);
  if (parts.length % 2 === 0)
    throw new Error("Invalid expression");
  parts = parts.map((part, i) => i % 2 ? OPERATORS[part] : numberValue(part));
  return doCompare.bind(null, parts);
}
function identityComparator(x) {
  let parts = x.split(/^(==|!=)$/).map(part => part.trim());
  if (parts.length < 3 || parts.length % 2 === 0)
    throw new Error("Invalid expression");
  parts = parts.map((part, i) => i % 2 ? OPERATORS[part] : numComparator(part));
  return doCompare.bind(null, parts);
}

//value filter parse
/**
 * <valueFilter> ::= <arrayAt> | <arraySlice> | <arrayCondition>
 * 
 * <condition> ::= <expression>
 * <expression> ::= <expression> "||" <term> | <term>
 * <term> ::= <term> "&&" <factor> | <factor>
 * 
 * <factor> ::= "!" <factor> 
 *            | "(" <expression> ")" 
 *            | <num-comparison>
 *            | <wild-comparison>
 *            | <comparison>
 * 
 * <num-comparison> ::= <number-value> ( ">" | ">=" | "<" | "<=" ) <number-value>
 * <wild-comparison> ::= <propertyPath> "*=" <wild-value>
 * <comparison> ::= <propertyPath> ( "==" | "!=" ) <value>
 * 
 * <value> ::= <primitive> | <propertyPath>
 * <number-value> ::= <number> | <propertyPath>
 * <wild-value> ::= <wild> | <propertyPath>
 * 
 * <propertyPath> ::= "@" <identifier>
 */
function condition(str, stringMap) {
  let exps = str.split("||");
  if (exps.length === 1)
    return terms(str, stringMap);
  exps = exps.map(terms, stringMap);
  return ar => exps.some(term => term(ar));
}

function terms(str, stringMap) {
  let exps = str.split("&&");
  if (exps.length === 1)
    return factor(str, stringMap);
  exps = exps.map(factor, stringMap);
  return ar => exps.every(factor => factor(ar));
}

function factor(str, stringMap) {
  if (str[0] === "!") {
    const factor = factor(str.slice(1), stringMap);
    return ar => !factor(ar);
  }
  if (str[0] === "(") {
    const end = str.lastIndexOf(")");
    if (end === -1)
      throw new Error("Missing closing parenthesis");
    return condition(str.slice(1, end), stringMap);
  }
  return numComparator(str, stringMap);
}

function filterStep(steps, db, keys, depth = 0) {
  const { allKeys, exactKeys, keyFilters, valueFilters } = steps[depth];
  let keys2;
  if (allKeys)
    keys2 = keys;
  else {
    keys2 = keys.map(key =>
      exactKeys.includes(key) || keyFilters.some(query => query(key)) ? key :
        undefined);
  }
  let values = keys.map(key => {
    if (key !== undefined)
      for (let vFilter of valueFilters)
        if (vFilter(db[key]) !== undefined)
          return db[key];
  });
  values = values.filter(Boolean);
  if (depth < steps.length - 1) {
    const valuesReduced = filterStep(db, values, steps, depth + 1);
    values = values.filter(value => valuesReduced.includes(value));
  }
  return values;
}

function getParentProp(prop) {
  return function getParentProp() {
    return this.ancestor?.post?.[prop];
  };
}

function getParentPosts() {
  return this.ancestor?.posts;
}

function getPosts() {
  return db.posts;
}
//top level parse
/**
 * <$: | @prop: | @:>keyFilter[arrayFilter].mapper
 * 
 * first we remove all strings into stringMap.
 * second, we split root, keyFilter, arrayFilter, .mapper.
 * all but the root are essentially optional.
 * Then we process the keyFilterList and arrayFilter as.
 * The keyFilter and arrayFilter run against the keys and 
 * the dereferenced objects 
 * If the mapper is wild, then we must make a method that finds the first 
 *  ,m and then the 
 * 
 * third, we split into 
 * Root is either @prop: or $:
 * Then, we have 
 * <query> ::= <step> ( "." <step> )*
 * <step> ::= <keyFilterList> [ <valueFilterList> ]
 * <keyFilterList> ::= <wild> ( "," <wild> )* | <all>
 * <valueFilterList> ::= "[" <valueFilter> ( "," <valueFilter> )* "]" | ε
 * <keyFilter> ::= <wild>
 */
function secondLevelParse(str, stringMap) {
  const match = /^([\w*]+)?(\[([^\]]*)\])$/.exec(str);
  if (!match)
    throw new SyntaxError("bad query: ", str);
  let [_, keyFilter, v, vFilter] = match;

  keyFilter = keyFilterFunc(keyFilter, stringMap);
  vFilter = vFilterFunc(vFilter, stringMap);
  return function (key, value) {
    if (keyFilter(key) && vFilter(value)) return value;
  };
}

function topLevelParse(str) {
  const { str: str2, stringMap } = replaceAll(str);
  let [root, queries, mapper] = str2.split(":");
  root = root == "$" ? getPosts : root == "@" ? getParentPosts : getParentProp(root.slice(1));
  queries = queries.split(",").map(q => secondLevelParse(q, stringMap));
  const mapperFunc = mapper && (obj => obj[mapper]);

  return function () {
    const posts = root.call(this);
    const res = [];
    for (let k of posts) {
      const v = db[k];
      if (queries.some(q => q(k, v))) {
        res.push(v);
        continue;
      }
    }
    return mapperFunc ? res.map(mapperFunc) : res;
  };
}

/*
//top level. Split the query into steps and keyFilters and valueFilters

<query> ::= <step> ( "." <step> )*
<step> ::= <keyFilterList> [ <valueFilterList> ]
<keyFilterList> ::= <wild> ( "," <wild> )* | <all>
<valueFilterList> ::= "[" <valueFilter> ( "," <valueFilter> )* "]" | ε

//process keyFilterLists. This will quickly reduce the list of keys.

//then we will process valueFilters. we take the list of refs, and maps their values.
//each value filter is converted into a function, and for each value in the list, we wil run the function to return true(whitelist), false(we ignore, others might whitelist).
*/