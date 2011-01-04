/*
 * Rogue Coding's native.js
 *
 * Generic extensions to JavaScript Prototypes
 *
 * With include of a part of the PrototypeJS-Framework
 * (Excluding the Element and AJAX Stuff)
 *
 * I'm currently working on a replacement or permission from the PrototypeJS Folks
 * to takeover only a part of their framework
 *
 * @version 1.5
 * @requires Basic
 */
 
Native = {
  Version: '1.5',
  // the REQUIRED_PROTOTYPE is subjected to be removed
  REQUIRED_PROTOTYPE: '1.7.0',
  
  //
  // require and load are both inspired by the famous script.aculo.us, thx @ Thomas Fuchs
  //
  require: function(libraryName) {
    if (Object.isArray(libraryName)) {
      libraryName.each(Native.require)
      return;
    }
    
    if (!(/^(https?:\/\/|\/).*/).test(libraryName)) {
      libraryName = Native.path() + libraryName
    }
    
    try {
      // inserting via DOM fails in Safari 2.0, so brute force approach
      document.write('<script type="text/javascript" src="'+libraryName+'"><\/script>');
    } catch (ex) {
      // for xhtml+xml served content, fall back to DOM methods
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = libraryName;
      document.getElementsByTagName('head')[0].appendChild(script);
    }
  },
  
  includedScriptNames: function() {
    return $A(document.getElementsByTagName('script')).filter(function(script) {
      return script.src && script.src != '';
    }).map('src');
  },
  
  path: function() {
    return this.includedScriptNames().cmap(/(.*)native\.js(\?.*)?$/).pluck(1)
  },
  
  load: function() {
    Native.includedScriptNames().cmap(/(.*)native\.js(\?.*)?$/).each(function(s) {
      var path = s[1];
      var includes = s[2].match(/\?.*load=([a-z\_\-\/,]*)/);
      (includes ? includes[1] : []).map(function(include) { 
        Native.require(path + include + '.js') 
      });
    });
  }
};

(function() {
  var readyFunctions = [];
  Native.ready = function(f, ctx) {
    readyFunctions.push(f.bind(ctx))
  }
  
  Event.observe(document, 'dom:loaded', function(e) {
    readyFunctions.eachAfter(0.001, function(f) { f.apply(window, [e]) });
    // replace the ready with direct execution
    Native.ready = function(f, ctx) { f.apply(ctx, []) }
  })
  
  var loadFunctions = [];
  Native.onload = function(f, ctx) {
    loadFunctions.push(f.bind(ctx))
  }
  
  Event.observe(window, 'load', function(e) {
    loadFunctions.eachAfter(0.001, function(f) { f.apply(window, [e]) });
    // replace the onload with direct execution
    Native.onload = function(f, ctx) { f.apply(ctx, []) }
  })
})();

Object.extend(Object, {
  cast: function(o, clazz) {
    return Object.extend(new clazz, o)
  },
  getLegacy: function(o, namesOnly) { 
    var re = [], c = o;
    while ((c = c.prototype || c.__proto__)) re.push(namesOnly ? c.constructor.name : c)
    return re.reverse() 
  },
  map: function(object, fn, ctx) {
    fn = fn || Prototype.K
    var ks = Object.keys(object)
    var re = {}
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i]
      var v = object[k]
      re[k] = fn.apply(ctx, [v, i])
    }
    return re
  },
  $a: function(o) {
    return Object.map(o, function(_) { return $a(_) })
  },
  /**
   * This helper creates several objects by mod picking values of an object
   */
  expand: function(object, count) {
    // ensure a working object with only array values
    var o = Object.$a(object)
    var re = []
    count = count || 1
    if (Object.isString(count)) {
      // use a property of the object, create an object for each of those elements
      count = object[count].length.max(1)
    }
    for (var i = 0; i < count; i++) {
      re.push(Object.map(o, function(v) { return v.modget(i) }))
    }
    return re
  }
})

// undefined shortcut for cleaner (scala-ish code)
try {
  if (Object.isUndefined(window._)) { 
    window._ = undefined 
  }
} catch (ex) {
  window._ = undefined;
}

/**
 * $if pseudo macro for conditional execution
 *
 * @param condition the object, that is tested for existance
 * @param fn        a method or method.name that is called in case of existance
 * @param ...       any further argument will be passed to the fn
 * @return the result of a method call or undefined
 *
 * Example:
 *   $if (element, 'show') // will call element.show() unless element is undefined
 */
function $if() { 
  var args = $A(arguments)
  var condition = args.shift()
  var fn = args.shift() || Prototype.K
  if (condition) return fn.apply(condition, args) 
};

// will throw either the first argument or the context
function $throw(ex) {
  throw ex || this
};

// this tiny method will yield an array in any case
// kind of an option constructor here
function $a() {
  var args = $A(arguments).compact()
  if (args.length == 0) return []
  if (args.length == 1) {
    var first = args[0]
    if (!Object.isArray(first)) first = [first]
    return first
  }
  return args
}

function $map(o, fn, ctx) {
  return Object.map(o, fn, ctx)
}

function $expand(o,c) { 
  return Object.expand(o, c) 
}

