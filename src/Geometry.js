/**
 * Extension to the Element.Methods
 */
Object.extend(Element.Methods, {
	/**
	 * Moves an Element to a specified (x,y) coordinate
	 * 
	 * @return Element the Element itself
	 */
  moveTo: function(element, x, y) {
    var s = {};
    if (Object.isElement(x)) {
      var pos = x.positionedOffset();
      var s = {
        'top':  pos[1],
        'left': pos[0]
      };
    } else {
    	var pt = $P(x, y);
      s = {
        'top':  pt.y,
        'left': pt.x
      };
    }
  	
  	if (s.left !== undefined)
  	  element.style.left = s.left + 'px';
  	if (s.top  !== undefined)
      element.style.top  = s.top  + 'px';
    
    return element;
  },
  moveBy: function(element, x, y) {
    var pt = $P(x, y);
    var origin = $P(element);
    
    element.style.left = (origin.x + pt.x) + 'px';
    element.style.top  = (origin.y + pt.y) + 'px';
    
    return element;
  },
  /**
   * Moves an element right below the lower edge of another Element
   * 
   * @return Element the Element itself
   */
  moveBelow: function(element, target) {
  	var ptTarget = $P(target);
  	var dTarget = $D(target); 
  	element.style.top = (ptTarget.x + dTarget.height) + 'px';
  	
  	return element;
  },
  /**
   * Returns the CenterPoint of an Element
   * 
   * @return Point
   */
  getCenter: function(element) {
    return $P(element).moveBy($D(element).getCenter());
  },
  /**
   * Moves an Element so that it will be right above the center of its Parental Layout Element
   */
  centerOnParent: function(element) {
    var parent = element.getOffsetParent()
    var pd = $D(parent)
    var ed = $D(element)
    var nc = pd.subtract(ed).divide(2)
    
    return element.moveTo(nc)
  },
  centerHorizontallyOnParent: function(element) {
    var parent = element.getOffsetParent()
    var pd = $D(parent)
    var ed = $D(element)
    var nc = { x: (pd.x - ed.x) / 2 }
    
    return element.moveTo(nc);
  },
  /**
   * Returns true when a Point is within the absolute range of this Element
   * 
   * @return boolean
   */
  containsPoint: function(element, x, y) {
  	var pt = element.getRelativePosition(x, y);
    var dim = $D(element);

    return pt.x >= 0 && pt.x <= dim.getWidth()
        && pt.y >= 0 && pt.y <= dim.getHeight();
  },
  /**
   * 
   */
  getRelativePosition: function(element, x, y) {
    return $P(x, y).subtract(element); 
  },
  
  /**
   * lets the first element mimic the style of the second
   * 
   * @return Element the Element itself
   */
  fit: function(element, target, styles) {
    var stylesToSet = $(target).getStyles();
    if (!Object.isUndefined(styles)) {
      if (Object.isString(styles)) {
        styles = $w(styles);
      }
      if (Object.isArray(styles)) {
        var sts = {};
        for (var e in stylesToSet) {
          if (styles.contains(e)) {
            sts[e] = stylesToSet[e];
          }
        }
        stylesToSet = sts;
      }
    }
    
    // IE FIX
    if (navigator.userAgent.indexOf('MSIE') > 0) {
      if (stylesToSet['width'] == 'auto') {
        stylesToSet['width'] = $(target).getDimensions().width + 'px';
      }
      if (stylesToSet['height'] == 'auto') {
        stylesToSet['height'] = $(target).getDimensions().height + 'px';
      }
    }
    
  	element.setStyle(stylesToSet);
  	
  	return element;
  },
  
  fitParent: function(element, styles) {
    Element.Methods.fit(element, element.getOffsetParent() || window, styles)
  },
  
  fitParentSize: function(element) {
    Element.Methods.fitParent(element, 'width height')
  },
  
  /**
   * enables/disables an element
   * 
   * @return Element the Element itself
   */
  setEnabled: function(element, enabled) {
    if (enabled !== false) {
      element.removeAttribute("disabled");
    } else {
      element.setAttribute("disabled", "disabled");
    }
    
    return element;
  },
  
  /**
   * property returning the enabled status of an Element
   * @return boolean
   */
  isEnabled: function(element) {
    return element.hasAttribute("disabled") == false;
  },
  
  /**
   * just the same as isEnabled
   * @return boolean
   */
  enabled: function(element) {
    return element.isEnabled();
  },
  
  addClassNames: function(element, names) {
    names.each(Element.Method.addClassName.curry(element))
  },
  
  removeClassNames: function(element, names) {
    names.each(Element.Method.removeClassName.curry(element))
  },
  
  toggleClassNames: function(element, names) {
    names.each(Element.Method.toggleClassName.curry(element))
  },
  
  updateClassNames: function(element, names) {
    names.foreach(function(n) {
      if (n.startsWith('+')) {
        element.addClassName(n.substring(1))
      } else if (n.startsWith('-')) {
        element.removeClassName(n.substring(1))
      } else if (n.startsWith('~')) {
        element.toggleClassName(n.substring(1))
      } else {
        element.toggleClassName(n)
      }
    })
  }
});

