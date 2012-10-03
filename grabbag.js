/* The MIT License

Copyright (c) 2012 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function ($) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true, jquery:true */
	
	'use strict';
	
	// one event named 'scroll' is not good enough
	// to determine when something scrolls apparently
	var scrollEvents = ['scroll', 'mousewheel', 'wheel', 'DOMMouseScroll'],
		ancestornamespace = '.ancestorpluginguid';

	function rebind(self, handleObj, action) {
		var n = handleObj.namespace === '' ? '' : '.' + handleObj.namespace,
			evs = $.map(scrollEvents, function (ev) {
				return ev + ancestornamespace + handleObj.guid + n;
			});

		$(self).parents().add(window)[action](evs.join(' '), handleObj.handler);
	}

	$.event.special.ancestorscroll = {
		add: function (handleObj) {
			rebind(this, handleObj, 'bind');
		},
		remove: function (handleObj) {
			rebind(this, handleObj, 'unbind');
		}
	};
})(jQuery);

(function($, undefined) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true, jquery:true */
	
	'use strict';
	
	// this is a list of valid events to capture. Because there is some overhead involved
	// in having the capturing "infrastructure" in place, this list should be kept as small
	// as possible.
	var capturables = ['mousedown'],
		captureSinks = {},
		$window = $(window);

	// creates a capturing variant of the passed in eventArgs object
	function createCapturedEventArgs(eventArgs) {
		var expando = eventArgs[$.expando];
		delete eventArgs[$.expando];

		var evt = $.event.fix(eventArgs);
		evt.type = 'captured' + eventArgs.type;
		evt.originalEvent = eventArgs;
		evt.originalTarget = eventArgs.target;

		eventArgs[$.expando] = expando;

		return evt;
	}

	// the jQuery goo necessary for making capturing events work.
	$.each(capturables, function (index, evtName) {
		captureSinks[evtName] = [];
		captureSinks[evtName].peek = function () { return this[this.length - 1]; };

		$.event.special[evtName] = {
			add: function (handleObj) {
				var oldHandler = handleObj.handler;

				handleObj.handler = function (eventArgs) {
					var retVal, evt, $oE;
					
					if ((captureSinks[evtName] || []).length > 0) {
						$oE = $(eventArgs.originalEvent);
						if (!$oE.data('executedCapture')) {
							$oE.data('executedCapture', true);
							if ($.browser.msie) {
								eventArgs.originalEvent[$.expando] = undefined;
							} else {
								delete eventArgs.originalEvent[$.expando];
							}

							evt = createCapturedEventArgs(eventArgs);

							captureSinks[evtName].peek().element.trigger(evt);

							retVal = evt.result;
						}

						if (!eventArgs.isPropagationStopped()) {
							retVal = oldHandler.apply(this, arguments);
						}

						return retVal;
					} else {
						return oldHandler.apply(this, arguments);
					}
				};
			}
		};
	});

	window.captureEvent = function (eventName, element, handler) {
		///<summary>
		/// When an event is "captured", all future instances of that event will first get routed through the
		/// element who called for the capture before bubbling up the DOM tree as usual. This allows the
		/// captor element to inspect the incoming event and either mutate it, or perform a specific action
		/// in response to an event that is "outside" of its DOM.
		/// Once an event is captured, if that event is triggered, the matching 'captured' version of that event
		/// is triggered on the captor element. So for example, if you capture the 'mousedown' event with element x,
		/// a 'capturedmousedown' event is first triggered on element x before the usual mousedown trigger and bubble.
		/// Note that captured events "stack", meaning that if an existing captor exists for an event and that event
		/// is captured again, a subsequent releaseEvent call will reroute events to that captor.
		///
		/// This functionality is based on the WIN32 SetCapture API which routes all mouse events through a particular
		/// window. For more information: http://msdn.microsoft.com/en-us/library/ms646262%28VS.85%29.aspx
		///</summary>
		///<param name="eventName">The name of the DOM event to capture.</param>
		///<param name="element">The DOM element that is designated as the captor.</param>
		///<param name="handler">
		/// [OPTIONAL] The function to call that will inspect the captured event.
		/// When the handler is bound through this function, it will be unbound when calling releaseEvent.
		/// Otherwise, you can bind the handler manually by writing $(element).bind('captured' + eventName', function(eventArgs) {});
		/// The eventArgs.originalTarget contains the DOM element that initially triggered the event.
		/// </param>
		///</remarks>
		/// Although it is highly recommended that the element argument be an actual DOM element, the code
		/// does not make this check and the parameter can just as easily be an object literal. This functionality
		/// is not tested and should be avoided.
		///</remarks>
		var sink = captureSinks[eventName];
		
		if (typeof (sink) === 'undefined') {
			// if event is not captured, then there is nothing to do
			return;
		}

		if (sink.length > 0) {
			// if an existing capture exists, disable the capture
			sink.peek().element.unbind('captured' + eventName + '.capturingTool');
		}

		sink.push({ element: $(element), handler: handler });
		if ($.isFunction(handler)) {
			sink.peek().element.bind('captured' + eventName + '.capturingTool', handler);
		}

		if (sink.length === 1) {
			// if this is the first capture to get added, then hook the final source
			$window.bind(eventName + '.capturingTool', function (eventArgs) {
				// if the originating event bubbled all the way up to the document node,
				// then perhaps no interested consumers exist for the event, which means
				// the event filter won't be installed.
				// but we have to funnel the event to the appropriate capture sink anyways
				// so do that here.
				if (sink.length !== 0 && !$(eventArgs.originalEvent).data('executedCapture')) {
					sink.peek().element.trigger(createCapturedEventArgs(eventArgs));
				}
			});
		}
	};

	window.releaseEvent = function (eventName) {
		///<summary>
		/// Releases the current capture on the event specified by eventName.
		/// If eventName is not captured, this function is effectively a no-op.
		///</summary>
		///<param name="eventName">The captured event to release</param>
		var sink;

		if ((captureSinks[eventName] || { length: 0 }).length === 0) {
			// if eventName is not captured, or the stack is empty
			// then there is nothing to do
			return;
		}

		sink = captureSinks[eventName].pop();
		sink.element.unbind('captured' + eventName + '.capturingTool');

		if (captureSinks[eventName].length === 0) {
			// if this was the last capture, then remove the final source
			$window.unbind(eventName + '.capturingTool');
		} else {
			// if there were captures we stacked on, rebind
			sink = captureSinks[eventName].peek();
			if ($.isFunction(sink.handler)) {
				sink.element.bind('captured' + eventName + '.capturingTool', sink.handler);
			}
		}
	};
})(jQuery);
(function(undefined) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true */
	
	'use strict';
	
	var borrowStyles = 'fontFamily fontSize fontStyle fontVariant fontWeight'.split(' '),
		measurementDiv = document.createElement('div');
		
	measurementDiv.style.top = '0px';
	measurementDiv.style.left = '0px';
	measurementDiv.style.visibility = 'hidden';
	measurementDiv.style.position = 'absolute';
	
	function attachMeasurementDiv(styles) {
		var styles_t;
		
		styles = styles || document.body;
		styles_t = typeof styles;
		
		if (styles_t === 'string') {
			measurementDiv.style.font = styles;
		} else if (styles_t === 'object') {
			if (styles.nodeType) {
				if (styles.currentStyle) {
					// for IE
					styles = styles.currentStyle;
				} else {
					// for Standards Complaint browsers
					styles = document.defaultView.getComputedStyle(styles, null);
				}
			}
			
			copyStyles(styles);
		}
		
		document.body.appendChild(measurementDiv);
	}
	
	function detachMeasurementDiv() {
		var i, n;
		
		document.body.removeChild(measurementDiv);
		
		measurementDiv.style.font = 'inherit';
		for (i = 0, n = borrowStyles.length; i<n; ++i) {
			measurementDiv.style[borrowStyles[i]] = '';
		}
	}
	
	function copyStyles(styles) {
		var i, n, key;
		
		for (i = 0, n = borrowStyles.length; i<n; ++i) {
			key = borrowStyles[i];
			
			measurementDiv.style[key] = styles[key];
		}
	}
	
	function internalMeasureString(str) {
		function escapeHtml(str) {
			return ('' + str)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}
		
		measurementDiv.innerHTML = escapeHtml(str);
		var bounds = measurementDiv.getBoundingClientRect();
		
		return {
			width: 
				bounds.width ? bounds.width : (bounds.right - bounds.left),
			height: 
				bounds.height ? bounds.height : (bounds.bottom - bounds.top)
		};
	}
	
	/**
	  Returns the dimensions of a given string using a given set of styles.
	  
	  @param style An object literal which contains one or more of the
	    following properties:
		
		  * fontFamily 
		  * fontSize 
		  * fontStyle 
		  * fontVariant 
		  * fontWeight
		
		These properties have their usual CSS meanings.
		
		OR 
		
		a string representing the short-form 'font' CSS property.
		
		Note: The object literal can be the style/currentStyle property of
		a DOM element.
	  @param element A DOM element to borrow the font styles from. The styles
	    are taken from the computed style of the DOM element.
	  @remark Only one of style or element can be specified.
	  
	  @returns The width/height of the measured string in the following object
	    literal: {width: [width], height: [height]). 
	*/
	String.prototype.measure = function(style) {
		var result;
		
		attachMeasurementDiv(style);
		result = internalMeasureString(this.toString());
		detachMeasurementDiv();
	
		return result;
	};

	/**
	  Measures a list of strings and returns all of their dimensions.
	  
	  This method is significantly faster than ''.measure if a lot of
	  strings have to be measured using the same style.

	  @param strs An array of strings to measure
	  @param style An object literal which contains one or more of the
	    following properties:
		
		  * fontFamily 
		  * fontSize 
		  * fontStyle 
		  * fontVariant 
		  * fontWeight
		
		These properties have their usual CSS meanings.
		
		OR 
		
		a string representing the short-form 'font' CSS property.
		
		Note: The object literal can be the style/currentStyle property of
		a DOM element.
	  @param element A DOM element to borrow the font styles from. The styles
	    are taken from the computed style of the DOM element.
	  @remark Only one of style or element can be specified.
	  
	  @returns An array with the width/height dimensions of the input strings
	    in the same order as the strs parameter.
	*/
	String.bulkMeasure = function(strs, style) {
		var i, n,
			result = [];
		
		attachMeasurementDiv(style);
		
		for (i=0, n = strs.length; i<n; ++i) {
			result.push(internalMeasureString(strs[i]));
		}
		
		detachMeasurementDiv();
		
		return result;
	};
	
	/**
	  Crops the given string so that the pixel width of the resultant
	  string is not longer than the target width. If the string is longer,
          then the string is cropped and the ellipsis glyph is added to the end.
	  
	  @param targetWidth The target pixel width of the resultant string.
	    The output string is gauranteed to be shorter than this width.
	  @param style An object literal which contains one or more of the
	    following properties:
		
		  * fontFamily 
		  * fontSize 
		  * fontStyle 
		  * fontVariant 
		  * fontWeight
		
		These properties have their usual CSS meanings.
		
		OR 
		
		a string representing the short-form 'font' CSS property.
		
		Note: The object literal can be the style/currentStyle property of
		a DOM element.
	  @param element A DOM element to borrow the font styles from. The styles
	    are taken from the computed style of the DOM element.
	  @remark Only one of style or element can be specified.
	  
	  @returns If the width of the input string is shorter than targetWidth
	    the original string is returned. If the width of the input string is 
		longer, a cropped version of the string is returned with the
		ellipsis glyph (...) appended to the end. If the cropped string will 
		only be the ellipsis glyph (...), then the empty string is returned.
	*/
	String.prototype.crop = function(targetWidth, style) { 
		var start, end,
			bisection, partial = this.toString(),
			width;
		
		attachMeasurementDiv(style);
		
		width = internalMeasureString(partial).width;
		if (width > targetWidth) {
			start = 0;
			end = this.length;
			
			do {
				bisection = start + Math.ceil((end - start) / 2);
				partial = this.substring(0, bisection) + '...';
				width = internalMeasureString(partial).width;

				if (width > targetWidth) {
					end = bisection;
				} else {
					start = bisection;
				}
			} while (end - start > 1);
		}
		
		// if the result will effectively be empty, 
		// then return the empty string
		if (start === 0 && end === 1 && width > targetWidth) {
			partial = '';
		}
		
		detachMeasurementDiv();
		
		return partial;
	};
})();
// z-manager maintains an ordered list of DOM elements and ensures that they are ordered
// back-to-front in the browser's z-ordering. The list is live, which means that any modification to the list
// results in an update to the browser's DOM.
(function ($, undefined) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true, jquery:true */

	'use strict';

	var BASIS = 1; // The value to start the z-index from. 

	var list = [];

	window.zManager = {
		add: function zManager$add(element, index) {
			///<summary>
			/// Adds an element to the managed z-index list. Once managed, an element is guaranteed to have a z-index
			/// larger than its predecessor and smaller than its successor. If the element is already managed
			/// the element is moved to its new location in the z-index list. 
			///</summary>
			///<param name="element">The element to insert into the managed z-index list.</param>
			///<param name="index" optional="true">At which layer to insert the element. If omitted, the element will be added as the top-most layer.</param>
			var existingIndex = this._find(element), entry;

			if (existingIndex !== null) {
				// if it already exists, splice it out
				entry = list.splice(existingIndex, 1)[0];
			}

			if (!entry) {
				entry = {
					element: element,
					layer: 0,
					unmanagedIndex: $(element).css('z-index') // remember what the unmanaged value of z-index was
				};
			} else {
				entry.layer = 0;
			}

			if (typeof index === 'undefined') {
				list.push(entry);
				this._updateZIndexes(list.length - 1);
			} else {
				list.splice(index, 0, entry);
				this._updateZIndexes(index);
			}
		},
		remove: function zManager$remove(element) {
			///<summary>
			/// Removes an element from the managed z-index list.
			///</summary>
			var existingIndex = this._find(element);

			if (existingIndex !== null) {
				// if it already exists, splice it out
				$(element).css('z-index', list[existingIndex].unmanagedIndex); // recall unmanaged value of z-index
				list.splice(existingIndex, 1);
			}
		},

		bringToFront: function zManager$bringToFront(element) {
			///<summary>
			/// Brings an element to the front of the z-index list, ensuring it is the top-most object in the z stack.
			/// This is just a short form for this.add(element);
			///</summary>
			this.add(element);
		},
		moveToBack: function zManager$moveToBack(element) {
			///<summary>
			/// Moves an element to the back of the z-index list, ensuring it is the bottom-most object in the z stack.
			/// This is just a short form for this.add(element, 0);
			///</summary>
			this.add(element, 0);
		},

		maxZIndex: function zManager$maxZIndex() {
			///<summary>
			/// Returns the maximum z-index value issued by the manager.
			///</summary>
			return list[list.length - 1].layer;
		},

		_find: function zManager$_find(element) {
			var existingIndex = null;

			$.each(list, function (i, e) {
				if (e.element === element) {
					existingIndex = i;
					return false;
				}
			});

			return existingIndex;
		},

		_updateZIndexes: function zManager$_updateZIndexes(index) {
			var curr, prev, next,
				first = true;

			curr = list[index];
			if (index !== 0) {
				prev = list[index - 1];
			} else {
				prev = { layer: BASIS - 1 };
			}

			if (index !== list.length - 1) {
				next = list[index + 1];
			}

			while (curr) {
				if (curr.layer <= prev.layer || first) {
					// curr is behind prev, even though it should be ahead
					curr.layer = prev.layer + 1;
					$(curr.element).css('z-index', curr.layer);

					first = false;
				}

				if (next && next.layer > curr.layer) {
					// next is ahead of curr's new value, so the rest of the list is 
					// ordered correctly
					break;
				}

				prev = curr;
				curr = next;

				index++;

				if (index !== list.length - 1) {
					next = list[index + 1];
				} else {
					next = null;
				}
			}
		}
	};
})(jQuery);

