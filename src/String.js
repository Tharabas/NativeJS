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