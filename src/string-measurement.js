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