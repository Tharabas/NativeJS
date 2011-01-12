/**
 * Extensions to the generic Object
 */
Object.extend(Hash.prototype, {
  /**
   * Passes the first argument to the getter with a default value
   *
   * @param String key
   * @param Any defaultValue
   * @return Any 
   */
  call: function(key, defaultValue) {
    return this.get(key, defaultValue);
  },
  
  /**
   * Returns a Subset where the keys match a filter
   *
   * @param Function|RegExp n the filter function
   * @param Any ctx a context for the matcher function
   * @return Hash the filtered subset
   */
  filterKeys: function(n, ctx) {
    var f = n;
    if (!Object.isFunction(n)) {
      f = function(k) { return k.match(n) != null; }
    }
    var re = $H();
    var hash = this;
    this.keys().each(function(k) { 
      if (f.apply(ctx, [k])) {
        re.set(k, hash.get(k));
      }
    });
    return re;
  },
  
  /**
   * Returns a Subset where the values match a filter
   *
   * @param Function|RegExp n the filter function
   * @param Any ctx a context for the matcher function
   * @return Hash the filtered subset
   */
  filterValues: function(n, ctc) {
    var f = n;
    if (!Object.isFunction(n)) {
      f = function(v) { return v.match(n) != null; }
    }
    var re = $H();
    var hash = this;
    this.each(function(o) { 
      if (f.apply(ctx, [o.value])) {
        re.set(o.key, o.value); 
      }
    });
    return re;
  },
  
  /**
   * A Setter that allowes chaining
   *
   * @param String key the key to set
   * @param Any value the value to set
   * @return Hash this Hash
   *
   * Example:
   *   $H().put('a', 13).put('b', 37).toObject()
   *   => { a: 13, b: 37 }
   */
  put: function(key, value) {
    this.set(key, value);
    return this;
  },
  
  /**
   * Enhanced the get method to return a defaultValue
   * in case the real value does not exist
   *
   * @param String key the key to return
   * @param Any defaultValue a value that is to be returned
   *            in case there was no value at the given key
   * @return Any the value at the key OR the defaultValue
   * @see Prototype: Hash.get
   */
  get: function(key, defaultValue) {
    if (this._object[key] !== Object.prototype[key]) {
      var re = this._object[key] 
      return Object.isUndefined(re) ? defaultValue : re
    }
  }
});