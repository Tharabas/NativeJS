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
  },
  put: function(key, value) {
    this.set(key, value);
    return this;
  },
  /**
   * enhanced the get method to return a defaultValue
   * in case the real value does not exist
   */
  get: function(key, defaultValue) {
    if (this._object[key] !== Object.prototype[key]) {
      var re = this._object[key] 
      return Object.isUndefined(re) ? defaultValue : re
    }
  }
});