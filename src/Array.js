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
   * Shortcut for map+compact
   */
  cmap: function(fn, ctx) {
    return this.map(fn, ctx).compact()
  },
  
  /**
   * Applies this array on a given function,
   * a context may be passed
   */
  on: function(fn, ctx) {
    return fn.apply(ctx, this);
  },
  
  eachOn: function(fn, ctx) {
    return this.each(function(v) { return v.on(fn, ctx) })
  },
  
  mapOn: function(fn, ctx) {
    return this.map(function(v) { return v.on(fn, ctx) })
  },
  
  /**
   * Simple shortcut for slice(0) on this array
   *
   * ... called clone in prototype ... good to know now ;)
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
    if (duration < 5) duration *= 1000
    return this.eachAfter(duration / this.length / 1000, iterator, context)
  },

  /**
   * Invokes a given Method (second argument) on each element of this array
   * each with an additional delay (first argument)
   *
   * @param float  delay      the delay for each consecutive call
   * @param string methodName the name of a method to be called
   * @param any...            additional arguments for the call
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
   * Similar to invokeAfter, just this time the full duration is given instead of a delay
   * 
   * @param float  duration   the time from calling the first to calling the last method
   * @param string methodName the name of a method to be called
   * @param any...            additional arguments for the call
   */
  invokeOver: function() {
    var args = $A(arguments)
    var duration = args.shift()
    if (this.length == 0) return this;
    if (duration < 5) duration *= 1000
    var delay = duration / this.length / 1000
    return this.invokeAfter.apply(this, [delay].concat(args))
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
   * Shuffles this array and returns it afterwards
   * (destructive operation)
   */
  shuffle: function() {
    var i, v, n
    for (i = this.length - 1; i > 1; i--) {
      // inlined swap with tmp
      n = i.ran()
      v = this[n]
      this[n] = this[i]
      this[i] = v
    }
    return this
  },
  
  /**
   * Returns a shuffeled copy of this array
   */
  shuffled: function() {
    return this.copy().shuffle()
  },
  
  /**
   * Returns a random element from this array
   */
  random: function() {
    if (this.length == 0) {
      return undefined;
    }
    return this[this.length.decrease().ran()];
  },
  
  /**
   * Returns a random subset of this array
   * 
   * @param int length  the 
   */
  randomSubset: function(length, minimum) {
    return this.shuffled().slice(0, length || this.length.ran().max(1))
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
   * exchanges two elements of this array by their indices
   */
  swap: function(one, another) {
    var t = this[another];
    this[another] = this[one];
    this[one] = t;
    return this;
  },
  
  /**
   * Rotates the array (destructive)
   * (cuts of n elements from the head and appends them at the end, keeping the order)
   *
   * Example:
   *   var a = [1,2,3,4,5]
   *   a.rotate() 
   *   => [2,3,4,5,1]
   *   
   *   var b = 'all your base are belong to us'.split(' ')
   *   b.rotate(-3).join(' ')
   *   => 'belong to us all your base are' // yoda style it is!
   *
   * @param  int   the number of indices to rotate, defaults to 1
   * @return Array the rotated array
   */
  rotate: function(n) {
    if (this.length == 0) {
      return this
    }
    n = (n || 1).amod(this.length)
    if (n > 0) {
      var head = this.splice(0, n)
      this.push.apply(this, head)
    }
    return this
  },
  
  /**
   * A non destructive rotate
   */
  rotated: function(n) {
    return this.copy().rotate(n)
  },
  
  /**
   * returns the n-th element of this array
   * allows a default value to be returned in case the item does not exist
   * also allows negative values, that will be used fron the end of the array
   * -1 specifies the last element
   */
  item: function(n, defaultValue) {
    if (this.length == 0) {
      if (!Object.isUndefined(defaultValue)) {
        return defaultValue;
      }
      throw "This array is empty, can not return any item";
    }
    if (n < 0) {
      n = this.length + n;
    }
    if (n < 0 || n >= this.length) {
      if (!Object.isUndefined(defaultValue)) {
        return defaultValue;
      }
      throw "Index out of Bounds: " + n + " is not within [0;" + (this.length - 1) + "]";
    }
    return this[n];
  },
  
  /**
   * Returns the element at a given index
   * In case the index is out of bounds a defaultValue may be returned
   *
   * This is the failsave brother method of item
   *
   * @param int index the index of the element
   * @param any defaultValue (optional)
   */
  get: function(index, defaultValue) {
    if (Object.isNumber(index)) {
      if (index < 0 || index >= this.length) {
        return defaultValue;
      }
      return this[index];
    }
    if (Object.isArray(index)) {
      return index.map(function(n) { return this[n] }, this)
    }
    
    if (Object.isString(index)) {
      // split the string, first by comma (,) and then the results each by a hyphon (-)
      // pull out numbers by invoking intval on them
      var re = index.split(',').invoke('split', '-').invoke('invoke', 'intval').mapOn(function(from, to) {
        if (Object.isUndefined(to)) {
          // return as array, as we reduce afterwards
          return [this.get(from)]
        }
        return from < to 
          ? this.slice(from, to + 1) 
          : this.slice(to, from + 1).reverse()
      }, this).reduce(function(a,b) {
        return a.concat(b)
      })
      return re.length > 1 ? re : re[0] || defaultValue
    } else if (index instanceof ObjectRange) {
      return index.start > index.end 
        ? this.slice(index.start, index.end + 1)
        : this.slice(index.end, index.start + 1).reverse()
    }
    
    throw new Error('Unknown type ' + typeof(index) + ' index for Array.get')
  },
  
  /**
   * 
   */
  after: function(compare, defaultValue) {
    return this.get(this.indexOf(compare) + 1, defaultValue);
  },
  
  /**
   *
   */
  before: function(compare, defaultValue) {
    return this.get(this.indexOf(compare) - 1, defaultValue);
  },
  
  /**
   *
   */
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
   * Returns the first element of this Array or a given defaultValue
   */
  first: function(defaultValue) {
    return this.get(0, defaultValue);
  },
  
  /**
   * Returns the second element of this Array or a given defaultValue
   */
  second: function(defaultValue) {
    return this.get(1, defaultValue);
  },
  
  /**
   * Returns the last element of this Array or a given defaultValue
   */
  last: function(defaultValue) {
    return this.get(this.length - 1, defaultValue);
  },
  
  /**
   * Inspired by the MooTools pick method
   */
  pick: function(defaultValue) {
    return this.compact().first(defaultValue)
  },
  
  /**
   * Will return an array containing the value at a given index (0 by default) 
   * or no value at all (empty array)
   *
   * For use as a maybe Monad
   */
  maybe: function(index) {
    return this.length > (index || 0) ? [this[index || 0]] : []
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
   * (1).to(4).prefix("id_") will result in ["id_1", "id_2", "id_3", "id_4"]
   * 
   * @param string prefix the string to be put in front of the value
   * @param string suffix the string to be put behind the value
   * @return the mapped Array  
   */
  wrap: function(prefix, suffix) {
    var p = prefix || '';
    var s = suffix || '';
    
    return this.map(function(v) { return p + v + s })
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
  
  /**
   *
   */
  toObject: function(names, naming) {
    names  = (names || []).map()
    naming = naming || function(i) { return 'item_' + i }
    return this.alternate(names.map().concat($R(names.length, this.length - 1).map(naming)))
      .inGroupsOf(2)
      .map(function(v) { return v[1].asKey(v[0]) })
      .foldLeft({}, Object.extend)
  },
  
  /**
   *
   */
  alternate: function() {
    return Array.alternate.apply(null, [this].concat($A(arguments)))
  },
  
  /**
   * This is similar to 'inGroupsOf' but separates the array somehow
   *
   * Example:
   *    [1,2,3,4,5,6,7,8,9].inColumns(3)
   * => [ [1,4,7], [2,5,8], [3,6,9] ]
   *
   * All columns will have equal length, empty fields will be filled
   *    [1,2,3,4,5,6,7,8,9].inColumns(4, 'X')
   * => [ [1,5,9], [2,6,'X'], [3,7,'X'], [4,8,'X'] ]
   */
  inColumns: function(cols, fillWith) {
    // ensure to grab at least 1 column
    cols = parseInt(cols || 1).max(1)
    if (cols == 1) return [this];
    
    // max is usually greater than the length
    var max = this.length.snap(cols, Math.ceil)
    // create 'cols' return arrays
    var re = $R(1, cols).map(Array.create)
    
    for (var i = 0; i < max ;) {
      for (var col = 0; col < cols; col++, i++) {
        // second for is faster than i % cols every time
        re[col].push(this[i] || fillWith)
      }
    }
    
    return re
  },
  
  // logging ... maybe externalize this
  log: function() {
    console.log.apply(console, this)
    return this
  },
  warn: function() {
    console.warn.apply(console, this)
    return this
  },
  error: function() {
    console.error.apply(console, this)
    return this
  }
});

Object.extend(Array, {
  /**
   * @return Array a new Array
   */ 
  create: function() {
    return new Array()
  },
  /**
   * Like shuffling cards this will pick
   */
  alternate: function() {
    var arrs = $A(arguments).map(function(_) { return $a(_) })
    var len = arrs.pluck('length').reduce(Math.max)
    var re = []
    for (var i = 0; i < len; i++) {
      for (var j = 0; j < arrs.length; j++) {
        if (arrs[j].length > i) re.push(arrs[j][i])
      }
    }
    return re
  }
})
