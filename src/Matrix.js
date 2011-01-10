/**
 * What is the Matrix?
 * 
 * a default two dimension table
 *
 * @requires 
 */
var Matrix = Class.create({	
	//
	// init
	//
	initialize: function Matrix(width, height, value, options) {
		if (width instanceof Matrix) {
			this.width = width.width;
			this.height = width.height;
			this.data = [];
			for (var i = 0; i < width.data.length; i++) {
				this.data.push(width.data[i]);
			}
			return this;
		}
		
		// just expect width and height to be int values for now
		this.width = width;
		this.height = height;
		
		// initialize the data array (one dimension long array)
		this.data = [];
		
		if (Object.isUndefined(options)) {
			options = 0;
		}
		if (!(options & Matrix.OPTION_NO_FILL)) {
			if (Object.isFunction(value)) {
				this.fill(null);
				this.map(value, true);
			} else {
				this.fill(value);
			}
		}
	},
	
	clone: function() {
		return new Matrix(this);
	},
	
	toArray: function() {
		var re = [];
		var n = 0;
		for (var j = 0; j < this.height; j++) {
			var row = [];
  		for (var i = 0; i < this.width; i++, n++) {
				row.push(this.data[n]);
			}
			re.push(row);
		}
		
		return re;
	},
	
	getWidth: function() {
		return this.width;
	},
	
	getHeight: function() {
		return this.height;
	},
	
	getSize: function() {
		return this.width * this.height;
	},
	
	set: function(x, y, v) {
		if (x > this.widht || y > this.height) {
			throw new Error(
			  'MatrixIndexOutOfBounds', 
			  'Matrix.set(' + x + ', ' + y + ') is not in (' + this.width + ', ' + this.height + ')'
			);
		}
		var old = this._get(x, y);
		this._set(x, y, v);
		return old;
	},
	
	// no-check internal set (should be faster)
	_set: function(x, y, v) {
		this.data[this.width * y + x] = v;
	},
	
	get: function(x, y) {
		var pos = this.width * y + x;
		if (pos < 0 || pos > this.data.length) {
			throw new Error(
			  'MatrixIndexOutOfBounds', 
			  'Matrix.get(' + x + ', ' + y + ') is not in (' + this.width + ', ' + this.height + ')'
			);
		}
		return this.data[pos];
	},

	// no-check internal get (should be faster)
	_get: function(x, y) {
		return this.data[this.width * y + x];
	},
	
	fill: function(value) {
	  value = value || null // prevent undefined values
    var size = this.getSize();
    // initialize the maxrix
    for (var i = 0; i < size; i++) {
      this.data[i] = value;
    }
  },
  
  column: function(col, value, ctx) {
    if (Object.isUndefined(value)) {
      // only return the row
      var re = []
      for (var i = col; i < this.data.length; i+= this.width) {
        re.push(this.data[i])
      }
      return re
    }

    var f = $return(value)
    if (Object.isFunction(value)) {
      f = value.bind(ctx || null)
    } else if (Object.isArray(value)) {
      f = function(v, x, y) { return value[y] }
    }
    for (var i = col, row = 0; i < this.data.length; i+= this.width, row++) {
      this.data[i] = f(this.data[i], col, row)
    }
    
    return this
  },
  
	getColumn: function(column) {
		var re = [];
		for (var i = 0; i < this.height; i++) {
			re.push(this._get(column, i));
		}
		
		return re;
	},
	
	row: function(row, value, ctx) {
    var n = this.width * row,
        m = n + thiw.width;
    if (Object.isUndefined(value)) {
      // only return the row
      return this.data.slice(n, m)
    }

    var f = $return(value)
    if (Object.isFunction(value)) {
      f = value.bind(ctx)
    } else if (Object.isArray(value)) {
      f = function(v, x, y) { return value[x] }
    }
    for (var i = n; i < this.data.length; i++) {
      this.data[i] = f(this.data[i], i - n, row)
    }
    
    return this
	},
	
	getRow: function(row) {
		var re = [];
		for (var i = 0; i < this.width; i++) {
			re.push(this._get(i, row));
		}
		
		return re;
	},
	
  setBlock: function(x, y, width, height, value) {
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        this._set(x + i, y + j, value);
      }
    }
  },
  
  getBlock: function(x, y, width, height) {
    var m = new Matrix(width, height);
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        m._set(i, j, this._get(i + x, j + y));
      }
    }
    
    return m;
  },
  
  /**
   * Transposition of the Matrix, will flip it, non-destructive
   * 
   * Example: (excuse those crappy multiline brackets :)
   *
   * / 1, 2 \     / 1, 3, 5 \
   * | 3, 4 |  => \ 2, 4, 6 /
   * \ 5, 6 /
   *
   */
  transpose: function() {
    var me = this
    return new Matrix(this.height, this.width, function(v, x, y) {
      return me._get(y, x)
    })
  },
  
  getAllObjects: function(type) {
  	if (Object.isUndefined(type)) {
  		typeFunction = function(o) { return typeof(o) == 'object'; };
  	} else if (Object.isFunction(type)) {
			typeFunction = type;
  	} else if (Object.isString(type)) {
  		typeFunction = function(o) { return o instanceof eval(type); };
  	} else {
  		typeFunction = function(o) { return o instanceof type; };
  	}
  	
  	return this.data.filter(typeFunction)
  },
  
  indexOf: function(value, x, y) {
  	var start = 0;
  	if (!Object.isUndefined(x)) {
  		var pt = $P(x, y);
  		start = start.max(pt.y * this.width + pt.x);
  	}
  	for (var i = start; i < this.data.length; i++) {
  		if (this.data[i] == value) {
  			return [i % this.width, (i / this.width).floor()];
  		}
  	}
  	return -1;
  },
  
  lastIndexOf: function(value, x, y) {
  	var start = this.data.length - 1;
  	if (!Object.isUndefined(x)) {
  		var pt = $P(x, y);
  		start = start.min(pt.y * this.width + pt.x);
  	}
  	for (var i = start; i >= 0; i--) {
  		if (this.data[i] == value) {
  			return [i % this.width, (i / this.width).floor()];
  		}
  	}
  	return -1;
  },
  
  /**
   * overrides a subset of this matrix with another (matrix overlay)
   */
  insert: function(x, y, matrix) {
    // expect the matrix to fit this matrix
    var mw = matrix.getWidth();
    var mh = matrix.getHeight();
    
    for (var j = 0; j < hm; j++) {
      for (var i = 0; i < mw; i++) {
        // slow but simple deep copy
        // could be made faster betimes
        this._set(x + i, y + j, matrix._get(i, j));
      }
    }
    
    return this;
  },
  
  /**
   * a subset matrix merge, non-destructive by default
   */
  merge: function(x, y, matrix, method, destructive) {
  	if (Object.isUndefined(matrix) || matrix == null) {
  		matrix = this.clone();
  	}
  	
  	if (Object.isUndefined(destructive)) {
  		destructive = false;
  	}
  	
  	var m;
  	if (destructive) {
  		m = this;
  	} else {
	  	m = new Matrix(this.width, this.height, null, Matrix.OPTIONS_NO_FILL);
  	}
  	
  	// do the dimensions match?
  	if (this.equalDimensions(matrix)) {
  		// faster direct iteration for equal matrices
  		for (var i = 0; i < this.data.length; i++) {
  			m.data[i] = method(this.data[i], matrix.data[i]);
  		}
  	} else {
	  	// expect the matrix to fit this matrix
			for (var j = 0; j < this.height; j++) {
		  	for (var i = 0; i < this.width; i++) {
		  		// slow but simple deep copy
		  		// could be made faster betimes
		  		var one = this._get(x + i, y + j);
		  		var two = matrix._get(i, j);
		  	  m._set(x + i, y + j, method(one, two));
		  	}
			}
  	}
		
		return m;
  },
  
  /**
   * a async call of a function on each element of the matrix
   */
  each: function(fn, ctx) {
    var s =  this.getSize(),
        i =  0,
        x = -1,
        y = -1
        
    for (i; i < s; i++) {
      if (i % this.width == 0) {
        x = 0
        y++
      } else {
        x++
      }
      fn.apply(ctx||window,[this.data[i],x,y])
    }
    return this
  },
  
  /**
   * a functional mapping for all values in this matrix,
   * the arguments passed to the method are (sourceValue, x, y)
   */
  map: function(method, destructive) {
  	if (Object.isUndefined(destructive)) {
  		destructive = false;
  	}
  	
  	var m;
  	if (destructive) {
  		m = this;
  	} else {
	  	m = new Matrix(this.width, this.height, null, Matrix.OPTIONS_NO_FILL);
  	}
  	
  	var size = this.getSize();
  	var x = -1; 
  	var y = -1;
  	for (var i = 0; i < size; i++) {
  		if (i % this.width == 0) {
  			x = 0;
  			y++;
  		} else {
  			x++;
  		}
  		m.data[i] = method.apply(window, [this.data[i], x, y]); 
  	}
  	
  	return m;
  },
  
  //
  // convenience merge methods
  //
  
  getAndMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.and, destructive);
  },
  
  getOrMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.or, destructive);
  },
  
  getXorMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.xor, destructive);
  },
  
  getNorMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.nor, destructive);
  },

  getNandMatrix: function(matrix, destructive) {
  	return this.merge(0, 0, matrix, Math.nand, destructive);
  },
  
  getNotMatrix: function(destructive) {
  	return this.map(Math.not, destructive);
  },
  
  //
  // data status methods
  //
  isEmpty: function(emptyCompareFunction) {
  	if (Object.isUndefined(emptyCompareFunction)) {
  		emptyCompareFunction = Math.empty;
  	}
  	return this.isAll(emptyCompareFunction);
  },
  
  isAll: function(compare) {
  	return this.data.isAll(compare);
  },
  
  equalDimensions: function(m) {
  	var matrix = $M(m);
  	return matrix.width == this.width && matrix.height == this.height;
  },
  
	/**
	 * Checks whether there is any data within a defined block
	 * 
	 * @return boolean
	 */
	hasDataAt: function(x, y, width, height, compareFunction) {
		if (Object.isUndefined(compareFunction)) {
			compareFunction = Math.notEmpty;
		}
		var args = $A(arguments);
		x = x || 0;
		y = y || 0;
		
		if (x + width > this.width || y + height > this.height) {
      throw new Error(
        'MatrixIndexOutOfBounds', 
        'Matrix.hasDataAt(' + args.join(', ') + ') is not in (' + this.width + ', ' + this.height + ')'
      );
    }
		 
		if (!Object.isNumber(x) || !Object.isNumber(y)) {
			return false;
		}
		
		for (var i = 0; i < width; i++) {
			for (var j = 0; j < height; j++) {
				if (compareFunction(this._get(x + i, y + j))) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	countValuesInRow: function(row, compareFunction) {
		if (Object.isUndefined(compareFunction)) {
			compareFunction = Math.notEmpty;
		}
		var re = 0;
		for (var i = 0; i < this.width; i++) {
			if (compareFunction(this._get(i, row))) {
				re++;
			}
		}
		
		return re;
	},
	
	countValuesInColumn: function(column, compareFunction) {
		if (Object.isUndefined(compareFunction)) {
			compareFunction = Math.notEmpty;
		}
    var re = 0;
    for (var i = 0; i < this.height; i++) {
      if (compareFunction(this._get(column, i))) {
        re++;
      }
    }
    
    return re;
	},
	
	countMaxValuesInRows: function(startRow, rows) {
		var maxVal = 0;
		for (var i = startRow; i < startRow + rows; i++) {
			maxVal = maxVal.max(this.countValuesInRow(i));
		}
		return maxVal;
	},
	
	dump: function(fn) {
	  fn = fn || console.log.bind(console)
	  
	  return this.data.inGroupsOf(this.width).each(function(v) { fn.apply(null,v)})
	},
	
	toBinaryOut: function() {
		return this.map(function(v) { return v ? '+' : '-' }).toArray().glue();
	},
	
	toString: function() {
		return 'Matrix(' + this.width + ' x ' + this.height + ')';
	}
});

Object.extend(Matrix, {
  // Options
  OPTION_NO_FILL: 0x10,
  
  // creater
  create: function(width, height, value, options) {
    return new Matrix(width, height, value, options)
  },
  
  // column creater
  Column: function(height, value, options) {
    return new Matrix(1, height, value, options)
  },
  
  // row creater
  Row: function(width, value, options) {
    return new Matrix(width, 1, value, options)
  },
  
  // qubic matrix creater
  Qubic: function(dimension, value, options) {
    return new Matrix(dimension, dimension, value, options)
  },
  
  // Identity matrix of a given size
  Identity: function(dimension) {
    return Matrix.Qubic(dimension, function(v,x,y) { return x == y ? 1 : 0 })
  }
})

$M = function() {
	var args = $(arguments);
  if (args[0] instanceof Matrix) {
  	return args[0];
  } else {
    var M = new Matrix;
    M.initialize.apply(M, args)
  	return M;
  }
}

Object.extend($M, {
  Column:function(height, value, options) {
    if (Object.isArray(height)) {
      return Matrix.Column(height.length, function(v,x,y) { return height[y] })
    } else {
      return Matrix.Column(height, value, options)
    }
  },
  Row: function(width, value, options) {
    if (Object.isArray(width)) {
      return Matrix.Row(width.length, function(v,x,y) { return width[x] })
    } else {
      return Matrix.Row(width, value, options)
    }
  },
  Q: function(dim, value, options) {
    return Matrix.Qubic(dim, value, options)
  },
  Ident: function(dim) {
    return Matrix.Identity(dim)
  }
})
