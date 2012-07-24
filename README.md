# grabbag.js - An assortment of UI patterns and functionality

## Description

grabbag.js is an assortment of UI patterns and functionality built on top of
jQuery for use in manipulating some of the crazier aspects of the DOM and 
CSS. The library includes the following set of functionality:

### events-capture

Allows an element to inspect all future instances of an event **before**
it is bubbled up the DOM tree as usual. This allows the captor element
to inspect the incoming event and either mutate it or perform a specific
action in response to an event that is "outside" of its DOM.

### string-measurement

A set of optimized functions that will quickly measure the dimensions of
a string (or set of) strings with a given set of associated styles.

### z-manager

The CSS z-index property is a nightmare to work with in any situation, but
is even worse when trying to build out modular UI pieces which have no
awareness of each other. The z-manager is userful in preventing z-index 
escalation problems like the following

	div { z-index: 9999 /* make it go above the others */ }

from appearing in your CSS files by taking control of z-index away from CSS
and into code.

### ancestorscroll special event

The built in scroll events in the HTML DOM are a nightmare. There are no less
than four events that can potentially fire depending on how and on what the 
user started their scroll action. What is worse, some of the scroll-based
events bubble, while others do not. `ancestorscroll` is a jQuery special
event that aims to bring a bit of sanity to some of the craziness.
  
## Dependencies

A couple of dependencies before the library can be built:

- Node for Windows (A version that includes `npm` by default. I believe 0.6.x has it now)
- Jake installed globally (`npm install -g jake`)
- Uglify-JS installed locally (`npm install uglify-js`)

## Building

Once all the dependencies are installed, you can build the project using the following command line

	jake ugfily

## Licensing

The library is licensed under the MIT License.

