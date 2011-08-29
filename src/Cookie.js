/**
 * A Browser-Cookie handler Object
 */

(function() {
  var Cookie = window.Cookie = function(name) {
    if ($void(name)) return Cookie.list()
    return new _Cookie(name)
  }
  
  var _Cookie = function Cookie(name) {
    this.name = name
  }
  
  var segment = function() {
    return document.cookie
      .split('; ')       // split by ;
      .map(/(.+)\=(.+)/) // part in 
      .compact()         // drop non matches
      .invoke('shifted') // drop the full-match in the results
  }
  
  var first  = $get(0)
  var second = $get(1)

  Object.extend(Cookie, {
    /**
     * Lists all defined cookies
     */
    list: function() {
      return segment().mapOn(String.asKey.after(unescape.on(1))).merge()
    },
    
    /**
     * Lists the names of all defined cookies
     */
    listNames: function() {
      return segment().map(second)
    },
    
    /**
     * @param name String the name of the cookie to be returned
     */
    get: function(name) {
      return segment()
        .filter(first.is(name))     // keep all, where first element is name
        .map(second.then(unescape)) // return the second value, unescaped
        [0]                         // return the first element
    },
    
    /**
     * @param name  String the name of the cookie to be set
     * @param value Object the value of the cookie
     * @param expires Date optional expiration date
     *
     * @return String the previous value of the cookie
     */
    set: function(name, value, expires, path, domain, secure) {
      if (!Object.isString(value)) {
        value = JSON.stringify(value)
      }
      if (Object.isNumber(expires)) expires = new Date((time() + 86400 * expires) * 1000)
      
      var o = name.asKey(escape(value))
      if (expires) o.expires = expires.toGMTString()
      if (path)    o.path    = path
      if (domain)  o.domain  = domain
      if (secure)  o.secure  = secure
      
      try { 
        return Cookie.get(name)
      } finally {
        document.cookie = $H(o).toArray().invoke('join', '=').join(';')
      }
    },
    
    /**
     * @param name String the name of the to be deleted cookie
     */
    remove: function(names) {
      if (Object.isString(names))  names = names.map()
      if (names instanceof RegExp) names = Cookie.listNames().filter(names)
      if (!Object.isArray(names))  names = Cookie.listNames()
      names.each(Cookie.set._(_, '', new Date(1)))
    }
  })
  
  Object.overwrite(_Cookie, {
    get:    function() { return Cookie.get.apply(null, [this.name].concat($A(arguments)))    },
    set:    function() { return Cookie.set.apply(null, [this.name].concat($A(arguments)))    },
    remove: function() { return Cookie.remove.apply(null, [this.name].concat($A(arguments))) }
  })
  
  Object.overwrite(String, {
    cookie: function(value, expires, path, domain, secure) {
      // grab a cookie wrapper
      var c = Cookie(this + '')
      if ($void(value)) {
        // no value is set, just return the cookie
        return c.get()
      }
      // in case the value is explicitely null -> delete the cookie
      if (value === null) {
        return c.remove()
      }
      // otherwise set it to its new value
      return c.set(value, expires, path, domain, secure)
    },
    
    /**
     * FIXME this should probably be put in somewhere else
     */
    parseJSON: function() {
      return JSON.parse(this + '')
    }
  })
})();