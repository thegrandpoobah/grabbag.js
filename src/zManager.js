(function ($, undefined) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true, jquery:true */
	/*global grabbag:true */

	'use strict';

	var BASIS = 1; // The value to start the z-index from. 

	var list = [];

	function updateZIndexes(index) {
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

	function find(element) {
		var existingIndex = null;

		$.each(list, function (i, e) {
			if (e.element === element) {
				existingIndex = i;
				return false;
			}
		});

		return existingIndex;
	}

	/**
	  Provides a mechanism to maintain an ordered list of DOM elements and ensures that they are
	  ordered back-to-front in the browser's z-ordering. The list is live, which means that any
	  modification to the list results in an update to the browser's DOM.
	*/
	grabbag.zManager = {
		/**
		  Adds an element to the managed z-index list. Once managed, an element is guaranteed to have a z-index
		  larger than its predecessor and smaller than its successor. If the element is already managed
		  the element is moved to its new location in the z-index list. 
		  
		  @param element The element to insert into the managed z-index list.
		  @param index At which layer to insert the element. If omitted, the element will be added as the
		         top-most layer.
		*/
		add: function zManager$add(element, index) {
			var existingIndex = find(element), entry;

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
				updateZIndexes(list.length - 1);
			} else {
				list.splice(index, 0, entry);
				updateZIndexes(index);
			}
		},
		/**
		  Removes an element from the managed z-index list.
		  
		  @param element The elemetn to remove from the managed z-index list.
		*/
		remove: function zManager$remove(element) {
			var existingIndex = find(element);

			if (existingIndex !== null) {
				// if it already exists, splice it out
				$(element).css('z-index', list[existingIndex].unmanagedIndex); // recall unmanaged value of z-index
				list.splice(existingIndex, 1);
			}
		},

		/**
		  Brings an element to the front of the z-index list, ensuring it is the top-most object in the z stack.
		  This is just a short form for this.add(element);
		  
		  @param element The element to bring to the front of the managed z-index list.
		*/
		bringToFront: function zManager$bringToFront(element) {
			this.add(element);
		},
		/**
		  Moves an element to the back of the z-index list, ensuring it is the bottom-most object in the z stack.
		  This is basically syntactic sugar for this.add(element, 0);
		  
		  @param element The element to move to the back of the managed z-index list.
		*/
		moveToBack: function zManager$moveToBack(element) {
			this.add(element, 0);
		},

		/**
		  Returns the maximum z-index value issued by the manager.
		  
		  @returns An integer representing the maximum CSS z-index value issued by the z-Manager.
		*/
		maxZIndex: function zManager$maxZIndex() {
			return list[list.length - 1].layer;
		}
	};
})(jQuery);
