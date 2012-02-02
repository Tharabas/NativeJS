/**
 * A generic Point class (simple x,y) with some utility methods
 */
var Point = Class.create({
	initialize: function Point(x,y) {
		if (Object.isUndefined(x)) {
			this.x = 0;
			this.y = 0;
		} else if (!$void(x[0]) && !$void(x[1])) {
			this.x = x[0];
			this.y = x[1];
		} else if (x instanceof Element.Offset) {
		  this.x = x.left;
		  this.y = x.top;
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
		return new Point(this.x, this.y);
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
		var pt = $P(x, y)
		this.x = pt.x
		this.y = pt.y
		return this
	},
	
	/**
	 * Moves this point towards another point with a given part
	 * percentage of 0% will be the original point, 100% will be the other point
	 * 
	 * Example: 
	 *   $P(1, 1).moveTowards($P(3, 3), 0.5) => Point(2, 2)
	 *   $P(1, 1).moveTowards($P())
	 *
	 * @param Point pt       the destination point
	 * @param float distance the distance, defaults to 0.5
	 * @param bool  absolute whether the movement is absolute, deafults to false
	 * @see Point.merge
	 */
	moveTowards: function(pt, distance, absolute) {
	  if (distance instanceof Point) {
	    distance = distance.radius()
	  }
	  var delta = pt.subtract(this)
	  if (absolute) {
	    // absolute movement is is pixels
	    if (Object.isUndefined(distance)) distance = 1
	    if (delta.x == 0) {
	      if (delta.y != 0) {
  	      // y movement only
  	      this.y += distance * delta.y.sign()
	      }
	      // else would be no movement at all ... so nada
	    } else if (delta.y == 0) {
	      // x movement only
	      this.x += distance * delta.x.sign()
	    } else {
  	    // x and y movement
  	    var ratio = delta.y / delta.x
  	    // division term is always positive due to the (_+1) within the sqrt
  	    var x = distance / (ratio.square() + 1).sqrt()
  	    this.x += x
  	    this.y += x * ratio
	    }
	  } else {
	    if (Object.isUndefined(distance)) distance = .5

  	  this.x += (pt.x - this.x) * distance
  	  this.y += (pt.y - this.y) * distance
	  }
	  
	  return this
	},
	
	/**
	 * A non-destructive move towards
	 */
	movedTowards: function(pt, distance, absolute) {
	  return this.clone().moveTowards(pt, distance, absolute)
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
	 * Moves in a polar fashion (by angle and radius)
	 */
	moveByPolar: function(radius, angle) {
	  return this.moveBy(Point.polar(angle, radius))
	},
	
	// another new type function
	angle: function(value) {
	  if (Object.isUndefined(value)) {
	    return Math.atan2(this.x, this.y)
	  }
	  
	  var pt = Point.polar(value, this.radius())
	  this.x = pt.x
	  this.y = pt.y
	  return this;
	},
	
	rotateBy: function(value) {
	  return this.angle(this.angle() + value)
	},
	
	radius: function(value) {
	  if (Object.isUndefined(value)) {
	    return (this.x.square() + this.y.square()).sqrt()
	  }
	  
	  var pt = Point.polar(this.angle(), value)
	  this.x = pt.x
	  this.y = pt.y
	  return this
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
	
	snap: function(v, f) {
	  return this.clone().map(Math.snap._(_, v, f));
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
	
	absoluteIn: function(w, h) {
	  var d = $D(w, h)
	  return this.multiply(d.width, d.height)
	},
	
	relativeIn: function(w, h) {
	  var d = $D(w, h)
	  return this.divide(d.width, d.height)
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
	
	half: function() {
	  return this.multiply(.5)
	},
	
	doubled: function() {
	  return this.multiply(2)
	},
	
	toDimensions: function() {
	  return Dimensions(this.x, this.y)
	},
	
	toString: function() {
		return 'Point(' + this.x + ', ' + this.y + ')';
	}
});

Object.extend(Point, {
  merge: function(pt1, pt2, p) {
    return new Point(
      pt1.x + (pt2.x - pt1.x) * p,
      pt1.y + (pt2.x - pt1.y) * p
    )
  },
  polar: function(angle, radius) {
    return new Point(
      angle.sin() * (radius || 1),
      angle.cos() * (radius || 1)
    )
  }
})

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
	initialize: function Dimensions($super, width, height) {
		if (typeof(width) == 'object') {
			try {
				this.moveTo(width.width, width.height);
			} catch (ex) {
				this.moveTo(width, height);
			}
		} else {
			this.moveTo(width, height);
		}
	},
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
	
	toPoint: function() {
	  return new Point(this.width, this.height)
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
	if (w instanceof Point) {
	  return new Dimensions(w.x, w.y)
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
  initialize: function Rectangle($super, x, y, width, height) {
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
	
	// old style
	getCenter: function() {
		return new Point(this.x + this.width * .5, this.y + this.height * .5)
	},
	
	setCenter: function(x, y) {
	  var c = $P(x, y)
	  this.moveTo(c.subtract(this.width * .5, this.height * .5))
	},
	
	// new style center
	center: function(x, y) {
	  if (Object.isUndefined(x)) return this.getCenter()
	  this.setCenter(x, y)
	  return this
	},
	
	radius: function() {
	  return new Point(this.width * .5, this.height * .5)
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
  
  growBy: function(x, y) {
    if (Object.isUndefined(x)) x = 1;
    if (Object.isUndefined(y)) y = x;
    
    this.x -= x
    this.y -= y
    this.width  += x + x
    this.height += y + y
    
    return this
  }
});

Object.extend(Rectangle, {
  Methods: {
    contains: function(r, x, y) {
      return x.isWithin(r.x, r.x + r.width )
          && y.isWithin(r.y, r.y + r.height)
    }
  }
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