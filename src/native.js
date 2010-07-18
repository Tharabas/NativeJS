/*
 * Native.js
 *
 * Generic extensions to JavaScript Prototypes
 *
 * With include of a part of the PrototypeJS-Framework
 * (Excluding the Element and AJAX Stuff)
 *
 * I'm currently working on a replacement or permission from the PrototypeJS Folks
 * to takeover only a part of their framework
 */

/*  
 *  Prototype JavaScript framework, version 1.7_rc2
 *  (c) 2005-2010 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {

  Version: '1.7_rc2',

  Browser: (function(){
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    return {
      IE:             !!window.attachEvent && !isOpera,
      Opera:          isOpera,
      WebKit:         ua.indexOf('AppleWebKit/') > -1,
      Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
      MobileSafari:   /Apple.*Mobile/.test(ua)
    }
  })(),

  BrowserFeatures: {
    XPath: !!document.evaluate,

    SelectorsAPI: !!document.querySelector,

    ElementExtensions: (function() {
      var constructor = window.Element || window.HTMLElement;
      return !!(constructor && constructor.prototype);
    })(),
    SpecificElementExtensions: (function() {
      if (typeof window.HTMLDivElement !== 'undefined')
        return true;

      var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

      if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
        isSupported = true;
      }

      div = form = null;

      return isSupported;
    })()
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },

  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;

var Abstract = { };

var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();
(function() {
  var _toString = Object.prototype.toString,
      NULL_TYPE = 'Null',
      UNDEFINED_TYPE = 'Undefined',
      BOOLEAN_TYPE = 'Boolean',
      NUMBER_TYPE = 'Number',
      STRING_TYPE = 'String',
      OBJECT_TYPE = 'Object',
      BOOLEAN_CLASS = '[object Boolean]',
      NUMBER_CLASS = '[object Number]',
      STRING_CLASS = '[object String]',
      ARRAY_CLASS = '[object Array]',
      NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON &&
        typeof JSON.stringify === 'function' &&
        JSON.stringify(0) === '0' &&
        typeof JSON.stringify(Prototype.K) === 'undefined';

  function Type(o) {
    switch(o) {
      case null: return NULL_TYPE;
      case (void 0): return UNDEFINED_TYPE;
    }
    var type = typeof o;
    switch(type) {
      case 'boolean': return BOOLEAN_TYPE;
      case 'number':  return NUMBER_TYPE;
      case 'string':  return STRING_TYPE;
    }
    return OBJECT_TYPE;
  }

  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(value) {
    return Str('', { '': value }, []);
  }

  function Str(key, holder, stack) {
    var value = holder[key],
        type = typeof value;

    if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    var _class = _toString.call(value);

    switch (_class) {
      case NUMBER_CLASS:
      case BOOLEAN_CLASS:
      case STRING_CLASS:
        value = value.valueOf();
    }

    switch (value) {
      case null: return 'null';
      case true: return 'true';
      case false: return 'false';
    }

    type = typeof value;
    switch (type) {
      case 'string':
        return value.inspect(true);
      case 'number':
        return isFinite(value) ? String(value) : 'null';
      case 'object':

        for (var i = 0, length = stack.length; i < length; i++) {
          if (stack[i] === value) { throw new TypeError(); }
        }
        stack.push(value);

        var partial = [];
        if (_class === ARRAY_CLASS) {
          for (var i = 0, length = value.length; i < length; i++) {
            var str = Str(i, value, stack);
            partial.push(typeof str === 'undefined' ? 'null' : str);
          }
          partial = '[' + partial.join(',') + ']';
        } else {
          var keys = Object.keys(value);
          for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i], str = Str(key, value, stack);
            if (typeof str !== "undefined") {
               partial.push(key.inspect(true)+ ':' + str);
             }
          }
          partial = '{' + partial.join(',') + '}';
        }
        stack.pop();
        return partial;
    }
  }

  function stringify(object) {
    return JSON.stringify(object);
  }

  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
    var results = [];
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        results.push(property);
      }
    }
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) === ARRAY_CLASS;
  }

  var hasNativeIsArray = (typeof Array.isArray == 'function')
    && Array.isArray([]) && !Array.isArray({});

  if (hasNativeIsArray) {
    isArray = Array.isArray;
  }

  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return typeof object === "function";
  }

  function isString(object) {
    return _toString.call(object) === STRING_CLASS;
  }

  function isNumber(object) {
    return _toString.call(object) === NUMBER_CLASS;
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  extend(Object, {
    extend:        extend,
    inspect:       inspect,
    toJSON:        NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          Object.keys || keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isUndefined:   isUndefined
  });
})();
Object.extend(Function.prototype, (function() {
  var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function argumentNames() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function bind(context) {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  function bindAsEventListener(context) {
    var __method = this, args = slice.call(arguments, 1);
    return function(event) {
      var a = update([event || window.event], args);
      return __method.apply(context, a);
    }
  }

  function curry() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

  function delay(timeout) {
    var __method = this, args = slice.call(arguments, 1);
    timeout = timeout * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  }

  function wrap(wrapper) {
    var __method = this;
    return function() {
      var a = update([__method.bind(this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function methodize() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = update([this], arguments);
      return __method.apply(null, a);
    };
  }

  return {
    argumentNames:       argumentNames,
    bind:                bind,
    bindAsEventListener: bindAsEventListener,
    curry:               curry,
    delay:               delay,
    defer:               defer,
    wrap:                wrap,
    methodize:           methodize
  }
})());

(function(proto) {
  function toISOString() {
    return this.getUTCFullYear() + '-' +
      (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
      this.getUTCDate().toPaddedString(2) + 'T' +
      this.getUTCHours().toPaddedString(2) + ':' +
      this.getUTCMinutes().toPaddedString(2) + ':' +
      this.getUTCSeconds().toPaddedString(2) + 'Z';
  }

  function toJSON() {
    return this.toISOString();
  }

  if (!proto.toISOString) proto.toISOString = toISOString;
  if (!proto.toJSON) proto.toJSON = toJSON;

})(Date.prototype);


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch(e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, (function() {
  var NATIVE_JSON_PARSE_SUPPORT = window.JSON &&
    typeof JSON.parse === 'function' &&
    JSON.parse('{"test": true}').test;

  function prepareReplacement(replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function(match) { return template.evaluate(match) };
  }

  function gsub(pattern, replacement) {
    var result = '', source = this, match;
    replacement = prepareReplacement(replacement);

    if (Object.isString(pattern))
      pattern = RegExp.escape(pattern);

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  }

  function sub(pattern, replacement, count) {
    replacement = prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  }

  function scan(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  }

  function truncate(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  }

  function strip() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function stripTags() {
    return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
  }

  function stripScripts() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  }

  function extractScripts() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  }

  function evalScripts() {
    return this.extractScripts().map(function(script) { return eval(script) });
  }

  function escapeHTML() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function unescapeHTML() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }


  function toQueryParams(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  }

  function toArray() {
    return this.split('');
  }

  function succ() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  }

  function times(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  }

  function camelize() {
    return this.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function capitalize() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  }

  function underscore() {
    return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
  }

  function dasherize() {
    return this.replace(/_/g, '-');
  }

  function inspect(useDoubleQuotes) {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }

  function unfilterJSON(filter) {
    return this.replace(filter || Prototype.JSONFilter, '$1');
  }

  function isJSON() {
    var str = this;
    if (str.blank()) return false;
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/).test(str);
  }

  function evalJSON(sanitize) {
    var json = this.unfilterJSON(),
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    if (cx.test(json)) {
      json = json.replace(cx, function (a) {
        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      });
    }
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  }

  function parseJSON() {
    var json = this.unfilterJSON();
    return JSON.parse(json);
  }

  function include(pattern) {
    return this.indexOf(pattern) > -1;
  }

  function startsWith(pattern) {
    return this.lastIndexOf(pattern, 0) === 0;
  }

  function endsWith(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.indexOf(pattern, d) === d;
  }

  function empty() {
    return this == '';
  }

  function blank() {
    return /^\s*$/.test(this);
  }

  function interpolate(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }

  return {
    gsub:           gsub,
    sub:            sub,
    scan:           scan,
    truncate:       truncate,
    strip:          String.prototype.trim || strip,
    stripTags:      stripTags,
    stripScripts:   stripScripts,
    extractScripts: extractScripts,
    evalScripts:    evalScripts,
    escapeHTML:     escapeHTML,
    unescapeHTML:   unescapeHTML,
    toQueryParams:  toQueryParams,
    parseQuery:     toQueryParams,
    toArray:        toArray,
    succ:           succ,
    times:          times,
    camelize:       camelize,
    capitalize:     capitalize,
    underscore:     underscore,
    dasherize:      dasherize,
    inspect:        inspect,
    unfilterJSON:   unfilterJSON,
    isJSON:         isJSON,
    evalJSON:       NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
    include:        include,
    startsWith:     startsWith,
    endsWith:       endsWith,
    empty:          empty,
    blank:          blank,
    interpolate:    interpolate
  };
})());

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return (match[1] + '');

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = (function() {
  function each(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  function eachSlice(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  }

  function all(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  }

  function any(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  }

  function collect(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function detect(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  }

  function findAll(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function grep(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(RegExp.escape(filter));

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function include(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  }

  function inGroupsOf(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  }

  function inject(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }

  function invoke(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  }

  function max(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  }

  function min(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  }

  function partition(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  }

  function pluck(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  }

  function reject(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function sortBy(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  }

  function toArray() {
    return this.map();
  }

  function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  }

  function size() {
    return this.toArray().length;
  }

  function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }

  return {
    each:       each,
    eachSlice:  eachSlice,
    all:        all,
    every:      all,
    any:        any,
    some:       any,
    collect:    collect,
    map:        collect,
    detect:     detect,
    findAll:    findAll,
    select:     findAll,
    filter:     findAll,
    grep:       grep,
    include:    include,
    member:     include,
    inGroupsOf: inGroupsOf,
    inject:     inject,
    invoke:     invoke,
    max:        max,
    min:        min,
    partition:  partition,
    pluck:      pluck,
    reject:     reject,
    sortBy:     sortBy,
    toArray:    toArray,
    entries:    toArray,
    zip:        zip,
    size:       size,
    inspect:    inspect,
    find:       detect
  };
})();

function $A(iterable) {
  if (!iterable) return [];
  if ('toArray' in Object(iterable)) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

Array.from = $A;

(function() {
  var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

  function each(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  }
  if (!_each) _each = each;

  function clear() {
    this.length = 0;
    return this;
  }

  function first() {
    return this[0];
  }

  function last() {
    return this[this.length - 1];
  }

  function compact() {
    return this.select(function(value) {
      return value != null;
    });
  }

  function flatten() {
    return this.inject([], function(array, value) {
      if (Object.isArray(value))
        return array.concat(value.flatten());
      array.push(value);
      return array;
    });
  }

  function without() {
    var values = slice.call(arguments, 0);
    return this.select(function(value) {
      return !values.include(value);
    });
  }

  function reverse(inline) {
    return (inline === false ? this.toArray() : this)._reverse();
  }

  function uniq(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  }

  function intersect(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  }


  function clone() {
    return slice.call(this, 0);
  }

  function size() {
    return this.length;
  }

  function inspect() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }

  function indexOf(item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
      if (this[i] === item) return i;
    return -1;
  }

  function lastIndexOf(item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  }

  function concat() {
    var array = slice.call(this, 0), item;
    for (var i = 0, length = arguments.length; i < length; i++) {
      item = arguments[i];
      if (Object.isArray(item) && !('callee' in item)) {
        for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
          array.push(item[j]);
      } else {
        array.push(item);
      }
    }
    return array;
  }

  Object.extend(arrayProto, Enumerable);

  if (!arrayProto._reverse)
    arrayProto._reverse = arrayProto.reverse;

  Object.extend(arrayProto, {
    _each:     _each,
    clear:     clear,
    first:     first,
    last:      last,
    compact:   compact,
    flatten:   flatten,
    without:   without,
    reverse:   reverse,
    uniq:      uniq,
    intersect: intersect,
    clone:     clone,
    toArray:   clone,
    size:      size,
    inspect:   inspect
  });

  var CONCAT_ARGUMENTS_BUGGY = (function() {
    return [].concat(arguments)[0][0] !== 1;
  })(1,2)

  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
  function initialize(object) {
    this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
  }


  function _each(iterator) {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  }

  function set(key, value) {
    return this._object[key] = value;
  }

  function get(key) {
    if (this._object[key] !== Object.prototype[key])
      return this._object[key];
  }

  function unset(key) {
    var value = this._object[key];
    delete this._object[key];
    return value;
  }

  function toObject() {
    return Object.clone(this._object);
  }



  function keys() {
    return this.pluck('key');
  }

  function values() {
    return this.pluck('value');
  }

  function index(value) {
    var match = this.detect(function(pair) {
      return pair.value === value;
    });
    return match && match.key;
  }

  function merge(object) {
    return this.clone().update(object);
  }

  function update(object) {
    return new Hash(object).inject(this, function(result, pair) {
      result.set(pair.key, pair.value);
      return result;
    });
  }

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  function toQueryString() {
    return this.inject([], function(results, pair) {
      var key = encodeURIComponent(pair.key), values = pair.value;

      if (values && typeof values == 'object') {
        if (Object.isArray(values))
          return results.concat(values.map(toQueryPair.curry(key)));
      } else results.push(toQueryPair(key, values));
      return results;
    }).join('&');
  }

  function inspect() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }

  function clone() {
    return new Hash(this);
  }

  return {
    initialize:             initialize,
    _each:                  _each,
    set:                    set,
    get:                    get,
    unset:                  unset,
    toObject:               toObject,
    toTemplateReplacements: toObject,
    keys:                   keys,
    values:                 values,
    index:                  index,
    merge:                  merge,
    update:                 update,
    toQueryString:          toQueryString,
    inspect:                inspect,
    toJSON:                 toObject,
    clone:                  clone
  };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
  function toColorPart() {
    return this.toPaddedString(2, 16);
  }

  function succ() {
    return this + 1;
  }

  function times(iterator, context) {
    $R(0, this, true).each(iterator, context);
    return this;
  }

  function toPaddedString(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  }

  return {
    toColorPart:    toColorPart,
    succ:           succ,
    times:          times,
    toPaddedString: toPaddedString
  };
})());

function $R(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
  function initialize(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  }

  function _each(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  }

  function include(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }

  return {
    initialize: initialize,
    _each:      _each,
    include:    include
  };
})());


/**
 *
 * Rogue Coding native.js
 * 
 * All purpose small Datatypes and Extesions to native Datatypes
 * 
 * @version 1.4.0
 */
 