var Point = Class.create();
Object.extend(Point.prototype, {
	initialize: function(x,y) {
		if (Object.isUndefined(x)) {
			this.x = 0;
			this.y = 0;
		} else if (Object.isArray(x)) {
			this.x = x[0];
			this.y = x[1];
		} else if ((x instanceof Point) || (typeof(x) == 'object')) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			if (Object.isUndefined(y)) {
				this.y = x;
			} else {
				this.y = y;
			}
		}
	},
	
	getX: function() {
		return this.x || 0;
	},
	
	setX: function(x) {
		this.x = x;
		return this;
	},
	
	getY: function() {
		return this.y || 0;
	},
	
	setY: function(y) {
		this.y = y;
		return this;
	},
	
	clone: function() {
		return new Point(this.getX(), this.getY());
	},
	
	map: function(method, x, y) {
		if (Object.isUndefined(x, y)) {
			this.x = method(this.x);
			this.y = method(this.y);
		} else {
			var pt = $P(x, y);
			this.x = method(this.x, pt.x);
			this.y = method(this.y, pt.y);
		}
		
		return this;
	},
	
	/**
	 * Moves this point to a new location (destructive)
	 *
	 * @param x Number or Point
	 * @param y Number or Omitted
	 */
	moveTo: function(x, y) {
		var pt = $P(x, y);
		this.x = pt.x;
		this.y = pt.y;
		return this;
	},
	
	/**
	 * A destructive add
	 * 
	 * @return Point this point
	 */
	moveBy: function(x, y) {
		var pt = $P(x, y);
		this.x += pt.x;
		this.y += pt.y;
		return this;
	},
	
	/**
	 * Inverts the values of this point
	 */
	invert: function(destructive) {
		if (Object.isUndefined(destructive)) {
			destructive = false;
		}

		if (!destructive) {
  		return this.clone().invert(true);
		}

		this.x *= -1;
		this.y *= -1;
		return this;
	},
	
	transpose: function(destructive) {
		if (Object.isUndefined(destructive)) {
			destructive = false;
		}
		
		if (!destructive) {
  		return this.clone().transpose(true);
		}
		
		this.x = 1 / this.x;
		this.y = 1 / this.y;
		return this;
	},
	
	/**
	 * Swaps the x and y positions of this Point
	 *
	 * @param destructive boolean
	 */
	swap: function(destructive) {
	  if (Object.isUndefined(destructive)) {
	    destructive = false;
	  }
	  
	  if (!destructive) {
	    return this.clone().swap(true);
	  }
	  
		var t = this.x;
		this.x = this.y;
		this.y = t;
		return this;
	},
	
	floor: function() {
		return this.clone().map(Math.floor);
	},
	
	round: function() {
		return this.clone().map(Math.round);
	},
	
	ceil: function() {
		return this.clone().map(Math.ceil);
	},

	add: function(x, y) {
		var pt = $P(x, y);
		return new Point(this.x + pt.x, this.y + pt.y);
	},
	
	subtract: function(x, y) {
		return this.add($P(x, y).invert());
	},
	
	multiply: function(x, y) {
		var pt = $P(x, y);
		return this.clone().moveTo(this.getX() * pt.getX(), this.getY() * pt.getY());
	},
	
	divide: function(x, y) {
		var pt = $P(x, y);
		return this.clone().moveTo(this.getX() / pt.getX(), this.getY() / pt.getY());
	},
	
	normalize: function(width, height) {
		var dim = $D(width, height);
		if (dim.getArea() > 0) {
			return new Point(
				this.x / dim.getWidth(), 
				this.y / dim.getHeight()
			);
		}
		return this;
	},
	
	min: function(x, y) {
		return this.clone().map(Math.min, x, y);
	},
	
	max: function(x, y) {
		return this.clone().map(Math.max, x, y);
	},
	
	distanceTo: function(x, y) {
		return this.subtract(x, y).getLength();
	},
	
	getLength: function() {
		return Math.sqrt(this.x.pow(2) + this.y.pow(2));
	},
	
	toString: function() {
		return 'Point(' + this.x + ', ' + this.y + ')';
	}
});

