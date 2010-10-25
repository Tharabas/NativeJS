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
 * @version 1.4.0
 * @requires Basic
 */
 
Native = {
  Version: '1.4.0',
  // the REQUIRED_PROTOTYPE is subjected to be removed
  REQUIRED_PROTOTYPE: '1.6.1',
  
  //
  // require and load are both lend from the famous script.aculo.us, thx @ Thomas Fuchs
  //
  require: function(libraryName) {
    try{
      // inserting via DOM fails in Safari 2.0, so brute force approach
      document.write('<script type="text/javascript" src="'+libraryName+'"><\/script>');
    } catch(e) {
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
  
  load: function() {
    var js = /native\.js(\?.*)?$/;
    Native.includedScriptNames().findAll(function(s) {
      return s.match(js);
    }).each(function(s) {
      var path = s.replace(js, '');
      var includes = s.match(/\?.*load=([a-z\_\-,]*)/);
      (includes ? includes[1] : []).map(function(include) { 
        Native.require(path+include+'.js') 
      });
    });
  },
  
  ready: function(callback, scope) {
    window.addEvent('domready', callback);
  }
};

// undefined shortcut for cleaner (scala-ish code)
try {
  if (Object.isUndefined(_)) { _ = undefined }
} catch (ex) {
  _ = undefined;
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
$if = function() { 
  var args = $A(arguments)
  var condition = args.shift()
  var fn = args.shift() || Prototype.K
  if (condition) return fn.apply(condition, args) 
}
