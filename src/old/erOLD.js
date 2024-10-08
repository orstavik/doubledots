let triggers = new DoubleDots.AttrWeakSet();

export class Er extends AttrCustom {
  upgrade() {
    triggers.add(this);
  }
}

export function erUpdate(er) {
  queueMicrotask(() =>
    eventLoop.dispatchBatch(Object.assign(new Event("er"), { er }), triggers)
  );
}

//convert the tasks into a set of functions
//cache these functions
//the format is name=keyFilterWithAnythingBut[and=andQuotes[valueFilter][valueFilter]
//the names are added tot res as $name

/**
 * <valueFilter> ::= <arrayAt> | <arraySlice> | <arrayCondition>
 * 
 * <condition> ::= <expression>
 * <expression> ::= <expression> "||" <term> | <term>
 * <term> ::= <term> "&&" <factor> | <factor>
 * 
 * <factor> ::= "!" <factor> 
 *            | <num-comparison>
 *            | <wild-comparison>
 *            | <comparison>
 * 
 * <num-comparison> ::= <number-value> ( ">" | ">=" | "<" | "<=" ) <number-value>
 * <wild-comparison> ::= <objectPath> "*=" <wild-value>
 * <comparison> ::= <objectPath> ( "==" | "!=" ) <value>
 * 
 * <value> ::= <primitive> | <objectPath>
 * <number-value> ::= <number> | <objectPath>
 * <wild-value> ::= <wild> | <objectPath>
 * 
 * <objectPath> ::= "@" <identifier>
 * <refPath> ::= "$" <identifier> | "$"
 */
function extractQuote(str, stringMap = {}, count = 0) {
  str = str.replace(/(["'`])([^\1]*?)\1/g, (_, p1, p2) => {
    stringMap[p1 + count] = p2;
    return `"${count++}"`;
  });
  str.replace(/\s/g, "");
  return { str, stringMap };
}

function makeKeyFilterFunc(keyFilter) {
  return key => keyFilter === key || key.match(key);
}

function makeValueFilterFunc(valueFilter, strMap) {

}

function regexFilters(filters) {
  const regex = /^\s*([^[]*)(\[(.*)\])\s*$/;
  const match = filters.match(regex);
  if (!match)
    throw new Error("omg");
  let [, keyFilter, , valueFilters] = match;
  keyFilter = keyFilter.trim();
  valueFilters = valueFilters.split(/\]\s*\[/).map(s => s.trim());
  return { keyFilter, valueFilters };
}

function processQuery(q, strMap) {
  const [name, filters] = q.split("=");
  if (!name || !filters)
    throw new Error("omg");
  let { keyFilter, valueFilters } = regexFilters(filters);
  keyFilter = makeKeyFilterFunc(keyFilter);
  valueFilters = valueFilters.map(f => makeValueFilterFunc(f, strMap));
  return { [name]: all => all.filter(key => makeFilterFunc(keyFilter, valueFilters, strMap) };
}

const expressions = {
  "==": (left, right) => left === right(context),
  "!=": (left, right) => left !== right(context),
  ">": (left, right) => left > right(context),
  ">=": (left, right) => left >= right(context),
  "<": (left, right) => left < right(context),
  "<=": (left, right) => left <= right(context),
  "*=": (left, right) => right.match(left),
  "has": (left, right) => right.includes(left),
  "||": (left, right) => left(context) || right(context),
  "&&": (left, right) => left(context) && right(context),
  "!": (left, right) => !left(context),
};

function processExpr(expr, strMap) {

  if (expr.split(/has|==/))
}

function processValueFilter(dotProps, expr, strMap) {
  dotProps = dotProps.split(/\s*.\s*/);
  expr = processExpr(expr, strMap);
  return (obj, context) => {
    obj = dotProps.reduce((o, p) => o?.[p], obj);
    return expr(obj, context);
  };
}

function processArrayFilter([one, two]) {
  if (one && two === undefined)
    return ar => ar[one];
  one ||= 0;
  two ||= undefined;
  return ar => ar.slice(one, two);
}

function processKeyFilter(keyFilter) {
  if (!keyFilter || keyFilter === "*")
    return;
  keyFilter = new RegExp(keyFilter);
  return key => key.match(keyFilter);
}

function processQuery2(q, strMap) {
  let m = /^([\w-]+)\s*=\s*([^{\s]+)?(\s*\{\s*([^}]*)\s*\}\s*)?(\s*\[\s*(\d+|\d+\s*:\s*\d*|:\s*\d+)\s*\]\s*)?$/.exec(q);
  if (!m)
    throw new Error("omg");
  let [, name, key, , value, , array] = m;
  key &&= processKeyFilter(key);
  array &&= processArrayFilter(array.split(/\s*:\s*/));
  if (value) {
    value = value.split(/\s*,\s*/).map(f => f.split(/\s*==\s*/));
    value = value.map(([dotProp, expr]) => processValueFilter(dotProp, expr, strMap));
  }
  return { name, keyFilter: key, valueFilters: value, arrayFilter: array };
}

function processQueries(queries) {
  const { str, strMap } = extractQuote(queries);
  const nameFuncs = str.split(";").map(q => processQuery(q, strMap));
  return Object.assign(...nameFuncs, { $: er => Object.keys(er) });
}

export function query(er) {
  //the er should contain a $ property which is all the keys at top level
  //todo this is double used. Because the $ is also the ref to the current object
  //todo so we need this to be different. Maybe $$?
  const machine = processQueries(this.value);
  for (let name in machine)
    res[name] = machine[name](res.$);
  return res;
}


// db:make-epi:query-to-dag:pupdate
function makeEpi(){
  return window.location.pathname;
}

function queryToDag($epi, ER) {
  function* withKey(ER, type, prop, ref) {
    for (let [k, v] of Object.entries(ER))
      if (k.startsWith(type) && Array.isArray(v[prop]) && v[prop].includes(ref))
        yield k;
  }

  function toDag(ER, dollars, key) {
    const res = Object.assign({}, dollars, ER[key]);
    for (let p in res)
      if (res[p] instanceof Array)
        res[p] = res[p].map(k => toDag(ER, dollars, k));
    return res;
  }

  const $season = withKey(ER, "season/", "episodes", $epi).next().value;
  const $series = withKey(ER, "series/", "seasons", $season).next().value;

  const res = toDag(ER, { $epi, $season, $series }, $series);
  return res;
}