function $P(x, y) {
	if (Object.isElement(x) || (Object.isString(x) && !Object.isUndefined($(x)))) {
		return new Point($(x).cumulativeOffset());
	}
	if (typeof(x) == 'object' && x['pointer']) {
		return new Point(x.pointer());
	}
	if (x instanceof Point) {
		return x;
	}
	return new Point(x, y);
}

var Dimensions = Class.create(Point, {
	initialize: function($super, width, height) {
		if (typeof(width) == 'object') {
			try {
				this.moveTo(width.width, width.height);
			} catch (ex) {
				this.moveTo(width, height);
			}
		} else {
			this.moveTo(width, height);
		}
	}
});
Object.extend(Dimensions.prototype, {
	clone: function() {
		return new Dimensions(this.getWidth(), this.getHeight());
	},
	setWidth: function(width) {
		this.x = width;
		return this;
	},
	
	setHeight: function(height) {
		this.y = height;
		return this;
	},
	
	getWidth: function() {
		return this.x;
	},
	
	getHeight: function() {
		return this.y;
	},
	
	getArea: function() {
		return this.getWidth() * this.getHeight();
	},
	
	getCenter: function() {
		return this.divide(2);
	},
	
	toString: function() {
		return 'Dimensions(' + this.getWidth() + ', ' + this.getHeight() + ')';
	}
});

function $D(w, h) {
  if (Object.isUndefined(w)) {
    return new Dimensions();
  }
  if (Object.isElement(w)) {
    return new Dimensions(w.getDimensions());
  }
	if (w instanceof Dimensions) {
		return w;
	}
	if (w instanceof Rectangle) {
	  return w.getSize();
	}
	if (w instanceof HTMLCanvasElement) {
	  return new Dimensions(w.width, w.height)
	}
	if (w instanceof CanvasRenderingContext2D) {
	  return new Dimensions(w.canvas.width, w.canvas.height)
	}
  if (Object.isString(w) && !Object.isUndefined($(w))) {
    return $D($(w));
  }
	return new Dimensions(w, h);
}

