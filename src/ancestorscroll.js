(function ($) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true, jquery:true */
	
	'use strict';
	
	if (!jQuery) {
		return;
	}
	
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

	/**
	  ancestorscroll is a jQuery special event to overcome the nightmare that is the built in HTML DOM
	  scroll events. There are no less than four events that can potentially fire depending on how and on what
	  the user started their scroll action. What is worse, some of the scroll-based events bubble, while others do not.
	*/
	$.event.special.ancestorscroll = {
		add: function (handleObj) {
			rebind(this, handleObj, 'bind');
		},
		remove: function (handleObj) {
			rebind(this, handleObj, 'unbind');
		}
	};
})(jQuery);
