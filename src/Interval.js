/**
 * Numeric Interval
 *
 * relic, subjected to be removed in an upcomping version,
 * as ObjectRange should do about the same
 */
Interval = Class.create({
	pattern: /(\[|\])?(\d+(?:\.\d+)?)(?:,|;|-)(\d+(?:\.\d+)?)(\[|\])?/,
	initialize: function Interval(start, end) {
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