var Rectangle = Class.create(Point, {
  initialize: function($super, x, y, width, height) {
    $super();
    this.width = 0;
    this.height = 0;

    if (Object.isUndefined(x)) {
      // nada
    } else if (Object.isArray(x)) {
      // rect from points ... damn sunshine code
      this.moveTo(x.shift())
      this.contain(x)
    } else if (x instanceof Rectangle) {
      this.moveTo(x.x, x.y);
      this.width = x.width;
      this.height = x.height;
    } else if (x instanceof Point) {
      this.moveTo(x);
      if (!Object.isUndefined(y)) {
        if (y instanceof Dimensions) {
          this.width = y.getWidth();
          this.height = y.getHeight();
        } else if (y instanceof Point) {
          this.width = y.x;
          this.height = y.y;
        } else if ((y instanceof Point) && (width instanceof Point)) {
          // dont get confused, it's just the second and third parameter
          this.width = y;
          this.height = width;
        }
      }
    } else {
      this.moveTo(x, y);
      this.setSize(width, height);
    }
    
    if (this.width < 0) {
      this.x += this.width;
      this.width *= -1;
    }
    if (this.height < 0) {
      this.y += this.height;
      this.height *= -1;
    }
  },
  
  toString: function() {
    return 'Rectangle(' + [this.x, this.y, this.width, this.height] + ')';
  },
  
  clone: function() {
    return new Rectangle(this.x, this.y, this.width, this.height);
  },
  
  setWidth: function(width) {
    this.width = width || 0;
    return this;
  },
  
  getWidth: function() {
    return this.width;
  },
  
  setHeight: function(height) {
    this.height = height || 0;
    return this;
  },
  
  getHeight: function() {
    return this.height;
  },
  
  setSize: function(width, height) {
    this.setWidth(width);
    this.setHeight(height);
    return this;
  },
  
  getSize: function() {
    return new Dimensions(this.getWidth(), this.getHeight());
  },
  
  getArea: function() {
		return this.getWidth() * this.getHeight();
	},
	
	getCenter: function() {
		return this.divide(2);
	},
  
  swapSize: function(destructive) {
    if (Object.isUndefined(destructive)) {
      destructive = true;
    }
    if (!destructive) {
      return this.clone().swapSize(true);
    }
    var t = this.height;
    this.height = this.width;
    this.width = t;
    return this;
  },
  
  swapAll: function(destructive) {
    if (Object.isUndefined(destructive)) {
      destructive = true;
    }
    
    return this.swap(destructive).swapSize(true);
  },
  
  //
  // jQuery style edges, with integrated setter
  //
  
  // changing one value of these will preserve the other edged!
  
  left: function(value) {
    if (Object.isUndefined(value)) return this.x
    var delta   = value - this.x
    this.x      = value
    this.width -= delta
    return this
  },
  
  right: function(value) {
    if (Object.isUndefined(value)) return this.x + this.width
    this.width = value - this.x
    return this
  },
  
  top: function(value) {
    if (Object.isUndefined(value)) return this.y
    var delta    = value - this.y
    this.y       = value
    this.height -= delta
    return this
  },
  
  bottom: function(value) {
    if (Object.isUndefined(value)) return this.y + this.height
    this.height = value - this.y
    return this
  },
  
  // css order
  borders: function(top, right, bottom, left) {
    if (Object.isUndefined(top)) {
      return [this.top(), this.right(), this.bottom(), this.left()]
    }
    return this.top(top).left(left).right(right).bottom(bottom)
  },
  
  // combined setter
    
  contain: function(points) {
    if (!Object.isArray(points)) {
      points = [points]
    }
    
    var left   = this.left(),
        right  = this.right(),
        top    = this.top(),
        bottom = this.bottom()
        
    points.each(function(pt) {
      left   = left.min(pt.x)
      right  = right.max(pt.x)
      top    = top.min(pt.y)
      bottom = bottom.max(pt.y)
    })
    
    this.x = left
    this.y = top

    this.width  = right - left
    this.height = bottom - top
    
    return this
  },
  
  containing: function(points) {
    return this.clone().contain(points)
  },
  
  contains: function() {
    var args = $A(arguments)
    if (args.length == 1) {
      if (args[0] instanceof Point) {
        var pt = args[0]
        return Rectangle.Methods.contains(this, pt.x, pt.y)
      } else if (args[0] instanceof Rectangle) {
        var r = args[0]
        return Rectangle.Methods.contains(this, r.x, r.y)
            && Rectangle.Methods.contains(this, r.x + r.width, r.y + r.height)
      }
    } else if (args.length == 2) {
      if (args.all(Object.isNumber)) {
        return Rectangle.Methods.apply(null, [this].concat(args))
      }
    } else if (args.all(Object.isPoint))
    
    return false
  },
  
  Object.extend(Rectangle, {
    Methods: {
      contains: function(r, x, y) {
        return x.isWithin(r.x, r.x + r.width )
            && y.isWithin(r.y, r.y + r.height)
      }
    }
  })
});

/**
 * Convenience Method to return a rectangle
 */
$RECT = function(x,y,w,h) {
  if (Object.isUndefined(x)) {
    return new Rectangle();
  } else if (Object.isString(x) && !Object.isUndefined($(x))) {
    return $RECT($(x));
  } else if (Object.isElement(x)) {
    return new Rectangle($P(x), $D(x));
  }
  
  return new Rectangle(x, y, w, h);
};

Object.extend(Object, {
  isPoint: function(o) { return o instanceof Point },
  isRectangle: function(o) { return o instanceof Rectangle }
})