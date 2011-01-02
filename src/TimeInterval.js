/**
 * Stores a Time-Interval in Hours
 * 
 * this.start and this.duration contain hour values
 */
TimeInterval = Class.create({
	initialize: function TimeInterval(start, duration) {
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
