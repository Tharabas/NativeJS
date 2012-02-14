Prototype.$ = function $(element) {
  if (arguments.length > 1) {
    return $A(arguments).map(function(e) { return Prototype.$(e) })
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}
if (Object.isUndefined(window.$)) {
  window.$ = Prototype.$
}

(function($) {
  if (Prototype.BrowserFeatures.XPath) {
    document._getElementsByXPath = function(expression, parentElement) {
      var results = [];
      var query = document.evaluate(expression, $(parentElement) || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0, length = query.snapshotLength; i < length; i++)
        results.push(Element.extend(query.snapshotItem(i)));
      return results;
    };
  }

  /*--------------------------------------------------------------------------*/

  if (!Node) var Node = window.Node = { };

  if (!Node.ELEMENT_NODE) {
    Object.extend(Node, {
      ELEMENT_NODE: 1,
      ATTRIBUTE_NODE: 2,
      TEXT_NODE: 3,
      CDATA_SECTION_NODE: 4,
      ENTITY_REFERENCE_NODE: 5,
      ENTITY_NODE: 6,
      PROCESSING_INSTRUCTION_NODE: 7,
      COMMENT_NODE: 8,
      DOCUMENT_NODE: 9,
      DOCUMENT_TYPE_NODE: 10,
      DOCUMENT_FRAGMENT_NODE: 11,
      NOTATION_NODE: 12
    });
  }



  (function(global) {
    function shouldUseCache(tagName, attributes) {
      if (tagName === 'select') return false;
      if ('type' in attributes) return false;
      return true;
    }

    var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function(){
      try {
        var el = document.createElement('<input name="x">');
        return el.tagName.toLowerCase() === 'input' && el.name === 'x';
      }
      catch(err) {
        return false;
      }
    })();

    var element = global.Element;

    global.Element = function(tagName, attributes) {
      attributes = attributes || { };
      tagName = tagName.toLowerCase();
      var cache = Element.cache;

      if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
        tagName = '<' + tagName + ' name="' + attributes.name + '">';
        delete attributes.name;
        return Element.writeAttribute(document.createElement(tagName), attributes);
      }

      if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));

      var node = shouldUseCache(tagName, attributes) ?
       cache[tagName].cloneNode(false) : document.createElement(tagName);

      return Element.writeAttribute(node, attributes);
    };

    Object.extend(global.Element, element || { });
    if (element) global.Element.prototype = element.prototype;

  })(this);

  Element.idCounter = 1;
  Element.cache = { };

  Element._purgeElement = function(element) {
    var uid = element._prototypeUID;
    if (uid) {
      Element.stopObserving(element);
      element._prototypeUID = void 0;
      delete Element.Storage[uid];
    }
  }

  Element.Methods = {
    visible: function(element) {
      return $(element).style.display != 'none';
    },

    toggle: function(element) {
      element = $(element);
      Element[Element.visible(element) ? 'hide' : 'show'](element);
      return element;
    },

    hide: function(element) {
      element = $(element);
      element.style.display = 'none';
      return element;
    },

    show: function(element) {
      element = $(element);
      element.style.display = '';
      return element;
    },

    remove: function(element) {
      element = $(element);
      element.parentNode.removeChild(element);
      return element;
    },

    update: (function(){

      var SELECT_ELEMENT_INNERHTML_BUGGY = (function(){
        var el = document.createElement("select"),
            isBuggy = true;
        el.innerHTML = "<option value=\"test\">test</option>";
        if (el.options && el.options[0]) {
          isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
        }
        el = null;
        return isBuggy;
      })();

      var TABLE_ELEMENT_INNERHTML_BUGGY = (function(){
        try {
          var el = document.createElement("table");
          if (el && el.tBodies) {
            el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
            var isBuggy = typeof el.tBodies[0] == "undefined";
            el = null;
            return isBuggy;
          }
        } catch (e) {
          return true;
        }
      })();

      var LINK_ELEMENT_INNERHTML_BUGGY = (function() {
        try {
          var el = document.createElement('div');
          el.innerHTML = "<link>";
          var isBuggy = (el.childNodes.length === 0);
          el = null;
          return isBuggy;
        } catch(e) {
          return true;
        }
      })();

      var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY ||
       TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY;

      var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
        var s = document.createElement("script"),
            isBuggy = false;
        try {
          s.appendChild(document.createTextNode(""));
          isBuggy = !s.firstChild ||
            s.firstChild && s.firstChild.nodeType !== 3;
        } catch (e) {
          isBuggy = true;
        }
        s = null;
        return isBuggy;
      })();


      function update(element, content) {
        element = $(element);
        var purgeElement = Element._purgeElement;

        var descendants = element.getElementsByTagName('*'),
         i = descendants.length;
        while (i--) purgeElement(descendants[i]);

        if (content && content.toElement)
          content = content.toElement();

        if (Object.isElement(content))
          return element.update().insert(content);

        content = Object.toHTML(content);

        var tagName = element.tagName.toUpperCase();

        if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
          element.text = content;
          return element;
        }

        if (ANY_INNERHTML_BUGGY) {
          if (tagName in Element._insertionTranslations.tags) {
            while (element.firstChild) {
              element.removeChild(element.firstChild);
            }
            Element._getContentFromAnonymousElement(tagName, content.stripScripts())
              .each(function(node) {
                element.appendChild(node)
              });
          } else if (LINK_ELEMENT_INNERHTML_BUGGY && Object.isString(content) && content.indexOf('<link') > -1) {
            while (element.firstChild) {
              element.removeChild(element.firstChild);
            }
            var nodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts(), true);
            nodes.each(function(node) { element.appendChild(node) });
          }
          else {
            element.innerHTML = content.stripScripts();
          }
        }
        else {
          element.innerHTML = content.stripScripts();
        }

        content.evalScripts.bind(content).defer();
        return element;
      }

      return update;
    })(),

    replace: function(element, content) {
      element = $(element);
      if (content && content.toElement) content = content.toElement();
      else if (!Object.isElement(content)) {
        content = Object.toHTML(content);
        var range = element.ownerDocument.createRange();
        range.selectNode(element);
        content.evalScripts.bind(content).defer();
        content = range.createContextualFragment(content.stripScripts());
      }
      element.parentNode.replaceChild(content, element);
      return element;
    },

    insert: function(element, insertions) {
      element = $(element);

      if (Object.isString(insertions) || Object.isNumber(insertions) ||
          Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
            insertions = {bottom:insertions};

      var content, insert, tagName, childNodes;

      for (var position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insert = Element._insertionTranslations[position];

        if (content && content.toElement) content = content.toElement();
        if (Object.isElement(content)) {
          insert(element, content);
          continue;
        }

        content = Object.toHTML(content);

        tagName = ((position == 'before' || position == 'after')
          ? element.parentNode : element).tagName.toUpperCase();

        childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

        if (position == 'top' || position == 'after') childNodes.reverse();
        childNodes.each(insert.curry(element));

        content.evalScripts.bind(content).defer();
      }

      return element;
    },

    wrap: function(element, wrapper, attributes) {
      element = $(element);
      if (Object.isElement(wrapper))
        $(wrapper).writeAttribute(attributes || { });
      else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
      else wrapper = new Element('div', wrapper);
      if (element.parentNode)
        element.parentNode.replaceChild(wrapper, element);
      wrapper.appendChild(element);
      return wrapper;
    },

    inspect: function(element) {
      element = $(element);
      var result = '<' + element.tagName.toLowerCase();
      $H({'id': 'id', 'className': 'class'}).each(function(pair) {
        var property = pair.first(),
            attribute = pair.last(),
            value = (element[property] || '').toString();
        if (value) result += ' ' + attribute + '=' + value.inspect(true);
      });
      return result + '>';
    },

    recursivelyCollect: function(element, property, maximumLength) {
      element = $(element);
      maximumLength = maximumLength || -1;
      var elements = [];

      while (element = element[property]) {
        if (element.nodeType == 1)
          elements.push(Element.extend(element));
        if (elements.length == maximumLength)
          break;
      }

      return elements;
    },

    ancestors: function(element) {
      return Element.recursivelyCollect(element, 'parentNode');
    },

    descendants: function(element) {
      return Element.select(element, "*");
    },

    firstDescendant: function(element) {
      element = $(element).firstChild;
      while (element && element.nodeType != 1) element = element.nextSibling;
      return $(element);
    },

    immediateDescendants: function(element) {
      var results = [], child = $(element).firstChild;
      while (child) {
        if (child.nodeType === 1) {
          results.push(Element.extend(child));
        }
        child = child.nextSibling;
      }
      return results;
    },

    previousSiblings: function(element, maximumLength) {
      return Element.recursivelyCollect(element, 'previousSibling');
    },

    nextSiblings: function(element) {
      return Element.recursivelyCollect(element, 'nextSibling');
    },

    siblings: function(element) {
      element = $(element);
      return Element.previousSiblings(element).reverse()
        .concat(Element.nextSiblings(element));
    },

    match: function(element, selector) {
      element = $(element);
      if (Object.isString(selector))
        return Prototype.Selector.match(element, selector);
      return selector.match(element);
    },

    up: function(element, expression, index) {
      element = $(element);
      if (arguments.length == 1) return $(element.parentNode);
      var ancestors = Element.ancestors(element);
      return Object.isNumber(expression) ? ancestors[expression] :
        Prototype.Selector.find(ancestors, expression, index);
    },

    down: function(element, expression, index) {
      element = $(element);
      if (arguments.length == 1) return Element.firstDescendant(element);
      return Object.isNumber(expression) ? Element.descendants(element)[expression] :
        Element.select(element, expression)[index || 0];
    },

    previous: function(element, expression, index) {
      element = $(element);
      if (Object.isNumber(expression)) index = expression, expression = false;
      if (!Object.isNumber(index)) index = 0;

      if (expression) {
        return Prototype.Selector.find(element.previousSiblings(), expression, index);
      } else {
        return element.recursivelyCollect("previousSibling", index + 1)[index];
      }
    },

    next: function(element, expression, index) {
      element = $(element);
      if (Object.isNumber(expression)) index = expression, expression = false;
      if (!Object.isNumber(index)) index = 0;

      if (expression) {
        return Prototype.Selector.find(element.nextSiblings(), expression, index);
      } else {
        var maximumLength = Object.isNumber(index) ? index + 1 : 1;
        return element.recursivelyCollect("nextSibling", index + 1)[index];
      }
    },


    select: function(element) {
      element = $(element);
      var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
      return Prototype.Selector.select(expressions, element);
    },

    adjacent: function(element) {
      element = $(element);
      var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
      return Prototype.Selector.select(expressions, element.parentNode).without(element);
    },

    identify: function(element) {
      element = $(element);
      var id = Element.readAttribute(element, 'id');
      if (id) return id;
      do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
      Element.writeAttribute(element, 'id', id);
      return id;
    },

    readAttribute: function(element, name) {
      element = $(element);
      if (Prototype.Browser.IE) {
        var t = Element._attributeTranslations.read;
        if (t.values[name]) return t.values[name](element, name);
        if (t.names[name]) name = t.names[name];
        if (name.include(':')) {
          return (!element.attributes || !element.attributes[name]) ? null :
           element.attributes[name].value;
        }
      }
      return element.getAttribute(name);
    },

    writeAttribute: function(element, name, value) {
      element = $(element);
      var attributes = { }, t = Element._attributeTranslations.write;

      if (typeof name == 'object') attributes = name;
      else attributes[name] = Object.isUndefined(value) ? true : value;

      for (var attr in attributes) {
        name = t.names[attr] || attr;
        value = attributes[attr];
        if (t.values[attr]) name = t.values[attr](element, value);
        if (value === false || value === null)
          element.removeAttribute(name);
        else if (value === true)
          element.setAttribute(name, name);
        else element.setAttribute(name, value);
      }
      return element;
    },

    getHeight: function(element) {
      return Element.getDimensions(element).height;
    },

    getWidth: function(element) {
      return Element.getDimensions(element).width;
    },

    classNames: function(element) {
      return new Element.ClassNames(element);
    },

    hasClassName: function(element, className) {
      if (!(element = $(element))) return;
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName == className ||
        new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },

    addClassName: function(element, className) {
      if (!(element = $(element))) return;
      if (!Element.hasClassName(element, className))
        element.className += (element.className ? ' ' : '') + className;
      return element;
    },

    removeClassName: function(element, className) {
      if (!(element = $(element))) return;
      element.className = element.className.replace(
        new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
      return element;
    },

    toggleClassName: function(element, className) {
      if (!(element = $(element))) return;
      return Element[Element.hasClassName(element, className) ?
        'removeClassName' : 'addClassName'](element, className);
    },

    cleanWhitespace: function(element) {
      element = $(element);
      var node = element.firstChild;
      while (node) {
        var nextNode = node.nextSibling;
        if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
          element.removeChild(node);
        node = nextNode;
      }
      return element;
    },

    empty: function(element) {
      return $(element).innerHTML.blank();
    },

    descendantOf: function(element, ancestor) {
      element = $(element), ancestor = $(ancestor);

      if (element.compareDocumentPosition)
        return (element.compareDocumentPosition(ancestor) & 8) === 8;

      if (ancestor.contains)
        return ancestor.contains(element) && ancestor !== element;

      while (element = element.parentNode)
        if (element == ancestor) return true;

      return false;
    },

    scrollTo: function(element) {
      element = $(element);
      var pos = Element.cumulativeOffset(element);
      window.scrollTo(pos[0], pos[1]);
      return element;
    },

    getStyle: function(element, style) {
      element = $(element);
      style = style == 'float' ? 'cssFloat' : style.camelize();
      var value = element.style[style];
      if (!value || value == 'auto') {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css[style] : null;
      }
      if (style == 'opacity') return value ? parseFloat(value) : 1.0;
      return value == 'auto' ? null : value;
    },

    getOpacity: function(element) {
      return $(element).getStyle('opacity');
    },

    setStyle: function(element, styles) {
      element = $(element);
      var elementStyle = element.style, match;
      if (Object.isString(styles)) {
        element.style.cssText += ';' + styles;
        return styles.include('opacity') ?
          element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
      }
      for (var property in styles)
        if (property == 'opacity') element.setOpacity(styles[property]);
        else
          elementStyle[(property == 'float' || property == 'cssFloat') ?
            (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
              property] = styles[property];

      return element;
    },

    setOpacity: function(element, value) {
      element = $(element);
      element.style.opacity = (value == 1 || value === '') ? '' :
        (value < 0.00001) ? 0 : value;
      return element;
    },

    makePositioned: function(element) {
      element = $(element);
      var pos = Element.getStyle(element, 'position');
      if (pos == 'static' || !pos) {
        element._madePositioned = true;
        element.style.position = 'relative';
        if (Prototype.Browser.Opera) {
          element.style.top = 0;
          element.style.left = 0;
        }
      }
      return element;
    },

    undoPositioned: function(element) {
      element = $(element);
      if (element._madePositioned) {
        element._madePositioned = undefined;
        element.style.position =
          element.style.top =
          element.style.left =
          element.style.bottom =
          element.style.right = '';
      }
      return element;
    },

    makeClipping: function(element) {
      element = $(element);
      if (element._overflow) return element;
      element._overflow = Element.getStyle(element, 'overflow') || 'auto';
      if (element._overflow !== 'hidden')
        element.style.overflow = 'hidden';
      return element;
    },

    undoClipping: function(element) {
      element = $(element);
      if (!element._overflow) return element;
      element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
      element._overflow = null;
      return element;
    },

    clonePosition: function(element, source) {
      var options = Object.extend({
        setLeft:    true,
        setTop:     true,
        setWidth:   true,
        setHeight:  true,
        offsetTop:  0,
        offsetLeft: 0
      }, arguments[2] || { });

      source = $(source);
      var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

      element = $(element);

      if (Element.getStyle(element, 'position') == 'absolute') {
        parent = Element.getOffsetParent(element);
        delta = Element.viewportOffset(parent);
      }

      if (parent == document.body) {
        delta[0] -= document.body.offsetLeft;
        delta[1] -= document.body.offsetTop;
      }

      if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
      if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
      if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
      if (options.setHeight) element.style.height = source.offsetHeight + 'px';
      return element;
    }
  };

  Object.extend(Element.Methods, {
    getElementsBySelector: Element.Methods.select,

    childElements: Element.Methods.immediateDescendants
  });

  Element._attributeTranslations = {
    write: {
      names: {
        className: 'class',
        htmlFor:   'for'
      },
      values: { }
    }
  };

  if (Prototype.Browser.Opera) {
    Element.Methods.getStyle = Element.Methods.getStyle.wrap(
      function(proceed, element, style) {
        switch (style) {
          case 'height': case 'width':
            if (!Element.visible(element)) return null;

            var dim = parseInt(proceed(element, style), 10);

            if (dim !== element['offset' + style.capitalize()])
              return dim + 'px';

            var properties;
            if (style === 'height') {
              properties = ['border-top-width', 'padding-top',
               'padding-bottom', 'border-bottom-width'];
            }
            else {
              properties = ['border-left-width', 'padding-left',
               'padding-right', 'border-right-width'];
            }
            return properties.inject(dim, function(memo, property) {
              var val = proceed(element, property);
              return val === null ? memo : memo - parseInt(val, 10);
            }) + 'px';
          default: return proceed(element, style);
        }
      }
    );

    Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
      function(proceed, element, attribute) {
        if (attribute === 'title') return element.title;
        return proceed(element, attribute);
      }
    );
  }

  else if (Prototype.Browser.IE) {
    Element.Methods.getStyle = function(element, style) {
      element = $(element);
      style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
      var value = element.style[style];
      if (!value && element.currentStyle) value = element.currentStyle[style];

      if (style == 'opacity') {
        if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
          if (value[1]) return parseFloat(value[1]) / 100;
        return 1.0;
      }

      if (value == 'auto') {
        if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
          return element['offset' + style.capitalize()] + 'px';
        return null;
      }
      return value;
    };

    Element.Methods.setOpacity = function(element, value) {
      function stripAlpha(filter){
        return filter.replace(/alpha\([^\)]*\)/gi,'');
      }
      element = $(element);
      var currentStyle = element.currentStyle;
      if ((currentStyle && !currentStyle.hasLayout) ||
        (!currentStyle && element.style.zoom == 'normal'))
          element.style.zoom = 1;

      var filter = element.getStyle('filter'), style = element.style;
      if (value == 1 || value === '') {
        (filter = stripAlpha(filter)) ?
          style.filter = filter : style.removeAttribute('filter');
        return element;
      } else if (value < 0.00001) value = 0;
      style.filter = stripAlpha(filter) +
        'alpha(opacity=' + (value * 100) + ')';
      return element;
    };

    Element._attributeTranslations = (function(){

      var classProp = 'className',
          forProp = 'for',
          el = document.createElement('div');

      el.setAttribute(classProp, 'x');

      if (el.className !== 'x') {
        el.setAttribute('class', 'x');
        if (el.className === 'x') {
          classProp = 'class';
        }
      }
      el = null;

      el = document.createElement('label');
      el.setAttribute(forProp, 'x');
      if (el.htmlFor !== 'x') {
        el.setAttribute('htmlFor', 'x');
        if (el.htmlFor === 'x') {
          forProp = 'htmlFor';
        }
      }
      el = null;

      return {
        read: {
          names: {
            'class':      classProp,
            'className':  classProp,
            'for':        forProp,
            'htmlFor':    forProp
          },
          values: {
            _getAttr: function(element, attribute) {
              return element.getAttribute(attribute);
            },
            _getAttr2: function(element, attribute) {
              return element.getAttribute(attribute, 2);
            },
            _getAttrNode: function(element, attribute) {
              var node = element.getAttributeNode(attribute);
              return node ? node.value : "";
            },
            _getEv: (function(){

              var el = document.createElement('div'), f;
              el.onclick = Prototype.emptyFunction;
              var value = el.getAttribute('onclick');

              if (String(value).indexOf('{') > -1) {
                f = function(element, attribute) {
                  attribute = element.getAttribute(attribute);
                  if (!attribute) return null;
                  attribute = attribute.toString();
                  attribute = attribute.split('{')[1];
                  attribute = attribute.split('}')[0];
                  return attribute.strip();
                };
              }
              else if (value === '') {
                f = function(element, attribute) {
                  attribute = element.getAttribute(attribute);
                  if (!attribute) return null;
                  return attribute.strip();
                };
              }
              el = null;
              return f;
            })(),
            _flag: function(element, attribute) {
              return $(element).hasAttribute(attribute) ? attribute : null;
            },
            style: function(element) {
              return element.style.cssText.toLowerCase();
            },
            title: function(element) {
              return element.title;
            }
          }
        }
      }
    })();

    Element._attributeTranslations.write = {
      names: Object.extend({
        cellpadding: 'cellPadding',
        cellspacing: 'cellSpacing'
      }, Element._attributeTranslations.read.names),
      values: {
        checked: function(element, value) {
          element.checked = !!value;
        },

        style: function(element, value) {
          element.style.cssText = value ? value : '';
        }
      }
    };

    Element._attributeTranslations.has = {};

    $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
        'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
      Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
      Element._attributeTranslations.has[attr.toLowerCase()] = attr;
    });

    (function(v) {
      Object.extend(v, {
        href:        v._getAttr2,
        src:         v._getAttr2,
        type:        v._getAttr,
        action:      v._getAttrNode,
        disabled:    v._flag,
        checked:     v._flag,
        readonly:    v._flag,
        multiple:    v._flag,
        onload:      v._getEv,
        onunload:    v._getEv,
        onclick:     v._getEv,
        ondblclick:  v._getEv,
        onmousedown: v._getEv,
        onmouseup:   v._getEv,
        onmouseover: v._getEv,
        onmousemove: v._getEv,
        onmouseout:  v._getEv,
        onfocus:     v._getEv,
        onblur:      v._getEv,
        onkeypress:  v._getEv,
        onkeydown:   v._getEv,
        onkeyup:     v._getEv,
        onsubmit:    v._getEv,
        onreset:     v._getEv,
        onselect:    v._getEv,
        onchange:    v._getEv
      });
    })(Element._attributeTranslations.read.values);

    if (Prototype.BrowserFeatures.ElementExtensions) {
      (function() {
        function _descendants(element) {
          var nodes = element.getElementsByTagName('*'), results = [];
          for (var i = 0, node; node = nodes[i]; i++)
            if (node.tagName !== "!") // Filter out comment nodes.
              results.push(node);
          return results;
        }

        Element.Methods.down = function(element, expression, index) {
          element = $(element);
          if (arguments.length == 1) return element.firstDescendant();
          return Object.isNumber(expression) ? _descendants(element)[expression] :
            Element.select(element, expression)[index || 0];
        }
      })();
    }

  }

  else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
    Element.Methods.setOpacity = function(element, value) {
      element = $(element);
      element.style.opacity = (value == 1) ? 0.999999 :
        (value === '') ? '' : (value < 0.00001) ? 0 : value;
      return element;
    };
  }

  else if (Prototype.Browser.WebKit) {
    Element.Methods.setOpacity = function(element, value) {
      element = $(element);
      element.style.opacity = (value == 1 || value === '') ? '' :
        (value < 0.00001) ? 0 : value;

      if (value == 1)
        if (element.tagName.toUpperCase() == 'IMG' && element.width) {
          element.width++; element.width--;
        } else try {
          var n = document.createTextNode(' ');
          element.appendChild(n);
          element.removeChild(n);
        } catch (e) { }

      return element;
    };
  }

  if ('outerHTML' in document.documentElement) {
    Element.Methods.replace = function(element, content) {
      element = $(element);

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        element.parentNode.replaceChild(content, element);
        return element;
      }

      content = Object.toHTML(content);
      var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

      if (Element._insertionTranslations.tags[tagName]) {
        var nextSibling = element.next(),
            fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
        parent.removeChild(element);
        if (nextSibling)
          fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
        else
          fragments.each(function(node) { parent.appendChild(node) });
      }
      else element.outerHTML = content.stripScripts();

      content.evalScripts.bind(content).defer();
      return element;
    };
  }

  Element._returnOffset = function(l, t) {
    var result = [l, t];
    result.left = l;
    result.top = t;
    return result;
  };

  Element._getContentFromAnonymousElement = function(tagName, html, force) {
    var div = new Element('div'),
        t = Element._insertionTranslations.tags[tagName];

    var workaround = false;
    if (t) workaround = true;
    else if (force) {
      workaround = true;
      t = ['', '', 0];
    }

    if (workaround) {
      div.innerHTML = '&nbsp;' + t[0] + html + t[1];
      div.removeChild(div.firstChild);
      for (var i = t[2]; i--; ) {
        div = div.firstChild;
      }
    }
    else {
      div.innerHTML = html;
    }
    return $A(div.childNodes);
  };

  Element._insertionTranslations = {
    before: function(element, node) {
      element.parentNode.insertBefore(node, element);
    },
    top: function(element, node) {
      element.insertBefore(node, element.firstChild);
    },
    bottom: function(element, node) {
      element.appendChild(node);
    },
    after: function(element, node) {
      element.parentNode.insertBefore(node, element.nextSibling);
    },
    tags: {
      TABLE:  ['<table>',                '</table>',                   1],
      TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
      TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
      TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
      SELECT: ['<select>',               '</select>',                  1]
    }
  };

  (function() {
    var tags = Element._insertionTranslations.tags;
    Object.extend(tags, {
      THEAD: tags.TBODY,
      TFOOT: tags.TBODY,
      TH:    tags.TD
    });
  })();

  Element.Methods.Simulated = {
    hasAttribute: function(element, attribute) {
      attribute = Element._attributeTranslations.has[attribute] || attribute;
      var node = $(element).getAttributeNode(attribute);
      return !!(node && node.specified);
    }
  };

  Element.Methods.ByTag = { };

  Object.extend(Element, Element.Methods);

  (function(div) {

    if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
      window.HTMLElement = { };
      window.HTMLElement.prototype = div['__proto__'];
      Prototype.BrowserFeatures.ElementExtensions = true;
    }

    div = null;

  })(document.createElement('div'));

  Element.extend = (function() {

    function checkDeficiency(tagName) {
      if (typeof window.Element != 'undefined') {
        var proto = window.Element.prototype;
        if (proto) {
          var id = '_' + (Math.random()+'').slice(2),
              el = document.createElement(tagName);
          proto[id] = 'x';
          var isBuggy = (el[id] !== 'x');
          delete proto[id];
          el = null;
          return isBuggy;
        }
      }
      return false;
    }

    function extendElementWith(element, methods) {
      for (var property in methods) {
        var value = methods[property];
        if (Object.isFunction(value) && !(property in element))
          element[property] = value.methodize();
      }
    }

    var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

    if (Prototype.BrowserFeatures.SpecificElementExtensions) {
      if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
        return function(element) {
          if (element && typeof element._extendedByPrototype == 'undefined') {
            var t = element.tagName;
            if (t && (/^(?:object|applet|embed)$/i.test(t))) {
              extendElementWith(element, Element.Methods);
              extendElementWith(element, Element.Methods.Simulated);
              extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
            }
          }
          return element;
        }
      }
      return Prototype.K;
    }

    var Methods = { }, ByTag = Element.Methods.ByTag;

    var extend = Object.extend(function(element) {
      if (!element || typeof element._extendedByPrototype != 'undefined' ||
          element.nodeType != 1 || element == window) return element;

      var methods = Object.clone(Methods),
          tagName = element.tagName.toUpperCase();

      if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

      extendElementWith(element, methods);

      element._extendedByPrototype = Prototype.emptyFunction;
      return element;

    }, {
      refresh: function() {
        if (!Prototype.BrowserFeatures.ElementExtensions) {
          Object.extend(Methods, Element.Methods);
          Object.extend(Methods, Element.Methods.Simulated);
        }
      }
    });

    extend.refresh();
    return extend;
  })();

  if (document.documentElement.hasAttribute) {
    Element.hasAttribute = function(element, attribute) {
      return element.hasAttribute(attribute);
    };
  }
  else {
    Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
  }

  Element.addMethods = function(methods) {
    var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

    if (!methods) {
      Object.extend(Form, Form.Methods);
      Object.extend(Form.Element, Form.Element.Methods);
      Object.extend(Element.Methods.ByTag, {
        "FORM":     Object.clone(Form.Methods),
        "INPUT":    Object.clone(Form.Element.Methods),
        "SELECT":   Object.clone(Form.Element.Methods),
        "TEXTAREA": Object.clone(Form.Element.Methods),
        "BUTTON":   Object.clone(Form.Element.Methods)
      });
    }

    if (arguments.length == 2) {
      var tagName = methods;
      methods = arguments[1];
    }

    if (!tagName) Object.extend(Element.Methods, methods || { });
    else {
      if (Object.isArray(tagName)) tagName.each(extend);
      else extend(tagName);
    }

    function extend(tagName) {
      tagName = tagName.toUpperCase();
      if (!Element.Methods.ByTag[tagName])
        Element.Methods.ByTag[tagName] = { };
      Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function copy(methods, destination, onlyIfAbsent) {
      onlyIfAbsent = onlyIfAbsent || false;
      for (var property in methods) {
        var value = methods[property];
        if (!Object.isFunction(value)) continue;
        if (!onlyIfAbsent || !(property in destination))
          destination[property] = value.methodize();
      }
    }

    function findDOMClass(tagName) {
      var klass;
      var trans = {
        "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
        "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
        "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
        "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
        "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
        "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
        "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
        "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
        "FrameSet", "IFRAME": "IFrame"
      };
      if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
      if (window[klass]) return window[klass];
      klass = 'HTML' + tagName + 'Element';
      if (window[klass]) return window[klass];
      klass = 'HTML' + tagName.capitalize() + 'Element';
      if (window[klass]) return window[klass];

      var element = document.createElement(tagName),
          proto = element['__proto__'] || element.constructor.prototype;

      element = null;
      return proto;
    }

    var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
     Element.prototype;

    if (F.ElementExtensions) {
      copy(Element.Methods, elementPrototype);
      copy(Element.Methods.Simulated, elementPrototype, true);
    }

    if (F.SpecificElementExtensions) {
      for (var tag in Element.Methods.ByTag) {
        var klass = findDOMClass(tag);
        if (Object.isUndefined(klass)) continue;
        copy(T[tag], klass.prototype);
      }
    }

    Object.extend(Element, Element.Methods);
    delete Element.ByTag;

    if (Element.extend.refresh) Element.extend.refresh();
    Element.cache = { };
  };


  document.viewport = {

    getDimensions: function() {
      return { width: this.getWidth(), height: this.getHeight() };
    },

    getScrollOffsets: function() {
      return Element._returnOffset(
        window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
        window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop);
    }
  };

  (function(viewport) {
    var B = Prototype.Browser, doc = document, element, property = {};

    function getRootElement() {
      if (B.WebKit && !doc.evaluate)
        return document;

      if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
        return document.body;

      return document.documentElement;
    }

    function define(D) {
      if (!element) element = getRootElement();

      property[D] = 'client' + D;

      viewport['get' + D] = function() { return element[property[D]] };
      return viewport['get' + D]();
    }

    viewport.getWidth  = define.curry('Width');

    viewport.getHeight = define.curry('Height');
  })(document.viewport);


  Element.Storage = {
    UID: 1
  };

  Element.addMethods({
    getStorage: function(element) {
      if (!(element = $(element))) return;

      var uid;
      if (element === window) {
        uid = 0;
      } else {
        if (typeof element._prototypeUID === "undefined")
          element._prototypeUID = Element.Storage.UID++;
        uid = element._prototypeUID;
      }

      if (!Element.Storage[uid])
        Element.Storage[uid] = $H();

      return Element.Storage[uid];
    },

    store: function(element, key, value) {
      if (!(element = $(element))) return;

      if (arguments.length === 2) {
        Element.getStorage(element).update(key);
      } else {
        Element.getStorage(element).set(key, value);
      }

      return element;
    },

    retrieve: function(element, key, defaultValue) {
      if (!(element = $(element))) return;
      var hash = Element.getStorage(element), value = hash.get(key);

      if (Object.isUndefined(value)) {
        hash.set(key, defaultValue);
        value = defaultValue;
      }

      return value;
    },

    clone: function(element, deep) {
      if (!(element = $(element))) return;
      var clone = element.cloneNode(deep);
      clone._prototypeUID = void 0;
      if (deep) {
        var descendants = Element.select(clone, '*'),
            i = descendants.length;
        while (i--) {
          descendants[i]._prototypeUID = void 0;
        }
      }
      return Element.extend(clone);
    },

    purge: function(element) {
      if (!(element = $(element))) return;
      var purgeElement = Element._purgeElement;

      purgeElement(element);

      var descendants = element.getElementsByTagName('*'),
       i = descendants.length;

      while (i--) purgeElement(descendants[i]);

      return null;
    }
  });

  (function() {

    function toDecimal(pctString) {
      var match = pctString.match(/^(\d+)%?$/i);
      if (!match) return null;
      return (Number(match[1]) / 100);
    }

    function getPixelValue(value, property, context) {
      var element = null;
      if (Object.isElement(value)) {
        element = value;
        value = element.getStyle(property);
      }

      if (value === null) {
        return null;
      }

      if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
        return window.parseFloat(value);
      }

      var isPercentage = value.include('%'), isViewport = (context === document.viewport);

      if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
        var style = element.style.left, rStyle = element.runtimeStyle.left;
        element.runtimeStyle.left = element.currentStyle.left;
        element.style.left = value || 0;
        value = element.style.pixelLeft;
        element.style.left = style;
        element.runtimeStyle.left = rStyle;

        return value;
      }

      if (element && isPercentage) {
        context = context || element.parentNode;
        var decimal = toDecimal(value);
        var whole = null;
        var position = element.getStyle('position');

        var isHorizontal = property.include('left') || property.include('right') ||
         property.include('width');

        var isVertical =  property.include('top') || property.include('bottom') ||
          property.include('height');

        if (context === document.viewport) {
          if (isHorizontal) {
            whole = document.viewport.getWidth();
          } else if (isVertical) {
            whole = document.viewport.getHeight();
          }
        } else {
          if (isHorizontal) {
            whole = $(context).measure('width');
          } else if (isVertical) {
            whole = $(context).measure('height');
          }
        }

        return (whole === null) ? 0 : whole * decimal;
      }

      return 0;
    }

    function toCSSPixels(number) {
      if (Object.isString(number) && number.endsWith('px')) {
        return number;
      }
      return number + 'px';
    }

    function isDisplayed(element) {
      var originalElement = element;
      while (element && element.parentNode) {
        var display = element.getStyle('display');
        if (display === 'none') {
          return false;
        }
        element = $(element.parentNode);
      }
      return true;
    }

    var hasLayout = Prototype.K;
    if ('currentStyle' in document.documentElement) {
      hasLayout = function(element) {
        if (!element.currentStyle.hasLayout) {
          element.style.zoom = 1;
        }
        return element;
      };
    }

    function cssNameFor(key) {
      if (key.include('border')) key = key + '-width';
      return key.camelize();
    }

    Element.Layout = Class.create(Hash, {
      initialize: function ElementLayout($super, element, preCompute) {
        $super();
        this.element = $(element);

        Element.Layout.PROPERTIES.each( function(property) {
          this._set(property, null);
        }, this);

        if (preCompute) {
          this._preComputing = true;
          this._begin();
          Element.Layout.PROPERTIES.each( this._compute, this );
          this._end();
          this._preComputing = false;
        }
      },

      _set: function(property, value) {
        return Hash.prototype.set.call(this, property, value);
      },

      set: function(property, value) {
        throw "Properties of Element.Layout are read-only.";
      },

      get: function($super, property) {
        var value = $super(property);
        return value === null ? this._compute(property) : value;
      },

      _begin: function() {
        if (this._prepared) return;

        var element = this.element;
        if (isDisplayed(element)) {
          this._prepared = true;
          return;
        }

        var originalStyles = {
          position:   element.style.position   || '',
          width:      element.style.width      || '',
          visibility: element.style.visibility || '',
          display:    element.style.display    || ''
        };

        element.store('prototype_original_styles', originalStyles);

        var position = element.getStyle('position'),
         width = element.getStyle('width');

        if (width === "0px" || width === null) {
          element.style.display = 'block';
          width = element.getStyle('width');
        }

        var context = (position === 'fixed') ? document.viewport :
         element.parentNode;

        element.setStyle({
          position:   'absolute',
          visibility: 'hidden',
          display:    'block'
        });

        var positionedWidth = element.getStyle('width');

        var newWidth;
        if (width && (positionedWidth === width)) {
          newWidth = getPixelValue(element, 'width', context);
        } else if (position === 'absolute' || position === 'fixed') {
          newWidth = getPixelValue(element, 'width', context);
        } else {
          var parent = element.parentNode, pLayout = $(parent).getLayout();

          newWidth = pLayout.get('width') -
           this.get('margin-left') -
           this.get('border-left') -
           this.get('padding-left') -
           this.get('padding-right') -
           this.get('border-right') -
           this.get('margin-right');
        }

        element.setStyle({ width: newWidth + 'px' });

        this._prepared = true;
      },

      _end: function() {
        var element = this.element;
        var originalStyles = element.retrieve('prototype_original_styles');
        element.store('prototype_original_styles', null);
        element.setStyle(originalStyles);
        this._prepared = false;
      },

      _compute: function(property) {
        var COMPUTATIONS = Element.Layout.COMPUTATIONS;
        if (!(property in COMPUTATIONS)) {
          throw "Property not found.";
        }

        return this._set(property, COMPUTATIONS[property].call(this, this.element));
      },

      toObject: function() {
        var args = $A(arguments);
        var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
         args.join(' ').split(' ');
        var obj = {};
        keys.each( function(key) {
          if (!Element.Layout.PROPERTIES.include(key)) return;
          var value = this.get(key);
          if (value != null) obj[key] = value;
        }, this);
        return obj;
      },

      toHash: function() {
        var obj = this.toObject.apply(this, arguments);
        return new Hash(obj);
      },

      toCSS: function() {
        var args = $A(arguments);
        var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
         args.join(' ').split(' ');
        var css = {};

        keys.each( function(key) {
          if (!Element.Layout.PROPERTIES.include(key)) return;
          if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;

          var value = this.get(key);
          if (value != null) css[cssNameFor(key)] = value + 'px';
        }, this);
        return css;
      },

      inspect: function() {
        return "#<Element.Layout>";
      }
    });

    Object.extend(Element.Layout, {
      PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height'),

      COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),

      COMPUTATIONS: {
        'height': function(element) {
          if (!this._preComputing) this._begin();

          var bHeight = this.get('border-box-height');
          if (bHeight <= 0) {
            if (!this._preComputing) this._end();
            return 0;
          }

          var bTop = this.get('border-top'),
           bBottom = this.get('border-bottom');

          var pTop = this.get('padding-top'),
           pBottom = this.get('padding-bottom');

          if (!this._preComputing) this._end();

          return bHeight - bTop - bBottom - pTop - pBottom;
        },

        'width': function(element) {
          if (!this._preComputing) this._begin();

          var bWidth = this.get('border-box-width');
          if (bWidth <= 0) {
            if (!this._preComputing) this._end();
            return 0;
          }

          var bLeft = this.get('border-left'),
           bRight = this.get('border-right');

          var pLeft = this.get('padding-left'),
           pRight = this.get('padding-right');

          if (!this._preComputing) this._end();

          return bWidth - bLeft - bRight - pLeft - pRight;
        },

        'padding-box-height': function(element) {
          var height = this.get('height'),
           pTop = this.get('padding-top'),
           pBottom = this.get('padding-bottom');

          return height + pTop + pBottom;
        },

        'padding-box-width': function(element) {
          var width = this.get('width'),
           pLeft = this.get('padding-left'),
           pRight = this.get('padding-right');

          return width + pLeft + pRight;
        },

        'border-box-height': function(element) {
          if (!this._preComputing) this._begin();
          var height = element.offsetHeight;
          if (!this._preComputing) this._end();
          return height;
        },

        'border-box-width': function(element) {
          if (!this._preComputing) this._begin();
          var width = element.offsetWidth;
          if (!this._preComputing) this._end();
          return width;
        },

        'margin-box-height': function(element) {
          var bHeight = this.get('border-box-height'),
           mTop = this.get('margin-top'),
           mBottom = this.get('margin-bottom');

          if (bHeight <= 0) return 0;

          return bHeight + mTop + mBottom;
        },

        'margin-box-width': function(element) {
          var bWidth = this.get('border-box-width'),
           mLeft = this.get('margin-left'),
           mRight = this.get('margin-right');

          if (bWidth <= 0) return 0;

          return bWidth + mLeft + mRight;
        },

        'top': function(element) {
          var offset = element.positionedOffset();
          return offset.top;
        },

        'bottom': function(element) {
          var offset = element.positionedOffset(),
           parent = element.getOffsetParent(),
           pHeight = parent.measure('height');

          var mHeight = this.get('border-box-height');

          return pHeight - mHeight - offset.top;
        },

        'left': function(element) {
          var offset = element.positionedOffset();
          return offset.left;
        },

        'right': function(element) {
          var offset = element.positionedOffset(),
           parent = element.getOffsetParent(),
           pWidth = parent.measure('width');

          var mWidth = this.get('border-box-width');

          return pWidth - mWidth - offset.left;
        },

        'padding-top': function(element) {
          return getPixelValue(element, 'paddingTop');
        },

        'padding-bottom': function(element) {
          return getPixelValue(element, 'paddingBottom');
        },

        'padding-left': function(element) {
          return getPixelValue(element, 'paddingLeft');
        },

        'padding-right': function(element) {
          return getPixelValue(element, 'paddingRight');
        },

        'border-top': function(element) {
          return getPixelValue(element, 'borderTopWidth');
        },

        'border-bottom': function(element) {
          return getPixelValue(element, 'borderBottomWidth');
        },

        'border-left': function(element) {
          return getPixelValue(element, 'borderLeftWidth');
        },

        'border-right': function(element) {
          return getPixelValue(element, 'borderRightWidth');
        },

        'margin-top': function(element) {
          return getPixelValue(element, 'marginTop');
        },

        'margin-bottom': function(element) {
          return getPixelValue(element, 'marginBottom');
        },

        'margin-left': function(element) {
          return getPixelValue(element, 'marginLeft');
        },

        'margin-right': function(element) {
          return getPixelValue(element, 'marginRight');
        }
      }
    });

    if ('getBoundingClientRect' in document.documentElement) {
      Object.extend(Element.Layout.COMPUTATIONS, {
        'right': function(element) {
          var parent = hasLayout(element.getOffsetParent());
          var rect = element.getBoundingClientRect(),
           pRect = parent.getBoundingClientRect();

          return (pRect.right - rect.right).round();
        },

        'bottom': function(element) {
          var parent = hasLayout(element.getOffsetParent());
          var rect = element.getBoundingClientRect(),
           pRect = parent.getBoundingClientRect();

          return (pRect.bottom - rect.bottom).round();
        }
      });
    }

    Element.Offset = Class.create({
      initialize: function ElementOffset(left, top) {
        this.left = left.round();
        this.top  = top.round();

        this[0] = this.left;
        this[1] = this.top;
      },

      relativeTo: function(offset) {
        return new Element.Offset(
          this.left - offset.left,
          this.top  - offset.top
        );
      },

      inspect: function() {
        return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
      },

      toString: function() {
        return "[#{left}, #{top}]".interpolate(this);
      },

      toArray: function() {
        return [this.left, this.top];
      }
    });

    function getLayout(element, preCompute) {
      return new Element.Layout(element, preCompute);
    }

    function measure(element, property) {
      return $(element).getLayout().get(property);
    }

    function getDimensions(element) {
      element = $(element);
      var display = Element.getStyle(element, 'display');

      if (display && display !== 'none') {
        return { width: element.offsetWidth, height: element.offsetHeight };
      }

      var style = element.style;
      var originalStyles = {
        visibility: style.visibility,
        position:   style.position,
        display:    style.display
      };

      var newStyles = {
        visibility: 'hidden',
        display:    'block'
      };

      if (originalStyles.position !== 'fixed')
        newStyles.position = 'absolute';

      Element.setStyle(element, newStyles);

      var dimensions = {
        width:  element.offsetWidth,
        height: element.offsetHeight
      };

      Element.setStyle(element, originalStyles);

      return dimensions;
    }

    function getOffsetParent(element) {
      element = $(element);

      if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
        return $(document.body);

      var isInline = (Element.getStyle(element, 'display') === 'inline');
      if (!isInline && element.offsetParent) return $(element.offsetParent);

      while ((element = element.parentNode) && element !== document.body) {
        if (Element.getStyle(element, 'position') !== 'static') {
          return isHtml(element) ? $(document.body) : $(element);
        }
      }

      return $(document.body);
    }


    function cumulativeOffset(element) {
      element = $(element);
      var valueT = 0, valueL = 0;
      if (element.parentNode) {
        do {
          valueT += element.offsetTop  || 0;
          valueL += element.offsetLeft || 0;
          element = element.offsetParent;
        } while (element);
      }
      return new Element.Offset(valueL, valueT);
    }

    function positionedOffset(element) {
      element = $(element);

      var layout = element.getLayout();

      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
        if (element) {
          if (isBody(element)) break;
          var p = Element.getStyle(element, 'position');
          if (p !== 'static') break;
        }
      } while (element);

      valueL -= layout.get('margin-top');
      valueT -= layout.get('margin-left');

      return new Element.Offset(valueL, valueT);
    }

    function cumulativeScrollOffset(element) {
      var valueT = 0, valueL = 0;
      do {
        valueT += element.scrollTop  || 0;
        valueL += element.scrollLeft || 0;
        element = element.parentNode;
      } while (element);
      return new Element.Offset(valueL, valueT);
    }

    function viewportOffset(forElement) {
      element = $(element);
      var valueT = 0, valueL = 0, docBody = document.body;

      var element = forElement;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        if (element.offsetParent == docBody &&
          Element.getStyle(element, 'position') == 'absolute') break;
      } while (element = element.offsetParent);

      element = forElement;
      do {
        if (element != docBody) {
          valueT -= element.scrollTop  || 0;
          valueL -= element.scrollLeft || 0;
        }
      } while (element = element.parentNode);
      return new Element.Offset(valueL, valueT);
    }

    function absolutize(element) {
      element = $(element);

      if (Element.getStyle(element, 'position') === 'absolute') {
        return element;
      }

      var offsetParent = getOffsetParent(element);
      var eOffset = element.viewportOffset(),
       pOffset = offsetParent.viewportOffset();

      var offset = eOffset.relativeTo(pOffset);
      var layout = element.getLayout();

      element.store('prototype_absolutize_original_styles', {
        left:   element.getStyle('left'),
        top:    element.getStyle('top'),
        width:  element.getStyle('width'),
        height: element.getStyle('height')
      });

      element.setStyle({
        position: 'absolute',
        top:    offset.top + 'px',
        left:   offset.left + 'px',
        width:  layout.get('width') + 'px',
        height: layout.get('height') + 'px'
      });

      return element;
    }

    function relativize(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'relative') {
        return element;
      }

      var originalStyles =
       element.retrieve('prototype_absolutize_original_styles');

      if (originalStyles) element.setStyle(originalStyles);
      return element;
    }

    if (Prototype.Browser.IE) {
      getOffsetParent = getOffsetParent.wrap(
        function(proceed, element) {
          element = $(element);

          if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
            return $(document.body);

          var position = element.getStyle('position');
          if (position !== 'static') return proceed(element);

          element.setStyle({ position: 'relative' });
          var value = proceed(element);
          element.setStyle({ position: position });
          return value;
        }
      );

      positionedOffset = positionedOffset.wrap(function(proceed, element) {
        element = $(element);
        if (!element.parentNode) return new Element.Offset(0, 0);
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);

        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          hasLayout(offsetParent);

        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      });
    } else if (Prototype.Browser.Webkit) {
      cumulativeOffset = function(element) {
        element = $(element);
        var valueT = 0, valueL = 0;
        do {
          valueT += element.offsetTop  || 0;
          valueL += element.offsetLeft || 0;
          if (element.offsetParent == document.body)
            if (Element.getStyle(element, 'position') == 'absolute') break;

          element = element.offsetParent;
        } while (element);

        return new Element.Offset(valueL, valueT);
      };
    }


    Element.addMethods({
      getLayout:              getLayout,
      measure:                measure,
      getDimensions:          getDimensions,
      getOffsetParent:        getOffsetParent,
      cumulativeOffset:       cumulativeOffset,
      positionedOffset:       positionedOffset,
      cumulativeScrollOffset: cumulativeScrollOffset,
      viewportOffset:         viewportOffset,
      absolutize:             absolutize,
      relativize:             relativize
    });

    function isBody(element) {
      return element.nodeName.toUpperCase() === 'BODY';
    }

    function isHtml(element) {
      return element.nodeName.toUpperCase() === 'HTML';
    }

    function isDocument(element) {
      return element.nodeType === Node.DOCUMENT_NODE;
    }

    function isDetached(element) {
      return element !== document.body &&
       !Element.descendantOf(element, document.body);
    }

    if ('getBoundingClientRect' in document.documentElement) {
      Element.addMethods({
        viewportOffset: function(element) {
          element = $(element);
          if (isDetached(element)) return new Element.Offset(0, 0);

          var rect = element.getBoundingClientRect(),
           docEl = document.documentElement;
          return new Element.Offset(rect.left - docEl.clientLeft,
           rect.top - docEl.clientTop);
        }
      });
    }
  })();
  window.$$ = function() {
    var expression = $A(arguments).join(', ');
    return Prototype.Selector.select(expression, document);
  };

  Prototype.Selector = (function() {

    function select() {
      throw new Error('Method "Prototype.Selector.select" must be defined.');
    }

    function match() {
      throw new Error('Method "Prototype.Selector.match" must be defined.');
    }

    function find(elements, expression, index) {
      index = index || 0;
      var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

      for (i = 0; i < length; i++) {
        if (match(elements[i], expression) && index == matchIndex++) {
          return Element.extend(elements[i]);
        }
      }
    }

    function extendElements(elements) {
      for (var i = 0, length = elements.length; i < length; i++) {
        Element.extend(elements[i]);
      }
      return elements;
    }


    var K = Prototype.K;

    return {
      select: select,
      match: match,
      find: find,
      extendElements: (Element.extend === K) ? K : extendElements,
      extendElement: Element.extend
    };
  })();
  Prototype._original_property = window.Sizzle;
  /*!
   * Sizzle CSS Selector Engine - v1.0
   *  Copyright 2009, The Dojo Foundation
   *  Released under the MIT, BSD, and GPL Licenses.
   *  More information: http://sizzlejs.com/
   */
  (function(){

  var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
  	done = 0,
  	toString = Object.prototype.toString,
  	hasDuplicate = false,
  	baseHasDuplicate = true;

  [0, 0].sort(function(){
  	baseHasDuplicate = false;
  	return 0;
  });

  var Sizzle = function(selector, context, results, seed) {
  	results = results || [];
  	var origContext = context = context || document;

  	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
  		return [];
  	}

  	if ( !selector || typeof selector !== "string" ) {
  		return results;
  	}

  	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
  		soFar = selector;

  	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
  		soFar = m[3];

  		parts.push( m[1] );

  		if ( m[2] ) {
  			extra = m[3];
  			break;
  		}
  	}

  	if ( parts.length > 1 && origPOS.exec( selector ) ) {
  		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
  			set = posProcess( parts[0] + parts[1], context );
  		} else {
  			set = Expr.relative[ parts[0] ] ?
  				[ context ] :
  				Sizzle( parts.shift(), context );

  			while ( parts.length ) {
  				selector = parts.shift();

  				if ( Expr.relative[ selector ] )
  					selector += parts.shift();

  				set = posProcess( selector, set );
  			}
  		}
  	} else {
  		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
  				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
  			var ret = Sizzle.find( parts.shift(), context, contextXML );
  			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
  		}

  		if ( context ) {
  			var ret = seed ?
  				{ expr: parts.pop(), set: makeArray(seed) } :
  				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
  			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

  			if ( parts.length > 0 ) {
  				checkSet = makeArray(set);
  			} else {
  				prune = false;
  			}

  			while ( parts.length ) {
  				var cur = parts.pop(), pop = cur;

  				if ( !Expr.relative[ cur ] ) {
  					cur = "";
  				} else {
  					pop = parts.pop();
  				}

  				if ( pop == null ) {
  					pop = context;
  				}

  				Expr.relative[ cur ]( checkSet, pop, contextXML );
  			}
  		} else {
  			checkSet = parts = [];
  		}
  	}

  	if ( !checkSet ) {
  		checkSet = set;
  	}

  	if ( !checkSet ) {
  		throw "Syntax error, unrecognized expression: " + (cur || selector);
  	}

  	if ( toString.call(checkSet) === "[object Array]" ) {
  		if ( !prune ) {
  			results.push.apply( results, checkSet );
  		} else if ( context && context.nodeType === 1 ) {
  			for ( var i = 0; checkSet[i] != null; i++ ) {
  				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
  					results.push( set[i] );
  				}
  			}
  		} else {
  			for ( var i = 0; checkSet[i] != null; i++ ) {
  				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
  					results.push( set[i] );
  				}
  			}
  		}
  	} else {
  		makeArray( checkSet, results );
  	}

  	if ( extra ) {
  		Sizzle( extra, origContext, results, seed );
  		Sizzle.uniqueSort( results );
  	}

  	return results;
  };

  Sizzle.uniqueSort = function(results){
  	if ( sortOrder ) {
  		hasDuplicate = baseHasDuplicate;
  		results.sort(sortOrder);

  		if ( hasDuplicate ) {
  			for ( var i = 1; i < results.length; i++ ) {
  				if ( results[i] === results[i-1] ) {
  					results.splice(i--, 1);
  				}
  			}
  		}
  	}

  	return results;
  };

  Sizzle.matches = function(expr, set){
  	return Sizzle(expr, null, null, set);
  };

  Sizzle.find = function(expr, context, isXML){
  	var set, match;

  	if ( !expr ) {
  		return [];
  	}

  	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
  		var type = Expr.order[i], match;

  		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
  			var left = match[1];
  			match.splice(1,1);

  			if ( left.substr( left.length - 1 ) !== "\\" ) {
  				match[1] = (match[1] || "").replace(/\\/g, "");
  				set = Expr.find[ type ]( match, context, isXML );
  				if ( set != null ) {
  					expr = expr.replace( Expr.match[ type ], "" );
  					break;
  				}
  			}
  		}
  	}

  	if ( !set ) {
  		set = context.getElementsByTagName("*");
  	}

  	return {set: set, expr: expr};
  };

  Sizzle.filter = function(expr, set, inplace, not){
  	var old = expr, result = [], curLoop = set, match, anyFound,
  		isXMLFilter = set && set[0] && isXML(set[0]);

  	while ( expr && set.length ) {
  		for ( var type in Expr.filter ) {
  			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
  				var filter = Expr.filter[ type ], found, item;
  				anyFound = false;

  				if ( curLoop == result ) {
  					result = [];
  				}

  				if ( Expr.preFilter[ type ] ) {
  					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

  					if ( !match ) {
  						anyFound = found = true;
  					} else if ( match === true ) {
  						continue;
  					}
  				}

  				if ( match ) {
  					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
  						if ( item ) {
  							found = filter( item, match, i, curLoop );
  							var pass = not ^ !!found;

  							if ( inplace && found != null ) {
  								if ( pass ) {
  									anyFound = true;
  								} else {
  									curLoop[i] = false;
  								}
  							} else if ( pass ) {
  								result.push( item );
  								anyFound = true;
  							}
  						}
  					}
  				}

  				if ( found !== undefined ) {
  					if ( !inplace ) {
  						curLoop = result;
  					}

  					expr = expr.replace( Expr.match[ type ], "" );

  					if ( !anyFound ) {
  						return [];
  					}

  					break;
  				}
  			}
  		}

  		if ( expr == old ) {
  			if ( anyFound == null ) {
  				throw "Syntax error, unrecognized expression: " + expr;
  			} else {
  				break;
  			}
  		}

  		old = expr;
  	}

  	return curLoop;
  };

  var Expr = Sizzle.selectors = {
  	order: [ "ID", "NAME", "TAG" ],
  	match: {
  		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
  		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
  		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
  		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
  		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
  		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
  		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
  		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
  	},
  	leftMatch: {},
  	attrMap: {
  		"class": "className",
  		"for": "htmlFor"
  	},
  	attrHandle: {
  		href: function(elem){
  			return elem.getAttribute("href");
  		}
  	},
  	relative: {
  		"+": function(checkSet, part, isXML){
  			var isPartStr = typeof part === "string",
  				isTag = isPartStr && !/\W/.test(part),
  				isPartStrNotTag = isPartStr && !isTag;

  			if ( isTag && !isXML ) {
  				part = part.toUpperCase();
  			}

  			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
  				if ( (elem = checkSet[i]) ) {
  					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

  					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
  						elem || false :
  						elem === part;
  				}
  			}

  			if ( isPartStrNotTag ) {
  				Sizzle.filter( part, checkSet, true );
  			}
  		},
  		">": function(checkSet, part, isXML){
  			var isPartStr = typeof part === "string";

  			if ( isPartStr && !/\W/.test(part) ) {
  				part = isXML ? part : part.toUpperCase();

  				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
  					var elem = checkSet[i];
  					if ( elem ) {
  						var parent = elem.parentNode;
  						checkSet[i] = parent.nodeName === part ? parent : false;
  					}
  				}
  			} else {
  				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
  					var elem = checkSet[i];
  					if ( elem ) {
  						checkSet[i] = isPartStr ?
  							elem.parentNode :
  							elem.parentNode === part;
  					}
  				}

  				if ( isPartStr ) {
  					Sizzle.filter( part, checkSet, true );
  				}
  			}
  		},
  		"": function(checkSet, part, isXML){
  			var doneName = done++, checkFn = dirCheck;

  			if ( !/\W/.test(part) ) {
  				var nodeCheck = part = isXML ? part : part.toUpperCase();
  				checkFn = dirNodeCheck;
  			}

  			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
  		},
  		"~": function(checkSet, part, isXML){
  			var doneName = done++, checkFn = dirCheck;

  			if ( typeof part === "string" && !/\W/.test(part) ) {
  				var nodeCheck = part = isXML ? part : part.toUpperCase();
  				checkFn = dirNodeCheck;
  			}

  			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
  		}
  	},
  	find: {
  		ID: function(match, context, isXML){
  			if ( typeof context.getElementById !== "undefined" && !isXML ) {
  				var m = context.getElementById(match[1]);
  				return m ? [m] : [];
  			}
  		},
  		NAME: function(match, context, isXML){
  			if ( typeof context.getElementsByName !== "undefined" ) {
  				var ret = [], results = context.getElementsByName(match[1]);

  				for ( var i = 0, l = results.length; i < l; i++ ) {
  					if ( results[i].getAttribute("name") === match[1] ) {
  						ret.push( results[i] );
  					}
  				}

  				return ret.length === 0 ? null : ret;
  			}
  		},
  		TAG: function(match, context){
  			return context.getElementsByTagName(match[1]);
  		}
  	},
  	preFilter: {
  		CLASS: function(match, curLoop, inplace, result, not, isXML){
  			match = " " + match[1].replace(/\\/g, "") + " ";

  			if ( isXML ) {
  				return match;
  			}

  			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
  				if ( elem ) {
  					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
  						if ( !inplace )
  							result.push( elem );
  					} else if ( inplace ) {
  						curLoop[i] = false;
  					}
  				}
  			}

  			return false;
  		},
  		ID: function(match){
  			return match[1].replace(/\\/g, "");
  		},
  		TAG: function(match, curLoop){
  			for ( var i = 0; curLoop[i] === false; i++ ){}
  			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
  		},
  		CHILD: function(match){
  			if ( match[1] == "nth" ) {
  				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
  					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
  					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

  				match[2] = (test[1] + (test[2] || 1)) - 0;
  				match[3] = test[3] - 0;
  			}

  			match[0] = done++;

  			return match;
  		},
  		ATTR: function(match, curLoop, inplace, result, not, isXML){
  			var name = match[1].replace(/\\/g, "");

  			if ( !isXML && Expr.attrMap[name] ) {
  				match[1] = Expr.attrMap[name];
  			}

  			if ( match[2] === "~=" ) {
  				match[4] = " " + match[4] + " ";
  			}

  			return match;
  		},
  		PSEUDO: function(match, curLoop, inplace, result, not){
  			if ( match[1] === "not" ) {
  				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
  					match[3] = Sizzle(match[3], null, null, curLoop);
  				} else {
  					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
  					if ( !inplace ) {
  						result.push.apply( result, ret );
  					}
  					return false;
  				}
  			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
  				return true;
  			}

  			return match;
  		},
  		POS: function(match){
  			match.unshift( true );
  			return match;
  		}
  	},
  	filters: {
  		enabled: function(elem){
  			return elem.disabled === false && elem.type !== "hidden";
  		},
  		disabled: function(elem){
  			return elem.disabled === true;
  		},
  		checked: function(elem){
  			return elem.checked === true;
  		},
  		selected: function(elem){
  			elem.parentNode.selectedIndex;
  			return elem.selected === true;
  		},
  		parent: function(elem){
  			return !!elem.firstChild;
  		},
  		empty: function(elem){
  			return !elem.firstChild;
  		},
  		has: function(elem, i, match){
  			return !!Sizzle( match[3], elem ).length;
  		},
  		header: function(elem){
  			return /h\d/i.test( elem.nodeName );
  		},
  		text: function(elem){
  			return "text" === elem.type;
  		},
  		radio: function(elem){
  			return "radio" === elem.type;
  		},
  		checkbox: function(elem){
  			return "checkbox" === elem.type;
  		},
  		file: function(elem){
  			return "file" === elem.type;
  		},
  		password: function(elem){
  			return "password" === elem.type;
  		},
  		submit: function(elem){
  			return "submit" === elem.type;
  		},
  		image: function(elem){
  			return "image" === elem.type;
  		},
  		reset: function(elem){
  			return "reset" === elem.type;
  		},
  		button: function(elem){
  			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
  		},
  		input: function(elem){
  			return /input|select|textarea|button/i.test(elem.nodeName);
  		}
  	},
  	setFilters: {
  		first: function(elem, i){
  			return i === 0;
  		},
  		last: function(elem, i, match, array){
  			return i === array.length - 1;
  		},
  		even: function(elem, i){
  			return i % 2 === 0;
  		},
  		odd: function(elem, i){
  			return i % 2 === 1;
  		},
  		lt: function(elem, i, match){
  			return i < match[3] - 0;
  		},
  		gt: function(elem, i, match){
  			return i > match[3] - 0;
  		},
  		nth: function(elem, i, match){
  			return match[3] - 0 == i;
  		},
  		eq: function(elem, i, match){
  			return match[3] - 0 == i;
  		}
  	},
  	filter: {
  		PSEUDO: function(elem, match, i, array){
  			var name = match[1], filter = Expr.filters[ name ];

  			if ( filter ) {
  				return filter( elem, i, match, array );
  			} else if ( name === "contains" ) {
  				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
  			} else if ( name === "not" ) {
  				var not = match[3];

  				for ( var i = 0, l = not.length; i < l; i++ ) {
  					if ( not[i] === elem ) {
  						return false;
  					}
  				}

  				return true;
  			}
  		},
  		CHILD: function(elem, match){
  			var type = match[1], node = elem;
  			switch (type) {
  				case 'only':
  				case 'first':
  					while ( (node = node.previousSibling) )  {
  						if ( node.nodeType === 1 ) return false;
  					}
  					if ( type == 'first') return true;
  					node = elem;
  				case 'last':
  					while ( (node = node.nextSibling) )  {
  						if ( node.nodeType === 1 ) return false;
  					}
  					return true;
  				case 'nth':
  					var first = match[2], last = match[3];

  					if ( first == 1 && last == 0 ) {
  						return true;
  					}

  					var doneName = match[0],
  						parent = elem.parentNode;

  					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
  						var count = 0;
  						for ( node = parent.firstChild; node; node = node.nextSibling ) {
  							if ( node.nodeType === 1 ) {
  								node.nodeIndex = ++count;
  							}
  						}
  						parent.sizcache = doneName;
  					}

  					var diff = elem.nodeIndex - last;
  					if ( first == 0 ) {
  						return diff == 0;
  					} else {
  						return ( diff % first == 0 && diff / first >= 0 );
  					}
  			}
  		},
  		ID: function(elem, match){
  			return elem.nodeType === 1 && elem.getAttribute("id") === match;
  		},
  		TAG: function(elem, match){
  			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
  		},
  		CLASS: function(elem, match){
  			return (" " + (elem.className || elem.getAttribute("class")) + " ")
  				.indexOf( match ) > -1;
  		},
  		ATTR: function(elem, match){
  			var name = match[1],
  				result = Expr.attrHandle[ name ] ?
  					Expr.attrHandle[ name ]( elem ) :
  					elem[ name ] != null ?
  						elem[ name ] :
  						elem.getAttribute( name ),
  				value = result + "",
  				type = match[2],
  				check = match[4];

  			return result == null ?
  				type === "!=" :
  				type === "=" ?
  				value === check :
  				type === "*=" ?
  				value.indexOf(check) >= 0 :
  				type === "~=" ?
  				(" " + value + " ").indexOf(check) >= 0 :
  				!check ?
  				value && result !== false :
  				type === "!=" ?
  				value != check :
  				type === "^=" ?
  				value.indexOf(check) === 0 :
  				type === "$=" ?
  				value.substr(value.length - check.length) === check :
  				type === "|=" ?
  				value === check || value.substr(0, check.length + 1) === check + "-" :
  				false;
  		},
  		POS: function(elem, match, i, array){
  			var name = match[2], filter = Expr.setFilters[ name ];

  			if ( filter ) {
  				return filter( elem, i, match, array );
  			}
  		}
  	}
  };

  var origPOS = Expr.match.POS;

  for ( var type in Expr.match ) {
  	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
  	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
  }

  var makeArray = function(array, results) {
  	array = Array.prototype.slice.call( array, 0 );

  	if ( results ) {
  		results.push.apply( results, array );
  		return results;
  	}

  	return array;
  };

  try {
  	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

  } catch(e){
  	makeArray = function(array, results) {
  		var ret = results || [];

  		if ( toString.call(array) === "[object Array]" ) {
  			Array.prototype.push.apply( ret, array );
  		} else {
  			if ( typeof array.length === "number" ) {
  				for ( var i = 0, l = array.length; i < l; i++ ) {
  					ret.push( array[i] );
  				}
  			} else {
  				for ( var i = 0; array[i]; i++ ) {
  					ret.push( array[i] );
  				}
  			}
  		}

  		return ret;
  	};
  }

  var sortOrder;

  if ( document.documentElement.compareDocumentPosition ) {
  	sortOrder = function( a, b ) {
  		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
  			if ( a == b ) {
  				hasDuplicate = true;
  			}
  			return 0;
  		}

  		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
  		if ( ret === 0 ) {
  			hasDuplicate = true;
  		}
  		return ret;
  	};
  } else if ( "sourceIndex" in document.documentElement ) {
  	sortOrder = function( a, b ) {
  		if ( !a.sourceIndex || !b.sourceIndex ) {
  			if ( a == b ) {
  				hasDuplicate = true;
  			}
  			return 0;
  		}

  		var ret = a.sourceIndex - b.sourceIndex;
  		if ( ret === 0 ) {
  			hasDuplicate = true;
  		}
  		return ret;
  	};
  } else if ( document.createRange ) {
  	sortOrder = function( a, b ) {
  		if ( !a.ownerDocument || !b.ownerDocument ) {
  			if ( a == b ) {
  				hasDuplicate = true;
  			}
  			return 0;
  		}

  		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
  		aRange.setStart(a, 0);
  		aRange.setEnd(a, 0);
  		bRange.setStart(b, 0);
  		bRange.setEnd(b, 0);
  		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
  		if ( ret === 0 ) {
  			hasDuplicate = true;
  		}
  		return ret;
  	};
  }

  (function(){
  	var form = document.createElement("div"),
  		id = "script" + (new Date).getTime();
  	form.innerHTML = "<a name='" + id + "'/>";

  	var root = document.documentElement;
  	root.insertBefore( form, root.firstChild );

  	if ( !!document.getElementById( id ) ) {
  		Expr.find.ID = function(match, context, isXML){
  			if ( typeof context.getElementById !== "undefined" && !isXML ) {
  				var m = context.getElementById(match[1]);
  				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
  			}
  		};

  		Expr.filter.ID = function(elem, match){
  			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
  			return elem.nodeType === 1 && node && node.nodeValue === match;
  		};
  	}

  	root.removeChild( form );
  	root = form = null; // release memory in IE
  })();

  (function(){

  	var div = document.createElement("div");
  	div.appendChild( document.createComment("") );

  	if ( div.getElementsByTagName("*").length > 0 ) {
  		Expr.find.TAG = function(match, context){
  			var results = context.getElementsByTagName(match[1]);

  			if ( match[1] === "*" ) {
  				var tmp = [];

  				for ( var i = 0; results[i]; i++ ) {
  					if ( results[i].nodeType === 1 ) {
  						tmp.push( results[i] );
  					}
  				}

  				results = tmp;
  			}

  			return results;
  		};
  	}

  	div.innerHTML = "<a href='#'></a>";
  	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
  			div.firstChild.getAttribute("href") !== "#" ) {
  		Expr.attrHandle.href = function(elem){
  			return elem.getAttribute("href", 2);
  		};
  	}

  	div = null; // release memory in IE
  })();

  if ( document.querySelectorAll ) (function(){
  	var oldSizzle = Sizzle, div = document.createElement("div");
  	div.innerHTML = "<p class='TEST'></p>";

  	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
  		return;
  	}

  	Sizzle = function(query, context, extra, seed){
  		context = context || document;

  		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
  			try {
  				return makeArray( context.querySelectorAll(query), extra );
  			} catch(e){}
  		}

  		return oldSizzle(query, context, extra, seed);
  	};

  	for ( var prop in oldSizzle ) {
  		Sizzle[ prop ] = oldSizzle[ prop ];
  	}

  	div = null; // release memory in IE
  })();

  if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
  	var div = document.createElement("div");
  	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

  	if ( div.getElementsByClassName("e").length === 0 )
  		return;

  	div.lastChild.className = "e";

  	if ( div.getElementsByClassName("e").length === 1 )
  		return;

  	Expr.order.splice(1, 0, "CLASS");
  	Expr.find.CLASS = function(match, context, isXML) {
  		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
  			return context.getElementsByClassName(match[1]);
  		}
  	};

  	div = null; // release memory in IE
  })();

  function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
  	var sibDir = dir == "previousSibling" && !isXML;
  	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
  		var elem = checkSet[i];
  		if ( elem ) {
  			if ( sibDir && elem.nodeType === 1 ){
  				elem.sizcache = doneName;
  				elem.sizset = i;
  			}
  			elem = elem[dir];
  			var match = false;

  			while ( elem ) {
  				if ( elem.sizcache === doneName ) {
  					match = checkSet[elem.sizset];
  					break;
  				}

  				if ( elem.nodeType === 1 && !isXML ){
  					elem.sizcache = doneName;
  					elem.sizset = i;
  				}

  				if ( elem.nodeName === cur ) {
  					match = elem;
  					break;
  				}

  				elem = elem[dir];
  			}

  			checkSet[i] = match;
  		}
  	}
  }

  function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
  	var sibDir = dir == "previousSibling" && !isXML;
  	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
  		var elem = checkSet[i];
  		if ( elem ) {
  			if ( sibDir && elem.nodeType === 1 ) {
  				elem.sizcache = doneName;
  				elem.sizset = i;
  			}
  			elem = elem[dir];
  			var match = false;

  			while ( elem ) {
  				if ( elem.sizcache === doneName ) {
  					match = checkSet[elem.sizset];
  					break;
  				}

  				if ( elem.nodeType === 1 ) {
  					if ( !isXML ) {
  						elem.sizcache = doneName;
  						elem.sizset = i;
  					}
  					if ( typeof cur !== "string" ) {
  						if ( elem === cur ) {
  							match = true;
  							break;
  						}

  					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
  						match = elem;
  						break;
  					}
  				}

  				elem = elem[dir];
  			}

  			checkSet[i] = match;
  		}
  	}
  }

  var contains = document.compareDocumentPosition ?  function(a, b){
  	return a.compareDocumentPosition(b) & 16;
  } : function(a, b){
  	return a !== b && (a.contains ? a.contains(b) : true);
  };

  var isXML = function(elem){
  	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
  		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
  };

  var posProcess = function(selector, context){
  	var tmpSet = [], later = "", match,
  		root = context.nodeType ? [context] : context;

  	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
  		later += match[0];
  		selector = selector.replace( Expr.match.PSEUDO, "" );
  	}

  	selector = Expr.relative[selector] ? selector + "*" : selector;

  	for ( var i = 0, l = root.length; i < l; i++ ) {
  		Sizzle( selector, root[i], tmpSet );
  	}

  	return Sizzle.filter( later, tmpSet );
  };


  window.Sizzle = Sizzle;

  })();

  ;(function(engine) {
    var extendElements = Prototype.Selector.extendElements;

    function select(selector, scope) {
      return extendElements(engine(selector, scope || document));
    }

    function match(element, selector) {
      return engine.matches(selector, [element]).length == 1;
    }

    Prototype.Selector.engine = engine;
    Prototype.Selector.select = select;
    Prototype.Selector.match = match;
  })(Sizzle);

  window.Sizzle = Prototype._original_property;
  delete Prototype._original_property;

  var Form = window.Form = {
    reset: function(form) {
      form = $(form);
      form.reset();
      return form;
    },

    serializeElements: function(elements, options) {
      if (typeof options != 'object') options = { hash: !!options };
      else if (Object.isUndefined(options.hash)) options.hash = true;
      var key, value, submitted = false, submit = options.submit, accumulator, initial;

      if (options.hash) {
        initial = {};
        accumulator = function(result, key, value) {
          if (key in result) {
            if (!Object.isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          } else result[key] = value;
          return result;
        };
      } else {
        initial = '';
        accumulator = function(result, key, value) {
          return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
        }
      }

      return elements.inject(initial, function(result, element) {
        if (!element.disabled && element.name) {
          key = element.name; value = $(element).getValue();
          if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
              submit !== false && (!submit || key == submit) && (submitted = true)))) {
            result = accumulator(result, key, value);
          }
        }
        return result;
      });
    }
  };

  Form.Methods = {
    serialize: function(form, options) {
      return Form.serializeElements(Form.getElements(form), options);
    },

    getElements: function(form) {
      var elements = $(form).getElementsByTagName('*'),
          element,
          arr = [ ],
          serializers = Form.Element.Serializers;
      for (var i = 0; element = elements[i]; i++) {
        arr.push(element);
      }
      return arr.inject([], function(elements, child) {
        if (serializers[child.tagName.toLowerCase()])
          elements.push(Element.extend(child));
        return elements;
      })
    },

    getInputs: function(form, typeName, name) {
      form = $(form);
      var inputs = form.getElementsByTagName('input');

      if (!typeName && !name) return $A(inputs).map(Element.extend);

      for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
        var input = inputs[i];
        if ((typeName && input.type != typeName) || (name && input.name != name))
          continue;
        matchingInputs.push(Element.extend(input));
      }

      return matchingInputs;
    },

    disable: function(form) {
      form = $(form);
      Form.getElements(form).invoke('disable');
      return form;
    },

    enable: function(form) {
      form = $(form);
      Form.getElements(form).invoke('enable');
      return form;
    },

    findFirstElement: function(form) {
      var elements = $(form).getElements().findAll(function(element) {
        return 'hidden' != element.type && !element.disabled;
      });
      var firstByIndex = elements.findAll(function(element) {
        return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
      }).sortBy(function(element) { return element.tabIndex }).first();

      return firstByIndex ? firstByIndex : elements.find(function(element) {
        return /^(?:input|select|textarea)$/i.test(element.tagName);
      });
    },

    focusFirstElement: function(form) {
      form = $(form);
      var element = form.findFirstElement();
      if (element) element.activate();
      return form;
    },

    request: function(form, options) {
      form = $(form), options = Object.clone(options || { });

      var params = options.parameters, action = form.readAttribute('action') || '';
      if (action.blank()) action = window.location.href;
      options.parameters = form.serialize(true);

      if (params) {
        if (Object.isString(params)) params = params.toQueryParams();
        Object.extend(options.parameters, params);
      }

      if (form.hasAttribute('method') && !options.method)
        options.method = form.method;

      return new Ajax.Request(action, options);
    }
  };

  /*--------------------------------------------------------------------------*/


  Form.Element = {
    focus: function(element) {
      $(element).focus();
      return element;
    },

    select: function(element) {
      $(element).select();
      return element;
    }
  };

  Form.Element.Methods = {

    serialize: function(element) {
      element = $(element);
      if (!element.disabled && element.name) {
        var value = element.getValue();
        if (value != undefined) {
          var pair = { };
          pair[element.name] = value;
          return Object.toQueryString(pair);
        }
      }
      return '';
    },

    getValue: function(element) {
      element = $(element);
      var method = element.tagName.toLowerCase();
      return Form.Element.Serializers[method](element);
    },

    setValue: function(element, value) {
      element = $(element);
      var method = element.tagName.toLowerCase();
      Form.Element.Serializers[method](element, value);
      return element;
    },

    clear: function(element) {
      $(element).value = '';
      return element;
    },

    present: function(element) {
      return $(element).value != '';
    },

    activate: function(element) {
      element = $(element);
      try {
        element.focus();
        if (element.select && (element.tagName.toLowerCase() != 'input' ||
            !(/^(?:button|reset|submit)$/i.test(element.type))))
          element.select();
      } catch (e) { }
      return element;
    },

    disable: function(element) {
      element = $(element);
      element.disabled = true;
      return element;
    },

    enable: function(element) {
      element = $(element);
      element.disabled = false;
      return element;
    }
  };

  /*--------------------------------------------------------------------------*/

  var Field = window.Field = Form.Element;

  var $F = window.$F = Form.Element.Methods.getValue;

  /*--------------------------------------------------------------------------*/

  Form.Element.Serializers = (function() {
    function input(element, value) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          return inputSelector(element, value);
        default:
          return valueSelector(element, value);
      }
    }

    function inputSelector(element, value) {
      if (Object.isUndefined(value))
        return element.checked ? element.value : null;
      else element.checked = !!value;
    }

    function valueSelector(element, value) {
      if (Object.isUndefined(value)) return element.value;
      else element.value = value;
    }

    function select(element, value) {
      if (Object.isUndefined(value))
        return (element.type === 'select-one' ? selectOne : selectMany)(element);

      var opt, currentValue, single = !Object.isArray(value);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        currentValue = this.optionValue(opt);
        if (single) {
          if (currentValue == value) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = value.include(currentValue);
      }
    }

    function selectOne(element) {
      var index = element.selectedIndex;
      return index >= 0 ? optionValue(element.options[index]) : null;
    }

    function selectMany(element) {
      var values, length = element.length;
      if (!length) return null;

      for (var i = 0, values = []; i < length; i++) {
        var opt = element.options[i];
        if (opt.selected) values.push(optionValue(opt));
      }
      return values;
    }

    function optionValue(opt) {
      return Element.hasAttribute(opt, 'value') ? opt.value : opt.text;
    }

    return {
      input:         input,
      inputSelector: inputSelector,
      textarea:      valueSelector,
      select:        select,
      selectOne:     selectOne,
      selectMany:    selectMany,
      optionValue:   optionValue,
      button:        valueSelector
    };
  })();

  /*--------------------------------------------------------------------------*/


  Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
    initialize: function TimedObserver($super, element, frequency, callback) {
      $super(callback, frequency);
      this.element   = $(element);
      this.lastValue = this.getValue();
    },

    execute: function() {
      var value = this.getValue();
      if (Object.isString(this.lastValue) && Object.isString(value) ?
          this.lastValue != value : String(this.lastValue) != String(value)) {
        this.callback(this.element, value);
        this.lastValue = value;
      }
    }
  });

  Form.Element.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function() {
      return Form.Element.getValue(this.element);
    }
  });

  Form.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function() {
      return Form.serialize(this.element);
    }
  });

  /*--------------------------------------------------------------------------*/

  Abstract.EventObserver = Class.create({
    initialize: function EventObserver(element, callback) {
      this.element  = $(element);
      this.callback = callback;

      this.lastValue = this.getValue();
      if (this.element.tagName.toLowerCase() == 'form')
        this.registerFormCallbacks();
      else
        this.registerCallback(this.element);
    },

    onElementEvent: function() {
      var value = this.getValue();
      if (this.lastValue != value) {
        this.callback(this.element, value);
        this.lastValue = value;
      }
    },

    registerFormCallbacks: function() {
      Form.getElements(this.element).each(this.registerCallback, this);
    },

    registerCallback: function(element) {
      if (element.type) {
        switch (element.type.toLowerCase()) {
          case 'checkbox':
          case 'radio':
            Event.observe(element, 'click', this.onElementEvent.bind(this));
            break;
          default:
            Event.observe(element, 'change', this.onElementEvent.bind(this));
            break;
        }
      }
    }
  });

  Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function() {
      return Form.Element.getValue(this.element);
    }
  });

  Form.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function() {
      return Form.serialize(this.element);
    }
  });
  (function() {

    var Event = {
      KEY_BACKSPACE: 8,
      KEY_TAB:       9,
      KEY_RETURN:   13,
      KEY_ESC:      27,
      KEY_LEFT:     37,
      KEY_UP:       38,
      KEY_RIGHT:    39,
      KEY_DOWN:     40,
      KEY_DELETE:   46,
      KEY_HOME:     36,
      KEY_END:      35,
      KEY_PAGEUP:   33,
      KEY_PAGEDOWN: 34,
      KEY_INSERT:   45,

      cache: {}
    };

    var docEl = document.documentElement;
    var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
      && 'onmouseleave' in docEl;



    var isIELegacyEvent = function(event) { return false; };

    if (window.attachEvent) {
      if (window.addEventListener) {
        isIELegacyEvent = function(event) {
          return !(event instanceof window.Event);
        };
      } else {
        isIELegacyEvent = function(event) { return true; };
      }
    }

    var _isButton;

    function _isButtonForDOMEvents(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    }

    var legacyButtonMap = { 0: 1, 1: 4, 2: 2 };
    function _isButtonForLegacyEvents(event, code) {
      return event.button === legacyButtonMap[code];
    }

    function _isButtonForWebKit(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 2 || (event.which == 1 && event.metaKey);
        case 2: return event.which == 3;
        default: return false;
      }
    }

    if (window.attachEvent) {
      if (!window.addEventListener) {
        _isButton = _isButtonForLegacyEvents;
      } else {
        _isButton = function(event, code) {
          return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) :
           _isButtonForDOMEvents(event, code);
        }
      }
    } else if (Prototype.Browser.WebKit) {
      _isButton = _isButtonForWebKit;
    } else {
      _isButton = _isButtonForDOMEvents;
    }

    function isLeftClick(event)   { return _isButton(event, 0) }

    function isMiddleClick(event) { return _isButton(event, 1) }

    function isRightClick(event)  { return _isButton(event, 2) }

    function element(event) {
      event = Event.extend(event);

      var node = event.target, type = event.type,
       currentTarget = event.currentTarget;

      if (currentTarget && currentTarget.tagName) {
        if (type === 'load' || type === 'error' ||
          (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
            && currentTarget.type === 'radio'))
              node = currentTarget;
      }

      if (node.nodeType == Node.TEXT_NODE)
        node = node.parentNode;

      return Element.extend(node);
    }

    function findElement(event, expression) {
      var element = Event.element(event);

      if (!expression) return element;
      while (element) {
        if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
          return Element.extend(element);
        }
        element = element.parentNode;
      }
    }

    function pointer(event) {
      return { x: pointerX(event), y: pointerY(event) };
    }

    function pointerX(event) {
      var docElement = document.documentElement,
       body = document.body || { scrollLeft: 0 };

      return event.pageX || (event.clientX +
        (docElement.scrollLeft || body.scrollLeft) -
        (docElement.clientLeft || 0));
    }

    function pointerY(event) {
      var docElement = document.documentElement,
       body = document.body || { scrollTop: 0 };

      return  event.pageY || (event.clientY +
         (docElement.scrollTop || body.scrollTop) -
         (docElement.clientTop || 0));
    }


    function stop(event) {
      Event.extend(event);
      event.preventDefault();
      event.stopPropagation();

      event.stopped = true;
    }


    Event.Methods = {
      isLeftClick:   isLeftClick,
      isMiddleClick: isMiddleClick,
      isRightClick:  isRightClick,

      element:     element,
      findElement: findElement,

      pointer:  pointer,
      pointerX: pointerX,
      pointerY: pointerY,

      stop: stop
    };

    var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
      m[name] = Event.Methods[name].methodize();
      return m;
    });

    if (window.attachEvent) {
      function _relatedTarget(event) {
        var element;
        switch (event.type) {
          case 'mouseover':
          case 'mouseenter':
            element = event.fromElement;
            break;
          case 'mouseout':
          case 'mouseleave':
            element = event.toElement;
            break;
          default:
            return null;
        }
        return Element.extend(element);
      }

      var additionalMethods = {
        stopPropagation: function() { this.cancelBubble = true },
        preventDefault:  function() { this.returnValue = false },
        inspect: function() { return '[object Event]' }
      };

      Event.extend = function(event, element) {
        if (!event) return false;

        if (!isIELegacyEvent(event)) return event;

        if (event._extendedByPrototype) return event;
        event._extendedByPrototype = Prototype.emptyFunction;

        var pointer = Event.pointer(event);

        Object.extend(event, {
          target: event.srcElement || element,
          relatedTarget: _relatedTarget(event),
          pageX:  pointer.x,
          pageY:  pointer.y
        });

        Object.extend(event, methods);
        Object.extend(event, additionalMethods);

        return event;
      };
    } else {
      Event.extend = Prototype.K;
    }

    if (window.addEventListener) {
      Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
      Object.extend(Event.prototype, methods);
    }

    function _createResponder(element, eventName, handler) {
      var registry = Element.retrieve(element, 'prototype_event_registry');

      if (Object.isUndefined(registry)) {
        CACHE.push(element);
        registry = Element.retrieve(element, 'prototype_event_registry', $H());
      }

      var respondersForEvent = registry.get(eventName);
      if (Object.isUndefined(respondersForEvent)) {
        respondersForEvent = [];
        registry.set(eventName, respondersForEvent);
      }

      if (respondersForEvent.pluck('handler').include(handler)) return false;

      var responder;
      if (eventName.include(":")) {
        responder = function(event) {
          if (Object.isUndefined(event.eventName))
            return false;

          if (event.eventName !== eventName)
            return false;

          Event.extend(event, element);
          handler.call(element, event);
        };
      } else {
        if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
         (eventName === "mouseenter" || eventName === "mouseleave")) {
          if (eventName === "mouseenter" || eventName === "mouseleave") {
            responder = function(event) {
              Event.extend(event, element);

              var parent = event.relatedTarget;
              while (parent && parent !== element) {
                try { parent = parent.parentNode; }
                catch(e) { parent = element; }
              }

              if (parent === element) return;

              handler.call(element, event);
            };
          }
        } else {
          responder = function(event) {
            Event.extend(event, element);
            handler.call(element, event);
          };
        }
      }

      responder.handler = handler;
      respondersForEvent.push(responder);
      return responder;
    }

    function _destroyCache() {
      for (var i = 0, length = CACHE.length; i < length; i++) {
        Event.stopObserving(CACHE[i]);
        CACHE[i] = null;
      }
    }

    var CACHE = [];

    if (Prototype.Browser.IE)
      window.attachEvent('onunload', _destroyCache);

    if (Prototype.Browser.WebKit)
      window.addEventListener('unload', Prototype.emptyFunction, false);


    var _getDOMEventName = Prototype.K,
        translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

    if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
      _getDOMEventName = function(eventName) {
        return (translations[eventName] || eventName);
      };
    }

    function observe(element, eventName, handler) {
      element = $(element);

      var responder = _createResponder(element, eventName, handler);

      if (!responder) return element;

      if (eventName.include(':')) {
        if (element.addEventListener)
          element.addEventListener("dataavailable", responder, false);
        else {
          element.attachEvent("ondataavailable", responder);
          element.attachEvent("onlosecapture", responder);
        }
      } else {
        var actualEventName = _getDOMEventName(eventName);

        if (element.addEventListener)
          element.addEventListener(actualEventName, responder, false);
        else
          element.attachEvent("on" + actualEventName, responder);
      }

      return element;
    }

    function stopObserving(element, eventName, handler) {
      element = $(element);

      var registry = Element.retrieve(element, 'prototype_event_registry');
      if (!registry) return element;

      if (!eventName) {
        registry.each( function(pair) {
          var eventName = pair.key;
          stopObserving(element, eventName);
        });
        return element;
      }

      var responders = registry.get(eventName);
      if (!responders) return element;

      if (!handler) {
        responders.each(function(r) {
          stopObserving(element, eventName, r.handler);
        });
        return element;
      }

      var i = responders.length, responder;
      while (i--) {
        if (responders[i].handler === handler) {
          responder = responders[i];
          break;
        }
      }
      if (!responder) return element;

      if (eventName.include(':')) {
        if (element.removeEventListener)
          element.removeEventListener("dataavailable", responder, false);
        else {
          element.detachEvent("ondataavailable", responder);
          element.detachEvent("onlosecapture", responder);
        }
      } else {
        var actualEventName = _getDOMEventName(eventName);
        if (element.removeEventListener)
          element.removeEventListener(actualEventName, responder, false);
        else
          element.detachEvent('on' + actualEventName, responder);
      }

      registry.set(eventName, responders.without(responder));

      return element;
    }

    function fire(element, eventName, memo, bubble) {
      element = $(element);

      if (Object.isUndefined(bubble))
        bubble = true;

      if (element == document && document.createEvent && !element.dispatchEvent)
        element = document.documentElement;

      var event;
      if (document.createEvent) {
        event = document.createEvent('HTMLEvents');
        event.initEvent('dataavailable', bubble, true);
      } else {
        event = document.createEventObject();
        event.eventType = bubble ? 'ondataavailable' : 'onlosecapture';
      }

      event.eventName = eventName;
      event.memo = memo || { };

      if (document.createEvent)
        element.dispatchEvent(event);
      else
        element.fireEvent(event.eventType, event);

      return Event.extend(event);
    }

    Event.Handler = Class.create({
      initialize: function EventHandler(element, eventName, selector, callback) {
        this.element   = $(element);
        this.eventName = eventName;
        this.selector  = selector;
        this.callback  = callback;
        this.handler   = this.handleEvent.bind(this);
      },

      start: function() {
        Event.observe(this.element, this.eventName, this.handler);
        return this;
      },

      stop: function() {
        Event.stopObserving(this.element, this.eventName, this.handler);
        return this;
      },

      handleEvent: function(event) {
        var element = Event.findElement(event, this.selector);
        if (element) this.callback.call(this.element, event, element);
      }
    });

    function on(element, eventName, selector, callback) {
      element = $(element);
      if (Object.isFunction(selector) && Object.isUndefined(callback)) {
        callback = selector, selector = null;
      }

      return new Event.Handler(element, eventName, selector, callback).start();
    }

    Object.extend(Event, Event.Methods);

    Object.extend(Event, {
      fire:          fire,
      observe:       observe,
      stopObserving: stopObserving,
      on:            on
    });

    Element.addMethods({
      fire:          fire,

      observe:       observe,

      stopObserving: stopObserving,

      on:            on
    });

    Object.extend(document, {
      fire:          fire.methodize(),

      observe:       observe.methodize(),

      stopObserving: stopObserving.methodize(),

      on:            on.methodize(),

      loaded:        false
    });

    if (window.Event) Object.extend(window.Event, Event);
    else window.Event = Event;
  })();

  (function() {
    /* Support for the DOMContentLoaded event is based on work by Dan Webb,
       Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

    var timer;

    function fireContentLoadedEvent() {
      if (document.loaded) return;
      if (timer) window.clearTimeout(timer);
      document.loaded = true;
      document.fire('dom:loaded');
    }

    function checkReadyState() {
      if (document.readyState === 'complete') {
        document.stopObserving('readystatechange', checkReadyState);
        fireContentLoadedEvent();
      }
    }

    function pollDoScroll() {
      try { document.documentElement.doScroll('left'); }
      catch(e) {
        timer = pollDoScroll.defer();
        return;
      }
      fireContentLoadedEvent();
    }

    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
    } else {
      document.observe('readystatechange', checkReadyState);
      if (window == top)
        timer = pollDoScroll.defer();
    }

    Event.observe(window, 'load', fireContentLoadedEvent);
  })();

  Element.addMethods();

  /*------------------------------- DEPRECATED -------------------------------*/

  Hash.toQueryString = Object.toQueryString;

  var Toggle = { display: Element.toggle };

  Element.Methods.childOf = Element.Methods.descendantOf;

  var Insertion = {
    Before: function(element, content) {
      return Element.insert(element, {before:content});
    },

    Top: function(element, content) {
      return Element.insert(element, {top:content});
    },

    Bottom: function(element, content) {
      return Element.insert(element, {bottom:content});
    },

    After: function(element, content) {
      return Element.insert(element, {after:content});
    }
  };

  var $continue = window.$continue = new Error('"throw $continue" is deprecated, use "return" instead');

  var Position = window.Position = {
    includeScrollOffsets: false,

    prepare: function() {
      this.deltaX =  window.pageXOffset
                  || document.documentElement.scrollLeft
                  || document.body.scrollLeft
                  || 0;
      this.deltaY =  window.pageYOffset
                  || document.documentElement.scrollTop
                  || document.body.scrollTop
                  || 0;
    },

    within: function(element, x, y) {
      if (this.includeScrollOffsets)
        return this.withinIncludingScrolloffsets(element, x, y);
      this.xcomp = x;
      this.ycomp = y;
      this.offset = Element.cumulativeOffset(element);

      return (y >= this.offset[1] &&
              y <  this.offset[1] + element.offsetHeight &&
              x >= this.offset[0] &&
              x <  this.offset[0] + element.offsetWidth);
    },

    withinIncludingScrolloffsets: function(element, x, y) {
      var offsetcache = Element.cumulativeScrollOffset(element);

      this.xcomp = x + offsetcache[0] - this.deltaX;
      this.ycomp = y + offsetcache[1] - this.deltaY;
      this.offset = Element.cumulativeOffset(element);

      return (this.ycomp >= this.offset[1] &&
              this.ycomp <  this.offset[1] + element.offsetHeight &&
              this.xcomp >= this.offset[0] &&
              this.xcomp <  this.offset[0] + element.offsetWidth);
    },

    overlap: function(mode, element) {
      if (!mode) return 0;
      if (mode == 'vertical')
        return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
          element.offsetHeight;
      if (mode == 'horizontal')
        return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
          element.offsetWidth;
    },


    cumulativeOffset: Element.Methods.cumulativeOffset,

    positionedOffset: Element.Methods.positionedOffset,

    absolutize: function(element) {
      Position.prepare();
      return Element.absolutize(element);
    },

    relativize: function(element) {
      Position.prepare();
      return Element.relativize(element);
    },

    realOffset: Element.Methods.cumulativeScrollOffset,

    offsetParent: Element.Methods.getOffsetParent,

    page: Element.Methods.viewportOffset,

    clone: function(source, target, options) {
      options = options || { };
      return Element.clonePosition(target, source, options);
    }
  };

  /*--------------------------------------------------------------------------*/

  if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
    function iter(name) {
      return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
    }

    instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
    function(element, className) {
      className = className.toString().strip();
      var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
      return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
    } : function(element, className) {
      className = className.toString().strip();
      var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
      if (!classNames && !className) return elements;

      var nodes = $(element).getElementsByTagName('*');
      className = ' ' + className + ' ';

      for (var i = 0, child, cn; child = nodes[i]; i++) {
        if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
            (classNames && classNames.all(function(name) {
              return !name.toString().blank() && cn.include(' ' + name + ' ');
            }))))
          elements.push(Element.extend(child));
      }
      return elements;
    };

    return function(className, parentElement) {
      return $(parentElement || document.body).getElementsByClassName(className);
    };
  }(Element.Methods);

  /*--------------------------------------------------------------------------*/

  //Element.ClassNames = Class.create();
  //Element.ClassNames.prototype = {
  Element.ClassNames = Class.create({
    initialize: function ElementClassNames(element) {
      this.element = $(element);
    },

    _each: function(iterator) {
      this.element.className.split(/\s+/).select(function(name) {
        return name.length > 0;
      })._each(iterator);
    },

    set: function(className) {
      this.element.className = className;
    },

    add: function(classNameToAdd) {
      if (this.include(classNameToAdd)) return;
      this.set($A(this).concat(classNameToAdd).join(' '));
    },

    remove: function(classNameToRemove) {
      if (!this.include(classNameToRemove)) return;
      this.set($A(this).without(classNameToRemove).join(' '));
    },

    toString: function() {
      return $A(this).join(' ');
    }
  });

  Object.extend(Element.ClassNames.prototype, Enumerable);

  /*--------------------------------------------------------------------------*/

  (function() {
    window.Selector = Class.create({
      initialize: function Selector(expression) {
        this.expression = expression.strip();
      },

      findElements: function(rootElement) {
        return Prototype.Selector.select(this.expression, rootElement);
      },

      match: function(element) {
        return Prototype.Selector.match(element, this.expression);
      },

      toString: function() {
        return this.expression;
      },

      inspect: function() {
        return "#<Selector: " + this.expression + ">";
      }
    });

    Object.extend(Selector, {
      matchElements: function(elements, expression) {
        var match = Prototype.Selector.match,
            results = [];

        for (var i = 0, length = elements.length; i < length; i++) {
          var element = elements[i];
          if (match(element, expression)) {
            results.push(Element.extend(element));
          }
        }
        return results;
      },

      findElement: function(elements, expression, index) {
        index = index || 0;
        var matchIndex = 0, element;
        for (var i = 0, length = elements.length; i < length; i++) {
          element = elements[i];
          if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
            return Element.extend(element);
          }
        }
      },

      findChildElements: function(element, expressions) {
        var selector = expressions.toArray().join(', ');
        return Prototype.Selector.select(selector, element || document);
      }
    });
  })();
})(Prototype.$)