Native = {
  Version: '1.4.0',
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
  }
};

/**
 * Extension of the Number prototype
 * The whole Math methods will be methodized to any number,
 * this means instead of sqrt(5) you can call (5).sqrt()
 * and likewise with higher arity methods: min(1,2,3) >> (1).min(2,3)
 *
 * This might not seem handy at first place, but will be very useful
 * for functional programming
 *
 * e.g.: use Math.sum to sum all numbers within an Array
 * var arr = [1,3,3,7];
 * var sum = arr.reduce(Math.sum) => 14
 */

Object.extend(Math, {
  //
  // simple math functions
  //
  
  ident: function(number) {
    return number;
  },
  
  negate: function(number) {
    return -number;
  },
  
  /**
   * boolean not
   */
  not: function(number) {
    return !number;
  },
  
  /**
   * Bitwise inversion
   */
  invert: function(number) {
    return ~number;
  },
  
  sum: function(one, two) {
    return one + two;
  },

  sub: function(one, two) {
    return one - two;
  },

  mul: function(one, two) {
    return one * two;
  },

  div: function(one, two) {
    return one / two;
  },
  
  increase: function(number) {
    return number + 1;
  },
  
  decrease: function(number) {
    return number - 1;
  },
  
  //
  // reversed order pow
  //  
  rpow: function(exp, base) {
    return Math.pow(base, exp);
  },

  //
  // two named simple functions, just like sqrt
  //
  
  transpose: function(number) {
    return 1 / number;
  },
  
  twice: function(number) {
    return number + number;
  },
  
  half: function(number) {
    return 0.5 * number;
  },
  
  // = x ^ 2
  // = rpow(2, x)
  square: function(number) {
    return number * number;
  },
  
  //
  // logic functions
  //

	and: function(one, two) {
		return one & two;
	},
	
	or: function(one, two) {
		return one | two;
	},
	
	xor: function(one, two) {
		return one ^ two;
	},
	
	nor: function(one, two) {
		return !(one | two);
	},
	
	nand: function(one, two) {
		return !(one & two);
	},
	
	not: function(value) {
		return !value;
	},
	
	equal: function(one, two) {
    return one == two;
  },
  
  identical: function(one, two) {
    return one === two;
  },
	
	empty: function(value) {
		if (Object.isUndefined(value) || value == null) {
			return true;
		}
		if (Object.isString(value) && value.strip().length == 0) {
			return true;
		}
		if (Object.isNumber(value) && parseFloat(value) == 0) {
			return true;
		}
		if (Object.isArray(value) && value.length == 0) {
			return true;
		}
		if (typeof(value) == 'object' && $H(value).toArray().length == 0) {
		  return true;
		}
		return false;
	},
	
  notEmpty: function(value) {
   return !Math.empty(value);
  },
  
  /**
   * @return boolean true when the Number is an even number
   */
  isEven : function(number) {
    return number % 2 == 0;
  },
  /**
   * @return boolean true when the Number is an odd number
   */
  isOdd : function(number) {
    return number % 2 == 1;
  },
  
  /**
   * Was here before I knew that toFixed(digits) existed
   */
  fix: function(number, digits) {
    return number.toFixed(digits);
  },
  
  /**
   * @return int random number form 0 to this, rounded
   */
  ran: function(number) {
    return Math.round(Math.random() * number);
  },
  
  /**
   * will return zero if the condition is met
   * the number itself otherwise
   */
  zeroIf: function(number, condition) {
    if (!Object.isFunction(condition)) {
      return condition == number ? 0 : number;
    }
    return condition(number) ? 0 : number;
  },
  
  /**
   * will return one if the condition is met
   * the number itself otherwise
   */
  oneIf: function(number, condition) {
    if (!Object.isFunction(condition)) {
      return condition == number ? 1 : number;
    }
    return condition(number) ? 1 : number;
  },
  
  /**
   * Tests whether the first number is equal to any 
   */
  isAny: function() {
    var args = $A(arguments);
    var number = args.shift();
    
    for (var i = 0; i < args.length; i++) {
      if (number.equal(args[i])) {
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * creates an array of numbers from a starting number to an end giving a stepping
   * stepping may be omitted
   */
  to: function(start, end, step) { 
    if (Object.isUndefined(step)) {
      step = start < end ? 1 : -1;
    }
    step = parseInt(step);
    var re = []; 
    for (var i = start; step > 0 ? i <= end : i >= end; i += step) re.push(i);
    return re; 
  },
  
  /**
   * @return the number ensuring it to be within [min,max] bounds
   */
  inside: function(number, min, max) {
    var i;
    if (min instanceof Interval) {
      i = min;
    } else {
      i = $I(min, max);
    }
  	if (i == null) {
  		return number;
  	}
  	return i.snap(number);
  },
  snap: function(number, v, f) {
    if (Object.isUndefined(f) || !f) {
      f = Math.round;
    }
    if (Object.isUndefined(v) || !v) {
      return f(number);
    }
    return f(number / v) * v;
  },
  /**
   * @return boolean true when this Number is not greater than max and not smaller than min
   */
  isWithin: function(number, min, max) {
  	var i = $I(min, max);
  	if (i == null) {
  		return false;
  	}
  	return i.contains(number);
  },
  /**
   * @return boolean true when this Number is smaller than min or greater than max
   */
  isOutside: function(number, min, max) {
  	var i = $I(min, max);
  	if (i == null) {
  		return true;
  	}
  	return !i.contains(number);
  },
  /**
   * @return String the HEX Value of this Number
   */
  toHex: function(number) {
  	return number.toString(16).toUpperCase();
  },
  /**
   * @return String the Binary value of this Number
   */
  toBinary: function(number) {
  	return number.toString(2);
  }  
});
$H(Math).each(function(m) { 
  Number.prototype[m.key] = m.value.methodize();
});
$w('abs acos asin atan ceil cos exp floor log max min pow round sin sqrt tan').each(function(n) {
  Number.prototype[n] = Math[n].methodize();
});

/**
 * Extension to the generic Number Object.
 */
Object.extend(Number.prototype, {
	/**
	 * HR_SUFFIXES are the suffixes for human readable number output
	 */
  HR_SUFFIXES: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'],
  
  /**
   * Returns a human readable form of a number.
   * If no arguments are supplied it uses 2 digits base 1024.
   * 
   * @param digits    the number of postpoint-digits
   * @param base      the base
   * @param tolerance 
   * 
   * @return String the human readable form of the number
   */
  hr: function(digits, base, tolerance) {
    if (Object.isUndefined(digits)) {
      digits = 2;
    }
    if (Object.isUndefined(base)) {
      base = 1024;
    }
    var t = base * (Object.isUndefined(tolerance) ? 0.5 : tolerance);
    var v = this;
    var n = 0;
    while (n < Number.prototype.HR_SUFFIXES.length && v > t) {
      v /= base;
      n++;
    }
    
    return v.fix(digits) + Number.prototype.HR_SUFFIXES[n];
  },

  /**
   * @return Number random number from 0 to this
   */
  random: function() {
  	return Math.random() * this;
  },
  /**
   * @return int the number of positive digits in this Number
   */
  digits: function() {
  	var re = 1;
  	var tmp = this;
  	while ((tmp /= 10) > 1) {
  		re++;
  	}
  	return re;
  },
  
  /**
   * Transforms a Number to a Time.
   * Example: 13.5 -> 13:30:00 
   * 
   * @return String a time string
   */
  toTime: function(glue, base, snaps) {
  	if (Object.isUndefined(base) || base == null) {
  		base = 60;
  	}
  	if (Object.isUndefined(glue) || glue == null) {
  		glue = ':';
  	}
  	if (Object.isUndefined(snaps) || snaps == null) {
  		snaps = 3;
  	}
  	
  	var re = [];
  	var d = this;
  	var i = 0;
  	while (i < snaps) {
  		var n = (i == snaps - 1) ? d.round() : d.floor();
  		re.push(n.toPaddedString(2));
  		d = (d - n) * base;
  		i++;
  	}
  	
  	return re.join(glue);
  },
  /**
   * Just as toTime, but does not return seconds
   */
  toShortTime: function() {
  	var t = this.toTime();
  	if (t.startsWith('0')) {
  		t = t.substring(1);
  	}
  	while (t.endsWith(':00')) {
  		t = t.cutoff(3);
  	}
  	return t;
  }
});

/**
 * Extension to the generic String Object.
 */
Object.extend(String, {
  rot13_lower: 'abcdefghijklmnopqrstuvwxyz',
  rot13_upper: 'ABCDEFGHIJKLMNOPQRSTUVWYXZ',
  rot13c: function(c) {
    var i;
    if ((i = String.rot13_lower.indexOf(c)) != -1) {
      return String.rot13_lower[(i + 13) % 26];
    }
    if ((i = String.rot13_upper.indexOf(c)) != -1) {
      return String.rot13_upper[(i + 13) % 26];
    }
    return c;
  }
});
Object.extend(String.prototype, {
  apply: function() { 
    var args    = $A(arguments)
    var context = args.shift()
    var fn      = context[this] || Math.ident
    return fn.apply(context, args)
  },
  call: function(context, value, index) {
    try { return value[this + ''] } catch (ex) { } return undefined;
  },
  each: function(f, context) {
    f = f || Math.ident;
    this.split(this.contains(',') ? /\s*,\s*/ : /\s+/).each(f, context);
  },
  map: function(f, context) {
    f = f || Math.ident;
    return this.split(this.contains(',') ? /\s*,\s*/ : /\s+/).map(f, context);
  },
  toArray: function() {
    var a = [];
    for (var i = 0;  i < this.length; i++) a.push(this[i]);
    return a;
  },
  reverse: function() {
    return this.toArray().reverse().glue();
  },
  rot13: function() {
    return this.toArray().map(String.rot13c).glue();
  },
  contains: function(needle) {
    // ... the eternal void is part of everything ...
    if (!needle) { return true }
    return this.indexOf(needle) != -1;
  },
  containsIgnoringCase: function(needle) {
    // ... the eternal void is part of everything ...
    if (!needle) { return true }
    return this.toLowerCase().indexOf(needle.toLowerCase()) != -1;
  },
  /**
   * @return int occurrences of needle within this String
   */
  count: function(needle) {
    var n = 0;
    var pos = -1;
    
    while ((pos = this.indexOf(needle, pos + 1)) != -1) {
      n++;
    } 
    
    return n;
  },
  /**
   * Cuts off n characters from the end of the String
   */
  cutoff: function(length) {
  	return this.substring(0, this.length - length);
  },
  
  /**
   * Modifies this string to begin with a given prefix.
   * If it already starts with that prefix it will stay untouched
   *
   * @param  prefix string 
   * @return this string
   */
  startWith: function(prefix) {
    if (this.startsWith(prefix)) {
      return this + '';
    }
    
    return prefix + this;
  },
  
  /**
   * Modifies this string to end with a given suffix.
   * If it already ends with that suffix it will stay untouched
   *
   * @param prefix string 
   * @return this string
   */
  endWith: function(suffix) {
    if (this.endsWith(suffix)) {
      return this + '';
    }
    
    return this + suffix;
  },
  
  /**
   * @return string the same string with an ensured upper first char
   */
  ucfirst: function() {
    return this.substring(0, 1).toUpperCase() + this.substring(1);
  },
  
  /**
   * @return string the substring after a given sequence
   */
  substringAfter: function(sequence, length) {
    return this.substring(this.indexOf(sequence) + sequence.length, length);
  },
  
  /**
   * @return string the substring before a given sequence
   */
  substringBefore: function(sequence, length) {
    var pos = this.lastIndexOf(sequence);
    if (pos == -1) {
      return null;
    }
    
    if (!Object.isUndefined(length)) {
      return this.substr(pos - length, length);
    }
    
    return this.substring(0, pos);
  },
  
  /**
   * @return string the substring between the first <start> and the last <end>
   */
  substringBetween: function(start, end) {
    return this.substringAfter(start).substringBefore(end);
  },
  
  /**
   * Enlarges a string to match a desired size.
   * Appends suffix until at least the desired size is reached.
   * 
   * @return String
   */
  lengthen: function(len, suffix) {
  	if (this.length >= len) {
  		return this;
  	}
  	
  	if (Object.isUndefined(suffix)) {
  		suffix = ' ';
  	}
  	var re = this;
  	while (re.length < len) {
  		re += suffix;
  	}
  	if (re.length > len) {
  		re = re.substring(0, len);
  	}
  	
  	return re;
  },
  
  /**
   * evaluates this string as an object
   */
  parseObject: function(evalValues, separator, delimiter, escapeChar) {
    var bEval = (evalValues === true);
    var separ = separator || ",";
    var delim = delimiter || ":";
    var escha = escapeChar || "'";
    
    var re = new Object();
    
    var objects = this.split(separ);
    var phrase = null;
    
    for (var i = 0; i < objects.length; i++) {
      var sub = objects[i];
      if (phrase != null) {
        sub = phrase + separ + sub;
      }
      
      if (sub.count(escha).isOdd()) {
        phrase = sub;
      } else if (sub.length > 0) {
        phrase = null;
        
        var kvp = sub.strip().split(delim);
        var key = kvp.shift().strip();
        var value = kvp.join(delim).strip();
        
        if (bEval) {
          try {
            re[key] = eval(value);
          } catch (ex) {
            re[key] = key + ":" + ex.message;
          }
        } else {
          if (value.startsWith(escha) && value.endsWith(escha)) {
            value = value.substr(1, value.length - 2);
          }
          re[key] = value.gsub(escha + escha, escha);
        }
      }     
    }
    
    return re;
  },
  /**
   * Returns the integer-value this String contains
   * @return int
   */
  intval: function() {
    var s = 0; 
    while (this.charAt(s) == '0') {
      s++;
    };
    return parseInt(this.substring(s));
  },
  TIME_SPLIT: /(\d{2})(?:\:(\d{2})(?:\:(\d{2}))?)?/,
  /**
   * Returns the Number value for a time-string this String contains
   * @see Number.toTime
   * @return Number
   */
  floatime: function() {
  	var m = this.TIME_SPLIT.exec(this);
  	if (m == null) {
  		return parseFloat(this);
  	}
  	
  	var hours = m[1].intval();
  	var minutes = (m[2] || "0").intval() || 0;
  	var seconds = (m[3] || "0").intval() || 0;
  	
  	return hours 
  		+ minutes / 60 
  		+ seconds / 3600;
  },
  /**
   * Creates a XML-Tag from the current String
   * 
   * @return String
   */
  tag: function(attributes) {
    if (Object.isUndefined(attributes)) {
      attributes = { };
    } else if (Object.isString(attributes)) {
    	attributes = {
    		'class': attributes
    	};
    }
    var re = [];
    
    re.push('<' + this);
    
    for (var e in attributes) {
    	var ae = attributes[e];
    	
    	if (e.toLowerCase() == 'style' && !Object.isString(ae)) {
    	  var styles = [];
    	  for (var se in ae) {
    	    styles.push(se + ': ' + ae[se] + ';');
    	  }
    	  re.push(' style="' + styles.join(' ') + '"');
    	} else if (Object.isArray(ae)) {
    		re.push(' ' + e + '="' + ae.join(' ') + '"');
    	} else {
	      re.push(' ' + e + '="' + ae + '"');
    	}
    }
  	
  	re.push('>');
  	
  	return re.glue();
  },
  
  /**
   * Wraps the current String in a XML-Tag
   * 
   * &lt;tag attributes...&gt;this&lt;/tag&gt;
   * 
   * @see String.tag
   * @return String
   */
  wrap: function(tag, attributes) {
    if (Object.isUndefined(tag)) {
      tag = 'strong';
    }
    if (Object.isUndefined(attributes)) {
      attributes = { };
    }
    var re = [];
    
    re.push(tag.tag(attributes));
    re.push(this);
    re.push('</' + tag + '>');
    
    return re.glue();
  },
  /**
   * @return String this String plus a HTML line break
   */
  br: function(clearing) {
    if (!Object.isUndefined(clearing)) {
      return this + '<br clear="' + clearing + '" />';
    }
  	return this + '<br />';
  },
  /**
   * @return String this String plus a HTML HR
   */
  hr: function() {
  	return this + '<hr />';
  },
  
  /**
   * Returns a getter Name for this string.
   * 'type'  -> 'getType'
   * 'my_id' -> 'getMyId'
   * ...
   *
   * @return String a getter variant of this string
   */
  getterName: function() {
    return ('get-' + this.dasherize()).camelize();
  },
  
  /**
   * Returns the bean-type getter of this string on a given host object
   */
  getter: function(host) {
    var m = this.getterName();
    return host && m in host ? host[m].bind(host) : undefined
  },
  
  /**
   * Returns a setter Name for this string.
   * 'type'  -> 'setType'
   * 'my_id' -> 'setMyId'
   *
   * @return String a setter variant of this string
   */
  setterName: function() {
    return ('set-' + this.dasherize()).camelize();
  },
  
  /**
   * Returns the bean-type setter of this string on a given host object
   */
  setter: function(host) {
    var m = this.setterName();
    return host && m in host ? host[m].bind(host) : undefined
  },
   
  /**
   * Test whether this string is any of the given strings.
   *
   * 'BUTTON'.isAnyOf('A BUTTON IMG', ' ') == true
   * 'BUTTON'.isAnyOf('A BUTTON IMG')      == false
   *
   * @param strings String or Array of Strings
   * @param delim String   string that will split the given Strings
   */
  isAnyOf: function(strings, delim) {
    if (!Object.isUndefined(delim) && Object.isString(strings)) {
      strings = strings.split(delim);
    }
    
    if (Object.isArray(strings)) {
      for (var i = 0; i < strings.length; i++) {
        if (this == strings[i]) {
          return true;
        }
      }
    }
    
    return false;
  }
});

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

/**
 * Extension to the generic Array Object.
 */
Object.extend(Array.prototype, {
  /**
   * 
   */
  apply: function() {
    var args = $A(arguments);
    var context = args.shift();
    return this.map(function(v, i) {
      return v.apply(context, args.concat(i));
    })
  },
  
  /**
   * Used for rotating enumerable calls (each/map)
   *
   * (1).to(10).map([Math.square]) 
   * => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
   *
   * (1).to(10).map([Math.square, Math.twice])
   * => [1, 4, 9, 8, 25, 12, 49, 16, 81, 20]
   */
  call: function(context, value, index) {
    var f = this[index % this.length] || Prototype.K;
    return f.call(context, value, index);
  },
  /**
   * Simple shortcut for slice(0) on this array
   */
  copy: function() {
    return this.slice(0);
  },
  
  /**
   * Splits this array into two arrays at a given index
   *
   * @returns array containing two arrays
   */
  splitAt: function(index) {
    if (index >= this.length) {
      return [this, []];
    } else if (index < -this.length) {
      return [[], this];
    } else if (index < 0) {
      index += this.length;
    }
    return [this.slice(0, index), this.slice(index, this.length)];
  },
  
  /**
   * Inserts some elements at a specified index
   *
   * @param index the index to split at
   * @param ...   any following element will be inserted at that point
   * @return a new array containing the result of the combined arrays
   */
  insert: function() {
    var args = $A(arguments);
    var index = args.shift();
    var parts = this.splitAt(index);
    return parts[0].concat(args).concat(parts[1]);
  },
  
  /**
   * returns the n-th element of this array
   * allows a default value to be returned in case the item does not exist
   * also allows negative values, that will be used fron the end of the array
   * -1 specifies the last element
   */
  item: function(n, defaultValue) {
    if (n < 0) {
      n = this.length + n;
    }
    if (n < 0 || n >= this.length) {
      if (Object.isDefined(defaultValue)) {
        return defaultValue;
      }
      throw "Index out of Bounds: " + n + " is not within [0;" + (this.length - 1) + "]";
    }
    return this[n];
  },
  /**
   * simple reduce (left) method
   * calls the passed function on the first two elements of this array
   * the result temporarily replaces those two
   * in case there is only one value left it will be returned
   *
   * empty arrays will return undefined, be aware of that
   */
  reduce: function(f) {
    // non recursive implementation
    if (!this.length) {
      return undefined;
    }
    f = f || Prototype.K;
    var re = this[0];
    if (Object.isArray(f)) {
      for (var i = 1; i < this.length; i++) {
        var v = this[i];
        re = f[i % f.length](re, v);
      }
    } else {
      for (var i = 1; i < this.length; i++) {
        var v = this[i];
        re = f(re, v);
      }
    }
    return re;
  },
  
  /**
   * fold right
   */
  reduceRight: function(f) {
    return this.copy().reverse().reduce(f);
  },
  
  /**
   * String Function shortcut for this.join("");
   */
  glue: function() {
  	return this.join("");
  },
  
  /**
   * exchanges two elements of this array by their indices
   */
  swap: function(one, another) {
    var t = this[another];
    this[another] = this[one];
    this[one] = t;
    return this;
  },
    
  indexOf: function(compare, start) {
    if (Object.isUndefined(start)) {
      start = -1;
    }
    var idx = -1;
    this.each(function(v, i) {
      if (i > start && Object.isFunction(compare) ? compare(v, i) : compare == v) {
        idx = i;
        throw $break;
      }
    });

    return idx;
  },
  
  after: function(compare, defaultValue) {
    return this.get(this.indexOf(compare) + 1, defaultValue);
  },
  
  before: function(compare, defaultValue) {
    return this.get(this.indexOf(compare) - 1, defaultValue);
  },
  
  get: function(index, defaultValue) {
    if (index < 0 || index >= this.length) {
      return defaultValue;
    }
    return this[index];
  },
  
  modget: function(index, defaultValue) {
    if (this.length == 0) {
      return defaultValue;
    }
    while (index < 0) { 
      index += this.length 
    }
    return this[index % this.length];
  },
  
  /**
   * contains test whether a specified needle element is part of this array
   * 
   * @param needle any object that is suspected to be within the array
   * @return true if the needle is part of the array, false otherwise
   */
  contains: function(needle, regex, part) {
  	if (Object.isUndefined(regex)) {
  		regex = false;
  	}
  	
    for (var i = 0; i < this.length; i++) {
      if (regex) {
      	var match = needle.exec(this[i]);
      	if (match != null) {
      		if (Object.isUndefined(part)) {
	      		return this[i];
      		} else {
      			return match[part];
      		}
      	}
      } else {
	      if (this[i] == needle) {
	        return true;
	      }
      }
    }
    
    return false;
  },
  
  /**
   * Returns an array of keys defined in this Object
   *
   * @param expr RegEx if given only strings matching this expression will be returned
   * @return Array
   */
  getKeys: function(expr) {
		var re = [];
  	
  	if (Object.isUndefined(expr)) {
  		for (var e in this) {
  			re.push(e);
  		}
  	} else {
  		for (var e in this) {
  			if (e.match(expr) != null) {
  				re.push(e);
  			}
  		}
  	}
  	
		return re;
  },
  
  /**
   * @return array containing the removed values;
   */
  removeValue: function(value, regex) {
  	if (Object.isUndefined(regex)) {
  		regex = false;
  	}
  	
  	var re = [];
  	
  	for (var i = 0; i < this.length; i++) {
  		var v = this[i];
  		if (regex) {
  			if (Object.isString(v) && value.exec(v) != null) {
  				re.push(this.splice(i, 1));
  				i--;
  			}
  		} else {
  			if (v == value) {
  				re.push(this.splice(i, 1));
  				i--;
  			}
  		}
  	}
  	
  	return re;
  },
  /**
   * wrap, just as its subfunctions prefix and suffix, modifies the values of an array.
   * 
   * A wrapped array will only contain string values.
   * Each element of the array will look like (prefix + value + suffix).
   * 
   * Example:
   * $A($R(1,4)).prefix("id_") will result in ["id_1", "id_2", "id_3", "id_4"]
   * 
   * @param string prefix the string to be put in front of the value
   * @param string suffix the string to be put behind the value
   * @return the mapped Array  
   */
  wrap: function(prefix, suffix) {
    var p = prefix || '';
    var s = suffix || '';
    
    return this.map(function(v) { return p + v + s })
    
    // for (var i = 0; i < this.length; i++) {
    //   this[i] = p + this[i] + s;
    // }
    // 
    // return this;
  },
  
  /**
   * @see Array.wrap
   * @return this array with all items prefixed
   */
  prefix: function(str) {
    return this.wrap(str);
  },
  
  /**
   * @see Array.wrap
   * @return this array with all items suffixed
   */
  suffix: function(str) {
    return this.wrap('', str);
  },
  
  //
  // arithemetical functions for Arrays
  //
  
  /**
   * @return Array new array with all elements of this Array parsed to integers
   */
  intval: function() {
  	var re = [];
  	
  	for (var i = 0; i < this.length; i++) {
  		re.push(parseInt(Number(this[i])));
  	}
  	
  	return re;
  },
  
  /**
   * @return Array new array with all elements of this Array parsed to floats
   */
  floatval: function() {
  	var re = [];
  	
  	for (var i = 0; i < this.length; i++) {
  		re.push(Number(this[i]));
  	}
  	
  	return re;
  },
  
  /**
   * @return Number a sum of all elements in this array
   */
  sum: function() {
  	var re = 0;
  	
  	for (var i = 0; i < this.length; i++) {
    	re += this[i];
  	}
  	
  	return re;
  },
  
  /**
   * @return Number the product of all the values in this Array
   */
  multiply: function() {
  	if (this.length == 0) {
  		return 0;
  	}
  	
  	var re = this[0];
  	for (var i = 1; i < this.length; i++) {
  	  re *= v;
  	}
  	return re;
  },
  
  /**
   * @return Number the smallest value in this Array
   */
  getMinimum: function() {
  	if (this.length == 0) {
  		return null;
  	}
  	
  	var re = this[0]; 
  	for (var i = 1; i < this.length; i++) {
  	  re = re.min(this[i]);
  	}
  	
  	return re;
  },
  
  /**
   * @return the largest number in this Array
   */
  getMaximum: function() {
  	if (this.length == 0) {
  		return null;
  	}
  	
  	var re = this[0]; 
  	
  	for (var i = 1; i < this.length; i++) {
  	  re = re.max(this[i]);
  	}
  	
  	return re;
  },
  
  /**
   * @return Number the average of all numbers in this Array
   */
  getAverage: function() {
  	return this.sum() / this.length;
  },
  
  /**
   * @return Number the Median of all numbers in this Array
   */
  getMedian: function(sortFunction) {
  	if (this.length == 0) {
  		return null;
  	}
  	if (this.length == 1) {
  		return this[0];
  	}
  	
  	var sl;
  	if (!Object.isUndefined(sortFunction)) {
	  	sl = this.sort(sortFunction);
  	} else {
  		sl = this.sort();
  	}
  	
  	return sl[(sl.length / 2).floor()];
  },
  
  /**
   * @return Number the count of all values in this Array that are unique within this Array
   */
  getDifferentValues: function() {
  	var re = 0;
  	var last = null;
  	var sorted = this.sort();
  	
  	for (var i = 0; i < this.length; ++i) {
  		if (this[i] != last) {
  			last = this[i];
  			++re;
  		}
  	}
  	
  	return re;
  },
  
  /**
   * A convenience Function to return the 
   * minimum, maximum, average, median and number of different values in this array
   *
   * @return Object
   */
  getStatistics: function() {
  	if (this.length == 0) {
  		return null;
  	}
  	
  	return {
  		minimum: this.getMinimum(),
  		maximum: this.getMaximum(),
  		average: this.getAverage(),
  		median:  this.getMedian(),
  		values:  this.getDifferentValues()
  	}
  },

  /**
   * Checks whether all elements of this array are the same as a compare value.
   * If the compare value is a function the values of the array
   * will be passed as the first argument (like in Array.each()).
   * 
   * @param compare may be either a value to check agains or an unary boolean return function
   * @return boolean
   */
	isAll: function(compare, context) {
  	if (Object.isFunction(compare)) {
  		for (var i = 0; i < this.length; i++) {
	  		if (!compare.apply(context || this, [this[i]])) {
	  			return false;
	  		}
  		}
  		return true;
  	} else {
  		for (var i = 0; i < this.length; i++) {
	  		if (this[i] != compare) {
	  			return false;
	  		}
  		}
  		return true;
  	}
  },
  
  /**
   * Nearly the same as Array.isAll, but stops as soon as the first match is found.
   * 
   * @param compare may be either a value to check against or an unary boolean return function
   * @return boolean
   */
  hasAny: function(compare, context) {
  	if (Object.isFunction(compare)) {
  		for (var i = 0; i < this.length; i++) {
	  		if (compare.apply(context || this, [this[i]])) {
	  			return true;
	  		}
  		}
  		return false;
  	} else {
  		for (var i = 0; i < this.length; i++) {
	  		if (this[i] == compare) {
	  			return true;
	  		}
  		}
  		return false;
  	}
  },
  
  random: function() {
    if (this.length == 0) {
      return undefined;
    }
    return this[this.length.decrease().ran()];
  }
});

/**
 * Extension to the generic Function
 */
Object.extend(Function.prototype, {
  /**
   * Calls a method several times an stores each result an an array
   *
   * @param count Number
   * @return Array the array of call results
   */
	times: function() {
		var __method = this;
		var args = $A(arguments);
		var count = args.shift();
		
		var re = [];
		
		for (var i = 0; i < count; i++) {
			re.push(__method.apply(__method, args));
		}
		
		return re;
	},
	argsfunc: function() {
	  return $A(arguments);
	},
	
	/**
	 * Marks the __on attribute of the function
	 */
	on: function(n) {
	  if (n == 'all') n = true;
	  this.__on = n;
	  return this;
	},
	
	/**
	 * calls the given methods on arguments passed before executing the function
	 * 
	 * Example:
	 * 
	 * var f = Math.mul
	 * f(5, 5) => 25
	 * g = f.pre(Math.square)
	 * g(5, 5) => f(Math.square(5), 5) => f(25, 5) => 125
	 * h = f.pre(Math.sqrt.on(1))
	 * h(5, 25) => f(5, Math.sqrt(25)) => 25
	 * 
	 */
	pre: function() {
	  var __method = this;
	  var funcs = $A(arguments);
	  return function() {
	    var args = $A(arguments);
	    funcs.each(function(f,i) {
	      if (Object.isFunction(f)) {
  	      var on = Object.isUndefined(f.__on) ? i : f.__on;
  	      if (on === true) {
  	        // use on each argument
  	        args = args.map(f, __method);
  	      } else if (on < args.length) {
  	        // use on only one argument
  	        args[on] = f.apply(__method, [args[on]]);
  	      }
	      }
	    });
	    return __method.apply(__method, args);
	  }
	},
	
	/**
	 * Postprocesses the result from a function
	 *
	 * Example:
	 *
	 * a   = (1).to(5) => [1, 2, 3, 4, 5]
	 * s   = a.reduce(Math.sum) => 15
	 * // ((((1 + 2) + 3) + 4) + 5)
	 *
	 * inc = function(n) { return n + 0.5; }
	 * s2  = a.reduce(Math.sum.post(inc)) => 17
	 * // ((((1 + 2 + 0.5) + 3 + 0.5) + 4 + 0.5) + 5 + 0.5)
	 *
	 */
	post: function() {
	  var __method = this;
	  var funcs = $A(arguments);
	  return function() {
	    var args = $A(arguments);
	    var result = __method.apply(__method, args);
	    funcs.each(function(f) { result = f.apply(__method, [result]) });
	    return result;
	  };
	},
	
	/**
	 * Shortcut for function.post(Math.not)
	 */
	not: function() {
	  return this.post(Math.not);
	},
	
	/**
	 * Reversed bind, uses the first argument as context
	 * Used for Functions that are only available in prototypes,
	 * like native String or Array Function.
	 * Unlike one might imply, 
	 * this function takes further arguments that will be curried to this function
	 *
	 * Example:
	 *
	 * // unbound String.startsWith('M')
	 * f = String.prototype.startsWith.unbind('M')
	 *
	 * // some random names
	 * names = ['Peter', 'Paul', 'Mary']
	 *
	 * names.filter(f) => ['Mary']
	 */
	unbind: function() {
	  var __method = this;
	  var prep = $A(arguments);
	  return function() {
	    var args = $A(arguments);
	    var context = args.shift();
	    return __method.apply(context, prep.concat(arguments));
	  };
	}
});

/**
 * Simply another way of retrieving the current time.
 */
function currentTimeMillis() { return (new Date()).getTime(); };

/**
 * PHP time function copy
 * @return Number the number of seconds passed since 1970-01-01 00:00:00
 */
function time() { return Math.floor(currentTimeMillis() / 1000) };
Object.extend(Date.prototype, {
	sqlDateMatch: /(\d{2,4})-(\d{2})-(\d{2})(?: (\d{2})\:(\d{2})\:(\d{2}))?/,
  fromSQL: function(date) {
  	var m = this.sqlDateMatch.exec(date);
  	if (m == null) {
  		return this;
  	}
  	
    var year = m[1].intval();
    var month = m[2].intval();
    var day = m[3].intval();
    var hours = m[4] || 0;
    var minutes = m[5] || 0;
    var seconds = m[6] || 0;
    
    return new Date(year, month - 1, day, hours, minutes, seconds);
  },
  toSQL: function() {
    return this.toSQLDate() + ' ' + this.toSQLTime();
      
  },
  toSQLTime: function() {
    return this.getHours().toPaddedString(2) + ':' + 
      this.getMinutes().toPaddedString(2) + ':' +
      this.getSeconds().toPaddedString(2);
  },
  toSQLDate: function() {
    return this.getFullYear().toPaddedString(4) +
      '-' + (this.getMonth() + 1).toPaddedString(2) +
      '-' + this.getDate().toPaddedString(2);
  },
  moveByDays: function(days) {
  	this.setDate(this.getDate() + days);
  	return this;
  },
  moveByWeeks: function(weeks) {
  	this.setDate(this.getDate() + weeks * 7);
  	return this;
  },
  moveByMonths: function(months) {
  	this.setMonth(this.getMonth() + months);
  	return this;
  },
  getNextDay: function() {
  	return (new Date(this)).moveByDays(1);
  },
  getPreviousDay: function() {
    return (new Date(this)).moveByDays(-1);
  },
  getRelativeDate: function(months, weeks, days) {
  	var re = new Date(this);
  	re.moveByMonths(months || 0);
  	re.moveByWeeks(weeks || 0);
  	re.moveByDays(days || 0);
  	
  	return re;
  },
  /**
   * @deprecated use equalsDate instead
   */
  sameDay: function(date) {
  	return this.equalsDate(date);
  },
  equalsDate: function(date) {
    if (date instanceof Date) {
      return this.getFullYear() == date.getFullYear() 
        && this.getMonth() == date.getMonth()
        && this.getDate() == date.getDate();
    }
    return false;
  },
  /**
   * equalizes the dates of two 'Date' Objects, but keeps the time.
   */
  setSameDay: function(date) {
  	if (date instanceof Date) {
  		this.setFullYear(date.getFullYear());
  		this.setMonth(date.getMonth());
  		this.setDate(date.getDate());
  	}
  	
  	return this;
  },
  isMonday: function() {
  	return this.getDay() == 1;
  },
  isTuesday: function() {
  	return this.getDay() == 2;
  },
  isWednesday: function() {
  	return this.getDay() == 3;
  },
  isThursday: function() {
  	return this.getDay() == 4;
  },
  isFriday: function() {
  	return this.getDay() == 5;
  },
  isSaturday: function() {
    return this.getDay() == 6;
  },
  isSunday: function() {
  	return this.getDay() == 0;
  }
});
/**
 * Converts the parameter date to a Date.
 * If it is a Date already then exactly that Date will be returned. 
 */
function $DT(date) {
	if (Object.isUndefined(date)) {
		return new Date();
	} else if (date instanceof Date) {
		return date;
	} else if (Object.isString(date)) {
		return (new Date()).fromSQL(date);
	}
	return new Date(date);
}

/**
 * Numeric Interval
 */
Interval = Class.create();
Object.extend(Interval.prototype, {
	pattern: /(\[|\])?(\d+(?:\.\d+)?)(?:,|;|-)(\d+(?:\.\d+)?)(\[|\])?/,
	initialize: function(start, end) {
		if (Object.isArray(start) && start.length == 2) {
			end = start[1];
			start = start[0];
		} 
		
		if (Object.isString(start)) {
			this.unserialize(start);
		} else {
			if (Object.isUndefined(end)) {
				end = start;
				start = 0;
			}
			
			this.setStart(start);
			this.setEnd(end);
			this.includeStart = true;
			this.includeEnd = true;
		}
	},
	getStart: function() {
		return this.start;
	},
	setStart: function(start) {
		this.start = start;
	},
	getEnd: function() {
		return this.end;
	},
	setEnd: function(end) {
		this.end = end;
	},
	getLength: function() {
		return this.end - this.start;
	},
	setLength: function(length) {
	  this.end = this.start + length;
	  return this;
	},
	moveBy: function(deltaStart, deltaEnd) {
	  if (Object.isUndefined(deltaStart)) {
	    return this;
	  }
	  if (deltaStart instanceof Interval) {
	    this.start += deltaStart.start;
	    this.end += deltaStart.end;
	    return this;
	  }
	  if (Object.isUndefined(deltaEnd)) {
	    deltaEnd = deltaStart;
	  }
		this.start += deltaStart;
		this.end   += deltaEnd;
		return this;
	},
	multipy: function(m) {
		this.start *= m;
		this.end   *= m;
		return this;
	},
	contains: function(v) {
		var start = this.getStart();
		var end = this.getEnd();

		var testStart = true;
		var testEnd = true;

		var sv = v;
		var ev = v;
		
		if (v instanceof Interval) {
			sv = v.getStart();
			if (sv == start && v.includeStart == this.includeStart) {
				testStart = false;
			}

			ev = v.getEnd();
			if (ev == end && v.includeEnd == this.includeEnd) {
				testEnd = false;
			}
		}
		
		if (testStart && ((this.includeStart && start > sv) || (!this.includeStart && start >= sv))) {
			return false;
		}
		if (testEnd && ((this.includeEnd && end < ev) || (!this.includeEnd && end <= ev))) {
			return false;
		}
		
		return true;
	},
	combine: function(min, max) {
		var interval = $I(min, max);
		return new Interval(this.getStart().min(interval.getStart()), this.getEnd().max(interval.getEnd()));
	},
	intersect: function(min, max) {
		var interval = $I(min, max);
		var re = new Interval(this.getStart().max(interval.getStart()), this.getEnd().min(interval.getEnd()));
		if (re.getLength() < 0) {
		  return null;
		}
		return re;
	},
	intersects: function(min, max) {
	  return this.intersect(min, max) != null;
	},
	serialize: function() {
		var re =  
			(this.includeStart ? '[' : ']') +
			this.getStart() + 
			',' +
			this.getEnd() +
			(this.includeEnd ? ']' : '[')
		;
		
		return re;
	},
	random: function() {
		return Math.random() * (this.getEnd() - this.getStart()) + this.getStart();
	},
	ran: function() {
		return this.random().round();
	},
	snap: function(n) {
		return n.max(this.getStart()).min(this.getEnd());
	},
	unserialize: function(interval) {
		var m = this.pattern.exec(interval);
		if (m == null) {
			return false;
		}
		
		this.start = parseFloat(m[2]);
		this.end = parseFloat(m[3]);
		
		this.includeStart = m[1] != ']';
		this.includeEnd = m[4] != '[';
	},
	toArray: function() {
	  var re = [];
	  for (var i = this.getStart(); i <= this.getEnd(); i++) {
	    re.push(i);
	  }
	  return re;
	},
	toString: function() {
		return "Interval(" + this.serialize() + ")";
	}
});

function $I(start, end) {
	if (Object.isUndefined(start) || start == null) {
		return null;
	} else if (start instanceof Interval) {
		return start;
	} else {
		return new Interval(start, end);
	}
}

/**
 * Stores a Time-Interval in Hours
 * 
 * this.start and this.duration contain hour values
 */
TimeInterval = Class.create();
Object.extend(TimeInterval.prototype, {
	initialize: function(start, duration) {
		if (Object.isString(start)) {
			this.unserialize(start);
		} else {
			this.setStartTime(start);
			this.setDuration(duration);
		}
	},
	
	setStartTime: function(start) {
		if (start instanceof Date) {
			this.start = start.getHours() 
				+ start.getMinutes() / 60 
				+ start.getSeconds() / 3600
		} else if (Object.isString(start)) {
			this.start = start.floatime();
		} else {
			this.start = start;
		}
	},
	
	getStartTime: function() {
		return this.start;
	},
	
	getEndTime: function() {
		return this.start + this.duration;
	},

	getDuration: function() {
		return this.duration;
	},
	
	setDuration: function(duration) {
		this.duration = duration;
	},
	
	getDurationMinutes: function() {
		return this.duration * 60;
	},
	
	setDurationMinutes: function(minutes) {
		this.duration = minutes / 60;
	},
	
	toTime: function(glue) {
		if (this.duration == 0) {
			return '';
		}
		
		var re = [this.getStartTime().toTime(null, null, 2)];
		if (this.duration > 0) {
			re.push(this.getEndTime().toTime(null, null, 2));
		}
		return re.join(Object.isUndefined(glue) ? ' - ' : glue);
	},
	
	serialize: function() {
		return this.getStartTime().toShortTime() + '-' + this.getEndTime().toShortTime();
	},
	
	unserialize: function(description) {
		if (Object.isUndefined(description) || description == null || description.strip().length == 0) {
			this.start = 0;
			this.duration = 0;
			return;
		}
		var split = description.split('-');
    this.start = split[0].floatime();
    var to = split[1].floatime();
    this.duration = to - this.start;
	},
	
	equals: function(otherInterval) {
		if (!(otherInterval instanceof TimeInterval)) {
			return false;
		}
		
		return this.start == otherInterval.start 
			&& this.duration == otherInterval.duration;
	},
	
	toInterval: function() {
		return new Interval(this.start, this.start + this.duration);
	},
	
	toString: function() {
		return 'TimeInterval(' + this.serialize() + ')';
	}
});

/**
 * What is the Matrix?
 * 
 * a default two dimension table
 */
var Matrix = Class.create();
Object.extend(Matrix.prototype, {
	OPTION_NO_FILL: 0x10,
	
	//
	// init
	//
	initialize: function(width, height, value, options) {
		if (width instanceof Matrix) {
			this.width = width.width;
			this.height = width.height;
			this.data = [];
			for (var i = 0; i < width.data.length; i++) {
				this.data.push(width.data[i]);
			}
			return this;
		}
		
		// just expect width and height to be int values for now
		this.width = width;
		this.height = height;
		
		// initialize the data array (one dimension long array)
		this.data = [];
		
		if (Object.isUndefined(options)) {
			options = 0;
		}
		if (!(options & this.OPTION_NO_FILL)) {
			if (Object.isFunction(value)) {
				this.fill(null);
				this.map(value, true);
			} else {
				this.fill(value);
			}
		}
	},
	
	clone: function() {
		return new Matrix(this);
	},
	
	toArray: function() {
		var re = [];
		var n = 0;
		for (var j = 0; j < this.height; j++) {
			var row = [];
  		for (var i = 0; i < this.width; i++, n++) {
				row.push(this.data[n]);
			}
			re.push(row);
		}
		
		return re;
	},
	
	getWidth: function() {
		return this.width;
	},
	
	getHeight: function() {
		return this.height;
	},
	
	getSize: function() {
		return this.width * this.height;
	},
	
	set: function(x, y, v) {
		if (x > this.widht || y > this.height) {
			throw new Error(
			  'MatrixIndexOutOfBounds', 
			  'Matrix.set(' + x + ', ' + y + ') is not in (' + this.width + ', ' + this.height + ')'
			);
		}
		var old = this._get(x, y);
		this._set(x, y, v);
		return old;
	},
	
	// no-check internal set (should be faster)
	_set: function(x, y, v) {
		this.data[this.width * y + x] = v;
	},
	
	get: function(x, y) {
		var pos = this.width * y + x;
		if (pos < 0 || pos > this.data.length) {
			throw new Error(
			  'MatrixIndexOutOfBounds', 
			  'Matrix.get(' + x + ', ' + y + ') is not in (' + this.width + ', ' + this.height + ')'
			);
		}
		return this.data[pos];
	},

	// no-check internal get (should be faster)
	_get: function(x, y) {
		return this.data[this.width * y + x];
	},
	
	fill: function(value) {
    if (Object.isUndefined(value)) {
      value = null;
    }
    var size = this.getSize();
    // initialize the maxrix
    for (var i = 0; i < size; i++) {
      this.data[i] = value;
    }
  },
  
	getColumn: function(column) {
		var re = [];
		for (var i = 0; i < this.height; i++) {
			re.push(this._get(column, i));
		}
		
		return re;
	},
	
	getRow: function(row) {
		var re = [];
		for (var i = 0; i < this.width; i++) {
			re.push(this._get(i, row));
		}
		
		return re;
	},
	
  setBlock: function(x, y, width, height, value) {
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        this._set(x + i, y + j, value);
      }
    }
  },
  
  getBlock: function(x, y, width, height) {
    var m = new Matrix(width, height);
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        m._set(i, j, this.get(i + x, j + y));
      }
    }
    
    return m;
  },
  
  getAllObjects: function(type) {
  	if (Object.isUndefined(type)) {
  		typeFunction = function(o) { return typeof(o) == 'object'; };
  	} else if (Object.isFunction(type)) {
			typeFunction = type;
  	} else if (Object.isString(type)) {
  		typeFunction = function(o) { return o instanceof eval(type); };
  	} else {
  		typeFunction = function(o) { return o instanceof type; };
  	}

  	var re = [];
		for (var i = 0; i < this.data.length; i++) {
			if (typeFunction(this.data[i])) {
				re.push(this.data[i]);
			}
		}
		
		return re;
  },
  
  indexOf: function(value, x, y) {
  	var start = 0;
  	if (!Object.isUndefined(x)) {
  		var pt = $P(x, y);
  		start = start.max(pt.y * this.width + pt.x);
  	}
  	for (var i = start; i < this.data.length; i++) {
  		if (this.data[i] == value) {
  			return [i % this.width, (i / this.width).floor()];
  		}
  	}
  	return -1;
  },
  
  lastIndexOf: function(value, x, y) {
  	var start = this.data.length - 1;
  	if (!Object.isUndefined(x)) {
  		var pt = $P(x, y);
  		start = start.min(pt.y * this.width + pt.x);
  	}
  	for (var i = start; i >= 0; i--) {
  		if (this.data[i] == value) {
  			return [i % this.width, (i / this.width).floor()];
  		}
  	}
  	return -1;
  },
  
  /**
   * overrides a subset of this matrix with another (matrix overlay)
   */
  insert: function(x, y, matrix) {
    // expect the matrix to fit this matrix
    var mw = matrix.getWidth();
    var mh = matrix.getHeight();
    
    for (var j = 0; j < hm; j++) {
      for (var i = 0; i < mw; i++) {
        // slow but simple deep copy
        // could be made faster betimes
        this._set(x + i, y + j, matrix._get(i, j));
      }
    }
    
    return this;
  },
  
  /**
   * a subset matrix merge, non-destructive by default
   */
  merge: function(x, y, matrix, method, destructive) {
  	if (Object.isUndefined(matrix) || matrix == null) {
  		matrix = this.clone();
  	}
  	
  	if (Object.isUndefined(destructive)) {
  		destructive = false;
  	}
  	
  	var m;
  	if (destructive) {
  		m = this;
  	} else {
	  	m = new Matrix(this.width, this.height, null, this.OPTIONS_NO_FILL);
  	}
  	
  	// do the dimensions match?
  	if (this.equalDimensions(matrix)) {
  		// faster direct iteration for equal matrices
  		for (var i = 0; i < this.data.length; i++) {
  			m.data[i] = method(this.data[i], matrix.data[i]);
  		}
  	} else {
	  	// expect the matrix to fit this matrix
			for (var j = 0; j < this.height; j++) {
		  	for (var i = 0; i < this.width; i++) {
		  		// slow but simple deep copy
		  		// could be made faster betimes
		  		var one = this._get(x + i, y + j);
		  		var two = matrix._get(i, j);
		  	  m._set(x + i, y + j, method(one, two));
		  	}
			}
  	}
		
		return m;
  },
  
  /**
   * a functional mapping for all values in this matrix,
   * the arguments passed to the method are (sourceValue, x, y)
   */
  map: function(method, destructive) {
  	if (Object.isUndefined(destructive)) {
  		destructive = false;
  	}
  	
  	var m;
  	if (destructive) {
  		m = this;
  	} else {
	  	m = new Matrix(this.width, this.height, null, this.OPTIONS_NO_FILL);
  	}
  	
  	var size = this.getSize();
  	var x = -1; 
  	var y = -1;
  	for (var i = 0; i < size; i++) {
  		if (i % this.width == 0) {
  			x = 0;
  			y++;
  		} else {
  			x++;
  		}
  		m.data[i] = method(this.data[i], x, y); 
  	}
  	
  	return m;
  },
  
  //
  // convenience merge methods
  //
  
  getAndMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.and, destructive);
  },
  
  getOrMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.or, destructive);
  },
  
  getXorMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.xor, destructive);
  },
  
  getNorMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.nor, destructive);
  },

  getNandMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.nand, destructive);
  },
  
  getNotMatrix: function(destructive) {
  	return this.map(Math.not, destructive);
  },
  
  //
  // data status methods
  //
  isEmpty: function(emptyCompareFunction) {
  	if (Object.isUndefined(emptyCompareFunction)) {
  		emptyCompareFunction = Math.empty;
  	}
  	return this.isAll(emptyCompareFunction);
  },
  
  isAll: function(compare) {
  	return this.data.isAll(compare);
  },
  
  equalDimensions: function(m) {
  	var matrix = $M(m);
  	return matrix.width == this.width && matrix.height == this.height;
  },
  
	/**
	 * Checks whether there is any data within a defined block
	 * 
	 * @return boolean
	 */
	hasDataAt: function(x, y, width, height, compareFunction) {
		if (Object.isUndefined(compareFunction)) {
			compareFunction = Math.notEmpty;
		}
		var args = $A(arguments);
		x = x || 0;
		y = y || 0;
		
		if (x + width > this.width || y + height > this.height) {
      throw new Error(
        'MatrixIndexOutOfBounds', 
        'Matrix.hasDataAt(' + args.join(', ') + ') is not in (' + this.width + ', ' + this.height + ')'
      );
    }
		 
		if (!Object.isNumber(x) || !Object.isNumber(y)) {
			return false;
		}
		
		for (var i = 0; i < width; i++) {
			for (var j = 0; j < height; j++) {
				if (compareFunction(this._get(x + i, y + j))) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	countValuesInRow: function(row, compareFunction) {
		if (Object.isUndefined(compareFunction)) {
			compareFunction = Math.notEmpty;
		}
		var re = 0;
		for (var i = 0; i < this.width; i++) {
			if (compareFunction(this._get(i, row))) {
				re++;
			}
		}
		
		return re;
	},
	
	countValuesInColumn: function(column, compareFunction) {
		if (Object.isUndefined(compareFunction)) {
			compareFunction = Math.notEmpty;
		}
    var re = 0;
    for (var i = 0; i < this.height; i++) {
      if (compareFunction(this._get(column, i))) {
        re++;
      }
    }
    
    return re;
	},
	
	countMaxValuesInRows: function(startRow, rows) {
		var maxVal = 0;
		for (var i = startRow; i < startRow + rows; i++) {
			maxVal = maxVal.max(this.countValuesInRow(i));
		}
		return maxVal;
	},
	
	toBinaryOut: function() {
		return this.map(function(v) { return v ? '+' : '-' }).toArray().glue();
	},
	
	toString: function() {
		return 'Matrix(' + this.width + ' x ' + this.height + ')';
	}
});

$M = function() {
	var args = $(arguments);
  if (args[0] instanceof Matrix) {
  	return args[0];
  } else {
  	return new Matrix.apply(this, args);
  }
}

$if = function() { 
  var args = $A(arguments)
  var condition = args.shift()
  var fn = args.shift() || Prototype.K
  if (condition) return fn.apply(condition, args) 
}

//
// load additional script resources
Native.load();
//
//
