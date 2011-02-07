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
  setDateValue: function(year, month, date) {
    if (!$void(year)) this.setYear(year)
    if (!$void(month)) this.setMonth(month)
    if (!$void(day)) this.setDate(day)

    return this
  },
  setTimeValue: function(hours, minutes, seconds, milliseconds) {
    if (!$void(hours)) this.setHours(hours)
    if (!$void(minutes)) this.setMinutes(minutes)
    if (!$void(seconds)) this.setSeconds(seconds)
    if (!$void(milliseconds)) this.setMilliseconds(milliseconds)
    
    return this
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
