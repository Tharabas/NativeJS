(function($) {
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
      names.each(Element.Methods.addClassName.curry(element))
    },

    removeClassNames: function(element, names) {
      names.each(Element.Methods.removeClassName.curry(element))
    },

    toggleClassNames: function(element, names) {
      names.each(Element.Methods.toggleClassName.curry(element))
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
})(Prototype.$)
