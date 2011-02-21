/**
 * Extension to the generic String Object.
 */
 
;(function() {
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
    },
    fn: function() {
      var args = $A(arguments);
      var def  = args.shift();
      var fn = Math.ident;

      // depending on the def ... create a function

      return args.length ? fn.apply(window, args) : fn; 
    },
    asKey: function(string, value) {
      var re = {};
      re[string + ''] = value;
      return re;
    },
    asValue: function(string, key) {
      return String.asKey(key, string);
    }
  });
  
  var substr    = String.prototype.substr;
  var substring = String.prototype.substring;
  var indexOf   = String.prototype.indexOf;

  Object.overwrite(String, {
    fn: String.fn.methodize(),
    
    apply: function(context, args) { 
      var fn = context[this + ''] || this.fn();
      return fn.apply(context, args);
    },
    
    /**
     * Used for callbacks (each, map)
     *
     * Passing a string to map will pluck it
     * I'm aware that there is Enumerable.pluck, 
     * but I kinda like this one :D
     */
    call: function(context, value, index) {
      try { return value[this + '']; } catch (ex) { }
    },
    
    /**
     * 
     */
    each: function(f, context) {
      f = f || Math.ident;
      this.split(this.contains(',') ? /\s*,\s*/ : /\s+/).each(f, context);
    },
    
    /**
     * Splits this array by , trimming all sub elements
     * if there is not , within the string, splits by whitespace
     * Uses the given method on each string (Identity by default)
     * 
     * Example:
     *   'Hewy, Dewy, Lewy'.map() => ['Hewy', 'Dewy', 'Lewy']
     *   'Peter Paul, Mary'.map() => ['Peter Paul', 'Mary']
     *
     * @param Function f the method that will be used on each entry
     * @param any context
     * @return Array the mapped Strings
     */
    map: function(f, context) {
      f = f || Math.ident;
      return this.split(this.contains(',') ? /\s*,\s*/ : /\s+/).map(f, context);
    },
    
    /**
     * @return Array an array containing each char in this string
     */
    toArray: function() {
      var a = [];
      for (var i = 0;  i < this.length; i++) a.push(this[i]);
      return a;
    },
    
    /**
     * @return String this string backwards
     */
    reverse: function() {
      return this.toArray().reverse().glue();
    },
    
    /**
     * @return String the rot13 version of this string
     */
    rot13: function() {
      return this.toArray().map(String.rot13c).glue();
    },
    
    /**
     * Returns a new Object containing one element
     * this string is the key and the argument is the value
     *
     * @param any v the value
     * @return Object a new Object
     */
    asKey: function(v) {
      var re = {}
      re[this] = v
      return re
    },
    
    /**
     * grabs the n-th match
     */
    fetch: function(r, n) {
      return $a(this.match(r)).maybe(n || 0)[0] || ''
    },
    
    /**
     * 
     */
    contains: function(needle) {
      // ... the eternal void is part of everything ...
      if (!needle) { return true }
      return this.indexOf(needle) != -1;
    },
    
    /**
     *
     */
    containsIgnoringCase: function(needle) {
      // ... the eternal void is part of everything ...
      if (!needle) { return true }
      return this.toLowerCase().indexOf(needle.toLowerCase()) != -1;
    },
    
    /**
     * @return int occurrences of needle within this String
     */
    count: function(needle) {
      var n = 0, pos = -1;
      while ((pos = this.indexOf(needle, pos + 1)) != -1) { n++ } 
      return n;
    },
    
    /**
     * Enhanced the indexOf function to understand RegExp for matching
     *
     * @param String|RegExp needle the expression that should be matched
     * @param int startIndex the first index after that the lookup should begin
     * @return int index of the found needle, -1 if nothing has been found
     *
     * NOTE: I'm aware the RegExp and startIndex can break the purpose,
     *       as an expression /^a|b|c/ will be found in "Hanabi" if the afterIndex
     */
    indexOf: function(needle, startIndex) {
      var args = $A(arguments)
      if (needle instanceof RegExp) {
        return needle.exec(this.substring(startIndex || 0))
      }
      return indexOf.apply(this, args)
    },

    /**
     * This is an Objective-C like range search
     * The Prototype ObjectRange will be returned, or null on failure
     *
     * @param  String|RegExp|Array needle
     * @param  int startIndex the start index
     * @return ObjectRange
     */
    rangeOf: function(needle, startIndex) {
      if (!Object.isArray(needle)) {
        needle = [needle]
      }
      var re = null
      // to avoid the unneccessary throw $break
      for (var i = 0; i < needle.length; i++) {
        var n = needle[i]
        if (n instanceof RegExp) {
          n = n.exec(this.substring(startIndex || 0))
        }
        var start = this.indexOf(n, startIndex || 0)
        if (start > -1) {
          return $R(start, start + n.length)
        }
      }
      return re;
    },

    /**
     * Just like String.rangeOf this will return positions for all matched needles in an array
     *
     * @param String|RegExp|Array needle
     * @returns Array[ObjectRange] a list of ObjectRanges
     *
     * @see String.rangeOf
     */
    rangesOf: function(needle) {
      var re    = [], 
          index = -1, 
          tmp   = null;
      while ((tmp = this.rangeOf(needle, index + 1))) {
        re.push(tmp)
        index = tmp.end
      }
      return re;
    },
    
    /**
     * Pimped substring to understand ObjectRange objects
     */
    substr: function() {
      var r, args = $A(arguments)
      if ((r = args[0]) instanceof ObjectRange) {
        return substring.apply(this, [r.start, r.size])
      }
      return substr.apply(this, args)
    },
    
    /**
     * Pimped substring to understand ObjectRange objects
     */
    substring: function() {
      var r, args = $A(arguments)
      if ((r = args[0]) instanceof ObjectRange) {
        return substring.apply(this, [r.start, r.end])
      }
      return substring.apply(this, args)
    },
    
    /**
     * Returns a list of Substrings for all given Object ranges
     */
    substrings: function(ranges) {
      return ranges.map(this.substring.bind(this))
    },
    
    /**
     * Splits a string in three parts with a given range
     */
    trisect: function(range) {
      return [this.substring(0, range.start - 1), this.substring(range), this.substring(range.end + 1)]
    },

    /**
     * Cuts off n characters from the end of the String
     */
    cutoff: function(length) {
    	return this.substring(0, this.length - length);
    },

    /**
     * Shrinks a String on both sides
     */
    shrink: function(length) {
      return this.substring(length || 1, this.length - (length || 1));
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
    intval: function(base) {
      var s = 0; 
      while (this.charAt(s) == '0' && s < this.length - 1) {
        s++;
      };
      return parseInt(this.substring(s), base);
    },
    
    floatval: function(base) {
      return parseFloat(this, base)
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
     * Creates a DOM Node (Element or TextNode) of this string
     *
     * @param Object attributes, optional, a set of key+value pairs
     *               if omitted a TextNode will be created
     * @return HTMLElement
     */
    node: function(attributes) {
      if ($void(attributes)) {
        return document.createTextNode(this + '')
      }
      var re = document.createElement(this + '')
      Object.keys(attributes || {}).each(function(key) {
        re.setAttribute(key, attributes[key])
      })
      return re
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
})();
