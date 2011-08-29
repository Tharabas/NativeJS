/**
 * Extensions to the generic Function
 */

(function() {
// bof
  
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
	 * Returns a function that will call the source function with different parameters
	 * (reordering parameters)
	 *
	 * @return Function
	 */
	using: function() {
    var __method = this;
    var take = $A(arguments);
    return function() {
      return $A(arguments).get(take).on(__method)
    }
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
	 * A partial apply method ... still have to name it
	 */
	_: function() {
	  if (!arguments.length) return this;
    var __method = this, pargs = $A(arguments)
    return function() {
      // fill the given arguments with the predefined passArgs
      var a = pargs.fill($A(arguments))
      return __method.apply(this, a);
    }
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
	 * Logically ands (&&) results of this function and all passed function
	 */
	and: function() {
	  var __methods = $A(arguments).unshift(this)
	  return function() {
	    var args = $A(arguments);
	    return __methods.foldLeft(true, function(a, b) { return a && b.apply(null, args) })
	  }
	},
	
	/**
	 * Logically ors (||) results of this function and all passed function
	 */
	or: function() {
	  var __methods = $A(arguments).unshift(this)
	  return function() {
	    var args = $A(arguments);
	    return __methods.foldLeft(false, function(a, b) { return a || b.apply(null, args) })
	  }
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

Object.extend(Function, {
  arg: function(n) {
    return function() { return $A(arguments)[n] }
  }
})

// eof
})();
