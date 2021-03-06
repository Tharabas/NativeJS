/**
 * @requires Basic
 *
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
 
(function() {
  function absmax(a, b) { return Math.abs(a) >= Math.abs(b) ? a : b }
  function absmin(a, b) { return Math.abs(a) <= Math.abs(b) ? a : b }
  
  Object.extend(Math, {
    //
    // simple math functions
    //
    
    /**
     * Identity method, will return only the first argument passed
     *
     * @param Number number an input number
     * @return Number the given number
     */
    ident: function(number) {
      return number
    },
    
    /**
     * Will return the numeric negation of the first argument passed
     *
     * @param Number number an input number
     * @return Number 
     */
    negate: function(number) {
      return -number
    },

    /**
     * boolean not
     */
    not: function(number) {
      return !number
    },

    /**
     * Bitwise inversion
     */
    invert: function(number) {
      return ~number
    },

    sum: function(one, two) {
      return one + two
    },

    sub: function(one, two) {
      return one - two
    },

    /**
     * simple multiply
     */
    mul: function(one, two) {
      return one * two
    },

    /**
     * simple division
     */
    div: function(one, two) {
      return one / two
    },

    /**
     * simple modulo
     */
    mod: function(number, modus) {
      return number % modus
    },

    /**
     * Absolute (nagative save) modulo
     */
    amod: function(number, modus) {
      return number < 0 
        ? number - Math.floor(number / modus) * modus
        : number % modus
    },

    increase: function(number) {
      return number + 1
    },

    decrease: function(number) {
      return number - 1
    },

    //
    // reversed order pow
    //  
    rpow: function(exp, base) {
      return Math.pow(base, exp)
    },

    //
    // two named simple functions, just like sqrt
    //

    transpose: function(number) {
      return 1 / number
    },

    twice: function(number) {
      return number + number
    },

    half: function(number) {
      return 0.5 * number
    },

    // = x ^ 2
    // = rpow(2, x)
    square: function(number) {
      return number * number
    },

    //
    // logic functions
    //

  	and: function(one, two) {
  		return one & two
  	},
  	
  	and2: function(one, two) {
  	  return one && two
  	},

  	or: function(one, two) {
  		return one | two
  	},
  	
  	or2: function(one, two) {
  	  return one || two
  	},

  	xor: function(one, two) {
  		return one ^ two
  	},

  	nor: function(one, two) {
  		return !(one | two)
  	},

  	nand: function(one, two) {
  		return !(one & two)
  	},

  	equal: function(one, two) {
      return one == two
    },

    identical: function(one, two) {
      return one === two
    },

  	empty: function(value) {
  		if (Object.isUndefined(value) || value == null) {
  			return true
  		}
  		if (Object.isString(value) && value.strip().length == 0) {
  			return true
  		}
  		if (Object.isNumber(value) && parseFloat(value) == 0) {
  			return true
  		}
  		if (Object.isArray(value) && value.length == 0) {
  			return true
  		}
  		if (Object.classOf(value) == Object && Object.keys(value).length == 0) {
  		  return true
  		}
  		return false
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
     * a simple random chance
     * @return boolean
     */
    chance: function(number) {
      return Math.random() <= number
    },

    /**
     * will return one if the condition is met
     * zero otherwise
     * (aka Kronecker-Delta)
     */
    oneIf: function(number, condition) {
      if (!Object.isFunction(condition)) {
        return condition == number ? 1 : 0;
      }
      return condition(number) ? 1 : 0;
    },

    /**
     * will return zero if the condition is met one otherwise
     * (aka reversed Kronecker-Delta)
     */
    zeroIf: function(number, condition) {
      if (!Object.isFunction(condition)) {
        return condition == number ? 0 : number;
      }
      return condition(number) ? 0 : number;
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
    
    /**
     * Will 'snap' the number to the nearest v
     *
     * @param Number   number the base value for the snapping
     * @param Number   v      the snapping interval
     * @param Function f      a snapping function, defaults to Math.round
     *
     * Example:
     *   // snap to the next even number
     *   snap(3.1415)       => 3
     *   snap(3.1415, 0.1)  => 3.1
     *   snap(1337, 100)    => 1300
     *   snap(42, 5)        => 40
     *   // snap with ceiling
     *   snap(42, 5, Math.ceil) => 45
     * 
     */
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
    toHex: function(number, digits) {
    	return number.toPaddedString(digits || 0, 16).toUpperCase()
    },
    /**
     * @return String the Binary value of this Number
     */
    toBinary: function(number) {
    	return number.toString(2)
    },

    /**
     * Returns the "behind the comma" value of a number
     */
    tail: function(number) {
      return number - Math.floor(number)
    },

    /**
     * Returns an array containing the floor and tail value of a number
     */
    split: function(number) {
      var floored = Math.floor(number)
      return [floored, number - floored]
    },

    /**
     * Returns the value that is 
     */
    absmax: function(a, b) {
      var args = $A(arguments)
      switch (args.length) {
        case 0:  return undefined;
        case 1:  return a;
        case 2:  return absmax(a, b);
        default: return args.reduce(absmax)
      }
    },

    absmin: function(a, b) {
      var args = $A(arguments)
      switch (args.length) {
        case 0:  return undefined;
        case 1:  return a;
        case 2:  return absmin(a, b);
        default: return args.reduce(absmin)
      }
    },

    deg: function(number) {
      return number * (Math.PI / 180)
    },

    rad: function(number) {
      return number / (Math.PI / 180)
    },

    sign: function(n) {
      return n < 0 ? -1 : n > 0 ? 1 : 0
    }
  });
  
  $H(Math).each(function(m) { 
    Number.prototype[m.key] = m.value.methodize();
  });
  $w('abs acos asin atan ceil cos exp floor log max min pow round sin sqrt tan').each(function(n) {
    Number.prototype[n] = Math[n].methodize();
  });
  $w('sum sub mul div pow rpow and and2 or or2 xor nor nand equal identical mod amod').each(function(n) {
    Number.prototype['_' + n] = function() {
      return Math[n]._(this);
    }
    Number.prototype[n + '_'] = function() {
      return Math[n]._(_, this)
    }
  });
})()
