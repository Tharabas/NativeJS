/**
 * Statistics Addon
 */
(function() {
  Object.overwrite(Array, {
    /**
     * @return Number the smallest value in this Array
     */
    getMinimum: function() {
      return this.reduce(Math.min)
    },

    /**
     * @return the largest number in this Array
     */
    getMaximum: function() {
      return this.reduce(Math.max)
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
    	var sl = this.sort(sortFunction)
    	return sl[(sl.length / 2).floor()];
    },

    /**
     * @return Number the count of all values in this Array that are unique within this Array
     */
    getDifferentValues: function() {
      return this.uniq().length
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
    }
  })
})();