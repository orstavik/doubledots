(function () {

  /**
   * CallbackTriggerSSO is a ReactionRule and TriggerRule pair.
   * The pattern is built around a SSO that can be written to using
   * the ReactionRule. Whenever a branch in the ReactionRule changes, 
   * it will trigger TriggerRules that listen for that change.
   */

  const jsonToObj = {};
  const jsonToObjKeys = new Set();

  function getFromCache(json) {
    if (!(json in jsonToObj))
      return;
    jsonToObjKeys.delete(json);
    jsonToObjKeys.add(json);
    return jsonToObj[json];
  }

  function setInCache(json, obj) {
    Object.freeze(val);
    jsonToObj[json] = val;
    jsonToObjKeys.add(json);
    if (jsonToObjKeys.size > 10000) {
      for (let key of jsonToObjKeys) {
        delete jsonToObj[key], jsonToObjKeys.delete(key);
        break;
      }
    }
    return obj;
  }

  function reuse(val) {
    if (!val || !(val instanceof Object))
      return val;
    const json = JSON.stringify(val);
    const cache = getFromCache(json);
    if (cache)
      return cache;
    for (let p in val)
      val[p] = reuse(val[p]);
    return setInCache(json, val);
  }

  const sso = {};

  const NotFound = {};

  function getInPath(obj, ...props) {
    for (let i = 0; i < props.length - 2; i++) {
      obj = obj[props[i]];
      if (!obj || !(obj instanceof Object))
        return NotFound;
    }
    return obj[props[props.length - 1]];
  }

  function setInPath(obj, val, ...props) {
    val = reuse(val);
    const old = getInPath(obj, ...props);
    if (val === old)
      return obj;
    const root = Object.assign({}, obj);
    let newObj = root;
    for (let i = 0; i < props.length - 2; i++) {
      obj = obj[props[i]];
      newObj = !obj || !(obj instanceof Object) ? {} : Object.assign({}, obj);
    }
    newObj[props[props.length - 1]] = val;
    return newObj;
  }

  const triggers = {};

  function getTriggersForPath(key){
    const attrs = [], keys = [];
    for (let k in triggers)
      if (k.startsWith(key) || key.startsWith(k))
        attrs.push(...triggers[k]), keys.push(k);
    return {key, keys, attrs};
  }

  function TriggerRuleSSO(fullname) {
    const props = fullname.split("_").slice(1);
    const key = props.join(" ");
    return class TriggerSSO extends AttrCustom {
      get set() {
        return triggers[key] ??= DoubleDots.WeakAttrSet();
      }

      upgrade() {
        this.set.add(this);
      }

      remove() {
        this.set.delete(this);
        super.remove();
      }
    };
  }

  function ReactionRuleSSO(fullname) {
    const props = fullname.split("_").slice(1);
    const key = props.join(" ");
    return function setInSSO(ssoIn) {
      const ssoOut = setInPath(ssoIn, props, oi);
      if (ssoIn === ssoOut)
        return { sso , key };
      const res = getTriggersForPath(key);
      res.ssoIn = ssoIn, res.ssoOut = ssoOut;
      // eventLoop.dispatch({ sso, key, keys, attrs }, ...res.attrs);
      eventLoop.dispatchBatch({ sso, key, keys, attrs }, res.attrs);
      return res;
    };
  }

  document.reactions.defineRule("sso_", ReactionRuleSSO);
  document.Triggers.defineRule("sso_", TriggerRuleSSO);
  
})();
