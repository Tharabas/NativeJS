/** 
 * @requires Math
 *
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
   * Unlike a lot of the other Math methods this didn't make it into the generic
   * Math object, as there is already a Math.random method that must be kept
   *
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