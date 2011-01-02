/**
 * The Timer (and TimerContainer) are ment for delayed execution of any method
 */
(function() {
  var TimerContainer = Class.create({
    times: {
      'shortest': 100,
      'shorter':  250,
      'short':    350,
      'long':     750,
      'longer':  1250
    },
    initialize: function TimerContainer(callback, delay, context) {
      this.callback = callback || Prototype.emptyFunction
      this.setDelay(delay)
      this.context = context || window
      this._handle = null
      this.futures = []
      var me = this;
      this.prototype = function() {
        var args = $A(arguments)
        me.apply(me.context, args)
      }
    },
    setDelay: function(delay) {
      delay = parseFloat(this.times[delay] || delay || 1)
      this._delay = delay < 25 ? delay * 1000 : delay
      return this
    },
    run: function() {
      return this.apply(this.context, $A(arguments))
    },
    call: function() {
      var args = $A(arguments)
      var context = args.shift() || this.context
      return this.apply(context, args)
    },
    apply: function(context, args) {
      this.clear()
      var me = this
      this._handle = window.setTimeout(function() {
        me.execute.apply(me, args)
      }, this._delay)
      return this.registerFuture.bind(this)
    },
    execute: function() {
      var args = $A(arguments)
      var re = this.callback.apply(this.context, args)
      this.feedFutures(re)
      return re
    },
    clear: function() {
      if (!this._handle) return;
      window.clearTimeout(this._handle)
      this._handle = null
      return this
    },
    registerFuture: function(fn, count) {
      // by default the registered function serves as a one shot reply
      // to register a durable function use registerFuture(<fn>, true)
      this.futures.push({
        fn:    futureFunction,
        count: count
      })
      return this
    },
    feedFutures: function(value) {
      this.futures = this.futures.map(function(f) {
        // fire & forget
        f.fn(value)
        f.count = f.count === true ? true : (f.count || 1) - 1
        return f
      }).filter(function(f) { return f.count })
      return this
    }
  })
  
  Timer = function(callback, delay, context) {
    var re = Object.extend(function() { 
      return re.apply(context, $A(arguments)) 
    }, new TimerContainer(callback, delay, context))
    return re
  }
  
  Function.prototype.timer = function(delay, context) {
    return new Timer(this, delay, context)
  }
})();

/**
 * DelayedObserver
 */
(function() {
  /**
   * A DelayObserver calls a method after a certain delay.
   * This is mainly for input fields that should call a function after a few seconds of inactivity
   */
  DelayObserver = Class.create({
  	initialize: function DelayObserver(elements, callback, delay, type, breakType) {
  		/**
  		 * initialize the environment
  		 */
   		var me = this

      this.active = true

      // ensure all elements to be Elements or Observables
  		this._elements = elements = $a(elements).map(_$).compact()
  		this._callback = callback

  		// prevent 0 delays
  		delay = delay || 1
  		this._delay = (delay < 25) ? delay * 1000 : delay

  		this._timer = null

  		this._soon  = this._soon.bind(this)
  		this._break = this._break.bind(this)
  		this._do    = this._do.bind(this)

  		/**
  		 * breakType observings
  		 */
  		$a(breakType).each(function(t) {
  		  elements.invoke('observe', t, me._break)
  		})

  		/**
  		 * type observings
  		 */
  		$a(type || 'keyup').each(function(t) { 
  		  elements.invoke('observe', t, me._soon) 
  		})
  	},

  	/**
  	 * starts the timer
  	 */
  	_soon: function() {
  		this._clearTimer()
  		this._timer = this._do.delay(this._delay / 1000)
  	},

  	/**
  	 * this breaks a waiting timer
  	 */
  	_break: function() {
  		this._clearTimer()
  	},

  	/**
  	 * clears the timer ... what else?
  	 */
  	_clearTimer: function() {
  	  if (!this._timer) return;
  		window.clearTimeout(this._timer)
  		this._timer = null
  	},

  	/**
  	 * does what has to be done
  	 */
  	_do: function() {
  		// call the function
  		this._callback()
  		// clear the timer
  		this._clearTimer()
  	}
  });
  
  Element.addMethods({
    checkDelayed: function(element, callback, delay, type, breakType) {
      return new DelayObserver(element, callback, delay, type, breakType)
    },
    hoverDelayed: function(element, callback, delay) {
      return new DelayObserver(element, callback, delay, 'mouseleave', 'mouseenter')
    }
  });
  
  var _$ = function(n) { return Object.isString(n) ? $(n) : n }

  Object.overwrite(Array, {
    observe: function(eventName, callback, context) {
      return this.map(_$).compact().invoke('observe', eventName, callback, context)
    },
    observeDelayed: function(callback, delay, type, breakType) {
      return this.map(_$).compact().map(function(e) {
        return new DelayObserver(e, callback, delay, type, breakType)
      })
    }
  })
})();
