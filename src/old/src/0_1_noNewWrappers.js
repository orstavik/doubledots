(function (StringOG, NumberOG, BooleanOG) {
  const enumerable = true, writable = true, configurable = true;
  function String(...args) {
    if (new.target)
      throw new Error(`Replace "new String(...)" with "String(...)".`);
    return StringOG(...args);
  }
  function Number(...args) {
    if (new.target)
      throw new Error(`Replace "new Number(...)" with "Number(...)".`);
    return NumberOG(...args);
  }
  function Boolean(...args) {
    if (new.target)
      throw new Error(`Replace "new Boolean(...)" with "Boolean(...)".`);
    return BooleanOG(...args);
  }
  Object.defineProperties(window, {
    String: { value: String, enumerable, writable, configurable },
    Number: { value: Number, enumerable, writable, configurable },
    Boolean: { value: Boolean, enumerable, writable, configurable }
  });
})(String, Number, Boolean);

//todo check with for example airbnb and google code
//     style guides for more dev time hard checks that can be added.