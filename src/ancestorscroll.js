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
