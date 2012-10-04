(function($, undefined) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, browser:true, jquery:true */
	/*global grabbag:true */
	
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

	grabbag.event = {
		/**
		  When an event is "captured", all future instances of that event will first get routed through the
		  element who called for the capture before bubbling up the DOM tree as usual. This allows the
		  captor element to inspect the incoming event and either mutate it, or perform a specific action
		  in response to an event that is "outside" of its DOM.
		  Once an event is captured, if that event is triggered, the matching 'captured' version of that event
		  is triggered on the captor element. So for example, if you capture the 'mousedown' event with element x,
		  a 'capturedmousedown' event is first triggered on element x before the usual mousedown trigger and bubble.
		  Note that captured events "stack", meaning that if an existing captor exists for an event and that event
		  is captured again, a subsequent releaseEvent call will reroute events to that captor.
		  
		  This functionality is based on the WIN32 SetCapture API which routes all mouse events through a particular
		  window. For more information: http://msdn.microsoft.com/en-us/library/ms646262%28VS.85%29.aspx
		
		  @param eventName The name of the DOM event to capture.
		  @param element The DOM element that is designated as the captor.
		  @handler The function to call that will inspect the captured event.
		    When the handler is bound through this function, it will be unbound when calling grabbag.event.release.
		    Otherwise, you can bind the handler manually by writing $(element).bind('captured' + eventName, function(eventArgs() {});
		    The eventArgs.originalTarget property contains the DOM element that initially triggered the event.
		
		  @remarks 
		  Although it is highly recommended that the element argument be an actual DOM element, the code
		  does not make this check and the parameter can just as easily be an object literal. This functionality
		  is not tested and should be avoided.
		*/
		capture: function event$capture(eventName, element, handler) {
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
		},
		/**
		  Releases the current capture on the event specified by eventName.
		  If eventName is not captured, this function is effectively a no-op.
		*/
		release: function event$release(eventName) {
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
		}
	};
})(jQuery);