/**
 * Extensions to the generic Object
 */
Object.extend(Hash.prototype, {
  call: function(key, defaultValue) {
    return this.get(key) || defaultValue;
  },
  filterKeys: function(n) {
    var f = n;
    if (!Object.isFunction(n)) {
      f = function(k) { return k.match(n) != null; }
    }
    var re = $H();
    var hash = this;
    this.keys().each(function(k) { if (f(k)) re.set(k, hash.get(k)) });
    return re;
  }
});