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
  
  fill: function(args) {
    if (!Object.isArray(args)) {
      return this.fill($A(arguments))
    }
    var re  = this.clone(),
        max = this.length.max(args.length)
    
    for (var i = 0; i < max; i++) {
      if (this[i] === undefined) {
        re[i] = args.shift()
      }
    }
    return re.concat(args)
  },
  
  /**
   * Applies this array on a given function,
   * a context may be passed
   */
  on: function(fn, ctx) {
    return fn.apply(ctx, this);
  },
  
  /**
   * Simple shortcut for slice(0) on this array
   */
  copy: function() {
    return this.slice(0);
  },
  
  shifted: function(n) {
    var a = this.copy(); 
    for (var i = (n || 1).max(1); i > 0; i--) a.shift(); 
    return a;
  },
  
  popped: function(n) {
    var a = this.copy();
    for (var i = (n || 1).max(1); i > 0; i--) a.pop();
    return a;
  },
  
  /**
   * Will return an object with key value pairs containing arrays of objects where the key
   * is the outcome of calling the iterator function
   *
   * ['Peter', 'Paul', 'Mary'].groupBy('length') 
   * => { '5': ['Peter'], '4' => ['Paul', 'Mary'] }
   */
  groupBy: function(iterator, context) {
    var re = {}
    this.each(function(o, n) {
      // ensure the result to be a string for processing
      var key = iterator.apply(context || this, [o, n]) + '';
      var arr = re[key] || [];
      arr.push(o);
      re[key] = arr;
    })
    return re;
  },
  
  /**
   * Will return only an array (instead of an object) grouped by the result of the iterator
   * 
   * ['Peter', 'Paul', 'Mary'].by('length') => [['Peter'], ['Paul', 'Mary']]
   */
  by: function(iterator, context) { return $H(this.groupBy(iterator, context)).values() },
  
  /**
   * Similar to each but executes each step with a delay
   * For visual FX this gives a cascading effect
   */
  eachAfter: function(delay, iterator, context) {
    var index = 0
    this._each(function(value) {
      var i = index;
      (function() { iterator.call(context, value, i) }).delay(index * delay)
      index++;
    })
    return this;
  },

  /**
   * Similar to each, but executes each step with a delay
   * The whole execution will be started equally distributed over the given duration
   */
  eachOver: function(duration, iterator, context) {
    if (this.length == 0) return this;
    if (duration < 25) duration *= 1000
    return this.eachAfter(duration / this.length / 1000, iterator, context)
  },

  /**
   *
   */
  invokeAfter: function() {
    var args = $A(arguments)
    var delay = args.shift()
    var methodName = args.shift()
    var index = 0
    return this.map(function(value) {
      return (function() { 
        return value[methodName].apply(value, args) 
      }).delay(delay * index++)
    })
  },
  
  /**
   *
   */
  invokeOver: function() {
    var args = $A(arguments)
    var duration = args.shift()
    if (this.length == 0) return this;
    if (duration < 25) duration *= 1000
    var delay = duration / this.length / 1000
    return this.invokeAfter.apply(this, [delay].concat(args))
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
   * simple reduce left method
   * calls the passed function on the first two elements of this array
   * the result temporarily replaces those two
   * in case there is only one value left it will be returned
   *
   * empty arrays will return undefined, be aware of that
   */
  reduceLeft: function(fn, context) {
    // non recursive implementation
    if (!this.length) {
      return undefined;
    }
    fn = fn || Prototype.K;
    var re = this[0];
    if (Object.isArray(fn)) {
      for (var i = 1; i < this.length; i++) {
        var v = this[i];
        re = fn[i % fn.length].apply(context, [re, v]);
      }
    } else {
      for (var i = 1; i < this.length; i++) {
        var v = this[i];
        re = fn.apply(context, [re, v]);
      }
    }
    return re;
  },

  /**
   * forwards to reduceLeft
   */
  reduce: function(fn, context) {
    return this.reduceLeft(fn, context);
  },
  
  /**
   * reduce right
   */
  reduceRight: function(fn, context) {
    return this.copy().reverse().reduce(fn, context);
  },
  
  /**
   * Basically a reduceLeft with a given start
   */
  foldLeft: function(start, fn, context) {
    return [start].concat(this).reduceLeft(fn, context);
  },
  
  /**
   * Basically a reduceRight with a given start (on the right edge)
   */
  foldRight: function(start, fn, context) {
    return [].concat(this).concat(start).reduceRight(fn, context);
  },
  
  /**
   * FoldLefts a list of objects into one object
   */
  merge: function(into) {
    return this.foldLeft(into || {}, Object.extend)
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
    
  //
  // Apparently indexOf has already been defined,
  // maybe rename & reuse this one
  //
  
  // indexOf: function(compare, start) {
  //   if (Object.isUndefined(start)) {
  //     start = -1;
  //   }
  //   var idx = -1;
  //   this.each(function(v, i) {
  //     if (i > start && Object.isFunction(compare) ? compare(v, i) : compare == v) {
  //       idx = i;
  //       throw $break;
  //     }
  //   });
  // 
  //   return idx;
  // },
  
  get: function(index, defaultValue) {
    if (index < 0 || index >= this.length) {
      return defaultValue;
    }
    return this[index];
  },
  
  after: function(compare, defaultValue) {
    return this.get(this.indexOf(compare) + 1, defaultValue);
  },
  
  before: function(compare, defaultValue) {
    return this.get(this.indexOf(compare) - 1, defaultValue);
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
  
  first: function(defaultValue) {
    return this.get(0, defaultValue);
  },
  
  second: function(defaultValue) {
    return this.get(1, defaultValue);
  },
  
  last: function(defaultValue) {
    return this.get(this.length - 1, defaultValue);
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
