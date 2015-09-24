/*!
 *  * halon - JavaScript Hypermedia Client
 *  * Author: LeanKit
 *  * Version: v0.3.2
 *  * Url: https://github.com/LeanKit-Labs/halon
 *  * License(s): MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lodash"), require("machina"));
	else if(typeof define === 'function' && define.amd)
		define(["lodash", "machina"], factory);
	else if(typeof exports === 'object')
		exports["halon"] = factory(require("lodash"), require("machina"));
	else
		root["halon"] = factory(root["_"], root["machina"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
	var _ = _interopRequire(__webpack_require__(2));
	
	var machina = _interopRequire(__webpack_require__(3));
	
	var when = _interopRequire(__webpack_require__(4));
	
	var URI = _interopRequire(__webpack_require__(24));
	
	__webpack_require__(29);
	
	var _defaultAdapter = undefined;
	
	function expandLink(action, data) {
		var href = URI.expand(action.href, data).href();
		var query = data["?"];
		if (query) {
			href = href + "?" + _.map(query, function (val, param) {
				return param + "=" + URI.encode(val);
			}).join("&");
			delete data["?"];
		} else if (action.parameters) {
			href = href + "?" + _.compact(_.map(action.parameters, function (param, key) {
				if (data[key]) {
					return key + "=" + URI.encode(data[key]);
				}
			})).join("&");
		}
		return href;
	}
	
	function invokeResource(fsm, key) {
		var data = arguments[2] === undefined ? {} : arguments[2];
		var headers = arguments[3] === undefined ? {} : arguments[3];
	
		return when.promise((function (resolve, reject) {
			fsm.handle("invoke.resource", this, key, data, headers, resolve, reject);
		}).bind(this));
	}
	
	function processResponse(response, fsm) {
		// don't bother with all this if the response is an empty body
		if (_.isEmpty(response) || _.isString(response)) {
			return response;
		}
		// detect whether or not a top-level list of collections has been returned
		if (!response._links) {
			var listKey = Object.keys(response).filter(function (x) {
				return x !== "_origin";
			})[0];
			var base = { _origin: response._origin };
			base[listKey] = _.map(response[listKey], function (item) {
				return processEmbedded(processLinks(item, fsm));
			});
			return base;
		} else {
			return processEmbedded(processLinks(response, fsm));
		}
	}
	
	function processEmbedded(response) {
		if (response._embedded) {
			_.each(response._embedded, function (value, key) {
				processEmbedded(value);
				response[key] = value;
			});
			delete response._embedded;
		}
		return response;
	}
	
	function processLinks(options, fsm) {
		var actions = options;
		_.each(options._links, function (linkDef, relKey) {
			var splitKey = relKey.split(":");
			var rel = relKey;
			var target = actions;
			if (splitKey.length === 2) {
				target = actions[splitKey[0]] = actions[splitKey[0]] || {};
				rel = splitKey[1];
			}
			target[rel] = invokeResource.bind(options, fsm, relKey);
		});
		return options;
	}
	
	function processKnownOptions(knownOptions) {
		var x = _.reduce(knownOptions, function (memo, rels, resource) {
			rels.forEach(function (rel) {
				memo._links[resource + ":" + rel] = undefined;
			});
			return memo;
		}, { _links: {} });
		return x;
	}
	
	var HalonClientFsm = machina.Fsm.extend({
	
		initialize: function initialize(options) {
			_.extend(this.client, processLinks(processKnownOptions(options.knownOptions), this));
		},
	
		states: {
			uninitialized: {
				connect: "initializing",
				"invoke.resource": function invokeResource() {
					this.deferUntilTransition("ready");
				}
			},
			initializing: {
				_onEnter: function _onEnter() {
					this.adapter({ href: this.root, method: "OPTIONS" }, { headers: this.getHeaders(), server: this.server }).then(this.handle.bind(this, "root.loaded"), (function (err) {
						console.warn(err);
						this.connectionError = err;
						this.transition("connection.failed");
					}).bind(this));
				},
				"root.loaded": function rootLoaded(options) {
					_.merge(this.client, processLinks(options, this));
					this.transition("ready");
				},
				"invoke.resource": function invokeResource() {
					this.deferUntilTransition("ready");
				}
			},
			ready: {
				_onEnter: function _onEnter() {
					if (this.client.deferred) {
						this.client.deferred.resolve(this.client);
						this.client.deferred = undefined;
					}
				},
				"invoke.resource": function invokeResource(resource, rel, data, headers, success, err) {
					var resourceDef = resource._links[rel];
					if (!resourceDef) {
						throw new Error("No link definition for rel '" + rel + "'");
					}
					if (resourceDef.templated || resourceDef.parameters || data["?"]) {
						resourceDef = _.extend({}, resourceDef, { href: expandLink(resourceDef, data) });
					}
					if (data.body) {
						data = data.body;
					}
					this.adapter(resourceDef, { data: data, headers: this.getHeaders(headers), server: this.server }).then((function (response) {
						return processResponse(response, this);
					}).bind(this)).then(success, err);
				}
			},
			"connection.failed": {
				_onEnter: function _onEnter() {
					if (this.client.deferred) {
						this.client.deferred.reject(this.connectionError);
						this.client.deferred = undefined;
					}
				},
				connect: "initializing",
				"invoke.resource": function invokeResource(resource, rel, data, headers, success, err) {
					err(this.connectionError);
				}
			}
		},
	
		getHeaders: function getHeaders(hdrs) {
			return _.extend({}, this.headers, hdrs || {}, { Accept: "application/hal.v" + this.version + "+json" });
		}
	});
	
	var halonFactory = function halonFactory(options) {
		var defaults = {
			version: 1,
			knownOptions: {},
			adapter: _defaultAdapter,
			headers: {}
		};
	
		var client = function halonInstance() {
			var args = Array.prototype.slice.call(arguments, 0);
			return when.all(args);
		};
		options = _.defaults(options, defaults);
		var server = /http(s)?[:][\/]{2}[^\/]*/.exec(options.root);
		options.server = server ? server[0] : undefined;
		options.client = client;
	
		var fsm = client.fsm = new HalonClientFsm(options);
		function listenFor(state, cb, persist) {
			if (fsm.state === state) {
				cb(client);
			}
			var listener;
			listener = fsm.on("transition", function (data) {
				// this is necessary to ensure that the promise resolves
				// before invoking the event listener callback!
				process.nextTick(function () {
					if (data.toState === state) {
						if (!persist) {
							listener.off();
						}
						cb(client, fsm.connectionError, listener);
					}
				});
			});
		};
	
		client.on = function (eventName, cb, persist) {
			if (eventName === "ready") {
				listenFor("ready", cb, persist);
			} else if (eventName === "rejected") {
				listenFor("connection.failed", cb, persist);
			} else {
				throw new Error("Only 'ready' and 'rejected' events are supported by this emitter.");
			}
			return client;
		};
	
		client.connect = function () {
			var pending = this.deferred && this.deferred.promise.inspect().state !== "fulfilled";
			if (!pending) {
				this.deferred = when.defer();
				fsm.handle("connect");
			}
			return this.deferred.promise;
		};
	
		if (options.start) {
			setTimeout(function () {
				client.connect()["catch"](function () {});
			}, 0);
		}
	
		return client;
	};
	
	halonFactory.defaultAdapter = function (adapter) {
		_defaultAdapter = adapter;
		return halonFactory;
	};
	
	halonFactory.jQueryAdapter = function ($) {
		var autoStringify = ["PATCH", "POST", "PUT"];
		return function (link, options) {
			var ajaxDef = {
				url: link.href,
				type: link.method,
				headers: options.headers,
				dataType: "json",
				data: options.data
			};
	
			if (options.data && _.contains(autoStringify, link.method.toUpperCase())) {
				ajaxDef.data = typeof options.data === "string" ? options.data : JSON.stringify(options.data);
				ajaxDef.contentType = "application/json";
			}
	
			return when.promise(function (resolve, reject) {
				$.ajax(ajaxDef).then(resolve, function (jqXhr, respText, e) {
					var err = new Error(e);
					err.status = jqXhr.status;
					reject(err);
				});
			});
		};
	};
	
	halonFactory.requestAdapter = function (request) {
		return function (link, options) {
			var formData = undefined;
			if (options.data && options.data.formData) {
				formData = options.data.formData;
				delete options.data.formData;
			}
			var json = _.isString(options.data) ? JSON.parse(options.data) : options.data;
			var url = link.href.indexOf(options.server) < 0 ? options.server + link.href : link.href;
			var requestOptions = {
				url: url,
				method: link.method,
				headers: options.headers
			};
			if (formData) {
				requestOptions.formData = formData;
			} else if (json && !_.isEmpty(json)) {
				requestOptions.json = json;
				requestOptions.headers["Content-Type"] = "application/json";
			}
			return when.promise(function (resolve, reject) {
				request(requestOptions, function (err, resp, body) {
					var json = undefined;
					if (body && body[0] === "{") {
						var isJson = body && body !== "" && body !== "{}";
						json = isJson ? JSON.parse(body) : {};
						json.status = resp.statusCode;
					} else if (body) {
						body.status = resp.statusCode;
					}
					if (err) {
						reject(err);
					} else if (resp.statusCode >= 400) {
						reject(json || body);
					} else {
						resolve(json || body);
					}
				});
			});
		};
	};
	
	module.exports = halonFactory;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 1 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	
	/**
	 * Promises/A+ and when() implementation
	 * when is part of the cujoJS family of libraries (http://cujojs.com/)
	 * @author Brian Cavalier
	 * @author John Hann
	 */
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require) {
	
		var timed = __webpack_require__(5);
		var array = __webpack_require__(10);
		var flow = __webpack_require__(13);
		var fold = __webpack_require__(14);
		var inspect = __webpack_require__(15);
		var generate = __webpack_require__(16);
		var progress = __webpack_require__(17);
		var withThis = __webpack_require__(18);
		var unhandledRejection = __webpack_require__(19);
		var TimeoutError = __webpack_require__(9);
	
		var Promise = [array, flow, fold, generate, progress,
			inspect, withThis, timed, unhandledRejection]
			.reduce(function(Promise, feature) {
				return feature(Promise);
			}, __webpack_require__(21));
	
		var apply = __webpack_require__(12)(Promise);
	
		// Public API
	
		when.promise     = promise;              // Create a pending promise
		when.resolve     = Promise.resolve;      // Create a resolved promise
		when.reject      = Promise.reject;       // Create a rejected promise
	
		when.lift        = lift;                 // lift a function to return promises
		when['try']      = attempt;              // call a function and return a promise
		when.attempt     = attempt;              // alias for when.try
	
		when.iterate     = Promise.iterate;      // DEPRECATED (use cujojs/most streams) Generate a stream of promises
		when.unfold      = Promise.unfold;       // DEPRECATED (use cujojs/most streams) Generate a stream of promises
	
		when.join        = join;                 // Join 2 or more promises
	
		when.all         = all;                  // Resolve a list of promises
		when.settle      = settle;               // Settle a list of promises
	
		when.any         = lift(Promise.any);    // One-winner race
		when.some        = lift(Promise.some);   // Multi-winner race
		when.race        = lift(Promise.race);   // First-to-settle race
	
		when.map         = map;                  // Array.map() for promises
		when.filter      = filter;               // Array.filter() for promises
		when.reduce      = lift(Promise.reduce);       // Array.reduce() for promises
		when.reduceRight = lift(Promise.reduceRight);  // Array.reduceRight() for promises
	
		when.isPromiseLike = isPromiseLike;      // Is something promise-like, aka thenable
	
		when.Promise     = Promise;              // Promise constructor
		when.defer       = defer;                // Create a {promise, resolve, reject} tuple
	
		// Error types
	
		when.TimeoutError = TimeoutError;
	
		/**
		 * Get a trusted promise for x, or by transforming x with onFulfilled
		 *
		 * @param {*} x
		 * @param {function?} onFulfilled callback to be called when x is
		 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
		 *   will be invoked immediately.
		 * @param {function?} onRejected callback to be called when x is
		 *   rejected.
		 * @param {function?} onProgress callback to be called when progress updates
		 *   are issued for x. @deprecated
		 * @returns {Promise} a new promise that will fulfill with the return
		 *   value of callback or errback or the completion value of promiseOrValue if
		 *   callback and/or errback is not supplied.
		 */
		function when(x, onFulfilled, onRejected, onProgress) {
			var p = Promise.resolve(x);
			if (arguments.length < 2) {
				return p;
			}
	
			return p.then(onFulfilled, onRejected, onProgress);
		}
	
		/**
		 * Creates a new promise whose fate is determined by resolver.
		 * @param {function} resolver function(resolve, reject, notify)
		 * @returns {Promise} promise whose fate is determine by resolver
		 */
		function promise(resolver) {
			return new Promise(resolver);
		}
	
		/**
		 * Lift the supplied function, creating a version of f that returns
		 * promises, and accepts promises as arguments.
		 * @param {function} f
		 * @returns {Function} version of f that returns promises
		 */
		function lift(f) {
			return function() {
				for(var i=0, l=arguments.length, a=new Array(l); i<l; ++i) {
					a[i] = arguments[i];
				}
				return apply(f, this, a);
			};
		}
	
		/**
		 * Call f in a future turn, with the supplied args, and return a promise
		 * for the result.
		 * @param {function} f
		 * @returns {Promise}
		 */
		function attempt(f /*, args... */) {
			/*jshint validthis:true */
			for(var i=0, l=arguments.length-1, a=new Array(l); i<l; ++i) {
				a[i] = arguments[i+1];
			}
			return apply(f, this, a);
		}
	
		/**
		 * Creates a {promise, resolver} pair, either or both of which
		 * may be given out safely to consumers.
		 * @return {{promise: Promise, resolve: function, reject: function, notify: function}}
		 */
		function defer() {
			return new Deferred();
		}
	
		function Deferred() {
			var p = Promise._defer();
	
			function resolve(x) { p._handler.resolve(x); }
			function reject(x) { p._handler.reject(x); }
			function notify(x) { p._handler.notify(x); }
	
			this.promise = p;
			this.resolve = resolve;
			this.reject = reject;
			this.notify = notify;
			this.resolver = { resolve: resolve, reject: reject, notify: notify };
		}
	
		/**
		 * Determines if x is promise-like, i.e. a thenable object
		 * NOTE: Will return true for *any thenable object*, and isn't truly
		 * safe, since it may attempt to access the `then` property of x (i.e.
		 *  clever/malicious getters may do weird things)
		 * @param {*} x anything
		 * @returns {boolean} true if x is promise-like
		 */
		function isPromiseLike(x) {
			return x && typeof x.then === 'function';
		}
	
		/**
		 * Return a promise that will resolve only once all the supplied arguments
		 * have resolved. The resolution value of the returned promise will be an array
		 * containing the resolution values of each of the arguments.
		 * @param {...*} arguments may be a mix of promises and values
		 * @returns {Promise}
		 */
		function join(/* ...promises */) {
			return Promise.all(arguments);
		}
	
		/**
		 * Return a promise that will fulfill once all input promises have
		 * fulfilled, or reject when any one input promise rejects.
		 * @param {array|Promise} promises array (or promise for an array) of promises
		 * @returns {Promise}
		 */
		function all(promises) {
			return when(promises, Promise.all);
		}
	
		/**
		 * Return a promise that will always fulfill with an array containing
		 * the outcome states of all input promises.  The returned promise
		 * will only reject if `promises` itself is a rejected promise.
		 * @param {array|Promise} promises array (or promise for an array) of promises
		 * @returns {Promise} promise for array of settled state descriptors
		 */
		function settle(promises) {
			return when(promises, Promise.settle);
		}
	
		/**
		 * Promise-aware array map function, similar to `Array.prototype.map()`,
		 * but input array may contain promises or values.
		 * @param {Array|Promise} promises array of anything, may contain promises and values
		 * @param {function(x:*, index:Number):*} mapFunc map function which may
		 *  return a promise or value
		 * @returns {Promise} promise that will fulfill with an array of mapped values
		 *  or reject if any input promise rejects.
		 */
		function map(promises, mapFunc) {
			return when(promises, function(promises) {
				return Promise.map(promises, mapFunc);
			});
		}
	
		/**
		 * Filter the provided array of promises using the provided predicate.  Input may
		 * contain promises and values
		 * @param {Array|Promise} promises array of promises and values
		 * @param {function(x:*, index:Number):boolean} predicate filtering predicate.
		 *  Must return truthy (or promise for truthy) for items to retain.
		 * @returns {Promise} promise that will fulfill with an array containing all items
		 *  for which predicate returned truthy.
		 */
		function filter(promises, predicate) {
			return when(promises, function(promises) {
				return Promise.filter(promises, predicate);
			});
		}
	
		return when;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	})(__webpack_require__(8));


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
	
		var env = __webpack_require__(6);
		var TimeoutError = __webpack_require__(9);
	
		function setTimeout(f, ms, x, y) {
			return env.setTimer(function() {
				f(x, y, ms);
			}, ms);
		}
	
		return function timed(Promise) {
			/**
			 * Return a new promise whose fulfillment value is revealed only
			 * after ms milliseconds
			 * @param {number} ms milliseconds
			 * @returns {Promise}
			 */
			Promise.prototype.delay = function(ms) {
				var p = this._beget();
				this._handler.fold(handleDelay, ms, void 0, p._handler);
				return p;
			};
	
			function handleDelay(ms, x, h) {
				setTimeout(resolveDelay, ms, x, h);
			}
	
			function resolveDelay(x, h) {
				h.resolve(x);
			}
	
			/**
			 * Return a new promise that rejects after ms milliseconds unless
			 * this promise fulfills earlier, in which case the returned promise
			 * fulfills with the same value.
			 * @param {number} ms milliseconds
			 * @param {Error|*=} reason optional rejection reason to use, defaults
			 *   to a TimeoutError if not provided
			 * @returns {Promise}
			 */
			Promise.prototype.timeout = function(ms, reason) {
				var p = this._beget();
				var h = p._handler;
	
				var t = setTimeout(onTimeout, ms, reason, p._handler);
	
				this._handler.visit(h,
					function onFulfill(x) {
						env.clearTimer(t);
						this.resolve(x); // this = h
					},
					function onReject(x) {
						env.clearTimer(t);
						this.reject(x); // this = h
					},
					h.notify);
	
				return p;
			};
	
			function onTimeout(reason, h, ms) {
				var e = typeof reason === 'undefined'
					? new TimeoutError('timed out after ' + ms + 'ms')
					: reason;
				h.reject(e);
			}
	
			return Promise;
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var require;var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process) {/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	/*global process,document,setTimeout,clearTimeout,MutationObserver,WebKitMutationObserver*/
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
		/*jshint maxcomplexity:6*/
	
		// Sniff "best" async scheduling option
		// Prefer process.nextTick or MutationObserver, then check for
		// setTimeout, and finally vertx, since its the only env that doesn't
		// have setTimeout
	
		var MutationObs;
		var capturedSetTimeout = typeof setTimeout !== 'undefined' && setTimeout;
	
		// Default env
		var setTimer = function(f, ms) { return setTimeout(f, ms); };
		var clearTimer = function(t) { return clearTimeout(t); };
		var asap = function (f) { return capturedSetTimeout(f, 0); };
	
		// Detect specific env
		if (isNode()) { // Node
			asap = function (f) { return process.nextTick(f); };
	
		} else if (MutationObs = hasMutationObserver()) { // Modern browser
			asap = initMutationObserver(MutationObs);
	
		} else if (!capturedSetTimeout) { // vert.x
			var vertxRequire = require;
			var vertx = __webpack_require__(7);
			setTimer = function (f, ms) { return vertx.setTimer(ms, f); };
			clearTimer = vertx.cancelTimer;
			asap = vertx.runOnLoop || vertx.runOnContext;
		}
	
		return {
			setTimer: setTimer,
			clearTimer: clearTimer,
			asap: asap
		};
	
		function isNode () {
			return typeof process !== 'undefined' &&
				Object.prototype.toString.call(process) === '[object process]';
		}
	
		function hasMutationObserver () {
			return (typeof MutationObserver === 'function' && MutationObserver) ||
				(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver);
		}
	
		function initMutationObserver(MutationObserver) {
			var scheduled;
			var node = document.createTextNode('');
			var o = new MutationObserver(run);
			o.observe(node, { characterData: true });
	
			function run() {
				var f = scheduled;
				scheduled = void 0;
				f();
			}
	
			var i = 0;
			return function (f) {
				scheduled = f;
				node.data = (i ^= 1);
			};
		}
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 7 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		/**
		 * Custom error type for promises rejected by promise.timeout
		 * @param {string} message
		 * @constructor
		 */
		function TimeoutError (message) {
			Error.call(this);
			this.message = message;
			this.name = TimeoutError.name;
			if (typeof Error.captureStackTrace === 'function') {
				Error.captureStackTrace(this, TimeoutError);
			}
		}
	
		TimeoutError.prototype = Object.create(Error.prototype);
		TimeoutError.prototype.constructor = TimeoutError;
	
		return TimeoutError;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
	
		var state = __webpack_require__(11);
		var applier = __webpack_require__(12);
	
		return function array(Promise) {
	
			var applyFold = applier(Promise);
			var toPromise = Promise.resolve;
			var all = Promise.all;
	
			var ar = Array.prototype.reduce;
			var arr = Array.prototype.reduceRight;
			var slice = Array.prototype.slice;
	
			// Additional array combinators
	
			Promise.any = any;
			Promise.some = some;
			Promise.settle = settle;
	
			Promise.map = map;
			Promise.filter = filter;
			Promise.reduce = reduce;
			Promise.reduceRight = reduceRight;
	
			/**
			 * When this promise fulfills with an array, do
			 * onFulfilled.apply(void 0, array)
			 * @param {function} onFulfilled function to apply
			 * @returns {Promise} promise for the result of applying onFulfilled
			 */
			Promise.prototype.spread = function(onFulfilled) {
				return this.then(all).then(function(array) {
					return onFulfilled.apply(this, array);
				});
			};
	
			return Promise;
	
			/**
			 * One-winner competitive race.
			 * Return a promise that will fulfill when one of the promises
			 * in the input array fulfills, or will reject when all promises
			 * have rejected.
			 * @param {array} promises
			 * @returns {Promise} promise for the first fulfilled value
			 */
			function any(promises) {
				var p = Promise._defer();
				var resolver = p._handler;
				var l = promises.length>>>0;
	
				var pending = l;
				var errors = [];
	
				for (var h, x, i = 0; i < l; ++i) {
					x = promises[i];
					if(x === void 0 && !(i in promises)) {
						--pending;
						continue;
					}
	
					h = Promise._handler(x);
					if(h.state() > 0) {
						resolver.become(h);
						Promise._visitRemaining(promises, i, h);
						break;
					} else {
						h.visit(resolver, handleFulfill, handleReject);
					}
				}
	
				if(pending === 0) {
					resolver.reject(new RangeError('any(): array must not be empty'));
				}
	
				return p;
	
				function handleFulfill(x) {
					/*jshint validthis:true*/
					errors = null;
					this.resolve(x); // this === resolver
				}
	
				function handleReject(e) {
					/*jshint validthis:true*/
					if(this.resolved) { // this === resolver
						return;
					}
	
					errors.push(e);
					if(--pending === 0) {
						this.reject(errors);
					}
				}
			}
	
			/**
			 * N-winner competitive race
			 * Return a promise that will fulfill when n input promises have
			 * fulfilled, or will reject when it becomes impossible for n
			 * input promises to fulfill (ie when promises.length - n + 1
			 * have rejected)
			 * @param {array} promises
			 * @param {number} n
			 * @returns {Promise} promise for the earliest n fulfillment values
			 *
			 * @deprecated
			 */
			function some(promises, n) {
				/*jshint maxcomplexity:7*/
				var p = Promise._defer();
				var resolver = p._handler;
	
				var results = [];
				var errors = [];
	
				var l = promises.length>>>0;
				var nFulfill = 0;
				var nReject;
				var x, i; // reused in both for() loops
	
				// First pass: count actual array items
				for(i=0; i<l; ++i) {
					x = promises[i];
					if(x === void 0 && !(i in promises)) {
						continue;
					}
					++nFulfill;
				}
	
				// Compute actual goals
				n = Math.max(n, 0);
				nReject = (nFulfill - n + 1);
				nFulfill = Math.min(n, nFulfill);
	
				if(n > nFulfill) {
					resolver.reject(new RangeError('some(): array must contain at least '
					+ n + ' item(s), but had ' + nFulfill));
				} else if(nFulfill === 0) {
					resolver.resolve(results);
				}
	
				// Second pass: observe each array item, make progress toward goals
				for(i=0; i<l; ++i) {
					x = promises[i];
					if(x === void 0 && !(i in promises)) {
						continue;
					}
	
					Promise._handler(x).visit(resolver, fulfill, reject, resolver.notify);
				}
	
				return p;
	
				function fulfill(x) {
					/*jshint validthis:true*/
					if(this.resolved) { // this === resolver
						return;
					}
	
					results.push(x);
					if(--nFulfill === 0) {
						errors = null;
						this.resolve(results);
					}
				}
	
				function reject(e) {
					/*jshint validthis:true*/
					if(this.resolved) { // this === resolver
						return;
					}
	
					errors.push(e);
					if(--nReject === 0) {
						results = null;
						this.reject(errors);
					}
				}
			}
	
			/**
			 * Apply f to the value of each promise in a list of promises
			 * and return a new list containing the results.
			 * @param {array} promises
			 * @param {function(x:*, index:Number):*} f mapping function
			 * @returns {Promise}
			 */
			function map(promises, f) {
				return Promise._traverse(f, promises);
			}
	
			/**
			 * Filter the provided array of promises using the provided predicate.  Input may
			 * contain promises and values
			 * @param {Array} promises array of promises and values
			 * @param {function(x:*, index:Number):boolean} predicate filtering predicate.
			 *  Must return truthy (or promise for truthy) for items to retain.
			 * @returns {Promise} promise that will fulfill with an array containing all items
			 *  for which predicate returned truthy.
			 */
			function filter(promises, predicate) {
				var a = slice.call(promises);
				return Promise._traverse(predicate, a).then(function(keep) {
					return filterSync(a, keep);
				});
			}
	
			function filterSync(promises, keep) {
				// Safe because we know all promises have fulfilled if we've made it this far
				var l = keep.length;
				var filtered = new Array(l);
				for(var i=0, j=0; i<l; ++i) {
					if(keep[i]) {
						filtered[j++] = Promise._handler(promises[i]).value;
					}
				}
				filtered.length = j;
				return filtered;
	
			}
	
			/**
			 * Return a promise that will always fulfill with an array containing
			 * the outcome states of all input promises.  The returned promise
			 * will never reject.
			 * @param {Array} promises
			 * @returns {Promise} promise for array of settled state descriptors
			 */
			function settle(promises) {
				return all(promises.map(settleOne));
			}
	
			function settleOne(p) {
				var h = Promise._handler(p);
				if(h.state() === 0) {
					return toPromise(p).then(state.fulfilled, state.rejected);
				}
	
				h._unreport();
				return state.inspect(h);
			}
	
			/**
			 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
			 * input may contain promises and/or values, and reduceFunc
			 * may return either a value or a promise, *and* initialValue may
			 * be a promise for the starting value.
			 * @param {Array|Promise} promises array or promise for an array of anything,
			 *      may contain a mix of promises and values.
			 * @param {function(accumulated:*, x:*, index:Number):*} f reduce function
			 * @returns {Promise} that will resolve to the final reduced value
			 */
			function reduce(promises, f /*, initialValue */) {
				return arguments.length > 2 ? ar.call(promises, liftCombine(f), arguments[2])
						: ar.call(promises, liftCombine(f));
			}
	
			/**
			 * Traditional reduce function, similar to `Array.prototype.reduceRight()`, but
			 * input may contain promises and/or values, and reduceFunc
			 * may return either a value or a promise, *and* initialValue may
			 * be a promise for the starting value.
			 * @param {Array|Promise} promises array or promise for an array of anything,
			 *      may contain a mix of promises and values.
			 * @param {function(accumulated:*, x:*, index:Number):*} f reduce function
			 * @returns {Promise} that will resolve to the final reduced value
			 */
			function reduceRight(promises, f /*, initialValue */) {
				return arguments.length > 2 ? arr.call(promises, liftCombine(f), arguments[2])
						: arr.call(promises, liftCombine(f));
			}
	
			function liftCombine(f) {
				return function(z, x, i) {
					return applyFold(f, void 0, [z,x,i]);
				};
			}
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return {
			pending: toPendingState,
			fulfilled: toFulfilledState,
			rejected: toRejectedState,
			inspect: inspect
		};
	
		function toPendingState() {
			return { state: 'pending' };
		}
	
		function toRejectedState(e) {
			return { state: 'rejected', reason: e };
		}
	
		function toFulfilledState(x) {
			return { state: 'fulfilled', value: x };
		}
	
		function inspect(handler) {
			var state = handler.state();
			return state === 0 ? toPendingState()
				 : state > 0   ? toFulfilledState(handler.value)
				               : toRejectedState(handler.value);
		}
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		makeApply.tryCatchResolve = tryCatchResolve;
	
		return makeApply;
	
		function makeApply(Promise, call) {
			if(arguments.length < 2) {
				call = tryCatchResolve;
			}
	
			return apply;
	
			function apply(f, thisArg, args) {
				var p = Promise._defer();
				var l = args.length;
				var params = new Array(l);
				callAndResolve({ f:f, thisArg:thisArg, args:args, params:params, i:l-1, call:call }, p._handler);
	
				return p;
			}
	
			function callAndResolve(c, h) {
				if(c.i < 0) {
					return call(c.f, c.thisArg, c.params, h);
				}
	
				var handler = Promise._handler(c.args[c.i]);
				handler.fold(callAndResolveNext, c, void 0, h);
			}
	
			function callAndResolveNext(c, x, h) {
				c.params[c.i] = x;
				c.i -= 1;
				callAndResolve(c, h);
			}
		}
	
		function tryCatchResolve(f, thisArg, args, resolver) {
			try {
				resolver.resolve(f.apply(thisArg, args));
			} catch(e) {
				resolver.reject(e);
			}
		}
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));
	
	


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return function flow(Promise) {
	
			var resolve = Promise.resolve;
			var reject = Promise.reject;
			var origCatch = Promise.prototype['catch'];
	
			/**
			 * Handle the ultimate fulfillment value or rejection reason, and assume
			 * responsibility for all errors.  If an error propagates out of result
			 * or handleFatalError, it will be rethrown to the host, resulting in a
			 * loud stack track on most platforms and a crash on some.
			 * @param {function?} onResult
			 * @param {function?} onError
			 * @returns {undefined}
			 */
			Promise.prototype.done = function(onResult, onError) {
				this._handler.visit(this._handler.receiver, onResult, onError);
			};
	
			/**
			 * Add Error-type and predicate matching to catch.  Examples:
			 * promise.catch(TypeError, handleTypeError)
			 *   .catch(predicate, handleMatchedErrors)
			 *   .catch(handleRemainingErrors)
			 * @param onRejected
			 * @returns {*}
			 */
			Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
				if (arguments.length < 2) {
					return origCatch.call(this, onRejected);
				}
	
				if(typeof onRejected !== 'function') {
					return this.ensure(rejectInvalidPredicate);
				}
	
				return origCatch.call(this, createCatchFilter(arguments[1], onRejected));
			};
	
			/**
			 * Wraps the provided catch handler, so that it will only be called
			 * if the predicate evaluates truthy
			 * @param {?function} handler
			 * @param {function} predicate
			 * @returns {function} conditional catch handler
			 */
			function createCatchFilter(handler, predicate) {
				return function(e) {
					return evaluatePredicate(e, predicate)
						? handler.call(this, e)
						: reject(e);
				};
			}
	
			/**
			 * Ensures that onFulfilledOrRejected will be called regardless of whether
			 * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
			 * receive the promises' value or reason.  Any returned value will be disregarded.
			 * onFulfilledOrRejected may throw or return a rejected promise to signal
			 * an additional error.
			 * @param {function} handler handler to be called regardless of
			 *  fulfillment or rejection
			 * @returns {Promise}
			 */
			Promise.prototype['finally'] = Promise.prototype.ensure = function(handler) {
				if(typeof handler !== 'function') {
					return this;
				}
	
				return this.then(function(x) {
					return runSideEffect(handler, this, identity, x);
				}, function(e) {
					return runSideEffect(handler, this, reject, e);
				});
			};
	
			function runSideEffect (handler, thisArg, propagate, value) {
				var result = handler.call(thisArg);
				return maybeThenable(result)
					? propagateValue(result, propagate, value)
					: propagate(value);
			}
	
			function propagateValue (result, propagate, x) {
				return resolve(result).then(function () {
					return propagate(x);
				});
			}
	
			/**
			 * Recover from a failure by returning a defaultValue.  If defaultValue
			 * is a promise, it's fulfillment value will be used.  If defaultValue is
			 * a promise that rejects, the returned promise will reject with the
			 * same reason.
			 * @param {*} defaultValue
			 * @returns {Promise} new promise
			 */
			Promise.prototype['else'] = Promise.prototype.orElse = function(defaultValue) {
				return this.then(void 0, function() {
					return defaultValue;
				});
			};
	
			/**
			 * Shortcut for .then(function() { return value; })
			 * @param  {*} value
			 * @return {Promise} a promise that:
			 *  - is fulfilled if value is not a promise, or
			 *  - if value is a promise, will fulfill with its value, or reject
			 *    with its reason.
			 */
			Promise.prototype['yield'] = function(value) {
				return this.then(function() {
					return value;
				});
			};
	
			/**
			 * Runs a side effect when this promise fulfills, without changing the
			 * fulfillment value.
			 * @param {function} onFulfilledSideEffect
			 * @returns {Promise}
			 */
			Promise.prototype.tap = function(onFulfilledSideEffect) {
				return this.then(onFulfilledSideEffect)['yield'](this);
			};
	
			return Promise;
		};
	
		function rejectInvalidPredicate() {
			throw new TypeError('catch predicate must be a function');
		}
	
		function evaluatePredicate(e, predicate) {
			return isError(predicate) ? e instanceof predicate : predicate(e);
		}
	
		function isError(predicate) {
			return predicate === Error
				|| (predicate != null && predicate.prototype instanceof Error);
		}
	
		function maybeThenable(x) {
			return (typeof x === 'object' || typeof x === 'function') && x !== null;
		}
	
		function identity(x) {
			return x;
		}
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	/** @author Jeff Escalante */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return function fold(Promise) {
	
			Promise.prototype.fold = function(f, z) {
				var promise = this._beget();
	
				this._handler.fold(function(z, x, to) {
					Promise._handler(z).fold(function(x, z, to) {
						to.resolve(f.call(this, z, x));
					}, x, this, to);
				}, z, promise._handler.receiver, promise._handler);
	
				return promise;
			};
	
			return Promise;
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
	
		var inspect = __webpack_require__(11).inspect;
	
		return function inspection(Promise) {
	
			Promise.prototype.inspect = function() {
				return inspect(Promise._handler(this));
			};
	
			return Promise;
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return function generate(Promise) {
	
			var resolve = Promise.resolve;
	
			Promise.iterate = iterate;
			Promise.unfold = unfold;
	
			return Promise;
	
			/**
			 * @deprecated Use github.com/cujojs/most streams and most.iterate
			 * Generate a (potentially infinite) stream of promised values:
			 * x, f(x), f(f(x)), etc. until condition(x) returns true
			 * @param {function} f function to generate a new x from the previous x
			 * @param {function} condition function that, given the current x, returns
			 *  truthy when the iterate should stop
			 * @param {function} handler function to handle the value produced by f
			 * @param {*|Promise} x starting value, may be a promise
			 * @return {Promise} the result of the last call to f before
			 *  condition returns true
			 */
			function iterate(f, condition, handler, x) {
				return unfold(function(x) {
					return [x, f(x)];
				}, condition, handler, x);
			}
	
			/**
			 * @deprecated Use github.com/cujojs/most streams and most.unfold
			 * Generate a (potentially infinite) stream of promised values
			 * by applying handler(generator(seed)) iteratively until
			 * condition(seed) returns true.
			 * @param {function} unspool function that generates a [value, newSeed]
			 *  given a seed.
			 * @param {function} condition function that, given the current seed, returns
			 *  truthy when the unfold should stop
			 * @param {function} handler function to handle the value produced by unspool
			 * @param x {*|Promise} starting value, may be a promise
			 * @return {Promise} the result of the last value produced by unspool before
			 *  condition returns true
			 */
			function unfold(unspool, condition, handler, x) {
				return resolve(x).then(function(seed) {
					return resolve(condition(seed)).then(function(done) {
						return done ? seed : resolve(unspool(seed)).spread(next);
					});
				});
	
				function next(item, newSeed) {
					return resolve(handler(item)).then(function() {
						return unfold(unspool, condition, handler, newSeed);
					});
				}
			}
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return function progress(Promise) {
	
			/**
			 * @deprecated
			 * Register a progress handler for this promise
			 * @param {function} onProgress
			 * @returns {Promise}
			 */
			Promise.prototype.progress = function(onProgress) {
				return this.then(void 0, void 0, onProgress);
			};
	
			return Promise;
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return function addWith(Promise) {
			/**
			 * Returns a promise whose handlers will be called with `this` set to
			 * the supplied receiver.  Subsequent promises derived from the
			 * returned promise will also have their handlers called with receiver
			 * as `this`. Calling `with` with undefined or no arguments will return
			 * a promise whose handlers will again be called in the usual Promises/A+
			 * way (no `this`) thus safely undoing any previous `with` in the
			 * promise chain.
			 *
			 * WARNING: Promises returned from `with`/`withThis` are NOT Promises/A+
			 * compliant, specifically violating 2.2.5 (http://promisesaplus.com/#point-41)
			 *
			 * @param {object} receiver `this` value for all handlers attached to
			 *  the returned promise.
			 * @returns {Promise}
			 */
			Promise.prototype['with'] = Promise.prototype.withThis = function(receiver) {
				var p = this._beget();
				var child = p._handler;
				child.receiver = receiver;
				this._handler.chain(child, receiver);
				return p;
			};
	
			return Promise;
		};
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));
	


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
	
		var setTimer = __webpack_require__(6).setTimer;
		var format = __webpack_require__(20);
	
		return function unhandledRejection(Promise) {
	
			var logError = noop;
			var logInfo = noop;
			var localConsole;
	
			if(typeof console !== 'undefined') {
				// Alias console to prevent things like uglify's drop_console option from
				// removing console.log/error. Unhandled rejections fall into the same
				// category as uncaught exceptions, and build tools shouldn't silence them.
				localConsole = console;
				logError = typeof localConsole.error !== 'undefined'
					? function (e) { localConsole.error(e); }
					: function (e) { localConsole.log(e); };
	
				logInfo = typeof localConsole.info !== 'undefined'
					? function (e) { localConsole.info(e); }
					: function (e) { localConsole.log(e); };
			}
	
			Promise.onPotentiallyUnhandledRejection = function(rejection) {
				enqueue(report, rejection);
			};
	
			Promise.onPotentiallyUnhandledRejectionHandled = function(rejection) {
				enqueue(unreport, rejection);
			};
	
			Promise.onFatalRejection = function(rejection) {
				enqueue(throwit, rejection.value);
			};
	
			var tasks = [];
			var reported = [];
			var running = null;
	
			function report(r) {
				if(!r.handled) {
					reported.push(r);
					logError('Potentially unhandled rejection [' + r.id + '] ' + format.formatError(r.value));
				}
			}
	
			function unreport(r) {
				var i = reported.indexOf(r);
				if(i >= 0) {
					reported.splice(i, 1);
					logInfo('Handled previous rejection [' + r.id + '] ' + format.formatObject(r.value));
				}
			}
	
			function enqueue(f, x) {
				tasks.push(f, x);
				if(running === null) {
					running = setTimer(flush, 0);
				}
			}
	
			function flush() {
				running = null;
				while(tasks.length > 0) {
					tasks.shift()(tasks.shift());
				}
			}
	
			return Promise;
		};
	
		function throwit(e) {
			throw e;
		}
	
		function noop() {}
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return {
			formatError: formatError,
			formatObject: formatObject,
			tryStringify: tryStringify
		};
	
		/**
		 * Format an error into a string.  If e is an Error and has a stack property,
		 * it's returned.  Otherwise, e is formatted using formatObject, with a
		 * warning added about e not being a proper Error.
		 * @param {*} e
		 * @returns {String} formatted string, suitable for output to developers
		 */
		function formatError(e) {
			var s = typeof e === 'object' && e !== null && e.stack ? e.stack : formatObject(e);
			return e instanceof Error ? s : s + ' (WARNING: non-Error used)';
		}
	
		/**
		 * Format an object, detecting "plain" objects and running them through
		 * JSON.stringify if possible.
		 * @param {Object} o
		 * @returns {string}
		 */
		function formatObject(o) {
			var s = String(o);
			if(s === '[object Object]' && typeof JSON !== 'undefined') {
				s = tryStringify(o, s);
			}
			return s;
		}
	
		/**
		 * Try to return the result of JSON.stringify(x).  If that fails, return
		 * defaultValue
		 * @param {*} x
		 * @param {*} defaultValue
		 * @returns {String|*} JSON.stringify(x) or defaultValue
		 */
		function tryStringify(x, defaultValue) {
			try {
				return JSON.stringify(x);
			} catch(e) {
				return defaultValue;
			}
		}
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require) {
	
		var makePromise = __webpack_require__(22);
		var Scheduler = __webpack_require__(23);
		var async = __webpack_require__(6).asap;
	
		return makePromise({
			scheduler: new Scheduler(async)
		});
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	})(__webpack_require__(8));


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process) {/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		return function makePromise(environment) {
	
			var tasks = environment.scheduler;
			var emitRejection = initEmitRejection();
	
			var objectCreate = Object.create ||
				function(proto) {
					function Child() {}
					Child.prototype = proto;
					return new Child();
				};
	
			/**
			 * Create a promise whose fate is determined by resolver
			 * @constructor
			 * @returns {Promise} promise
			 * @name Promise
			 */
			function Promise(resolver, handler) {
				this._handler = resolver === Handler ? handler : init(resolver);
			}
	
			/**
			 * Run the supplied resolver
			 * @param resolver
			 * @returns {Pending}
			 */
			function init(resolver) {
				var handler = new Pending();
	
				try {
					resolver(promiseResolve, promiseReject, promiseNotify);
				} catch (e) {
					promiseReject(e);
				}
	
				return handler;
	
				/**
				 * Transition from pre-resolution state to post-resolution state, notifying
				 * all listeners of the ultimate fulfillment or rejection
				 * @param {*} x resolution value
				 */
				function promiseResolve (x) {
					handler.resolve(x);
				}
				/**
				 * Reject this promise with reason, which will be used verbatim
				 * @param {Error|*} reason rejection reason, strongly suggested
				 *   to be an Error type
				 */
				function promiseReject (reason) {
					handler.reject(reason);
				}
	
				/**
				 * @deprecated
				 * Issue a progress event, notifying all progress listeners
				 * @param {*} x progress event payload to pass to all listeners
				 */
				function promiseNotify (x) {
					handler.notify(x);
				}
			}
	
			// Creation
	
			Promise.resolve = resolve;
			Promise.reject = reject;
			Promise.never = never;
	
			Promise._defer = defer;
			Promise._handler = getHandler;
	
			/**
			 * Returns a trusted promise. If x is already a trusted promise, it is
			 * returned, otherwise returns a new trusted Promise which follows x.
			 * @param  {*} x
			 * @return {Promise} promise
			 */
			function resolve(x) {
				return isPromise(x) ? x
					: new Promise(Handler, new Async(getHandler(x)));
			}
	
			/**
			 * Return a reject promise with x as its reason (x is used verbatim)
			 * @param {*} x
			 * @returns {Promise} rejected promise
			 */
			function reject(x) {
				return new Promise(Handler, new Async(new Rejected(x)));
			}
	
			/**
			 * Return a promise that remains pending forever
			 * @returns {Promise} forever-pending promise.
			 */
			function never() {
				return foreverPendingPromise; // Should be frozen
			}
	
			/**
			 * Creates an internal {promise, resolver} pair
			 * @private
			 * @returns {Promise}
			 */
			function defer() {
				return new Promise(Handler, new Pending());
			}
	
			// Transformation and flow control
	
			/**
			 * Transform this promise's fulfillment value, returning a new Promise
			 * for the transformed result.  If the promise cannot be fulfilled, onRejected
			 * is called with the reason.  onProgress *may* be called with updates toward
			 * this promise's fulfillment.
			 * @param {function=} onFulfilled fulfillment handler
			 * @param {function=} onRejected rejection handler
			 * @param {function=} onProgress @deprecated progress handler
			 * @return {Promise} new promise
			 */
			Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
				var parent = this._handler;
				var state = parent.join().state();
	
				if ((typeof onFulfilled !== 'function' && state > 0) ||
					(typeof onRejected !== 'function' && state < 0)) {
					// Short circuit: value will not change, simply share handler
					return new this.constructor(Handler, parent);
				}
	
				var p = this._beget();
				var child = p._handler;
	
				parent.chain(child, parent.receiver, onFulfilled, onRejected, onProgress);
	
				return p;
			};
	
			/**
			 * If this promise cannot be fulfilled due to an error, call onRejected to
			 * handle the error. Shortcut for .then(undefined, onRejected)
			 * @param {function?} onRejected
			 * @return {Promise}
			 */
			Promise.prototype['catch'] = function(onRejected) {
				return this.then(void 0, onRejected);
			};
	
			/**
			 * Creates a new, pending promise of the same type as this promise
			 * @private
			 * @returns {Promise}
			 */
			Promise.prototype._beget = function() {
				return begetFrom(this._handler, this.constructor);
			};
	
			function begetFrom(parent, Promise) {
				var child = new Pending(parent.receiver, parent.join().context);
				return new Promise(Handler, child);
			}
	
			// Array combinators
	
			Promise.all = all;
			Promise.race = race;
			Promise._traverse = traverse;
	
			/**
			 * Return a promise that will fulfill when all promises in the
			 * input array have fulfilled, or will reject when one of the
			 * promises rejects.
			 * @param {array} promises array of promises
			 * @returns {Promise} promise for array of fulfillment values
			 */
			function all(promises) {
				return traverseWith(snd, null, promises);
			}
	
			/**
			 * Array<Promise<X>> -> Promise<Array<f(X)>>
			 * @private
			 * @param {function} f function to apply to each promise's value
			 * @param {Array} promises array of promises
			 * @returns {Promise} promise for transformed values
			 */
			function traverse(f, promises) {
				return traverseWith(tryCatch2, f, promises);
			}
	
			function traverseWith(tryMap, f, promises) {
				var handler = typeof f === 'function' ? mapAt : settleAt;
	
				var resolver = new Pending();
				var pending = promises.length >>> 0;
				var results = new Array(pending);
	
				for (var i = 0, x; i < promises.length && !resolver.resolved; ++i) {
					x = promises[i];
	
					if (x === void 0 && !(i in promises)) {
						--pending;
						continue;
					}
	
					traverseAt(promises, handler, i, x, resolver);
				}
	
				if(pending === 0) {
					resolver.become(new Fulfilled(results));
				}
	
				return new Promise(Handler, resolver);
	
				function mapAt(i, x, resolver) {
					if(!resolver.resolved) {
						traverseAt(promises, settleAt, i, tryMap(f, x, i), resolver);
					}
				}
	
				function settleAt(i, x, resolver) {
					results[i] = x;
					if(--pending === 0) {
						resolver.become(new Fulfilled(results));
					}
				}
			}
	
			function traverseAt(promises, handler, i, x, resolver) {
				if (maybeThenable(x)) {
					var h = getHandlerMaybeThenable(x);
					var s = h.state();
	
					if (s === 0) {
						h.fold(handler, i, void 0, resolver);
					} else if (s > 0) {
						handler(i, h.value, resolver);
					} else {
						resolver.become(h);
						visitRemaining(promises, i+1, h);
					}
				} else {
					handler(i, x, resolver);
				}
			}
	
			Promise._visitRemaining = visitRemaining;
			function visitRemaining(promises, start, handler) {
				for(var i=start; i<promises.length; ++i) {
					markAsHandled(getHandler(promises[i]), handler);
				}
			}
	
			function markAsHandled(h, handler) {
				if(h === handler) {
					return;
				}
	
				var s = h.state();
				if(s === 0) {
					h.visit(h, void 0, h._unreport);
				} else if(s < 0) {
					h._unreport();
				}
			}
	
			/**
			 * Fulfill-reject competitive race. Return a promise that will settle
			 * to the same state as the earliest input promise to settle.
			 *
			 * WARNING: The ES6 Promise spec requires that race()ing an empty array
			 * must return a promise that is pending forever.  This implementation
			 * returns a singleton forever-pending promise, the same singleton that is
			 * returned by Promise.never(), thus can be checked with ===
			 *
			 * @param {array} promises array of promises to race
			 * @returns {Promise} if input is non-empty, a promise that will settle
			 * to the same outcome as the earliest input promise to settle. if empty
			 * is empty, returns a promise that will never settle.
			 */
			function race(promises) {
				if(typeof promises !== 'object' || promises === null) {
					return reject(new TypeError('non-iterable passed to race()'));
				}
	
				// Sigh, race([]) is untestable unless we return *something*
				// that is recognizable without calling .then() on it.
				return promises.length === 0 ? never()
					 : promises.length === 1 ? resolve(promises[0])
					 : runRace(promises);
			}
	
			function runRace(promises) {
				var resolver = new Pending();
				var i, x, h;
				for(i=0; i<promises.length; ++i) {
					x = promises[i];
					if (x === void 0 && !(i in promises)) {
						continue;
					}
	
					h = getHandler(x);
					if(h.state() !== 0) {
						resolver.become(h);
						visitRemaining(promises, i+1, h);
						break;
					} else {
						h.visit(resolver, resolver.resolve, resolver.reject);
					}
				}
				return new Promise(Handler, resolver);
			}
	
			// Promise internals
			// Below this, everything is @private
	
			/**
			 * Get an appropriate handler for x, without checking for cycles
			 * @param {*} x
			 * @returns {object} handler
			 */
			function getHandler(x) {
				if(isPromise(x)) {
					return x._handler.join();
				}
				return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
			}
	
			/**
			 * Get a handler for thenable x.
			 * NOTE: You must only call this if maybeThenable(x) == true
			 * @param {object|function|Promise} x
			 * @returns {object} handler
			 */
			function getHandlerMaybeThenable(x) {
				return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
			}
	
			/**
			 * Get a handler for potentially untrusted thenable x
			 * @param {*} x
			 * @returns {object} handler
			 */
			function getHandlerUntrusted(x) {
				try {
					var untrustedThen = x.then;
					return typeof untrustedThen === 'function'
						? new Thenable(untrustedThen, x)
						: new Fulfilled(x);
				} catch(e) {
					return new Rejected(e);
				}
			}
	
			/**
			 * Handler for a promise that is pending forever
			 * @constructor
			 */
			function Handler() {}
	
			Handler.prototype.when
				= Handler.prototype.become
				= Handler.prototype.notify // deprecated
				= Handler.prototype.fail
				= Handler.prototype._unreport
				= Handler.prototype._report
				= noop;
	
			Handler.prototype._state = 0;
	
			Handler.prototype.state = function() {
				return this._state;
			};
	
			/**
			 * Recursively collapse handler chain to find the handler
			 * nearest to the fully resolved value.
			 * @returns {object} handler nearest the fully resolved value
			 */
			Handler.prototype.join = function() {
				var h = this;
				while(h.handler !== void 0) {
					h = h.handler;
				}
				return h;
			};
	
			Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
				this.when({
					resolver: to,
					receiver: receiver,
					fulfilled: fulfilled,
					rejected: rejected,
					progress: progress
				});
			};
	
			Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
				this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
			};
	
			Handler.prototype.fold = function(f, z, c, to) {
				this.when(new Fold(f, z, c, to));
			};
	
			/**
			 * Handler that invokes fail() on any handler it becomes
			 * @constructor
			 */
			function FailIfRejected() {}
	
			inherit(Handler, FailIfRejected);
	
			FailIfRejected.prototype.become = function(h) {
				h.fail();
			};
	
			var failIfRejected = new FailIfRejected();
	
			/**
			 * Handler that manages a queue of consumers waiting on a pending promise
			 * @constructor
			 */
			function Pending(receiver, inheritedContext) {
				Promise.createContext(this, inheritedContext);
	
				this.consumers = void 0;
				this.receiver = receiver;
				this.handler = void 0;
				this.resolved = false;
			}
	
			inherit(Handler, Pending);
	
			Pending.prototype._state = 0;
	
			Pending.prototype.resolve = function(x) {
				this.become(getHandler(x));
			};
	
			Pending.prototype.reject = function(x) {
				if(this.resolved) {
					return;
				}
	
				this.become(new Rejected(x));
			};
	
			Pending.prototype.join = function() {
				if (!this.resolved) {
					return this;
				}
	
				var h = this;
	
				while (h.handler !== void 0) {
					h = h.handler;
					if (h === this) {
						return this.handler = cycle();
					}
				}
	
				return h;
			};
	
			Pending.prototype.run = function() {
				var q = this.consumers;
				var handler = this.handler;
				this.handler = this.handler.join();
				this.consumers = void 0;
	
				for (var i = 0; i < q.length; ++i) {
					handler.when(q[i]);
				}
			};
	
			Pending.prototype.become = function(handler) {
				if(this.resolved) {
					return;
				}
	
				this.resolved = true;
				this.handler = handler;
				if(this.consumers !== void 0) {
					tasks.enqueue(this);
				}
	
				if(this.context !== void 0) {
					handler._report(this.context);
				}
			};
	
			Pending.prototype.when = function(continuation) {
				if(this.resolved) {
					tasks.enqueue(new ContinuationTask(continuation, this.handler));
				} else {
					if(this.consumers === void 0) {
						this.consumers = [continuation];
					} else {
						this.consumers.push(continuation);
					}
				}
			};
	
			/**
			 * @deprecated
			 */
			Pending.prototype.notify = function(x) {
				if(!this.resolved) {
					tasks.enqueue(new ProgressTask(x, this));
				}
			};
	
			Pending.prototype.fail = function(context) {
				var c = typeof context === 'undefined' ? this.context : context;
				this.resolved && this.handler.join().fail(c);
			};
	
			Pending.prototype._report = function(context) {
				this.resolved && this.handler.join()._report(context);
			};
	
			Pending.prototype._unreport = function() {
				this.resolved && this.handler.join()._unreport();
			};
	
			/**
			 * Wrap another handler and force it into a future stack
			 * @param {object} handler
			 * @constructor
			 */
			function Async(handler) {
				this.handler = handler;
			}
	
			inherit(Handler, Async);
	
			Async.prototype.when = function(continuation) {
				tasks.enqueue(new ContinuationTask(continuation, this));
			};
	
			Async.prototype._report = function(context) {
				this.join()._report(context);
			};
	
			Async.prototype._unreport = function() {
				this.join()._unreport();
			};
	
			/**
			 * Handler that wraps an untrusted thenable and assimilates it in a future stack
			 * @param {function} then
			 * @param {{then: function}} thenable
			 * @constructor
			 */
			function Thenable(then, thenable) {
				Pending.call(this);
				tasks.enqueue(new AssimilateTask(then, thenable, this));
			}
	
			inherit(Pending, Thenable);
	
			/**
			 * Handler for a fulfilled promise
			 * @param {*} x fulfillment value
			 * @constructor
			 */
			function Fulfilled(x) {
				Promise.createContext(this);
				this.value = x;
			}
	
			inherit(Handler, Fulfilled);
	
			Fulfilled.prototype._state = 1;
	
			Fulfilled.prototype.fold = function(f, z, c, to) {
				runContinuation3(f, z, this, c, to);
			};
	
			Fulfilled.prototype.when = function(cont) {
				runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
			};
	
			var errorId = 0;
	
			/**
			 * Handler for a rejected promise
			 * @param {*} x rejection reason
			 * @constructor
			 */
			function Rejected(x) {
				Promise.createContext(this);
	
				this.id = ++errorId;
				this.value = x;
				this.handled = false;
				this.reported = false;
	
				this._report();
			}
	
			inherit(Handler, Rejected);
	
			Rejected.prototype._state = -1;
	
			Rejected.prototype.fold = function(f, z, c, to) {
				to.become(this);
			};
	
			Rejected.prototype.when = function(cont) {
				if(typeof cont.rejected === 'function') {
					this._unreport();
				}
				runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
			};
	
			Rejected.prototype._report = function(context) {
				tasks.afterQueue(new ReportTask(this, context));
			};
	
			Rejected.prototype._unreport = function() {
				if(this.handled) {
					return;
				}
				this.handled = true;
				tasks.afterQueue(new UnreportTask(this));
			};
	
			Rejected.prototype.fail = function(context) {
				this.reported = true;
				emitRejection('unhandledRejection', this);
				Promise.onFatalRejection(this, context === void 0 ? this.context : context);
			};
	
			function ReportTask(rejection, context) {
				this.rejection = rejection;
				this.context = context;
			}
	
			ReportTask.prototype.run = function() {
				if(!this.rejection.handled && !this.rejection.reported) {
					this.rejection.reported = true;
					emitRejection('unhandledRejection', this.rejection) ||
						Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
				}
			};
	
			function UnreportTask(rejection) {
				this.rejection = rejection;
			}
	
			UnreportTask.prototype.run = function() {
				if(this.rejection.reported) {
					emitRejection('rejectionHandled', this.rejection) ||
						Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
				}
			};
	
			// Unhandled rejection hooks
			// By default, everything is a noop
	
			Promise.createContext
				= Promise.enterContext
				= Promise.exitContext
				= Promise.onPotentiallyUnhandledRejection
				= Promise.onPotentiallyUnhandledRejectionHandled
				= Promise.onFatalRejection
				= noop;
	
			// Errors and singletons
	
			var foreverPendingHandler = new Handler();
			var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);
	
			function cycle() {
				return new Rejected(new TypeError('Promise cycle'));
			}
	
			// Task runners
	
			/**
			 * Run a single consumer
			 * @constructor
			 */
			function ContinuationTask(continuation, handler) {
				this.continuation = continuation;
				this.handler = handler;
			}
	
			ContinuationTask.prototype.run = function() {
				this.handler.join().when(this.continuation);
			};
	
			/**
			 * Run a queue of progress handlers
			 * @constructor
			 */
			function ProgressTask(value, handler) {
				this.handler = handler;
				this.value = value;
			}
	
			ProgressTask.prototype.run = function() {
				var q = this.handler.consumers;
				if(q === void 0) {
					return;
				}
	
				for (var c, i = 0; i < q.length; ++i) {
					c = q[i];
					runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
				}
			};
	
			/**
			 * Assimilate a thenable, sending it's value to resolver
			 * @param {function} then
			 * @param {object|function} thenable
			 * @param {object} resolver
			 * @constructor
			 */
			function AssimilateTask(then, thenable, resolver) {
				this._then = then;
				this.thenable = thenable;
				this.resolver = resolver;
			}
	
			AssimilateTask.prototype.run = function() {
				var h = this.resolver;
				tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);
	
				function _resolve(x) { h.resolve(x); }
				function _reject(x)  { h.reject(x); }
				function _notify(x)  { h.notify(x); }
			};
	
			function tryAssimilate(then, thenable, resolve, reject, notify) {
				try {
					then.call(thenable, resolve, reject, notify);
				} catch (e) {
					reject(e);
				}
			}
	
			/**
			 * Fold a handler value with z
			 * @constructor
			 */
			function Fold(f, z, c, to) {
				this.f = f; this.z = z; this.c = c; this.to = to;
				this.resolver = failIfRejected;
				this.receiver = this;
			}
	
			Fold.prototype.fulfilled = function(x) {
				this.f.call(this.c, this.z, x, this.to);
			};
	
			Fold.prototype.rejected = function(x) {
				this.to.reject(x);
			};
	
			Fold.prototype.progress = function(x) {
				this.to.notify(x);
			};
	
			// Other helpers
	
			/**
			 * @param {*} x
			 * @returns {boolean} true iff x is a trusted Promise
			 */
			function isPromise(x) {
				return x instanceof Promise;
			}
	
			/**
			 * Test just enough to rule out primitives, in order to take faster
			 * paths in some code
			 * @param {*} x
			 * @returns {boolean} false iff x is guaranteed *not* to be a thenable
			 */
			function maybeThenable(x) {
				return (typeof x === 'object' || typeof x === 'function') && x !== null;
			}
	
			function runContinuation1(f, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.become(h);
				}
	
				Promise.enterContext(h);
				tryCatchReject(f, h.value, receiver, next);
				Promise.exitContext();
			}
	
			function runContinuation3(f, x, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.become(h);
				}
	
				Promise.enterContext(h);
				tryCatchReject3(f, x, h.value, receiver, next);
				Promise.exitContext();
			}
	
			/**
			 * @deprecated
			 */
			function runNotify(f, x, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.notify(x);
				}
	
				Promise.enterContext(h);
				tryCatchReturn(f, x, receiver, next);
				Promise.exitContext();
			}
	
			function tryCatch2(f, a, b) {
				try {
					return f(a, b);
				} catch(e) {
					return reject(e);
				}
			}
	
			/**
			 * Return f.call(thisArg, x), or if it throws return a rejected promise for
			 * the thrown exception
			 */
			function tryCatchReject(f, x, thisArg, next) {
				try {
					next.become(getHandler(f.call(thisArg, x)));
				} catch(e) {
					next.become(new Rejected(e));
				}
			}
	
			/**
			 * Same as above, but includes the extra argument parameter.
			 */
			function tryCatchReject3(f, x, y, thisArg, next) {
				try {
					f.call(thisArg, x, y, next);
				} catch(e) {
					next.become(new Rejected(e));
				}
			}
	
			/**
			 * @deprecated
			 * Return f.call(thisArg, x), or if it throws, *return* the exception
			 */
			function tryCatchReturn(f, x, thisArg, next) {
				try {
					next.notify(f.call(thisArg, x));
				} catch(e) {
					next.notify(e);
				}
			}
	
			function inherit(Parent, Child) {
				Child.prototype = objectCreate(Parent.prototype);
				Child.prototype.constructor = Child;
			}
	
			function snd(x, y) {
				return y;
			}
	
			function noop() {}
	
			function initEmitRejection() {
				/*global process, self, CustomEvent*/
				if(typeof process !== 'undefined' && process !== null
					&& typeof process.emit === 'function') {
					// Returning falsy here means to call the default
					// onPotentiallyUnhandledRejection API.  This is safe even in
					// browserify since process.emit always returns falsy in browserify:
					// https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
					return function(type, rejection) {
						return type === 'unhandledRejection'
							? process.emit(type, rejection.value, rejection)
							: process.emit(type, rejection);
					};
				} else if(typeof self !== 'undefined' && typeof CustomEvent === 'function') {
					return (function(noop, self, CustomEvent) {
						var hasCustomEvent = false;
						try {
							var ev = new CustomEvent('unhandledRejection');
							hasCustomEvent = ev instanceof CustomEvent;
						} catch (e) {}
	
						return !hasCustomEvent ? noop : function(type, rejection) {
							var ev = new CustomEvent(type, {
								detail: {
									reason: rejection.value,
									key: rejection
								},
								bubbles: false,
								cancelable: true
							});
	
							return !self.dispatchEvent(ev);
						};
					}(noop, self, CustomEvent));
				}
	
				return noop;
			}
	
			return Promise;
		};
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	
		// Credit to Twisol (https://github.com/Twisol) for suggesting
		// this type of extensible queue + trampoline approach for next-tick conflation.
	
		/**
		 * Async task scheduler
		 * @param {function} async function to schedule a single async function
		 * @constructor
		 */
		function Scheduler(async) {
			this._async = async;
			this._running = false;
	
			this._queue = this;
			this._queueLen = 0;
			this._afterQueue = {};
			this._afterQueueLen = 0;
	
			var self = this;
			this.drain = function() {
				self._drain();
			};
		}
	
		/**
		 * Enqueue a task
		 * @param {{ run:function }} task
		 */
		Scheduler.prototype.enqueue = function(task) {
			this._queue[this._queueLen++] = task;
			this.run();
		};
	
		/**
		 * Enqueue a task to run after the main task queue
		 * @param {{ run:function }} task
		 */
		Scheduler.prototype.afterQueue = function(task) {
			this._afterQueue[this._afterQueueLen++] = task;
			this.run();
		};
	
		Scheduler.prototype.run = function() {
			if (!this._running) {
				this._running = true;
				this._async(this.drain);
			}
		};
	
		/**
		 * Drain the handler queue entirely, and then the after queue
		 */
		Scheduler.prototype._drain = function() {
			var i = 0;
			for (; i < this._queueLen; ++i) {
				this._queue[i].run();
				this._queue[i] = void 0;
			}
	
			this._queueLen = 0;
			this._running = false;
	
			for (i = 0; i < this._afterQueueLen; ++i) {
				this._afterQueue[i].run();
				this._afterQueue[i] = void 0;
			}
	
			this._afterQueueLen = 0;
		};
	
		return Scheduler;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(8)));


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * URI.js - Mutating URLs
	 *
	 * Version: 1.16.1
	 *
	 * Author: Rodney Rehm
	 * Web: http://medialize.github.io/URI.js/
	 *
	 * Licensed under
	 *   MIT License http://www.opensource.org/licenses/mit-license
	 *   GPL v3 http://opensource.org/licenses/GPL-3.0
	 *
	 */
	(function (root, factory) {
	  'use strict';
	  // https://github.com/umdjs/umd/blob/master/returnExports.js
	  if (true) {
	    // Node
	    module.exports = factory(__webpack_require__(25), __webpack_require__(27), __webpack_require__(28));
	  } else if (typeof define === 'function' && define.amd) {
	    // AMD. Register as an anonymous module.
	    define(['./punycode', './IPv6', './SecondLevelDomains'], factory);
	  } else {
	    // Browser globals (root is window)
	    root.URI = factory(root.punycode, root.IPv6, root.SecondLevelDomains, root);
	  }
	}(this, function (punycode, IPv6, SLD, root) {
	  'use strict';
	  /*global location, escape, unescape */
	  // FIXME: v2.0.0 renamce non-camelCase properties to uppercase
	  /*jshint camelcase: false */
	
	  // save current URI variable, if any
	  var _URI = root && root.URI;
	
	  function URI(url, base) {
	    var _urlSupplied = arguments.length >= 1;
	    var _baseSupplied = arguments.length >= 2;
	
	    // Allow instantiation without the 'new' keyword
	    if (!(this instanceof URI)) {
	      if (_urlSupplied) {
	        if (_baseSupplied) {
	          return new URI(url, base);
	        }
	
	        return new URI(url);
	      }
	
	      return new URI();
	    }
	
	    if (url === undefined) {
	      if (_urlSupplied) {
	        throw new TypeError('undefined is not a valid argument for URI');
	      }
	
	      if (typeof location !== 'undefined') {
	        url = location.href + '';
	      } else {
	        url = '';
	      }
	    }
	
	    this.href(url);
	
	    // resolve to base according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#constructor
	    if (base !== undefined) {
	      return this.absoluteTo(base);
	    }
	
	    return this;
	  }
	
	  URI.version = '1.16.1';
	
	  var p = URI.prototype;
	  var hasOwn = Object.prototype.hasOwnProperty;
	
	  function escapeRegEx(string) {
	    // https://github.com/medialize/URI.js/commit/85ac21783c11f8ccab06106dba9735a31a86924d#commitcomment-821963
	    return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	  }
	
	  function getType(value) {
	    // IE8 doesn't return [Object Undefined] but [Object Object] for undefined value
	    if (value === undefined) {
	      return 'Undefined';
	    }
	
	    return String(Object.prototype.toString.call(value)).slice(8, -1);
	  }
	
	  function isArray(obj) {
	    return getType(obj) === 'Array';
	  }
	
	  function filterArrayValues(data, value) {
	    var lookup = {};
	    var i, length;
	
	    if (getType(value) === 'RegExp') {
	      lookup = null;
	    } else if (isArray(value)) {
	      for (i = 0, length = value.length; i < length; i++) {
	        lookup[value[i]] = true;
	      }
	    } else {
	      lookup[value] = true;
	    }
	
	    for (i = 0, length = data.length; i < length; i++) {
	      /*jshint laxbreak: true */
	      var _match = lookup && lookup[data[i]] !== undefined
	        || !lookup && value.test(data[i]);
	      /*jshint laxbreak: false */
	      if (_match) {
	        data.splice(i, 1);
	        length--;
	        i--;
	      }
	    }
	
	    return data;
	  }
	
	  function arrayContains(list, value) {
	    var i, length;
	
	    // value may be string, number, array, regexp
	    if (isArray(value)) {
	      // Note: this can be optimized to O(n) (instead of current O(m * n))
	      for (i = 0, length = value.length; i < length; i++) {
	        if (!arrayContains(list, value[i])) {
	          return false;
	        }
	      }
	
	      return true;
	    }
	
	    var _type = getType(value);
	    for (i = 0, length = list.length; i < length; i++) {
	      if (_type === 'RegExp') {
	        if (typeof list[i] === 'string' && list[i].match(value)) {
	          return true;
	        }
	      } else if (list[i] === value) {
	        return true;
	      }
	    }
	
	    return false;
	  }
	
	  function arraysEqual(one, two) {
	    if (!isArray(one) || !isArray(two)) {
	      return false;
	    }
	
	    // arrays can't be equal if they have different amount of content
	    if (one.length !== two.length) {
	      return false;
	    }
	
	    one.sort();
	    two.sort();
	
	    for (var i = 0, l = one.length; i < l; i++) {
	      if (one[i] !== two[i]) {
	        return false;
	      }
	    }
	
	    return true;
	  }
	
	  URI._parts = function() {
	    return {
	      protocol: null,
	      username: null,
	      password: null,
	      hostname: null,
	      urn: null,
	      port: null,
	      path: null,
	      query: null,
	      fragment: null,
	      // state
	      duplicateQueryParameters: URI.duplicateQueryParameters,
	      escapeQuerySpace: URI.escapeQuerySpace
	    };
	  };
	  // state: allow duplicate query parameters (a=1&a=1)
	  URI.duplicateQueryParameters = false;
	  // state: replaces + with %20 (space in query strings)
	  URI.escapeQuerySpace = true;
	  // static properties
	  URI.protocol_expression = /^[a-z][a-z0-9.+-]*$/i;
	  URI.idn_expression = /[^a-z0-9\.-]/i;
	  URI.punycode_expression = /(xn--)/i;
	  // well, 333.444.555.666 matches, but it sure ain't no IPv4 - do we care?
	  URI.ip4_expression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
	  // credits to Rich Brown
	  // source: http://forums.intermapper.com/viewtopic.php?p=1096#1096
	  // specification: http://www.ietf.org/rfc/rfc4291.txt
	  URI.ip6_expression = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
	  // expression used is "gruber revised" (@gruber v2) determined to be the
	  // best solution in a regex-golf we did a couple of ages ago at
	  // * http://mathiasbynens.be/demo/url-regex
	  // * http://rodneyrehm.de/t/url-regex.html
	  URI.find_uri_expression = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
	  URI.findUri = {
	    // valid "scheme://" or "www."
	    start: /\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,
	    // everything up to the next whitespace
	    end: /[\s\r\n]|$/,
	    // trim trailing punctuation captured by end RegExp
	    trim: /[`!()\[\]{};:'".,<>?«»“”„‘’]+$/
	  };
	  // http://www.iana.org/assignments/uri-schemes.html
	  // http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports
	  URI.defaultPorts = {
	    http: '80',
	    https: '443',
	    ftp: '21',
	    gopher: '70',
	    ws: '80',
	    wss: '443'
	  };
	  // allowed hostname characters according to RFC 3986
	  // ALPHA DIGIT "-" "." "_" "~" "!" "$" "&" "'" "(" ")" "*" "+" "," ";" "=" %encoded
	  // I've never seen a (non-IDN) hostname other than: ALPHA DIGIT . -
	  URI.invalid_hostname_characters = /[^a-zA-Z0-9\.-]/;
	  // map DOM Elements to their URI attribute
	  URI.domAttributes = {
	    'a': 'href',
	    'blockquote': 'cite',
	    'link': 'href',
	    'base': 'href',
	    'script': 'src',
	    'form': 'action',
	    'img': 'src',
	    'area': 'href',
	    'iframe': 'src',
	    'embed': 'src',
	    'source': 'src',
	    'track': 'src',
	    'input': 'src', // but only if type="image"
	    'audio': 'src',
	    'video': 'src'
	  };
	  URI.getDomAttribute = function(node) {
	    if (!node || !node.nodeName) {
	      return undefined;
	    }
	
	    var nodeName = node.nodeName.toLowerCase();
	    // <input> should only expose src for type="image"
	    if (nodeName === 'input' && node.type !== 'image') {
	      return undefined;
	    }
	
	    return URI.domAttributes[nodeName];
	  };
	
	  function escapeForDumbFirefox36(value) {
	    // https://github.com/medialize/URI.js/issues/91
	    return escape(value);
	  }
	
	  // encoding / decoding according to RFC3986
	  function strictEncodeURIComponent(string) {
	    // see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURIComponent
	    return encodeURIComponent(string)
	      .replace(/[!'()*]/g, escapeForDumbFirefox36)
	      .replace(/\*/g, '%2A');
	  }
	  URI.encode = strictEncodeURIComponent;
	  URI.decode = decodeURIComponent;
	  URI.iso8859 = function() {
	    URI.encode = escape;
	    URI.decode = unescape;
	  };
	  URI.unicode = function() {
	    URI.encode = strictEncodeURIComponent;
	    URI.decode = decodeURIComponent;
	  };
	  URI.characters = {
	    pathname: {
	      encode: {
	        // RFC3986 2.1: For consistency, URI producers and normalizers should
	        // use uppercase hexadecimal digits for all percent-encodings.
	        expression: /%(24|26|2B|2C|3B|3D|3A|40)/ig,
	        map: {
	          // -._~!'()*
	          '%24': '$',
	          '%26': '&',
	          '%2B': '+',
	          '%2C': ',',
	          '%3B': ';',
	          '%3D': '=',
	          '%3A': ':',
	          '%40': '@'
	        }
	      },
	      decode: {
	        expression: /[\/\?#]/g,
	        map: {
	          '/': '%2F',
	          '?': '%3F',
	          '#': '%23'
	        }
	      }
	    },
	    reserved: {
	      encode: {
	        // RFC3986 2.1: For consistency, URI producers and normalizers should
	        // use uppercase hexadecimal digits for all percent-encodings.
	        expression: /%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/ig,
	        map: {
	          // gen-delims
	          '%3A': ':',
	          '%2F': '/',
	          '%3F': '?',
	          '%23': '#',
	          '%5B': '[',
	          '%5D': ']',
	          '%40': '@',
	          // sub-delims
	          '%21': '!',
	          '%24': '$',
	          '%26': '&',
	          '%27': '\'',
	          '%28': '(',
	          '%29': ')',
	          '%2A': '*',
	          '%2B': '+',
	          '%2C': ',',
	          '%3B': ';',
	          '%3D': '='
	        }
	      }
	    },
	    urnpath: {
	      // The characters under `encode` are the characters called out by RFC 2141 as being acceptable
	      // for usage in a URN. RFC2141 also calls out "-", ".", and "_" as acceptable characters, but
	      // these aren't encoded by encodeURIComponent, so we don't have to call them out here. Also
	      // note that the colon character is not featured in the encoding map; this is because URI.js
	      // gives the colons in URNs semantic meaning as the delimiters of path segements, and so it
	      // should not appear unencoded in a segment itself.
	      // See also the note above about RFC3986 and capitalalized hex digits.
	      encode: {
	        expression: /%(21|24|27|28|29|2A|2B|2C|3B|3D|40)/ig,
	        map: {
	          '%21': '!',
	          '%24': '$',
	          '%27': '\'',
	          '%28': '(',
	          '%29': ')',
	          '%2A': '*',
	          '%2B': '+',
	          '%2C': ',',
	          '%3B': ';',
	          '%3D': '=',
	          '%40': '@'
	        }
	      },
	      // These characters are the characters called out by RFC2141 as "reserved" characters that
	      // should never appear in a URN, plus the colon character (see note above).
	      decode: {
	        expression: /[\/\?#:]/g,
	        map: {
	          '/': '%2F',
	          '?': '%3F',
	          '#': '%23',
	          ':': '%3A'
	        }
	      }
	    }
	  };
	  URI.encodeQuery = function(string, escapeQuerySpace) {
	    var escaped = URI.encode(string + '');
	    if (escapeQuerySpace === undefined) {
	      escapeQuerySpace = URI.escapeQuerySpace;
	    }
	
	    return escapeQuerySpace ? escaped.replace(/%20/g, '+') : escaped;
	  };
	  URI.decodeQuery = function(string, escapeQuerySpace) {
	    string += '';
	    if (escapeQuerySpace === undefined) {
	      escapeQuerySpace = URI.escapeQuerySpace;
	    }
	
	    try {
	      return URI.decode(escapeQuerySpace ? string.replace(/\+/g, '%20') : string);
	    } catch(e) {
	      // we're not going to mess with weird encodings,
	      // give up and return the undecoded original string
	      // see https://github.com/medialize/URI.js/issues/87
	      // see https://github.com/medialize/URI.js/issues/92
	      return string;
	    }
	  };
	  // generate encode/decode path functions
	  var _parts = {'encode':'encode', 'decode':'decode'};
	  var _part;
	  var generateAccessor = function(_group, _part) {
	    return function(string) {
	      try {
	        return URI[_part](string + '').replace(URI.characters[_group][_part].expression, function(c) {
	          return URI.characters[_group][_part].map[c];
	        });
	      } catch (e) {
	        // we're not going to mess with weird encodings,
	        // give up and return the undecoded original string
	        // see https://github.com/medialize/URI.js/issues/87
	        // see https://github.com/medialize/URI.js/issues/92
	        return string;
	      }
	    };
	  };
	
	  for (_part in _parts) {
	    URI[_part + 'PathSegment'] = generateAccessor('pathname', _parts[_part]);
	    URI[_part + 'UrnPathSegment'] = generateAccessor('urnpath', _parts[_part]);
	  }
	
	  var generateSegmentedPathFunction = function(_sep, _codingFuncName, _innerCodingFuncName) {
	    return function(string) {
	      // Why pass in names of functions, rather than the function objects themselves? The
	      // definitions of some functions (but in particular, URI.decode) will occasionally change due
	      // to URI.js having ISO8859 and Unicode modes. Passing in the name and getting it will ensure
	      // that the functions we use here are "fresh".
	      var actualCodingFunc;
	      if (!_innerCodingFuncName) {
	        actualCodingFunc = URI[_codingFuncName];
	      } else {
	        actualCodingFunc = function(string) {
	          return URI[_codingFuncName](URI[_innerCodingFuncName](string));
	        };
	      }
	
	      var segments = (string + '').split(_sep);
	
	      for (var i = 0, length = segments.length; i < length; i++) {
	        segments[i] = actualCodingFunc(segments[i]);
	      }
	
	      return segments.join(_sep);
	    };
	  };
	
	  // This takes place outside the above loop because we don't want, e.g., encodeUrnPath functions.
	  URI.decodePath = generateSegmentedPathFunction('/', 'decodePathSegment');
	  URI.decodeUrnPath = generateSegmentedPathFunction(':', 'decodeUrnPathSegment');
	  URI.recodePath = generateSegmentedPathFunction('/', 'encodePathSegment', 'decode');
	  URI.recodeUrnPath = generateSegmentedPathFunction(':', 'encodeUrnPathSegment', 'decode');
	
	  URI.encodeReserved = generateAccessor('reserved', 'encode');
	
	  URI.parse = function(string, parts) {
	    var pos;
	    if (!parts) {
	      parts = {};
	    }
	    // [protocol"://"[username[":"password]"@"]hostname[":"port]"/"?][path]["?"querystring]["#"fragment]
	
	    // extract fragment
	    pos = string.indexOf('#');
	    if (pos > -1) {
	      // escaping?
	      parts.fragment = string.substring(pos + 1) || null;
	      string = string.substring(0, pos);
	    }
	
	    // extract query
	    pos = string.indexOf('?');
	    if (pos > -1) {
	      // escaping?
	      parts.query = string.substring(pos + 1) || null;
	      string = string.substring(0, pos);
	    }
	
	    // extract protocol
	    if (string.substring(0, 2) === '//') {
	      // relative-scheme
	      parts.protocol = null;
	      string = string.substring(2);
	      // extract "user:pass@host:port"
	      string = URI.parseAuthority(string, parts);
	    } else {
	      pos = string.indexOf(':');
	      if (pos > -1) {
	        parts.protocol = string.substring(0, pos) || null;
	        if (parts.protocol && !parts.protocol.match(URI.protocol_expression)) {
	          // : may be within the path
	          parts.protocol = undefined;
	        } else if (string.substring(pos + 1, pos + 3) === '//') {
	          string = string.substring(pos + 3);
	
	          // extract "user:pass@host:port"
	          string = URI.parseAuthority(string, parts);
	        } else {
	          string = string.substring(pos + 1);
	          parts.urn = true;
	        }
	      }
	    }
	
	    // what's left must be the path
	    parts.path = string;
	
	    // and we're done
	    return parts;
	  };
	  URI.parseHost = function(string, parts) {
	    // Copy chrome, IE, opera backslash-handling behavior.
	    // Back slashes before the query string get converted to forward slashes
	    // See: https://github.com/joyent/node/blob/386fd24f49b0e9d1a8a076592a404168faeecc34/lib/url.js#L115-L124
	    // See: https://code.google.com/p/chromium/issues/detail?id=25916
	    // https://github.com/medialize/URI.js/pull/233
	    string = string.replace(/\\/g, '/');
	
	    // extract host:port
	    var pos = string.indexOf('/');
	    var bracketPos;
	    var t;
	
	    if (pos === -1) {
	      pos = string.length;
	    }
	
	    if (string.charAt(0) === '[') {
	      // IPv6 host - http://tools.ietf.org/html/draft-ietf-6man-text-addr-representation-04#section-6
	      // I claim most client software breaks on IPv6 anyways. To simplify things, URI only accepts
	      // IPv6+port in the format [2001:db8::1]:80 (for the time being)
	      bracketPos = string.indexOf(']');
	      parts.hostname = string.substring(1, bracketPos) || null;
	      parts.port = string.substring(bracketPos + 2, pos) || null;
	      if (parts.port === '/') {
	        parts.port = null;
	      }
	    } else {
	      var firstColon = string.indexOf(':');
	      var firstSlash = string.indexOf('/');
	      var nextColon = string.indexOf(':', firstColon + 1);
	      if (nextColon !== -1 && (firstSlash === -1 || nextColon < firstSlash)) {
	        // IPv6 host contains multiple colons - but no port
	        // this notation is actually not allowed by RFC 3986, but we're a liberal parser
	        parts.hostname = string.substring(0, pos) || null;
	        parts.port = null;
	      } else {
	        t = string.substring(0, pos).split(':');
	        parts.hostname = t[0] || null;
	        parts.port = t[1] || null;
	      }
	    }
	
	    if (parts.hostname && string.substring(pos).charAt(0) !== '/') {
	      pos++;
	      string = '/' + string;
	    }
	
	    return string.substring(pos) || '/';
	  };
	  URI.parseAuthority = function(string, parts) {
	    string = URI.parseUserinfo(string, parts);
	    return URI.parseHost(string, parts);
	  };
	  URI.parseUserinfo = function(string, parts) {
	    // extract username:password
	    var firstSlash = string.indexOf('/');
	    var pos = string.lastIndexOf('@', firstSlash > -1 ? firstSlash : string.length - 1);
	    var t;
	
	    // authority@ must come before /path
	    if (pos > -1 && (firstSlash === -1 || pos < firstSlash)) {
	      t = string.substring(0, pos).split(':');
	      parts.username = t[0] ? URI.decode(t[0]) : null;
	      t.shift();
	      parts.password = t[0] ? URI.decode(t.join(':')) : null;
	      string = string.substring(pos + 1);
	    } else {
	      parts.username = null;
	      parts.password = null;
	    }
	
	    return string;
	  };
	  URI.parseQuery = function(string, escapeQuerySpace) {
	    if (!string) {
	      return {};
	    }
	
	    // throw out the funky business - "?"[name"="value"&"]+
	    string = string.replace(/&+/g, '&').replace(/^\?*&*|&+$/g, '');
	
	    if (!string) {
	      return {};
	    }
	
	    var items = {};
	    var splits = string.split('&');
	    var length = splits.length;
	    var v, name, value;
	
	    for (var i = 0; i < length; i++) {
	      v = splits[i].split('=');
	      name = URI.decodeQuery(v.shift(), escapeQuerySpace);
	      // no "=" is null according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#collect-url-parameters
	      value = v.length ? URI.decodeQuery(v.join('='), escapeQuerySpace) : null;
	
	      if (hasOwn.call(items, name)) {
	        if (typeof items[name] === 'string' || items[name] === null) {
	          items[name] = [items[name]];
	        }
	
	        items[name].push(value);
	      } else {
	        items[name] = value;
	      }
	    }
	
	    return items;
	  };
	
	  URI.build = function(parts) {
	    var t = '';
	
	    if (parts.protocol) {
	      t += parts.protocol + ':';
	    }
	
	    if (!parts.urn && (t || parts.hostname)) {
	      t += '//';
	    }
	
	    t += (URI.buildAuthority(parts) || '');
	
	    if (typeof parts.path === 'string') {
	      if (parts.path.charAt(0) !== '/' && typeof parts.hostname === 'string') {
	        t += '/';
	      }
	
	      t += parts.path;
	    }
	
	    if (typeof parts.query === 'string' && parts.query) {
	      t += '?' + parts.query;
	    }
	
	    if (typeof parts.fragment === 'string' && parts.fragment) {
	      t += '#' + parts.fragment;
	    }
	    return t;
	  };
	  URI.buildHost = function(parts) {
	    var t = '';
	
	    if (!parts.hostname) {
	      return '';
	    } else if (URI.ip6_expression.test(parts.hostname)) {
	      t += '[' + parts.hostname + ']';
	    } else {
	      t += parts.hostname;
	    }
	
	    if (parts.port) {
	      t += ':' + parts.port;
	    }
	
	    return t;
	  };
	  URI.buildAuthority = function(parts) {
	    return URI.buildUserinfo(parts) + URI.buildHost(parts);
	  };
	  URI.buildUserinfo = function(parts) {
	    var t = '';
	
	    if (parts.username) {
	      t += URI.encode(parts.username);
	
	      if (parts.password) {
	        t += ':' + URI.encode(parts.password);
	      }
	
	      t += '@';
	    }
	
	    return t;
	  };
	  URI.buildQuery = function(data, duplicateQueryParameters, escapeQuerySpace) {
	    // according to http://tools.ietf.org/html/rfc3986 or http://labs.apache.org/webarch/uri/rfc/rfc3986.html
	    // being »-._~!$&'()*+,;=:@/?« %HEX and alnum are allowed
	    // the RFC explicitly states ?/foo being a valid use case, no mention of parameter syntax!
	    // URI.js treats the query string as being application/x-www-form-urlencoded
	    // see http://www.w3.org/TR/REC-html40/interact/forms.html#form-content-type
	
	    var t = '';
	    var unique, key, i, length;
	    for (key in data) {
	      if (hasOwn.call(data, key) && key) {
	        if (isArray(data[key])) {
	          unique = {};
	          for (i = 0, length = data[key].length; i < length; i++) {
	            if (data[key][i] !== undefined && unique[data[key][i] + ''] === undefined) {
	              t += '&' + URI.buildQueryParameter(key, data[key][i], escapeQuerySpace);
	              if (duplicateQueryParameters !== true) {
	                unique[data[key][i] + ''] = true;
	              }
	            }
	          }
	        } else if (data[key] !== undefined) {
	          t += '&' + URI.buildQueryParameter(key, data[key], escapeQuerySpace);
	        }
	      }
	    }
	
	    return t.substring(1);
	  };
	  URI.buildQueryParameter = function(name, value, escapeQuerySpace) {
	    // http://www.w3.org/TR/REC-html40/interact/forms.html#form-content-type -- application/x-www-form-urlencoded
	    // don't append "=" for null values, according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#url-parameter-serialization
	    return URI.encodeQuery(name, escapeQuerySpace) + (value !== null ? '=' + URI.encodeQuery(value, escapeQuerySpace) : '');
	  };
	
	  URI.addQuery = function(data, name, value) {
	    if (typeof name === 'object') {
	      for (var key in name) {
	        if (hasOwn.call(name, key)) {
	          URI.addQuery(data, key, name[key]);
	        }
	      }
	    } else if (typeof name === 'string') {
	      if (data[name] === undefined) {
	        data[name] = value;
	        return;
	      } else if (typeof data[name] === 'string') {
	        data[name] = [data[name]];
	      }
	
	      if (!isArray(value)) {
	        value = [value];
	      }
	
	      data[name] = (data[name] || []).concat(value);
	    } else {
	      throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
	    }
	  };
	  URI.removeQuery = function(data, name, value) {
	    var i, length, key;
	
	    if (isArray(name)) {
	      for (i = 0, length = name.length; i < length; i++) {
	        data[name[i]] = undefined;
	      }
	    } else if (getType(name) === 'RegExp') {
	      for (key in data) {
	        if (name.test(key)) {
	          data[key] = undefined;
	        }
	      }
	    } else if (typeof name === 'object') {
	      for (key in name) {
	        if (hasOwn.call(name, key)) {
	          URI.removeQuery(data, key, name[key]);
	        }
	      }
	    } else if (typeof name === 'string') {
	      if (value !== undefined) {
	        if (getType(value) === 'RegExp') {
	          if (!isArray(data[name]) && value.test(data[name])) {
	            data[name] = undefined;
	          } else {
	            data[name] = filterArrayValues(data[name], value);
	          }
	        } else if (data[name] === value) {
	          data[name] = undefined;
	        } else if (isArray(data[name])) {
	          data[name] = filterArrayValues(data[name], value);
	        }
	      } else {
	        data[name] = undefined;
	      }
	    } else {
	      throw new TypeError('URI.removeQuery() accepts an object, string, RegExp as the first parameter');
	    }
	  };
	  URI.hasQuery = function(data, name, value, withinArray) {
	    if (typeof name === 'object') {
	      for (var key in name) {
	        if (hasOwn.call(name, key)) {
	          if (!URI.hasQuery(data, key, name[key])) {
	            return false;
	          }
	        }
	      }
	
	      return true;
	    } else if (typeof name !== 'string') {
	      throw new TypeError('URI.hasQuery() accepts an object, string as the name parameter');
	    }
	
	    switch (getType(value)) {
	      case 'Undefined':
	        // true if exists (but may be empty)
	        return name in data; // data[name] !== undefined;
	
	      case 'Boolean':
	        // true if exists and non-empty
	        var _booly = Boolean(isArray(data[name]) ? data[name].length : data[name]);
	        return value === _booly;
	
	      case 'Function':
	        // allow complex comparison
	        return !!value(data[name], name, data);
	
	      case 'Array':
	        if (!isArray(data[name])) {
	          return false;
	        }
	
	        var op = withinArray ? arrayContains : arraysEqual;
	        return op(data[name], value);
	
	      case 'RegExp':
	        if (!isArray(data[name])) {
	          return Boolean(data[name] && data[name].match(value));
	        }
	
	        if (!withinArray) {
	          return false;
	        }
	
	        return arrayContains(data[name], value);
	
	      case 'Number':
	        value = String(value);
	        /* falls through */
	      case 'String':
	        if (!isArray(data[name])) {
	          return data[name] === value;
	        }
	
	        if (!withinArray) {
	          return false;
	        }
	
	        return arrayContains(data[name], value);
	
	      default:
	        throw new TypeError('URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter');
	    }
	  };
	
	
	  URI.commonPath = function(one, two) {
	    var length = Math.min(one.length, two.length);
	    var pos;
	
	    // find first non-matching character
	    for (pos = 0; pos < length; pos++) {
	      if (one.charAt(pos) !== two.charAt(pos)) {
	        pos--;
	        break;
	      }
	    }
	
	    if (pos < 1) {
	      return one.charAt(0) === two.charAt(0) && one.charAt(0) === '/' ? '/' : '';
	    }
	
	    // revert to last /
	    if (one.charAt(pos) !== '/' || two.charAt(pos) !== '/') {
	      pos = one.substring(0, pos).lastIndexOf('/');
	    }
	
	    return one.substring(0, pos + 1);
	  };
	
	  URI.withinString = function(string, callback, options) {
	    options || (options = {});
	    var _start = options.start || URI.findUri.start;
	    var _end = options.end || URI.findUri.end;
	    var _trim = options.trim || URI.findUri.trim;
	    var _attributeOpen = /[a-z0-9-]=["']?$/i;
	
	    _start.lastIndex = 0;
	    while (true) {
	      var match = _start.exec(string);
	      if (!match) {
	        break;
	      }
	
	      var start = match.index;
	      if (options.ignoreHtml) {
	        // attribut(e=["']?$)
	        var attributeOpen = string.slice(Math.max(start - 3, 0), start);
	        if (attributeOpen && _attributeOpen.test(attributeOpen)) {
	          continue;
	        }
	      }
	
	      var end = start + string.slice(start).search(_end);
	      var slice = string.slice(start, end).replace(_trim, '');
	      if (options.ignore && options.ignore.test(slice)) {
	        continue;
	      }
	
	      end = start + slice.length;
	      var result = callback(slice, start, end, string);
	      string = string.slice(0, start) + result + string.slice(end);
	      _start.lastIndex = start + result.length;
	    }
	
	    _start.lastIndex = 0;
	    return string;
	  };
	
	  URI.ensureValidHostname = function(v) {
	    // Theoretically URIs allow percent-encoding in Hostnames (according to RFC 3986)
	    // they are not part of DNS and therefore ignored by URI.js
	
	    if (v.match(URI.invalid_hostname_characters)) {
	      // test punycode
	      if (!punycode) {
	        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-] and Punycode.js is not available');
	      }
	
	      if (punycode.toASCII(v).match(URI.invalid_hostname_characters)) {
	        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
	      }
	    }
	  };
	
	  // noConflict
	  URI.noConflict = function(removeAll) {
	    if (removeAll) {
	      var unconflicted = {
	        URI: this.noConflict()
	      };
	
	      if (root.URITemplate && typeof root.URITemplate.noConflict === 'function') {
	        unconflicted.URITemplate = root.URITemplate.noConflict();
	      }
	
	      if (root.IPv6 && typeof root.IPv6.noConflict === 'function') {
	        unconflicted.IPv6 = root.IPv6.noConflict();
	      }
	
	      if (root.SecondLevelDomains && typeof root.SecondLevelDomains.noConflict === 'function') {
	        unconflicted.SecondLevelDomains = root.SecondLevelDomains.noConflict();
	      }
	
	      return unconflicted;
	    } else if (root.URI === this) {
	      root.URI = _URI;
	    }
	
	    return this;
	  };
	
	  p.build = function(deferBuild) {
	    if (deferBuild === true) {
	      this._deferred_build = true;
	    } else if (deferBuild === undefined || this._deferred_build) {
	      this._string = URI.build(this._parts);
	      this._deferred_build = false;
	    }
	
	    return this;
	  };
	
	  p.clone = function() {
	    return new URI(this);
	  };
	
	  p.valueOf = p.toString = function() {
	    return this.build(false)._string;
	  };
	
	
	  function generateSimpleAccessor(_part){
	    return function(v, build) {
	      if (v === undefined) {
	        return this._parts[_part] || '';
	      } else {
	        this._parts[_part] = v || null;
	        this.build(!build);
	        return this;
	      }
	    };
	  }
	
	  function generatePrefixAccessor(_part, _key){
	    return function(v, build) {
	      if (v === undefined) {
	        return this._parts[_part] || '';
	      } else {
	        if (v !== null) {
	          v = v + '';
	          if (v.charAt(0) === _key) {
	            v = v.substring(1);
	          }
	        }
	
	        this._parts[_part] = v;
	        this.build(!build);
	        return this;
	      }
	    };
	  }
	
	  p.protocol = generateSimpleAccessor('protocol');
	  p.username = generateSimpleAccessor('username');
	  p.password = generateSimpleAccessor('password');
	  p.hostname = generateSimpleAccessor('hostname');
	  p.port = generateSimpleAccessor('port');
	  p.query = generatePrefixAccessor('query', '?');
	  p.fragment = generatePrefixAccessor('fragment', '#');
	
	  p.search = function(v, build) {
	    var t = this.query(v, build);
	    return typeof t === 'string' && t.length ? ('?' + t) : t;
	  };
	  p.hash = function(v, build) {
	    var t = this.fragment(v, build);
	    return typeof t === 'string' && t.length ? ('#' + t) : t;
	  };
	
	  p.pathname = function(v, build) {
	    if (v === undefined || v === true) {
	      var res = this._parts.path || (this._parts.hostname ? '/' : '');
	      return v ? (this._parts.urn ? URI.decodeUrnPath : URI.decodePath)(res) : res;
	    } else {
	      if (this._parts.urn) {
	        this._parts.path = v ? URI.recodeUrnPath(v) : '';
	      } else {
	        this._parts.path = v ? URI.recodePath(v) : '/';
	      }
	      this.build(!build);
	      return this;
	    }
	  };
	  p.path = p.pathname;
	  p.href = function(href, build) {
	    var key;
	
	    if (href === undefined) {
	      return this.toString();
	    }
	
	    this._string = '';
	    this._parts = URI._parts();
	
	    var _URI = href instanceof URI;
	    var _object = typeof href === 'object' && (href.hostname || href.path || href.pathname);
	    if (href.nodeName) {
	      var attribute = URI.getDomAttribute(href);
	      href = href[attribute] || '';
	      _object = false;
	    }
	
	    // window.location is reported to be an object, but it's not the sort
	    // of object we're looking for:
	    // * location.protocol ends with a colon
	    // * location.query != object.search
	    // * location.hash != object.fragment
	    // simply serializing the unknown object should do the trick
	    // (for location, not for everything...)
	    if (!_URI && _object && href.pathname !== undefined) {
	      href = href.toString();
	    }
	
	    if (typeof href === 'string' || href instanceof String) {
	      this._parts = URI.parse(String(href), this._parts);
	    } else if (_URI || _object) {
	      var src = _URI ? href._parts : href;
	      for (key in src) {
	        if (hasOwn.call(this._parts, key)) {
	          this._parts[key] = src[key];
	        }
	      }
	    } else {
	      throw new TypeError('invalid input');
	    }
	
	    this.build(!build);
	    return this;
	  };
	
	  // identification accessors
	  p.is = function(what) {
	    var ip = false;
	    var ip4 = false;
	    var ip6 = false;
	    var name = false;
	    var sld = false;
	    var idn = false;
	    var punycode = false;
	    var relative = !this._parts.urn;
	
	    if (this._parts.hostname) {
	      relative = false;
	      ip4 = URI.ip4_expression.test(this._parts.hostname);
	      ip6 = URI.ip6_expression.test(this._parts.hostname);
	      ip = ip4 || ip6;
	      name = !ip;
	      sld = name && SLD && SLD.has(this._parts.hostname);
	      idn = name && URI.idn_expression.test(this._parts.hostname);
	      punycode = name && URI.punycode_expression.test(this._parts.hostname);
	    }
	
	    switch (what.toLowerCase()) {
	      case 'relative':
	        return relative;
	
	      case 'absolute':
	        return !relative;
	
	      // hostname identification
	      case 'domain':
	      case 'name':
	        return name;
	
	      case 'sld':
	        return sld;
	
	      case 'ip':
	        return ip;
	
	      case 'ip4':
	      case 'ipv4':
	      case 'inet4':
	        return ip4;
	
	      case 'ip6':
	      case 'ipv6':
	      case 'inet6':
	        return ip6;
	
	      case 'idn':
	        return idn;
	
	      case 'url':
	        return !this._parts.urn;
	
	      case 'urn':
	        return !!this._parts.urn;
	
	      case 'punycode':
	        return punycode;
	    }
	
	    return null;
	  };
	
	  // component specific input validation
	  var _protocol = p.protocol;
	  var _port = p.port;
	  var _hostname = p.hostname;
	
	  p.protocol = function(v, build) {
	    if (v !== undefined) {
	      if (v) {
	        // accept trailing ://
	        v = v.replace(/:(\/\/)?$/, '');
	
	        if (!v.match(URI.protocol_expression)) {
	          throw new TypeError('Protocol "' + v + '" contains characters other than [A-Z0-9.+-] or doesn\'t start with [A-Z]');
	        }
	      }
	    }
	    return _protocol.call(this, v, build);
	  };
	  p.scheme = p.protocol;
	  p.port = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v !== undefined) {
	      if (v === 0) {
	        v = null;
	      }
	
	      if (v) {
	        v += '';
	        if (v.charAt(0) === ':') {
	          v = v.substring(1);
	        }
	
	        if (v.match(/[^0-9]/)) {
	          throw new TypeError('Port "' + v + '" contains characters other than [0-9]');
	        }
	      }
	    }
	    return _port.call(this, v, build);
	  };
	  p.hostname = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v !== undefined) {
	      var x = {};
	      var res = URI.parseHost(v, x);
	      if (res !== '/') {
	        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
	      }
	
	      v = x.hostname;
	    }
	    return _hostname.call(this, v, build);
	  };
	
	  // compound accessors
	  p.host = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v === undefined) {
	      return this._parts.hostname ? URI.buildHost(this._parts) : '';
	    } else {
	      var res = URI.parseHost(v, this._parts);
	      if (res !== '/') {
	        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
	      }
	
	      this.build(!build);
	      return this;
	    }
	  };
	  p.authority = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v === undefined) {
	      return this._parts.hostname ? URI.buildAuthority(this._parts) : '';
	    } else {
	      var res = URI.parseAuthority(v, this._parts);
	      if (res !== '/') {
	        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
	      }
	
	      this.build(!build);
	      return this;
	    }
	  };
	  p.userinfo = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v === undefined) {
	      if (!this._parts.username) {
	        return '';
	      }
	
	      var t = URI.buildUserinfo(this._parts);
	      return t.substring(0, t.length -1);
	    } else {
	      if (v[v.length-1] !== '@') {
	        v += '@';
	      }
	
	      URI.parseUserinfo(v, this._parts);
	      this.build(!build);
	      return this;
	    }
	  };
	  p.resource = function(v, build) {
	    var parts;
	
	    if (v === undefined) {
	      return this.path() + this.search() + this.hash();
	    }
	
	    parts = URI.parse(v);
	    this._parts.path = parts.path;
	    this._parts.query = parts.query;
	    this._parts.fragment = parts.fragment;
	    this.build(!build);
	    return this;
	  };
	
	  // fraction accessors
	  p.subdomain = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    // convenience, return "www" from "www.example.org"
	    if (v === undefined) {
	      if (!this._parts.hostname || this.is('IP')) {
	        return '';
	      }
	
	      // grab domain and add another segment
	      var end = this._parts.hostname.length - this.domain().length - 1;
	      return this._parts.hostname.substring(0, end) || '';
	    } else {
	      var e = this._parts.hostname.length - this.domain().length;
	      var sub = this._parts.hostname.substring(0, e);
	      var replace = new RegExp('^' + escapeRegEx(sub));
	
	      if (v && v.charAt(v.length - 1) !== '.') {
	        v += '.';
	      }
	
	      if (v) {
	        URI.ensureValidHostname(v);
	      }
	
	      this._parts.hostname = this._parts.hostname.replace(replace, v);
	      this.build(!build);
	      return this;
	    }
	  };
	  p.domain = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (typeof v === 'boolean') {
	      build = v;
	      v = undefined;
	    }
	
	    // convenience, return "example.org" from "www.example.org"
	    if (v === undefined) {
	      if (!this._parts.hostname || this.is('IP')) {
	        return '';
	      }
	
	      // if hostname consists of 1 or 2 segments, it must be the domain
	      var t = this._parts.hostname.match(/\./g);
	      if (t && t.length < 2) {
	        return this._parts.hostname;
	      }
	
	      // grab tld and add another segment
	      var end = this._parts.hostname.length - this.tld(build).length - 1;
	      end = this._parts.hostname.lastIndexOf('.', end -1) + 1;
	      return this._parts.hostname.substring(end) || '';
	    } else {
	      if (!v) {
	        throw new TypeError('cannot set domain empty');
	      }
	
	      URI.ensureValidHostname(v);
	
	      if (!this._parts.hostname || this.is('IP')) {
	        this._parts.hostname = v;
	      } else {
	        var replace = new RegExp(escapeRegEx(this.domain()) + '$');
	        this._parts.hostname = this._parts.hostname.replace(replace, v);
	      }
	
	      this.build(!build);
	      return this;
	    }
	  };
	  p.tld = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (typeof v === 'boolean') {
	      build = v;
	      v = undefined;
	    }
	
	    // return "org" from "www.example.org"
	    if (v === undefined) {
	      if (!this._parts.hostname || this.is('IP')) {
	        return '';
	      }
	
	      var pos = this._parts.hostname.lastIndexOf('.');
	      var tld = this._parts.hostname.substring(pos + 1);
	
	      if (build !== true && SLD && SLD.list[tld.toLowerCase()]) {
	        return SLD.get(this._parts.hostname) || tld;
	      }
	
	      return tld;
	    } else {
	      var replace;
	
	      if (!v) {
	        throw new TypeError('cannot set TLD empty');
	      } else if (v.match(/[^a-zA-Z0-9-]/)) {
	        if (SLD && SLD.is(v)) {
	          replace = new RegExp(escapeRegEx(this.tld()) + '$');
	          this._parts.hostname = this._parts.hostname.replace(replace, v);
	        } else {
	          throw new TypeError('TLD "' + v + '" contains characters other than [A-Z0-9]');
	        }
	      } else if (!this._parts.hostname || this.is('IP')) {
	        throw new ReferenceError('cannot set TLD on non-domain host');
	      } else {
	        replace = new RegExp(escapeRegEx(this.tld()) + '$');
	        this._parts.hostname = this._parts.hostname.replace(replace, v);
	      }
	
	      this.build(!build);
	      return this;
	    }
	  };
	  p.directory = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v === undefined || v === true) {
	      if (!this._parts.path && !this._parts.hostname) {
	        return '';
	      }
	
	      if (this._parts.path === '/') {
	        return '/';
	      }
	
	      var end = this._parts.path.length - this.filename().length - 1;
	      var res = this._parts.path.substring(0, end) || (this._parts.hostname ? '/' : '');
	
	      return v ? URI.decodePath(res) : res;
	
	    } else {
	      var e = this._parts.path.length - this.filename().length;
	      var directory = this._parts.path.substring(0, e);
	      var replace = new RegExp('^' + escapeRegEx(directory));
	
	      // fully qualifier directories begin with a slash
	      if (!this.is('relative')) {
	        if (!v) {
	          v = '/';
	        }
	
	        if (v.charAt(0) !== '/') {
	          v = '/' + v;
	        }
	      }
	
	      // directories always end with a slash
	      if (v && v.charAt(v.length - 1) !== '/') {
	        v += '/';
	      }
	
	      v = URI.recodePath(v);
	      this._parts.path = this._parts.path.replace(replace, v);
	      this.build(!build);
	      return this;
	    }
	  };
	  p.filename = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v === undefined || v === true) {
	      if (!this._parts.path || this._parts.path === '/') {
	        return '';
	      }
	
	      var pos = this._parts.path.lastIndexOf('/');
	      var res = this._parts.path.substring(pos+1);
	
	      return v ? URI.decodePathSegment(res) : res;
	    } else {
	      var mutatedDirectory = false;
	
	      if (v.charAt(0) === '/') {
	        v = v.substring(1);
	      }
	
	      if (v.match(/\.?\//)) {
	        mutatedDirectory = true;
	      }
	
	      var replace = new RegExp(escapeRegEx(this.filename()) + '$');
	      v = URI.recodePath(v);
	      this._parts.path = this._parts.path.replace(replace, v);
	
	      if (mutatedDirectory) {
	        this.normalizePath(build);
	      } else {
	        this.build(!build);
	      }
	
	      return this;
	    }
	  };
	  p.suffix = function(v, build) {
	    if (this._parts.urn) {
	      return v === undefined ? '' : this;
	    }
	
	    if (v === undefined || v === true) {
	      if (!this._parts.path || this._parts.path === '/') {
	        return '';
	      }
	
	      var filename = this.filename();
	      var pos = filename.lastIndexOf('.');
	      var s, res;
	
	      if (pos === -1) {
	        return '';
	      }
	
	      // suffix may only contain alnum characters (yup, I made this up.)
	      s = filename.substring(pos+1);
	      res = (/^[a-z0-9%]+$/i).test(s) ? s : '';
	      return v ? URI.decodePathSegment(res) : res;
	    } else {
	      if (v.charAt(0) === '.') {
	        v = v.substring(1);
	      }
	
	      var suffix = this.suffix();
	      var replace;
	
	      if (!suffix) {
	        if (!v) {
	          return this;
	        }
	
	        this._parts.path += '.' + URI.recodePath(v);
	      } else if (!v) {
	        replace = new RegExp(escapeRegEx('.' + suffix) + '$');
	      } else {
	        replace = new RegExp(escapeRegEx(suffix) + '$');
	      }
	
	      if (replace) {
	        v = URI.recodePath(v);
	        this._parts.path = this._parts.path.replace(replace, v);
	      }
	
	      this.build(!build);
	      return this;
	    }
	  };
	  p.segment = function(segment, v, build) {
	    var separator = this._parts.urn ? ':' : '/';
	    var path = this.path();
	    var absolute = path.substring(0, 1) === '/';
	    var segments = path.split(separator);
	
	    if (segment !== undefined && typeof segment !== 'number') {
	      build = v;
	      v = segment;
	      segment = undefined;
	    }
	
	    if (segment !== undefined && typeof segment !== 'number') {
	      throw new Error('Bad segment "' + segment + '", must be 0-based integer');
	    }
	
	    if (absolute) {
	      segments.shift();
	    }
	
	    if (segment < 0) {
	      // allow negative indexes to address from the end
	      segment = Math.max(segments.length + segment, 0);
	    }
	
	    if (v === undefined) {
	      /*jshint laxbreak: true */
	      return segment === undefined
	        ? segments
	        : segments[segment];
	      /*jshint laxbreak: false */
	    } else if (segment === null || segments[segment] === undefined) {
	      if (isArray(v)) {
	        segments = [];
	        // collapse empty elements within array
	        for (var i=0, l=v.length; i < l; i++) {
	          if (!v[i].length && (!segments.length || !segments[segments.length -1].length)) {
	            continue;
	          }
	
	          if (segments.length && !segments[segments.length -1].length) {
	            segments.pop();
	          }
	
	          segments.push(v[i]);
	        }
	      } else if (v || typeof v === 'string') {
	        if (segments[segments.length -1] === '') {
	          // empty trailing elements have to be overwritten
	          // to prevent results such as /foo//bar
	          segments[segments.length -1] = v;
	        } else {
	          segments.push(v);
	        }
	      }
	    } else {
	      if (v) {
	        segments[segment] = v;
	      } else {
	        segments.splice(segment, 1);
	      }
	    }
	
	    if (absolute) {
	      segments.unshift('');
	    }
	
	    return this.path(segments.join(separator), build);
	  };
	  p.segmentCoded = function(segment, v, build) {
	    var segments, i, l;
	
	    if (typeof segment !== 'number') {
	      build = v;
	      v = segment;
	      segment = undefined;
	    }
	
	    if (v === undefined) {
	      segments = this.segment(segment, v, build);
	      if (!isArray(segments)) {
	        segments = segments !== undefined ? URI.decode(segments) : undefined;
	      } else {
	        for (i = 0, l = segments.length; i < l; i++) {
	          segments[i] = URI.decode(segments[i]);
	        }
	      }
	
	      return segments;
	    }
	
	    if (!isArray(v)) {
	      v = (typeof v === 'string' || v instanceof String) ? URI.encode(v) : v;
	    } else {
	      for (i = 0, l = v.length; i < l; i++) {
	        v[i] = URI.encode(v[i]);
	      }
	    }
	
	    return this.segment(segment, v, build);
	  };
	
	  // mutating query string
	  var q = p.query;
	  p.query = function(v, build) {
	    if (v === true) {
	      return URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
	    } else if (typeof v === 'function') {
	      var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
	      var result = v.call(this, data);
	      this._parts.query = URI.buildQuery(result || data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
	      this.build(!build);
	      return this;
	    } else if (v !== undefined && typeof v !== 'string') {
	      this._parts.query = URI.buildQuery(v, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
	      this.build(!build);
	      return this;
	    } else {
	      return q.call(this, v, build);
	    }
	  };
	  p.setQuery = function(name, value, build) {
	    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
	
	    if (typeof name === 'string' || name instanceof String) {
	      data[name] = value !== undefined ? value : null;
	    } else if (typeof name === 'object') {
	      for (var key in name) {
	        if (hasOwn.call(name, key)) {
	          data[key] = name[key];
	        }
	      }
	    } else {
	      throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
	    }
	
	    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
	    if (typeof name !== 'string') {
	      build = value;
	    }
	
	    this.build(!build);
	    return this;
	  };
	  p.addQuery = function(name, value, build) {
	    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
	    URI.addQuery(data, name, value === undefined ? null : value);
	    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
	    if (typeof name !== 'string') {
	      build = value;
	    }
	
	    this.build(!build);
	    return this;
	  };
	  p.removeQuery = function(name, value, build) {
	    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
	    URI.removeQuery(data, name, value);
	    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
	    if (typeof name !== 'string') {
	      build = value;
	    }
	
	    this.build(!build);
	    return this;
	  };
	  p.hasQuery = function(name, value, withinArray) {
	    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
	    return URI.hasQuery(data, name, value, withinArray);
	  };
	  p.setSearch = p.setQuery;
	  p.addSearch = p.addQuery;
	  p.removeSearch = p.removeQuery;
	  p.hasSearch = p.hasQuery;
	
	  // sanitizing URLs
	  p.normalize = function() {
	    if (this._parts.urn) {
	      return this
	        .normalizeProtocol(false)
	        .normalizePath(false)
	        .normalizeQuery(false)
	        .normalizeFragment(false)
	        .build();
	    }
	
	    return this
	      .normalizeProtocol(false)
	      .normalizeHostname(false)
	      .normalizePort(false)
	      .normalizePath(false)
	      .normalizeQuery(false)
	      .normalizeFragment(false)
	      .build();
	  };
	  p.normalizeProtocol = function(build) {
	    if (typeof this._parts.protocol === 'string') {
	      this._parts.protocol = this._parts.protocol.toLowerCase();
	      this.build(!build);
	    }
	
	    return this;
	  };
	  p.normalizeHostname = function(build) {
	    if (this._parts.hostname) {
	      if (this.is('IDN') && punycode) {
	        this._parts.hostname = punycode.toASCII(this._parts.hostname);
	      } else if (this.is('IPv6') && IPv6) {
	        this._parts.hostname = IPv6.best(this._parts.hostname);
	      }
	
	      this._parts.hostname = this._parts.hostname.toLowerCase();
	      this.build(!build);
	    }
	
	    return this;
	  };
	  p.normalizePort = function(build) {
	    // remove port of it's the protocol's default
	    if (typeof this._parts.protocol === 'string' && this._parts.port === URI.defaultPorts[this._parts.protocol]) {
	      this._parts.port = null;
	      this.build(!build);
	    }
	
	    return this;
	  };
	  p.normalizePath = function(build) {
	    var _path = this._parts.path;
	    if (!_path) {
	      return this;
	    }
	
	    if (this._parts.urn) {
	      this._parts.path = URI.recodeUrnPath(this._parts.path);
	      this.build(!build);
	      return this;
	    }
	
	    if (this._parts.path === '/') {
	      return this;
	    }
	
	    var _was_relative;
	    var _leadingParents = '';
	    var _parent, _pos;
	
	    // handle relative paths
	    if (_path.charAt(0) !== '/') {
	      _was_relative = true;
	      _path = '/' + _path;
	    }
	
	    // handle relative files (as opposed to directories)
	    if (_path.slice(-3) === '/..' || _path.slice(-2) === '/.') {
	      _path += '/';
	    }
	
	    // resolve simples
	    _path = _path
	      .replace(/(\/(\.\/)+)|(\/\.$)/g, '/')
	      .replace(/\/{2,}/g, '/');
	
	    // remember leading parents
	    if (_was_relative) {
	      _leadingParents = _path.substring(1).match(/^(\.\.\/)+/) || '';
	      if (_leadingParents) {
	        _leadingParents = _leadingParents[0];
	      }
	    }
	
	    // resolve parents
	    while (true) {
	      _parent = _path.indexOf('/..');
	      if (_parent === -1) {
	        // no more ../ to resolve
	        break;
	      } else if (_parent === 0) {
	        // top level cannot be relative, skip it
	        _path = _path.substring(3);
	        continue;
	      }
	
	      _pos = _path.substring(0, _parent).lastIndexOf('/');
	      if (_pos === -1) {
	        _pos = _parent;
	      }
	      _path = _path.substring(0, _pos) + _path.substring(_parent + 3);
	    }
	
	    // revert to relative
	    if (_was_relative && this.is('relative')) {
	      _path = _leadingParents + _path.substring(1);
	    }
	
	    _path = URI.recodePath(_path);
	    this._parts.path = _path;
	    this.build(!build);
	    return this;
	  };
	  p.normalizePathname = p.normalizePath;
	  p.normalizeQuery = function(build) {
	    if (typeof this._parts.query === 'string') {
	      if (!this._parts.query.length) {
	        this._parts.query = null;
	      } else {
	        this.query(URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace));
	      }
	
	      this.build(!build);
	    }
	
	    return this;
	  };
	  p.normalizeFragment = function(build) {
	    if (!this._parts.fragment) {
	      this._parts.fragment = null;
	      this.build(!build);
	    }
	
	    return this;
	  };
	  p.normalizeSearch = p.normalizeQuery;
	  p.normalizeHash = p.normalizeFragment;
	
	  p.iso8859 = function() {
	    // expect unicode input, iso8859 output
	    var e = URI.encode;
	    var d = URI.decode;
	
	    URI.encode = escape;
	    URI.decode = decodeURIComponent;
	    try {
	      this.normalize();
	    } finally {
	      URI.encode = e;
	      URI.decode = d;
	    }
	    return this;
	  };
	
	  p.unicode = function() {
	    // expect iso8859 input, unicode output
	    var e = URI.encode;
	    var d = URI.decode;
	
	    URI.encode = strictEncodeURIComponent;
	    URI.decode = unescape;
	    try {
	      this.normalize();
	    } finally {
	      URI.encode = e;
	      URI.decode = d;
	    }
	    return this;
	  };
	
	  p.readable = function() {
	    var uri = this.clone();
	    // removing username, password, because they shouldn't be displayed according to RFC 3986
	    uri.username('').password('').normalize();
	    var t = '';
	    if (uri._parts.protocol) {
	      t += uri._parts.protocol + '://';
	    }
	
	    if (uri._parts.hostname) {
	      if (uri.is('punycode') && punycode) {
	        t += punycode.toUnicode(uri._parts.hostname);
	        if (uri._parts.port) {
	          t += ':' + uri._parts.port;
	        }
	      } else {
	        t += uri.host();
	      }
	    }
	
	    if (uri._parts.hostname && uri._parts.path && uri._parts.path.charAt(0) !== '/') {
	      t += '/';
	    }
	
	    t += uri.path(true);
	    if (uri._parts.query) {
	      var q = '';
	      for (var i = 0, qp = uri._parts.query.split('&'), l = qp.length; i < l; i++) {
	        var kv = (qp[i] || '').split('=');
	        q += '&' + URI.decodeQuery(kv[0], this._parts.escapeQuerySpace)
	          .replace(/&/g, '%26');
	
	        if (kv[1] !== undefined) {
	          q += '=' + URI.decodeQuery(kv[1], this._parts.escapeQuerySpace)
	            .replace(/&/g, '%26');
	        }
	      }
	      t += '?' + q.substring(1);
	    }
	
	    t += URI.decodeQuery(uri.hash(), true);
	    return t;
	  };
	
	  // resolving relative and absolute URLs
	  p.absoluteTo = function(base) {
	    var resolved = this.clone();
	    var properties = ['protocol', 'username', 'password', 'hostname', 'port'];
	    var basedir, i, p;
	
	    if (this._parts.urn) {
	      throw new Error('URNs do not have any generally defined hierarchical components');
	    }
	
	    if (!(base instanceof URI)) {
	      base = new URI(base);
	    }
	
	    if (!resolved._parts.protocol) {
	      resolved._parts.protocol = base._parts.protocol;
	    }
	
	    if (this._parts.hostname) {
	      return resolved;
	    }
	
	    for (i = 0; (p = properties[i]); i++) {
	      resolved._parts[p] = base._parts[p];
	    }
	
	    if (!resolved._parts.path) {
	      resolved._parts.path = base._parts.path;
	      if (!resolved._parts.query) {
	        resolved._parts.query = base._parts.query;
	      }
	    } else if (resolved._parts.path.substring(-2) === '..') {
	      resolved._parts.path += '/';
	    }
	
	    if (resolved.path().charAt(0) !== '/') {
	      basedir = base.directory();
	      basedir = basedir ? basedir : base.path().indexOf('/') === 0 ? '/' : '';
	      resolved._parts.path = (basedir ? (basedir + '/') : '') + resolved._parts.path;
	      resolved.normalizePath();
	    }
	
	    resolved.build();
	    return resolved;
	  };
	  p.relativeTo = function(base) {
	    var relative = this.clone().normalize();
	    var relativeParts, baseParts, common, relativePath, basePath;
	
	    if (relative._parts.urn) {
	      throw new Error('URNs do not have any generally defined hierarchical components');
	    }
	
	    base = new URI(base).normalize();
	    relativeParts = relative._parts;
	    baseParts = base._parts;
	    relativePath = relative.path();
	    basePath = base.path();
	
	    if (relativePath.charAt(0) !== '/') {
	      throw new Error('URI is already relative');
	    }
	
	    if (basePath.charAt(0) !== '/') {
	      throw new Error('Cannot calculate a URI relative to another relative URI');
	    }
	
	    if (relativeParts.protocol === baseParts.protocol) {
	      relativeParts.protocol = null;
	    }
	
	    if (relativeParts.username !== baseParts.username || relativeParts.password !== baseParts.password) {
	      return relative.build();
	    }
	
	    if (relativeParts.protocol !== null || relativeParts.username !== null || relativeParts.password !== null) {
	      return relative.build();
	    }
	
	    if (relativeParts.hostname === baseParts.hostname && relativeParts.port === baseParts.port) {
	      relativeParts.hostname = null;
	      relativeParts.port = null;
	    } else {
	      return relative.build();
	    }
	
	    if (relativePath === basePath) {
	      relativeParts.path = '';
	      return relative.build();
	    }
	
	    // determine common sub path
	    common = URI.commonPath(relativePath, basePath);
	
	    // If the paths have nothing in common, return a relative URL with the absolute path.
	    if (!common) {
	      return relative.build();
	    }
	
	    var parents = baseParts.path
	      .substring(common.length)
	      .replace(/[^\/]*$/, '')
	      .replace(/.*?\//g, '../');
	
	    relativeParts.path = (parents + relativeParts.path.substring(common.length)) || './';
	
	    return relative.build();
	  };
	
	  // comparing URIs
	  p.equals = function(uri) {
	    var one = this.clone();
	    var two = new URI(uri);
	    var one_map = {};
	    var two_map = {};
	    var checked = {};
	    var one_query, two_query, key;
	
	    one.normalize();
	    two.normalize();
	
	    // exact match
	    if (one.toString() === two.toString()) {
	      return true;
	    }
	
	    // extract query string
	    one_query = one.query();
	    two_query = two.query();
	    one.query('');
	    two.query('');
	
	    // definitely not equal if not even non-query parts match
	    if (one.toString() !== two.toString()) {
	      return false;
	    }
	
	    // query parameters have the same length, even if they're permuted
	    if (one_query.length !== two_query.length) {
	      return false;
	    }
	
	    one_map = URI.parseQuery(one_query, this._parts.escapeQuerySpace);
	    two_map = URI.parseQuery(two_query, this._parts.escapeQuerySpace);
	
	    for (key in one_map) {
	      if (hasOwn.call(one_map, key)) {
	        if (!isArray(one_map[key])) {
	          if (one_map[key] !== two_map[key]) {
	            return false;
	          }
	        } else if (!arraysEqual(one_map[key], two_map[key])) {
	          return false;
	        }
	
	        checked[key] = true;
	      }
	    }
	
	    for (key in two_map) {
	      if (hasOwn.call(two_map, key)) {
	        if (!checked[key]) {
	          // two contains a parameter not present in one
	          return false;
	        }
	      }
	    }
	
	    return true;
	  };
	
	  // state
	  p.duplicateQueryParameters = function(v) {
	    this._parts.duplicateQueryParameters = !!v;
	    return this;
	  };
	
	  p.escapeQuerySpace = function(v) {
	    this._parts.escapeQuerySpace = !!v;
	    return this;
	  };
	
	  return URI;
	}));


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! http://mths.be/punycode v1.2.3 by @mathias */
	;(function(root) {
	
		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports;
		var freeModule = typeof module == 'object' && module &&
			module.exports == freeExports && module;
		var freeGlobal = typeof global == 'object' && global;
		if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
			root = freeGlobal;
		}
	
		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,
	
		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1
	
		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'
	
		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators
	
		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},
	
		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,
	
		/** Temporary variable */
		key;
	
		/*--------------------------------------------------------------------------*/
	
		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}
	
		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			while (length--) {
				array[length] = fn(array[length]);
			}
			return array;
		}
	
		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings.
		 * @private
		 * @param {String} domain The domain name.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			return map(string.split(regexSeparators), fn).join('.');
		}
	
		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}
	
		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}
	
		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}
	
		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}
	
		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}
	
		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    length,
			    /** Cached calculation results */
			    baseMinusT;
	
			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.
	
			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}
	
			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}
	
			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.
	
			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {
	
				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {
	
					if (index >= inputLength) {
						error('invalid-input');
					}
	
					digit = basicToDigit(input.charCodeAt(index++));
	
					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}
	
					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
	
					if (digit < t) {
						break;
					}
	
					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}
	
					w *= baseMinusT;
	
				}
	
				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);
	
				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}
	
				n += floor(i / out);
				i %= out;
	
				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);
	
			}
	
			return ucs2encode(output);
		}
	
		/**
		 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;
	
			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);
	
			// Cache the length
			inputLength = input.length;
	
			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;
	
			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}
	
			handledCPCount = basicLength = output.length;
	
			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.
	
			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}
	
			// Main encoding loop:
			while (handledCPCount < inputLength) {
	
				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}
	
				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}
	
				delta += (m - n) * handledCPCountPlusOne;
				n = m;
	
				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];
	
					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}
	
					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}
	
						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}
	
				++delta;
				++n;
	
			}
			return output.join('');
		}
	
		/**
		 * Converts a Punycode string representing a domain name to Unicode. Only the
		 * Punycoded parts of the domain name will be converted, i.e. it doesn't
		 * matter if you call it on a string that has already been converted to
		 * Unicode.
		 * @memberOf punycode
		 * @param {String} domain The Punycode domain name to convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(domain) {
			return mapDomain(domain, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}
	
		/**
		 * Converts a Unicode string representing a domain name to Punycode. Only the
		 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
		 * matter if you call it with a domain that's already in ASCII.
		 * @memberOf punycode
		 * @param {String} domain The domain name to convert, as a Unicode string.
		 * @returns {String} The Punycode representation of the given domain name.
		 */
		function toASCII(domain) {
			return mapDomain(domain, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}
	
		/*--------------------------------------------------------------------------*/
	
		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.2.3',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <http://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};
	
		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		}	else if (freeExports && !freeExports.nodeType) {
			if (freeModule) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}
	
	}(this));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(26)(module), (function() { return this; }())))

/***/ },
/* 26 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * URI.js - Mutating URLs
	 * IPv6 Support
	 *
	 * Version: 1.16.1
	 *
	 * Author: Rodney Rehm
	 * Web: http://medialize.github.io/URI.js/
	 *
	 * Licensed under
	 *   MIT License http://www.opensource.org/licenses/mit-license
	 *   GPL v3 http://opensource.org/licenses/GPL-3.0
	 *
	 */
	
	(function (root, factory) {
	  'use strict';
	  // https://github.com/umdjs/umd/blob/master/returnExports.js
	  if (true) {
	    // Node
	    module.exports = factory();
	  } else if (typeof define === 'function' && define.amd) {
	    // AMD. Register as an anonymous module.
	    define(factory);
	  } else {
	    // Browser globals (root is window)
	    root.IPv6 = factory(root);
	  }
	}(this, function (root) {
	  'use strict';
	
	  /*
	  var _in = "fe80:0000:0000:0000:0204:61ff:fe9d:f156";
	  var _out = IPv6.best(_in);
	  var _expected = "fe80::204:61ff:fe9d:f156";
	
	  console.log(_in, _out, _expected, _out === _expected);
	  */
	
	  // save current IPv6 variable, if any
	  var _IPv6 = root && root.IPv6;
	
	  function bestPresentation(address) {
	    // based on:
	    // Javascript to test an IPv6 address for proper format, and to
	    // present the "best text representation" according to IETF Draft RFC at
	    // http://tools.ietf.org/html/draft-ietf-6man-text-addr-representation-04
	    // 8 Feb 2010 Rich Brown, Dartware, LLC
	    // Please feel free to use this code as long as you provide a link to
	    // http://www.intermapper.com
	    // http://intermapper.com/support/tools/IPV6-Validator.aspx
	    // http://download.dartware.com/thirdparty/ipv6validator.js
	
	    var _address = address.toLowerCase();
	    var segments = _address.split(':');
	    var length = segments.length;
	    var total = 8;
	
	    // trim colons (:: or ::a:b:c… or …a:b:c::)
	    if (segments[0] === '' && segments[1] === '' && segments[2] === '') {
	      // must have been ::
	      // remove first two items
	      segments.shift();
	      segments.shift();
	    } else if (segments[0] === '' && segments[1] === '') {
	      // must have been ::xxxx
	      // remove the first item
	      segments.shift();
	    } else if (segments[length - 1] === '' && segments[length - 2] === '') {
	      // must have been xxxx::
	      segments.pop();
	    }
	
	    length = segments.length;
	
	    // adjust total segments for IPv4 trailer
	    if (segments[length - 1].indexOf('.') !== -1) {
	      // found a "." which means IPv4
	      total = 7;
	    }
	
	    // fill empty segments them with "0000"
	    var pos;
	    for (pos = 0; pos < length; pos++) {
	      if (segments[pos] === '') {
	        break;
	      }
	    }
	
	    if (pos < total) {
	      segments.splice(pos, 1, '0000');
	      while (segments.length < total) {
	        segments.splice(pos, 0, '0000');
	      }
	
	      length = segments.length;
	    }
	
	    // strip leading zeros
	    var _segments;
	    for (var i = 0; i < total; i++) {
	      _segments = segments[i].split('');
	      for (var j = 0; j < 3 ; j++) {
	        if (_segments[0] === '0' && _segments.length > 1) {
	          _segments.splice(0,1);
	        } else {
	          break;
	        }
	      }
	
	      segments[i] = _segments.join('');
	    }
	
	    // find longest sequence of zeroes and coalesce them into one segment
	    var best = -1;
	    var _best = 0;
	    var _current = 0;
	    var current = -1;
	    var inzeroes = false;
	    // i; already declared
	
	    for (i = 0; i < total; i++) {
	      if (inzeroes) {
	        if (segments[i] === '0') {
	          _current += 1;
	        } else {
	          inzeroes = false;
	          if (_current > _best) {
	            best = current;
	            _best = _current;
	          }
	        }
	      } else {
	        if (segments[i] === '0') {
	          inzeroes = true;
	          current = i;
	          _current = 1;
	        }
	      }
	    }
	
	    if (_current > _best) {
	      best = current;
	      _best = _current;
	    }
	
	    if (_best > 1) {
	      segments.splice(best, _best, '');
	    }
	
	    length = segments.length;
	
	    // assemble remaining segments
	    var result = '';
	    if (segments[0] === '')  {
	      result = ':';
	    }
	
	    for (i = 0; i < length; i++) {
	      result += segments[i];
	      if (i === length - 1) {
	        break;
	      }
	
	      result += ':';
	    }
	
	    if (segments[length - 1] === '') {
	      result += ':';
	    }
	
	    return result;
	  }
	
	  function noConflict() {
	    /*jshint validthis: true */
	    if (root.IPv6 === this) {
	      root.IPv6 = _IPv6;
	    }
	  
	    return this;
	  }
	
	  return {
	    best: bestPresentation,
	    noConflict: noConflict
	  };
	}));


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * URI.js - Mutating URLs
	 * Second Level Domain (SLD) Support
	 *
	 * Version: 1.16.1
	 *
	 * Author: Rodney Rehm
	 * Web: http://medialize.github.io/URI.js/
	 *
	 * Licensed under
	 *   MIT License http://www.opensource.org/licenses/mit-license
	 *   GPL v3 http://opensource.org/licenses/GPL-3.0
	 *
	 */
	
	(function (root, factory) {
	  'use strict';
	  // https://github.com/umdjs/umd/blob/master/returnExports.js
	  if (true) {
	    // Node
	    module.exports = factory();
	  } else if (typeof define === 'function' && define.amd) {
	    // AMD. Register as an anonymous module.
	    define(factory);
	  } else {
	    // Browser globals (root is window)
	    root.SecondLevelDomains = factory(root);
	  }
	}(this, function (root) {
	  'use strict';
	
	  // save current SecondLevelDomains variable, if any
	  var _SecondLevelDomains = root && root.SecondLevelDomains;
	
	  var SLD = {
	    // list of known Second Level Domains
	    // converted list of SLDs from https://github.com/gavingmiller/second-level-domains
	    // ----
	    // publicsuffix.org is more current and actually used by a couple of browsers internally.
	    // downside is it also contains domains like "dyndns.org" - which is fine for the security
	    // issues browser have to deal with (SOP for cookies, etc) - but is way overboard for URI.js
	    // ----
	    list: {
	      'ac':' com gov mil net org ',
	      'ae':' ac co gov mil name net org pro sch ',
	      'af':' com edu gov net org ',
	      'al':' com edu gov mil net org ',
	      'ao':' co ed gv it og pb ',
	      'ar':' com edu gob gov int mil net org tur ',
	      'at':' ac co gv or ',
	      'au':' asn com csiro edu gov id net org ',
	      'ba':' co com edu gov mil net org rs unbi unmo unsa untz unze ',
	      'bb':' biz co com edu gov info net org store tv ',
	      'bh':' biz cc com edu gov info net org ',
	      'bn':' com edu gov net org ',
	      'bo':' com edu gob gov int mil net org tv ',
	      'br':' adm adv agr am arq art ato b bio blog bmd cim cng cnt com coop ecn edu eng esp etc eti far flog fm fnd fot fst g12 ggf gov imb ind inf jor jus lel mat med mil mus net nom not ntr odo org ppg pro psc psi qsl rec slg srv tmp trd tur tv vet vlog wiki zlg ',
	      'bs':' com edu gov net org ',
	      'bz':' du et om ov rg ',
	      'ca':' ab bc mb nb nf nl ns nt nu on pe qc sk yk ',
	      'ck':' biz co edu gen gov info net org ',
	      'cn':' ac ah bj com cq edu fj gd gov gs gx gz ha hb he hi hl hn jl js jx ln mil net nm nx org qh sc sd sh sn sx tj tw xj xz yn zj ',
	      'co':' com edu gov mil net nom org ',
	      'cr':' ac c co ed fi go or sa ',
	      'cy':' ac biz com ekloges gov ltd name net org parliament press pro tm ',
	      'do':' art com edu gob gov mil net org sld web ',
	      'dz':' art asso com edu gov net org pol ',
	      'ec':' com edu fin gov info med mil net org pro ',
	      'eg':' com edu eun gov mil name net org sci ',
	      'er':' com edu gov ind mil net org rochest w ',
	      'es':' com edu gob nom org ',
	      'et':' biz com edu gov info name net org ',
	      'fj':' ac biz com info mil name net org pro ',
	      'fk':' ac co gov net nom org ',
	      'fr':' asso com f gouv nom prd presse tm ',
	      'gg':' co net org ',
	      'gh':' com edu gov mil org ',
	      'gn':' ac com gov net org ',
	      'gr':' com edu gov mil net org ',
	      'gt':' com edu gob ind mil net org ',
	      'gu':' com edu gov net org ',
	      'hk':' com edu gov idv net org ',
	      'hu':' 2000 agrar bolt casino city co erotica erotika film forum games hotel info ingatlan jogasz konyvelo lakas media news org priv reklam sex shop sport suli szex tm tozsde utazas video ',
	      'id':' ac co go mil net or sch web ',
	      'il':' ac co gov idf k12 muni net org ',
	      'in':' ac co edu ernet firm gen gov i ind mil net nic org res ',
	      'iq':' com edu gov i mil net org ',
	      'ir':' ac co dnssec gov i id net org sch ',
	      'it':' edu gov ',
	      'je':' co net org ',
	      'jo':' com edu gov mil name net org sch ',
	      'jp':' ac ad co ed go gr lg ne or ',
	      'ke':' ac co go info me mobi ne or sc ',
	      'kh':' com edu gov mil net org per ',
	      'ki':' biz com de edu gov info mob net org tel ',
	      'km':' asso com coop edu gouv k medecin mil nom notaires pharmaciens presse tm veterinaire ',
	      'kn':' edu gov net org ',
	      'kr':' ac busan chungbuk chungnam co daegu daejeon es gangwon go gwangju gyeongbuk gyeonggi gyeongnam hs incheon jeju jeonbuk jeonnam k kg mil ms ne or pe re sc seoul ulsan ',
	      'kw':' com edu gov net org ',
	      'ky':' com edu gov net org ',
	      'kz':' com edu gov mil net org ',
	      'lb':' com edu gov net org ',
	      'lk':' assn com edu gov grp hotel int ltd net ngo org sch soc web ',
	      'lr':' com edu gov net org ',
	      'lv':' asn com conf edu gov id mil net org ',
	      'ly':' com edu gov id med net org plc sch ',
	      'ma':' ac co gov m net org press ',
	      'mc':' asso tm ',
	      'me':' ac co edu gov its net org priv ',
	      'mg':' com edu gov mil nom org prd tm ',
	      'mk':' com edu gov inf name net org pro ',
	      'ml':' com edu gov net org presse ',
	      'mn':' edu gov org ',
	      'mo':' com edu gov net org ',
	      'mt':' com edu gov net org ',
	      'mv':' aero biz com coop edu gov info int mil museum name net org pro ',
	      'mw':' ac co com coop edu gov int museum net org ',
	      'mx':' com edu gob net org ',
	      'my':' com edu gov mil name net org sch ',
	      'nf':' arts com firm info net other per rec store web ',
	      'ng':' biz com edu gov mil mobi name net org sch ',
	      'ni':' ac co com edu gob mil net nom org ',
	      'np':' com edu gov mil net org ',
	      'nr':' biz com edu gov info net org ',
	      'om':' ac biz co com edu gov med mil museum net org pro sch ',
	      'pe':' com edu gob mil net nom org sld ',
	      'ph':' com edu gov i mil net ngo org ',
	      'pk':' biz com edu fam gob gok gon gop gos gov net org web ',
	      'pl':' art bialystok biz com edu gda gdansk gorzow gov info katowice krakow lodz lublin mil net ngo olsztyn org poznan pwr radom slupsk szczecin torun warszawa waw wroc wroclaw zgora ',
	      'pr':' ac biz com edu est gov info isla name net org pro prof ',
	      'ps':' com edu gov net org plo sec ',
	      'pw':' belau co ed go ne or ',
	      'ro':' arts com firm info nom nt org rec store tm www ',
	      'rs':' ac co edu gov in org ',
	      'sb':' com edu gov net org ',
	      'sc':' com edu gov net org ',
	      'sh':' co com edu gov net nom org ',
	      'sl':' com edu gov net org ',
	      'st':' co com consulado edu embaixada gov mil net org principe saotome store ',
	      'sv':' com edu gob org red ',
	      'sz':' ac co org ',
	      'tr':' av bbs bel biz com dr edu gen gov info k12 name net org pol tel tsk tv web ',
	      'tt':' aero biz cat co com coop edu gov info int jobs mil mobi museum name net org pro tel travel ',
	      'tw':' club com ebiz edu game gov idv mil net org ',
	      'mu':' ac co com gov net or org ',
	      'mz':' ac co edu gov org ',
	      'na':' co com ',
	      'nz':' ac co cri geek gen govt health iwi maori mil net org parliament school ',
	      'pa':' abo ac com edu gob ing med net nom org sld ',
	      'pt':' com edu gov int net nome org publ ',
	      'py':' com edu gov mil net org ',
	      'qa':' com edu gov mil net org ',
	      're':' asso com nom ',
	      'ru':' ac adygeya altai amur arkhangelsk astrakhan bashkiria belgorod bir bryansk buryatia cbg chel chelyabinsk chita chukotka chuvashia com dagestan e-burg edu gov grozny int irkutsk ivanovo izhevsk jar joshkar-ola kalmykia kaluga kamchatka karelia kazan kchr kemerovo khabarovsk khakassia khv kirov koenig komi kostroma kranoyarsk kuban kurgan kursk lipetsk magadan mari mari-el marine mil mordovia mosreg msk murmansk nalchik net nnov nov novosibirsk nsk omsk orenburg org oryol penza perm pp pskov ptz rnd ryazan sakhalin samara saratov simbirsk smolensk spb stavropol stv surgut tambov tatarstan tom tomsk tsaritsyn tsk tula tuva tver tyumen udm udmurtia ulan-ude vladikavkaz vladimir vladivostok volgograd vologda voronezh vrn vyatka yakutia yamal yekaterinburg yuzhno-sakhalinsk ',
	      'rw':' ac co com edu gouv gov int mil net ',
	      'sa':' com edu gov med net org pub sch ',
	      'sd':' com edu gov info med net org tv ',
	      'se':' a ac b bd c d e f g h i k l m n o org p parti pp press r s t tm u w x y z ',
	      'sg':' com edu gov idn net org per ',
	      'sn':' art com edu gouv org perso univ ',
	      'sy':' com edu gov mil net news org ',
	      'th':' ac co go in mi net or ',
	      'tj':' ac biz co com edu go gov info int mil name net nic org test web ',
	      'tn':' agrinet com defense edunet ens fin gov ind info intl mincom nat net org perso rnrt rns rnu tourism ',
	      'tz':' ac co go ne or ',
	      'ua':' biz cherkassy chernigov chernovtsy ck cn co com crimea cv dn dnepropetrovsk donetsk dp edu gov if in ivano-frankivsk kh kharkov kherson khmelnitskiy kiev kirovograd km kr ks kv lg lugansk lutsk lviv me mk net nikolaev od odessa org pl poltava pp rovno rv sebastopol sumy te ternopil uzhgorod vinnica vn zaporizhzhe zhitomir zp zt ',
	      'ug':' ac co go ne or org sc ',
	      'uk':' ac bl british-library co cym gov govt icnet jet lea ltd me mil mod national-library-scotland nel net nhs nic nls org orgn parliament plc police sch scot soc ',
	      'us':' dni fed isa kids nsn ',
	      'uy':' com edu gub mil net org ',
	      've':' co com edu gob info mil net org web ',
	      'vi':' co com k12 net org ',
	      'vn':' ac biz com edu gov health info int name net org pro ',
	      'ye':' co com gov ltd me net org plc ',
	      'yu':' ac co edu gov org ',
	      'za':' ac agric alt bourse city co cybernet db edu gov grondar iaccess imt inca landesign law mil net ngo nis nom olivetti org pix school tm web ',
	      'zm':' ac co com edu gov net org sch '
	    },
	    // gorhill 2013-10-25: Using indexOf() instead Regexp(). Significant boost
	    // in both performance and memory footprint. No initialization required.
	    // http://jsperf.com/uri-js-sld-regex-vs-binary-search/4
	    // Following methods use lastIndexOf() rather than array.split() in order
	    // to avoid any memory allocations.
	    has: function(domain) {
	      var tldOffset = domain.lastIndexOf('.');
	      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
	        return false;
	      }
	      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
	      if (sldOffset <= 0 || sldOffset >= (tldOffset-1)) {
	        return false;
	      }
	      var sldList = SLD.list[domain.slice(tldOffset+1)];
	      if (!sldList) {
	        return false;
	      }
	      return sldList.indexOf(' ' + domain.slice(sldOffset+1, tldOffset) + ' ') >= 0;
	    },
	    is: function(domain) {
	      var tldOffset = domain.lastIndexOf('.');
	      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
	        return false;
	      }
	      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
	      if (sldOffset >= 0) {
	        return false;
	      }
	      var sldList = SLD.list[domain.slice(tldOffset+1)];
	      if (!sldList) {
	        return false;
	      }
	      return sldList.indexOf(' ' + domain.slice(0, tldOffset) + ' ') >= 0;
	    },
	    get: function(domain) {
	      var tldOffset = domain.lastIndexOf('.');
	      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
	        return null;
	      }
	      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
	      if (sldOffset <= 0 || sldOffset >= (tldOffset-1)) {
	        return null;
	      }
	      var sldList = SLD.list[domain.slice(tldOffset+1)];
	      if (!sldList) {
	        return null;
	      }
	      if (sldList.indexOf(' ' + domain.slice(sldOffset+1, tldOffset) + ' ') < 0) {
	        return null;
	      }
	      return domain.slice(sldOffset+1);
	    },
	    noConflict: function(){
	      if (root.SecondLevelDomains === this) {
	        root.SecondLevelDomains = _SecondLevelDomains;
	      }
	      return this;
	    }
	  };
	
	  return SLD;
	}));


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * URI.js - Mutating URLs
	 * URI Template Support - http://tools.ietf.org/html/rfc6570
	 *
	 * Version: 1.16.1
	 *
	 * Author: Rodney Rehm
	 * Web: http://medialize.github.io/URI.js/
	 *
	 * Licensed under
	 *   MIT License http://www.opensource.org/licenses/mit-license
	 *   GPL v3 http://opensource.org/licenses/GPL-3.0
	 *
	 */
	(function (root, factory) {
	  'use strict';
	  // https://github.com/umdjs/umd/blob/master/returnExports.js
	  if (true) {
	    // Node
	    module.exports = factory(__webpack_require__(24));
	  } else if (typeof define === 'function' && define.amd) {
	    // AMD. Register as an anonymous module.
	    define(['./URI'], factory);
	  } else {
	    // Browser globals (root is window)
	    root.URITemplate = factory(root.URI, root);
	  }
	}(this, function (URI, root) {
	  'use strict';
	  // FIXME: v2.0.0 renamce non-camelCase properties to uppercase
	  /*jshint camelcase: false */
	
	  // save current URITemplate variable, if any
	  var _URITemplate = root && root.URITemplate;
	
	  var hasOwn = Object.prototype.hasOwnProperty;
	  function URITemplate(expression) {
	    // serve from cache where possible
	    if (URITemplate._cache[expression]) {
	      return URITemplate._cache[expression];
	    }
	
	    // Allow instantiation without the 'new' keyword
	    if (!(this instanceof URITemplate)) {
	      return new URITemplate(expression);
	    }
	
	    this.expression = expression;
	    URITemplate._cache[expression] = this;
	    return this;
	  }
	
	  function Data(data) {
	    this.data = data;
	    this.cache = {};
	  }
	
	  var p = URITemplate.prototype;
	  // list of operators and their defined options
	  var operators = {
	    // Simple string expansion
	    '' : {
	      prefix: '',
	      separator: ',',
	      named: false,
	      empty_name_separator: false,
	      encode : 'encode'
	    },
	    // Reserved character strings
	    '+' : {
	      prefix: '',
	      separator: ',',
	      named: false,
	      empty_name_separator: false,
	      encode : 'encodeReserved'
	    },
	    // Fragment identifiers prefixed by '#'
	    '#' : {
	      prefix: '#',
	      separator: ',',
	      named: false,
	      empty_name_separator: false,
	      encode : 'encodeReserved'
	    },
	    // Name labels or extensions prefixed by '.'
	    '.' : {
	      prefix: '.',
	      separator: '.',
	      named: false,
	      empty_name_separator: false,
	      encode : 'encode'
	    },
	    // Path segments prefixed by '/'
	    '/' : {
	      prefix: '/',
	      separator: '/',
	      named: false,
	      empty_name_separator: false,
	      encode : 'encode'
	    },
	    // Path parameter name or name=value pairs prefixed by ';'
	    ';' : {
	      prefix: ';',
	      separator: ';',
	      named: true,
	      empty_name_separator: false,
	      encode : 'encode'
	    },
	    // Query component beginning with '?' and consisting
	    // of name=value pairs separated by '&'; an
	    '?' : {
	      prefix: '?',
	      separator: '&',
	      named: true,
	      empty_name_separator: true,
	      encode : 'encode'
	    },
	    // Continuation of query-style &name=value pairs
	    // within a literal query component.
	    '&' : {
	      prefix: '&',
	      separator: '&',
	      named: true,
	      empty_name_separator: true,
	      encode : 'encode'
	    }
	
	    // The operator characters equals ("="), comma (","), exclamation ("!"),
	    // at sign ("@"), and pipe ("|") are reserved for future extensions.
	  };
	
	  // storage for already parsed templates
	  URITemplate._cache = {};
	  // pattern to identify expressions [operator, variable-list] in template
	  URITemplate.EXPRESSION_PATTERN = /\{([^a-zA-Z0-9%_]?)([^\}]+)(\}|$)/g;
	  // pattern to identify variables [name, explode, maxlength] in variable-list
	  URITemplate.VARIABLE_PATTERN = /^([^*:]+)((\*)|:(\d+))?$/;
	  // pattern to verify variable name integrity
	  URITemplate.VARIABLE_NAME_PATTERN = /[^a-zA-Z0-9%_]/;
	
	  // expand parsed expression (expression, not template!)
	  URITemplate.expand = function(expression, data) {
	    // container for defined options for the given operator
	    var options = operators[expression.operator];
	    // expansion type (include keys or not)
	    var type = options.named ? 'Named' : 'Unnamed';
	    // list of variables within the expression
	    var variables = expression.variables;
	    // result buffer for evaluating the expression
	    var buffer = [];
	    var d, variable, i;
	
	    for (i = 0; (variable = variables[i]); i++) {
	      // fetch simplified data source
	      d = data.get(variable.name);
	      if (!d.val.length) {
	        if (d.type) {
	          // empty variables (empty string)
	          // still lead to a separator being appended!
	          buffer.push('');
	        }
	        // no data, no action
	        continue;
	      }
	
	      // expand the given variable
	      buffer.push(URITemplate['expand' + type](
	        d,
	        options,
	        variable.explode,
	        variable.explode && options.separator || ',',
	        variable.maxlength,
	        variable.name
	      ));
	    }
	
	    if (buffer.length) {
	      return options.prefix + buffer.join(options.separator);
	    } else {
	      // prefix is not prepended for empty expressions
	      return '';
	    }
	  };
	  // expand a named variable
	  URITemplate.expandNamed = function(d, options, explode, separator, length, name) {
	    // variable result buffer
	    var result = '';
	    // peformance crap
	    var encode = options.encode;
	    var empty_name_separator = options.empty_name_separator;
	    // flag noting if values are already encoded
	    var _encode = !d[encode].length;
	    // key for named expansion
	    var _name = d.type === 2 ? '': URI[encode](name);
	    var _value, i, l;
	
	    // for each found value
	    for (i = 0, l = d.val.length; i < l; i++) {
	      if (length) {
	        // maxlength must be determined before encoding can happen
	        _value = URI[encode](d.val[i][1].substring(0, length));
	        if (d.type === 2) {
	          // apply maxlength to keys of objects as well
	          _name = URI[encode](d.val[i][0].substring(0, length));
	        }
	      } else if (_encode) {
	        // encode value
	        _value = URI[encode](d.val[i][1]);
	        if (d.type === 2) {
	          // encode name and cache encoded value
	          _name = URI[encode](d.val[i][0]);
	          d[encode].push([_name, _value]);
	        } else {
	          // cache encoded value
	          d[encode].push([undefined, _value]);
	        }
	      } else {
	        // values are already encoded and can be pulled from cache
	        _value = d[encode][i][1];
	        if (d.type === 2) {
	          _name = d[encode][i][0];
	        }
	      }
	
	      if (result) {
	        // unless we're the first value, prepend the separator
	        result += separator;
	      }
	
	      if (!explode) {
	        if (!i) {
	          // first element, so prepend variable name
	          result += URI[encode](name) + (empty_name_separator || _value ? '=' : '');
	        }
	
	        if (d.type === 2) {
	          // without explode-modifier, keys of objects are returned comma-separated
	          result += _name + ',';
	        }
	
	        result += _value;
	      } else {
	        // only add the = if it is either default (?&) or there actually is a value (;)
	        result += _name + (empty_name_separator || _value ? '=' : '') + _value;
	      }
	    }
	
	    return result;
	  };
	  // expand an unnamed variable
	  URITemplate.expandUnnamed = function(d, options, explode, separator, length) {
	    // variable result buffer
	    var result = '';
	    // performance crap
	    var encode = options.encode;
	    var empty_name_separator = options.empty_name_separator;
	    // flag noting if values are already encoded
	    var _encode = !d[encode].length;
	    var _name, _value, i, l;
	
	    // for each found value
	    for (i = 0, l = d.val.length; i < l; i++) {
	      if (length) {
	        // maxlength must be determined before encoding can happen
	        _value = URI[encode](d.val[i][1].substring(0, length));
	      } else if (_encode) {
	        // encode and cache value
	        _value = URI[encode](d.val[i][1]);
	        d[encode].push([
	          d.type === 2 ? URI[encode](d.val[i][0]) : undefined,
	          _value
	        ]);
	      } else {
	        // value already encoded, pull from cache
	        _value = d[encode][i][1];
	      }
	
	      if (result) {
	        // unless we're the first value, prepend the separator
	        result += separator;
	      }
	
	      if (d.type === 2) {
	        if (length) {
	          // maxlength also applies to keys of objects
	          _name = URI[encode](d.val[i][0].substring(0, length));
	        } else {
	          // at this point the name must already be encoded
	          _name = d[encode][i][0];
	        }
	
	        result += _name;
	        if (explode) {
	          // explode-modifier separates name and value by "="
	          result += (empty_name_separator || _value ? '=' : '');
	        } else {
	          // no explode-modifier separates name and value by ","
	          result += ',';
	        }
	      }
	
	      result += _value;
	    }
	
	    return result;
	  };
	
	  URITemplate.noConflict = function() {
	    if (root.URITemplate === URITemplate) {
	      root.URITemplate = _URITemplate;
	    }
	
	    return URITemplate;
	  };
	
	  // expand template through given data map
	  p.expand = function(data) {
	    var result = '';
	
	    if (!this.parts || !this.parts.length) {
	      // lazilyy parse the template
	      this.parse();
	    }
	
	    if (!(data instanceof Data)) {
	      // make given data available through the
	      // optimized data handling thingie
	      data = new Data(data);
	    }
	
	    for (var i = 0, l = this.parts.length; i < l; i++) {
	      /*jshint laxbreak: true */
	      result += typeof this.parts[i] === 'string'
	        // literal string
	        ? this.parts[i]
	        // expression
	        : URITemplate.expand(this.parts[i], data);
	      /*jshint laxbreak: false */
	    }
	
	    return result;
	  };
	  // parse template into action tokens
	  p.parse = function() {
	    // performance crap
	    var expression = this.expression;
	    var ePattern = URITemplate.EXPRESSION_PATTERN;
	    var vPattern = URITemplate.VARIABLE_PATTERN;
	    var nPattern = URITemplate.VARIABLE_NAME_PATTERN;
	    // token result buffer
	    var parts = [];
	      // position within source template
	    var pos = 0;
	    var variables, eMatch, vMatch;
	
	    // RegExp is shared accross all templates,
	    // which requires a manual reset
	    ePattern.lastIndex = 0;
	    // I don't like while(foo = bar()) loops,
	    // to make things simpler I go while(true) and break when required
	    while (true) {
	      eMatch = ePattern.exec(expression);
	      if (eMatch === null) {
	        // push trailing literal
	        parts.push(expression.substring(pos));
	        break;
	      } else {
	        // push leading literal
	        parts.push(expression.substring(pos, eMatch.index));
	        pos = eMatch.index + eMatch[0].length;
	      }
	
	      if (!operators[eMatch[1]]) {
	        throw new Error('Unknown Operator "' + eMatch[1]  + '" in "' + eMatch[0] + '"');
	      } else if (!eMatch[3]) {
	        throw new Error('Unclosed Expression "' + eMatch[0]  + '"');
	      }
	
	      // parse variable-list
	      variables = eMatch[2].split(',');
	      for (var i = 0, l = variables.length; i < l; i++) {
	        vMatch = variables[i].match(vPattern);
	        if (vMatch === null) {
	          throw new Error('Invalid Variable "' + variables[i] + '" in "' + eMatch[0] + '"');
	        } else if (vMatch[1].match(nPattern)) {
	          throw new Error('Invalid Variable Name "' + vMatch[1] + '" in "' + eMatch[0] + '"');
	        }
	
	        variables[i] = {
	          name: vMatch[1],
	          explode: !!vMatch[3],
	          maxlength: vMatch[4] && parseInt(vMatch[4], 10)
	        };
	      }
	
	      if (!variables.length) {
	        throw new Error('Expression Missing Variable(s) "' + eMatch[0] + '"');
	      }
	
	      parts.push({
	        expression: eMatch[0],
	        operator: eMatch[1],
	        variables: variables
	      });
	    }
	
	    if (!parts.length) {
	      // template doesn't contain any expressions
	      // so it is a simple literal string
	      // this probably should fire a warning or something?
	      parts.push(expression);
	    }
	
	    this.parts = parts;
	    return this;
	  };
	
	  // simplify data structures
	  Data.prototype.get = function(key) {
	    // performance crap
	    var data = this.data;
	    // cache for processed data-point
	    var d = {
	      // type of data 0: undefined/null, 1: string, 2: object, 3: array
	      type: 0,
	      // original values (except undefined/null)
	      val: [],
	      // cache for encoded values (only for non-maxlength expansion)
	      encode: [],
	      encodeReserved: []
	    };
	    var i, l, value;
	
	    if (this.cache[key] !== undefined) {
	      // we've already processed this key
	      return this.cache[key];
	    }
	
	    this.cache[key] = d;
	
	    if (String(Object.prototype.toString.call(data)) === '[object Function]') {
	      // data itself is a callback (global callback)
	      value = data(key);
	    } else if (String(Object.prototype.toString.call(data[key])) === '[object Function]') {
	      // data is a map of callbacks (local callback)
	      value = data[key](key);
	    } else {
	      // data is a map of data
	      value = data[key];
	    }
	
	    // generalize input into [ [name1, value1], [name2, value2], … ]
	    // so expansion has to deal with a single data structure only
	    if (value === undefined || value === null) {
	      // undefined and null values are to be ignored completely
	      return d;
	    } else if (String(Object.prototype.toString.call(value)) === '[object Array]') {
	      for (i = 0, l = value.length; i < l; i++) {
	        if (value[i] !== undefined && value[i] !== null) {
	          // arrays don't have names
	          d.val.push([undefined, String(value[i])]);
	        }
	      }
	
	      if (d.val.length) {
	        // only treat non-empty arrays as arrays
	        d.type = 3; // array
	      }
	    } else if (String(Object.prototype.toString.call(value)) === '[object Object]') {
	      for (i in value) {
	        if (hasOwn.call(value, i) && value[i] !== undefined && value[i] !== null) {
	          // objects have keys, remember them for named expansion
	          d.val.push([i, String(value[i])]);
	        }
	      }
	
	      if (d.val.length) {
	        // only treat non-empty objects as objects
	        d.type = 2; // object
	      }
	    } else {
	      d.type = 1; // primitive string (could've been string, number, boolean and objects with a toString())
	      // arrays don't have names
	      d.val.push([undefined, String(value)]);
	    }
	
	    return d;
	  };
	
	  // hook into URI for fluid access
	  URI.expand = function(expression, data) {
	    var template = new URITemplate(expression);
	    var expansion = template.expand(data);
	
	    return new URI(expansion);
	  };
	
	  return URITemplate;
	}));


/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCBlMTFiYzVkZjE5Nzc1ZjE5OTY2OSIsIndlYnBhY2s6Ly8vLi9zcmMvaGFsb24uanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovLy9leHRlcm5hbCB7XCJyb290XCI6XCJfXCIsXCJjb21tb25qc1wiOlwibG9kYXNoXCIsXCJjb21tb25qczJcIjpcImxvZGFzaFwiLFwiYW1kXCI6XCJsb2Rhc2hcIn0iLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwibWFjaGluYVwiIiwid2VicGFjazovLy8uL34vd2hlbi93aGVuLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvZGVjb3JhdG9ycy90aW1lZC5qcyIsIndlYnBhY2s6Ly8vLi9+L3doZW4vbGliL2Vudi5qcyIsIndlYnBhY2s6Ly8vdmVydHggKGlnbm9yZWQpIiwid2VicGFjazovLy8od2VicGFjaykvYnVpbGRpbi9hbWQtZGVmaW5lLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvVGltZW91dEVycm9yLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvZGVjb3JhdG9ycy9hcnJheS5qcyIsIndlYnBhY2s6Ly8vLi9+L3doZW4vbGliL3N0YXRlLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvYXBwbHkuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL2Zsb3cuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL2ZvbGQuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL2luc3BlY3QuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL2l0ZXJhdGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL3Byb2dyZXNzLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvZGVjb3JhdG9ycy93aXRoLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvZGVjb3JhdG9ycy91bmhhbmRsZWRSZWplY3Rpb24uanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9mb3JtYXQuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9Qcm9taXNlLmpzIiwid2VicGFjazovLy8uL34vd2hlbi9saWIvbWFrZVByb21pc2UuanMiLCJ3ZWJwYWNrOi8vLy4vfi93aGVuL2xpYi9TY2hlZHVsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9VUklqcy9zcmMvVVJJLmpzIiwid2VicGFjazovLy8uL34vVVJJanMvc3JjL3B1bnljb2RlLmpzIiwid2VicGFjazovLy8od2VicGFjaykvYnVpbGRpbi9tb2R1bGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9VUklqcy9zcmMvSVB2Ni5qcyIsIndlYnBhY2s6Ly8vLi9+L1VSSWpzL3NyYy9TZWNvbmRMZXZlbERvbWFpbnMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9VUklqcy9zcmMvVVJJVGVtcGxhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7S0N0Q08sQ0FBQyx1Q0FBTSxDQUFROztLQUNmLE9BQU8sdUNBQU0sQ0FBUzs7S0FDdEIsSUFBSSx1Q0FBTSxDQUFNOztLQUNoQixHQUFHLHVDQUFNLEVBQU87O3FCQUNoQixFQUF1Qjs7QUFFOUIs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Q0E7QUFDQSx3QkFBdUI7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0VBQXVFO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0RUFBMkU7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLGdEQUErQyxZQUFZO0FBQzNEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBbUIsWUFBWTtBQUMvQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTRCO0FBQzVCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBZ0QsWUFBWTtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHdDQUF1QyxZQUFZO0FBQ25EO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVztBQUNYO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE1BQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDZCQUE0Qjs7QUFFNUI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esa0JBQWlCLGNBQWM7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLDZCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBSztBQUNMOztBQUVBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUEsTUFBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxrQ0FBaUMsT0FBTztBQUN4QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQLHlDQUF3QyxPQUFPO0FBQy9DO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFLO0FBQ0wsZ0NBQStCLE9BQU87QUFDdEM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxvQkFBbUIsR0FBRzs7QUFFdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUVBQXNFLE9BQU87QUFDN0U7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZSxxQkFBcUI7QUFDcEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtB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Q0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGdCQUFlLFlBQVk7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFDOzs7Ozs7O0FDM0xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNEOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxFQUFDOzs7Ozs7O0FDaFBEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxFQUFDO0FBQ0Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLDhEQUE2RDtBQUM3RCxPQUFNO0FBQ04saUJBQWdCO0FBQ2hCLG9CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQSw2Q0FBNEM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUNBQXNDLHNCQUFzQixNQUFNO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsZ0JBQWUsMkJBQTJCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGtDQUFpQyxPQUFPO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFPO0FBQ1AsdUZBQXNGO0FBQ3RGO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxrQ0FBaUMsT0FBTztBQUN4QztBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsMkNBQTBDLE9BQU87QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQSw0Q0FBMkMsT0FBTztBQUNsRDtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLG9DQUFtQyxPQUFPO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG9CQUFtQjtBQUNuQjtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG9CQUFtQjtBQUNuQjtBQUNBLE1BQUs7QUFDTCxrQkFBaUI7QUFDakI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLEVBQUMiLCJmaWxlIjoiaGFsb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoXCJsb2Rhc2hcIiksIHJlcXVpcmUoXCJtYWNoaW5hXCIpKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtcImxvZGFzaFwiLCBcIm1hY2hpbmFcIl0sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiaGFsb25cIl0gPSBmYWN0b3J5KHJlcXVpcmUoXCJsb2Rhc2hcIiksIHJlcXVpcmUoXCJtYWNoaW5hXCIpKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJoYWxvblwiXSA9IGZhY3Rvcnkocm9vdFtcIl9cIl0sIHJvb3RbXCJtYWNoaW5hXCJdKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMl9fLCBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzNfXykge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgZTExYmM1ZGYxOTc3NWYxOTk2NjlcbiAqKi8iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgbWFjaGluYSBmcm9tIFwibWFjaGluYVwiO1xuaW1wb3J0IHdoZW4gZnJvbSBcIndoZW5cIjtcbmltcG9ydCBVUkkgZnJvbSBcIlVSSWpzXCI7XG5pbXBvcnQgXCJVUklqcy9zcmMvVVJJVGVtcGxhdGVcIjtcblxubGV0IF9kZWZhdWx0QWRhcHRlcjtcblxuZnVuY3Rpb24gZXhwYW5kTGluayggYWN0aW9uLCBkYXRhICkge1xuXHRsZXQgaHJlZiA9IFVSSS5leHBhbmQoIGFjdGlvbi5ocmVmLCBkYXRhICkuaHJlZigpO1xuXHRjb25zdCBxdWVyeSA9IGRhdGFbIFwiP1wiIF07XG5cdGlmICggcXVlcnkgKSB7XG5cdFx0aHJlZiA9IGhyZWYgKyBcIj9cIiArIF8ubWFwKCBxdWVyeSwgZnVuY3Rpb24oIHZhbCwgcGFyYW0gKSB7XG5cdFx0XHRyZXR1cm4gcGFyYW0gKyBcIj1cIiArIFVSSS5lbmNvZGUoIHZhbCApO1xuXHRcdH0gKS5qb2luKCBcIiZcIiApO1xuXHRcdGRlbGV0ZSBkYXRhWyBcIj9cIiBdO1xuXHR9IGVsc2UgaWYgKCBhY3Rpb24ucGFyYW1ldGVycyApIHtcblx0XHRocmVmID0gaHJlZiArIFwiP1wiICsgXy5jb21wYWN0KCBfLm1hcCggYWN0aW9uLnBhcmFtZXRlcnMsIGZ1bmN0aW9uKCBwYXJhbSwga2V5ICkge1xuXHRcdFx0XHRpZiAoIGRhdGFbIGtleSBdICkge1xuXHRcdFx0XHRcdHJldHVybiBrZXkgKyBcIj1cIiArIFVSSS5lbmNvZGUoIGRhdGFbIGtleSBdICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKSApLmpvaW4oIFwiJlwiICk7XG5cdH1cblx0cmV0dXJuIGhyZWY7XG59XG5cbmZ1bmN0aW9uIGludm9rZVJlc291cmNlKCBmc20sIGtleSwgZGF0YSA9IHt9LCBoZWFkZXJzID0ge30gKSB7XG5cdHJldHVybiB3aGVuLnByb21pc2UoIGZ1bmN0aW9uKCByZXNvbHZlLCByZWplY3QgKSB7XG5cdFx0ZnNtLmhhbmRsZShcblx0XHRcdFwiaW52b2tlLnJlc291cmNlXCIsXG5cdFx0XHR0aGlzLFxuXHRcdFx0a2V5LFxuXHRcdFx0ZGF0YSxcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRyZXNvbHZlLFxuXHRcdFx0cmVqZWN0XG5cdFx0KTtcblx0fS5iaW5kKCB0aGlzICkgKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc1Jlc3BvbnNlKCByZXNwb25zZSwgZnNtICkge1xuXHQvLyBkb24ndCBib3RoZXIgd2l0aCBhbGwgdGhpcyBpZiB0aGUgcmVzcG9uc2UgaXMgYW4gZW1wdHkgYm9keVxuXHRpZiAoIF8uaXNFbXB0eSggcmVzcG9uc2UgKSB8fCBfLmlzU3RyaW5nKCByZXNwb25zZSApICkge1xuXHRcdHJldHVybiByZXNwb25zZTtcblx0fVxuXHQvLyBkZXRlY3Qgd2hldGhlciBvciBub3QgYSB0b3AtbGV2ZWwgbGlzdCBvZiBjb2xsZWN0aW9ucyBoYXMgYmVlbiByZXR1cm5lZFxuXHRpZiAoICFyZXNwb25zZS5fbGlua3MgKSB7XG5cdFx0Y29uc3QgbGlzdEtleSA9IE9iamVjdC5rZXlzKCByZXNwb25zZSApXG5cdFx0XHQuZmlsdGVyKCBmdW5jdGlvbiggeCApIHtcblx0XHRcdFx0cmV0dXJuIHggIT09IFwiX29yaWdpblwiO1xuXHRcdFx0fSApWyAwIF07XG5cdFx0Y29uc3QgYmFzZSA9IHsgX29yaWdpbjogcmVzcG9uc2UuX29yaWdpbiB9O1xuXHRcdGJhc2VbIGxpc3RLZXkgXSA9IF8ubWFwKCByZXNwb25zZVsgbGlzdEtleSBdLCBmdW5jdGlvbiggaXRlbSApIHtcblx0XHRcdHJldHVybiBwcm9jZXNzRW1iZWRkZWQoIHByb2Nlc3NMaW5rcyggaXRlbSwgZnNtICkgKTtcblx0XHR9ICk7XG5cdFx0cmV0dXJuIGJhc2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHByb2Nlc3NFbWJlZGRlZCggcHJvY2Vzc0xpbmtzKCByZXNwb25zZSwgZnNtICkgKTtcblx0fVxufVxuXG5mdW5jdGlvbiBwcm9jZXNzRW1iZWRkZWQoIHJlc3BvbnNlICkge1xuXHRpZiAoIHJlc3BvbnNlLl9lbWJlZGRlZCApIHtcblx0XHRfLmVhY2goIHJlc3BvbnNlLl9lbWJlZGRlZCwgZnVuY3Rpb24oIHZhbHVlLCBrZXkgKSB7XG5cdFx0XHRwcm9jZXNzRW1iZWRkZWQoIHZhbHVlICk7XG5cdFx0XHRyZXNwb25zZVsga2V5IF0gPSB2YWx1ZTtcblx0XHR9ICk7XG5cdFx0ZGVsZXRlIHJlc3BvbnNlLl9lbWJlZGRlZDtcblx0fVxuXHRyZXR1cm4gcmVzcG9uc2U7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NMaW5rcyggb3B0aW9ucywgZnNtICkge1xuXHRjb25zdCBhY3Rpb25zID0gb3B0aW9ucztcblx0Xy5lYWNoKCBvcHRpb25zLl9saW5rcywgZnVuY3Rpb24oIGxpbmtEZWYsIHJlbEtleSApIHtcblx0XHRjb25zdCBzcGxpdEtleSA9IHJlbEtleS5zcGxpdCggXCI6XCIgKTtcblx0XHRsZXQgcmVsID0gcmVsS2V5O1xuXHRcdGxldCB0YXJnZXQgPSBhY3Rpb25zO1xuXHRcdGlmICggc3BsaXRLZXkubGVuZ3RoID09PSAyICkge1xuXHRcdFx0dGFyZ2V0ID0gYWN0aW9uc1sgc3BsaXRLZXlbIDAgXSBdID0gKCBhY3Rpb25zWyBzcGxpdEtleVsgMCBdIF0gfHwge30gKTtcblx0XHRcdHJlbCA9IHNwbGl0S2V5WyAxIF07XG5cdFx0fVxuXHRcdHRhcmdldFsgcmVsIF0gPSBpbnZva2VSZXNvdXJjZS5iaW5kKCBvcHRpb25zLCBmc20sIHJlbEtleSApO1xuXHR9ICk7XG5cdHJldHVybiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzS25vd25PcHRpb25zKCBrbm93bk9wdGlvbnMgKSB7XG5cdGNvbnN0IHggPSBfLnJlZHVjZSgga25vd25PcHRpb25zLCBmdW5jdGlvbiggbWVtbywgcmVscywgcmVzb3VyY2UgKSB7XG5cdFx0cmVscy5mb3JFYWNoKCBmdW5jdGlvbiggcmVsICkge1xuXHRcdFx0bWVtby5fbGlua3NbIHJlc291cmNlICsgXCI6XCIgKyByZWwgXSA9IHVuZGVmaW5lZDtcblx0XHR9ICk7XG5cdFx0cmV0dXJuIG1lbW87XG5cdH0sIHsgX2xpbmtzOiB7fSB9ICk7XG5cdHJldHVybiB4O1xufVxuXG52YXIgSGFsb25DbGllbnRGc20gPSBtYWNoaW5hLkZzbS5leHRlbmQoIHtcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHRfLmV4dGVuZCggdGhpcy5jbGllbnQsIHByb2Nlc3NMaW5rcyhcblx0XHRcdHByb2Nlc3NLbm93bk9wdGlvbnMoIG9wdGlvbnMua25vd25PcHRpb25zICksXG5cdFx0XHR0aGlzXG5cdFx0KSApO1xuXHR9LFxuXG5cdHN0YXRlczoge1xuXHRcdHVuaW5pdGlhbGl6ZWQ6IHtcblx0XHRcdGNvbm5lY3Q6IFwiaW5pdGlhbGl6aW5nXCIsXG5cdFx0XHRcImludm9rZS5yZXNvdXJjZVwiOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5kZWZlclVudGlsVHJhbnNpdGlvbiggXCJyZWFkeVwiICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpbml0aWFsaXppbmc6IHtcblx0XHRcdF9vbkVudGVyOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5hZGFwdGVyKCB7IGhyZWY6IHRoaXMucm9vdCwgbWV0aG9kOiBcIk9QVElPTlNcIiB9LCB7IGhlYWRlcnM6IHRoaXMuZ2V0SGVhZGVycygpLCBzZXJ2ZXI6IHRoaXMuc2VydmVyIH0gKVxuXHRcdFx0XHRcdC50aGVuKFxuXHRcdFx0XHRcdFx0dGhpcy5oYW5kbGUuYmluZCggdGhpcywgXCJyb290LmxvYWRlZFwiICksIGZ1bmN0aW9uKCBlcnIgKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybiggZXJyICk7XG5cdFx0XHRcdFx0XHRcdHRoaXMuY29ubmVjdGlvbkVycm9yID0gZXJyO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnRyYW5zaXRpb24oIFwiY29ubmVjdGlvbi5mYWlsZWRcIiApO1xuXHRcdFx0XHRcdFx0fS5iaW5kKCB0aGlzIClcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHRcInJvb3QubG9hZGVkXCI6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdFx0XHRfLm1lcmdlKCB0aGlzLmNsaWVudCwgcHJvY2Vzc0xpbmtzKCBvcHRpb25zLCB0aGlzICkgKTtcblx0XHRcdFx0dGhpcy50cmFuc2l0aW9uKCBcInJlYWR5XCIgKTtcblx0XHRcdH0sXG5cdFx0XHRcImludm9rZS5yZXNvdXJjZVwiOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5kZWZlclVudGlsVHJhbnNpdGlvbiggXCJyZWFkeVwiICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZWFkeToge1xuXHRcdFx0X29uRW50ZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAoIHRoaXMuY2xpZW50LmRlZmVycmVkICkge1xuXHRcdFx0XHRcdHRoaXMuY2xpZW50LmRlZmVycmVkLnJlc29sdmUoIHRoaXMuY2xpZW50ICk7XG5cdFx0XHRcdFx0dGhpcy5jbGllbnQuZGVmZXJyZWQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcImludm9rZS5yZXNvdXJjZVwiOiBmdW5jdGlvbiggcmVzb3VyY2UsIHJlbCwgZGF0YSwgaGVhZGVycywgc3VjY2VzcywgZXJyICkge1xuXHRcdFx0XHRsZXQgcmVzb3VyY2VEZWYgPSByZXNvdXJjZS5fbGlua3NbIHJlbCBdO1xuXHRcdFx0XHRpZiAoICFyZXNvdXJjZURlZiApIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiTm8gbGluayBkZWZpbml0aW9uIGZvciByZWwgJ1wiICsgcmVsICsgXCInXCIgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHJlc291cmNlRGVmLnRlbXBsYXRlZCB8fCByZXNvdXJjZURlZi5wYXJhbWV0ZXJzIHx8IGRhdGFbIFwiP1wiIF0gKSB7XG5cdFx0XHRcdFx0cmVzb3VyY2VEZWYgPSBfLmV4dGVuZCgge30sIHJlc291cmNlRGVmLCB7IGhyZWY6IGV4cGFuZExpbmsoIHJlc291cmNlRGVmLCBkYXRhICkgfSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggZGF0YS5ib2R5ICkge1xuXHRcdFx0XHRcdGRhdGEgPSBkYXRhLmJvZHk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5hZGFwdGVyKCByZXNvdXJjZURlZiwgeyBkYXRhOiBkYXRhLCBoZWFkZXJzOiB0aGlzLmdldEhlYWRlcnMoIGhlYWRlcnMgKSwgc2VydmVyOiB0aGlzLnNlcnZlciB9IClcblx0XHRcdFx0XHQudGhlbiggZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb2Nlc3NSZXNwb25zZSggcmVzcG9uc2UsIHRoaXMgKTtcblx0XHRcdFx0XHR9LmJpbmQoIHRoaXMgKSApXG5cdFx0XHRcdFx0LnRoZW4oIHN1Y2Nlc3MsIGVyciApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJjb25uZWN0aW9uLmZhaWxlZFwiOiB7XG5cdFx0XHRfb25FbnRlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggdGhpcy5jbGllbnQuZGVmZXJyZWQgKSB7XG5cdFx0XHRcdFx0dGhpcy5jbGllbnQuZGVmZXJyZWQucmVqZWN0KCB0aGlzLmNvbm5lY3Rpb25FcnJvciApO1xuXHRcdFx0XHRcdHRoaXMuY2xpZW50LmRlZmVycmVkID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Y29ubmVjdDogXCJpbml0aWFsaXppbmdcIixcblx0XHRcdFwiaW52b2tlLnJlc291cmNlXCI6IGZ1bmN0aW9uKCByZXNvdXJjZSwgcmVsLCBkYXRhLCBoZWFkZXJzLCBzdWNjZXNzLCBlcnIgKSB7XG5cdFx0XHRcdGVyciggdGhpcy5jb25uZWN0aW9uRXJyb3IgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Z2V0SGVhZGVyczogZnVuY3Rpb24oIGhkcnMgKSB7XG5cdFx0cmV0dXJuIF8uZXh0ZW5kKCB7fSwgdGhpcy5oZWFkZXJzLCAoIGhkcnMgfHwge30gKSwgeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vaGFsLnZcIiArIHRoaXMudmVyc2lvbiArIFwiK2pzb25cIiB9ICk7XG5cdH1cbn0gKTtcblxuY29uc3QgaGFsb25GYWN0b3J5ID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdGNvbnN0IGRlZmF1bHRzID0ge1xuXHRcdHZlcnNpb246IDEsXG5cdFx0a25vd25PcHRpb25zOiB7fSxcblx0XHRhZGFwdGVyOiBfZGVmYXVsdEFkYXB0ZXIsXG5cdFx0aGVhZGVyczoge31cblx0fTtcblxuXHRjb25zdCBjbGllbnQgPSBmdW5jdGlvbiBoYWxvbkluc3RhbmNlKCkge1xuXHRcdGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAwICk7XG5cdFx0cmV0dXJuIHdoZW4uYWxsKCBhcmdzICk7XG5cdH07XG5cdG9wdGlvbnMgPSBfLmRlZmF1bHRzKCBvcHRpb25zLCBkZWZhdWx0cyApO1xuXHRjb25zdCBzZXJ2ZXIgPSAvaHR0cChzKT9bOl1bXFwvXXsyfVteXFwvXSovLmV4ZWMoIG9wdGlvbnMucm9vdCApO1xuXHRvcHRpb25zLnNlcnZlciA9IHNlcnZlciA/IHNlcnZlclsgMCBdIDogdW5kZWZpbmVkO1xuXHRvcHRpb25zLmNsaWVudCA9IGNsaWVudDtcblxuXHRjb25zdCBmc20gPSBjbGllbnQuZnNtID0gbmV3IEhhbG9uQ2xpZW50RnNtKCBvcHRpb25zICk7XG5cdGZ1bmN0aW9uIGxpc3RlbkZvciggc3RhdGUsIGNiLCBwZXJzaXN0ICkge1xuXHRcdGlmICggZnNtLnN0YXRlID09PSBzdGF0ZSApIHtcblx0XHRcdGNiKCBjbGllbnQgKTtcblx0XHR9XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdGxpc3RlbmVyID0gZnNtLm9uKCBcInRyYW5zaXRpb25cIiwgZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0XHQvLyB0aGlzIGlzIG5lY2Vzc2FyeSB0byBlbnN1cmUgdGhhdCB0aGUgcHJvbWlzZSByZXNvbHZlc1xuXHRcdFx0Ly8gYmVmb3JlIGludm9raW5nIHRoZSBldmVudCBsaXN0ZW5lciBjYWxsYmFjayFcblx0XHRcdHByb2Nlc3MubmV4dFRpY2soIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAoIGRhdGEudG9TdGF0ZSA9PT0gc3RhdGUgKSB7XG5cdFx0XHRcdFx0aWYgKCAhcGVyc2lzdCApIHtcblx0XHRcdFx0XHRcdGxpc3RlbmVyLm9mZigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYiggY2xpZW50LCBmc20uY29ubmVjdGlvbkVycm9yLCBsaXN0ZW5lciApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXHR9O1xuXG5cdGNsaWVudC5vbiA9IGZ1bmN0aW9uKCBldmVudE5hbWUsIGNiLCBwZXJzaXN0ICkge1xuXHRcdGlmICggZXZlbnROYW1lID09PSBcInJlYWR5XCIgKSB7XG5cdFx0XHRsaXN0ZW5Gb3IoIFwicmVhZHlcIiwgY2IsIHBlcnNpc3QgKTtcblx0XHR9IGVsc2UgaWYgKCBldmVudE5hbWUgPT09IFwicmVqZWN0ZWRcIiApIHtcblx0XHRcdGxpc3RlbkZvciggXCJjb25uZWN0aW9uLmZhaWxlZFwiLCBjYiwgcGVyc2lzdCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiT25seSAncmVhZHknIGFuZCAncmVqZWN0ZWQnIGV2ZW50cyBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgZW1pdHRlci5cIiApO1xuXHRcdH1cblx0XHRyZXR1cm4gY2xpZW50O1xuXHR9O1xuXG5cdGNsaWVudC5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgcGVuZGluZyA9IHRoaXMuZGVmZXJyZWQgJiYgdGhpcy5kZWZlcnJlZC5wcm9taXNlLmluc3BlY3QoKS5zdGF0ZSAhPT0gXCJmdWxmaWxsZWRcIjtcblx0XHRpZiAoICFwZW5kaW5nICkge1xuXHRcdFx0dGhpcy5kZWZlcnJlZCA9IHdoZW4uZGVmZXIoKTtcblx0XHRcdGZzbS5oYW5kbGUoIFwiY29ubmVjdFwiICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmRlZmVycmVkLnByb21pc2U7XG5cdH07XG5cblx0aWYgKCBvcHRpb25zLnN0YXJ0ICkge1xuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0Y2xpZW50LmNvbm5lY3QoKS5jYXRjaCggZnVuY3Rpb24oKSB7fSApO1xuXHRcdH0sIDAgKTtcblx0fVxuXG5cdHJldHVybiBjbGllbnQ7XG59O1xuXG5oYWxvbkZhY3RvcnkuZGVmYXVsdEFkYXB0ZXIgPSBmdW5jdGlvbiggYWRhcHRlciApIHtcblx0X2RlZmF1bHRBZGFwdGVyID0gYWRhcHRlcjtcblx0cmV0dXJuIGhhbG9uRmFjdG9yeTtcbn07XG5cbmhhbG9uRmFjdG9yeS5qUXVlcnlBZGFwdGVyID0gZnVuY3Rpb24oICQgKSB7XG5cdGNvbnN0IGF1dG9TdHJpbmdpZnkgPSBbIFwiUEFUQ0hcIiwgXCJQT1NUXCIsIFwiUFVUXCIgXTtcblx0cmV0dXJuIGZ1bmN0aW9uKCBsaW5rLCBvcHRpb25zICkge1xuXHRcdGNvbnN0IGFqYXhEZWYgPSB7XG5cdFx0XHR1cmw6IGxpbmsuaHJlZixcblx0XHRcdHR5cGU6IGxpbmsubWV0aG9kLFxuXHRcdFx0aGVhZGVyczogb3B0aW9ucy5oZWFkZXJzLFxuXHRcdFx0ZGF0YVR5cGU6IFwianNvblwiLFxuXHRcdFx0ZGF0YTogb3B0aW9ucy5kYXRhXG5cdFx0fTtcblxuXHRcdGlmICggb3B0aW9ucy5kYXRhICYmIF8uY29udGFpbnMoIGF1dG9TdHJpbmdpZnksIGxpbmsubWV0aG9kLnRvVXBwZXJDYXNlKCkgKSApIHtcblx0XHRcdGFqYXhEZWYuZGF0YSA9IHR5cGVvZiBvcHRpb25zLmRhdGEgPT09IFwic3RyaW5nXCIgPyBvcHRpb25zLmRhdGEgOiBKU09OLnN0cmluZ2lmeSggb3B0aW9ucy5kYXRhICk7XG5cdFx0XHRhamF4RGVmLmNvbnRlbnRUeXBlID0gXCJhcHBsaWNhdGlvbi9qc29uXCI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdoZW4ucHJvbWlzZSggZnVuY3Rpb24oIHJlc29sdmUsIHJlamVjdCApIHtcblx0XHRcdCQuYWpheCggYWpheERlZiApXG5cdFx0XHRcdC50aGVuKCByZXNvbHZlLCBmdW5jdGlvbigganFYaHIsIHJlc3BUZXh0LCBlICkge1xuXHRcdFx0XHRcdHZhciBlcnIgPSBuZXcgRXJyb3IoIGUgKTtcblx0XHRcdFx0XHRlcnIuc3RhdHVzID0ganFYaHIuc3RhdHVzO1xuXHRcdFx0XHRcdHJlamVjdCggZXJyICk7XG5cdFx0XHRcdH0gKTtcblx0XHR9ICk7XG5cdH07XG59O1xuXG5oYWxvbkZhY3RvcnkucmVxdWVzdEFkYXB0ZXIgPSBmdW5jdGlvbiggcmVxdWVzdCApIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCBsaW5rLCBvcHRpb25zICkge1xuXHRcdGxldCBmb3JtRGF0YTtcblx0XHRpZiAoIG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEuZm9ybURhdGEgKSB7XG5cdFx0XHRmb3JtRGF0YSA9IG9wdGlvbnMuZGF0YS5mb3JtRGF0YTtcblx0XHRcdGRlbGV0ZSBvcHRpb25zLmRhdGEuZm9ybURhdGE7XG5cdFx0fVxuXHRcdGNvbnN0IGpzb24gPSBfLmlzU3RyaW5nKCBvcHRpb25zLmRhdGEgKSA/XG5cdFx0XHRKU09OLnBhcnNlKCBvcHRpb25zLmRhdGEgKSA6XG5cdFx0XHRvcHRpb25zLmRhdGE7XG5cdFx0Y29uc3QgdXJsID0gbGluay5ocmVmLmluZGV4T2YoIG9wdGlvbnMuc2VydmVyICkgPCAwID9cblx0XHRcdG9wdGlvbnMuc2VydmVyICsgbGluay5ocmVmIDpcblx0XHRcdGxpbmsuaHJlZjtcblx0XHRjb25zdCByZXF1ZXN0T3B0aW9ucyA9IHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0bWV0aG9kOiBsaW5rLm1ldGhvZCxcblx0XHRcdGhlYWRlcnM6IG9wdGlvbnMuaGVhZGVyc1xuXHRcdH07XG5cdFx0aWYgKCBmb3JtRGF0YSApIHtcblx0XHRcdHJlcXVlc3RPcHRpb25zLmZvcm1EYXRhID0gZm9ybURhdGE7XG5cdFx0fSBlbHNlIGlmICgganNvbiAmJiAhXy5pc0VtcHR5KCBqc29uICkgKSB7XG5cdFx0XHRyZXF1ZXN0T3B0aW9ucy5qc29uID0ganNvbjtcblx0XHRcdHJlcXVlc3RPcHRpb25zLmhlYWRlcnNbIFwiQ29udGVudC1UeXBlXCIgXSA9IFwiYXBwbGljYXRpb24vanNvblwiO1xuXHRcdH1cblx0XHRyZXR1cm4gd2hlbi5wcm9taXNlKCBmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICkge1xuXHRcdFx0cmVxdWVzdCggcmVxdWVzdE9wdGlvbnMsIGZ1bmN0aW9uKCBlcnIsIHJlc3AsIGJvZHkgKSB7XG5cdFx0XHRcdGxldCBqc29uO1xuXHRcdFx0XHRpZiAoIGJvZHkgJiYgYm9keVsgMCBdID09PSBcIntcIiApIHtcblx0XHRcdFx0XHRjb25zdCBpc0pzb24gPSBib2R5ICYmIGJvZHkgIT09IFwiXCIgJiYgYm9keSAhPT0gXCJ7fVwiO1xuXHRcdFx0XHRcdGpzb24gPSBpc0pzb24gPyBKU09OLnBhcnNlKCBib2R5ICkgOiB7fTtcblx0XHRcdFx0XHRqc29uLnN0YXR1cyA9IHJlc3Auc3RhdHVzQ29kZTtcblx0XHRcdFx0fSBlbHNlIGlmICggYm9keSApIHtcblx0XHRcdFx0XHRib2R5LnN0YXR1cyA9IHJlc3Auc3RhdHVzQ29kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGVyciApIHtcblx0XHRcdFx0XHRyZWplY3QoIGVyciApO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCByZXNwLnN0YXR1c0NvZGUgPj0gNDAwICkge1xuXHRcdFx0XHRcdHJlamVjdCgganNvbiB8fCBib2R5ICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZSgganNvbiB8fCBib2R5ICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cdH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCBoYWxvbkZhY3Rvcnk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9oYWxvbi5qc1xuICoqLyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAod2VicGFjaykvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3Byb2Nlc3MvYnJvd3Nlci5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8yX187XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiBleHRlcm5hbCB7XCJyb290XCI6XCJfXCIsXCJjb21tb25qc1wiOlwibG9kYXNoXCIsXCJjb21tb25qczJcIjpcImxvZGFzaFwiLFwiYW1kXCI6XCJsb2Rhc2hcIn1cbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfM19fO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogZXh0ZXJuYWwgXCJtYWNoaW5hXCJcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTQgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cblxuLyoqXG4gKiBQcm9taXNlcy9BKyBhbmQgd2hlbigpIGltcGxlbWVudGF0aW9uXG4gKiB3aGVuIGlzIHBhcnQgb2YgdGhlIGN1am9KUyBmYW1pbHkgb2YgbGlicmFyaWVzIChodHRwOi8vY3Vqb2pzLmNvbS8pXG4gKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyXG4gKiBAYXV0aG9yIEpvaG4gSGFublxuICovXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSkge1xuXG5cdHZhciB0aW1lZCA9IHJlcXVpcmUoJy4vbGliL2RlY29yYXRvcnMvdGltZWQnKTtcblx0dmFyIGFycmF5ID0gcmVxdWlyZSgnLi9saWIvZGVjb3JhdG9ycy9hcnJheScpO1xuXHR2YXIgZmxvdyA9IHJlcXVpcmUoJy4vbGliL2RlY29yYXRvcnMvZmxvdycpO1xuXHR2YXIgZm9sZCA9IHJlcXVpcmUoJy4vbGliL2RlY29yYXRvcnMvZm9sZCcpO1xuXHR2YXIgaW5zcGVjdCA9IHJlcXVpcmUoJy4vbGliL2RlY29yYXRvcnMvaW5zcGVjdCcpO1xuXHR2YXIgZ2VuZXJhdGUgPSByZXF1aXJlKCcuL2xpYi9kZWNvcmF0b3JzL2l0ZXJhdGUnKTtcblx0dmFyIHByb2dyZXNzID0gcmVxdWlyZSgnLi9saWIvZGVjb3JhdG9ycy9wcm9ncmVzcycpO1xuXHR2YXIgd2l0aFRoaXMgPSByZXF1aXJlKCcuL2xpYi9kZWNvcmF0b3JzL3dpdGgnKTtcblx0dmFyIHVuaGFuZGxlZFJlamVjdGlvbiA9IHJlcXVpcmUoJy4vbGliL2RlY29yYXRvcnMvdW5oYW5kbGVkUmVqZWN0aW9uJyk7XG5cdHZhciBUaW1lb3V0RXJyb3IgPSByZXF1aXJlKCcuL2xpYi9UaW1lb3V0RXJyb3InKTtcblxuXHR2YXIgUHJvbWlzZSA9IFthcnJheSwgZmxvdywgZm9sZCwgZ2VuZXJhdGUsIHByb2dyZXNzLFxuXHRcdGluc3BlY3QsIHdpdGhUaGlzLCB0aW1lZCwgdW5oYW5kbGVkUmVqZWN0aW9uXVxuXHRcdC5yZWR1Y2UoZnVuY3Rpb24oUHJvbWlzZSwgZmVhdHVyZSkge1xuXHRcdFx0cmV0dXJuIGZlYXR1cmUoUHJvbWlzZSk7XG5cdFx0fSwgcmVxdWlyZSgnLi9saWIvUHJvbWlzZScpKTtcblxuXHR2YXIgYXBwbHkgPSByZXF1aXJlKCcuL2xpYi9hcHBseScpKFByb21pc2UpO1xuXG5cdC8vIFB1YmxpYyBBUElcblxuXHR3aGVuLnByb21pc2UgICAgID0gcHJvbWlzZTsgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHBlbmRpbmcgcHJvbWlzZVxuXHR3aGVuLnJlc29sdmUgICAgID0gUHJvbWlzZS5yZXNvbHZlOyAgICAgIC8vIENyZWF0ZSBhIHJlc29sdmVkIHByb21pc2Vcblx0d2hlbi5yZWplY3QgICAgICA9IFByb21pc2UucmVqZWN0OyAgICAgICAvLyBDcmVhdGUgYSByZWplY3RlZCBwcm9taXNlXG5cblx0d2hlbi5saWZ0ICAgICAgICA9IGxpZnQ7ICAgICAgICAgICAgICAgICAvLyBsaWZ0IGEgZnVuY3Rpb24gdG8gcmV0dXJuIHByb21pc2VzXG5cdHdoZW5bJ3RyeSddICAgICAgPSBhdHRlbXB0OyAgICAgICAgICAgICAgLy8gY2FsbCBhIGZ1bmN0aW9uIGFuZCByZXR1cm4gYSBwcm9taXNlXG5cdHdoZW4uYXR0ZW1wdCAgICAgPSBhdHRlbXB0OyAgICAgICAgICAgICAgLy8gYWxpYXMgZm9yIHdoZW4udHJ5XG5cblx0d2hlbi5pdGVyYXRlICAgICA9IFByb21pc2UuaXRlcmF0ZTsgICAgICAvLyBERVBSRUNBVEVEICh1c2UgY3Vqb2pzL21vc3Qgc3RyZWFtcykgR2VuZXJhdGUgYSBzdHJlYW0gb2YgcHJvbWlzZXNcblx0d2hlbi51bmZvbGQgICAgICA9IFByb21pc2UudW5mb2xkOyAgICAgICAvLyBERVBSRUNBVEVEICh1c2UgY3Vqb2pzL21vc3Qgc3RyZWFtcykgR2VuZXJhdGUgYSBzdHJlYW0gb2YgcHJvbWlzZXNcblxuXHR3aGVuLmpvaW4gICAgICAgID0gam9pbjsgICAgICAgICAgICAgICAgIC8vIEpvaW4gMiBvciBtb3JlIHByb21pc2VzXG5cblx0d2hlbi5hbGwgICAgICAgICA9IGFsbDsgICAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIGEgbGlzdCBvZiBwcm9taXNlc1xuXHR3aGVuLnNldHRsZSAgICAgID0gc2V0dGxlOyAgICAgICAgICAgICAgIC8vIFNldHRsZSBhIGxpc3Qgb2YgcHJvbWlzZXNcblxuXHR3aGVuLmFueSAgICAgICAgID0gbGlmdChQcm9taXNlLmFueSk7ICAgIC8vIE9uZS13aW5uZXIgcmFjZVxuXHR3aGVuLnNvbWUgICAgICAgID0gbGlmdChQcm9taXNlLnNvbWUpOyAgIC8vIE11bHRpLXdpbm5lciByYWNlXG5cdHdoZW4ucmFjZSAgICAgICAgPSBsaWZ0KFByb21pc2UucmFjZSk7ICAgLy8gRmlyc3QtdG8tc2V0dGxlIHJhY2VcblxuXHR3aGVuLm1hcCAgICAgICAgID0gbWFwOyAgICAgICAgICAgICAgICAgIC8vIEFycmF5Lm1hcCgpIGZvciBwcm9taXNlc1xuXHR3aGVuLmZpbHRlciAgICAgID0gZmlsdGVyOyAgICAgICAgICAgICAgIC8vIEFycmF5LmZpbHRlcigpIGZvciBwcm9taXNlc1xuXHR3aGVuLnJlZHVjZSAgICAgID0gbGlmdChQcm9taXNlLnJlZHVjZSk7ICAgICAgIC8vIEFycmF5LnJlZHVjZSgpIGZvciBwcm9taXNlc1xuXHR3aGVuLnJlZHVjZVJpZ2h0ID0gbGlmdChQcm9taXNlLnJlZHVjZVJpZ2h0KTsgIC8vIEFycmF5LnJlZHVjZVJpZ2h0KCkgZm9yIHByb21pc2VzXG5cblx0d2hlbi5pc1Byb21pc2VMaWtlID0gaXNQcm9taXNlTGlrZTsgICAgICAvLyBJcyBzb21ldGhpbmcgcHJvbWlzZS1saWtlLCBha2EgdGhlbmFibGVcblxuXHR3aGVuLlByb21pc2UgICAgID0gUHJvbWlzZTsgICAgICAgICAgICAgIC8vIFByb21pc2UgY29uc3RydWN0b3Jcblx0d2hlbi5kZWZlciAgICAgICA9IGRlZmVyOyAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fSB0dXBsZVxuXG5cdC8vIEVycm9yIHR5cGVzXG5cblx0d2hlbi5UaW1lb3V0RXJyb3IgPSBUaW1lb3V0RXJyb3I7XG5cblx0LyoqXG5cdCAqIEdldCBhIHRydXN0ZWQgcHJvbWlzZSBmb3IgeCwgb3IgYnkgdHJhbnNmb3JtaW5nIHggd2l0aCBvbkZ1bGZpbGxlZFxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IHhcblx0ICogQHBhcmFtIHtmdW5jdGlvbj99IG9uRnVsZmlsbGVkIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHggaXNcblx0ICogICBzdWNjZXNzZnVsbHkgZnVsZmlsbGVkLiAgSWYgcHJvbWlzZU9yVmFsdWUgaXMgYW4gaW1tZWRpYXRlIHZhbHVlLCBjYWxsYmFja1xuXHQgKiAgIHdpbGwgYmUgaW52b2tlZCBpbW1lZGlhdGVseS5cblx0ICogQHBhcmFtIHtmdW5jdGlvbj99IG9uUmVqZWN0ZWQgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4geCBpc1xuXHQgKiAgIHJlamVjdGVkLlxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9uP30gb25Qcm9ncmVzcyBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBwcm9ncmVzcyB1cGRhdGVzXG5cdCAqICAgYXJlIGlzc3VlZCBmb3IgeC4gQGRlcHJlY2F0ZWRcblx0ICogQHJldHVybnMge1Byb21pc2V9IGEgbmV3IHByb21pc2UgdGhhdCB3aWxsIGZ1bGZpbGwgd2l0aCB0aGUgcmV0dXJuXG5cdCAqICAgdmFsdWUgb2YgY2FsbGJhY2sgb3IgZXJyYmFjayBvciB0aGUgY29tcGxldGlvbiB2YWx1ZSBvZiBwcm9taXNlT3JWYWx1ZSBpZlxuXHQgKiAgIGNhbGxiYWNrIGFuZC9vciBlcnJiYWNrIGlzIG5vdCBzdXBwbGllZC5cblx0ICovXG5cdGZ1bmN0aW9uIHdoZW4oeCwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpIHtcblx0XHR2YXIgcCA9IFByb21pc2UucmVzb2x2ZSh4KTtcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcblx0XHRcdHJldHVybiBwO1xuXHRcdH1cblxuXHRcdHJldHVybiBwLnRoZW4ob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBuZXcgcHJvbWlzZSB3aG9zZSBmYXRlIGlzIGRldGVybWluZWQgYnkgcmVzb2x2ZXIuXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlc29sdmVyIGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCwgbm90aWZ5KVxuXHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSB3aG9zZSBmYXRlIGlzIGRldGVybWluZSBieSByZXNvbHZlclxuXHQgKi9cblx0ZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlcik7XG5cdH1cblxuXHQvKipcblx0ICogTGlmdCB0aGUgc3VwcGxpZWQgZnVuY3Rpb24sIGNyZWF0aW5nIGEgdmVyc2lvbiBvZiBmIHRoYXQgcmV0dXJuc1xuXHQgKiBwcm9taXNlcywgYW5kIGFjY2VwdHMgcHJvbWlzZXMgYXMgYXJndW1lbnRzLlxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gdmVyc2lvbiBvZiBmIHRoYXQgcmV0dXJucyBwcm9taXNlc1xuXHQgKi9cblx0ZnVuY3Rpb24gbGlmdChmKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0Zm9yKHZhciBpPTAsIGw9YXJndW1lbnRzLmxlbmd0aCwgYT1uZXcgQXJyYXkobCk7IGk8bDsgKytpKSB7XG5cdFx0XHRcdGFbaV0gPSBhcmd1bWVudHNbaV07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYXBwbHkoZiwgdGhpcywgYSk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsIGYgaW4gYSBmdXR1cmUgdHVybiwgd2l0aCB0aGUgc3VwcGxpZWQgYXJncywgYW5kIHJldHVybiBhIHByb21pc2Vcblx0ICogZm9yIHRoZSByZXN1bHQuXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGZcblx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdCAqL1xuXHRmdW5jdGlvbiBhdHRlbXB0KGYgLyosIGFyZ3MuLi4gKi8pIHtcblx0XHQvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuXHRcdGZvcih2YXIgaT0wLCBsPWFyZ3VtZW50cy5sZW5ndGgtMSwgYT1uZXcgQXJyYXkobCk7IGk8bDsgKytpKSB7XG5cdFx0XHRhW2ldID0gYXJndW1lbnRzW2krMV07XG5cdFx0fVxuXHRcdHJldHVybiBhcHBseShmLCB0aGlzLCBhKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEge3Byb21pc2UsIHJlc29sdmVyfSBwYWlyLCBlaXRoZXIgb3IgYm90aCBvZiB3aGljaFxuXHQgKiBtYXkgYmUgZ2l2ZW4gb3V0IHNhZmVseSB0byBjb25zdW1lcnMuXG5cdCAqIEByZXR1cm4ge3twcm9taXNlOiBQcm9taXNlLCByZXNvbHZlOiBmdW5jdGlvbiwgcmVqZWN0OiBmdW5jdGlvbiwgbm90aWZ5OiBmdW5jdGlvbn19XG5cdCAqL1xuXHRmdW5jdGlvbiBkZWZlcigpIHtcblx0XHRyZXR1cm4gbmV3IERlZmVycmVkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBEZWZlcnJlZCgpIHtcblx0XHR2YXIgcCA9IFByb21pc2UuX2RlZmVyKCk7XG5cblx0XHRmdW5jdGlvbiByZXNvbHZlKHgpIHsgcC5faGFuZGxlci5yZXNvbHZlKHgpOyB9XG5cdFx0ZnVuY3Rpb24gcmVqZWN0KHgpIHsgcC5faGFuZGxlci5yZWplY3QoeCk7IH1cblx0XHRmdW5jdGlvbiBub3RpZnkoeCkgeyBwLl9oYW5kbGVyLm5vdGlmeSh4KTsgfVxuXG5cdFx0dGhpcy5wcm9taXNlID0gcDtcblx0XHR0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuXHRcdHRoaXMucmVqZWN0ID0gcmVqZWN0O1xuXHRcdHRoaXMubm90aWZ5ID0gbm90aWZ5O1xuXHRcdHRoaXMucmVzb2x2ZXIgPSB7IHJlc29sdmU6IHJlc29sdmUsIHJlamVjdDogcmVqZWN0LCBub3RpZnk6IG5vdGlmeSB9O1xuXHR9XG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgeCBpcyBwcm9taXNlLWxpa2UsIGkuZS4gYSB0aGVuYWJsZSBvYmplY3Rcblx0ICogTk9URTogV2lsbCByZXR1cm4gdHJ1ZSBmb3IgKmFueSB0aGVuYWJsZSBvYmplY3QqLCBhbmQgaXNuJ3QgdHJ1bHlcblx0ICogc2FmZSwgc2luY2UgaXQgbWF5IGF0dGVtcHQgdG8gYWNjZXNzIHRoZSBgdGhlbmAgcHJvcGVydHkgb2YgeCAoaS5lLlxuXHQgKiAgY2xldmVyL21hbGljaW91cyBnZXR0ZXJzIG1heSBkbyB3ZWlyZCB0aGluZ3MpXG5cdCAqIEBwYXJhbSB7Kn0geCBhbnl0aGluZ1xuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB4IGlzIHByb21pc2UtbGlrZVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNQcm9taXNlTGlrZSh4KSB7XG5cdFx0cmV0dXJuIHggJiYgdHlwZW9mIHgudGhlbiA9PT0gJ2Z1bmN0aW9uJztcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCByZXNvbHZlIG9ubHkgb25jZSBhbGwgdGhlIHN1cHBsaWVkIGFyZ3VtZW50c1xuXHQgKiBoYXZlIHJlc29sdmVkLiBUaGUgcmVzb2x1dGlvbiB2YWx1ZSBvZiB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIGFuIGFycmF5XG5cdCAqIGNvbnRhaW5pbmcgdGhlIHJlc29sdXRpb24gdmFsdWVzIG9mIGVhY2ggb2YgdGhlIGFyZ3VtZW50cy5cblx0ICogQHBhcmFtIHsuLi4qfSBhcmd1bWVudHMgbWF5IGJlIGEgbWl4IG9mIHByb21pc2VzIGFuZCB2YWx1ZXNcblx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdCAqL1xuXHRmdW5jdGlvbiBqb2luKC8qIC4uLnByb21pc2VzICovKSB7XG5cdFx0cmV0dXJuIFByb21pc2UuYWxsKGFyZ3VtZW50cyk7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgZnVsZmlsbCBvbmNlIGFsbCBpbnB1dCBwcm9taXNlcyBoYXZlXG5cdCAqIGZ1bGZpbGxlZCwgb3IgcmVqZWN0IHdoZW4gYW55IG9uZSBpbnB1dCBwcm9taXNlIHJlamVjdHMuXG5cdCAqIEBwYXJhbSB7YXJyYXl8UHJvbWlzZX0gcHJvbWlzZXMgYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiBwcm9taXNlc1xuXHQgKiBAcmV0dXJucyB7UHJvbWlzZX1cblx0ICovXG5cdGZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuXHRcdHJldHVybiB3aGVuKHByb21pc2VzLCBQcm9taXNlLmFsbCk7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYWx3YXlzIGZ1bGZpbGwgd2l0aCBhbiBhcnJheSBjb250YWluaW5nXG5cdCAqIHRoZSBvdXRjb21lIHN0YXRlcyBvZiBhbGwgaW5wdXQgcHJvbWlzZXMuICBUaGUgcmV0dXJuZWQgcHJvbWlzZVxuXHQgKiB3aWxsIG9ubHkgcmVqZWN0IGlmIGBwcm9taXNlc2AgaXRzZWxmIGlzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cblx0ICogQHBhcmFtIHthcnJheXxQcm9taXNlfSBwcm9taXNlcyBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIGZvciBhcnJheSBvZiBzZXR0bGVkIHN0YXRlIGRlc2NyaXB0b3JzXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXR0bGUocHJvbWlzZXMpIHtcblx0XHRyZXR1cm4gd2hlbihwcm9taXNlcywgUHJvbWlzZS5zZXR0bGUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFByb21pc2UtYXdhcmUgYXJyYXkgbWFwIGZ1bmN0aW9uLCBzaW1pbGFyIHRvIGBBcnJheS5wcm90b3R5cGUubWFwKClgLFxuXHQgKiBidXQgaW5wdXQgYXJyYXkgbWF5IGNvbnRhaW4gcHJvbWlzZXMgb3IgdmFsdWVzLlxuXHQgKiBAcGFyYW0ge0FycmF5fFByb21pc2V9IHByb21pc2VzIGFycmF5IG9mIGFueXRoaW5nLCBtYXkgY29udGFpbiBwcm9taXNlcyBhbmQgdmFsdWVzXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqLCBpbmRleDpOdW1iZXIpOip9IG1hcEZ1bmMgbWFwIGZ1bmN0aW9uIHdoaWNoIG1heVxuXHQgKiAgcmV0dXJuIGEgcHJvbWlzZSBvciB2YWx1ZVxuXHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IHdpbGwgZnVsZmlsbCB3aXRoIGFuIGFycmF5IG9mIG1hcHBlZCB2YWx1ZXNcblx0ICogIG9yIHJlamVjdCBpZiBhbnkgaW5wdXQgcHJvbWlzZSByZWplY3RzLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwKHByb21pc2VzLCBtYXBGdW5jKSB7XG5cdFx0cmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uKHByb21pc2VzKSB7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5tYXAocHJvbWlzZXMsIG1hcEZ1bmMpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEZpbHRlciB0aGUgcHJvdmlkZWQgYXJyYXkgb2YgcHJvbWlzZXMgdXNpbmcgdGhlIHByb3ZpZGVkIHByZWRpY2F0ZS4gIElucHV0IG1heVxuXHQgKiBjb250YWluIHByb21pc2VzIGFuZCB2YWx1ZXNcblx0ICogQHBhcmFtIHtBcnJheXxQcm9taXNlfSBwcm9taXNlcyBhcnJheSBvZiBwcm9taXNlcyBhbmQgdmFsdWVzXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqLCBpbmRleDpOdW1iZXIpOmJvb2xlYW59IHByZWRpY2F0ZSBmaWx0ZXJpbmcgcHJlZGljYXRlLlxuXHQgKiAgTXVzdCByZXR1cm4gdHJ1dGh5IChvciBwcm9taXNlIGZvciB0cnV0aHkpIGZvciBpdGVtcyB0byByZXRhaW4uXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgd2lsbCBmdWxmaWxsIHdpdGggYW4gYXJyYXkgY29udGFpbmluZyBhbGwgaXRlbXNcblx0ICogIGZvciB3aGljaCBwcmVkaWNhdGUgcmV0dXJuZWQgdHJ1dGh5LlxuXHQgKi9cblx0ZnVuY3Rpb24gZmlsdGVyKHByb21pc2VzLCBwcmVkaWNhdGUpIHtcblx0XHRyZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24ocHJvbWlzZXMpIHtcblx0XHRcdHJldHVybiBQcm9taXNlLmZpbHRlcihwcm9taXNlcywgcHJlZGljYXRlKTtcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiB3aGVuO1xufSk7XG59KSh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUgOiBmdW5jdGlvbiAoZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSk7IH0pO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vd2hlbi93aGVuLmpzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE0IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbihmdW5jdGlvbihkZWZpbmUpIHsgJ3VzZSBzdHJpY3QnO1xuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUpIHtcblxuXHR2YXIgZW52ID0gcmVxdWlyZSgnLi4vZW52Jyk7XG5cdHZhciBUaW1lb3V0RXJyb3IgPSByZXF1aXJlKCcuLi9UaW1lb3V0RXJyb3InKTtcblxuXHRmdW5jdGlvbiBzZXRUaW1lb3V0KGYsIG1zLCB4LCB5KSB7XG5cdFx0cmV0dXJuIGVudi5zZXRUaW1lcihmdW5jdGlvbigpIHtcblx0XHRcdGYoeCwgeSwgbXMpO1xuXHRcdH0sIG1zKTtcblx0fVxuXG5cdHJldHVybiBmdW5jdGlvbiB0aW1lZChQcm9taXNlKSB7XG5cdFx0LyoqXG5cdFx0ICogUmV0dXJuIGEgbmV3IHByb21pc2Ugd2hvc2UgZnVsZmlsbG1lbnQgdmFsdWUgaXMgcmV2ZWFsZWQgb25seVxuXHRcdCAqIGFmdGVyIG1zIG1pbGxpc2Vjb25kc1xuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBtcyBtaWxsaXNlY29uZHNcblx0XHQgKiBAcmV0dXJucyB7UHJvbWlzZX1cblx0XHQgKi9cblx0XHRQcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uKG1zKSB7XG5cdFx0XHR2YXIgcCA9IHRoaXMuX2JlZ2V0KCk7XG5cdFx0XHR0aGlzLl9oYW5kbGVyLmZvbGQoaGFuZGxlRGVsYXksIG1zLCB2b2lkIDAsIHAuX2hhbmRsZXIpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIGhhbmRsZURlbGF5KG1zLCB4LCBoKSB7XG5cdFx0XHRzZXRUaW1lb3V0KHJlc29sdmVEZWxheSwgbXMsIHgsIGgpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHJlc29sdmVEZWxheSh4LCBoKSB7XG5cdFx0XHRoLnJlc29sdmUoeCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJuIGEgbmV3IHByb21pc2UgdGhhdCByZWplY3RzIGFmdGVyIG1zIG1pbGxpc2Vjb25kcyB1bmxlc3Ncblx0XHQgKiB0aGlzIHByb21pc2UgZnVsZmlsbHMgZWFybGllciwgaW4gd2hpY2ggY2FzZSB0aGUgcmV0dXJuZWQgcHJvbWlzZVxuXHRcdCAqIGZ1bGZpbGxzIHdpdGggdGhlIHNhbWUgdmFsdWUuXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IG1zIG1pbGxpc2Vjb25kc1xuXHRcdCAqIEBwYXJhbSB7RXJyb3J8Kj19IHJlYXNvbiBvcHRpb25hbCByZWplY3Rpb24gcmVhc29uIHRvIHVzZSwgZGVmYXVsdHNcblx0XHQgKiAgIHRvIGEgVGltZW91dEVycm9yIGlmIG5vdCBwcm92aWRlZFxuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfVxuXHRcdCAqL1xuXHRcdFByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbihtcywgcmVhc29uKSB7XG5cdFx0XHR2YXIgcCA9IHRoaXMuX2JlZ2V0KCk7XG5cdFx0XHR2YXIgaCA9IHAuX2hhbmRsZXI7XG5cblx0XHRcdHZhciB0ID0gc2V0VGltZW91dChvblRpbWVvdXQsIG1zLCByZWFzb24sIHAuX2hhbmRsZXIpO1xuXG5cdFx0XHR0aGlzLl9oYW5kbGVyLnZpc2l0KGgsXG5cdFx0XHRcdGZ1bmN0aW9uIG9uRnVsZmlsbCh4KSB7XG5cdFx0XHRcdFx0ZW52LmNsZWFyVGltZXIodCk7XG5cdFx0XHRcdFx0dGhpcy5yZXNvbHZlKHgpOyAvLyB0aGlzID0gaFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmdW5jdGlvbiBvblJlamVjdCh4KSB7XG5cdFx0XHRcdFx0ZW52LmNsZWFyVGltZXIodCk7XG5cdFx0XHRcdFx0dGhpcy5yZWplY3QoeCk7IC8vIHRoaXMgPSBoXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGgubm90aWZ5KTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIG9uVGltZW91dChyZWFzb24sIGgsIG1zKSB7XG5cdFx0XHR2YXIgZSA9IHR5cGVvZiByZWFzb24gPT09ICd1bmRlZmluZWQnXG5cdFx0XHRcdD8gbmV3IFRpbWVvdXRFcnJvcigndGltZWQgb3V0IGFmdGVyICcgKyBtcyArICdtcycpXG5cdFx0XHRcdDogcmVhc29uO1xuXHRcdFx0aC5yZWplY3QoZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFByb21pc2U7XG5cdH07XG5cbn0pO1xufSh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUgOiBmdW5jdGlvbihmYWN0b3J5KSB7IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKTsgfSkpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vd2hlbi9saWIvZGVjb3JhdG9ycy90aW1lZC5qc1xuICoqIG1vZHVsZSBpZCA9IDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4vKmdsb2JhbCBwcm9jZXNzLGRvY3VtZW50LHNldFRpbWVvdXQsY2xlYXJUaW1lb3V0LE11dGF0aW9uT2JzZXJ2ZXIsV2ViS2l0TXV0YXRpb25PYnNlcnZlciovXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbihyZXF1aXJlKSB7XG5cdC8qanNoaW50IG1heGNvbXBsZXhpdHk6NiovXG5cblx0Ly8gU25pZmYgXCJiZXN0XCIgYXN5bmMgc2NoZWR1bGluZyBvcHRpb25cblx0Ly8gUHJlZmVyIHByb2Nlc3MubmV4dFRpY2sgb3IgTXV0YXRpb25PYnNlcnZlciwgdGhlbiBjaGVjayBmb3Jcblx0Ly8gc2V0VGltZW91dCwgYW5kIGZpbmFsbHkgdmVydHgsIHNpbmNlIGl0cyB0aGUgb25seSBlbnYgdGhhdCBkb2Vzbid0XG5cdC8vIGhhdmUgc2V0VGltZW91dFxuXG5cdHZhciBNdXRhdGlvbk9icztcblx0dmFyIGNhcHR1cmVkU2V0VGltZW91dCA9IHR5cGVvZiBzZXRUaW1lb3V0ICE9PSAndW5kZWZpbmVkJyAmJiBzZXRUaW1lb3V0O1xuXG5cdC8vIERlZmF1bHQgZW52XG5cdHZhciBzZXRUaW1lciA9IGZ1bmN0aW9uKGYsIG1zKSB7IHJldHVybiBzZXRUaW1lb3V0KGYsIG1zKTsgfTtcblx0dmFyIGNsZWFyVGltZXIgPSBmdW5jdGlvbih0KSB7IHJldHVybiBjbGVhclRpbWVvdXQodCk7IH07XG5cdHZhciBhc2FwID0gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGNhcHR1cmVkU2V0VGltZW91dChmLCAwKTsgfTtcblxuXHQvLyBEZXRlY3Qgc3BlY2lmaWMgZW52XG5cdGlmIChpc05vZGUoKSkgeyAvLyBOb2RlXG5cdFx0YXNhcCA9IGZ1bmN0aW9uIChmKSB7IHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGYpOyB9O1xuXG5cdH0gZWxzZSBpZiAoTXV0YXRpb25PYnMgPSBoYXNNdXRhdGlvbk9ic2VydmVyKCkpIHsgLy8gTW9kZXJuIGJyb3dzZXJcblx0XHRhc2FwID0gaW5pdE11dGF0aW9uT2JzZXJ2ZXIoTXV0YXRpb25PYnMpO1xuXG5cdH0gZWxzZSBpZiAoIWNhcHR1cmVkU2V0VGltZW91dCkgeyAvLyB2ZXJ0Lnhcblx0XHR2YXIgdmVydHhSZXF1aXJlID0gcmVxdWlyZTtcblx0XHR2YXIgdmVydHggPSB2ZXJ0eFJlcXVpcmUoJ3ZlcnR4Jyk7XG5cdFx0c2V0VGltZXIgPSBmdW5jdGlvbiAoZiwgbXMpIHsgcmV0dXJuIHZlcnR4LnNldFRpbWVyKG1zLCBmKTsgfTtcblx0XHRjbGVhclRpbWVyID0gdmVydHguY2FuY2VsVGltZXI7XG5cdFx0YXNhcCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHNldFRpbWVyOiBzZXRUaW1lcixcblx0XHRjbGVhclRpbWVyOiBjbGVhclRpbWVyLFxuXHRcdGFzYXA6IGFzYXBcblx0fTtcblxuXHRmdW5jdGlvbiBpc05vZGUgKCkge1xuXHRcdHJldHVybiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiZcblx0XHRcdE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFzTXV0YXRpb25PYnNlcnZlciAoKSB7XG5cdFx0cmV0dXJuICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ2Z1bmN0aW9uJyAmJiBNdXRhdGlvbk9ic2VydmVyKSB8fFxuXHRcdFx0KHR5cGVvZiBXZWJLaXRNdXRhdGlvbk9ic2VydmVyID09PSAnZnVuY3Rpb24nICYmIFdlYktpdE11dGF0aW9uT2JzZXJ2ZXIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdE11dGF0aW9uT2JzZXJ2ZXIoTXV0YXRpb25PYnNlcnZlcikge1xuXHRcdHZhciBzY2hlZHVsZWQ7XG5cdFx0dmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG5cdFx0dmFyIG8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcihydW4pO1xuXHRcdG8ub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cblx0XHRmdW5jdGlvbiBydW4oKSB7XG5cdFx0XHR2YXIgZiA9IHNjaGVkdWxlZDtcblx0XHRcdHNjaGVkdWxlZCA9IHZvaWQgMDtcblx0XHRcdGYoKTtcblx0XHR9XG5cblx0XHR2YXIgaSA9IDA7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmKSB7XG5cdFx0XHRzY2hlZHVsZWQgPSBmO1xuXHRcdFx0bm9kZS5kYXRhID0gKGkgXj0gMSk7XG5cdFx0fTtcblx0fVxufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUpOyB9KSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi93aGVuL2xpYi9lbnYuanNcbiAqKiBtb2R1bGUgaWQgPSA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiAoaWdub3JlZCkgKi9cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIHZlcnR4IChpZ25vcmVkKVxuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7IHRocm93IG5ldyBFcnJvcihcImRlZmluZSBjYW5ub3QgYmUgdXNlZCBpbmRpcmVjdFwiKTsgfTtcclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAod2VicGFjaykvYnVpbGRpbi9hbWQtZGVmaW5lLmpzXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE0IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbihmdW5jdGlvbihkZWZpbmUpIHsgJ3VzZSBzdHJpY3QnO1xuZGVmaW5lKGZ1bmN0aW9uKCkge1xuXG5cdC8qKlxuXHQgKiBDdXN0b20gZXJyb3IgdHlwZSBmb3IgcHJvbWlzZXMgcmVqZWN0ZWQgYnkgcHJvbWlzZS50aW1lb3V0XG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKi9cblx0ZnVuY3Rpb24gVGltZW91dEVycm9yIChtZXNzYWdlKSB7XG5cdFx0RXJyb3IuY2FsbCh0aGlzKTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHRcdHRoaXMubmFtZSA9IFRpbWVvdXRFcnJvci5uYW1lO1xuXHRcdGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIFRpbWVvdXRFcnJvcik7XG5cdFx0fVxuXHR9XG5cblx0VGltZW91dEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcblx0VGltZW91dEVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpbWVvdXRFcnJvcjtcblxuXHRyZXR1cm4gVGltZW91dEVycm9yO1xufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IH0pKTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi93aGVuL2xpYi9UaW1lb3V0RXJyb3IuanNcbiAqKiBtb2R1bGUgaWQgPSA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTQgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuKGZ1bmN0aW9uKGRlZmluZSkgeyAndXNlIHN0cmljdCc7XG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSkge1xuXG5cdHZhciBzdGF0ZSA9IHJlcXVpcmUoJy4uL3N0YXRlJyk7XG5cdHZhciBhcHBsaWVyID0gcmVxdWlyZSgnLi4vYXBwbHknKTtcblxuXHRyZXR1cm4gZnVuY3Rpb24gYXJyYXkoUHJvbWlzZSkge1xuXG5cdFx0dmFyIGFwcGx5Rm9sZCA9IGFwcGxpZXIoUHJvbWlzZSk7XG5cdFx0dmFyIHRvUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZTtcblx0XHR2YXIgYWxsID0gUHJvbWlzZS5hbGw7XG5cblx0XHR2YXIgYXIgPSBBcnJheS5wcm90b3R5cGUucmVkdWNlO1xuXHRcdHZhciBhcnIgPSBBcnJheS5wcm90b3R5cGUucmVkdWNlUmlnaHQ7XG5cdFx0dmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG5cdFx0Ly8gQWRkaXRpb25hbCBhcnJheSBjb21iaW5hdG9yc1xuXG5cdFx0UHJvbWlzZS5hbnkgPSBhbnk7XG5cdFx0UHJvbWlzZS5zb21lID0gc29tZTtcblx0XHRQcm9taXNlLnNldHRsZSA9IHNldHRsZTtcblxuXHRcdFByb21pc2UubWFwID0gbWFwO1xuXHRcdFByb21pc2UuZmlsdGVyID0gZmlsdGVyO1xuXHRcdFByb21pc2UucmVkdWNlID0gcmVkdWNlO1xuXHRcdFByb21pc2UucmVkdWNlUmlnaHQgPSByZWR1Y2VSaWdodDtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZW4gdGhpcyBwcm9taXNlIGZ1bGZpbGxzIHdpdGggYW4gYXJyYXksIGRvXG5cdFx0ICogb25GdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSlcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkZ1bGZpbGxlZCBmdW5jdGlvbiB0byBhcHBseVxuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIGZvciB0aGUgcmVzdWx0IG9mIGFwcGx5aW5nIG9uRnVsZmlsbGVkXG5cdFx0ICovXG5cdFx0UHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24ob25GdWxmaWxsZWQpIHtcblx0XHRcdHJldHVybiB0aGlzLnRoZW4oYWxsKS50aGVuKGZ1bmN0aW9uKGFycmF5KSB7XG5cdFx0XHRcdHJldHVybiBvbkZ1bGZpbGxlZC5hcHBseSh0aGlzLCBhcnJheSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIFByb21pc2U7XG5cblx0XHQvKipcblx0XHQgKiBPbmUtd2lubmVyIGNvbXBldGl0aXZlIHJhY2UuXG5cdFx0ICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgZnVsZmlsbCB3aGVuIG9uZSBvZiB0aGUgcHJvbWlzZXNcblx0XHQgKiBpbiB0aGUgaW5wdXQgYXJyYXkgZnVsZmlsbHMsIG9yIHdpbGwgcmVqZWN0IHdoZW4gYWxsIHByb21pc2VzXG5cdFx0ICogaGF2ZSByZWplY3RlZC5cblx0XHQgKiBAcGFyYW0ge2FycmF5fSBwcm9taXNlc1xuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIGZvciB0aGUgZmlyc3QgZnVsZmlsbGVkIHZhbHVlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG5cdFx0XHR2YXIgcCA9IFByb21pc2UuX2RlZmVyKCk7XG5cdFx0XHR2YXIgcmVzb2x2ZXIgPSBwLl9oYW5kbGVyO1xuXHRcdFx0dmFyIGwgPSBwcm9taXNlcy5sZW5ndGg+Pj4wO1xuXG5cdFx0XHR2YXIgcGVuZGluZyA9IGw7XG5cdFx0XHR2YXIgZXJyb3JzID0gW107XG5cblx0XHRcdGZvciAodmFyIGgsIHgsIGkgPSAwOyBpIDwgbDsgKytpKSB7XG5cdFx0XHRcdHggPSBwcm9taXNlc1tpXTtcblx0XHRcdFx0aWYoeCA9PT0gdm9pZCAwICYmICEoaSBpbiBwcm9taXNlcykpIHtcblx0XHRcdFx0XHQtLXBlbmRpbmc7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRoID0gUHJvbWlzZS5faGFuZGxlcih4KTtcblx0XHRcdFx0aWYoaC5zdGF0ZSgpID4gMCkge1xuXHRcdFx0XHRcdHJlc29sdmVyLmJlY29tZShoKTtcblx0XHRcdFx0XHRQcm9taXNlLl92aXNpdFJlbWFpbmluZyhwcm9taXNlcywgaSwgaCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aC52aXNpdChyZXNvbHZlciwgaGFuZGxlRnVsZmlsbCwgaGFuZGxlUmVqZWN0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZihwZW5kaW5nID09PSAwKSB7XG5cdFx0XHRcdHJlc29sdmVyLnJlamVjdChuZXcgUmFuZ2VFcnJvcignYW55KCk6IGFycmF5IG11c3Qgbm90IGJlIGVtcHR5JykpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcDtcblxuXHRcdFx0ZnVuY3Rpb24gaGFuZGxlRnVsZmlsbCh4KSB7XG5cdFx0XHRcdC8qanNoaW50IHZhbGlkdGhpczp0cnVlKi9cblx0XHRcdFx0ZXJyb3JzID0gbnVsbDtcblx0XHRcdFx0dGhpcy5yZXNvbHZlKHgpOyAvLyB0aGlzID09PSByZXNvbHZlclxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBoYW5kbGVSZWplY3QoZSkge1xuXHRcdFx0XHQvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSovXG5cdFx0XHRcdGlmKHRoaXMucmVzb2x2ZWQpIHsgLy8gdGhpcyA9PT0gcmVzb2x2ZXJcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlcnJvcnMucHVzaChlKTtcblx0XHRcdFx0aWYoLS1wZW5kaW5nID09PSAwKSB7XG5cdFx0XHRcdFx0dGhpcy5yZWplY3QoZXJyb3JzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIE4td2lubmVyIGNvbXBldGl0aXZlIHJhY2Vcblx0XHQgKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCBmdWxmaWxsIHdoZW4gbiBpbnB1dCBwcm9taXNlcyBoYXZlXG5cdFx0ICogZnVsZmlsbGVkLCBvciB3aWxsIHJlamVjdCB3aGVuIGl0IGJlY29tZXMgaW1wb3NzaWJsZSBmb3IgblxuXHRcdCAqIGlucHV0IHByb21pc2VzIHRvIGZ1bGZpbGwgKGllIHdoZW4gcHJvbWlzZXMubGVuZ3RoIC0gbiArIDFcblx0XHQgKiBoYXZlIHJlamVjdGVkKVxuXHRcdCAqIEBwYXJhbSB7YXJyYXl9IHByb21pc2VzXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IG5cblx0XHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSBmb3IgdGhlIGVhcmxpZXN0IG4gZnVsZmlsbG1lbnQgdmFsdWVzXG5cdFx0ICpcblx0XHQgKiBAZGVwcmVjYXRlZFxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIHNvbWUocHJvbWlzZXMsIG4pIHtcblx0XHRcdC8qanNoaW50IG1heGNvbXBsZXhpdHk6NyovXG5cdFx0XHR2YXIgcCA9IFByb21pc2UuX2RlZmVyKCk7XG5cdFx0XHR2YXIgcmVzb2x2ZXIgPSBwLl9oYW5kbGVyO1xuXG5cdFx0XHR2YXIgcmVzdWx0cyA9IFtdO1xuXHRcdFx0dmFyIGVycm9ycyA9IFtdO1xuXG5cdFx0XHR2YXIgbCA9IHByb21pc2VzLmxlbmd0aD4+PjA7XG5cdFx0XHR2YXIgbkZ1bGZpbGwgPSAwO1xuXHRcdFx0dmFyIG5SZWplY3Q7XG5cdFx0XHR2YXIgeCwgaTsgLy8gcmV1c2VkIGluIGJvdGggZm9yKCkgbG9vcHNcblxuXHRcdFx0Ly8gRmlyc3QgcGFzczogY291bnQgYWN0dWFsIGFycmF5IGl0ZW1zXG5cdFx0XHRmb3IoaT0wOyBpPGw7ICsraSkge1xuXHRcdFx0XHR4ID0gcHJvbWlzZXNbaV07XG5cdFx0XHRcdGlmKHggPT09IHZvaWQgMCAmJiAhKGkgaW4gcHJvbWlzZXMpKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0KytuRnVsZmlsbDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ29tcHV0ZSBhY3R1YWwgZ29hbHNcblx0XHRcdG4gPSBNYXRoLm1heChuLCAwKTtcblx0XHRcdG5SZWplY3QgPSAobkZ1bGZpbGwgLSBuICsgMSk7XG5cdFx0XHRuRnVsZmlsbCA9IE1hdGgubWluKG4sIG5GdWxmaWxsKTtcblxuXHRcdFx0aWYobiA+IG5GdWxmaWxsKSB7XG5cdFx0XHRcdHJlc29sdmVyLnJlamVjdChuZXcgUmFuZ2VFcnJvcignc29tZSgpOiBhcnJheSBtdXN0IGNvbnRhaW4gYXQgbGVhc3QgJ1xuXHRcdFx0XHQrIG4gKyAnIGl0ZW0ocyksIGJ1dCBoYWQgJyArIG5GdWxmaWxsKSk7XG5cdFx0XHR9IGVsc2UgaWYobkZ1bGZpbGwgPT09IDApIHtcblx0XHRcdFx0cmVzb2x2ZXIucmVzb2x2ZShyZXN1bHRzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2Vjb25kIHBhc3M6IG9ic2VydmUgZWFjaCBhcnJheSBpdGVtLCBtYWtlIHByb2dyZXNzIHRvd2FyZCBnb2Fsc1xuXHRcdFx0Zm9yKGk9MDsgaTxsOyArK2kpIHtcblx0XHRcdFx0eCA9IHByb21pc2VzW2ldO1xuXHRcdFx0XHRpZih4ID09PSB2b2lkIDAgJiYgIShpIGluIHByb21pc2VzKSkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0UHJvbWlzZS5faGFuZGxlcih4KS52aXNpdChyZXNvbHZlciwgZnVsZmlsbCwgcmVqZWN0LCByZXNvbHZlci5ub3RpZnkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcDtcblxuXHRcdFx0ZnVuY3Rpb24gZnVsZmlsbCh4KSB7XG5cdFx0XHRcdC8qanNoaW50IHZhbGlkdGhpczp0cnVlKi9cblx0XHRcdFx0aWYodGhpcy5yZXNvbHZlZCkgeyAvLyB0aGlzID09PSByZXNvbHZlclxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJlc3VsdHMucHVzaCh4KTtcblx0XHRcdFx0aWYoLS1uRnVsZmlsbCA9PT0gMCkge1xuXHRcdFx0XHRcdGVycm9ycyA9IG51bGw7XG5cdFx0XHRcdFx0dGhpcy5yZXNvbHZlKHJlc3VsdHMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlamVjdChlKSB7XG5cdFx0XHRcdC8qanNoaW50IHZhbGlkdGhpczp0cnVlKi9cblx0XHRcdFx0aWYodGhpcy5yZXNvbHZlZCkgeyAvLyB0aGlzID09PSByZXNvbHZlclxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVycm9ycy5wdXNoKGUpO1xuXHRcdFx0XHRpZigtLW5SZWplY3QgPT09IDApIHtcblx0XHRcdFx0XHRyZXN1bHRzID0gbnVsbDtcblx0XHRcdFx0XHR0aGlzLnJlamVjdChlcnJvcnMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogQXBwbHkgZiB0byB0aGUgdmFsdWUgb2YgZWFjaCBwcm9taXNlIGluIGEgbGlzdCBvZiBwcm9taXNlc1xuXHRcdCAqIGFuZCByZXR1cm4gYSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSByZXN1bHRzLlxuXHRcdCAqIEBwYXJhbSB7YXJyYXl9IHByb21pc2VzXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbih4OiosIGluZGV4Ok51bWJlcik6Kn0gZiBtYXBwaW5nIGZ1bmN0aW9uXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gbWFwKHByb21pc2VzLCBmKSB7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5fdHJhdmVyc2UoZiwgcHJvbWlzZXMpO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEZpbHRlciB0aGUgcHJvdmlkZWQgYXJyYXkgb2YgcHJvbWlzZXMgdXNpbmcgdGhlIHByb3ZpZGVkIHByZWRpY2F0ZS4gIElucHV0IG1heVxuXHRcdCAqIGNvbnRhaW4gcHJvbWlzZXMgYW5kIHZhbHVlc1xuXHRcdCAqIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIGFuZCB2YWx1ZXNcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9uKHg6KiwgaW5kZXg6TnVtYmVyKTpib29sZWFufSBwcmVkaWNhdGUgZmlsdGVyaW5nIHByZWRpY2F0ZS5cblx0XHQgKiAgTXVzdCByZXR1cm4gdHJ1dGh5IChvciBwcm9taXNlIGZvciB0cnV0aHkpIGZvciBpdGVtcyB0byByZXRhaW4uXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdGhhdCB3aWxsIGZ1bGZpbGwgd2l0aCBhbiBhcnJheSBjb250YWluaW5nIGFsbCBpdGVtc1xuXHRcdCAqICBmb3Igd2hpY2ggcHJlZGljYXRlIHJldHVybmVkIHRydXRoeS5cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBmaWx0ZXIocHJvbWlzZXMsIHByZWRpY2F0ZSkge1xuXHRcdFx0dmFyIGEgPSBzbGljZS5jYWxsKHByb21pc2VzKTtcblx0XHRcdHJldHVybiBQcm9taXNlLl90cmF2ZXJzZShwcmVkaWNhdGUsIGEpLnRoZW4oZnVuY3Rpb24oa2VlcCkge1xuXHRcdFx0XHRyZXR1cm4gZmlsdGVyU3luYyhhLCBrZWVwKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGZpbHRlclN5bmMocHJvbWlzZXMsIGtlZXApIHtcblx0XHRcdC8vIFNhZmUgYmVjYXVzZSB3ZSBrbm93IGFsbCBwcm9taXNlcyBoYXZlIGZ1bGZpbGxlZCBpZiB3ZSd2ZSBtYWRlIGl0IHRoaXMgZmFyXG5cdFx0XHR2YXIgbCA9IGtlZXAubGVuZ3RoO1xuXHRcdFx0dmFyIGZpbHRlcmVkID0gbmV3IEFycmF5KGwpO1xuXHRcdFx0Zm9yKHZhciBpPTAsIGo9MDsgaTxsOyArK2kpIHtcblx0XHRcdFx0aWYoa2VlcFtpXSkge1xuXHRcdFx0XHRcdGZpbHRlcmVkW2orK10gPSBQcm9taXNlLl9oYW5kbGVyKHByb21pc2VzW2ldKS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZmlsdGVyZWQubGVuZ3RoID0gajtcblx0XHRcdHJldHVybiBmaWx0ZXJlZDtcblxuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybiBhIHByb21pc2UgdGhhdCB3aWxsIGFsd2F5cyBmdWxmaWxsIHdpdGggYW4gYXJyYXkgY29udGFpbmluZ1xuXHRcdCAqIHRoZSBvdXRjb21lIHN0YXRlcyBvZiBhbGwgaW5wdXQgcHJvbWlzZXMuICBUaGUgcmV0dXJuZWQgcHJvbWlzZVxuXHRcdCAqIHdpbGwgbmV2ZXIgcmVqZWN0LlxuXHRcdCAqIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgZm9yIGFycmF5IG9mIHNldHRsZWQgc3RhdGUgZGVzY3JpcHRvcnNcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBzZXR0bGUocHJvbWlzZXMpIHtcblx0XHRcdHJldHVybiBhbGwocHJvbWlzZXMubWFwKHNldHRsZU9uZSkpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHNldHRsZU9uZShwKSB7XG5cdFx0XHR2YXIgaCA9IFByb21pc2UuX2hhbmRsZXIocCk7XG5cdFx0XHRpZihoLnN0YXRlKCkgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIHRvUHJvbWlzZShwKS50aGVuKHN0YXRlLmZ1bGZpbGxlZCwgc3RhdGUucmVqZWN0ZWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRoLl91bnJlcG9ydCgpO1xuXHRcdFx0cmV0dXJuIHN0YXRlLmluc3BlY3QoaCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogVHJhZGl0aW9uYWwgcmVkdWNlIGZ1bmN0aW9uLCBzaW1pbGFyIHRvIGBBcnJheS5wcm90b3R5cGUucmVkdWNlKClgLCBidXRcblx0XHQgKiBpbnB1dCBtYXkgY29udGFpbiBwcm9taXNlcyBhbmQvb3IgdmFsdWVzLCBhbmQgcmVkdWNlRnVuY1xuXHRcdCAqIG1heSByZXR1cm4gZWl0aGVyIGEgdmFsdWUgb3IgYSBwcm9taXNlLCAqYW5kKiBpbml0aWFsVmFsdWUgbWF5XG5cdFx0ICogYmUgYSBwcm9taXNlIGZvciB0aGUgc3RhcnRpbmcgdmFsdWUuXG5cdFx0ICogQHBhcmFtIHtBcnJheXxQcm9taXNlfSBwcm9taXNlcyBhcnJheSBvciBwcm9taXNlIGZvciBhbiBhcnJheSBvZiBhbnl0aGluZyxcblx0XHQgKiAgICAgIG1heSBjb250YWluIGEgbWl4IG9mIHByb21pc2VzIGFuZCB2YWx1ZXMuXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbihhY2N1bXVsYXRlZDoqLCB4OiosIGluZGV4Ok51bWJlcik6Kn0gZiByZWR1Y2UgZnVuY3Rpb25cblx0XHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gdGhhdCB3aWxsIHJlc29sdmUgdG8gdGhlIGZpbmFsIHJlZHVjZWQgdmFsdWVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiByZWR1Y2UocHJvbWlzZXMsIGYgLyosIGluaXRpYWxWYWx1ZSAqLykge1xuXHRcdFx0cmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXIuY2FsbChwcm9taXNlcywgbGlmdENvbWJpbmUoZiksIGFyZ3VtZW50c1syXSlcblx0XHRcdFx0XHQ6IGFyLmNhbGwocHJvbWlzZXMsIGxpZnRDb21iaW5lKGYpKTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBUcmFkaXRpb25hbCByZWR1Y2UgZnVuY3Rpb24sIHNpbWlsYXIgdG8gYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VSaWdodCgpYCwgYnV0XG5cdFx0ICogaW5wdXQgbWF5IGNvbnRhaW4gcHJvbWlzZXMgYW5kL29yIHZhbHVlcywgYW5kIHJlZHVjZUZ1bmNcblx0XHQgKiBtYXkgcmV0dXJuIGVpdGhlciBhIHZhbHVlIG9yIGEgcHJvbWlzZSwgKmFuZCogaW5pdGlhbFZhbHVlIG1heVxuXHRcdCAqIGJlIGEgcHJvbWlzZSBmb3IgdGhlIHN0YXJ0aW5nIHZhbHVlLlxuXHRcdCAqIEBwYXJhbSB7QXJyYXl8UHJvbWlzZX0gcHJvbWlzZXMgYXJyYXkgb3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYW55dGhpbmcsXG5cdFx0ICogICAgICBtYXkgY29udGFpbiBhIG1peCBvZiBwcm9taXNlcyBhbmQgdmFsdWVzLlxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb24oYWNjdW11bGF0ZWQ6KiwgeDoqLCBpbmRleDpOdW1iZXIpOip9IGYgcmVkdWNlIGZ1bmN0aW9uXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9IHRoYXQgd2lsbCByZXNvbHZlIHRvIHRoZSBmaW5hbCByZWR1Y2VkIHZhbHVlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gcmVkdWNlUmlnaHQocHJvbWlzZXMsIGYgLyosIGluaXRpYWxWYWx1ZSAqLykge1xuXHRcdFx0cmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJyLmNhbGwocHJvbWlzZXMsIGxpZnRDb21iaW5lKGYpLCBhcmd1bWVudHNbMl0pXG5cdFx0XHRcdFx0OiBhcnIuY2FsbChwcm9taXNlcywgbGlmdENvbWJpbmUoZikpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGxpZnRDb21iaW5lKGYpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbih6LCB4LCBpKSB7XG5cdFx0XHRcdHJldHVybiBhcHBseUZvbGQoZiwgdm9pZCAwLCBbeix4LGldKTtcblx0XHRcdH07XG5cdFx0fVxuXHR9O1xuXG59KTtcbn0odHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lIDogZnVuY3Rpb24oZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSk7IH0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3doZW4vbGliL2RlY29yYXRvcnMvYXJyYXkuanNcbiAqKiBtb2R1bGUgaWQgPSAxMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE0IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbihmdW5jdGlvbihkZWZpbmUpIHsgJ3VzZSBzdHJpY3QnO1xuZGVmaW5lKGZ1bmN0aW9uKCkge1xuXG5cdHJldHVybiB7XG5cdFx0cGVuZGluZzogdG9QZW5kaW5nU3RhdGUsXG5cdFx0ZnVsZmlsbGVkOiB0b0Z1bGZpbGxlZFN0YXRlLFxuXHRcdHJlamVjdGVkOiB0b1JlamVjdGVkU3RhdGUsXG5cdFx0aW5zcGVjdDogaW5zcGVjdFxuXHR9O1xuXG5cdGZ1bmN0aW9uIHRvUGVuZGluZ1N0YXRlKCkge1xuXHRcdHJldHVybiB7IHN0YXRlOiAncGVuZGluZycgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvUmVqZWN0ZWRTdGF0ZShlKSB7XG5cdFx0cmV0dXJuIHsgc3RhdGU6ICdyZWplY3RlZCcsIHJlYXNvbjogZSB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gdG9GdWxmaWxsZWRTdGF0ZSh4KSB7XG5cdFx0cmV0dXJuIHsgc3RhdGU6ICdmdWxmaWxsZWQnLCB2YWx1ZTogeCB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5zcGVjdChoYW5kbGVyKSB7XG5cdFx0dmFyIHN0YXRlID0gaGFuZGxlci5zdGF0ZSgpO1xuXHRcdHJldHVybiBzdGF0ZSA9PT0gMCA/IHRvUGVuZGluZ1N0YXRlKClcblx0XHRcdCA6IHN0YXRlID4gMCAgID8gdG9GdWxmaWxsZWRTdGF0ZShoYW5kbGVyLnZhbHVlKVxuXHRcdFx0ICAgICAgICAgICAgICAgOiB0b1JlamVjdGVkU3RhdGUoaGFuZGxlci52YWx1ZSk7XG5cdH1cblxufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IH0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3doZW4vbGliL3N0YXRlLmpzXG4gKiogbW9kdWxlIGlkID0gMTFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbigpIHtcblxuXHRtYWtlQXBwbHkudHJ5Q2F0Y2hSZXNvbHZlID0gdHJ5Q2F0Y2hSZXNvbHZlO1xuXG5cdHJldHVybiBtYWtlQXBwbHk7XG5cblx0ZnVuY3Rpb24gbWFrZUFwcGx5KFByb21pc2UsIGNhbGwpIHtcblx0XHRpZihhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuXHRcdFx0Y2FsbCA9IHRyeUNhdGNoUmVzb2x2ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXBwbHk7XG5cblx0XHRmdW5jdGlvbiBhcHBseShmLCB0aGlzQXJnLCBhcmdzKSB7XG5cdFx0XHR2YXIgcCA9IFByb21pc2UuX2RlZmVyKCk7XG5cdFx0XHR2YXIgbCA9IGFyZ3MubGVuZ3RoO1xuXHRcdFx0dmFyIHBhcmFtcyA9IG5ldyBBcnJheShsKTtcblx0XHRcdGNhbGxBbmRSZXNvbHZlKHsgZjpmLCB0aGlzQXJnOnRoaXNBcmcsIGFyZ3M6YXJncywgcGFyYW1zOnBhcmFtcywgaTpsLTEsIGNhbGw6Y2FsbCB9LCBwLl9oYW5kbGVyKTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gY2FsbEFuZFJlc29sdmUoYywgaCkge1xuXHRcdFx0aWYoYy5pIDwgMCkge1xuXHRcdFx0XHRyZXR1cm4gY2FsbChjLmYsIGMudGhpc0FyZywgYy5wYXJhbXMsIGgpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaGFuZGxlciA9IFByb21pc2UuX2hhbmRsZXIoYy5hcmdzW2MuaV0pO1xuXHRcdFx0aGFuZGxlci5mb2xkKGNhbGxBbmRSZXNvbHZlTmV4dCwgYywgdm9pZCAwLCBoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBjYWxsQW5kUmVzb2x2ZU5leHQoYywgeCwgaCkge1xuXHRcdFx0Yy5wYXJhbXNbYy5pXSA9IHg7XG5cdFx0XHRjLmkgLT0gMTtcblx0XHRcdGNhbGxBbmRSZXNvbHZlKGMsIGgpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRyeUNhdGNoUmVzb2x2ZShmLCB0aGlzQXJnLCBhcmdzLCByZXNvbHZlcikge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXNvbHZlci5yZXNvbHZlKGYuYXBwbHkodGhpc0FyZywgYXJncykpO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0cmVzb2x2ZXIucmVqZWN0KGUpO1xuXHRcdH1cblx0fVxuXG59KTtcbn0odHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lIDogZnVuY3Rpb24oZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTsgfSkpO1xuXG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3doZW4vbGliL2FwcGx5LmpzXG4gKiogbW9kdWxlIGlkID0gMTJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbigpIHtcblxuXHRyZXR1cm4gZnVuY3Rpb24gZmxvdyhQcm9taXNlKSB7XG5cblx0XHR2YXIgcmVzb2x2ZSA9IFByb21pc2UucmVzb2x2ZTtcblx0XHR2YXIgcmVqZWN0ID0gUHJvbWlzZS5yZWplY3Q7XG5cdFx0dmFyIG9yaWdDYXRjaCA9IFByb21pc2UucHJvdG90eXBlWydjYXRjaCddO1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlIHRoZSB1bHRpbWF0ZSBmdWxmaWxsbWVudCB2YWx1ZSBvciByZWplY3Rpb24gcmVhc29uLCBhbmQgYXNzdW1lXG5cdFx0ICogcmVzcG9uc2liaWxpdHkgZm9yIGFsbCBlcnJvcnMuICBJZiBhbiBlcnJvciBwcm9wYWdhdGVzIG91dCBvZiByZXN1bHRcblx0XHQgKiBvciBoYW5kbGVGYXRhbEVycm9yLCBpdCB3aWxsIGJlIHJldGhyb3duIHRvIHRoZSBob3N0LCByZXN1bHRpbmcgaW4gYVxuXHRcdCAqIGxvdWQgc3RhY2sgdHJhY2sgb24gbW9zdCBwbGF0Zm9ybXMgYW5kIGEgY3Jhc2ggb24gc29tZS5cblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9uP30gb25SZXN1bHRcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9uP30gb25FcnJvclxuXHRcdCAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG5cdFx0ICovXG5cdFx0UHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKG9uUmVzdWx0LCBvbkVycm9yKSB7XG5cdFx0XHR0aGlzLl9oYW5kbGVyLnZpc2l0KHRoaXMuX2hhbmRsZXIucmVjZWl2ZXIsIG9uUmVzdWx0LCBvbkVycm9yKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQWRkIEVycm9yLXR5cGUgYW5kIHByZWRpY2F0ZSBtYXRjaGluZyB0byBjYXRjaC4gIEV4YW1wbGVzOlxuXHRcdCAqIHByb21pc2UuY2F0Y2goVHlwZUVycm9yLCBoYW5kbGVUeXBlRXJyb3IpXG5cdFx0ICogICAuY2F0Y2gocHJlZGljYXRlLCBoYW5kbGVNYXRjaGVkRXJyb3JzKVxuXHRcdCAqICAgLmNhdGNoKGhhbmRsZVJlbWFpbmluZ0Vycm9ycylcblx0XHQgKiBAcGFyYW0gb25SZWplY3RlZFxuXHRcdCAqIEByZXR1cm5zIHsqfVxuXHRcdCAqL1xuXHRcdFByb21pc2UucHJvdG90eXBlWydjYXRjaCddID0gUHJvbWlzZS5wcm90b3R5cGUub3RoZXJ3aXNlID0gZnVuY3Rpb24ob25SZWplY3RlZCkge1xuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG5cdFx0XHRcdHJldHVybiBvcmlnQ2F0Y2guY2FsbCh0aGlzLCBvblJlamVjdGVkKTtcblx0XHRcdH1cblxuXHRcdFx0aWYodHlwZW9mIG9uUmVqZWN0ZWQgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZW5zdXJlKHJlamVjdEludmFsaWRQcmVkaWNhdGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gb3JpZ0NhdGNoLmNhbGwodGhpcywgY3JlYXRlQ2F0Y2hGaWx0ZXIoYXJndW1lbnRzWzFdLCBvblJlamVjdGVkKSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFdyYXBzIHRoZSBwcm92aWRlZCBjYXRjaCBoYW5kbGVyLCBzbyB0aGF0IGl0IHdpbGwgb25seSBiZSBjYWxsZWRcblx0XHQgKiBpZiB0aGUgcHJlZGljYXRlIGV2YWx1YXRlcyB0cnV0aHlcblx0XHQgKiBAcGFyYW0gez9mdW5jdGlvbn0gaGFuZGxlclxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IHByZWRpY2F0ZVxuXHRcdCAqIEByZXR1cm5zIHtmdW5jdGlvbn0gY29uZGl0aW9uYWwgY2F0Y2ggaGFuZGxlclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUNhdGNoRmlsdGVyKGhhbmRsZXIsIHByZWRpY2F0ZSkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0cmV0dXJuIGV2YWx1YXRlUHJlZGljYXRlKGUsIHByZWRpY2F0ZSlcblx0XHRcdFx0XHQ/IGhhbmRsZXIuY2FsbCh0aGlzLCBlKVxuXHRcdFx0XHRcdDogcmVqZWN0KGUpO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBFbnN1cmVzIHRoYXQgb25GdWxmaWxsZWRPclJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlclxuXHRcdCAqIHRoaXMgcHJvbWlzZSBpcyBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuICBvbkZ1bGZpbGxlZE9yUmVqZWN0ZWQgV0lMTCBOT1Rcblx0XHQgKiByZWNlaXZlIHRoZSBwcm9taXNlcycgdmFsdWUgb3IgcmVhc29uLiAgQW55IHJldHVybmVkIHZhbHVlIHdpbGwgYmUgZGlzcmVnYXJkZWQuXG5cdFx0ICogb25GdWxmaWxsZWRPclJlamVjdGVkIG1heSB0aHJvdyBvciByZXR1cm4gYSByZWplY3RlZCBwcm9taXNlIHRvIHNpZ25hbFxuXHRcdCAqIGFuIGFkZGl0aW9uYWwgZXJyb3IuXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlciBoYW5kbGVyIHRvIGJlIGNhbGxlZCByZWdhcmRsZXNzIG9mXG5cdFx0ICogIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvblxuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfVxuXHRcdCAqL1xuXHRcdFByb21pc2UucHJvdG90eXBlWydmaW5hbGx5J10gPSBQcm9taXNlLnByb3RvdHlwZS5lbnN1cmUgPSBmdW5jdGlvbihoYW5kbGVyKSB7XG5cdFx0XHRpZih0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbih4KSB7XG5cdFx0XHRcdHJldHVybiBydW5TaWRlRWZmZWN0KGhhbmRsZXIsIHRoaXMsIGlkZW50aXR5LCB4KTtcblx0XHRcdH0sIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJ1blNpZGVFZmZlY3QoaGFuZGxlciwgdGhpcywgcmVqZWN0LCBlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBydW5TaWRlRWZmZWN0IChoYW5kbGVyLCB0aGlzQXJnLCBwcm9wYWdhdGUsIHZhbHVlKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gaGFuZGxlci5jYWxsKHRoaXNBcmcpO1xuXHRcdFx0cmV0dXJuIG1heWJlVGhlbmFibGUocmVzdWx0KVxuXHRcdFx0XHQ/IHByb3BhZ2F0ZVZhbHVlKHJlc3VsdCwgcHJvcGFnYXRlLCB2YWx1ZSlcblx0XHRcdFx0OiBwcm9wYWdhdGUodmFsdWUpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHByb3BhZ2F0ZVZhbHVlIChyZXN1bHQsIHByb3BhZ2F0ZSwgeCkge1xuXHRcdFx0cmV0dXJuIHJlc29sdmUocmVzdWx0KS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cmV0dXJuIHByb3BhZ2F0ZSh4KTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFJlY292ZXIgZnJvbSBhIGZhaWx1cmUgYnkgcmV0dXJuaW5nIGEgZGVmYXVsdFZhbHVlLiAgSWYgZGVmYXVsdFZhbHVlXG5cdFx0ICogaXMgYSBwcm9taXNlLCBpdCdzIGZ1bGZpbGxtZW50IHZhbHVlIHdpbGwgYmUgdXNlZC4gIElmIGRlZmF1bHRWYWx1ZSBpc1xuXHRcdCAqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMsIHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgcmVqZWN0IHdpdGggdGhlXG5cdFx0ICogc2FtZSByZWFzb24uXG5cdFx0ICogQHBhcmFtIHsqfSBkZWZhdWx0VmFsdWVcblx0XHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gbmV3IHByb21pc2Vcblx0XHQgKi9cblx0XHRQcm9taXNlLnByb3RvdHlwZVsnZWxzZSddID0gUHJvbWlzZS5wcm90b3R5cGUub3JFbHNlID0gZnVuY3Rpb24oZGVmYXVsdFZhbHVlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvcnRjdXQgZm9yIC50aGVuKGZ1bmN0aW9uKCkgeyByZXR1cm4gdmFsdWU7IH0pXG5cdFx0ICogQHBhcmFtICB7Kn0gdmFsdWVcblx0XHQgKiBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdDpcblx0XHQgKiAgLSBpcyBmdWxmaWxsZWQgaWYgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSwgb3Jcblx0XHQgKiAgLSBpZiB2YWx1ZSBpcyBhIHByb21pc2UsIHdpbGwgZnVsZmlsbCB3aXRoIGl0cyB2YWx1ZSwgb3IgcmVqZWN0XG5cdFx0ICogICAgd2l0aCBpdHMgcmVhc29uLlxuXHRcdCAqL1xuXHRcdFByb21pc2UucHJvdG90eXBlWyd5aWVsZCddID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSdW5zIGEgc2lkZSBlZmZlY3Qgd2hlbiB0aGlzIHByb21pc2UgZnVsZmlsbHMsIHdpdGhvdXQgY2hhbmdpbmcgdGhlXG5cdFx0ICogZnVsZmlsbG1lbnQgdmFsdWUuXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gb25GdWxmaWxsZWRTaWRlRWZmZWN0XG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdFx0ICovXG5cdFx0UHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24ob25GdWxmaWxsZWRTaWRlRWZmZWN0KSB7XG5cdFx0XHRyZXR1cm4gdGhpcy50aGVuKG9uRnVsZmlsbGVkU2lkZUVmZmVjdClbJ3lpZWxkJ10odGhpcyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBQcm9taXNlO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIHJlamVjdEludmFsaWRQcmVkaWNhdGUoKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignY2F0Y2ggcHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXZhbHVhdGVQcmVkaWNhdGUoZSwgcHJlZGljYXRlKSB7XG5cdFx0cmV0dXJuIGlzRXJyb3IocHJlZGljYXRlKSA/IGUgaW5zdGFuY2VvZiBwcmVkaWNhdGUgOiBwcmVkaWNhdGUoZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpc0Vycm9yKHByZWRpY2F0ZSkge1xuXHRcdHJldHVybiBwcmVkaWNhdGUgPT09IEVycm9yXG5cdFx0XHR8fCAocHJlZGljYXRlICE9IG51bGwgJiYgcHJlZGljYXRlLnByb3RvdHlwZSBpbnN0YW5jZW9mIEVycm9yKTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1heWJlVGhlbmFibGUoeCkge1xuXHRcdHJldHVybiAodHlwZW9mIHggPT09ICdvYmplY3QnIHx8IHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nKSAmJiB4ICE9PSBudWxsO1xuXHR9XG5cblx0ZnVuY3Rpb24gaWRlbnRpdHkoeCkge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cbn0pO1xufSh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUgOiBmdW5jdGlvbihmYWN0b3J5KSB7IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpOyB9KSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL2Zsb3cuanNcbiAqKiBtb2R1bGUgaWQgPSAxM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE0IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG4vKiogQGF1dGhvciBKZWZmIEVzY2FsYW50ZSAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbigpIHtcblxuXHRyZXR1cm4gZnVuY3Rpb24gZm9sZChQcm9taXNlKSB7XG5cblx0XHRQcm9taXNlLnByb3RvdHlwZS5mb2xkID0gZnVuY3Rpb24oZiwgeikge1xuXHRcdFx0dmFyIHByb21pc2UgPSB0aGlzLl9iZWdldCgpO1xuXG5cdFx0XHR0aGlzLl9oYW5kbGVyLmZvbGQoZnVuY3Rpb24oeiwgeCwgdG8pIHtcblx0XHRcdFx0UHJvbWlzZS5faGFuZGxlcih6KS5mb2xkKGZ1bmN0aW9uKHgsIHosIHRvKSB7XG5cdFx0XHRcdFx0dG8ucmVzb2x2ZShmLmNhbGwodGhpcywgeiwgeCkpO1xuXHRcdFx0XHR9LCB4LCB0aGlzLCB0byk7XG5cdFx0XHR9LCB6LCBwcm9taXNlLl9oYW5kbGVyLnJlY2VpdmVyLCBwcm9taXNlLl9oYW5kbGVyKTtcblxuXHRcdFx0cmV0dXJuIHByb21pc2U7XG5cdFx0fTtcblxuXHRcdHJldHVybiBQcm9taXNlO1xuXHR9O1xuXG59KTtcbn0odHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lIDogZnVuY3Rpb24oZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTsgfSkpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vd2hlbi9saWIvZGVjb3JhdG9ycy9mb2xkLmpzXG4gKiogbW9kdWxlIGlkID0gMTRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbihyZXF1aXJlKSB7XG5cblx0dmFyIGluc3BlY3QgPSByZXF1aXJlKCcuLi9zdGF0ZScpLmluc3BlY3Q7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIGluc3BlY3Rpb24oUHJvbWlzZSkge1xuXG5cdFx0UHJvbWlzZS5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGluc3BlY3QoUHJvbWlzZS5faGFuZGxlcih0aGlzKSk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBQcm9taXNlO1xuXHR9O1xuXG59KTtcbn0odHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lIDogZnVuY3Rpb24oZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSk7IH0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3doZW4vbGliL2RlY29yYXRvcnMvaW5zcGVjdC5qc1xuICoqIG1vZHVsZSBpZCA9IDE1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTQgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuKGZ1bmN0aW9uKGRlZmluZSkgeyAndXNlIHN0cmljdCc7XG5kZWZpbmUoZnVuY3Rpb24oKSB7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIGdlbmVyYXRlKFByb21pc2UpIHtcblxuXHRcdHZhciByZXNvbHZlID0gUHJvbWlzZS5yZXNvbHZlO1xuXG5cdFx0UHJvbWlzZS5pdGVyYXRlID0gaXRlcmF0ZTtcblx0XHRQcm9taXNlLnVuZm9sZCA9IHVuZm9sZDtcblxuXHRcdHJldHVybiBQcm9taXNlO1xuXG5cdFx0LyoqXG5cdFx0ICogQGRlcHJlY2F0ZWQgVXNlIGdpdGh1Yi5jb20vY3Vqb2pzL21vc3Qgc3RyZWFtcyBhbmQgbW9zdC5pdGVyYXRlXG5cdFx0ICogR2VuZXJhdGUgYSAocG90ZW50aWFsbHkgaW5maW5pdGUpIHN0cmVhbSBvZiBwcm9taXNlZCB2YWx1ZXM6XG5cdFx0ICogeCwgZih4KSwgZihmKHgpKSwgZXRjLiB1bnRpbCBjb25kaXRpb24oeCkgcmV0dXJucyB0cnVlXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gZiBmdW5jdGlvbiB0byBnZW5lcmF0ZSBhIG5ldyB4IGZyb20gdGhlIHByZXZpb3VzIHhcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb25kaXRpb24gZnVuY3Rpb24gdGhhdCwgZ2l2ZW4gdGhlIGN1cnJlbnQgeCwgcmV0dXJuc1xuXHRcdCAqICB0cnV0aHkgd2hlbiB0aGUgaXRlcmF0ZSBzaG91bGQgc3RvcFxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gdG8gaGFuZGxlIHRoZSB2YWx1ZSBwcm9kdWNlZCBieSBmXG5cdFx0ICogQHBhcmFtIHsqfFByb21pc2V9IHggc3RhcnRpbmcgdmFsdWUsIG1heSBiZSBhIHByb21pc2Vcblx0XHQgKiBAcmV0dXJuIHtQcm9taXNlfSB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGNhbGwgdG8gZiBiZWZvcmVcblx0XHQgKiAgY29uZGl0aW9uIHJldHVybnMgdHJ1ZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGl0ZXJhdGUoZiwgY29uZGl0aW9uLCBoYW5kbGVyLCB4KSB7XG5cdFx0XHRyZXR1cm4gdW5mb2xkKGZ1bmN0aW9uKHgpIHtcblx0XHRcdFx0cmV0dXJuIFt4LCBmKHgpXTtcblx0XHRcdH0sIGNvbmRpdGlvbiwgaGFuZGxlciwgeCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogQGRlcHJlY2F0ZWQgVXNlIGdpdGh1Yi5jb20vY3Vqb2pzL21vc3Qgc3RyZWFtcyBhbmQgbW9zdC51bmZvbGRcblx0XHQgKiBHZW5lcmF0ZSBhIChwb3RlbnRpYWxseSBpbmZpbml0ZSkgc3RyZWFtIG9mIHByb21pc2VkIHZhbHVlc1xuXHRcdCAqIGJ5IGFwcGx5aW5nIGhhbmRsZXIoZ2VuZXJhdG9yKHNlZWQpKSBpdGVyYXRpdmVseSB1bnRpbFxuXHRcdCAqIGNvbmRpdGlvbihzZWVkKSByZXR1cm5zIHRydWUuXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gdW5zcG9vbCBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIFt2YWx1ZSwgbmV3U2VlZF1cblx0XHQgKiAgZ2l2ZW4gYSBzZWVkLlxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmRpdGlvbiBmdW5jdGlvbiB0aGF0LCBnaXZlbiB0aGUgY3VycmVudCBzZWVkLCByZXR1cm5zXG5cdFx0ICogIHRydXRoeSB3aGVuIHRoZSB1bmZvbGQgc2hvdWxkIHN0b3Bcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyIGZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgdmFsdWUgcHJvZHVjZWQgYnkgdW5zcG9vbFxuXHRcdCAqIEBwYXJhbSB4IHsqfFByb21pc2V9IHN0YXJ0aW5nIHZhbHVlLCBtYXkgYmUgYSBwcm9taXNlXG5cdFx0ICogQHJldHVybiB7UHJvbWlzZX0gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCB2YWx1ZSBwcm9kdWNlZCBieSB1bnNwb29sIGJlZm9yZVxuXHRcdCAqICBjb25kaXRpb24gcmV0dXJucyB0cnVlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gdW5mb2xkKHVuc3Bvb2wsIGNvbmRpdGlvbiwgaGFuZGxlciwgeCkge1xuXHRcdFx0cmV0dXJuIHJlc29sdmUoeCkudGhlbihmdW5jdGlvbihzZWVkKSB7XG5cdFx0XHRcdHJldHVybiByZXNvbHZlKGNvbmRpdGlvbihzZWVkKSkudGhlbihmdW5jdGlvbihkb25lKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRvbmUgPyBzZWVkIDogcmVzb2x2ZSh1bnNwb29sKHNlZWQpKS5zcHJlYWQobmV4dCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGZ1bmN0aW9uIG5leHQoaXRlbSwgbmV3U2VlZCkge1xuXHRcdFx0XHRyZXR1cm4gcmVzb2x2ZShoYW5kbGVyKGl0ZW0pKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiB1bmZvbGQodW5zcG9vbCwgY29uZGl0aW9uLCBoYW5kbGVyLCBuZXdTZWVkKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG59KTtcbn0odHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lIDogZnVuY3Rpb24oZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTsgfSkpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vd2hlbi9saWIvZGVjb3JhdG9ycy9pdGVyYXRlLmpzXG4gKiogbW9kdWxlIGlkID0gMTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbigpIHtcblxuXHRyZXR1cm4gZnVuY3Rpb24gcHJvZ3Jlc3MoUHJvbWlzZSkge1xuXG5cdFx0LyoqXG5cdFx0ICogQGRlcHJlY2F0ZWRcblx0XHQgKiBSZWdpc3RlciBhIHByb2dyZXNzIGhhbmRsZXIgZm9yIHRoaXMgcHJvbWlzZVxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uUHJvZ3Jlc3Ncblx0XHQgKiBAcmV0dXJucyB7UHJvbWlzZX1cblx0XHQgKi9cblx0XHRQcm9taXNlLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uKG9uUHJvZ3Jlc3MpIHtcblx0XHRcdHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIG9uUHJvZ3Jlc3MpO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gUHJvbWlzZTtcblx0fTtcblxufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IH0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3doZW4vbGliL2RlY29yYXRvcnMvcHJvZ3Jlc3MuanNcbiAqKiBtb2R1bGUgaWQgPSAxN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE0IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbihmdW5jdGlvbihkZWZpbmUpIHsgJ3VzZSBzdHJpY3QnO1xuZGVmaW5lKGZ1bmN0aW9uKCkge1xuXG5cdHJldHVybiBmdW5jdGlvbiBhZGRXaXRoKFByb21pc2UpIHtcblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aG9zZSBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCB3aXRoIGB0aGlzYCBzZXQgdG9cblx0XHQgKiB0aGUgc3VwcGxpZWQgcmVjZWl2ZXIuICBTdWJzZXF1ZW50IHByb21pc2VzIGRlcml2ZWQgZnJvbSB0aGVcblx0XHQgKiByZXR1cm5lZCBwcm9taXNlIHdpbGwgYWxzbyBoYXZlIHRoZWlyIGhhbmRsZXJzIGNhbGxlZCB3aXRoIHJlY2VpdmVyXG5cdFx0ICogYXMgYHRoaXNgLiBDYWxsaW5nIGB3aXRoYCB3aXRoIHVuZGVmaW5lZCBvciBubyBhcmd1bWVudHMgd2lsbCByZXR1cm5cblx0XHQgKiBhIHByb21pc2Ugd2hvc2UgaGFuZGxlcnMgd2lsbCBhZ2FpbiBiZSBjYWxsZWQgaW4gdGhlIHVzdWFsIFByb21pc2VzL0ErXG5cdFx0ICogd2F5IChubyBgdGhpc2ApIHRodXMgc2FmZWx5IHVuZG9pbmcgYW55IHByZXZpb3VzIGB3aXRoYCBpbiB0aGVcblx0XHQgKiBwcm9taXNlIGNoYWluLlxuXHRcdCAqXG5cdFx0ICogV0FSTklORzogUHJvbWlzZXMgcmV0dXJuZWQgZnJvbSBgd2l0aGAvYHdpdGhUaGlzYCBhcmUgTk9UIFByb21pc2VzL0ErXG5cdFx0ICogY29tcGxpYW50LCBzcGVjaWZpY2FsbHkgdmlvbGF0aW5nIDIuMi41IChodHRwOi8vcHJvbWlzZXNhcGx1cy5jb20vI3BvaW50LTQxKVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IHJlY2VpdmVyIGB0aGlzYCB2YWx1ZSBmb3IgYWxsIGhhbmRsZXJzIGF0dGFjaGVkIHRvXG5cdFx0ICogIHRoZSByZXR1cm5lZCBwcm9taXNlLlxuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfVxuXHRcdCAqL1xuXHRcdFByb21pc2UucHJvdG90eXBlWyd3aXRoJ10gPSBQcm9taXNlLnByb3RvdHlwZS53aXRoVGhpcyA9IGZ1bmN0aW9uKHJlY2VpdmVyKSB7XG5cdFx0XHR2YXIgcCA9IHRoaXMuX2JlZ2V0KCk7XG5cdFx0XHR2YXIgY2hpbGQgPSBwLl9oYW5kbGVyO1xuXHRcdFx0Y2hpbGQucmVjZWl2ZXIgPSByZWNlaXZlcjtcblx0XHRcdHRoaXMuX2hhbmRsZXIuY2hhaW4oY2hpbGQsIHJlY2VpdmVyKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gUHJvbWlzZTtcblx0fTtcblxufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IH0pKTtcblxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vd2hlbi9saWIvZGVjb3JhdG9ycy93aXRoLmpzXG4gKiogbW9kdWxlIGlkID0gMThcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbihyZXF1aXJlKSB7XG5cblx0dmFyIHNldFRpbWVyID0gcmVxdWlyZSgnLi4vZW52Jykuc2V0VGltZXI7XG5cdHZhciBmb3JtYXQgPSByZXF1aXJlKCcuLi9mb3JtYXQnKTtcblxuXHRyZXR1cm4gZnVuY3Rpb24gdW5oYW5kbGVkUmVqZWN0aW9uKFByb21pc2UpIHtcblxuXHRcdHZhciBsb2dFcnJvciA9IG5vb3A7XG5cdFx0dmFyIGxvZ0luZm8gPSBub29wO1xuXHRcdHZhciBsb2NhbENvbnNvbGU7XG5cblx0XHRpZih0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdC8vIEFsaWFzIGNvbnNvbGUgdG8gcHJldmVudCB0aGluZ3MgbGlrZSB1Z2xpZnkncyBkcm9wX2NvbnNvbGUgb3B0aW9uIGZyb21cblx0XHRcdC8vIHJlbW92aW5nIGNvbnNvbGUubG9nL2Vycm9yLiBVbmhhbmRsZWQgcmVqZWN0aW9ucyBmYWxsIGludG8gdGhlIHNhbWVcblx0XHRcdC8vIGNhdGVnb3J5IGFzIHVuY2F1Z2h0IGV4Y2VwdGlvbnMsIGFuZCBidWlsZCB0b29scyBzaG91bGRuJ3Qgc2lsZW5jZSB0aGVtLlxuXHRcdFx0bG9jYWxDb25zb2xlID0gY29uc29sZTtcblx0XHRcdGxvZ0Vycm9yID0gdHlwZW9mIGxvY2FsQ29uc29sZS5lcnJvciAhPT0gJ3VuZGVmaW5lZCdcblx0XHRcdFx0PyBmdW5jdGlvbiAoZSkgeyBsb2NhbENvbnNvbGUuZXJyb3IoZSk7IH1cblx0XHRcdFx0OiBmdW5jdGlvbiAoZSkgeyBsb2NhbENvbnNvbGUubG9nKGUpOyB9O1xuXG5cdFx0XHRsb2dJbmZvID0gdHlwZW9mIGxvY2FsQ29uc29sZS5pbmZvICE9PSAndW5kZWZpbmVkJ1xuXHRcdFx0XHQ/IGZ1bmN0aW9uIChlKSB7IGxvY2FsQ29uc29sZS5pbmZvKGUpOyB9XG5cdFx0XHRcdDogZnVuY3Rpb24gKGUpIHsgbG9jYWxDb25zb2xlLmxvZyhlKTsgfTtcblx0XHR9XG5cblx0XHRQcm9taXNlLm9uUG90ZW50aWFsbHlVbmhhbmRsZWRSZWplY3Rpb24gPSBmdW5jdGlvbihyZWplY3Rpb24pIHtcblx0XHRcdGVucXVldWUocmVwb3J0LCByZWplY3Rpb24pO1xuXHRcdH07XG5cblx0XHRQcm9taXNlLm9uUG90ZW50aWFsbHlVbmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkID0gZnVuY3Rpb24ocmVqZWN0aW9uKSB7XG5cdFx0XHRlbnF1ZXVlKHVucmVwb3J0LCByZWplY3Rpb24pO1xuXHRcdH07XG5cblx0XHRQcm9taXNlLm9uRmF0YWxSZWplY3Rpb24gPSBmdW5jdGlvbihyZWplY3Rpb24pIHtcblx0XHRcdGVucXVldWUodGhyb3dpdCwgcmVqZWN0aW9uLnZhbHVlKTtcblx0XHR9O1xuXG5cdFx0dmFyIHRhc2tzID0gW107XG5cdFx0dmFyIHJlcG9ydGVkID0gW107XG5cdFx0dmFyIHJ1bm5pbmcgPSBudWxsO1xuXG5cdFx0ZnVuY3Rpb24gcmVwb3J0KHIpIHtcblx0XHRcdGlmKCFyLmhhbmRsZWQpIHtcblx0XHRcdFx0cmVwb3J0ZWQucHVzaChyKTtcblx0XHRcdFx0bG9nRXJyb3IoJ1BvdGVudGlhbGx5IHVuaGFuZGxlZCByZWplY3Rpb24gWycgKyByLmlkICsgJ10gJyArIGZvcm1hdC5mb3JtYXRFcnJvcihyLnZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdW5yZXBvcnQocikge1xuXHRcdFx0dmFyIGkgPSByZXBvcnRlZC5pbmRleE9mKHIpO1xuXHRcdFx0aWYoaSA+PSAwKSB7XG5cdFx0XHRcdHJlcG9ydGVkLnNwbGljZShpLCAxKTtcblx0XHRcdFx0bG9nSW5mbygnSGFuZGxlZCBwcmV2aW91cyByZWplY3Rpb24gWycgKyByLmlkICsgJ10gJyArIGZvcm1hdC5mb3JtYXRPYmplY3Qoci52YWx1ZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGVucXVldWUoZiwgeCkge1xuXHRcdFx0dGFza3MucHVzaChmLCB4KTtcblx0XHRcdGlmKHJ1bm5pbmcgPT09IG51bGwpIHtcblx0XHRcdFx0cnVubmluZyA9IHNldFRpbWVyKGZsdXNoLCAwKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBmbHVzaCgpIHtcblx0XHRcdHJ1bm5pbmcgPSBudWxsO1xuXHRcdFx0d2hpbGUodGFza3MubGVuZ3RoID4gMCkge1xuXHRcdFx0XHR0YXNrcy5zaGlmdCgpKHRhc2tzLnNoaWZ0KCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBQcm9taXNlO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIHRocm93aXQoZSkge1xuXHRcdHRocm93IGU7XG5cdH1cblxuXHRmdW5jdGlvbiBub29wKCkge31cblxufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUpOyB9KSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi93aGVuL2xpYi9kZWNvcmF0b3JzL3VuaGFuZGxlZFJlamVjdGlvbi5qc1xuICoqIG1vZHVsZSBpZCA9IDE5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTQgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuKGZ1bmN0aW9uKGRlZmluZSkgeyAndXNlIHN0cmljdCc7XG5kZWZpbmUoZnVuY3Rpb24oKSB7XG5cblx0cmV0dXJuIHtcblx0XHRmb3JtYXRFcnJvcjogZm9ybWF0RXJyb3IsXG5cdFx0Zm9ybWF0T2JqZWN0OiBmb3JtYXRPYmplY3QsXG5cdFx0dHJ5U3RyaW5naWZ5OiB0cnlTdHJpbmdpZnlcblx0fTtcblxuXHQvKipcblx0ICogRm9ybWF0IGFuIGVycm9yIGludG8gYSBzdHJpbmcuICBJZiBlIGlzIGFuIEVycm9yIGFuZCBoYXMgYSBzdGFjayBwcm9wZXJ0eSxcblx0ICogaXQncyByZXR1cm5lZC4gIE90aGVyd2lzZSwgZSBpcyBmb3JtYXR0ZWQgdXNpbmcgZm9ybWF0T2JqZWN0LCB3aXRoIGFcblx0ICogd2FybmluZyBhZGRlZCBhYm91dCBlIG5vdCBiZWluZyBhIHByb3BlciBFcnJvci5cblx0ICogQHBhcmFtIHsqfSBlXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IGZvcm1hdHRlZCBzdHJpbmcsIHN1aXRhYmxlIGZvciBvdXRwdXQgdG8gZGV2ZWxvcGVyc1xuXHQgKi9cblx0ZnVuY3Rpb24gZm9ybWF0RXJyb3IoZSkge1xuXHRcdHZhciBzID0gdHlwZW9mIGUgPT09ICdvYmplY3QnICYmIGUgIT09IG51bGwgJiYgZS5zdGFjayA/IGUuc3RhY2sgOiBmb3JtYXRPYmplY3QoZSk7XG5cdFx0cmV0dXJuIGUgaW5zdGFuY2VvZiBFcnJvciA/IHMgOiBzICsgJyAoV0FSTklORzogbm9uLUVycm9yIHVzZWQpJztcblx0fVxuXG5cdC8qKlxuXHQgKiBGb3JtYXQgYW4gb2JqZWN0LCBkZXRlY3RpbmcgXCJwbGFpblwiIG9iamVjdHMgYW5kIHJ1bm5pbmcgdGhlbSB0aHJvdWdoXG5cdCAqIEpTT04uc3RyaW5naWZ5IGlmIHBvc3NpYmxlLlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb1xuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHQgKi9cblx0ZnVuY3Rpb24gZm9ybWF0T2JqZWN0KG8pIHtcblx0XHR2YXIgcyA9IFN0cmluZyhvKTtcblx0XHRpZihzID09PSAnW29iamVjdCBPYmplY3RdJyAmJiB0eXBlb2YgSlNPTiAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHMgPSB0cnlTdHJpbmdpZnkobywgcyk7XG5cdFx0fVxuXHRcdHJldHVybiBzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRyeSB0byByZXR1cm4gdGhlIHJlc3VsdCBvZiBKU09OLnN0cmluZ2lmeSh4KS4gIElmIHRoYXQgZmFpbHMsIHJldHVyblxuXHQgKiBkZWZhdWx0VmFsdWVcblx0ICogQHBhcmFtIHsqfSB4XG5cdCAqIEBwYXJhbSB7Kn0gZGVmYXVsdFZhbHVlXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd8Kn0gSlNPTi5zdHJpbmdpZnkoeCkgb3IgZGVmYXVsdFZhbHVlXG5cdCAqL1xuXHRmdW5jdGlvbiB0cnlTdHJpbmdpZnkoeCwgZGVmYXVsdFZhbHVlKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh4KTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XG5cdFx0fVxuXHR9XG5cbn0pO1xufSh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUgOiBmdW5jdGlvbihmYWN0b3J5KSB7IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpOyB9KSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi93aGVuL2xpYi9mb3JtYXQuanNcbiAqKiBtb2R1bGUgaWQgPSAyMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE0IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbihmdW5jdGlvbihkZWZpbmUpIHsgJ3VzZSBzdHJpY3QnO1xuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG5cblx0dmFyIG1ha2VQcm9taXNlID0gcmVxdWlyZSgnLi9tYWtlUHJvbWlzZScpO1xuXHR2YXIgU2NoZWR1bGVyID0gcmVxdWlyZSgnLi9TY2hlZHVsZXInKTtcblx0dmFyIGFzeW5jID0gcmVxdWlyZSgnLi9lbnYnKS5hc2FwO1xuXG5cdHJldHVybiBtYWtlUHJvbWlzZSh7XG5cdFx0c2NoZWR1bGVyOiBuZXcgU2NoZWR1bGVyKGFzeW5jKVxuXHR9KTtcblxufSk7XG59KSh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUgOiBmdW5jdGlvbiAoZmFjdG9yeSkgeyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSk7IH0pO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vd2hlbi9saWIvUHJvbWlzZS5qc1xuICoqIG1vZHVsZSBpZCA9IDIxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTQgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuKGZ1bmN0aW9uKGRlZmluZSkgeyAndXNlIHN0cmljdCc7XG5kZWZpbmUoZnVuY3Rpb24oKSB7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIG1ha2VQcm9taXNlKGVudmlyb25tZW50KSB7XG5cblx0XHR2YXIgdGFza3MgPSBlbnZpcm9ubWVudC5zY2hlZHVsZXI7XG5cdFx0dmFyIGVtaXRSZWplY3Rpb24gPSBpbml0RW1pdFJlamVjdGlvbigpO1xuXG5cdFx0dmFyIG9iamVjdENyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHxcblx0XHRcdGZ1bmN0aW9uKHByb3RvKSB7XG5cdFx0XHRcdGZ1bmN0aW9uIENoaWxkKCkge31cblx0XHRcdFx0Q2hpbGQucHJvdG90eXBlID0gcHJvdG87XG5cdFx0XHRcdHJldHVybiBuZXcgQ2hpbGQoKTtcblx0XHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGUgYSBwcm9taXNlIHdob3NlIGZhdGUgaXMgZGV0ZXJtaW5lZCBieSByZXNvbHZlclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlXG5cdFx0ICogQG5hbWUgUHJvbWlzZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIsIGhhbmRsZXIpIHtcblx0XHRcdHRoaXMuX2hhbmRsZXIgPSByZXNvbHZlciA9PT0gSGFuZGxlciA/IGhhbmRsZXIgOiBpbml0KHJlc29sdmVyKTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBSdW4gdGhlIHN1cHBsaWVkIHJlc29sdmVyXG5cdFx0ICogQHBhcmFtIHJlc29sdmVyXG5cdFx0ICogQHJldHVybnMge1BlbmRpbmd9XG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gaW5pdChyZXNvbHZlcikge1xuXHRcdFx0dmFyIGhhbmRsZXIgPSBuZXcgUGVuZGluZygpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXNvbHZlcihwcm9taXNlUmVzb2x2ZSwgcHJvbWlzZVJlamVjdCwgcHJvbWlzZU5vdGlmeSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHByb21pc2VSZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBoYW5kbGVyO1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIFRyYW5zaXRpb24gZnJvbSBwcmUtcmVzb2x1dGlvbiBzdGF0ZSB0byBwb3N0LXJlc29sdXRpb24gc3RhdGUsIG5vdGlmeWluZ1xuXHRcdFx0ICogYWxsIGxpc3RlbmVycyBvZiB0aGUgdWx0aW1hdGUgZnVsZmlsbG1lbnQgb3IgcmVqZWN0aW9uXG5cdFx0XHQgKiBAcGFyYW0geyp9IHggcmVzb2x1dGlvbiB2YWx1ZVxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBwcm9taXNlUmVzb2x2ZSAoeCkge1xuXHRcdFx0XHRoYW5kbGVyLnJlc29sdmUoeCk7XG5cdFx0XHR9XG5cdFx0XHQvKipcblx0XHRcdCAqIFJlamVjdCB0aGlzIHByb21pc2Ugd2l0aCByZWFzb24sIHdoaWNoIHdpbGwgYmUgdXNlZCB2ZXJiYXRpbVxuXHRcdFx0ICogQHBhcmFtIHtFcnJvcnwqfSByZWFzb24gcmVqZWN0aW9uIHJlYXNvbiwgc3Ryb25nbHkgc3VnZ2VzdGVkXG5cdFx0XHQgKiAgIHRvIGJlIGFuIEVycm9yIHR5cGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gcHJvbWlzZVJlamVjdCAocmVhc29uKSB7XG5cdFx0XHRcdGhhbmRsZXIucmVqZWN0KHJlYXNvbik7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQGRlcHJlY2F0ZWRcblx0XHRcdCAqIElzc3VlIGEgcHJvZ3Jlc3MgZXZlbnQsIG5vdGlmeWluZyBhbGwgcHJvZ3Jlc3MgbGlzdGVuZXJzXG5cdFx0XHQgKiBAcGFyYW0geyp9IHggcHJvZ3Jlc3MgZXZlbnQgcGF5bG9hZCB0byBwYXNzIHRvIGFsbCBsaXN0ZW5lcnNcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gcHJvbWlzZU5vdGlmeSAoeCkge1xuXHRcdFx0XHRoYW5kbGVyLm5vdGlmeSh4KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBDcmVhdGlvblxuXG5cdFx0UHJvbWlzZS5yZXNvbHZlID0gcmVzb2x2ZTtcblx0XHRQcm9taXNlLnJlamVjdCA9IHJlamVjdDtcblx0XHRQcm9taXNlLm5ldmVyID0gbmV2ZXI7XG5cblx0XHRQcm9taXNlLl9kZWZlciA9IGRlZmVyO1xuXHRcdFByb21pc2UuX2hhbmRsZXIgPSBnZXRIYW5kbGVyO1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyBhIHRydXN0ZWQgcHJvbWlzZS4gSWYgeCBpcyBhbHJlYWR5IGEgdHJ1c3RlZCBwcm9taXNlLCBpdCBpc1xuXHRcdCAqIHJldHVybmVkLCBvdGhlcndpc2UgcmV0dXJucyBhIG5ldyB0cnVzdGVkIFByb21pc2Ugd2hpY2ggZm9sbG93cyB4LlxuXHRcdCAqIEBwYXJhbSAgeyp9IHhcblx0XHQgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gcmVzb2x2ZSh4KSB7XG5cdFx0XHRyZXR1cm4gaXNQcm9taXNlKHgpID8geFxuXHRcdFx0XHQ6IG5ldyBQcm9taXNlKEhhbmRsZXIsIG5ldyBBc3luYyhnZXRIYW5kbGVyKHgpKSk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJuIGEgcmVqZWN0IHByb21pc2Ugd2l0aCB4IGFzIGl0cyByZWFzb24gKHggaXMgdXNlZCB2ZXJiYXRpbSlcblx0XHQgKiBAcGFyYW0geyp9IHhcblx0XHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gcmVqZWN0ZWQgcHJvbWlzZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIHJlamVjdCh4KSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoSGFuZGxlciwgbmV3IEFzeW5jKG5ldyBSZWplY3RlZCh4KSkpO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybiBhIHByb21pc2UgdGhhdCByZW1haW5zIHBlbmRpbmcgZm9yZXZlclxuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlfSBmb3JldmVyLXBlbmRpbmcgcHJvbWlzZS5cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBuZXZlcigpIHtcblx0XHRcdHJldHVybiBmb3JldmVyUGVuZGluZ1Byb21pc2U7IC8vIFNob3VsZCBiZSBmcm96ZW5cblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGVzIGFuIGludGVybmFsIHtwcm9taXNlLCByZXNvbHZlcn0gcGFpclxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gZGVmZXIoKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoSGFuZGxlciwgbmV3IFBlbmRpbmcoKSk7XG5cdFx0fVxuXG5cdFx0Ly8gVHJhbnNmb3JtYXRpb24gYW5kIGZsb3cgY29udHJvbFxuXG5cdFx0LyoqXG5cdFx0ICogVHJhbnNmb3JtIHRoaXMgcHJvbWlzZSdzIGZ1bGZpbGxtZW50IHZhbHVlLCByZXR1cm5pbmcgYSBuZXcgUHJvbWlzZVxuXHRcdCAqIGZvciB0aGUgdHJhbnNmb3JtZWQgcmVzdWx0LiAgSWYgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZCwgb25SZWplY3RlZFxuXHRcdCAqIGlzIGNhbGxlZCB3aXRoIHRoZSByZWFzb24uICBvblByb2dyZXNzICptYXkqIGJlIGNhbGxlZCB3aXRoIHVwZGF0ZXMgdG93YXJkXG5cdFx0ICogdGhpcyBwcm9taXNlJ3MgZnVsZmlsbG1lbnQuXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbj19IG9uRnVsZmlsbGVkIGZ1bGZpbGxtZW50IGhhbmRsZXJcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gb25SZWplY3RlZCByZWplY3Rpb24gaGFuZGxlclxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb249fSBvblByb2dyZXNzIEBkZXByZWNhdGVkIHByb2dyZXNzIGhhbmRsZXJcblx0XHQgKiBAcmV0dXJuIHtQcm9taXNlfSBuZXcgcHJvbWlzZVxuXHRcdCAqL1xuXHRcdFByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcykge1xuXHRcdFx0dmFyIHBhcmVudCA9IHRoaXMuX2hhbmRsZXI7XG5cdFx0XHR2YXIgc3RhdGUgPSBwYXJlbnQuam9pbigpLnN0YXRlKCk7XG5cblx0XHRcdGlmICgodHlwZW9mIG9uRnVsZmlsbGVkICE9PSAnZnVuY3Rpb24nICYmIHN0YXRlID4gMCkgfHxcblx0XHRcdFx0KHR5cGVvZiBvblJlamVjdGVkICE9PSAnZnVuY3Rpb24nICYmIHN0YXRlIDwgMCkpIHtcblx0XHRcdFx0Ly8gU2hvcnQgY2lyY3VpdDogdmFsdWUgd2lsbCBub3QgY2hhbmdlLCBzaW1wbHkgc2hhcmUgaGFuZGxlclxuXHRcdFx0XHRyZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IoSGFuZGxlciwgcGFyZW50KTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHAgPSB0aGlzLl9iZWdldCgpO1xuXHRcdFx0dmFyIGNoaWxkID0gcC5faGFuZGxlcjtcblxuXHRcdFx0cGFyZW50LmNoYWluKGNoaWxkLCBwYXJlbnQucmVjZWl2ZXIsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCBvblByb2dyZXNzKTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIElmIHRoaXMgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkIGR1ZSB0byBhbiBlcnJvciwgY2FsbCBvblJlamVjdGVkIHRvXG5cdFx0ICogaGFuZGxlIHRoZSBlcnJvci4gU2hvcnRjdXQgZm9yIC50aGVuKHVuZGVmaW5lZCwgb25SZWplY3RlZClcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9uP30gb25SZWplY3RlZFxuXHRcdCAqIEByZXR1cm4ge1Byb21pc2V9XG5cdFx0ICovXG5cdFx0UHJvbWlzZS5wcm90b3R5cGVbJ2NhdGNoJ10gPSBmdW5jdGlvbihvblJlamVjdGVkKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgb25SZWplY3RlZCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIENyZWF0ZXMgYSBuZXcsIHBlbmRpbmcgcHJvbWlzZSBvZiB0aGUgc2FtZSB0eXBlIGFzIHRoaXMgcHJvbWlzZVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdFx0ICovXG5cdFx0UHJvbWlzZS5wcm90b3R5cGUuX2JlZ2V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gYmVnZXRGcm9tKHRoaXMuX2hhbmRsZXIsIHRoaXMuY29uc3RydWN0b3IpO1xuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBiZWdldEZyb20ocGFyZW50LCBQcm9taXNlKSB7XG5cdFx0XHR2YXIgY2hpbGQgPSBuZXcgUGVuZGluZyhwYXJlbnQucmVjZWl2ZXIsIHBhcmVudC5qb2luKCkuY29udGV4dCk7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoSGFuZGxlciwgY2hpbGQpO1xuXHRcdH1cblxuXHRcdC8vIEFycmF5IGNvbWJpbmF0b3JzXG5cblx0XHRQcm9taXNlLmFsbCA9IGFsbDtcblx0XHRQcm9taXNlLnJhY2UgPSByYWNlO1xuXHRcdFByb21pc2UuX3RyYXZlcnNlID0gdHJhdmVyc2U7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCBmdWxmaWxsIHdoZW4gYWxsIHByb21pc2VzIGluIHRoZVxuXHRcdCAqIGlucHV0IGFycmF5IGhhdmUgZnVsZmlsbGVkLCBvciB3aWxsIHJlamVjdCB3aGVuIG9uZSBvZiB0aGVcblx0XHQgKiBwcm9taXNlcyByZWplY3RzLlxuXHRcdCAqIEBwYXJhbSB7YXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgZm9yIGFycmF5IG9mIGZ1bGZpbGxtZW50IHZhbHVlc1xuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuXHRcdFx0cmV0dXJuIHRyYXZlcnNlV2l0aChzbmQsIG51bGwsIHByb21pc2VzKTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBBcnJheTxQcm9taXNlPFg+PiAtPiBQcm9taXNlPEFycmF5PGYoWCk+PlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gZiBmdW5jdGlvbiB0byBhcHBseSB0byBlYWNoIHByb21pc2UncyB2YWx1ZVxuXHRcdCAqIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgZm9yIHRyYW5zZm9ybWVkIHZhbHVlc1xuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIHRyYXZlcnNlKGYsIHByb21pc2VzKSB7XG5cdFx0XHRyZXR1cm4gdHJhdmVyc2VXaXRoKHRyeUNhdGNoMiwgZiwgcHJvbWlzZXMpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyYXZlcnNlV2l0aCh0cnlNYXAsIGYsIHByb21pc2VzKSB7XG5cdFx0XHR2YXIgaGFuZGxlciA9IHR5cGVvZiBmID09PSAnZnVuY3Rpb24nID8gbWFwQXQgOiBzZXR0bGVBdDtcblxuXHRcdFx0dmFyIHJlc29sdmVyID0gbmV3IFBlbmRpbmcoKTtcblx0XHRcdHZhciBwZW5kaW5nID0gcHJvbWlzZXMubGVuZ3RoID4+PiAwO1xuXHRcdFx0dmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkocGVuZGluZyk7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwLCB4OyBpIDwgcHJvbWlzZXMubGVuZ3RoICYmICFyZXNvbHZlci5yZXNvbHZlZDsgKytpKSB7XG5cdFx0XHRcdHggPSBwcm9taXNlc1tpXTtcblxuXHRcdFx0XHRpZiAoeCA9PT0gdm9pZCAwICYmICEoaSBpbiBwcm9taXNlcykpIHtcblx0XHRcdFx0XHQtLXBlbmRpbmc7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0cmF2ZXJzZUF0KHByb21pc2VzLCBoYW5kbGVyLCBpLCB4LCByZXNvbHZlcik7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHBlbmRpbmcgPT09IDApIHtcblx0XHRcdFx0cmVzb2x2ZXIuYmVjb21lKG5ldyBGdWxmaWxsZWQocmVzdWx0cykpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoSGFuZGxlciwgcmVzb2x2ZXIpO1xuXG5cdFx0XHRmdW5jdGlvbiBtYXBBdChpLCB4LCByZXNvbHZlcikge1xuXHRcdFx0XHRpZighcmVzb2x2ZXIucmVzb2x2ZWQpIHtcblx0XHRcdFx0XHR0cmF2ZXJzZUF0KHByb21pc2VzLCBzZXR0bGVBdCwgaSwgdHJ5TWFwKGYsIHgsIGkpLCByZXNvbHZlcik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gc2V0dGxlQXQoaSwgeCwgcmVzb2x2ZXIpIHtcblx0XHRcdFx0cmVzdWx0c1tpXSA9IHg7XG5cdFx0XHRcdGlmKC0tcGVuZGluZyA9PT0gMCkge1xuXHRcdFx0XHRcdHJlc29sdmVyLmJlY29tZShuZXcgRnVsZmlsbGVkKHJlc3VsdHMpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyYXZlcnNlQXQocHJvbWlzZXMsIGhhbmRsZXIsIGksIHgsIHJlc29sdmVyKSB7XG5cdFx0XHRpZiAobWF5YmVUaGVuYWJsZSh4KSkge1xuXHRcdFx0XHR2YXIgaCA9IGdldEhhbmRsZXJNYXliZVRoZW5hYmxlKHgpO1xuXHRcdFx0XHR2YXIgcyA9IGguc3RhdGUoKTtcblxuXHRcdFx0XHRpZiAocyA9PT0gMCkge1xuXHRcdFx0XHRcdGguZm9sZChoYW5kbGVyLCBpLCB2b2lkIDAsIHJlc29sdmVyKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzID4gMCkge1xuXHRcdFx0XHRcdGhhbmRsZXIoaSwgaC52YWx1ZSwgcmVzb2x2ZXIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlc29sdmVyLmJlY29tZShoKTtcblx0XHRcdFx0XHR2aXNpdFJlbWFpbmluZyhwcm9taXNlcywgaSsxLCBoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aGFuZGxlcihpLCB4LCByZXNvbHZlcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0UHJvbWlzZS5fdmlzaXRSZW1haW5pbmcgPSB2aXNpdFJlbWFpbmluZztcblx0XHRmdW5jdGlvbiB2aXNpdFJlbWFpbmluZyhwcm9taXNlcywgc3RhcnQsIGhhbmRsZXIpIHtcblx0XHRcdGZvcih2YXIgaT1zdGFydDsgaTxwcm9taXNlcy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRtYXJrQXNIYW5kbGVkKGdldEhhbmRsZXIocHJvbWlzZXNbaV0pLCBoYW5kbGVyKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYXJrQXNIYW5kbGVkKGgsIGhhbmRsZXIpIHtcblx0XHRcdGlmKGggPT09IGhhbmRsZXIpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcyA9IGguc3RhdGUoKTtcblx0XHRcdGlmKHMgPT09IDApIHtcblx0XHRcdFx0aC52aXNpdChoLCB2b2lkIDAsIGguX3VucmVwb3J0KTtcblx0XHRcdH0gZWxzZSBpZihzIDwgMCkge1xuXHRcdFx0XHRoLl91bnJlcG9ydCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEZ1bGZpbGwtcmVqZWN0IGNvbXBldGl0aXZlIHJhY2UuIFJldHVybiBhIHByb21pc2UgdGhhdCB3aWxsIHNldHRsZVxuXHRcdCAqIHRvIHRoZSBzYW1lIHN0YXRlIGFzIHRoZSBlYXJsaWVzdCBpbnB1dCBwcm9taXNlIHRvIHNldHRsZS5cblx0XHQgKlxuXHRcdCAqIFdBUk5JTkc6IFRoZSBFUzYgUHJvbWlzZSBzcGVjIHJlcXVpcmVzIHRoYXQgcmFjZSgpaW5nIGFuIGVtcHR5IGFycmF5XG5cdFx0ICogbXVzdCByZXR1cm4gYSBwcm9taXNlIHRoYXQgaXMgcGVuZGluZyBmb3JldmVyLiAgVGhpcyBpbXBsZW1lbnRhdGlvblxuXHRcdCAqIHJldHVybnMgYSBzaW5nbGV0b24gZm9yZXZlci1wZW5kaW5nIHByb21pc2UsIHRoZSBzYW1lIHNpbmdsZXRvbiB0aGF0IGlzXG5cdFx0ICogcmV0dXJuZWQgYnkgUHJvbWlzZS5uZXZlcigpLCB0aHVzIGNhbiBiZSBjaGVja2VkIHdpdGggPT09XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2FycmF5fSBwcm9taXNlcyBhcnJheSBvZiBwcm9taXNlcyB0byByYWNlXG5cdFx0ICogQHJldHVybnMge1Byb21pc2V9IGlmIGlucHV0IGlzIG5vbi1lbXB0eSwgYSBwcm9taXNlIHRoYXQgd2lsbCBzZXR0bGVcblx0XHQgKiB0byB0aGUgc2FtZSBvdXRjb21lIGFzIHRoZSBlYXJsaWVzdCBpbnB1dCBwcm9taXNlIHRvIHNldHRsZS4gaWYgZW1wdHlcblx0XHQgKiBpcyBlbXB0eSwgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIG5ldmVyIHNldHRsZS5cblx0XHQgKi9cblx0XHRmdW5jdGlvbiByYWNlKHByb21pc2VzKSB7XG5cdFx0XHRpZih0eXBlb2YgcHJvbWlzZXMgIT09ICdvYmplY3QnIHx8IHByb21pc2VzID09PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QobmV3IFR5cGVFcnJvcignbm9uLWl0ZXJhYmxlIHBhc3NlZCB0byByYWNlKCknKSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFNpZ2gsIHJhY2UoW10pIGlzIHVudGVzdGFibGUgdW5sZXNzIHdlIHJldHVybiAqc29tZXRoaW5nKlxuXHRcdFx0Ly8gdGhhdCBpcyByZWNvZ25pemFibGUgd2l0aG91dCBjYWxsaW5nIC50aGVuKCkgb24gaXQuXG5cdFx0XHRyZXR1cm4gcHJvbWlzZXMubGVuZ3RoID09PSAwID8gbmV2ZXIoKVxuXHRcdFx0XHQgOiBwcm9taXNlcy5sZW5ndGggPT09IDEgPyByZXNvbHZlKHByb21pc2VzWzBdKVxuXHRcdFx0XHQgOiBydW5SYWNlKHByb21pc2VzKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBydW5SYWNlKHByb21pc2VzKSB7XG5cdFx0XHR2YXIgcmVzb2x2ZXIgPSBuZXcgUGVuZGluZygpO1xuXHRcdFx0dmFyIGksIHgsIGg7XG5cdFx0XHRmb3IoaT0wOyBpPHByb21pc2VzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdHggPSBwcm9taXNlc1tpXTtcblx0XHRcdFx0aWYgKHggPT09IHZvaWQgMCAmJiAhKGkgaW4gcHJvbWlzZXMpKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRoID0gZ2V0SGFuZGxlcih4KTtcblx0XHRcdFx0aWYoaC5zdGF0ZSgpICE9PSAwKSB7XG5cdFx0XHRcdFx0cmVzb2x2ZXIuYmVjb21lKGgpO1xuXHRcdFx0XHRcdHZpc2l0UmVtYWluaW5nKHByb21pc2VzLCBpKzEsIGgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGgudmlzaXQocmVzb2x2ZXIsIHJlc29sdmVyLnJlc29sdmUsIHJlc29sdmVyLnJlamVjdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShIYW5kbGVyLCByZXNvbHZlcik7XG5cdFx0fVxuXG5cdFx0Ly8gUHJvbWlzZSBpbnRlcm5hbHNcblx0XHQvLyBCZWxvdyB0aGlzLCBldmVyeXRoaW5nIGlzIEBwcml2YXRlXG5cblx0XHQvKipcblx0XHQgKiBHZXQgYW4gYXBwcm9wcmlhdGUgaGFuZGxlciBmb3IgeCwgd2l0aG91dCBjaGVja2luZyBmb3IgY3ljbGVzXG5cdFx0ICogQHBhcmFtIHsqfSB4XG5cdFx0ICogQHJldHVybnMge29iamVjdH0gaGFuZGxlclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGdldEhhbmRsZXIoeCkge1xuXHRcdFx0aWYoaXNQcm9taXNlKHgpKSB7XG5cdFx0XHRcdHJldHVybiB4Ll9oYW5kbGVyLmpvaW4oKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtYXliZVRoZW5hYmxlKHgpID8gZ2V0SGFuZGxlclVudHJ1c3RlZCh4KSA6IG5ldyBGdWxmaWxsZWQoeCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IGEgaGFuZGxlciBmb3IgdGhlbmFibGUgeC5cblx0XHQgKiBOT1RFOiBZb3UgbXVzdCBvbmx5IGNhbGwgdGhpcyBpZiBtYXliZVRoZW5hYmxlKHgpID09IHRydWVcblx0XHQgKiBAcGFyYW0ge29iamVjdHxmdW5jdGlvbnxQcm9taXNlfSB4XG5cdFx0ICogQHJldHVybnMge29iamVjdH0gaGFuZGxlclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGdldEhhbmRsZXJNYXliZVRoZW5hYmxlKHgpIHtcblx0XHRcdHJldHVybiBpc1Byb21pc2UoeCkgPyB4Ll9oYW5kbGVyLmpvaW4oKSA6IGdldEhhbmRsZXJVbnRydXN0ZWQoeCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IGEgaGFuZGxlciBmb3IgcG90ZW50aWFsbHkgdW50cnVzdGVkIHRoZW5hYmxlIHhcblx0XHQgKiBAcGFyYW0geyp9IHhcblx0XHQgKiBAcmV0dXJucyB7b2JqZWN0fSBoYW5kbGVyXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gZ2V0SGFuZGxlclVudHJ1c3RlZCh4KSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR2YXIgdW50cnVzdGVkVGhlbiA9IHgudGhlbjtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiB1bnRydXN0ZWRUaGVuID09PSAnZnVuY3Rpb24nXG5cdFx0XHRcdFx0PyBuZXcgVGhlbmFibGUodW50cnVzdGVkVGhlbiwgeClcblx0XHRcdFx0XHQ6IG5ldyBGdWxmaWxsZWQoeCk7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBSZWplY3RlZChlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBIYW5kbGVyIGZvciBhIHByb21pc2UgdGhhdCBpcyBwZW5kaW5nIGZvcmV2ZXJcblx0XHQgKiBAY29uc3RydWN0b3Jcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBIYW5kbGVyKCkge31cblxuXHRcdEhhbmRsZXIucHJvdG90eXBlLndoZW5cblx0XHRcdD0gSGFuZGxlci5wcm90b3R5cGUuYmVjb21lXG5cdFx0XHQ9IEhhbmRsZXIucHJvdG90eXBlLm5vdGlmeSAvLyBkZXByZWNhdGVkXG5cdFx0XHQ9IEhhbmRsZXIucHJvdG90eXBlLmZhaWxcblx0XHRcdD0gSGFuZGxlci5wcm90b3R5cGUuX3VucmVwb3J0XG5cdFx0XHQ9IEhhbmRsZXIucHJvdG90eXBlLl9yZXBvcnRcblx0XHRcdD0gbm9vcDtcblxuXHRcdEhhbmRsZXIucHJvdG90eXBlLl9zdGF0ZSA9IDA7XG5cblx0XHRIYW5kbGVyLnByb3RvdHlwZS5zdGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3N0YXRlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZWN1cnNpdmVseSBjb2xsYXBzZSBoYW5kbGVyIGNoYWluIHRvIGZpbmQgdGhlIGhhbmRsZXJcblx0XHQgKiBuZWFyZXN0IHRvIHRoZSBmdWxseSByZXNvbHZlZCB2YWx1ZS5cblx0XHQgKiBAcmV0dXJucyB7b2JqZWN0fSBoYW5kbGVyIG5lYXJlc3QgdGhlIGZ1bGx5IHJlc29sdmVkIHZhbHVlXG5cdFx0ICovXG5cdFx0SGFuZGxlci5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGggPSB0aGlzO1xuXHRcdFx0d2hpbGUoaC5oYW5kbGVyICE9PSB2b2lkIDApIHtcblx0XHRcdFx0aCA9IGguaGFuZGxlcjtcblx0XHRcdH1cblx0XHRcdHJldHVybiBoO1xuXHRcdH07XG5cblx0XHRIYW5kbGVyLnByb3RvdHlwZS5jaGFpbiA9IGZ1bmN0aW9uKHRvLCByZWNlaXZlciwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcblx0XHRcdHRoaXMud2hlbih7XG5cdFx0XHRcdHJlc29sdmVyOiB0byxcblx0XHRcdFx0cmVjZWl2ZXI6IHJlY2VpdmVyLFxuXHRcdFx0XHRmdWxmaWxsZWQ6IGZ1bGZpbGxlZCxcblx0XHRcdFx0cmVqZWN0ZWQ6IHJlamVjdGVkLFxuXHRcdFx0XHRwcm9ncmVzczogcHJvZ3Jlc3Ncblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRIYW5kbGVyLnByb3RvdHlwZS52aXNpdCA9IGZ1bmN0aW9uKHJlY2VpdmVyLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuXHRcdFx0dGhpcy5jaGFpbihmYWlsSWZSZWplY3RlZCwgcmVjZWl2ZXIsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcblx0XHR9O1xuXG5cdFx0SGFuZGxlci5wcm90b3R5cGUuZm9sZCA9IGZ1bmN0aW9uKGYsIHosIGMsIHRvKSB7XG5cdFx0XHR0aGlzLndoZW4obmV3IEZvbGQoZiwgeiwgYywgdG8pKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciB0aGF0IGludm9rZXMgZmFpbCgpIG9uIGFueSBoYW5kbGVyIGl0IGJlY29tZXNcblx0XHQgKiBAY29uc3RydWN0b3Jcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBGYWlsSWZSZWplY3RlZCgpIHt9XG5cblx0XHRpbmhlcml0KEhhbmRsZXIsIEZhaWxJZlJlamVjdGVkKTtcblxuXHRcdEZhaWxJZlJlamVjdGVkLnByb3RvdHlwZS5iZWNvbWUgPSBmdW5jdGlvbihoKSB7XG5cdFx0XHRoLmZhaWwoKTtcblx0XHR9O1xuXG5cdFx0dmFyIGZhaWxJZlJlamVjdGVkID0gbmV3IEZhaWxJZlJlamVjdGVkKCk7XG5cblx0XHQvKipcblx0XHQgKiBIYW5kbGVyIHRoYXQgbWFuYWdlcyBhIHF1ZXVlIG9mIGNvbnN1bWVycyB3YWl0aW5nIG9uIGEgcGVuZGluZyBwcm9taXNlXG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gUGVuZGluZyhyZWNlaXZlciwgaW5oZXJpdGVkQ29udGV4dCkge1xuXHRcdFx0UHJvbWlzZS5jcmVhdGVDb250ZXh0KHRoaXMsIGluaGVyaXRlZENvbnRleHQpO1xuXG5cdFx0XHR0aGlzLmNvbnN1bWVycyA9IHZvaWQgMDtcblx0XHRcdHRoaXMucmVjZWl2ZXIgPSByZWNlaXZlcjtcblx0XHRcdHRoaXMuaGFuZGxlciA9IHZvaWQgMDtcblx0XHRcdHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcblx0XHR9XG5cblx0XHRpbmhlcml0KEhhbmRsZXIsIFBlbmRpbmcpO1xuXG5cdFx0UGVuZGluZy5wcm90b3R5cGUuX3N0YXRlID0gMDtcblxuXHRcdFBlbmRpbmcucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbih4KSB7XG5cdFx0XHR0aGlzLmJlY29tZShnZXRIYW5kbGVyKHgpKTtcblx0XHR9O1xuXG5cdFx0UGVuZGluZy5wcm90b3R5cGUucmVqZWN0ID0gZnVuY3Rpb24oeCkge1xuXHRcdFx0aWYodGhpcy5yZXNvbHZlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuYmVjb21lKG5ldyBSZWplY3RlZCh4KSk7XG5cdFx0fTtcblxuXHRcdFBlbmRpbmcucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICghdGhpcy5yZXNvbHZlZCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH1cblxuXHRcdFx0dmFyIGggPSB0aGlzO1xuXG5cdFx0XHR3aGlsZSAoaC5oYW5kbGVyICE9PSB2b2lkIDApIHtcblx0XHRcdFx0aCA9IGguaGFuZGxlcjtcblx0XHRcdFx0aWYgKGggPT09IHRoaXMpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5oYW5kbGVyID0gY3ljbGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gaDtcblx0XHR9O1xuXG5cdFx0UGVuZGluZy5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcSA9IHRoaXMuY29uc3VtZXJzO1xuXHRcdFx0dmFyIGhhbmRsZXIgPSB0aGlzLmhhbmRsZXI7XG5cdFx0XHR0aGlzLmhhbmRsZXIgPSB0aGlzLmhhbmRsZXIuam9pbigpO1xuXHRcdFx0dGhpcy5jb25zdW1lcnMgPSB2b2lkIDA7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcS5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRoYW5kbGVyLndoZW4ocVtpXSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdFBlbmRpbmcucHJvdG90eXBlLmJlY29tZSA9IGZ1bmN0aW9uKGhhbmRsZXIpIHtcblx0XHRcdGlmKHRoaXMucmVzb2x2ZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJlc29sdmVkID0gdHJ1ZTtcblx0XHRcdHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG5cdFx0XHRpZih0aGlzLmNvbnN1bWVycyAhPT0gdm9pZCAwKSB7XG5cdFx0XHRcdHRhc2tzLmVucXVldWUodGhpcyk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHRoaXMuY29udGV4dCAhPT0gdm9pZCAwKSB7XG5cdFx0XHRcdGhhbmRsZXIuX3JlcG9ydCh0aGlzLmNvbnRleHQpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRQZW5kaW5nLnByb3RvdHlwZS53aGVuID0gZnVuY3Rpb24oY29udGludWF0aW9uKSB7XG5cdFx0XHRpZih0aGlzLnJlc29sdmVkKSB7XG5cdFx0XHRcdHRhc2tzLmVucXVldWUobmV3IENvbnRpbnVhdGlvblRhc2soY29udGludWF0aW9uLCB0aGlzLmhhbmRsZXIpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmKHRoaXMuY29uc3VtZXJzID09PSB2b2lkIDApIHtcblx0XHRcdFx0XHR0aGlzLmNvbnN1bWVycyA9IFtjb250aW51YXRpb25dO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuY29uc3VtZXJzLnB1c2goY29udGludWF0aW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBAZGVwcmVjYXRlZFxuXHRcdCAqL1xuXHRcdFBlbmRpbmcucHJvdG90eXBlLm5vdGlmeSA9IGZ1bmN0aW9uKHgpIHtcblx0XHRcdGlmKCF0aGlzLnJlc29sdmVkKSB7XG5cdFx0XHRcdHRhc2tzLmVucXVldWUobmV3IFByb2dyZXNzVGFzayh4LCB0aGlzKSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdFBlbmRpbmcucHJvdG90eXBlLmZhaWwgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdFx0XHR2YXIgYyA9IHR5cGVvZiBjb250ZXh0ID09PSAndW5kZWZpbmVkJyA/IHRoaXMuY29udGV4dCA6IGNvbnRleHQ7XG5cdFx0XHR0aGlzLnJlc29sdmVkICYmIHRoaXMuaGFuZGxlci5qb2luKCkuZmFpbChjKTtcblx0XHR9O1xuXG5cdFx0UGVuZGluZy5wcm90b3R5cGUuX3JlcG9ydCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcblx0XHRcdHRoaXMucmVzb2x2ZWQgJiYgdGhpcy5oYW5kbGVyLmpvaW4oKS5fcmVwb3J0KGNvbnRleHQpO1xuXHRcdH07XG5cblx0XHRQZW5kaW5nLnByb3RvdHlwZS5fdW5yZXBvcnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucmVzb2x2ZWQgJiYgdGhpcy5oYW5kbGVyLmpvaW4oKS5fdW5yZXBvcnQoKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogV3JhcCBhbm90aGVyIGhhbmRsZXIgYW5kIGZvcmNlIGl0IGludG8gYSBmdXR1cmUgc3RhY2tcblx0XHQgKiBAcGFyYW0ge29iamVjdH0gaGFuZGxlclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIEFzeW5jKGhhbmRsZXIpIHtcblx0XHRcdHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG5cdFx0fVxuXG5cdFx0aW5oZXJpdChIYW5kbGVyLCBBc3luYyk7XG5cblx0XHRBc3luYy5wcm90b3R5cGUud2hlbiA9IGZ1bmN0aW9uKGNvbnRpbnVhdGlvbikge1xuXHRcdFx0dGFza3MuZW5xdWV1ZShuZXcgQ29udGludWF0aW9uVGFzayhjb250aW51YXRpb24sIHRoaXMpKTtcblx0XHR9O1xuXG5cdFx0QXN5bmMucHJvdG90eXBlLl9yZXBvcnQgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdFx0XHR0aGlzLmpvaW4oKS5fcmVwb3J0KGNvbnRleHQpO1xuXHRcdH07XG5cblx0XHRBc3luYy5wcm90b3R5cGUuX3VucmVwb3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmpvaW4oKS5fdW5yZXBvcnQoKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciB0aGF0IHdyYXBzIGFuIHVudHJ1c3RlZCB0aGVuYWJsZSBhbmQgYXNzaW1pbGF0ZXMgaXQgaW4gYSBmdXR1cmUgc3RhY2tcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVuXG5cdFx0ICogQHBhcmFtIHt7dGhlbjogZnVuY3Rpb259fSB0aGVuYWJsZVxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIFRoZW5hYmxlKHRoZW4sIHRoZW5hYmxlKSB7XG5cdFx0XHRQZW5kaW5nLmNhbGwodGhpcyk7XG5cdFx0XHR0YXNrcy5lbnF1ZXVlKG5ldyBBc3NpbWlsYXRlVGFzayh0aGVuLCB0aGVuYWJsZSwgdGhpcykpO1xuXHRcdH1cblxuXHRcdGluaGVyaXQoUGVuZGluZywgVGhlbmFibGUpO1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciBmb3IgYSBmdWxmaWxsZWQgcHJvbWlzZVxuXHRcdCAqIEBwYXJhbSB7Kn0geCBmdWxmaWxsbWVudCB2YWx1ZVxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIEZ1bGZpbGxlZCh4KSB7XG5cdFx0XHRQcm9taXNlLmNyZWF0ZUNvbnRleHQodGhpcyk7XG5cdFx0XHR0aGlzLnZhbHVlID0geDtcblx0XHR9XG5cblx0XHRpbmhlcml0KEhhbmRsZXIsIEZ1bGZpbGxlZCk7XG5cblx0XHRGdWxmaWxsZWQucHJvdG90eXBlLl9zdGF0ZSA9IDE7XG5cblx0XHRGdWxmaWxsZWQucHJvdG90eXBlLmZvbGQgPSBmdW5jdGlvbihmLCB6LCBjLCB0bykge1xuXHRcdFx0cnVuQ29udGludWF0aW9uMyhmLCB6LCB0aGlzLCBjLCB0byk7XG5cdFx0fTtcblxuXHRcdEZ1bGZpbGxlZC5wcm90b3R5cGUud2hlbiA9IGZ1bmN0aW9uKGNvbnQpIHtcblx0XHRcdHJ1bkNvbnRpbnVhdGlvbjEoY29udC5mdWxmaWxsZWQsIHRoaXMsIGNvbnQucmVjZWl2ZXIsIGNvbnQucmVzb2x2ZXIpO1xuXHRcdH07XG5cblx0XHR2YXIgZXJyb3JJZCA9IDA7XG5cblx0XHQvKipcblx0XHQgKiBIYW5kbGVyIGZvciBhIHJlamVjdGVkIHByb21pc2Vcblx0XHQgKiBAcGFyYW0geyp9IHggcmVqZWN0aW9uIHJlYXNvblxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIFJlamVjdGVkKHgpIHtcblx0XHRcdFByb21pc2UuY3JlYXRlQ29udGV4dCh0aGlzKTtcblxuXHRcdFx0dGhpcy5pZCA9ICsrZXJyb3JJZDtcblx0XHRcdHRoaXMudmFsdWUgPSB4O1xuXHRcdFx0dGhpcy5oYW5kbGVkID0gZmFsc2U7XG5cdFx0XHR0aGlzLnJlcG9ydGVkID0gZmFsc2U7XG5cblx0XHRcdHRoaXMuX3JlcG9ydCgpO1xuXHRcdH1cblxuXHRcdGluaGVyaXQoSGFuZGxlciwgUmVqZWN0ZWQpO1xuXG5cdFx0UmVqZWN0ZWQucHJvdG90eXBlLl9zdGF0ZSA9IC0xO1xuXG5cdFx0UmVqZWN0ZWQucHJvdG90eXBlLmZvbGQgPSBmdW5jdGlvbihmLCB6LCBjLCB0bykge1xuXHRcdFx0dG8uYmVjb21lKHRoaXMpO1xuXHRcdH07XG5cblx0XHRSZWplY3RlZC5wcm90b3R5cGUud2hlbiA9IGZ1bmN0aW9uKGNvbnQpIHtcblx0XHRcdGlmKHR5cGVvZiBjb250LnJlamVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHRoaXMuX3VucmVwb3J0KCk7XG5cdFx0XHR9XG5cdFx0XHRydW5Db250aW51YXRpb24xKGNvbnQucmVqZWN0ZWQsIHRoaXMsIGNvbnQucmVjZWl2ZXIsIGNvbnQucmVzb2x2ZXIpO1xuXHRcdH07XG5cblx0XHRSZWplY3RlZC5wcm90b3R5cGUuX3JlcG9ydCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcblx0XHRcdHRhc2tzLmFmdGVyUXVldWUobmV3IFJlcG9ydFRhc2sodGhpcywgY29udGV4dCkpO1xuXHRcdH07XG5cblx0XHRSZWplY3RlZC5wcm90b3R5cGUuX3VucmVwb3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZih0aGlzLmhhbmRsZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5oYW5kbGVkID0gdHJ1ZTtcblx0XHRcdHRhc2tzLmFmdGVyUXVldWUobmV3IFVucmVwb3J0VGFzayh0aGlzKSk7XG5cdFx0fTtcblxuXHRcdFJlamVjdGVkLnByb3RvdHlwZS5mYWlsID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRcdFx0dGhpcy5yZXBvcnRlZCA9IHRydWU7XG5cdFx0XHRlbWl0UmVqZWN0aW9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCB0aGlzKTtcblx0XHRcdFByb21pc2Uub25GYXRhbFJlamVjdGlvbih0aGlzLCBjb250ZXh0ID09PSB2b2lkIDAgPyB0aGlzLmNvbnRleHQgOiBjb250ZXh0KTtcblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gUmVwb3J0VGFzayhyZWplY3Rpb24sIGNvbnRleHQpIHtcblx0XHRcdHRoaXMucmVqZWN0aW9uID0gcmVqZWN0aW9uO1xuXHRcdFx0dGhpcy5jb250ZXh0ID0gY29udGV4dDtcblx0XHR9XG5cblx0XHRSZXBvcnRUYXNrLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmKCF0aGlzLnJlamVjdGlvbi5oYW5kbGVkICYmICF0aGlzLnJlamVjdGlvbi5yZXBvcnRlZCkge1xuXHRcdFx0XHR0aGlzLnJlamVjdGlvbi5yZXBvcnRlZCA9IHRydWU7XG5cdFx0XHRcdGVtaXRSZWplY3Rpb24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIHRoaXMucmVqZWN0aW9uKSB8fFxuXHRcdFx0XHRcdFByb21pc2Uub25Qb3RlbnRpYWxseVVuaGFuZGxlZFJlamVjdGlvbih0aGlzLnJlamVjdGlvbiwgdGhpcy5jb250ZXh0KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gVW5yZXBvcnRUYXNrKHJlamVjdGlvbikge1xuXHRcdFx0dGhpcy5yZWplY3Rpb24gPSByZWplY3Rpb247XG5cdFx0fVxuXG5cdFx0VW5yZXBvcnRUYXNrLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmKHRoaXMucmVqZWN0aW9uLnJlcG9ydGVkKSB7XG5cdFx0XHRcdGVtaXRSZWplY3Rpb24oJ3JlamVjdGlvbkhhbmRsZWQnLCB0aGlzLnJlamVjdGlvbikgfHxcblx0XHRcdFx0XHRQcm9taXNlLm9uUG90ZW50aWFsbHlVbmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkKHRoaXMucmVqZWN0aW9uKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gVW5oYW5kbGVkIHJlamVjdGlvbiBob29rc1xuXHRcdC8vIEJ5IGRlZmF1bHQsIGV2ZXJ5dGhpbmcgaXMgYSBub29wXG5cblx0XHRQcm9taXNlLmNyZWF0ZUNvbnRleHRcblx0XHRcdD0gUHJvbWlzZS5lbnRlckNvbnRleHRcblx0XHRcdD0gUHJvbWlzZS5leGl0Q29udGV4dFxuXHRcdFx0PSBQcm9taXNlLm9uUG90ZW50aWFsbHlVbmhhbmRsZWRSZWplY3Rpb25cblx0XHRcdD0gUHJvbWlzZS5vblBvdGVudGlhbGx5VW5oYW5kbGVkUmVqZWN0aW9uSGFuZGxlZFxuXHRcdFx0PSBQcm9taXNlLm9uRmF0YWxSZWplY3Rpb25cblx0XHRcdD0gbm9vcDtcblxuXHRcdC8vIEVycm9ycyBhbmQgc2luZ2xldG9uc1xuXG5cdFx0dmFyIGZvcmV2ZXJQZW5kaW5nSGFuZGxlciA9IG5ldyBIYW5kbGVyKCk7XG5cdFx0dmFyIGZvcmV2ZXJQZW5kaW5nUHJvbWlzZSA9IG5ldyBQcm9taXNlKEhhbmRsZXIsIGZvcmV2ZXJQZW5kaW5nSGFuZGxlcik7XG5cblx0XHRmdW5jdGlvbiBjeWNsZSgpIHtcblx0XHRcdHJldHVybiBuZXcgUmVqZWN0ZWQobmV3IFR5cGVFcnJvcignUHJvbWlzZSBjeWNsZScpKTtcblx0XHR9XG5cblx0XHQvLyBUYXNrIHJ1bm5lcnNcblxuXHRcdC8qKlxuXHRcdCAqIFJ1biBhIHNpbmdsZSBjb25zdW1lclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIENvbnRpbnVhdGlvblRhc2soY29udGludWF0aW9uLCBoYW5kbGVyKSB7XG5cdFx0XHR0aGlzLmNvbnRpbnVhdGlvbiA9IGNvbnRpbnVhdGlvbjtcblx0XHRcdHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG5cdFx0fVxuXG5cdFx0Q29udGludWF0aW9uVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmhhbmRsZXIuam9pbigpLndoZW4odGhpcy5jb250aW51YXRpb24pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSdW4gYSBxdWV1ZSBvZiBwcm9ncmVzcyBoYW5kbGVyc1xuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIFByb2dyZXNzVGFzayh2YWx1ZSwgaGFuZGxlcikge1xuXHRcdFx0dGhpcy5oYW5kbGVyID0gaGFuZGxlcjtcblx0XHRcdHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRQcm9ncmVzc1Rhc2sucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHEgPSB0aGlzLmhhbmRsZXIuY29uc3VtZXJzO1xuXHRcdFx0aWYocSA9PT0gdm9pZCAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Zm9yICh2YXIgYywgaSA9IDA7IGkgPCBxLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGMgPSBxW2ldO1xuXHRcdFx0XHRydW5Ob3RpZnkoYy5wcm9ncmVzcywgdGhpcy52YWx1ZSwgdGhpcy5oYW5kbGVyLCBjLnJlY2VpdmVyLCBjLnJlc29sdmVyKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQXNzaW1pbGF0ZSBhIHRoZW5hYmxlLCBzZW5kaW5nIGl0J3MgdmFsdWUgdG8gcmVzb2x2ZXJcblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVuXG5cdFx0ICogQHBhcmFtIHtvYmplY3R8ZnVuY3Rpb259IHRoZW5hYmxlXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IHJlc29sdmVyXG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gQXNzaW1pbGF0ZVRhc2sodGhlbiwgdGhlbmFibGUsIHJlc29sdmVyKSB7XG5cdFx0XHR0aGlzLl90aGVuID0gdGhlbjtcblx0XHRcdHRoaXMudGhlbmFibGUgPSB0aGVuYWJsZTtcblx0XHRcdHRoaXMucmVzb2x2ZXIgPSByZXNvbHZlcjtcblx0XHR9XG5cblx0XHRBc3NpbWlsYXRlVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaCA9IHRoaXMucmVzb2x2ZXI7XG5cdFx0XHR0cnlBc3NpbWlsYXRlKHRoaXMuX3RoZW4sIHRoaXMudGhlbmFibGUsIF9yZXNvbHZlLCBfcmVqZWN0LCBfbm90aWZ5KTtcblxuXHRcdFx0ZnVuY3Rpb24gX3Jlc29sdmUoeCkgeyBoLnJlc29sdmUoeCk7IH1cblx0XHRcdGZ1bmN0aW9uIF9yZWplY3QoeCkgIHsgaC5yZWplY3QoeCk7IH1cblx0XHRcdGZ1bmN0aW9uIF9ub3RpZnkoeCkgIHsgaC5ub3RpZnkoeCk7IH1cblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gdHJ5QXNzaW1pbGF0ZSh0aGVuLCB0aGVuYWJsZSwgcmVzb2x2ZSwgcmVqZWN0LCBub3RpZnkpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoZW4uY2FsbCh0aGVuYWJsZSwgcmVzb2x2ZSwgcmVqZWN0LCBub3RpZnkpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZWplY3QoZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogRm9sZCBhIGhhbmRsZXIgdmFsdWUgd2l0aCB6XG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gRm9sZChmLCB6LCBjLCB0bykge1xuXHRcdFx0dGhpcy5mID0gZjsgdGhpcy56ID0gejsgdGhpcy5jID0gYzsgdGhpcy50byA9IHRvO1xuXHRcdFx0dGhpcy5yZXNvbHZlciA9IGZhaWxJZlJlamVjdGVkO1xuXHRcdFx0dGhpcy5yZWNlaXZlciA9IHRoaXM7XG5cdFx0fVxuXG5cdFx0Rm9sZC5wcm90b3R5cGUuZnVsZmlsbGVkID0gZnVuY3Rpb24oeCkge1xuXHRcdFx0dGhpcy5mLmNhbGwodGhpcy5jLCB0aGlzLnosIHgsIHRoaXMudG8pO1xuXHRcdH07XG5cblx0XHRGb2xkLnByb3RvdHlwZS5yZWplY3RlZCA9IGZ1bmN0aW9uKHgpIHtcblx0XHRcdHRoaXMudG8ucmVqZWN0KHgpO1xuXHRcdH07XG5cblx0XHRGb2xkLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uKHgpIHtcblx0XHRcdHRoaXMudG8ubm90aWZ5KHgpO1xuXHRcdH07XG5cblx0XHQvLyBPdGhlciBoZWxwZXJzXG5cblx0XHQvKipcblx0XHQgKiBAcGFyYW0geyp9IHhcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgeCBpcyBhIHRydXN0ZWQgUHJvbWlzZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGlzUHJvbWlzZSh4KSB7XG5cdFx0XHRyZXR1cm4geCBpbnN0YW5jZW9mIFByb21pc2U7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogVGVzdCBqdXN0IGVub3VnaCB0byBydWxlIG91dCBwcmltaXRpdmVzLCBpbiBvcmRlciB0byB0YWtlIGZhc3RlclxuXHRcdCAqIHBhdGhzIGluIHNvbWUgY29kZVxuXHRcdCAqIEBwYXJhbSB7Kn0geFxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufSBmYWxzZSBpZmYgeCBpcyBndWFyYW50ZWVkICpub3QqIHRvIGJlIGEgdGhlbmFibGVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBtYXliZVRoZW5hYmxlKHgpIHtcblx0XHRcdHJldHVybiAodHlwZW9mIHggPT09ICdvYmplY3QnIHx8IHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nKSAmJiB4ICE9PSBudWxsO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHJ1bkNvbnRpbnVhdGlvbjEoZiwgaCwgcmVjZWl2ZXIsIG5leHQpIHtcblx0XHRcdGlmKHR5cGVvZiBmICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHJldHVybiBuZXh0LmJlY29tZShoKTtcblx0XHRcdH1cblxuXHRcdFx0UHJvbWlzZS5lbnRlckNvbnRleHQoaCk7XG5cdFx0XHR0cnlDYXRjaFJlamVjdChmLCBoLnZhbHVlLCByZWNlaXZlciwgbmV4dCk7XG5cdFx0XHRQcm9taXNlLmV4aXRDb250ZXh0KCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcnVuQ29udGludWF0aW9uMyhmLCB4LCBoLCByZWNlaXZlciwgbmV4dCkge1xuXHRcdFx0aWYodHlwZW9mIGYgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0cmV0dXJuIG5leHQuYmVjb21lKGgpO1xuXHRcdFx0fVxuXG5cdFx0XHRQcm9taXNlLmVudGVyQ29udGV4dChoKTtcblx0XHRcdHRyeUNhdGNoUmVqZWN0MyhmLCB4LCBoLnZhbHVlLCByZWNlaXZlciwgbmV4dCk7XG5cdFx0XHRQcm9taXNlLmV4aXRDb250ZXh0KCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogQGRlcHJlY2F0ZWRcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBydW5Ob3RpZnkoZiwgeCwgaCwgcmVjZWl2ZXIsIG5leHQpIHtcblx0XHRcdGlmKHR5cGVvZiBmICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHJldHVybiBuZXh0Lm5vdGlmeSh4KTtcblx0XHRcdH1cblxuXHRcdFx0UHJvbWlzZS5lbnRlckNvbnRleHQoaCk7XG5cdFx0XHR0cnlDYXRjaFJldHVybihmLCB4LCByZWNlaXZlciwgbmV4dCk7XG5cdFx0XHRQcm9taXNlLmV4aXRDb250ZXh0KCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJ5Q2F0Y2gyKGYsIGEsIGIpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiBmKGEsIGIpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJuIGYuY2FsbCh0aGlzQXJnLCB4KSwgb3IgaWYgaXQgdGhyb3dzIHJldHVybiBhIHJlamVjdGVkIHByb21pc2UgZm9yXG5cdFx0ICogdGhlIHRocm93biBleGNlcHRpb25cblx0XHQgKi9cblx0XHRmdW5jdGlvbiB0cnlDYXRjaFJlamVjdChmLCB4LCB0aGlzQXJnLCBuZXh0KSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRuZXh0LmJlY29tZShnZXRIYW5kbGVyKGYuY2FsbCh0aGlzQXJnLCB4KSkpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdG5leHQuYmVjb21lKG5ldyBSZWplY3RlZChlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogU2FtZSBhcyBhYm92ZSwgYnV0IGluY2x1ZGVzIHRoZSBleHRyYSBhcmd1bWVudCBwYXJhbWV0ZXIuXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gdHJ5Q2F0Y2hSZWplY3QzKGYsIHgsIHksIHRoaXNBcmcsIG5leHQpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGYuY2FsbCh0aGlzQXJnLCB4LCB5LCBuZXh0KTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHRuZXh0LmJlY29tZShuZXcgUmVqZWN0ZWQoZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEBkZXByZWNhdGVkXG5cdFx0ICogUmV0dXJuIGYuY2FsbCh0aGlzQXJnLCB4KSwgb3IgaWYgaXQgdGhyb3dzLCAqcmV0dXJuKiB0aGUgZXhjZXB0aW9uXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gdHJ5Q2F0Y2hSZXR1cm4oZiwgeCwgdGhpc0FyZywgbmV4dCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bmV4dC5ub3RpZnkoZi5jYWxsKHRoaXNBcmcsIHgpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHRuZXh0Lm5vdGlmeShlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpbmhlcml0KFBhcmVudCwgQ2hpbGQpIHtcblx0XHRcdENoaWxkLnByb3RvdHlwZSA9IG9iamVjdENyZWF0ZShQYXJlbnQucHJvdG90eXBlKTtcblx0XHRcdENoaWxkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENoaWxkO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHNuZCh4LCB5KSB7XG5cdFx0XHRyZXR1cm4geTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBub29wKCkge31cblxuXHRcdGZ1bmN0aW9uIGluaXRFbWl0UmVqZWN0aW9uKCkge1xuXHRcdFx0LypnbG9iYWwgcHJvY2Vzcywgc2VsZiwgQ3VzdG9tRXZlbnQqL1xuXHRcdFx0aWYodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MgIT09IG51bGxcblx0XHRcdFx0JiYgdHlwZW9mIHByb2Nlc3MuZW1pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHQvLyBSZXR1cm5pbmcgZmFsc3kgaGVyZSBtZWFucyB0byBjYWxsIHRoZSBkZWZhdWx0XG5cdFx0XHRcdC8vIG9uUG90ZW50aWFsbHlVbmhhbmRsZWRSZWplY3Rpb24gQVBJLiAgVGhpcyBpcyBzYWZlIGV2ZW4gaW5cblx0XHRcdFx0Ly8gYnJvd3NlcmlmeSBzaW5jZSBwcm9jZXNzLmVtaXQgYWx3YXlzIHJldHVybnMgZmFsc3kgaW4gYnJvd3NlcmlmeTpcblx0XHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2RlZnVuY3R6b21iaWUvbm9kZS1wcm9jZXNzL2Jsb2IvbWFzdGVyL2Jyb3dzZXIuanMjTDQwLUw0NlxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24odHlwZSwgcmVqZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHR5cGUgPT09ICd1bmhhbmRsZWRSZWplY3Rpb24nXG5cdFx0XHRcdFx0XHQ/IHByb2Nlc3MuZW1pdCh0eXBlLCByZWplY3Rpb24udmFsdWUsIHJlamVjdGlvbilcblx0XHRcdFx0XHRcdDogcHJvY2Vzcy5lbWl0KHR5cGUsIHJlamVjdGlvbik7XG5cdFx0XHRcdH07XG5cdFx0XHR9IGVsc2UgaWYodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBDdXN0b21FdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKG5vb3AsIHNlbGYsIEN1c3RvbUV2ZW50KSB7XG5cdFx0XHRcdFx0dmFyIGhhc0N1c3RvbUV2ZW50ID0gZmFsc2U7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHZhciBldiA9IG5ldyBDdXN0b21FdmVudCgndW5oYW5kbGVkUmVqZWN0aW9uJyk7XG5cdFx0XHRcdFx0XHRoYXNDdXN0b21FdmVudCA9IGV2IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQ7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge31cblxuXHRcdFx0XHRcdHJldHVybiAhaGFzQ3VzdG9tRXZlbnQgPyBub29wIDogZnVuY3Rpb24odHlwZSwgcmVqZWN0aW9uKSB7XG5cdFx0XHRcdFx0XHR2YXIgZXYgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwge1xuXHRcdFx0XHRcdFx0XHRkZXRhaWw6IHtcblx0XHRcdFx0XHRcdFx0XHRyZWFzb246IHJlamVjdGlvbi52YWx1ZSxcblx0XHRcdFx0XHRcdFx0XHRrZXk6IHJlamVjdGlvblxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRidWJibGVzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0Y2FuY2VsYWJsZTogdHJ1ZVxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdHJldHVybiAhc2VsZi5kaXNwYXRjaEV2ZW50KGV2KTtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9KG5vb3AsIHNlbGYsIEN1c3RvbUV2ZW50KSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBub29wO1xuXHRcdH1cblxuXHRcdHJldHVybiBQcm9taXNlO1xuXHR9O1xufSk7XG59KHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSA6IGZ1bmN0aW9uKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IH0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3doZW4vbGliL21ha2VQcm9taXNlLmpzXG4gKiogbW9kdWxlIGlkID0gMjJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4oZnVuY3Rpb24oZGVmaW5lKSB7ICd1c2Ugc3RyaWN0JztcbmRlZmluZShmdW5jdGlvbigpIHtcblxuXHQvLyBDcmVkaXQgdG8gVHdpc29sIChodHRwczovL2dpdGh1Yi5jb20vVHdpc29sKSBmb3Igc3VnZ2VzdGluZ1xuXHQvLyB0aGlzIHR5cGUgb2YgZXh0ZW5zaWJsZSBxdWV1ZSArIHRyYW1wb2xpbmUgYXBwcm9hY2ggZm9yIG5leHQtdGljayBjb25mbGF0aW9uLlxuXG5cdC8qKlxuXHQgKiBBc3luYyB0YXNrIHNjaGVkdWxlclxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBhc3luYyBmdW5jdGlvbiB0byBzY2hlZHVsZSBhIHNpbmdsZSBhc3luYyBmdW5jdGlvblxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICovXG5cdGZ1bmN0aW9uIFNjaGVkdWxlcihhc3luYykge1xuXHRcdHRoaXMuX2FzeW5jID0gYXN5bmM7XG5cdFx0dGhpcy5fcnVubmluZyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5fcXVldWUgPSB0aGlzO1xuXHRcdHRoaXMuX3F1ZXVlTGVuID0gMDtcblx0XHR0aGlzLl9hZnRlclF1ZXVlID0ge307XG5cdFx0dGhpcy5fYWZ0ZXJRdWV1ZUxlbiA9IDA7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5kcmFpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5fZHJhaW4oKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIEVucXVldWUgYSB0YXNrXG5cdCAqIEBwYXJhbSB7eyBydW46ZnVuY3Rpb24gfX0gdGFza1xuXHQgKi9cblx0U2NoZWR1bGVyLnByb3RvdHlwZS5lbnF1ZXVlID0gZnVuY3Rpb24odGFzaykge1xuXHRcdHRoaXMuX3F1ZXVlW3RoaXMuX3F1ZXVlTGVuKytdID0gdGFzaztcblx0XHR0aGlzLnJ1bigpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFbnF1ZXVlIGEgdGFzayB0byBydW4gYWZ0ZXIgdGhlIG1haW4gdGFzayBxdWV1ZVxuXHQgKiBAcGFyYW0ge3sgcnVuOmZ1bmN0aW9uIH19IHRhc2tcblx0ICovXG5cdFNjaGVkdWxlci5wcm90b3R5cGUuYWZ0ZXJRdWV1ZSA9IGZ1bmN0aW9uKHRhc2spIHtcblx0XHR0aGlzLl9hZnRlclF1ZXVlW3RoaXMuX2FmdGVyUXVldWVMZW4rK10gPSB0YXNrO1xuXHRcdHRoaXMucnVuKCk7XG5cdH07XG5cblx0U2NoZWR1bGVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuX3J1bm5pbmcpIHtcblx0XHRcdHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuXHRcdFx0dGhpcy5fYXN5bmModGhpcy5kcmFpbik7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBEcmFpbiB0aGUgaGFuZGxlciBxdWV1ZSBlbnRpcmVseSwgYW5kIHRoZW4gdGhlIGFmdGVyIHF1ZXVlXG5cdCAqL1xuXHRTY2hlZHVsZXIucHJvdG90eXBlLl9kcmFpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuX3F1ZXVlTGVuOyArK2kpIHtcblx0XHRcdHRoaXMuX3F1ZXVlW2ldLnJ1bigpO1xuXHRcdFx0dGhpcy5fcXVldWVbaV0gPSB2b2lkIDA7XG5cdFx0fVxuXG5cdFx0dGhpcy5fcXVldWVMZW4gPSAwO1xuXHRcdHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCB0aGlzLl9hZnRlclF1ZXVlTGVuOyArK2kpIHtcblx0XHRcdHRoaXMuX2FmdGVyUXVldWVbaV0ucnVuKCk7XG5cdFx0XHR0aGlzLl9hZnRlclF1ZXVlW2ldID0gdm9pZCAwO1xuXHRcdH1cblxuXHRcdHRoaXMuX2FmdGVyUXVldWVMZW4gPSAwO1xuXHR9O1xuXG5cdHJldHVybiBTY2hlZHVsZXI7XG5cbn0pO1xufSh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUgOiBmdW5jdGlvbihmYWN0b3J5KSB7IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpOyB9KSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi93aGVuL2xpYi9TY2hlZHVsZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAyM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyohXG4gKiBVUkkuanMgLSBNdXRhdGluZyBVUkxzXG4gKlxuICogVmVyc2lvbjogMS4xNi4xXG4gKlxuICogQXV0aG9yOiBSb2RuZXkgUmVobVxuICogV2ViOiBodHRwOi8vbWVkaWFsaXplLmdpdGh1Yi5pby9VUkkuanMvXG4gKlxuICogTGljZW5zZWQgdW5kZXJcbiAqICAgTUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZVxuICogICBHUEwgdjMgaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0dQTC0zLjBcbiAqXG4gKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvcmV0dXJuRXhwb3J0cy5qc1xuICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gTm9kZVxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCcuL3B1bnljb2RlJyksIHJlcXVpcmUoJy4vSVB2NicpLCByZXF1aXJlKCcuL1NlY29uZExldmVsRG9tYWlucycpKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKFsnLi9wdW55Y29kZScsICcuL0lQdjYnLCAnLi9TZWNvbmRMZXZlbERvbWFpbnMnXSwgZmFjdG9yeSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzIChyb290IGlzIHdpbmRvdylcbiAgICByb290LlVSSSA9IGZhY3Rvcnkocm9vdC5wdW55Y29kZSwgcm9vdC5JUHY2LCByb290LlNlY29uZExldmVsRG9tYWlucywgcm9vdCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24gKHB1bnljb2RlLCBJUHY2LCBTTEQsIHJvb3QpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvKmdsb2JhbCBsb2NhdGlvbiwgZXNjYXBlLCB1bmVzY2FwZSAqL1xuICAvLyBGSVhNRTogdjIuMC4wIHJlbmFtY2Ugbm9uLWNhbWVsQ2FzZSBwcm9wZXJ0aWVzIHRvIHVwcGVyY2FzZVxuICAvKmpzaGludCBjYW1lbGNhc2U6IGZhbHNlICovXG5cbiAgLy8gc2F2ZSBjdXJyZW50IFVSSSB2YXJpYWJsZSwgaWYgYW55XG4gIHZhciBfVVJJID0gcm9vdCAmJiByb290LlVSSTtcblxuICBmdW5jdGlvbiBVUkkodXJsLCBiYXNlKSB7XG4gICAgdmFyIF91cmxTdXBwbGllZCA9IGFyZ3VtZW50cy5sZW5ndGggPj0gMTtcbiAgICB2YXIgX2Jhc2VTdXBwbGllZCA9IGFyZ3VtZW50cy5sZW5ndGggPj0gMjtcblxuICAgIC8vIEFsbG93IGluc3RhbnRpYXRpb24gd2l0aG91dCB0aGUgJ25ldycga2V5d29yZFxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBVUkkpKSB7XG4gICAgICBpZiAoX3VybFN1cHBsaWVkKSB7XG4gICAgICAgIGlmIChfYmFzZVN1cHBsaWVkKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBVUkkodXJsLCBiYXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgVVJJKHVybCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgVVJJKCk7XG4gICAgfVxuXG4gICAgaWYgKHVybCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoX3VybFN1cHBsaWVkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3VuZGVmaW5lZCBpcyBub3QgYSB2YWxpZCBhcmd1bWVudCBmb3IgVVJJJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgbG9jYXRpb24gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHVybCA9IGxvY2F0aW9uLmhyZWYgKyAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaHJlZih1cmwpO1xuXG4gICAgLy8gcmVzb2x2ZSB0byBiYXNlIGFjY29yZGluZyB0byBodHRwOi8vZHZjcy53My5vcmcvaGcvdXJsL3Jhdy1maWxlL3RpcC9PdmVydmlldy5odG1sI2NvbnN0cnVjdG9yXG4gICAgaWYgKGJhc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuYWJzb2x1dGVUbyhiYXNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIFVSSS52ZXJzaW9uID0gJzEuMTYuMSc7XG5cbiAgdmFyIHAgPSBVUkkucHJvdG90eXBlO1xuICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICBmdW5jdGlvbiBlc2NhcGVSZWdFeChzdHJpbmcpIHtcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWVkaWFsaXplL1VSSS5qcy9jb21taXQvODVhYzIxNzgzYzExZjhjY2FiMDYxMDZkYmE5NzM1YTMxYTg2OTI0ZCNjb21taXRjb21tZW50LTgyMTk2M1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKFsuKis/Xj0hOiR7fSgpfFtcXF1cXC9cXFxcXSkvZywgJ1xcXFwkMScpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VHlwZSh2YWx1ZSkge1xuICAgIC8vIElFOCBkb2Vzbid0IHJldHVybiBbT2JqZWN0IFVuZGVmaW5lZF0gYnV0IFtPYmplY3QgT2JqZWN0XSBmb3IgdW5kZWZpbmVkIHZhbHVlXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnVW5kZWZpbmVkJztcbiAgICB9XG5cbiAgICByZXR1cm4gU3RyaW5nKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkpLnNsaWNlKDgsIC0xKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIGdldFR5cGUob2JqKSA9PT0gJ0FycmF5JztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFycmF5VmFsdWVzKGRhdGEsIHZhbHVlKSB7XG4gICAgdmFyIGxvb2t1cCA9IHt9O1xuICAgIHZhciBpLCBsZW5ndGg7XG5cbiAgICBpZiAoZ2V0VHlwZSh2YWx1ZSkgPT09ICdSZWdFeHAnKSB7XG4gICAgICBsb29rdXAgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxvb2t1cFt2YWx1ZVtpXV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsb29rdXBbdmFsdWVdID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBkYXRhLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAvKmpzaGludCBsYXhicmVhazogdHJ1ZSAqL1xuICAgICAgdmFyIF9tYXRjaCA9IGxvb2t1cCAmJiBsb29rdXBbZGF0YVtpXV0gIT09IHVuZGVmaW5lZFxuICAgICAgICB8fCAhbG9va3VwICYmIHZhbHVlLnRlc3QoZGF0YVtpXSk7XG4gICAgICAvKmpzaGludCBsYXhicmVhazogZmFsc2UgKi9cbiAgICAgIGlmIChfbWF0Y2gpIHtcbiAgICAgICAgZGF0YS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGxlbmd0aC0tO1xuICAgICAgICBpLS07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUNvbnRhaW5zKGxpc3QsIHZhbHVlKSB7XG4gICAgdmFyIGksIGxlbmd0aDtcblxuICAgIC8vIHZhbHVlIG1heSBiZSBzdHJpbmcsIG51bWJlciwgYXJyYXksIHJlZ2V4cFxuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgLy8gTm90ZTogdGhpcyBjYW4gYmUgb3B0aW1pemVkIHRvIE8obikgKGluc3RlYWQgb2YgY3VycmVudCBPKG0gKiBuKSlcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghYXJyYXlDb250YWlucyhsaXN0LCB2YWx1ZVtpXSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdmFyIF90eXBlID0gZ2V0VHlwZSh2YWx1ZSk7XG4gICAgZm9yIChpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKF90eXBlID09PSAnUmVnRXhwJykge1xuICAgICAgICBpZiAodHlwZW9mIGxpc3RbaV0gPT09ICdzdHJpbmcnICYmIGxpc3RbaV0ubWF0Y2godmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobGlzdFtpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gYXJyYXlzRXF1YWwob25lLCB0d28pIHtcbiAgICBpZiAoIWlzQXJyYXkob25lKSB8fCAhaXNBcnJheSh0d28pKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gYXJyYXlzIGNhbid0IGJlIGVxdWFsIGlmIHRoZXkgaGF2ZSBkaWZmZXJlbnQgYW1vdW50IG9mIGNvbnRlbnRcbiAgICBpZiAob25lLmxlbmd0aCAhPT0gdHdvLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9uZS5zb3J0KCk7XG4gICAgdHdvLnNvcnQoKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb25lLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKG9uZVtpXSAhPT0gdHdvW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIFVSSS5fcGFydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdG9jb2w6IG51bGwsXG4gICAgICB1c2VybmFtZTogbnVsbCxcbiAgICAgIHBhc3N3b3JkOiBudWxsLFxuICAgICAgaG9zdG5hbWU6IG51bGwsXG4gICAgICB1cm46IG51bGwsXG4gICAgICBwb3J0OiBudWxsLFxuICAgICAgcGF0aDogbnVsbCxcbiAgICAgIHF1ZXJ5OiBudWxsLFxuICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAvLyBzdGF0ZVxuICAgICAgZHVwbGljYXRlUXVlcnlQYXJhbWV0ZXJzOiBVUkkuZHVwbGljYXRlUXVlcnlQYXJhbWV0ZXJzLFxuICAgICAgZXNjYXBlUXVlcnlTcGFjZTogVVJJLmVzY2FwZVF1ZXJ5U3BhY2VcbiAgICB9O1xuICB9O1xuICAvLyBzdGF0ZTogYWxsb3cgZHVwbGljYXRlIHF1ZXJ5IHBhcmFtZXRlcnMgKGE9MSZhPTEpXG4gIFVSSS5kdXBsaWNhdGVRdWVyeVBhcmFtZXRlcnMgPSBmYWxzZTtcbiAgLy8gc3RhdGU6IHJlcGxhY2VzICsgd2l0aCAlMjAgKHNwYWNlIGluIHF1ZXJ5IHN0cmluZ3MpXG4gIFVSSS5lc2NhcGVRdWVyeVNwYWNlID0gdHJ1ZTtcbiAgLy8gc3RhdGljIHByb3BlcnRpZXNcbiAgVVJJLnByb3RvY29sX2V4cHJlc3Npb24gPSAvXlthLXpdW2EtejAtOS4rLV0qJC9pO1xuICBVUkkuaWRuX2V4cHJlc3Npb24gPSAvW15hLXowLTlcXC4tXS9pO1xuICBVUkkucHVueWNvZGVfZXhwcmVzc2lvbiA9IC8oeG4tLSkvaTtcbiAgLy8gd2VsbCwgMzMzLjQ0NC41NTUuNjY2IG1hdGNoZXMsIGJ1dCBpdCBzdXJlIGFpbid0IG5vIElQdjQgLSBkbyB3ZSBjYXJlP1xuICBVUkkuaXA0X2V4cHJlc3Npb24gPSAvXlxcZHsxLDN9XFwuXFxkezEsM31cXC5cXGR7MSwzfVxcLlxcZHsxLDN9JC87XG4gIC8vIGNyZWRpdHMgdG8gUmljaCBCcm93blxuICAvLyBzb3VyY2U6IGh0dHA6Ly9mb3J1bXMuaW50ZXJtYXBwZXIuY29tL3ZpZXd0b3BpYy5waHA/cD0xMDk2IzEwOTZcbiAgLy8gc3BlY2lmaWNhdGlvbjogaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDI5MS50eHRcbiAgVVJJLmlwNl9leHByZXNzaW9uID0gL15cXHMqKCgoWzAtOUEtRmEtZl17MSw0fTopezd9KFswLTlBLUZhLWZdezEsNH18OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezZ9KDpbMC05QS1GYS1mXXsxLDR9fCgoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7NX0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSwyfSl8OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7NH0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSwzfSl8KCg6WzAtOUEtRmEtZl17MSw0fSk/OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezN9KCgoOlswLTlBLUZhLWZdezEsNH0pezEsNH0pfCgoOlswLTlBLUZhLWZdezEsNH0pezAsMn06KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7Mn0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSw1fSl8KCg6WzAtOUEtRmEtZl17MSw0fSl7MCwzfTooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSkpfDopKXwoKFswLTlBLUZhLWZdezEsNH06KXsxfSgoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDZ9KXwoKDpbMC05QS1GYS1mXXsxLDR9KXswLDR9OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpfCg6KCgoOlswLTlBLUZhLWZdezEsNH0pezEsN30pfCgoOlswLTlBLUZhLWZdezEsNH0pezAsNX06KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSkpKCUuKyk/XFxzKiQvO1xuICAvLyBleHByZXNzaW9uIHVzZWQgaXMgXCJncnViZXIgcmV2aXNlZFwiIChAZ3J1YmVyIHYyKSBkZXRlcm1pbmVkIHRvIGJlIHRoZVxuICAvLyBiZXN0IHNvbHV0aW9uIGluIGEgcmVnZXgtZ29sZiB3ZSBkaWQgYSBjb3VwbGUgb2YgYWdlcyBhZ28gYXRcbiAgLy8gKiBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9kZW1vL3VybC1yZWdleFxuICAvLyAqIGh0dHA6Ly9yb2RuZXlyZWhtLmRlL3QvdXJsLXJlZ2V4Lmh0bWxcbiAgVVJJLmZpbmRfdXJpX2V4cHJlc3Npb24gPSAvXFxiKCg/OlthLXpdW1xcdy1dKzooPzpcXC97MSwzfXxbYS16MC05JV0pfHd3d1xcZHswLDN9Wy5dfFthLXowLTkuXFwtXStbLl1bYS16XXsyLDR9XFwvKSg/OlteXFxzKCk8Pl0rfFxcKChbXlxccygpPD5dK3woXFwoW15cXHMoKTw+XStcXCkpKSpcXCkpKyg/OlxcKChbXlxccygpPD5dK3woXFwoW15cXHMoKTw+XStcXCkpKSpcXCl8W15cXHNgISgpXFxbXFxde307OidcIi4sPD4/wqvCu+KAnOKAneKAmOKAmV0pKS9pZztcbiAgVVJJLmZpbmRVcmkgPSB7XG4gICAgLy8gdmFsaWQgXCJzY2hlbWU6Ly9cIiBvciBcInd3dy5cIlxuICAgIHN0YXJ0OiAvXFxiKD86KFthLXpdW2EtejAtOS4rLV0qOlxcL1xcLyl8d3d3XFwuKS9naSxcbiAgICAvLyBldmVyeXRoaW5nIHVwIHRvIHRoZSBuZXh0IHdoaXRlc3BhY2VcbiAgICBlbmQ6IC9bXFxzXFxyXFxuXXwkLyxcbiAgICAvLyB0cmltIHRyYWlsaW5nIHB1bmN0dWF0aW9uIGNhcHR1cmVkIGJ5IGVuZCBSZWdFeHBcbiAgICB0cmltOiAvW2AhKClcXFtcXF17fTs6J1wiLiw8Pj/Cq8K74oCc4oCd4oCe4oCY4oCZXSskL1xuICB9O1xuICAvLyBodHRwOi8vd3d3LmlhbmEub3JnL2Fzc2lnbm1lbnRzL3VyaS1zY2hlbWVzLmh0bWxcbiAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaXN0X29mX1RDUF9hbmRfVURQX3BvcnRfbnVtYmVycyNXZWxsLWtub3duX3BvcnRzXG4gIFVSSS5kZWZhdWx0UG9ydHMgPSB7XG4gICAgaHR0cDogJzgwJyxcbiAgICBodHRwczogJzQ0MycsXG4gICAgZnRwOiAnMjEnLFxuICAgIGdvcGhlcjogJzcwJyxcbiAgICB3czogJzgwJyxcbiAgICB3c3M6ICc0NDMnXG4gIH07XG4gIC8vIGFsbG93ZWQgaG9zdG5hbWUgY2hhcmFjdGVycyBhY2NvcmRpbmcgdG8gUkZDIDM5ODZcbiAgLy8gQUxQSEEgRElHSVQgXCItXCIgXCIuXCIgXCJfXCIgXCJ+XCIgXCIhXCIgXCIkXCIgXCImXCIgXCInXCIgXCIoXCIgXCIpXCIgXCIqXCIgXCIrXCIgXCIsXCIgXCI7XCIgXCI9XCIgJWVuY29kZWRcbiAgLy8gSSd2ZSBuZXZlciBzZWVuIGEgKG5vbi1JRE4pIGhvc3RuYW1lIG90aGVyIHRoYW46IEFMUEhBIERJR0lUIC4gLVxuICBVUkkuaW52YWxpZF9ob3N0bmFtZV9jaGFyYWN0ZXJzID0gL1teYS16QS1aMC05XFwuLV0vO1xuICAvLyBtYXAgRE9NIEVsZW1lbnRzIHRvIHRoZWlyIFVSSSBhdHRyaWJ1dGVcbiAgVVJJLmRvbUF0dHJpYnV0ZXMgPSB7XG4gICAgJ2EnOiAnaHJlZicsXG4gICAgJ2Jsb2NrcXVvdGUnOiAnY2l0ZScsXG4gICAgJ2xpbmsnOiAnaHJlZicsXG4gICAgJ2Jhc2UnOiAnaHJlZicsXG4gICAgJ3NjcmlwdCc6ICdzcmMnLFxuICAgICdmb3JtJzogJ2FjdGlvbicsXG4gICAgJ2ltZyc6ICdzcmMnLFxuICAgICdhcmVhJzogJ2hyZWYnLFxuICAgICdpZnJhbWUnOiAnc3JjJyxcbiAgICAnZW1iZWQnOiAnc3JjJyxcbiAgICAnc291cmNlJzogJ3NyYycsXG4gICAgJ3RyYWNrJzogJ3NyYycsXG4gICAgJ2lucHV0JzogJ3NyYycsIC8vIGJ1dCBvbmx5IGlmIHR5cGU9XCJpbWFnZVwiXG4gICAgJ2F1ZGlvJzogJ3NyYycsXG4gICAgJ3ZpZGVvJzogJ3NyYydcbiAgfTtcbiAgVVJJLmdldERvbUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUgfHwgIW5vZGUubm9kZU5hbWUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdmFyIG5vZGVOYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIC8vIDxpbnB1dD4gc2hvdWxkIG9ubHkgZXhwb3NlIHNyYyBmb3IgdHlwZT1cImltYWdlXCJcbiAgICBpZiAobm9kZU5hbWUgPT09ICdpbnB1dCcgJiYgbm9kZS50eXBlICE9PSAnaW1hZ2UnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBVUkkuZG9tQXR0cmlidXRlc1tub2RlTmFtZV07XG4gIH07XG5cbiAgZnVuY3Rpb24gZXNjYXBlRm9yRHVtYkZpcmVmb3gzNih2YWx1ZSkge1xuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZWRpYWxpemUvVVJJLmpzL2lzc3Vlcy85MVxuICAgIHJldHVybiBlc2NhcGUodmFsdWUpO1xuICB9XG5cbiAgLy8gZW5jb2RpbmcgLyBkZWNvZGluZyBhY2NvcmRpbmcgdG8gUkZDMzk4NlxuICBmdW5jdGlvbiBzdHJpY3RFbmNvZGVVUklDb21wb25lbnQoc3RyaW5nKSB7XG4gICAgLy8gc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvZW5jb2RlVVJJQ29tcG9uZW50XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmcpXG4gICAgICAucmVwbGFjZSgvWyEnKCkqXS9nLCBlc2NhcGVGb3JEdW1iRmlyZWZveDM2KVxuICAgICAgLnJlcGxhY2UoL1xcKi9nLCAnJTJBJyk7XG4gIH1cbiAgVVJJLmVuY29kZSA9IHN0cmljdEVuY29kZVVSSUNvbXBvbmVudDtcbiAgVVJJLmRlY29kZSA9IGRlY29kZVVSSUNvbXBvbmVudDtcbiAgVVJJLmlzbzg4NTkgPSBmdW5jdGlvbigpIHtcbiAgICBVUkkuZW5jb2RlID0gZXNjYXBlO1xuICAgIFVSSS5kZWNvZGUgPSB1bmVzY2FwZTtcbiAgfTtcbiAgVVJJLnVuaWNvZGUgPSBmdW5jdGlvbigpIHtcbiAgICBVUkkuZW5jb2RlID0gc3RyaWN0RW5jb2RlVVJJQ29tcG9uZW50O1xuICAgIFVSSS5kZWNvZGUgPSBkZWNvZGVVUklDb21wb25lbnQ7XG4gIH07XG4gIFVSSS5jaGFyYWN0ZXJzID0ge1xuICAgIHBhdGhuYW1lOiB7XG4gICAgICBlbmNvZGU6IHtcbiAgICAgICAgLy8gUkZDMzk4NiAyLjE6IEZvciBjb25zaXN0ZW5jeSwgVVJJIHByb2R1Y2VycyBhbmQgbm9ybWFsaXplcnMgc2hvdWxkXG4gICAgICAgIC8vIHVzZSB1cHBlcmNhc2UgaGV4YWRlY2ltYWwgZGlnaXRzIGZvciBhbGwgcGVyY2VudC1lbmNvZGluZ3MuXG4gICAgICAgIGV4cHJlc3Npb246IC8lKDI0fDI2fDJCfDJDfDNCfDNEfDNBfDQwKS9pZyxcbiAgICAgICAgbWFwOiB7XG4gICAgICAgICAgLy8gLS5ffiEnKCkqXG4gICAgICAgICAgJyUyNCc6ICckJyxcbiAgICAgICAgICAnJTI2JzogJyYnLFxuICAgICAgICAgICclMkInOiAnKycsXG4gICAgICAgICAgJyUyQyc6ICcsJyxcbiAgICAgICAgICAnJTNCJzogJzsnLFxuICAgICAgICAgICclM0QnOiAnPScsXG4gICAgICAgICAgJyUzQSc6ICc6JyxcbiAgICAgICAgICAnJTQwJzogJ0AnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkZWNvZGU6IHtcbiAgICAgICAgZXhwcmVzc2lvbjogL1tcXC9cXD8jXS9nLFxuICAgICAgICBtYXA6IHtcbiAgICAgICAgICAnLyc6ICclMkYnLFxuICAgICAgICAgICc/JzogJyUzRicsXG4gICAgICAgICAgJyMnOiAnJTIzJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICByZXNlcnZlZDoge1xuICAgICAgZW5jb2RlOiB7XG4gICAgICAgIC8vIFJGQzM5ODYgMi4xOiBGb3IgY29uc2lzdGVuY3ksIFVSSSBwcm9kdWNlcnMgYW5kIG5vcm1hbGl6ZXJzIHNob3VsZFxuICAgICAgICAvLyB1c2UgdXBwZXJjYXNlIGhleGFkZWNpbWFsIGRpZ2l0cyBmb3IgYWxsIHBlcmNlbnQtZW5jb2RpbmdzLlxuICAgICAgICBleHByZXNzaW9uOiAvJSgyMXwyM3wyNHwyNnwyN3wyOHwyOXwyQXwyQnwyQ3wyRnwzQXwzQnwzRHwzRnw0MHw1Qnw1RCkvaWcsXG4gICAgICAgIG1hcDoge1xuICAgICAgICAgIC8vIGdlbi1kZWxpbXNcbiAgICAgICAgICAnJTNBJzogJzonLFxuICAgICAgICAgICclMkYnOiAnLycsXG4gICAgICAgICAgJyUzRic6ICc/JyxcbiAgICAgICAgICAnJTIzJzogJyMnLFxuICAgICAgICAgICclNUInOiAnWycsXG4gICAgICAgICAgJyU1RCc6ICddJyxcbiAgICAgICAgICAnJTQwJzogJ0AnLFxuICAgICAgICAgIC8vIHN1Yi1kZWxpbXNcbiAgICAgICAgICAnJTIxJzogJyEnLFxuICAgICAgICAgICclMjQnOiAnJCcsXG4gICAgICAgICAgJyUyNic6ICcmJyxcbiAgICAgICAgICAnJTI3JzogJ1xcJycsXG4gICAgICAgICAgJyUyOCc6ICcoJyxcbiAgICAgICAgICAnJTI5JzogJyknLFxuICAgICAgICAgICclMkEnOiAnKicsXG4gICAgICAgICAgJyUyQic6ICcrJyxcbiAgICAgICAgICAnJTJDJzogJywnLFxuICAgICAgICAgICclM0InOiAnOycsXG4gICAgICAgICAgJyUzRCc6ICc9J1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICB1cm5wYXRoOiB7XG4gICAgICAvLyBUaGUgY2hhcmFjdGVycyB1bmRlciBgZW5jb2RlYCBhcmUgdGhlIGNoYXJhY3RlcnMgY2FsbGVkIG91dCBieSBSRkMgMjE0MSBhcyBiZWluZyBhY2NlcHRhYmxlXG4gICAgICAvLyBmb3IgdXNhZ2UgaW4gYSBVUk4uIFJGQzIxNDEgYWxzbyBjYWxscyBvdXQgXCItXCIsIFwiLlwiLCBhbmQgXCJfXCIgYXMgYWNjZXB0YWJsZSBjaGFyYWN0ZXJzLCBidXRcbiAgICAgIC8vIHRoZXNlIGFyZW4ndCBlbmNvZGVkIGJ5IGVuY29kZVVSSUNvbXBvbmVudCwgc28gd2UgZG9uJ3QgaGF2ZSB0byBjYWxsIHRoZW0gb3V0IGhlcmUuIEFsc29cbiAgICAgIC8vIG5vdGUgdGhhdCB0aGUgY29sb24gY2hhcmFjdGVyIGlzIG5vdCBmZWF0dXJlZCBpbiB0aGUgZW5jb2RpbmcgbWFwOyB0aGlzIGlzIGJlY2F1c2UgVVJJLmpzXG4gICAgICAvLyBnaXZlcyB0aGUgY29sb25zIGluIFVSTnMgc2VtYW50aWMgbWVhbmluZyBhcyB0aGUgZGVsaW1pdGVycyBvZiBwYXRoIHNlZ2VtZW50cywgYW5kIHNvIGl0XG4gICAgICAvLyBzaG91bGQgbm90IGFwcGVhciB1bmVuY29kZWQgaW4gYSBzZWdtZW50IGl0c2VsZi5cbiAgICAgIC8vIFNlZSBhbHNvIHRoZSBub3RlIGFib3ZlIGFib3V0IFJGQzM5ODYgYW5kIGNhcGl0YWxhbGl6ZWQgaGV4IGRpZ2l0cy5cbiAgICAgIGVuY29kZToge1xuICAgICAgICBleHByZXNzaW9uOiAvJSgyMXwyNHwyN3wyOHwyOXwyQXwyQnwyQ3wzQnwzRHw0MCkvaWcsXG4gICAgICAgIG1hcDoge1xuICAgICAgICAgICclMjEnOiAnIScsXG4gICAgICAgICAgJyUyNCc6ICckJyxcbiAgICAgICAgICAnJTI3JzogJ1xcJycsXG4gICAgICAgICAgJyUyOCc6ICcoJyxcbiAgICAgICAgICAnJTI5JzogJyknLFxuICAgICAgICAgICclMkEnOiAnKicsXG4gICAgICAgICAgJyUyQic6ICcrJyxcbiAgICAgICAgICAnJTJDJzogJywnLFxuICAgICAgICAgICclM0InOiAnOycsXG4gICAgICAgICAgJyUzRCc6ICc9JyxcbiAgICAgICAgICAnJTQwJzogJ0AnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBUaGVzZSBjaGFyYWN0ZXJzIGFyZSB0aGUgY2hhcmFjdGVycyBjYWxsZWQgb3V0IGJ5IFJGQzIxNDEgYXMgXCJyZXNlcnZlZFwiIGNoYXJhY3RlcnMgdGhhdFxuICAgICAgLy8gc2hvdWxkIG5ldmVyIGFwcGVhciBpbiBhIFVSTiwgcGx1cyB0aGUgY29sb24gY2hhcmFjdGVyIChzZWUgbm90ZSBhYm92ZSkuXG4gICAgICBkZWNvZGU6IHtcbiAgICAgICAgZXhwcmVzc2lvbjogL1tcXC9cXD8jOl0vZyxcbiAgICAgICAgbWFwOiB7XG4gICAgICAgICAgJy8nOiAnJTJGJyxcbiAgICAgICAgICAnPyc6ICclM0YnLFxuICAgICAgICAgICcjJzogJyUyMycsXG4gICAgICAgICAgJzonOiAnJTNBJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBVUkkuZW5jb2RlUXVlcnkgPSBmdW5jdGlvbihzdHJpbmcsIGVzY2FwZVF1ZXJ5U3BhY2UpIHtcbiAgICB2YXIgZXNjYXBlZCA9IFVSSS5lbmNvZGUoc3RyaW5nICsgJycpO1xuICAgIGlmIChlc2NhcGVRdWVyeVNwYWNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVzY2FwZVF1ZXJ5U3BhY2UgPSBVUkkuZXNjYXBlUXVlcnlTcGFjZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXNjYXBlUXVlcnlTcGFjZSA/IGVzY2FwZWQucmVwbGFjZSgvJTIwL2csICcrJykgOiBlc2NhcGVkO1xuICB9O1xuICBVUkkuZGVjb2RlUXVlcnkgPSBmdW5jdGlvbihzdHJpbmcsIGVzY2FwZVF1ZXJ5U3BhY2UpIHtcbiAgICBzdHJpbmcgKz0gJyc7XG4gICAgaWYgKGVzY2FwZVF1ZXJ5U3BhY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXNjYXBlUXVlcnlTcGFjZSA9IFVSSS5lc2NhcGVRdWVyeVNwYWNlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gVVJJLmRlY29kZShlc2NhcGVRdWVyeVNwYWNlID8gc3RyaW5nLnJlcGxhY2UoL1xcKy9nLCAnJTIwJykgOiBzdHJpbmcpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgLy8gd2UncmUgbm90IGdvaW5nIHRvIG1lc3Mgd2l0aCB3ZWlyZCBlbmNvZGluZ3MsXG4gICAgICAvLyBnaXZlIHVwIGFuZCByZXR1cm4gdGhlIHVuZGVjb2RlZCBvcmlnaW5hbCBzdHJpbmdcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWVkaWFsaXplL1VSSS5qcy9pc3N1ZXMvODdcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWVkaWFsaXplL1VSSS5qcy9pc3N1ZXMvOTJcbiAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuICB9O1xuICAvLyBnZW5lcmF0ZSBlbmNvZGUvZGVjb2RlIHBhdGggZnVuY3Rpb25zXG4gIHZhciBfcGFydHMgPSB7J2VuY29kZSc6J2VuY29kZScsICdkZWNvZGUnOidkZWNvZGUnfTtcbiAgdmFyIF9wYXJ0O1xuICB2YXIgZ2VuZXJhdGVBY2Nlc3NvciA9IGZ1bmN0aW9uKF9ncm91cCwgX3BhcnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gVVJJW19wYXJ0XShzdHJpbmcgKyAnJykucmVwbGFjZShVUkkuY2hhcmFjdGVyc1tfZ3JvdXBdW19wYXJ0XS5leHByZXNzaW9uLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgcmV0dXJuIFVSSS5jaGFyYWN0ZXJzW19ncm91cF1bX3BhcnRdLm1hcFtjXTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIHdlJ3JlIG5vdCBnb2luZyB0byBtZXNzIHdpdGggd2VpcmQgZW5jb2RpbmdzLFxuICAgICAgICAvLyBnaXZlIHVwIGFuZCByZXR1cm4gdGhlIHVuZGVjb2RlZCBvcmlnaW5hbCBzdHJpbmdcbiAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tZWRpYWxpemUvVVJJLmpzL2lzc3Vlcy84N1xuICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21lZGlhbGl6ZS9VUkkuanMvaXNzdWVzLzkyXG4gICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICBmb3IgKF9wYXJ0IGluIF9wYXJ0cykge1xuICAgIFVSSVtfcGFydCArICdQYXRoU2VnbWVudCddID0gZ2VuZXJhdGVBY2Nlc3NvcigncGF0aG5hbWUnLCBfcGFydHNbX3BhcnRdKTtcbiAgICBVUklbX3BhcnQgKyAnVXJuUGF0aFNlZ21lbnQnXSA9IGdlbmVyYXRlQWNjZXNzb3IoJ3VybnBhdGgnLCBfcGFydHNbX3BhcnRdKTtcbiAgfVxuXG4gIHZhciBnZW5lcmF0ZVNlZ21lbnRlZFBhdGhGdW5jdGlvbiA9IGZ1bmN0aW9uKF9zZXAsIF9jb2RpbmdGdW5jTmFtZSwgX2lubmVyQ29kaW5nRnVuY05hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAvLyBXaHkgcGFzcyBpbiBuYW1lcyBvZiBmdW5jdGlvbnMsIHJhdGhlciB0aGFuIHRoZSBmdW5jdGlvbiBvYmplY3RzIHRoZW1zZWx2ZXM/IFRoZVxuICAgICAgLy8gZGVmaW5pdGlvbnMgb2Ygc29tZSBmdW5jdGlvbnMgKGJ1dCBpbiBwYXJ0aWN1bGFyLCBVUkkuZGVjb2RlKSB3aWxsIG9jY2FzaW9uYWxseSBjaGFuZ2UgZHVlXG4gICAgICAvLyB0byBVUkkuanMgaGF2aW5nIElTTzg4NTkgYW5kIFVuaWNvZGUgbW9kZXMuIFBhc3NpbmcgaW4gdGhlIG5hbWUgYW5kIGdldHRpbmcgaXQgd2lsbCBlbnN1cmVcbiAgICAgIC8vIHRoYXQgdGhlIGZ1bmN0aW9ucyB3ZSB1c2UgaGVyZSBhcmUgXCJmcmVzaFwiLlxuICAgICAgdmFyIGFjdHVhbENvZGluZ0Z1bmM7XG4gICAgICBpZiAoIV9pbm5lckNvZGluZ0Z1bmNOYW1lKSB7XG4gICAgICAgIGFjdHVhbENvZGluZ0Z1bmMgPSBVUklbX2NvZGluZ0Z1bmNOYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdHVhbENvZGluZ0Z1bmMgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gVVJJW19jb2RpbmdGdW5jTmFtZV0oVVJJW19pbm5lckNvZGluZ0Z1bmNOYW1lXShzdHJpbmcpKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNlZ21lbnRzID0gKHN0cmluZyArICcnKS5zcGxpdChfc2VwKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHNlZ21lbnRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNlZ21lbnRzW2ldID0gYWN0dWFsQ29kaW5nRnVuYyhzZWdtZW50c1tpXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWdtZW50cy5qb2luKF9zZXApO1xuICAgIH07XG4gIH07XG5cbiAgLy8gVGhpcyB0YWtlcyBwbGFjZSBvdXRzaWRlIHRoZSBhYm92ZSBsb29wIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCwgZS5nLiwgZW5jb2RlVXJuUGF0aCBmdW5jdGlvbnMuXG4gIFVSSS5kZWNvZGVQYXRoID0gZ2VuZXJhdGVTZWdtZW50ZWRQYXRoRnVuY3Rpb24oJy8nLCAnZGVjb2RlUGF0aFNlZ21lbnQnKTtcbiAgVVJJLmRlY29kZVVyblBhdGggPSBnZW5lcmF0ZVNlZ21lbnRlZFBhdGhGdW5jdGlvbignOicsICdkZWNvZGVVcm5QYXRoU2VnbWVudCcpO1xuICBVUkkucmVjb2RlUGF0aCA9IGdlbmVyYXRlU2VnbWVudGVkUGF0aEZ1bmN0aW9uKCcvJywgJ2VuY29kZVBhdGhTZWdtZW50JywgJ2RlY29kZScpO1xuICBVUkkucmVjb2RlVXJuUGF0aCA9IGdlbmVyYXRlU2VnbWVudGVkUGF0aEZ1bmN0aW9uKCc6JywgJ2VuY29kZVVyblBhdGhTZWdtZW50JywgJ2RlY29kZScpO1xuXG4gIFVSSS5lbmNvZGVSZXNlcnZlZCA9IGdlbmVyYXRlQWNjZXNzb3IoJ3Jlc2VydmVkJywgJ2VuY29kZScpO1xuXG4gIFVSSS5wYXJzZSA9IGZ1bmN0aW9uKHN0cmluZywgcGFydHMpIHtcbiAgICB2YXIgcG9zO1xuICAgIGlmICghcGFydHMpIHtcbiAgICAgIHBhcnRzID0ge307XG4gICAgfVxuICAgIC8vIFtwcm90b2NvbFwiOi8vXCJbdXNlcm5hbWVbXCI6XCJwYXNzd29yZF1cIkBcIl1ob3N0bmFtZVtcIjpcInBvcnRdXCIvXCI/XVtwYXRoXVtcIj9cInF1ZXJ5c3RyaW5nXVtcIiNcImZyYWdtZW50XVxuXG4gICAgLy8gZXh0cmFjdCBmcmFnbWVudFxuICAgIHBvcyA9IHN0cmluZy5pbmRleE9mKCcjJyk7XG4gICAgaWYgKHBvcyA+IC0xKSB7XG4gICAgICAvLyBlc2NhcGluZz9cbiAgICAgIHBhcnRzLmZyYWdtZW50ID0gc3RyaW5nLnN1YnN0cmluZyhwb3MgKyAxKSB8fCBudWxsO1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnN1YnN0cmluZygwLCBwb3MpO1xuICAgIH1cblxuICAgIC8vIGV4dHJhY3QgcXVlcnlcbiAgICBwb3MgPSBzdHJpbmcuaW5kZXhPZignPycpO1xuICAgIGlmIChwb3MgPiAtMSkge1xuICAgICAgLy8gZXNjYXBpbmc/XG4gICAgICBwYXJ0cy5xdWVyeSA9IHN0cmluZy5zdWJzdHJpbmcocG9zICsgMSkgfHwgbnVsbDtcbiAgICAgIHN0cmluZyA9IHN0cmluZy5zdWJzdHJpbmcoMCwgcG9zKTtcbiAgICB9XG5cbiAgICAvLyBleHRyYWN0IHByb3RvY29sXG4gICAgaWYgKHN0cmluZy5zdWJzdHJpbmcoMCwgMikgPT09ICcvLycpIHtcbiAgICAgIC8vIHJlbGF0aXZlLXNjaGVtZVxuICAgICAgcGFydHMucHJvdG9jb2wgPSBudWxsO1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnN1YnN0cmluZygyKTtcbiAgICAgIC8vIGV4dHJhY3QgXCJ1c2VyOnBhc3NAaG9zdDpwb3J0XCJcbiAgICAgIHN0cmluZyA9IFVSSS5wYXJzZUF1dGhvcml0eShzdHJpbmcsIHBhcnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zID0gc3RyaW5nLmluZGV4T2YoJzonKTtcbiAgICAgIGlmIChwb3MgPiAtMSkge1xuICAgICAgICBwYXJ0cy5wcm90b2NvbCA9IHN0cmluZy5zdWJzdHJpbmcoMCwgcG9zKSB8fCBudWxsO1xuICAgICAgICBpZiAocGFydHMucHJvdG9jb2wgJiYgIXBhcnRzLnByb3RvY29sLm1hdGNoKFVSSS5wcm90b2NvbF9leHByZXNzaW9uKSkge1xuICAgICAgICAgIC8vIDogbWF5IGJlIHdpdGhpbiB0aGUgcGF0aFxuICAgICAgICAgIHBhcnRzLnByb3RvY29sID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmluZy5zdWJzdHJpbmcocG9zICsgMSwgcG9zICsgMykgPT09ICcvLycpIHtcbiAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcuc3Vic3RyaW5nKHBvcyArIDMpO1xuXG4gICAgICAgICAgLy8gZXh0cmFjdCBcInVzZXI6cGFzc0Bob3N0OnBvcnRcIlxuICAgICAgICAgIHN0cmluZyA9IFVSSS5wYXJzZUF1dGhvcml0eShzdHJpbmcsIHBhcnRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcuc3Vic3RyaW5nKHBvcyArIDEpO1xuICAgICAgICAgIHBhcnRzLnVybiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB3aGF0J3MgbGVmdCBtdXN0IGJlIHRoZSBwYXRoXG4gICAgcGFydHMucGF0aCA9IHN0cmluZztcblxuICAgIC8vIGFuZCB3ZSdyZSBkb25lXG4gICAgcmV0dXJuIHBhcnRzO1xuICB9O1xuICBVUkkucGFyc2VIb3N0ID0gZnVuY3Rpb24oc3RyaW5nLCBwYXJ0cykge1xuICAgIC8vIENvcHkgY2hyb21lLCBJRSwgb3BlcmEgYmFja3NsYXNoLWhhbmRsaW5nIGJlaGF2aW9yLlxuICAgIC8vIEJhY2sgc2xhc2hlcyBiZWZvcmUgdGhlIHF1ZXJ5IHN0cmluZyBnZXQgY29udmVydGVkIHRvIGZvcndhcmQgc2xhc2hlc1xuICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2Jsb2IvMzg2ZmQyNGY0OWIwZTlkMWE4YTA3NjU5MmE0MDQxNjhmYWVlY2MzNC9saWIvdXJsLmpzI0wxMTUtTDEyNFxuICAgIC8vIFNlZTogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1OTE2XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21lZGlhbGl6ZS9VUkkuanMvcHVsbC8yMzNcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG4gICAgLy8gZXh0cmFjdCBob3N0OnBvcnRcbiAgICB2YXIgcG9zID0gc3RyaW5nLmluZGV4T2YoJy8nKTtcbiAgICB2YXIgYnJhY2tldFBvcztcbiAgICB2YXIgdDtcblxuICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICBwb3MgPSBzdHJpbmcubGVuZ3RoO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuY2hhckF0KDApID09PSAnWycpIHtcbiAgICAgIC8vIElQdjYgaG9zdCAtIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtNm1hbi10ZXh0LWFkZHItcmVwcmVzZW50YXRpb24tMDQjc2VjdGlvbi02XG4gICAgICAvLyBJIGNsYWltIG1vc3QgY2xpZW50IHNvZnR3YXJlIGJyZWFrcyBvbiBJUHY2IGFueXdheXMuIFRvIHNpbXBsaWZ5IHRoaW5ncywgVVJJIG9ubHkgYWNjZXB0c1xuICAgICAgLy8gSVB2Nitwb3J0IGluIHRoZSBmb3JtYXQgWzIwMDE6ZGI4OjoxXTo4MCAoZm9yIHRoZSB0aW1lIGJlaW5nKVxuICAgICAgYnJhY2tldFBvcyA9IHN0cmluZy5pbmRleE9mKCddJyk7XG4gICAgICBwYXJ0cy5ob3N0bmFtZSA9IHN0cmluZy5zdWJzdHJpbmcoMSwgYnJhY2tldFBvcykgfHwgbnVsbDtcbiAgICAgIHBhcnRzLnBvcnQgPSBzdHJpbmcuc3Vic3RyaW5nKGJyYWNrZXRQb3MgKyAyLCBwb3MpIHx8IG51bGw7XG4gICAgICBpZiAocGFydHMucG9ydCA9PT0gJy8nKSB7XG4gICAgICAgIHBhcnRzLnBvcnQgPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZmlyc3RDb2xvbiA9IHN0cmluZy5pbmRleE9mKCc6Jyk7XG4gICAgICB2YXIgZmlyc3RTbGFzaCA9IHN0cmluZy5pbmRleE9mKCcvJyk7XG4gICAgICB2YXIgbmV4dENvbG9uID0gc3RyaW5nLmluZGV4T2YoJzonLCBmaXJzdENvbG9uICsgMSk7XG4gICAgICBpZiAobmV4dENvbG9uICE9PSAtMSAmJiAoZmlyc3RTbGFzaCA9PT0gLTEgfHwgbmV4dENvbG9uIDwgZmlyc3RTbGFzaCkpIHtcbiAgICAgICAgLy8gSVB2NiBob3N0IGNvbnRhaW5zIG11bHRpcGxlIGNvbG9ucyAtIGJ1dCBubyBwb3J0XG4gICAgICAgIC8vIHRoaXMgbm90YXRpb24gaXMgYWN0dWFsbHkgbm90IGFsbG93ZWQgYnkgUkZDIDM5ODYsIGJ1dCB3ZSdyZSBhIGxpYmVyYWwgcGFyc2VyXG4gICAgICAgIHBhcnRzLmhvc3RuYW1lID0gc3RyaW5nLnN1YnN0cmluZygwLCBwb3MpIHx8IG51bGw7XG4gICAgICAgIHBhcnRzLnBvcnQgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdCA9IHN0cmluZy5zdWJzdHJpbmcoMCwgcG9zKS5zcGxpdCgnOicpO1xuICAgICAgICBwYXJ0cy5ob3N0bmFtZSA9IHRbMF0gfHwgbnVsbDtcbiAgICAgICAgcGFydHMucG9ydCA9IHRbMV0gfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGFydHMuaG9zdG5hbWUgJiYgc3RyaW5nLnN1YnN0cmluZyhwb3MpLmNoYXJBdCgwKSAhPT0gJy8nKSB7XG4gICAgICBwb3MrKztcbiAgICAgIHN0cmluZyA9ICcvJyArIHN0cmluZztcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nLnN1YnN0cmluZyhwb3MpIHx8ICcvJztcbiAgfTtcbiAgVVJJLnBhcnNlQXV0aG9yaXR5ID0gZnVuY3Rpb24oc3RyaW5nLCBwYXJ0cykge1xuICAgIHN0cmluZyA9IFVSSS5wYXJzZVVzZXJpbmZvKHN0cmluZywgcGFydHMpO1xuICAgIHJldHVybiBVUkkucGFyc2VIb3N0KHN0cmluZywgcGFydHMpO1xuICB9O1xuICBVUkkucGFyc2VVc2VyaW5mbyA9IGZ1bmN0aW9uKHN0cmluZywgcGFydHMpIHtcbiAgICAvLyBleHRyYWN0IHVzZXJuYW1lOnBhc3N3b3JkXG4gICAgdmFyIGZpcnN0U2xhc2ggPSBzdHJpbmcuaW5kZXhPZignLycpO1xuICAgIHZhciBwb3MgPSBzdHJpbmcubGFzdEluZGV4T2YoJ0AnLCBmaXJzdFNsYXNoID4gLTEgPyBmaXJzdFNsYXNoIDogc3RyaW5nLmxlbmd0aCAtIDEpO1xuICAgIHZhciB0O1xuXG4gICAgLy8gYXV0aG9yaXR5QCBtdXN0IGNvbWUgYmVmb3JlIC9wYXRoXG4gICAgaWYgKHBvcyA+IC0xICYmIChmaXJzdFNsYXNoID09PSAtMSB8fCBwb3MgPCBmaXJzdFNsYXNoKSkge1xuICAgICAgdCA9IHN0cmluZy5zdWJzdHJpbmcoMCwgcG9zKS5zcGxpdCgnOicpO1xuICAgICAgcGFydHMudXNlcm5hbWUgPSB0WzBdID8gVVJJLmRlY29kZSh0WzBdKSA6IG51bGw7XG4gICAgICB0LnNoaWZ0KCk7XG4gICAgICBwYXJ0cy5wYXNzd29yZCA9IHRbMF0gPyBVUkkuZGVjb2RlKHQuam9pbignOicpKSA6IG51bGw7XG4gICAgICBzdHJpbmcgPSBzdHJpbmcuc3Vic3RyaW5nKHBvcyArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJ0cy51c2VybmFtZSA9IG51bGw7XG4gICAgICBwYXJ0cy5wYXNzd29yZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfTtcbiAgVVJJLnBhcnNlUXVlcnkgPSBmdW5jdGlvbihzdHJpbmcsIGVzY2FwZVF1ZXJ5U3BhY2UpIHtcbiAgICBpZiAoIXN0cmluZykge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIC8vIHRocm93IG91dCB0aGUgZnVua3kgYnVzaW5lc3MgLSBcIj9cIltuYW1lXCI9XCJ2YWx1ZVwiJlwiXStcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvJisvZywgJyYnKS5yZXBsYWNlKC9eXFw/KiYqfCYrJC9nLCAnJyk7XG5cbiAgICBpZiAoIXN0cmluZykge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIHZhciBpdGVtcyA9IHt9O1xuICAgIHZhciBzcGxpdHMgPSBzdHJpbmcuc3BsaXQoJyYnKTtcbiAgICB2YXIgbGVuZ3RoID0gc3BsaXRzLmxlbmd0aDtcbiAgICB2YXIgdiwgbmFtZSwgdmFsdWU7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2ID0gc3BsaXRzW2ldLnNwbGl0KCc9Jyk7XG4gICAgICBuYW1lID0gVVJJLmRlY29kZVF1ZXJ5KHYuc2hpZnQoKSwgZXNjYXBlUXVlcnlTcGFjZSk7XG4gICAgICAvLyBubyBcIj1cIiBpcyBudWxsIGFjY29yZGluZyB0byBodHRwOi8vZHZjcy53My5vcmcvaGcvdXJsL3Jhdy1maWxlL3RpcC9PdmVydmlldy5odG1sI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcbiAgICAgIHZhbHVlID0gdi5sZW5ndGggPyBVUkkuZGVjb2RlUXVlcnkodi5qb2luKCc9JyksIGVzY2FwZVF1ZXJ5U3BhY2UpIDogbnVsbDtcblxuICAgICAgaWYgKGhhc093bi5jYWxsKGl0ZW1zLCBuYW1lKSkge1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW1zW25hbWVdID09PSAnc3RyaW5nJyB8fCBpdGVtc1tuYW1lXSA9PT0gbnVsbCkge1xuICAgICAgICAgIGl0ZW1zW25hbWVdID0gW2l0ZW1zW25hbWVdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGl0ZW1zW25hbWVdLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbXM7XG4gIH07XG5cbiAgVVJJLmJ1aWxkID0gZnVuY3Rpb24ocGFydHMpIHtcbiAgICB2YXIgdCA9ICcnO1xuXG4gICAgaWYgKHBhcnRzLnByb3RvY29sKSB7XG4gICAgICB0ICs9IHBhcnRzLnByb3RvY29sICsgJzonO1xuICAgIH1cblxuICAgIGlmICghcGFydHMudXJuICYmICh0IHx8IHBhcnRzLmhvc3RuYW1lKSkge1xuICAgICAgdCArPSAnLy8nO1xuICAgIH1cblxuICAgIHQgKz0gKFVSSS5idWlsZEF1dGhvcml0eShwYXJ0cykgfHwgJycpO1xuXG4gICAgaWYgKHR5cGVvZiBwYXJ0cy5wYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHBhcnRzLnBhdGguY2hhckF0KDApICE9PSAnLycgJiYgdHlwZW9mIHBhcnRzLmhvc3RuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICB0ICs9ICcvJztcbiAgICAgIH1cblxuICAgICAgdCArPSBwYXJ0cy5wYXRoO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcGFydHMucXVlcnkgPT09ICdzdHJpbmcnICYmIHBhcnRzLnF1ZXJ5KSB7XG4gICAgICB0ICs9ICc/JyArIHBhcnRzLnF1ZXJ5O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcGFydHMuZnJhZ21lbnQgPT09ICdzdHJpbmcnICYmIHBhcnRzLmZyYWdtZW50KSB7XG4gICAgICB0ICs9ICcjJyArIHBhcnRzLmZyYWdtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdDtcbiAgfTtcbiAgVVJJLmJ1aWxkSG9zdCA9IGZ1bmN0aW9uKHBhcnRzKSB7XG4gICAgdmFyIHQgPSAnJztcblxuICAgIGlmICghcGFydHMuaG9zdG5hbWUpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9IGVsc2UgaWYgKFVSSS5pcDZfZXhwcmVzc2lvbi50ZXN0KHBhcnRzLmhvc3RuYW1lKSkge1xuICAgICAgdCArPSAnWycgKyBwYXJ0cy5ob3N0bmFtZSArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgdCArPSBwYXJ0cy5ob3N0bmFtZTtcbiAgICB9XG5cbiAgICBpZiAocGFydHMucG9ydCkge1xuICAgICAgdCArPSAnOicgKyBwYXJ0cy5wb3J0O1xuICAgIH1cblxuICAgIHJldHVybiB0O1xuICB9O1xuICBVUkkuYnVpbGRBdXRob3JpdHkgPSBmdW5jdGlvbihwYXJ0cykge1xuICAgIHJldHVybiBVUkkuYnVpbGRVc2VyaW5mbyhwYXJ0cykgKyBVUkkuYnVpbGRIb3N0KHBhcnRzKTtcbiAgfTtcbiAgVVJJLmJ1aWxkVXNlcmluZm8gPSBmdW5jdGlvbihwYXJ0cykge1xuICAgIHZhciB0ID0gJyc7XG5cbiAgICBpZiAocGFydHMudXNlcm5hbWUpIHtcbiAgICAgIHQgKz0gVVJJLmVuY29kZShwYXJ0cy51c2VybmFtZSk7XG5cbiAgICAgIGlmIChwYXJ0cy5wYXNzd29yZCkge1xuICAgICAgICB0ICs9ICc6JyArIFVSSS5lbmNvZGUocGFydHMucGFzc3dvcmQpO1xuICAgICAgfVxuXG4gICAgICB0ICs9ICdAJztcbiAgICB9XG5cbiAgICByZXR1cm4gdDtcbiAgfTtcbiAgVVJJLmJ1aWxkUXVlcnkgPSBmdW5jdGlvbihkYXRhLCBkdXBsaWNhdGVRdWVyeVBhcmFtZXRlcnMsIGVzY2FwZVF1ZXJ5U3BhY2UpIHtcbiAgICAvLyBhY2NvcmRpbmcgdG8gaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzk4NiBvciBodHRwOi8vbGFicy5hcGFjaGUub3JnL3dlYmFyY2gvdXJpL3JmYy9yZmMzOTg2Lmh0bWxcbiAgICAvLyBiZWluZyDCuy0uX34hJCYnKCkqKyw7PTpALz/CqyAlSEVYIGFuZCBhbG51bSBhcmUgYWxsb3dlZFxuICAgIC8vIHRoZSBSRkMgZXhwbGljaXRseSBzdGF0ZXMgPy9mb28gYmVpbmcgYSB2YWxpZCB1c2UgY2FzZSwgbm8gbWVudGlvbiBvZiBwYXJhbWV0ZXIgc3ludGF4IVxuICAgIC8vIFVSSS5qcyB0cmVhdHMgdGhlIHF1ZXJ5IHN0cmluZyBhcyBiZWluZyBhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICAvLyBzZWUgaHR0cDovL3d3dy53My5vcmcvVFIvUkVDLWh0bWw0MC9pbnRlcmFjdC9mb3Jtcy5odG1sI2Zvcm0tY29udGVudC10eXBlXG5cbiAgICB2YXIgdCA9ICcnO1xuICAgIHZhciB1bmlxdWUsIGtleSwgaSwgbGVuZ3RoO1xuICAgIGZvciAoa2V5IGluIGRhdGEpIHtcbiAgICAgIGlmIChoYXNPd24uY2FsbChkYXRhLCBrZXkpICYmIGtleSkge1xuICAgICAgICBpZiAoaXNBcnJheShkYXRhW2tleV0pKSB7XG4gICAgICAgICAgdW5pcXVlID0ge307XG4gICAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gZGF0YVtrZXldLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZGF0YVtrZXldW2ldICE9PSB1bmRlZmluZWQgJiYgdW5pcXVlW2RhdGFba2V5XVtpXSArICcnXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHQgKz0gJyYnICsgVVJJLmJ1aWxkUXVlcnlQYXJhbWV0ZXIoa2V5LCBkYXRhW2tleV1baV0sIGVzY2FwZVF1ZXJ5U3BhY2UpO1xuICAgICAgICAgICAgICBpZiAoZHVwbGljYXRlUXVlcnlQYXJhbWV0ZXJzICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdW5pcXVlW2RhdGFba2V5XVtpXSArICcnXSA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0ICs9ICcmJyArIFVSSS5idWlsZFF1ZXJ5UGFyYW1ldGVyKGtleSwgZGF0YVtrZXldLCBlc2NhcGVRdWVyeVNwYWNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0LnN1YnN0cmluZygxKTtcbiAgfTtcbiAgVVJJLmJ1aWxkUXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgZXNjYXBlUXVlcnlTcGFjZSkge1xuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL1JFQy1odG1sNDAvaW50ZXJhY3QvZm9ybXMuaHRtbCNmb3JtLWNvbnRlbnQtdHlwZSAtLSBhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICAvLyBkb24ndCBhcHBlbmQgXCI9XCIgZm9yIG51bGwgdmFsdWVzLCBhY2NvcmRpbmcgdG8gaHR0cDovL2R2Y3MudzMub3JnL2hnL3VybC9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCN1cmwtcGFyYW1ldGVyLXNlcmlhbGl6YXRpb25cbiAgICByZXR1cm4gVVJJLmVuY29kZVF1ZXJ5KG5hbWUsIGVzY2FwZVF1ZXJ5U3BhY2UpICsgKHZhbHVlICE9PSBudWxsID8gJz0nICsgVVJJLmVuY29kZVF1ZXJ5KHZhbHVlLCBlc2NhcGVRdWVyeVNwYWNlKSA6ICcnKTtcbiAgfTtcblxuICBVUkkuYWRkUXVlcnkgPSBmdW5jdGlvbihkYXRhLCBuYW1lLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIGlmIChoYXNPd24uY2FsbChuYW1lLCBrZXkpKSB7XG4gICAgICAgICAgVVJJLmFkZFF1ZXJ5KGRhdGEsIGtleSwgbmFtZVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoZGF0YVtuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRhdGFbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGF0YVtuYW1lXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGF0YVtuYW1lXSA9IFtkYXRhW25hbWVdXTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IFt2YWx1ZV07XG4gICAgICB9XG5cbiAgICAgIGRhdGFbbmFtZV0gPSAoZGF0YVtuYW1lXSB8fCBbXSkuY29uY2F0KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVVJJLmFkZFF1ZXJ5KCkgYWNjZXB0cyBhbiBvYmplY3QsIHN0cmluZyBhcyB0aGUgbmFtZSBwYXJhbWV0ZXInKTtcbiAgICB9XG4gIH07XG4gIFVSSS5yZW1vdmVRdWVyeSA9IGZ1bmN0aW9uKGRhdGEsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIGksIGxlbmd0aCwga2V5O1xuXG4gICAgaWYgKGlzQXJyYXkobmFtZSkpIHtcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IG5hbWUubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGF0YVtuYW1lW2ldXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGdldFR5cGUobmFtZSkgPT09ICdSZWdFeHAnKSB7XG4gICAgICBmb3IgKGtleSBpbiBkYXRhKSB7XG4gICAgICAgIGlmIChuYW1lLnRlc3Qoa2V5KSkge1xuICAgICAgICAgIGRhdGFba2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKGtleSBpbiBuYW1lKSB7XG4gICAgICAgIGlmIChoYXNPd24uY2FsbChuYW1lLCBrZXkpKSB7XG4gICAgICAgICAgVVJJLnJlbW92ZVF1ZXJ5KGRhdGEsIGtleSwgbmFtZVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoZ2V0VHlwZSh2YWx1ZSkgPT09ICdSZWdFeHAnKSB7XG4gICAgICAgICAgaWYgKCFpc0FycmF5KGRhdGFbbmFtZV0pICYmIHZhbHVlLnRlc3QoZGF0YVtuYW1lXSkpIHtcbiAgICAgICAgICAgIGRhdGFbbmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGFbbmFtZV0gPSBmaWx0ZXJBcnJheVZhbHVlcyhkYXRhW25hbWVdLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRhdGFbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgZGF0YVtuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGRhdGFbbmFtZV0pKSB7XG4gICAgICAgICAgZGF0YVtuYW1lXSA9IGZpbHRlckFycmF5VmFsdWVzKGRhdGFbbmFtZV0sIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YVtuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVVJJLnJlbW92ZVF1ZXJ5KCkgYWNjZXB0cyBhbiBvYmplY3QsIHN0cmluZywgUmVnRXhwIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXInKTtcbiAgICB9XG4gIH07XG4gIFVSSS5oYXNRdWVyeSA9IGZ1bmN0aW9uKGRhdGEsIG5hbWUsIHZhbHVlLCB3aXRoaW5BcnJheSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIGlmIChoYXNPd24uY2FsbChuYW1lLCBrZXkpKSB7XG4gICAgICAgICAgaWYgKCFVUkkuaGFzUXVlcnkoZGF0YSwga2V5LCBuYW1lW2tleV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVUkkuaGFzUXVlcnkoKSBhY2NlcHRzIGFuIG9iamVjdCwgc3RyaW5nIGFzIHRoZSBuYW1lIHBhcmFtZXRlcicpO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZ2V0VHlwZSh2YWx1ZSkpIHtcbiAgICAgIGNhc2UgJ1VuZGVmaW5lZCc6XG4gICAgICAgIC8vIHRydWUgaWYgZXhpc3RzIChidXQgbWF5IGJlIGVtcHR5KVxuICAgICAgICByZXR1cm4gbmFtZSBpbiBkYXRhOyAvLyBkYXRhW25hbWVdICE9PSB1bmRlZmluZWQ7XG5cbiAgICAgIGNhc2UgJ0Jvb2xlYW4nOlxuICAgICAgICAvLyB0cnVlIGlmIGV4aXN0cyBhbmQgbm9uLWVtcHR5XG4gICAgICAgIHZhciBfYm9vbHkgPSBCb29sZWFuKGlzQXJyYXkoZGF0YVtuYW1lXSkgPyBkYXRhW25hbWVdLmxlbmd0aCA6IGRhdGFbbmFtZV0pO1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IF9ib29seTtcblxuICAgICAgY2FzZSAnRnVuY3Rpb24nOlxuICAgICAgICAvLyBhbGxvdyBjb21wbGV4IGNvbXBhcmlzb25cbiAgICAgICAgcmV0dXJuICEhdmFsdWUoZGF0YVtuYW1lXSwgbmFtZSwgZGF0YSk7XG5cbiAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgaWYgKCFpc0FycmF5KGRhdGFbbmFtZV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9wID0gd2l0aGluQXJyYXkgPyBhcnJheUNvbnRhaW5zIDogYXJyYXlzRXF1YWw7XG4gICAgICAgIHJldHVybiBvcChkYXRhW25hbWVdLCB2YWx1ZSk7XG5cbiAgICAgIGNhc2UgJ1JlZ0V4cCc6XG4gICAgICAgIGlmICghaXNBcnJheShkYXRhW25hbWVdKSkge1xuICAgICAgICAgIHJldHVybiBCb29sZWFuKGRhdGFbbmFtZV0gJiYgZGF0YVtuYW1lXS5tYXRjaCh2YWx1ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF3aXRoaW5BcnJheSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnJheUNvbnRhaW5zKGRhdGFbbmFtZV0sIHZhbHVlKTtcblxuICAgICAgY2FzZSAnTnVtYmVyJzpcbiAgICAgICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlICdTdHJpbmcnOlxuICAgICAgICBpZiAoIWlzQXJyYXkoZGF0YVtuYW1lXSkpIHtcbiAgICAgICAgICByZXR1cm4gZGF0YVtuYW1lXSA9PT0gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXdpdGhpbkFycmF5KSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycmF5Q29udGFpbnMoZGF0YVtuYW1lXSwgdmFsdWUpO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVUkkuaGFzUXVlcnkoKSBhY2NlcHRzIHVuZGVmaW5lZCwgYm9vbGVhbiwgc3RyaW5nLCBudW1iZXIsIFJlZ0V4cCwgRnVuY3Rpb24gYXMgdGhlIHZhbHVlIHBhcmFtZXRlcicpO1xuICAgIH1cbiAgfTtcblxuXG4gIFVSSS5jb21tb25QYXRoID0gZnVuY3Rpb24ob25lLCB0d28pIHtcbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5taW4ob25lLmxlbmd0aCwgdHdvLmxlbmd0aCk7XG4gICAgdmFyIHBvcztcblxuICAgIC8vIGZpbmQgZmlyc3Qgbm9uLW1hdGNoaW5nIGNoYXJhY3RlclxuICAgIGZvciAocG9zID0gMDsgcG9zIDwgbGVuZ3RoOyBwb3MrKykge1xuICAgICAgaWYgKG9uZS5jaGFyQXQocG9zKSAhPT0gdHdvLmNoYXJBdChwb3MpKSB7XG4gICAgICAgIHBvcy0tO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zIDwgMSkge1xuICAgICAgcmV0dXJuIG9uZS5jaGFyQXQoMCkgPT09IHR3by5jaGFyQXQoMCkgJiYgb25lLmNoYXJBdCgwKSA9PT0gJy8nID8gJy8nIDogJyc7XG4gICAgfVxuXG4gICAgLy8gcmV2ZXJ0IHRvIGxhc3QgL1xuICAgIGlmIChvbmUuY2hhckF0KHBvcykgIT09ICcvJyB8fCB0d28uY2hhckF0KHBvcykgIT09ICcvJykge1xuICAgICAgcG9zID0gb25lLnN1YnN0cmluZygwLCBwb3MpLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9uZS5zdWJzdHJpbmcoMCwgcG9zICsgMSk7XG4gIH07XG5cbiAgVVJJLndpdGhpblN0cmluZyA9IGZ1bmN0aW9uKHN0cmluZywgY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBfc3RhcnQgPSBvcHRpb25zLnN0YXJ0IHx8IFVSSS5maW5kVXJpLnN0YXJ0O1xuICAgIHZhciBfZW5kID0gb3B0aW9ucy5lbmQgfHwgVVJJLmZpbmRVcmkuZW5kO1xuICAgIHZhciBfdHJpbSA9IG9wdGlvbnMudHJpbSB8fCBVUkkuZmluZFVyaS50cmltO1xuICAgIHZhciBfYXR0cmlidXRlT3BlbiA9IC9bYS16MC05LV09W1wiJ10/JC9pO1xuXG4gICAgX3N0YXJ0Lmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciBtYXRjaCA9IF9zdGFydC5leGVjKHN0cmluZyk7XG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3RhcnQgPSBtYXRjaC5pbmRleDtcbiAgICAgIGlmIChvcHRpb25zLmlnbm9yZUh0bWwpIHtcbiAgICAgICAgLy8gYXR0cmlidXQoZT1bXCInXT8kKVxuICAgICAgICB2YXIgYXR0cmlidXRlT3BlbiA9IHN0cmluZy5zbGljZShNYXRoLm1heChzdGFydCAtIDMsIDApLCBzdGFydCk7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVPcGVuICYmIF9hdHRyaWJ1dGVPcGVuLnRlc3QoYXR0cmlidXRlT3BlbikpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgZW5kID0gc3RhcnQgKyBzdHJpbmcuc2xpY2Uoc3RhcnQpLnNlYXJjaChfZW5kKTtcbiAgICAgIHZhciBzbGljZSA9IHN0cmluZy5zbGljZShzdGFydCwgZW5kKS5yZXBsYWNlKF90cmltLCAnJyk7XG4gICAgICBpZiAob3B0aW9ucy5pZ25vcmUgJiYgb3B0aW9ucy5pZ25vcmUudGVzdChzbGljZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGVuZCA9IHN0YXJ0ICsgc2xpY2UubGVuZ3RoO1xuICAgICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrKHNsaWNlLCBzdGFydCwgZW5kLCBzdHJpbmcpO1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKDAsIHN0YXJ0KSArIHJlc3VsdCArIHN0cmluZy5zbGljZShlbmQpO1xuICAgICAgX3N0YXJ0Lmxhc3RJbmRleCA9IHN0YXJ0ICsgcmVzdWx0Lmxlbmd0aDtcbiAgICB9XG5cbiAgICBfc3RhcnQubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gc3RyaW5nO1xuICB9O1xuXG4gIFVSSS5lbnN1cmVWYWxpZEhvc3RuYW1lID0gZnVuY3Rpb24odikge1xuICAgIC8vIFRoZW9yZXRpY2FsbHkgVVJJcyBhbGxvdyBwZXJjZW50LWVuY29kaW5nIGluIEhvc3RuYW1lcyAoYWNjb3JkaW5nIHRvIFJGQyAzOTg2KVxuICAgIC8vIHRoZXkgYXJlIG5vdCBwYXJ0IG9mIEROUyBhbmQgdGhlcmVmb3JlIGlnbm9yZWQgYnkgVVJJLmpzXG5cbiAgICBpZiAodi5tYXRjaChVUkkuaW52YWxpZF9ob3N0bmFtZV9jaGFyYWN0ZXJzKSkge1xuICAgICAgLy8gdGVzdCBwdW55Y29kZVxuICAgICAgaWYgKCFwdW55Y29kZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdIb3N0bmFtZSBcIicgKyB2ICsgJ1wiIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3RoZXIgdGhhbiBbQS1aMC05Li1dIGFuZCBQdW55Y29kZS5qcyBpcyBub3QgYXZhaWxhYmxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwdW55Y29kZS50b0FTQ0lJKHYpLm1hdGNoKFVSSS5pbnZhbGlkX2hvc3RuYW1lX2NoYXJhY3RlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hvc3RuYW1lIFwiJyArIHYgKyAnXCIgY29udGFpbnMgY2hhcmFjdGVycyBvdGhlciB0aGFuIFtBLVowLTkuLV0nKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gbm9Db25mbGljdFxuICBVUkkubm9Db25mbGljdCA9IGZ1bmN0aW9uKHJlbW92ZUFsbCkge1xuICAgIGlmIChyZW1vdmVBbGwpIHtcbiAgICAgIHZhciB1bmNvbmZsaWN0ZWQgPSB7XG4gICAgICAgIFVSSTogdGhpcy5ub0NvbmZsaWN0KClcbiAgICAgIH07XG5cbiAgICAgIGlmIChyb290LlVSSVRlbXBsYXRlICYmIHR5cGVvZiByb290LlVSSVRlbXBsYXRlLm5vQ29uZmxpY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdW5jb25mbGljdGVkLlVSSVRlbXBsYXRlID0gcm9vdC5VUklUZW1wbGF0ZS5ub0NvbmZsaWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290LklQdjYgJiYgdHlwZW9mIHJvb3QuSVB2Ni5ub0NvbmZsaWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHVuY29uZmxpY3RlZC5JUHY2ID0gcm9vdC5JUHY2Lm5vQ29uZmxpY3QoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJvb3QuU2Vjb25kTGV2ZWxEb21haW5zICYmIHR5cGVvZiByb290LlNlY29uZExldmVsRG9tYWlucy5ub0NvbmZsaWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHVuY29uZmxpY3RlZC5TZWNvbmRMZXZlbERvbWFpbnMgPSByb290LlNlY29uZExldmVsRG9tYWlucy5ub0NvbmZsaWN0KCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1bmNvbmZsaWN0ZWQ7XG4gICAgfSBlbHNlIGlmIChyb290LlVSSSA9PT0gdGhpcykge1xuICAgICAgcm9vdC5VUkkgPSBfVVJJO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHAuYnVpbGQgPSBmdW5jdGlvbihkZWZlckJ1aWxkKSB7XG4gICAgaWYgKGRlZmVyQnVpbGQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuX2RlZmVycmVkX2J1aWxkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGRlZmVyQnVpbGQgPT09IHVuZGVmaW5lZCB8fCB0aGlzLl9kZWZlcnJlZF9idWlsZCkge1xuICAgICAgdGhpcy5fc3RyaW5nID0gVVJJLmJ1aWxkKHRoaXMuX3BhcnRzKTtcbiAgICAgIHRoaXMuX2RlZmVycmVkX2J1aWxkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgcC5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVVJJKHRoaXMpO1xuICB9O1xuXG4gIHAudmFsdWVPZiA9IHAudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5idWlsZChmYWxzZSkuX3N0cmluZztcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlU2ltcGxlQWNjZXNzb3IoX3BhcnQpe1xuICAgIHJldHVybiBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFydHNbX3BhcnRdIHx8ICcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcGFydHNbX3BhcnRdID0gdiB8fCBudWxsO1xuICAgICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmF0ZVByZWZpeEFjY2Vzc29yKF9wYXJ0LCBfa2V5KXtcbiAgICByZXR1cm4gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcnRzW19wYXJ0XSB8fCAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgdiA9IHYgKyAnJztcbiAgICAgICAgICBpZiAodi5jaGFyQXQoMCkgPT09IF9rZXkpIHtcbiAgICAgICAgICAgIHYgPSB2LnN1YnN0cmluZygxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wYXJ0c1tfcGFydF0gPSB2O1xuICAgICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBwLnByb3RvY29sID0gZ2VuZXJhdGVTaW1wbGVBY2Nlc3NvcigncHJvdG9jb2wnKTtcbiAgcC51c2VybmFtZSA9IGdlbmVyYXRlU2ltcGxlQWNjZXNzb3IoJ3VzZXJuYW1lJyk7XG4gIHAucGFzc3dvcmQgPSBnZW5lcmF0ZVNpbXBsZUFjY2Vzc29yKCdwYXNzd29yZCcpO1xuICBwLmhvc3RuYW1lID0gZ2VuZXJhdGVTaW1wbGVBY2Nlc3NvcignaG9zdG5hbWUnKTtcbiAgcC5wb3J0ID0gZ2VuZXJhdGVTaW1wbGVBY2Nlc3NvcigncG9ydCcpO1xuICBwLnF1ZXJ5ID0gZ2VuZXJhdGVQcmVmaXhBY2Nlc3NvcigncXVlcnknLCAnPycpO1xuICBwLmZyYWdtZW50ID0gZ2VuZXJhdGVQcmVmaXhBY2Nlc3NvcignZnJhZ21lbnQnLCAnIycpO1xuXG4gIHAuc2VhcmNoID0gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICB2YXIgdCA9IHRoaXMucXVlcnkodiwgYnVpbGQpO1xuICAgIHJldHVybiB0eXBlb2YgdCA9PT0gJ3N0cmluZycgJiYgdC5sZW5ndGggPyAoJz8nICsgdCkgOiB0O1xuICB9O1xuICBwLmhhc2ggPSBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgIHZhciB0ID0gdGhpcy5mcmFnbWVudCh2LCBidWlsZCk7XG4gICAgcmV0dXJuIHR5cGVvZiB0ID09PSAnc3RyaW5nJyAmJiB0Lmxlbmd0aCA/ICgnIycgKyB0KSA6IHQ7XG4gIH07XG5cbiAgcC5wYXRobmFtZSA9IGZ1bmN0aW9uKHYsIGJ1aWxkKSB7XG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCB8fCB2ID09PSB0cnVlKSB7XG4gICAgICB2YXIgcmVzID0gdGhpcy5fcGFydHMucGF0aCB8fCAodGhpcy5fcGFydHMuaG9zdG5hbWUgPyAnLycgOiAnJyk7XG4gICAgICByZXR1cm4gdiA/ICh0aGlzLl9wYXJ0cy51cm4gPyBVUkkuZGVjb2RlVXJuUGF0aCA6IFVSSS5kZWNvZGVQYXRoKShyZXMpIDogcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5fcGFydHMudXJuKSB7XG4gICAgICAgIHRoaXMuX3BhcnRzLnBhdGggPSB2ID8gVVJJLnJlY29kZVVyblBhdGgodikgOiAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3BhcnRzLnBhdGggPSB2ID8gVVJJLnJlY29kZVBhdGgodikgOiAnLyc7XG4gICAgICB9XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG4gIHAucGF0aCA9IHAucGF0aG5hbWU7XG4gIHAuaHJlZiA9IGZ1bmN0aW9uKGhyZWYsIGJ1aWxkKSB7XG4gICAgdmFyIGtleTtcblxuICAgIGlmIChocmVmID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3RyaW5nID0gJyc7XG4gICAgdGhpcy5fcGFydHMgPSBVUkkuX3BhcnRzKCk7XG5cbiAgICB2YXIgX1VSSSA9IGhyZWYgaW5zdGFuY2VvZiBVUkk7XG4gICAgdmFyIF9vYmplY3QgPSB0eXBlb2YgaHJlZiA9PT0gJ29iamVjdCcgJiYgKGhyZWYuaG9zdG5hbWUgfHwgaHJlZi5wYXRoIHx8IGhyZWYucGF0aG5hbWUpO1xuICAgIGlmIChocmVmLm5vZGVOYW1lKSB7XG4gICAgICB2YXIgYXR0cmlidXRlID0gVVJJLmdldERvbUF0dHJpYnV0ZShocmVmKTtcbiAgICAgIGhyZWYgPSBocmVmW2F0dHJpYnV0ZV0gfHwgJyc7XG4gICAgICBfb2JqZWN0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gd2luZG93LmxvY2F0aW9uIGlzIHJlcG9ydGVkIHRvIGJlIGFuIG9iamVjdCwgYnV0IGl0J3Mgbm90IHRoZSBzb3J0XG4gICAgLy8gb2Ygb2JqZWN0IHdlJ3JlIGxvb2tpbmcgZm9yOlxuICAgIC8vICogbG9jYXRpb24ucHJvdG9jb2wgZW5kcyB3aXRoIGEgY29sb25cbiAgICAvLyAqIGxvY2F0aW9uLnF1ZXJ5ICE9IG9iamVjdC5zZWFyY2hcbiAgICAvLyAqIGxvY2F0aW9uLmhhc2ggIT0gb2JqZWN0LmZyYWdtZW50XG4gICAgLy8gc2ltcGx5IHNlcmlhbGl6aW5nIHRoZSB1bmtub3duIG9iamVjdCBzaG91bGQgZG8gdGhlIHRyaWNrXG4gICAgLy8gKGZvciBsb2NhdGlvbiwgbm90IGZvciBldmVyeXRoaW5nLi4uKVxuICAgIGlmICghX1VSSSAmJiBfb2JqZWN0ICYmIGhyZWYucGF0aG5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaHJlZiA9IGhyZWYudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGhyZWYgPT09ICdzdHJpbmcnIHx8IGhyZWYgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgIHRoaXMuX3BhcnRzID0gVVJJLnBhcnNlKFN0cmluZyhocmVmKSwgdGhpcy5fcGFydHMpO1xuICAgIH0gZWxzZSBpZiAoX1VSSSB8fCBfb2JqZWN0KSB7XG4gICAgICB2YXIgc3JjID0gX1VSSSA/IGhyZWYuX3BhcnRzIDogaHJlZjtcbiAgICAgIGZvciAoa2V5IGluIHNyYykge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwodGhpcy5fcGFydHMsIGtleSkpIHtcbiAgICAgICAgICB0aGlzLl9wYXJ0c1trZXldID0gc3JjW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBpbnB1dCcpO1xuICAgIH1cblxuICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBpZGVudGlmaWNhdGlvbiBhY2Nlc3NvcnNcbiAgcC5pcyA9IGZ1bmN0aW9uKHdoYXQpIHtcbiAgICB2YXIgaXAgPSBmYWxzZTtcbiAgICB2YXIgaXA0ID0gZmFsc2U7XG4gICAgdmFyIGlwNiA9IGZhbHNlO1xuICAgIHZhciBuYW1lID0gZmFsc2U7XG4gICAgdmFyIHNsZCA9IGZhbHNlO1xuICAgIHZhciBpZG4gPSBmYWxzZTtcbiAgICB2YXIgcHVueWNvZGUgPSBmYWxzZTtcbiAgICB2YXIgcmVsYXRpdmUgPSAhdGhpcy5fcGFydHMudXJuO1xuXG4gICAgaWYgKHRoaXMuX3BhcnRzLmhvc3RuYW1lKSB7XG4gICAgICByZWxhdGl2ZSA9IGZhbHNlO1xuICAgICAgaXA0ID0gVVJJLmlwNF9leHByZXNzaW9uLnRlc3QodGhpcy5fcGFydHMuaG9zdG5hbWUpO1xuICAgICAgaXA2ID0gVVJJLmlwNl9leHByZXNzaW9uLnRlc3QodGhpcy5fcGFydHMuaG9zdG5hbWUpO1xuICAgICAgaXAgPSBpcDQgfHwgaXA2O1xuICAgICAgbmFtZSA9ICFpcDtcbiAgICAgIHNsZCA9IG5hbWUgJiYgU0xEICYmIFNMRC5oYXModGhpcy5fcGFydHMuaG9zdG5hbWUpO1xuICAgICAgaWRuID0gbmFtZSAmJiBVUkkuaWRuX2V4cHJlc3Npb24udGVzdCh0aGlzLl9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICBwdW55Y29kZSA9IG5hbWUgJiYgVVJJLnB1bnljb2RlX2V4cHJlc3Npb24udGVzdCh0aGlzLl9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh3aGF0LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgJ3JlbGF0aXZlJzpcbiAgICAgICAgcmV0dXJuIHJlbGF0aXZlO1xuXG4gICAgICBjYXNlICdhYnNvbHV0ZSc6XG4gICAgICAgIHJldHVybiAhcmVsYXRpdmU7XG5cbiAgICAgIC8vIGhvc3RuYW1lIGlkZW50aWZpY2F0aW9uXG4gICAgICBjYXNlICdkb21haW4nOlxuICAgICAgY2FzZSAnbmFtZSc6XG4gICAgICAgIHJldHVybiBuYW1lO1xuXG4gICAgICBjYXNlICdzbGQnOlxuICAgICAgICByZXR1cm4gc2xkO1xuXG4gICAgICBjYXNlICdpcCc6XG4gICAgICAgIHJldHVybiBpcDtcblxuICAgICAgY2FzZSAnaXA0JzpcbiAgICAgIGNhc2UgJ2lwdjQnOlxuICAgICAgY2FzZSAnaW5ldDQnOlxuICAgICAgICByZXR1cm4gaXA0O1xuXG4gICAgICBjYXNlICdpcDYnOlxuICAgICAgY2FzZSAnaXB2Nic6XG4gICAgICBjYXNlICdpbmV0Nic6XG4gICAgICAgIHJldHVybiBpcDY7XG5cbiAgICAgIGNhc2UgJ2lkbic6XG4gICAgICAgIHJldHVybiBpZG47XG5cbiAgICAgIGNhc2UgJ3VybCc6XG4gICAgICAgIHJldHVybiAhdGhpcy5fcGFydHMudXJuO1xuXG4gICAgICBjYXNlICd1cm4nOlxuICAgICAgICByZXR1cm4gISF0aGlzLl9wYXJ0cy51cm47XG5cbiAgICAgIGNhc2UgJ3B1bnljb2RlJzpcbiAgICAgICAgcmV0dXJuIHB1bnljb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8vIGNvbXBvbmVudCBzcGVjaWZpYyBpbnB1dCB2YWxpZGF0aW9uXG4gIHZhciBfcHJvdG9jb2wgPSBwLnByb3RvY29sO1xuICB2YXIgX3BvcnQgPSBwLnBvcnQ7XG4gIHZhciBfaG9zdG5hbWUgPSBwLmhvc3RuYW1lO1xuXG4gIHAucHJvdG9jb2wgPSBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh2KSB7XG4gICAgICAgIC8vIGFjY2VwdCB0cmFpbGluZyA6Ly9cbiAgICAgICAgdiA9IHYucmVwbGFjZSgvOihcXC9cXC8pPyQvLCAnJyk7XG5cbiAgICAgICAgaWYgKCF2Lm1hdGNoKFVSSS5wcm90b2NvbF9leHByZXNzaW9uKSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb3RvY29sIFwiJyArIHYgKyAnXCIgY29udGFpbnMgY2hhcmFjdGVycyBvdGhlciB0aGFuIFtBLVowLTkuKy1dIG9yIGRvZXNuXFwndCBzdGFydCB3aXRoIFtBLVpdJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9wcm90b2NvbC5jYWxsKHRoaXMsIHYsIGJ1aWxkKTtcbiAgfTtcbiAgcC5zY2hlbWUgPSBwLnByb3RvY29sO1xuICBwLnBvcnQgPSBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgIGlmICh0aGlzLl9wYXJ0cy51cm4pIHtcbiAgICAgIHJldHVybiB2ID09PSB1bmRlZmluZWQgPyAnJyA6IHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHYgPT09IDApIHtcbiAgICAgICAgdiA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmICh2KSB7XG4gICAgICAgIHYgKz0gJyc7XG4gICAgICAgIGlmICh2LmNoYXJBdCgwKSA9PT0gJzonKSB7XG4gICAgICAgICAgdiA9IHYuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYubWF0Y2goL1teMC05XS8pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUG9ydCBcIicgKyB2ICsgJ1wiIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3RoZXIgdGhhbiBbMC05XScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcG9ydC5jYWxsKHRoaXMsIHYsIGJ1aWxkKTtcbiAgfTtcbiAgcC5ob3N0bmFtZSA9IGZ1bmN0aW9uKHYsIGJ1aWxkKSB7XG4gICAgaWYgKHRoaXMuX3BhcnRzLnVybikge1xuICAgICAgcmV0dXJuIHYgPT09IHVuZGVmaW5lZCA/ICcnIDogdGhpcztcbiAgICB9XG5cbiAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YXIgeCA9IHt9O1xuICAgICAgdmFyIHJlcyA9IFVSSS5wYXJzZUhvc3QodiwgeCk7XG4gICAgICBpZiAocmVzICE9PSAnLycpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSG9zdG5hbWUgXCInICsgdiArICdcIiBjb250YWlucyBjaGFyYWN0ZXJzIG90aGVyIHRoYW4gW0EtWjAtOS4tXScpO1xuICAgICAgfVxuXG4gICAgICB2ID0geC5ob3N0bmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIF9ob3N0bmFtZS5jYWxsKHRoaXMsIHYsIGJ1aWxkKTtcbiAgfTtcblxuICAvLyBjb21wb3VuZCBhY2Nlc3NvcnNcbiAgcC5ob3N0ID0gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICBpZiAodGhpcy5fcGFydHMudXJuKSB7XG4gICAgICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkID8gJycgOiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wYXJ0cy5ob3N0bmFtZSA/IFVSSS5idWlsZEhvc3QodGhpcy5fcGFydHMpIDogJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByZXMgPSBVUkkucGFyc2VIb3N0KHYsIHRoaXMuX3BhcnRzKTtcbiAgICAgIGlmIChyZXMgIT09ICcvJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdIb3N0bmFtZSBcIicgKyB2ICsgJ1wiIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3RoZXIgdGhhbiBbQS1aMC05Li1dJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcbiAgcC5hdXRob3JpdHkgPSBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgIGlmICh0aGlzLl9wYXJ0cy51cm4pIHtcbiAgICAgIHJldHVybiB2ID09PSB1bmRlZmluZWQgPyAnJyA6IHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcnRzLmhvc3RuYW1lID8gVVJJLmJ1aWxkQXV0aG9yaXR5KHRoaXMuX3BhcnRzKSA6ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcmVzID0gVVJJLnBhcnNlQXV0aG9yaXR5KHYsIHRoaXMuX3BhcnRzKTtcbiAgICAgIGlmIChyZXMgIT09ICcvJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdIb3N0bmFtZSBcIicgKyB2ICsgJ1wiIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3RoZXIgdGhhbiBbQS1aMC05Li1dJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcbiAgcC51c2VyaW5mbyA9IGZ1bmN0aW9uKHYsIGJ1aWxkKSB7XG4gICAgaWYgKHRoaXMuX3BhcnRzLnVybikge1xuICAgICAgcmV0dXJuIHYgPT09IHVuZGVmaW5lZCA/ICcnIDogdGhpcztcbiAgICB9XG5cbiAgICBpZiAodiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoIXRoaXMuX3BhcnRzLnVzZXJuYW1lKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgdmFyIHQgPSBVUkkuYnVpbGRVc2VyaW5mbyh0aGlzLl9wYXJ0cyk7XG4gICAgICByZXR1cm4gdC5zdWJzdHJpbmcoMCwgdC5sZW5ndGggLTEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodlt2Lmxlbmd0aC0xXSAhPT0gJ0AnKSB7XG4gICAgICAgIHYgKz0gJ0AnO1xuICAgICAgfVxuXG4gICAgICBVUkkucGFyc2VVc2VyaW5mbyh2LCB0aGlzLl9wYXJ0cyk7XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG4gIHAucmVzb3VyY2UgPSBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgIHZhciBwYXJ0cztcblxuICAgIGlmICh2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhdGgoKSArIHRoaXMuc2VhcmNoKCkgKyB0aGlzLmhhc2goKTtcbiAgICB9XG5cbiAgICBwYXJ0cyA9IFVSSS5wYXJzZSh2KTtcbiAgICB0aGlzLl9wYXJ0cy5wYXRoID0gcGFydHMucGF0aDtcbiAgICB0aGlzLl9wYXJ0cy5xdWVyeSA9IHBhcnRzLnF1ZXJ5O1xuICAgIHRoaXMuX3BhcnRzLmZyYWdtZW50ID0gcGFydHMuZnJhZ21lbnQ7XG4gICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIGZyYWN0aW9uIGFjY2Vzc29yc1xuICBwLnN1YmRvbWFpbiA9IGZ1bmN0aW9uKHYsIGJ1aWxkKSB7XG4gICAgaWYgKHRoaXMuX3BhcnRzLnVybikge1xuICAgICAgcmV0dXJuIHYgPT09IHVuZGVmaW5lZCA/ICcnIDogdGhpcztcbiAgICB9XG5cbiAgICAvLyBjb252ZW5pZW5jZSwgcmV0dXJuIFwid3d3XCIgZnJvbSBcInd3dy5leGFtcGxlLm9yZ1wiXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCF0aGlzLl9wYXJ0cy5ob3N0bmFtZSB8fCB0aGlzLmlzKCdJUCcpKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgLy8gZ3JhYiBkb21haW4gYW5kIGFkZCBhbm90aGVyIHNlZ21lbnRcbiAgICAgIHZhciBlbmQgPSB0aGlzLl9wYXJ0cy5ob3N0bmFtZS5sZW5ndGggLSB0aGlzLmRvbWFpbigpLmxlbmd0aCAtIDE7XG4gICAgICByZXR1cm4gdGhpcy5fcGFydHMuaG9zdG5hbWUuc3Vic3RyaW5nKDAsIGVuZCkgfHwgJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBlID0gdGhpcy5fcGFydHMuaG9zdG5hbWUubGVuZ3RoIC0gdGhpcy5kb21haW4oKS5sZW5ndGg7XG4gICAgICB2YXIgc3ViID0gdGhpcy5fcGFydHMuaG9zdG5hbWUuc3Vic3RyaW5nKDAsIGUpO1xuICAgICAgdmFyIHJlcGxhY2UgPSBuZXcgUmVnRXhwKCdeJyArIGVzY2FwZVJlZ0V4KHN1YikpO1xuXG4gICAgICBpZiAodiAmJiB2LmNoYXJBdCh2Lmxlbmd0aCAtIDEpICE9PSAnLicpIHtcbiAgICAgICAgdiArPSAnLic7XG4gICAgICB9XG5cbiAgICAgIGlmICh2KSB7XG4gICAgICAgIFVSSS5lbnN1cmVWYWxpZEhvc3RuYW1lKHYpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9wYXJ0cy5ob3N0bmFtZSA9IHRoaXMuX3BhcnRzLmhvc3RuYW1lLnJlcGxhY2UocmVwbGFjZSwgdik7XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG4gIHAuZG9tYWluID0gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICBpZiAodGhpcy5fcGFydHMudXJuKSB7XG4gICAgICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkID8gJycgOiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdiA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBidWlsZCA9IHY7XG4gICAgICB2ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIGNvbnZlbmllbmNlLCByZXR1cm4gXCJleGFtcGxlLm9yZ1wiIGZyb20gXCJ3d3cuZXhhbXBsZS5vcmdcIlxuICAgIGlmICh2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghdGhpcy5fcGFydHMuaG9zdG5hbWUgfHwgdGhpcy5pcygnSVAnKSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGhvc3RuYW1lIGNvbnNpc3RzIG9mIDEgb3IgMiBzZWdtZW50cywgaXQgbXVzdCBiZSB0aGUgZG9tYWluXG4gICAgICB2YXIgdCA9IHRoaXMuX3BhcnRzLmhvc3RuYW1lLm1hdGNoKC9cXC4vZyk7XG4gICAgICBpZiAodCAmJiB0Lmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcnRzLmhvc3RuYW1lO1xuICAgICAgfVxuXG4gICAgICAvLyBncmFiIHRsZCBhbmQgYWRkIGFub3RoZXIgc2VnbWVudFxuICAgICAgdmFyIGVuZCA9IHRoaXMuX3BhcnRzLmhvc3RuYW1lLmxlbmd0aCAtIHRoaXMudGxkKGJ1aWxkKS5sZW5ndGggLSAxO1xuICAgICAgZW5kID0gdGhpcy5fcGFydHMuaG9zdG5hbWUubGFzdEluZGV4T2YoJy4nLCBlbmQgLTEpICsgMTtcbiAgICAgIHJldHVybiB0aGlzLl9wYXJ0cy5ob3N0bmFtZS5zdWJzdHJpbmcoZW5kKSB8fCAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF2KSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2Nhbm5vdCBzZXQgZG9tYWluIGVtcHR5Jyk7XG4gICAgICB9XG5cbiAgICAgIFVSSS5lbnN1cmVWYWxpZEhvc3RuYW1lKHYpO1xuXG4gICAgICBpZiAoIXRoaXMuX3BhcnRzLmhvc3RuYW1lIHx8IHRoaXMuaXMoJ0lQJykpIHtcbiAgICAgICAgdGhpcy5fcGFydHMuaG9zdG5hbWUgPSB2O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHJlcGxhY2UgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4KHRoaXMuZG9tYWluKCkpICsgJyQnKTtcbiAgICAgICAgdGhpcy5fcGFydHMuaG9zdG5hbWUgPSB0aGlzLl9wYXJ0cy5ob3N0bmFtZS5yZXBsYWNlKHJlcGxhY2UsIHYpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG4gIHAudGxkID0gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICBpZiAodGhpcy5fcGFydHMudXJuKSB7XG4gICAgICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkID8gJycgOiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdiA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBidWlsZCA9IHY7XG4gICAgICB2ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIHJldHVybiBcIm9yZ1wiIGZyb20gXCJ3d3cuZXhhbXBsZS5vcmdcIlxuICAgIGlmICh2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghdGhpcy5fcGFydHMuaG9zdG5hbWUgfHwgdGhpcy5pcygnSVAnKSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBwb3MgPSB0aGlzLl9wYXJ0cy5ob3N0bmFtZS5sYXN0SW5kZXhPZignLicpO1xuICAgICAgdmFyIHRsZCA9IHRoaXMuX3BhcnRzLmhvc3RuYW1lLnN1YnN0cmluZyhwb3MgKyAxKTtcblxuICAgICAgaWYgKGJ1aWxkICE9PSB0cnVlICYmIFNMRCAmJiBTTEQubGlzdFt0bGQudG9Mb3dlckNhc2UoKV0pIHtcbiAgICAgICAgcmV0dXJuIFNMRC5nZXQodGhpcy5fcGFydHMuaG9zdG5hbWUpIHx8IHRsZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRsZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHJlcGxhY2U7XG5cbiAgICAgIGlmICghdikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjYW5ub3Qgc2V0IFRMRCBlbXB0eScpO1xuICAgICAgfSBlbHNlIGlmICh2Lm1hdGNoKC9bXmEtekEtWjAtOS1dLykpIHtcbiAgICAgICAgaWYgKFNMRCAmJiBTTEQuaXModikpIHtcbiAgICAgICAgICByZXBsYWNlID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdFeCh0aGlzLnRsZCgpKSArICckJyk7XG4gICAgICAgICAgdGhpcy5fcGFydHMuaG9zdG5hbWUgPSB0aGlzLl9wYXJ0cy5ob3N0bmFtZS5yZXBsYWNlKHJlcGxhY2UsIHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RMRCBcIicgKyB2ICsgJ1wiIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3RoZXIgdGhhbiBbQS1aMC05XScpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLl9wYXJ0cy5ob3N0bmFtZSB8fCB0aGlzLmlzKCdJUCcpKSB7XG4gICAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcignY2Fubm90IHNldCBUTEQgb24gbm9uLWRvbWFpbiBob3N0Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXBsYWNlID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdFeCh0aGlzLnRsZCgpKSArICckJyk7XG4gICAgICAgIHRoaXMuX3BhcnRzLmhvc3RuYW1lID0gdGhpcy5fcGFydHMuaG9zdG5hbWUucmVwbGFjZShyZXBsYWNlLCB2KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuICBwLmRpcmVjdG9yeSA9IGZ1bmN0aW9uKHYsIGJ1aWxkKSB7XG4gICAgaWYgKHRoaXMuX3BhcnRzLnVybikge1xuICAgICAgcmV0dXJuIHYgPT09IHVuZGVmaW5lZCA/ICcnIDogdGhpcztcbiAgICB9XG5cbiAgICBpZiAodiA9PT0gdW5kZWZpbmVkIHx8IHYgPT09IHRydWUpIHtcbiAgICAgIGlmICghdGhpcy5fcGFydHMucGF0aCAmJiAhdGhpcy5fcGFydHMuaG9zdG5hbWUpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fcGFydHMucGF0aCA9PT0gJy8nKSB7XG4gICAgICAgIHJldHVybiAnLyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBlbmQgPSB0aGlzLl9wYXJ0cy5wYXRoLmxlbmd0aCAtIHRoaXMuZmlsZW5hbWUoKS5sZW5ndGggLSAxO1xuICAgICAgdmFyIHJlcyA9IHRoaXMuX3BhcnRzLnBhdGguc3Vic3RyaW5nKDAsIGVuZCkgfHwgKHRoaXMuX3BhcnRzLmhvc3RuYW1lID8gJy8nIDogJycpO1xuXG4gICAgICByZXR1cm4gdiA/IFVSSS5kZWNvZGVQYXRoKHJlcykgOiByZXM7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGUgPSB0aGlzLl9wYXJ0cy5wYXRoLmxlbmd0aCAtIHRoaXMuZmlsZW5hbWUoKS5sZW5ndGg7XG4gICAgICB2YXIgZGlyZWN0b3J5ID0gdGhpcy5fcGFydHMucGF0aC5zdWJzdHJpbmcoMCwgZSk7XG4gICAgICB2YXIgcmVwbGFjZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXgoZGlyZWN0b3J5KSk7XG5cbiAgICAgIC8vIGZ1bGx5IHF1YWxpZmllciBkaXJlY3RvcmllcyBiZWdpbiB3aXRoIGEgc2xhc2hcbiAgICAgIGlmICghdGhpcy5pcygncmVsYXRpdmUnKSkge1xuICAgICAgICBpZiAoIXYpIHtcbiAgICAgICAgICB2ID0gJy8nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYuY2hhckF0KDApICE9PSAnLycpIHtcbiAgICAgICAgICB2ID0gJy8nICsgdjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBkaXJlY3RvcmllcyBhbHdheXMgZW5kIHdpdGggYSBzbGFzaFxuICAgICAgaWYgKHYgJiYgdi5jaGFyQXQodi5sZW5ndGggLSAxKSAhPT0gJy8nKSB7XG4gICAgICAgIHYgKz0gJy8nO1xuICAgICAgfVxuXG4gICAgICB2ID0gVVJJLnJlY29kZVBhdGgodik7XG4gICAgICB0aGlzLl9wYXJ0cy5wYXRoID0gdGhpcy5fcGFydHMucGF0aC5yZXBsYWNlKHJlcGxhY2UsIHYpO1xuICAgICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuICBwLmZpbGVuYW1lID0gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICBpZiAodGhpcy5fcGFydHMudXJuKSB7XG4gICAgICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkID8gJycgOiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh2ID09PSB1bmRlZmluZWQgfHwgdiA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKCF0aGlzLl9wYXJ0cy5wYXRoIHx8IHRoaXMuX3BhcnRzLnBhdGggPT09ICcvJykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBwb3MgPSB0aGlzLl9wYXJ0cy5wYXRoLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICB2YXIgcmVzID0gdGhpcy5fcGFydHMucGF0aC5zdWJzdHJpbmcocG9zKzEpO1xuXG4gICAgICByZXR1cm4gdiA/IFVSSS5kZWNvZGVQYXRoU2VnbWVudChyZXMpIDogcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbXV0YXRlZERpcmVjdG9yeSA9IGZhbHNlO1xuXG4gICAgICBpZiAodi5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgICB2ID0gdi5zdWJzdHJpbmcoMSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2Lm1hdGNoKC9cXC4/XFwvLykpIHtcbiAgICAgICAgbXV0YXRlZERpcmVjdG9yeSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXBsYWNlID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdFeCh0aGlzLmZpbGVuYW1lKCkpICsgJyQnKTtcbiAgICAgIHYgPSBVUkkucmVjb2RlUGF0aCh2KTtcbiAgICAgIHRoaXMuX3BhcnRzLnBhdGggPSB0aGlzLl9wYXJ0cy5wYXRoLnJlcGxhY2UocmVwbGFjZSwgdik7XG5cbiAgICAgIGlmIChtdXRhdGVkRGlyZWN0b3J5KSB7XG4gICAgICAgIHRoaXMubm9ybWFsaXplUGF0aChidWlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcbiAgcC5zdWZmaXggPSBmdW5jdGlvbih2LCBidWlsZCkge1xuICAgIGlmICh0aGlzLl9wYXJ0cy51cm4pIHtcbiAgICAgIHJldHVybiB2ID09PSB1bmRlZmluZWQgPyAnJyA6IHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCB8fCB2ID09PSB0cnVlKSB7XG4gICAgICBpZiAoIXRoaXMuX3BhcnRzLnBhdGggfHwgdGhpcy5fcGFydHMucGF0aCA9PT0gJy8nKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgdmFyIGZpbGVuYW1lID0gdGhpcy5maWxlbmFtZSgpO1xuICAgICAgdmFyIHBvcyA9IGZpbGVuYW1lLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICB2YXIgcywgcmVzO1xuXG4gICAgICBpZiAocG9zID09PSAtMSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIC8vIHN1ZmZpeCBtYXkgb25seSBjb250YWluIGFsbnVtIGNoYXJhY3RlcnMgKHl1cCwgSSBtYWRlIHRoaXMgdXAuKVxuICAgICAgcyA9IGZpbGVuYW1lLnN1YnN0cmluZyhwb3MrMSk7XG4gICAgICByZXMgPSAoL15bYS16MC05JV0rJC9pKS50ZXN0KHMpID8gcyA6ICcnO1xuICAgICAgcmV0dXJuIHYgPyBVUkkuZGVjb2RlUGF0aFNlZ21lbnQocmVzKSA6IHJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHYuY2hhckF0KDApID09PSAnLicpIHtcbiAgICAgICAgdiA9IHYuc3Vic3RyaW5nKDEpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3VmZml4ID0gdGhpcy5zdWZmaXgoKTtcbiAgICAgIHZhciByZXBsYWNlO1xuXG4gICAgICBpZiAoIXN1ZmZpeCkge1xuICAgICAgICBpZiAoIXYpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3BhcnRzLnBhdGggKz0gJy4nICsgVVJJLnJlY29kZVBhdGgodik7XG4gICAgICB9IGVsc2UgaWYgKCF2KSB7XG4gICAgICAgIHJlcGxhY2UgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4KCcuJyArIHN1ZmZpeCkgKyAnJCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVwbGFjZSA9IG5ldyBSZWdFeHAoZXNjYXBlUmVnRXgoc3VmZml4KSArICckJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXBsYWNlKSB7XG4gICAgICAgIHYgPSBVUkkucmVjb2RlUGF0aCh2KTtcbiAgICAgICAgdGhpcy5fcGFydHMucGF0aCA9IHRoaXMuX3BhcnRzLnBhdGgucmVwbGFjZShyZXBsYWNlLCB2KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuICBwLnNlZ21lbnQgPSBmdW5jdGlvbihzZWdtZW50LCB2LCBidWlsZCkge1xuICAgIHZhciBzZXBhcmF0b3IgPSB0aGlzLl9wYXJ0cy51cm4gPyAnOicgOiAnLyc7XG4gICAgdmFyIHBhdGggPSB0aGlzLnBhdGgoKTtcbiAgICB2YXIgYWJzb2x1dGUgPSBwYXRoLnN1YnN0cmluZygwLCAxKSA9PT0gJy8nO1xuICAgIHZhciBzZWdtZW50cyA9IHBhdGguc3BsaXQoc2VwYXJhdG9yKTtcblxuICAgIGlmIChzZWdtZW50ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHNlZ21lbnQgIT09ICdudW1iZXInKSB7XG4gICAgICBidWlsZCA9IHY7XG4gICAgICB2ID0gc2VnbWVudDtcbiAgICAgIHNlZ21lbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHNlZ21lbnQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygc2VnbWVudCAhPT0gJ251bWJlcicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQmFkIHNlZ21lbnQgXCInICsgc2VnbWVudCArICdcIiwgbXVzdCBiZSAwLWJhc2VkIGludGVnZXInKTtcbiAgICB9XG5cbiAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgIHNlZ21lbnRzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgaWYgKHNlZ21lbnQgPCAwKSB7XG4gICAgICAvLyBhbGxvdyBuZWdhdGl2ZSBpbmRleGVzIHRvIGFkZHJlc3MgZnJvbSB0aGUgZW5kXG4gICAgICBzZWdtZW50ID0gTWF0aC5tYXgoc2VnbWVudHMubGVuZ3RoICsgc2VnbWVudCwgMCk7XG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLypqc2hpbnQgbGF4YnJlYWs6IHRydWUgKi9cbiAgICAgIHJldHVybiBzZWdtZW50ID09PSB1bmRlZmluZWRcbiAgICAgICAgPyBzZWdtZW50c1xuICAgICAgICA6IHNlZ21lbnRzW3NlZ21lbnRdO1xuICAgICAgLypqc2hpbnQgbGF4YnJlYWs6IGZhbHNlICovXG4gICAgfSBlbHNlIGlmIChzZWdtZW50ID09PSBudWxsIHx8IHNlZ21lbnRzW3NlZ21lbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChpc0FycmF5KHYpKSB7XG4gICAgICAgIHNlZ21lbnRzID0gW107XG4gICAgICAgIC8vIGNvbGxhcHNlIGVtcHR5IGVsZW1lbnRzIHdpdGhpbiBhcnJheVxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9di5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICBpZiAoIXZbaV0ubGVuZ3RoICYmICghc2VnbWVudHMubGVuZ3RoIHx8ICFzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLTFdLmxlbmd0aCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZWdtZW50cy5sZW5ndGggJiYgIXNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBzZWdtZW50cy5wb3AoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWdtZW50cy5wdXNoKHZbaV0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYgfHwgdHlwZW9mIHYgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmIChzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLTFdID09PSAnJykge1xuICAgICAgICAgIC8vIGVtcHR5IHRyYWlsaW5nIGVsZW1lbnRzIGhhdmUgdG8gYmUgb3ZlcndyaXR0ZW5cbiAgICAgICAgICAvLyB0byBwcmV2ZW50IHJlc3VsdHMgc3VjaCBhcyAvZm9vLy9iYXJcbiAgICAgICAgICBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLTFdID0gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKHYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2KSB7XG4gICAgICAgIHNlZ21lbnRzW3NlZ21lbnRdID0gdjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlZ21lbnRzLnNwbGljZShzZWdtZW50LCAxKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgIHNlZ21lbnRzLnVuc2hpZnQoJycpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnBhdGgoc2VnbWVudHMuam9pbihzZXBhcmF0b3IpLCBidWlsZCk7XG4gIH07XG4gIHAuc2VnbWVudENvZGVkID0gZnVuY3Rpb24oc2VnbWVudCwgdiwgYnVpbGQpIHtcbiAgICB2YXIgc2VnbWVudHMsIGksIGw7XG5cbiAgICBpZiAodHlwZW9mIHNlZ21lbnQgIT09ICdudW1iZXInKSB7XG4gICAgICBidWlsZCA9IHY7XG4gICAgICB2ID0gc2VnbWVudDtcbiAgICAgIHNlZ21lbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnQoc2VnbWVudCwgdiwgYnVpbGQpO1xuICAgICAgaWYgKCFpc0FycmF5KHNlZ21lbnRzKSkge1xuICAgICAgICBzZWdtZW50cyA9IHNlZ21lbnRzICE9PSB1bmRlZmluZWQgPyBVUkkuZGVjb2RlKHNlZ21lbnRzKSA6IHVuZGVmaW5lZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBzZWdtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICBzZWdtZW50c1tpXSA9IFVSSS5kZWNvZGUoc2VnbWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWdtZW50cztcbiAgICB9XG5cbiAgICBpZiAoIWlzQXJyYXkodikpIHtcbiAgICAgIHYgPSAodHlwZW9mIHYgPT09ICdzdHJpbmcnIHx8IHYgaW5zdGFuY2VvZiBTdHJpbmcpID8gVVJJLmVuY29kZSh2KSA6IHY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSB2Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2W2ldID0gVVJJLmVuY29kZSh2W2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZWdtZW50KHNlZ21lbnQsIHYsIGJ1aWxkKTtcbiAgfTtcblxuICAvLyBtdXRhdGluZyBxdWVyeSBzdHJpbmdcbiAgdmFyIHEgPSBwLnF1ZXJ5O1xuICBwLnF1ZXJ5ID0gZnVuY3Rpb24odiwgYnVpbGQpIHtcbiAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIFVSSS5wYXJzZVF1ZXJ5KHRoaXMuX3BhcnRzLnF1ZXJ5LCB0aGlzLl9wYXJ0cy5lc2NhcGVRdWVyeVNwYWNlKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgZGF0YSA9IFVSSS5wYXJzZVF1ZXJ5KHRoaXMuX3BhcnRzLnF1ZXJ5LCB0aGlzLl9wYXJ0cy5lc2NhcGVRdWVyeVNwYWNlKTtcbiAgICAgIHZhciByZXN1bHQgPSB2LmNhbGwodGhpcywgZGF0YSk7XG4gICAgICB0aGlzLl9wYXJ0cy5xdWVyeSA9IFVSSS5idWlsZFF1ZXJ5KHJlc3VsdCB8fCBkYXRhLCB0aGlzLl9wYXJ0cy5kdXBsaWNhdGVRdWVyeVBhcmFtZXRlcnMsIHRoaXMuX3BhcnRzLmVzY2FwZVF1ZXJ5U3BhY2UpO1xuICAgICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIGlmICh2ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHYgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLl9wYXJ0cy5xdWVyeSA9IFVSSS5idWlsZFF1ZXJ5KHYsIHRoaXMuX3BhcnRzLmR1cGxpY2F0ZVF1ZXJ5UGFyYW1ldGVycywgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSk7XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHEuY2FsbCh0aGlzLCB2LCBidWlsZCk7XG4gICAgfVxuICB9O1xuICBwLnNldFF1ZXJ5ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGJ1aWxkKSB7XG4gICAgdmFyIGRhdGEgPSBVUkkucGFyc2VRdWVyeSh0aGlzLl9wYXJ0cy5xdWVyeSwgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSk7XG5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnIHx8IG5hbWUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgIGRhdGFbbmFtZV0gPSB2YWx1ZSAhPT0gdW5kZWZpbmVkID8gdmFsdWUgOiBudWxsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbmFtZSkge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwobmFtZSwga2V5KSkge1xuICAgICAgICAgIGRhdGFba2V5XSA9IG5hbWVba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVUkkuYWRkUXVlcnkoKSBhY2NlcHRzIGFuIG9iamVjdCwgc3RyaW5nIGFzIHRoZSBuYW1lIHBhcmFtZXRlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX3BhcnRzLnF1ZXJ5ID0gVVJJLmJ1aWxkUXVlcnkoZGF0YSwgdGhpcy5fcGFydHMuZHVwbGljYXRlUXVlcnlQYXJhbWV0ZXJzLCB0aGlzLl9wYXJ0cy5lc2NhcGVRdWVyeVNwYWNlKTtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBidWlsZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgcC5hZGRRdWVyeSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBidWlsZCkge1xuICAgIHZhciBkYXRhID0gVVJJLnBhcnNlUXVlcnkodGhpcy5fcGFydHMucXVlcnksIHRoaXMuX3BhcnRzLmVzY2FwZVF1ZXJ5U3BhY2UpO1xuICAgIFVSSS5hZGRRdWVyeShkYXRhLCBuYW1lLCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHZhbHVlKTtcbiAgICB0aGlzLl9wYXJ0cy5xdWVyeSA9IFVSSS5idWlsZFF1ZXJ5KGRhdGEsIHRoaXMuX3BhcnRzLmR1cGxpY2F0ZVF1ZXJ5UGFyYW1ldGVycywgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSk7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgYnVpbGQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIHAucmVtb3ZlUXVlcnkgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgYnVpbGQpIHtcbiAgICB2YXIgZGF0YSA9IFVSSS5wYXJzZVF1ZXJ5KHRoaXMuX3BhcnRzLnF1ZXJ5LCB0aGlzLl9wYXJ0cy5lc2NhcGVRdWVyeVNwYWNlKTtcbiAgICBVUkkucmVtb3ZlUXVlcnkoZGF0YSwgbmFtZSwgdmFsdWUpO1xuICAgIHRoaXMuX3BhcnRzLnF1ZXJ5ID0gVVJJLmJ1aWxkUXVlcnkoZGF0YSwgdGhpcy5fcGFydHMuZHVwbGljYXRlUXVlcnlQYXJhbWV0ZXJzLCB0aGlzLl9wYXJ0cy5lc2NhcGVRdWVyeVNwYWNlKTtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBidWlsZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgcC5oYXNRdWVyeSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCB3aXRoaW5BcnJheSkge1xuICAgIHZhciBkYXRhID0gVVJJLnBhcnNlUXVlcnkodGhpcy5fcGFydHMucXVlcnksIHRoaXMuX3BhcnRzLmVzY2FwZVF1ZXJ5U3BhY2UpO1xuICAgIHJldHVybiBVUkkuaGFzUXVlcnkoZGF0YSwgbmFtZSwgdmFsdWUsIHdpdGhpbkFycmF5KTtcbiAgfTtcbiAgcC5zZXRTZWFyY2ggPSBwLnNldFF1ZXJ5O1xuICBwLmFkZFNlYXJjaCA9IHAuYWRkUXVlcnk7XG4gIHAucmVtb3ZlU2VhcmNoID0gcC5yZW1vdmVRdWVyeTtcbiAgcC5oYXNTZWFyY2ggPSBwLmhhc1F1ZXJ5O1xuXG4gIC8vIHNhbml0aXppbmcgVVJMc1xuICBwLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9wYXJ0cy51cm4pIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5ub3JtYWxpemVQcm90b2NvbChmYWxzZSlcbiAgICAgICAgLm5vcm1hbGl6ZVBhdGgoZmFsc2UpXG4gICAgICAgIC5ub3JtYWxpemVRdWVyeShmYWxzZSlcbiAgICAgICAgLm5vcm1hbGl6ZUZyYWdtZW50KGZhbHNlKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICAgICAgLm5vcm1hbGl6ZVByb3RvY29sKGZhbHNlKVxuICAgICAgLm5vcm1hbGl6ZUhvc3RuYW1lKGZhbHNlKVxuICAgICAgLm5vcm1hbGl6ZVBvcnQoZmFsc2UpXG4gICAgICAubm9ybWFsaXplUGF0aChmYWxzZSlcbiAgICAgIC5ub3JtYWxpemVRdWVyeShmYWxzZSlcbiAgICAgIC5ub3JtYWxpemVGcmFnbWVudChmYWxzZSlcbiAgICAgIC5idWlsZCgpO1xuICB9O1xuICBwLm5vcm1hbGl6ZVByb3RvY29sID0gZnVuY3Rpb24oYnVpbGQpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuX3BhcnRzLnByb3RvY29sID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5fcGFydHMucHJvdG9jb2wgPSB0aGlzLl9wYXJ0cy5wcm90b2NvbC50b0xvd2VyQ2FzZSgpO1xuICAgICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBwLm5vcm1hbGl6ZUhvc3RuYW1lID0gZnVuY3Rpb24oYnVpbGQpIHtcbiAgICBpZiAodGhpcy5fcGFydHMuaG9zdG5hbWUpIHtcbiAgICAgIGlmICh0aGlzLmlzKCdJRE4nKSAmJiBwdW55Y29kZSkge1xuICAgICAgICB0aGlzLl9wYXJ0cy5ob3N0bmFtZSA9IHB1bnljb2RlLnRvQVNDSUkodGhpcy5fcGFydHMuaG9zdG5hbWUpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzKCdJUHY2JykgJiYgSVB2Nikge1xuICAgICAgICB0aGlzLl9wYXJ0cy5ob3N0bmFtZSA9IElQdjYuYmVzdCh0aGlzLl9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BhcnRzLmhvc3RuYW1lID0gdGhpcy5fcGFydHMuaG9zdG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgcC5ub3JtYWxpemVQb3J0ID0gZnVuY3Rpb24oYnVpbGQpIHtcbiAgICAvLyByZW1vdmUgcG9ydCBvZiBpdCdzIHRoZSBwcm90b2NvbCdzIGRlZmF1bHRcbiAgICBpZiAodHlwZW9mIHRoaXMuX3BhcnRzLnByb3RvY29sID09PSAnc3RyaW5nJyAmJiB0aGlzLl9wYXJ0cy5wb3J0ID09PSBVUkkuZGVmYXVsdFBvcnRzW3RoaXMuX3BhcnRzLnByb3RvY29sXSkge1xuICAgICAgdGhpcy5fcGFydHMucG9ydCA9IG51bGw7XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIHAubm9ybWFsaXplUGF0aCA9IGZ1bmN0aW9uKGJ1aWxkKSB7XG4gICAgdmFyIF9wYXRoID0gdGhpcy5fcGFydHMucGF0aDtcbiAgICBpZiAoIV9wYXRoKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcGFydHMudXJuKSB7XG4gICAgICB0aGlzLl9wYXJ0cy5wYXRoID0gVVJJLnJlY29kZVVyblBhdGgodGhpcy5fcGFydHMucGF0aCk7XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcGFydHMucGF0aCA9PT0gJy8nKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgX3dhc19yZWxhdGl2ZTtcbiAgICB2YXIgX2xlYWRpbmdQYXJlbnRzID0gJyc7XG4gICAgdmFyIF9wYXJlbnQsIF9wb3M7XG5cbiAgICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHNcbiAgICBpZiAoX3BhdGguY2hhckF0KDApICE9PSAnLycpIHtcbiAgICAgIF93YXNfcmVsYXRpdmUgPSB0cnVlO1xuICAgICAgX3BhdGggPSAnLycgKyBfcGF0aDtcbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgcmVsYXRpdmUgZmlsZXMgKGFzIG9wcG9zZWQgdG8gZGlyZWN0b3JpZXMpXG4gICAgaWYgKF9wYXRoLnNsaWNlKC0zKSA9PT0gJy8uLicgfHwgX3BhdGguc2xpY2UoLTIpID09PSAnLy4nKSB7XG4gICAgICBfcGF0aCArPSAnLyc7XG4gICAgfVxuXG4gICAgLy8gcmVzb2x2ZSBzaW1wbGVzXG4gICAgX3BhdGggPSBfcGF0aFxuICAgICAgLnJlcGxhY2UoLyhcXC8oXFwuXFwvKSspfChcXC9cXC4kKS9nLCAnLycpXG4gICAgICAucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpO1xuXG4gICAgLy8gcmVtZW1iZXIgbGVhZGluZyBwYXJlbnRzXG4gICAgaWYgKF93YXNfcmVsYXRpdmUpIHtcbiAgICAgIF9sZWFkaW5nUGFyZW50cyA9IF9wYXRoLnN1YnN0cmluZygxKS5tYXRjaCgvXihcXC5cXC5cXC8pKy8pIHx8ICcnO1xuICAgICAgaWYgKF9sZWFkaW5nUGFyZW50cykge1xuICAgICAgICBfbGVhZGluZ1BhcmVudHMgPSBfbGVhZGluZ1BhcmVudHNbMF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmVzb2x2ZSBwYXJlbnRzXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIF9wYXJlbnQgPSBfcGF0aC5pbmRleE9mKCcvLi4nKTtcbiAgICAgIGlmIChfcGFyZW50ID09PSAtMSkge1xuICAgICAgICAvLyBubyBtb3JlIC4uLyB0byByZXNvbHZlXG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIGlmIChfcGFyZW50ID09PSAwKSB7XG4gICAgICAgIC8vIHRvcCBsZXZlbCBjYW5ub3QgYmUgcmVsYXRpdmUsIHNraXAgaXRcbiAgICAgICAgX3BhdGggPSBfcGF0aC5zdWJzdHJpbmcoMyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBfcG9zID0gX3BhdGguc3Vic3RyaW5nKDAsIF9wYXJlbnQpLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICBpZiAoX3BvcyA9PT0gLTEpIHtcbiAgICAgICAgX3BvcyA9IF9wYXJlbnQ7XG4gICAgICB9XG4gICAgICBfcGF0aCA9IF9wYXRoLnN1YnN0cmluZygwLCBfcG9zKSArIF9wYXRoLnN1YnN0cmluZyhfcGFyZW50ICsgMyk7XG4gICAgfVxuXG4gICAgLy8gcmV2ZXJ0IHRvIHJlbGF0aXZlXG4gICAgaWYgKF93YXNfcmVsYXRpdmUgJiYgdGhpcy5pcygncmVsYXRpdmUnKSkge1xuICAgICAgX3BhdGggPSBfbGVhZGluZ1BhcmVudHMgKyBfcGF0aC5zdWJzdHJpbmcoMSk7XG4gICAgfVxuXG4gICAgX3BhdGggPSBVUkkucmVjb2RlUGF0aChfcGF0aCk7XG4gICAgdGhpcy5fcGFydHMucGF0aCA9IF9wYXRoO1xuICAgIHRoaXMuYnVpbGQoIWJ1aWxkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgcC5ub3JtYWxpemVQYXRobmFtZSA9IHAubm9ybWFsaXplUGF0aDtcbiAgcC5ub3JtYWxpemVRdWVyeSA9IGZ1bmN0aW9uKGJ1aWxkKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9wYXJ0cy5xdWVyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmICghdGhpcy5fcGFydHMucXVlcnkubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX3BhcnRzLnF1ZXJ5ID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucXVlcnkoVVJJLnBhcnNlUXVlcnkodGhpcy5fcGFydHMucXVlcnksIHRoaXMuX3BhcnRzLmVzY2FwZVF1ZXJ5U3BhY2UpKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5idWlsZCghYnVpbGQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBwLm5vcm1hbGl6ZUZyYWdtZW50ID0gZnVuY3Rpb24oYnVpbGQpIHtcbiAgICBpZiAoIXRoaXMuX3BhcnRzLmZyYWdtZW50KSB7XG4gICAgICB0aGlzLl9wYXJ0cy5mcmFnbWVudCA9IG51bGw7XG4gICAgICB0aGlzLmJ1aWxkKCFidWlsZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIHAubm9ybWFsaXplU2VhcmNoID0gcC5ub3JtYWxpemVRdWVyeTtcbiAgcC5ub3JtYWxpemVIYXNoID0gcC5ub3JtYWxpemVGcmFnbWVudDtcblxuICBwLmlzbzg4NTkgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBleHBlY3QgdW5pY29kZSBpbnB1dCwgaXNvODg1OSBvdXRwdXRcbiAgICB2YXIgZSA9IFVSSS5lbmNvZGU7XG4gICAgdmFyIGQgPSBVUkkuZGVjb2RlO1xuXG4gICAgVVJJLmVuY29kZSA9IGVzY2FwZTtcbiAgICBVUkkuZGVjb2RlID0gZGVjb2RlVVJJQ29tcG9uZW50O1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm5vcm1hbGl6ZSgpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBVUkkuZW5jb2RlID0gZTtcbiAgICAgIFVSSS5kZWNvZGUgPSBkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBwLnVuaWNvZGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBleHBlY3QgaXNvODg1OSBpbnB1dCwgdW5pY29kZSBvdXRwdXRcbiAgICB2YXIgZSA9IFVSSS5lbmNvZGU7XG4gICAgdmFyIGQgPSBVUkkuZGVjb2RlO1xuXG4gICAgVVJJLmVuY29kZSA9IHN0cmljdEVuY29kZVVSSUNvbXBvbmVudDtcbiAgICBVUkkuZGVjb2RlID0gdW5lc2NhcGU7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubm9ybWFsaXplKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIFVSSS5lbmNvZGUgPSBlO1xuICAgICAgVVJJLmRlY29kZSA9IGQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHAucmVhZGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdXJpID0gdGhpcy5jbG9uZSgpO1xuICAgIC8vIHJlbW92aW5nIHVzZXJuYW1lLCBwYXNzd29yZCwgYmVjYXVzZSB0aGV5IHNob3VsZG4ndCBiZSBkaXNwbGF5ZWQgYWNjb3JkaW5nIHRvIFJGQyAzOTg2XG4gICAgdXJpLnVzZXJuYW1lKCcnKS5wYXNzd29yZCgnJykubm9ybWFsaXplKCk7XG4gICAgdmFyIHQgPSAnJztcbiAgICBpZiAodXJpLl9wYXJ0cy5wcm90b2NvbCkge1xuICAgICAgdCArPSB1cmkuX3BhcnRzLnByb3RvY29sICsgJzovLyc7XG4gICAgfVxuXG4gICAgaWYgKHVyaS5fcGFydHMuaG9zdG5hbWUpIHtcbiAgICAgIGlmICh1cmkuaXMoJ3B1bnljb2RlJykgJiYgcHVueWNvZGUpIHtcbiAgICAgICAgdCArPSBwdW55Y29kZS50b1VuaWNvZGUodXJpLl9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICAgIGlmICh1cmkuX3BhcnRzLnBvcnQpIHtcbiAgICAgICAgICB0ICs9ICc6JyArIHVyaS5fcGFydHMucG9ydDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdCArPSB1cmkuaG9zdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh1cmkuX3BhcnRzLmhvc3RuYW1lICYmIHVyaS5fcGFydHMucGF0aCAmJiB1cmkuX3BhcnRzLnBhdGguY2hhckF0KDApICE9PSAnLycpIHtcbiAgICAgIHQgKz0gJy8nO1xuICAgIH1cblxuICAgIHQgKz0gdXJpLnBhdGgodHJ1ZSk7XG4gICAgaWYgKHVyaS5fcGFydHMucXVlcnkpIHtcbiAgICAgIHZhciBxID0gJyc7XG4gICAgICBmb3IgKHZhciBpID0gMCwgcXAgPSB1cmkuX3BhcnRzLnF1ZXJ5LnNwbGl0KCcmJyksIGwgPSBxcC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGt2ID0gKHFwW2ldIHx8ICcnKS5zcGxpdCgnPScpO1xuICAgICAgICBxICs9ICcmJyArIFVSSS5kZWNvZGVRdWVyeShrdlswXSwgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSlcbiAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJTI2Jyk7XG5cbiAgICAgICAgaWYgKGt2WzFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBxICs9ICc9JyArIFVSSS5kZWNvZGVRdWVyeShrdlsxXSwgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSlcbiAgICAgICAgICAgIC5yZXBsYWNlKC8mL2csICclMjYnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdCArPSAnPycgKyBxLnN1YnN0cmluZygxKTtcbiAgICB9XG5cbiAgICB0ICs9IFVSSS5kZWNvZGVRdWVyeSh1cmkuaGFzaCgpLCB0cnVlKTtcbiAgICByZXR1cm4gdDtcbiAgfTtcblxuICAvLyByZXNvbHZpbmcgcmVsYXRpdmUgYW5kIGFic29sdXRlIFVSTHNcbiAgcC5hYnNvbHV0ZVRvID0gZnVuY3Rpb24oYmFzZSkge1xuICAgIHZhciByZXNvbHZlZCA9IHRoaXMuY2xvbmUoKTtcbiAgICB2YXIgcHJvcGVydGllcyA9IFsncHJvdG9jb2wnLCAndXNlcm5hbWUnLCAncGFzc3dvcmQnLCAnaG9zdG5hbWUnLCAncG9ydCddO1xuICAgIHZhciBiYXNlZGlyLCBpLCBwO1xuXG4gICAgaWYgKHRoaXMuX3BhcnRzLnVybikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUk5zIGRvIG5vdCBoYXZlIGFueSBnZW5lcmFsbHkgZGVmaW5lZCBoaWVyYXJjaGljYWwgY29tcG9uZW50cycpO1xuICAgIH1cblxuICAgIGlmICghKGJhc2UgaW5zdGFuY2VvZiBVUkkpKSB7XG4gICAgICBiYXNlID0gbmV3IFVSSShiYXNlKTtcbiAgICB9XG5cbiAgICBpZiAoIXJlc29sdmVkLl9wYXJ0cy5wcm90b2NvbCkge1xuICAgICAgcmVzb2x2ZWQuX3BhcnRzLnByb3RvY29sID0gYmFzZS5fcGFydHMucHJvdG9jb2w7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3BhcnRzLmhvc3RuYW1lKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgKHAgPSBwcm9wZXJ0aWVzW2ldKTsgaSsrKSB7XG4gICAgICByZXNvbHZlZC5fcGFydHNbcF0gPSBiYXNlLl9wYXJ0c1twXTtcbiAgICB9XG5cbiAgICBpZiAoIXJlc29sdmVkLl9wYXJ0cy5wYXRoKSB7XG4gICAgICByZXNvbHZlZC5fcGFydHMucGF0aCA9IGJhc2UuX3BhcnRzLnBhdGg7XG4gICAgICBpZiAoIXJlc29sdmVkLl9wYXJ0cy5xdWVyeSkge1xuICAgICAgICByZXNvbHZlZC5fcGFydHMucXVlcnkgPSBiYXNlLl9wYXJ0cy5xdWVyeTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJlc29sdmVkLl9wYXJ0cy5wYXRoLnN1YnN0cmluZygtMikgPT09ICcuLicpIHtcbiAgICAgIHJlc29sdmVkLl9wYXJ0cy5wYXRoICs9ICcvJztcbiAgICB9XG5cbiAgICBpZiAocmVzb2x2ZWQucGF0aCgpLmNoYXJBdCgwKSAhPT0gJy8nKSB7XG4gICAgICBiYXNlZGlyID0gYmFzZS5kaXJlY3RvcnkoKTtcbiAgICAgIGJhc2VkaXIgPSBiYXNlZGlyID8gYmFzZWRpciA6IGJhc2UucGF0aCgpLmluZGV4T2YoJy8nKSA9PT0gMCA/ICcvJyA6ICcnO1xuICAgICAgcmVzb2x2ZWQuX3BhcnRzLnBhdGggPSAoYmFzZWRpciA/IChiYXNlZGlyICsgJy8nKSA6ICcnKSArIHJlc29sdmVkLl9wYXJ0cy5wYXRoO1xuICAgICAgcmVzb2x2ZWQubm9ybWFsaXplUGF0aCgpO1xuICAgIH1cblxuICAgIHJlc29sdmVkLmJ1aWxkKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkO1xuICB9O1xuICBwLnJlbGF0aXZlVG8gPSBmdW5jdGlvbihiYXNlKSB7XG4gICAgdmFyIHJlbGF0aXZlID0gdGhpcy5jbG9uZSgpLm5vcm1hbGl6ZSgpO1xuICAgIHZhciByZWxhdGl2ZVBhcnRzLCBiYXNlUGFydHMsIGNvbW1vbiwgcmVsYXRpdmVQYXRoLCBiYXNlUGF0aDtcblxuICAgIGlmIChyZWxhdGl2ZS5fcGFydHMudXJuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VSTnMgZG8gbm90IGhhdmUgYW55IGdlbmVyYWxseSBkZWZpbmVkIGhpZXJhcmNoaWNhbCBjb21wb25lbnRzJyk7XG4gICAgfVxuXG4gICAgYmFzZSA9IG5ldyBVUkkoYmFzZSkubm9ybWFsaXplKCk7XG4gICAgcmVsYXRpdmVQYXJ0cyA9IHJlbGF0aXZlLl9wYXJ0cztcbiAgICBiYXNlUGFydHMgPSBiYXNlLl9wYXJ0cztcbiAgICByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZS5wYXRoKCk7XG4gICAgYmFzZVBhdGggPSBiYXNlLnBhdGgoKTtcblxuICAgIGlmIChyZWxhdGl2ZVBhdGguY2hhckF0KDApICE9PSAnLycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVVJJIGlzIGFscmVhZHkgcmVsYXRpdmUnKTtcbiAgICB9XG5cbiAgICBpZiAoYmFzZVBhdGguY2hhckF0KDApICE9PSAnLycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGN1bGF0ZSBhIFVSSSByZWxhdGl2ZSB0byBhbm90aGVyIHJlbGF0aXZlIFVSSScpO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGl2ZVBhcnRzLnByb3RvY29sID09PSBiYXNlUGFydHMucHJvdG9jb2wpIHtcbiAgICAgIHJlbGF0aXZlUGFydHMucHJvdG9jb2wgPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGl2ZVBhcnRzLnVzZXJuYW1lICE9PSBiYXNlUGFydHMudXNlcm5hbWUgfHwgcmVsYXRpdmVQYXJ0cy5wYXNzd29yZCAhPT0gYmFzZVBhcnRzLnBhc3N3b3JkKSB7XG4gICAgICByZXR1cm4gcmVsYXRpdmUuYnVpbGQoKTtcbiAgICB9XG5cbiAgICBpZiAocmVsYXRpdmVQYXJ0cy5wcm90b2NvbCAhPT0gbnVsbCB8fCByZWxhdGl2ZVBhcnRzLnVzZXJuYW1lICE9PSBudWxsIHx8IHJlbGF0aXZlUGFydHMucGFzc3dvcmQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiByZWxhdGl2ZS5idWlsZCgpO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGl2ZVBhcnRzLmhvc3RuYW1lID09PSBiYXNlUGFydHMuaG9zdG5hbWUgJiYgcmVsYXRpdmVQYXJ0cy5wb3J0ID09PSBiYXNlUGFydHMucG9ydCkge1xuICAgICAgcmVsYXRpdmVQYXJ0cy5ob3N0bmFtZSA9IG51bGw7XG4gICAgICByZWxhdGl2ZVBhcnRzLnBvcnQgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVsYXRpdmUuYnVpbGQoKTtcbiAgICB9XG5cbiAgICBpZiAocmVsYXRpdmVQYXRoID09PSBiYXNlUGF0aCkge1xuICAgICAgcmVsYXRpdmVQYXJ0cy5wYXRoID0gJyc7XG4gICAgICByZXR1cm4gcmVsYXRpdmUuYnVpbGQoKTtcbiAgICB9XG5cbiAgICAvLyBkZXRlcm1pbmUgY29tbW9uIHN1YiBwYXRoXG4gICAgY29tbW9uID0gVVJJLmNvbW1vblBhdGgocmVsYXRpdmVQYXRoLCBiYXNlUGF0aCk7XG5cbiAgICAvLyBJZiB0aGUgcGF0aHMgaGF2ZSBub3RoaW5nIGluIGNvbW1vbiwgcmV0dXJuIGEgcmVsYXRpdmUgVVJMIHdpdGggdGhlIGFic29sdXRlIHBhdGguXG4gICAgaWYgKCFjb21tb24pIHtcbiAgICAgIHJldHVybiByZWxhdGl2ZS5idWlsZCgpO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnRzID0gYmFzZVBhcnRzLnBhdGhcbiAgICAgIC5zdWJzdHJpbmcoY29tbW9uLmxlbmd0aClcbiAgICAgIC5yZXBsYWNlKC9bXlxcL10qJC8sICcnKVxuICAgICAgLnJlcGxhY2UoLy4qP1xcLy9nLCAnLi4vJyk7XG5cbiAgICByZWxhdGl2ZVBhcnRzLnBhdGggPSAocGFyZW50cyArIHJlbGF0aXZlUGFydHMucGF0aC5zdWJzdHJpbmcoY29tbW9uLmxlbmd0aCkpIHx8ICcuLyc7XG5cbiAgICByZXR1cm4gcmVsYXRpdmUuYnVpbGQoKTtcbiAgfTtcblxuICAvLyBjb21wYXJpbmcgVVJJc1xuICBwLmVxdWFscyA9IGZ1bmN0aW9uKHVyaSkge1xuICAgIHZhciBvbmUgPSB0aGlzLmNsb25lKCk7XG4gICAgdmFyIHR3byA9IG5ldyBVUkkodXJpKTtcbiAgICB2YXIgb25lX21hcCA9IHt9O1xuICAgIHZhciB0d29fbWFwID0ge307XG4gICAgdmFyIGNoZWNrZWQgPSB7fTtcbiAgICB2YXIgb25lX3F1ZXJ5LCB0d29fcXVlcnksIGtleTtcblxuICAgIG9uZS5ub3JtYWxpemUoKTtcbiAgICB0d28ubm9ybWFsaXplKCk7XG5cbiAgICAvLyBleGFjdCBtYXRjaFxuICAgIGlmIChvbmUudG9TdHJpbmcoKSA9PT0gdHdvLnRvU3RyaW5nKCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGV4dHJhY3QgcXVlcnkgc3RyaW5nXG4gICAgb25lX3F1ZXJ5ID0gb25lLnF1ZXJ5KCk7XG4gICAgdHdvX3F1ZXJ5ID0gdHdvLnF1ZXJ5KCk7XG4gICAgb25lLnF1ZXJ5KCcnKTtcbiAgICB0d28ucXVlcnkoJycpO1xuXG4gICAgLy8gZGVmaW5pdGVseSBub3QgZXF1YWwgaWYgbm90IGV2ZW4gbm9uLXF1ZXJ5IHBhcnRzIG1hdGNoXG4gICAgaWYgKG9uZS50b1N0cmluZygpICE9PSB0d28udG9TdHJpbmcoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHF1ZXJ5IHBhcmFtZXRlcnMgaGF2ZSB0aGUgc2FtZSBsZW5ndGgsIGV2ZW4gaWYgdGhleSdyZSBwZXJtdXRlZFxuICAgIGlmIChvbmVfcXVlcnkubGVuZ3RoICE9PSB0d29fcXVlcnkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgb25lX21hcCA9IFVSSS5wYXJzZVF1ZXJ5KG9uZV9xdWVyeSwgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSk7XG4gICAgdHdvX21hcCA9IFVSSS5wYXJzZVF1ZXJ5KHR3b19xdWVyeSwgdGhpcy5fcGFydHMuZXNjYXBlUXVlcnlTcGFjZSk7XG5cbiAgICBmb3IgKGtleSBpbiBvbmVfbWFwKSB7XG4gICAgICBpZiAoaGFzT3duLmNhbGwob25lX21hcCwga2V5KSkge1xuICAgICAgICBpZiAoIWlzQXJyYXkob25lX21hcFtrZXldKSkge1xuICAgICAgICAgIGlmIChvbmVfbWFwW2tleV0gIT09IHR3b19tYXBba2V5XSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghYXJyYXlzRXF1YWwob25lX21hcFtrZXldLCB0d29fbWFwW2tleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hlY2tlZFtrZXldID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGtleSBpbiB0d29fbWFwKSB7XG4gICAgICBpZiAoaGFzT3duLmNhbGwodHdvX21hcCwga2V5KSkge1xuICAgICAgICBpZiAoIWNoZWNrZWRba2V5XSkge1xuICAgICAgICAgIC8vIHR3byBjb250YWlucyBhIHBhcmFtZXRlciBub3QgcHJlc2VudCBpbiBvbmVcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBzdGF0ZVxuICBwLmR1cGxpY2F0ZVF1ZXJ5UGFyYW1ldGVycyA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLl9wYXJ0cy5kdXBsaWNhdGVRdWVyeVBhcmFtZXRlcnMgPSAhIXY7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgcC5lc2NhcGVRdWVyeVNwYWNlID0gZnVuY3Rpb24odikge1xuICAgIHRoaXMuX3BhcnRzLmVzY2FwZVF1ZXJ5U3BhY2UgPSAhIXY7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgcmV0dXJuIFVSSTtcbn0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L1VSSWpzL3NyYy9VUkkuanNcbiAqKiBtb2R1bGUgaWQgPSAyNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyohIGh0dHA6Ly9tdGhzLmJlL3B1bnljb2RlIHYxLjIuMyBieSBAbWF0aGlhcyAqL1xuOyhmdW5jdGlvbihyb290KSB7XG5cblx0LyoqIERldGVjdCBmcmVlIHZhcmlhYmxlcyAqL1xuXHR2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzO1xuXHR2YXIgZnJlZU1vZHVsZSA9IHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlICYmXG5cdFx0bW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMgJiYgbW9kdWxlO1xuXHR2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsO1xuXHRpZiAoZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbC53aW5kb3cgPT09IGZyZWVHbG9iYWwpIHtcblx0XHRyb290ID0gZnJlZUdsb2JhbDtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgYHB1bnljb2RlYCBvYmplY3QuXG5cdCAqIEBuYW1lIHB1bnljb2RlXG5cdCAqIEB0eXBlIE9iamVjdFxuXHQgKi9cblx0dmFyIHB1bnljb2RlLFxuXG5cdC8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cblx0bWF4SW50ID0gMjE0NzQ4MzY0NywgLy8gYWthLiAweDdGRkZGRkZGIG9yIDJeMzEtMVxuXG5cdC8qKiBCb290c3RyaW5nIHBhcmFtZXRlcnMgKi9cblx0YmFzZSA9IDM2LFxuXHR0TWluID0gMSxcblx0dE1heCA9IDI2LFxuXHRza2V3ID0gMzgsXG5cdGRhbXAgPSA3MDAsXG5cdGluaXRpYWxCaWFzID0gNzIsXG5cdGluaXRpYWxOID0gMTI4LCAvLyAweDgwXG5cdGRlbGltaXRlciA9ICctJywgLy8gJ1xceDJEJ1xuXG5cdC8qKiBSZWd1bGFyIGV4cHJlc3Npb25zICovXG5cdHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vLFxuXHRyZWdleE5vbkFTQ0lJID0gL1teIC1+XS8sIC8vIHVucHJpbnRhYmxlIEFTQ0lJIGNoYXJzICsgbm9uLUFTQ0lJIGNoYXJzXG5cdHJlZ2V4U2VwYXJhdG9ycyA9IC9cXHgyRXxcXHUzMDAyfFxcdUZGMEV8XFx1RkY2MS9nLCAvLyBSRkMgMzQ5MCBzZXBhcmF0b3JzXG5cblx0LyoqIEVycm9yIG1lc3NhZ2VzICovXG5cdGVycm9ycyA9IHtcblx0XHQnb3ZlcmZsb3cnOiAnT3ZlcmZsb3c6IGlucHV0IG5lZWRzIHdpZGVyIGludGVnZXJzIHRvIHByb2Nlc3MnLFxuXHRcdCdub3QtYmFzaWMnOiAnSWxsZWdhbCBpbnB1dCA+PSAweDgwIChub3QgYSBiYXNpYyBjb2RlIHBvaW50KScsXG5cdFx0J2ludmFsaWQtaW5wdXQnOiAnSW52YWxpZCBpbnB1dCdcblx0fSxcblxuXHQvKiogQ29udmVuaWVuY2Ugc2hvcnRjdXRzICovXG5cdGJhc2VNaW51c1RNaW4gPSBiYXNlIC0gdE1pbixcblx0Zmxvb3IgPSBNYXRoLmZsb29yLFxuXHRzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxuXG5cdC8qKiBUZW1wb3JhcnkgdmFyaWFibGUgKi9cblx0a2V5O1xuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgZXJyb3IgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIGVycm9yIHR5cGUuXG5cdCAqIEByZXR1cm5zIHtFcnJvcn0gVGhyb3dzIGEgYFJhbmdlRXJyb3JgIHdpdGggdGhlIGFwcGxpY2FibGUgZXJyb3IgbWVzc2FnZS5cblx0ICovXG5cdGZ1bmN0aW9uIGVycm9yKHR5cGUpIHtcblx0XHR0aHJvdyBSYW5nZUVycm9yKGVycm9yc1t0eXBlXSk7XG5cdH1cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGBBcnJheSNtYXBgIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeSBhcnJheVxuXHQgKiBpdGVtLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXAoYXJyYXksIGZuKSB7XG5cdFx0dmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0XHR3aGlsZSAobGVuZ3RoLS0pIHtcblx0XHRcdGFycmF5W2xlbmd0aF0gPSBmbihhcnJheVtsZW5ndGhdKTtcblx0XHR9XG5cdFx0cmV0dXJuIGFycmF5O1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgc2ltcGxlIGBBcnJheSNtYXBgLWxpa2Ugd3JhcHBlciB0byB3b3JrIHdpdGggZG9tYWluIG5hbWUgc3RyaW5ncy5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGRvbWFpbiBUaGUgZG9tYWluIG5hbWUuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeVxuXHQgKiBjaGFyYWN0ZXIuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgc3RyaW5nIG9mIGNoYXJhY3RlcnMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrXG5cdCAqIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwRG9tYWluKHN0cmluZywgZm4pIHtcblx0XHRyZXR1cm4gbWFwKHN0cmluZy5zcGxpdChyZWdleFNlcGFyYXRvcnMpLCBmbikuam9pbignLicpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcblx0ICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuXHQgKiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udmVydCBhIHBhaXIgb2Ygc3Vycm9nYXRlIGhhbHZlcyAoZWFjaCBvZiB3aGljaFxuXHQgKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcblx0ICogbWF0Y2hpbmcgVVRGLTE2LlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmVuY29kZWBcblx0ICogQHNlZSA8aHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZGVjb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIFVuaWNvZGUgaW5wdXQgc3RyaW5nIChVQ1MtMikuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gVGhlIG5ldyBhcnJheSBvZiBjb2RlIHBvaW50cy5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJkZWNvZGUoc3RyaW5nKSB7XG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBjb3VudGVyID0gMCxcblx0XHQgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcblx0XHQgICAgdmFsdWUsXG5cdFx0ICAgIGV4dHJhO1xuXHRcdHdoaWxlIChjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHR2YWx1ZSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHRcdC8vIGhpZ2ggc3Vycm9nYXRlLCBhbmQgdGhlcmUgaXMgYSBuZXh0IGNoYXJhY3RlclxuXHRcdFx0XHRleHRyYSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRcdGlmICgoZXh0cmEgJiAweEZDMDApID09IDB4REMwMCkgeyAvLyBsb3cgc3Vycm9nYXRlXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2goKCh2YWx1ZSAmIDB4M0ZGKSA8PCAxMCkgKyAoZXh0cmEgJiAweDNGRikgKyAweDEwMDAwKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB1bm1hdGNoZWQgc3Vycm9nYXRlOyBvbmx5IGFwcGVuZCB0aGlzIGNvZGUgdW5pdCwgaW4gY2FzZSB0aGUgbmV4dFxuXHRcdFx0XHRcdC8vIGNvZGUgdW5pdCBpcyB0aGUgaGlnaCBzdXJyb2dhdGUgb2YgYSBzdXJyb2dhdGUgcGFpclxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0XHRjb3VudGVyLS07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgc3RyaW5nIGJhc2VkIG9uIGFuIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZGVjb2RlYFxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBlbmNvZGVcblx0ICogQHBhcmFtIHtBcnJheX0gY29kZVBvaW50cyBUaGUgYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIG5ldyBVbmljb2RlIHN0cmluZyAoVUNTLTIpLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmVuY29kZShhcnJheSkge1xuXHRcdHJldHVybiBtYXAoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHR2YXIgb3V0cHV0ID0gJyc7XG5cdFx0XHRpZiAodmFsdWUgPiAweEZGRkYpIHtcblx0XHRcdFx0dmFsdWUgLT0gMHgxMDAwMDtcblx0XHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMCk7XG5cdFx0XHRcdHZhbHVlID0gMHhEQzAwIHwgdmFsdWUgJiAweDNGRjtcblx0XHRcdH1cblx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUpO1xuXHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHR9KS5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGJhc2ljIGNvZGUgcG9pbnQgaW50byBhIGRpZ2l0L2ludGVnZXIuXG5cdCAqIEBzZWUgYGRpZ2l0VG9CYXNpYygpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gY29kZVBvaW50IFRoZSBiYXNpYyBudW1lcmljIGNvZGUgcG9pbnQgdmFsdWUuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludCAoZm9yIHVzZSBpblxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGluIHRoZSByYW5nZSBgMGAgdG8gYGJhc2UgLSAxYCwgb3IgYGJhc2VgIGlmXG5cdCAqIHRoZSBjb2RlIHBvaW50IGRvZXMgbm90IHJlcHJlc2VudCBhIHZhbHVlLlxuXHQgKi9cblx0ZnVuY3Rpb24gYmFzaWNUb0RpZ2l0KGNvZGVQb2ludCkge1xuXHRcdGlmIChjb2RlUG9pbnQgLSA0OCA8IDEwKSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gMjI7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA2NSA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gNjU7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA5NyA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gOTc7XG5cdFx0fVxuXHRcdHJldHVybiBiYXNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgZGlnaXQvaW50ZWdlciBpbnRvIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHNlZSBgYmFzaWNUb0RpZ2l0KClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBkaWdpdCBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBiYXNpYyBjb2RlIHBvaW50IHdob3NlIHZhbHVlICh3aGVuIHVzZWQgZm9yXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaXMgYGRpZ2l0YCwgd2hpY2ggbmVlZHMgdG8gYmUgaW4gdGhlIHJhbmdlXG5cdCAqIGAwYCB0byBgYmFzZSAtIDFgLiBJZiBgZmxhZ2AgaXMgbm9uLXplcm8sIHRoZSB1cHBlcmNhc2UgZm9ybSBpc1xuXHQgKiB1c2VkOyBlbHNlLCB0aGUgbG93ZXJjYXNlIGZvcm0gaXMgdXNlZC4gVGhlIGJlaGF2aW9yIGlzIHVuZGVmaW5lZFxuXHQgKiBpZiBgZmxhZ2AgaXMgbm9uLXplcm8gYW5kIGBkaWdpdGAgaGFzIG5vIHVwcGVyY2FzZSBmb3JtLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlnaXRUb0Jhc2ljKGRpZ2l0LCBmbGFnKSB7XG5cdFx0Ly8gIDAuLjI1IG1hcCB0byBBU0NJSSBhLi56IG9yIEEuLlpcblx0XHQvLyAyNi4uMzUgbWFwIHRvIEFTQ0lJIDAuLjlcblx0XHRyZXR1cm4gZGlnaXQgKyAyMiArIDc1ICogKGRpZ2l0IDwgMjYpIC0gKChmbGFnICE9IDApIDw8IDUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEJpYXMgYWRhcHRhdGlvbiBmdW5jdGlvbiBhcyBwZXIgc2VjdGlvbiAzLjQgb2YgUkZDIDM0OTIuXG5cdCAqIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM0OTIjc2VjdGlvbi0zLjRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGFkYXB0KGRlbHRhLCBudW1Qb2ludHMsIGZpcnN0VGltZSkge1xuXHRcdHZhciBrID0gMDtcblx0XHRkZWx0YSA9IGZpcnN0VGltZSA/IGZsb29yKGRlbHRhIC8gZGFtcCkgOiBkZWx0YSA+PiAxO1xuXHRcdGRlbHRhICs9IGZsb29yKGRlbHRhIC8gbnVtUG9pbnRzKTtcblx0XHRmb3IgKC8qIG5vIGluaXRpYWxpemF0aW9uICovOyBkZWx0YSA+IGJhc2VNaW51c1RNaW4gKiB0TWF4ID4+IDE7IGsgKz0gYmFzZSkge1xuXHRcdFx0ZGVsdGEgPSBmbG9vcihkZWx0YSAvIGJhc2VNaW51c1RNaW4pO1xuXHRcdH1cblx0XHRyZXR1cm4gZmxvb3IoayArIChiYXNlTWludXNUTWluICsgMSkgKiBkZWx0YSAvIChkZWx0YSArIHNrZXcpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMgdG8gYSBzdHJpbmcgb2YgVW5pY29kZVxuXHQgKiBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBkZWNvZGUoaW5wdXQpIHtcblx0XHQvLyBEb24ndCB1c2UgVUNTLTJcblx0XHR2YXIgb3V0cHV0ID0gW10sXG5cdFx0ICAgIGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoLFxuXHRcdCAgICBvdXQsXG5cdFx0ICAgIGkgPSAwLFxuXHRcdCAgICBuID0gaW5pdGlhbE4sXG5cdFx0ICAgIGJpYXMgPSBpbml0aWFsQmlhcyxcblx0XHQgICAgYmFzaWMsXG5cdFx0ICAgIGosXG5cdFx0ICAgIGluZGV4LFxuXHRcdCAgICBvbGRpLFxuXHRcdCAgICB3LFxuXHRcdCAgICBrLFxuXHRcdCAgICBkaWdpdCxcblx0XHQgICAgdCxcblx0XHQgICAgbGVuZ3RoLFxuXHRcdCAgICAvKiogQ2FjaGVkIGNhbGN1bGF0aW9uIHJlc3VsdHMgKi9cblx0XHQgICAgYmFzZU1pbnVzVDtcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHM6IGxldCBgYmFzaWNgIGJlIHRoZSBudW1iZXIgb2YgaW5wdXQgY29kZVxuXHRcdC8vIHBvaW50cyBiZWZvcmUgdGhlIGxhc3QgZGVsaW1pdGVyLCBvciBgMGAgaWYgdGhlcmUgaXMgbm9uZSwgdGhlbiBjb3B5XG5cdFx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0XHRiYXNpYyA9IGlucHV0Lmxhc3RJbmRleE9mKGRlbGltaXRlcik7XG5cdFx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdFx0YmFzaWMgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaiA9IDA7IGogPCBiYXNpYzsgKytqKSB7XG5cdFx0XHQvLyBpZiBpdCdzIG5vdCBhIGJhc2ljIGNvZGUgcG9pbnRcblx0XHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdFx0ZXJyb3IoJ25vdC1iYXNpYycpO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBkZWNvZGluZyBsb29wOiBzdGFydCBqdXN0IGFmdGVyIHRoZSBsYXN0IGRlbGltaXRlciBpZiBhbnkgYmFzaWMgY29kZVxuXHRcdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0XHRmb3IgKGluZGV4ID0gYmFzaWMgPiAwID8gYmFzaWMgKyAxIDogMDsgaW5kZXggPCBpbnB1dExlbmd0aDsgLyogbm8gZmluYWwgZXhwcmVzc2lvbiAqLykge1xuXG5cdFx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0XHQvLyBEZWNvZGUgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlciBpbnRvIGBkZWx0YWAsXG5cdFx0XHQvLyB3aGljaCBnZXRzIGFkZGVkIHRvIGBpYC4gVGhlIG92ZXJmbG93IGNoZWNraW5nIGlzIGVhc2llclxuXHRcdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHRcdC8vIHZhbHVlIGF0IHRoZSBlbmQgdG8gb2J0YWluIGBkZWx0YWAuXG5cdFx0XHRmb3IgKG9sZGkgPSBpLCB3ID0gMSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cblx0XHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ2ludmFsaWQtaW5wdXQnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA+PSBiYXNlIHx8IGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblxuXHRcdFx0XHRpZiAoZGlnaXQgPCB0KSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXNlTWludXNUID0gYmFzZSAtIHQ7XG5cdFx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdFx0fVxuXG5cdFx0XHRvdXQgPSBvdXRwdXQubGVuZ3RoICsgMTtcblx0XHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0XHQvLyBgaWAgd2FzIHN1cHBvc2VkIHRvIHdyYXAgYXJvdW5kIGZyb20gYG91dGAgdG8gYDBgLFxuXHRcdFx0Ly8gaW5jcmVtZW50aW5nIGBuYCBlYWNoIHRpbWUsIHNvIHdlJ2xsIGZpeCB0aGF0IG5vdzpcblx0XHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0XHRpICU9IG91dDtcblxuXHRcdFx0Ly8gSW5zZXJ0IGBuYCBhdCBwb3NpdGlvbiBgaWAgb2YgdGhlIG91dHB1dFxuXHRcdFx0b3V0cHV0LnNwbGljZShpKyssIDAsIG4pO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVjczJlbmNvZGUob3V0cHV0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMgdG8gYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seVxuXHQgKiBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmNvZGUoaW5wdXQpIHtcblx0XHR2YXIgbixcblx0XHQgICAgZGVsdGEsXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50LFxuXHRcdCAgICBiYXNpY0xlbmd0aCxcblx0XHQgICAgYmlhcyxcblx0XHQgICAgaixcblx0XHQgICAgbSxcblx0XHQgICAgcSxcblx0XHQgICAgayxcblx0XHQgICAgdCxcblx0XHQgICAgY3VycmVudFZhbHVlLFxuXHRcdCAgICBvdXRwdXQgPSBbXSxcblx0XHQgICAgLyoqIGBpbnB1dExlbmd0aGAgd2lsbCBob2xkIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgaW4gYGlucHV0YC4gKi9cblx0XHQgICAgaW5wdXRMZW5ndGgsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsXG5cdFx0ICAgIGJhc2VNaW51c1QsXG5cdFx0ICAgIHFNaW51c1Q7XG5cblx0XHQvLyBDb252ZXJ0IHRoZSBpbnB1dCBpbiBVQ1MtMiB0byBVbmljb2RlXG5cdFx0aW5wdXQgPSB1Y3MyZGVjb2RlKGlucHV0KTtcblxuXHRcdC8vIENhY2hlIHRoZSBsZW5ndGhcblx0XHRpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIHN0YXRlXG5cdFx0biA9IGluaXRpYWxOO1xuXHRcdGRlbHRhID0gMDtcblx0XHRiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzXG5cdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IDB4ODApIHtcblx0XHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGggPSBvdXRwdXQubGVuZ3RoO1xuXG5cdFx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdFx0Ly8gYGJhc2ljTGVuZ3RoYCBpcyB0aGUgbnVtYmVyIG9mIGJhc2ljIGNvZGUgcG9pbnRzLlxuXG5cdFx0Ly8gRmluaXNoIHRoZSBiYXNpYyBzdHJpbmcgLSBpZiBpdCBpcyBub3QgZW1wdHkgLSB3aXRoIGEgZGVsaW1pdGVyXG5cdFx0aWYgKGJhc2ljTGVuZ3RoKSB7XG5cdFx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHRcdH1cblxuXHRcdC8vIE1haW4gZW5jb2RpbmcgbG9vcDpcblx0XHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0XHQvLyBBbGwgbm9uLWJhc2ljIGNvZGUgcG9pbnRzIDwgbiBoYXZlIGJlZW4gaGFuZGxlZCBhbHJlYWR5LiBGaW5kIHRoZSBuZXh0XG5cdFx0XHQvLyBsYXJnZXIgb25lOlxuXHRcdFx0Zm9yIChtID0gbWF4SW50LCBqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdFx0bSA9IGN1cnJlbnRWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJbmNyZWFzZSBgZGVsdGFgIGVub3VnaCB0byBhZHZhbmNlIHRoZSBkZWNvZGVyJ3MgPG4saT4gc3RhdGUgdG8gPG0sMD4sXG5cdFx0XHQvLyBidXQgZ3VhcmQgYWdhaW5zdCBvdmVyZmxvd1xuXHRcdFx0aGFuZGxlZENQQ291bnRQbHVzT25lID0gaGFuZGxlZENQQ291bnQgKyAxO1xuXHRcdFx0aWYgKG0gLSBuID4gZmxvb3IoKG1heEludCAtIGRlbHRhKSAvIGhhbmRsZWRDUENvdW50UGx1c09uZSkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGRlbHRhICs9IChtIC0gbikgKiBoYW5kbGVkQ1BDb3VudFBsdXNPbmU7XG5cdFx0XHRuID0gbTtcblxuXHRcdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IG4gJiYgKytkZWx0YSA+IG1heEludCkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PSBuKSB7XG5cdFx0XHRcdFx0Ly8gUmVwcmVzZW50IGRlbHRhIGFzIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXJcblx0XHRcdFx0XHRmb3IgKHEgPSBkZWx0YSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblx0XHRcdFx0XHRcdGlmIChxIDwgdCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHFNaW51c1QgPSBxIC0gdDtcblx0XHRcdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKFxuXHRcdFx0XHRcdFx0XHRzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHQgKyBxTWludXNUICUgYmFzZU1pbnVzVCwgMCkpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cSA9IGZsb29yKHFNaW51c1QgLyBiYXNlTWludXNUKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdFx0YmlhcyA9IGFkYXB0KGRlbHRhLCBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsIGhhbmRsZWRDUENvdW50ID09IGJhc2ljTGVuZ3RoKTtcblx0XHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdFx0KytoYW5kbGVkQ1BDb3VudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQrK2RlbHRhO1xuXHRcdFx0KytuO1xuXG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgdG8gVW5pY29kZS4gT25seSB0aGVcblx0ICogUHVueWNvZGVkIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCwgaS5lLiBpdCBkb2Vzbid0XG5cdCAqIG1hdHRlciBpZiB5b3UgY2FsbCBpdCBvbiBhIHN0cmluZyB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gY29udmVydGVkIHRvXG5cdCAqIFVuaWNvZGUuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBQdW55Y29kZSBkb21haW4gbmFtZSB0byBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoZG9tYWluKSB7XG5cdFx0cmV0dXJuIG1hcERvbWFpbihkb21haW4sIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4UHVueWNvZGUudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gZGVjb2RlKHN0cmluZy5zbGljZSg0KS50b0xvd2VyQ2FzZSgpKVxuXHRcdFx0XHQ6IHN0cmluZztcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFVuaWNvZGUgc3RyaW5nIHJlcHJlc2VudGluZyBhIGRvbWFpbiBuYW1lIHRvIFB1bnljb2RlLiBPbmx5IHRoZVxuXHQgKiBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLCBpLmUuIGl0IGRvZXNuJ3Rcblx0ICogbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW4gQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZSB0byBjb252ZXJ0LCBhcyBhIFVuaWNvZGUgc3RyaW5nLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgUHVueWNvZGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIGRvbWFpbiBuYW1lLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShkb21haW4pIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGRvbWFpbiwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhOb25BU0NJSS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyAneG4tLScgKyBlbmNvZGUoc3RyaW5nKVxuXHRcdFx0XHQ6IHN0cmluZztcblx0XHR9KTtcblx0fVxuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKiBEZWZpbmUgdGhlIHB1YmxpYyBBUEkgKi9cblx0cHVueWNvZGUgPSB7XG5cdFx0LyoqXG5cdFx0ICogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IFB1bnljb2RlLmpzIHZlcnNpb24gbnVtYmVyLlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIFN0cmluZ1xuXHRcdCAqL1xuXHRcdCd2ZXJzaW9uJzogJzEuMi4zJyxcblx0XHQvKipcblx0XHQgKiBBbiBvYmplY3Qgb2YgbWV0aG9kcyB0byBjb252ZXJ0IGZyb20gSmF2YVNjcmlwdCdzIGludGVybmFsIGNoYXJhY3RlclxuXHRcdCAqIHJlcHJlc2VudGF0aW9uIChVQ1MtMikgdG8gVW5pY29kZSBjb2RlIHBvaW50cywgYW5kIGJhY2suXG5cdFx0ICogQHNlZSA8aHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBPYmplY3Rcblx0XHQgKi9cblx0XHQndWNzMic6IHtcblx0XHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdFx0J2VuY29kZSc6IHVjczJlbmNvZGVcblx0XHR9LFxuXHRcdCdkZWNvZGUnOiBkZWNvZGUsXG5cdFx0J2VuY29kZSc6IGVuY29kZSxcblx0XHQndG9BU0NJSSc6IHRvQVNDSUksXG5cdFx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxuXHR9O1xuXG5cdC8qKiBFeHBvc2UgYHB1bnljb2RlYCAqL1xuXHQvLyBTb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzLCBsaWtlIHIuanMsIGNoZWNrIGZvciBzcGVjaWZpYyBjb25kaXRpb24gcGF0dGVybnNcblx0Ly8gbGlrZSB0aGUgZm9sbG93aW5nOlxuXHRpZiAoXG5cdFx0dHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXG5cdFx0dHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiZcblx0XHRkZWZpbmUuYW1kXG5cdCkge1xuXHRcdGRlZmluZShmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBwdW55Y29kZTtcblx0XHR9KTtcblx0fVx0ZWxzZSBpZiAoZnJlZUV4cG9ydHMgJiYgIWZyZWVFeHBvcnRzLm5vZGVUeXBlKSB7XG5cdFx0aWYgKGZyZWVNb2R1bGUpIHsgLy8gaW4gTm9kZS5qcyBvciBSaW5nb0pTIHYwLjguMCtcblx0XHRcdGZyZWVNb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuXHRcdH0gZWxzZSB7IC8vIGluIE5hcndoYWwgb3IgUmluZ29KUyB2MC43LjAtXG5cdFx0XHRmb3IgKGtleSBpbiBwdW55Y29kZSkge1xuXHRcdFx0XHRwdW55Y29kZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIChmcmVlRXhwb3J0c1trZXldID0gcHVueWNvZGVba2V5XSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgeyAvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXG5cdFx0cm9vdC5wdW55Y29kZSA9IHB1bnljb2RlO1xuXHR9XG5cbn0odGhpcykpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vVVJJanMvc3JjL3B1bnljb2RlLmpzXG4gKiogbW9kdWxlIGlkID0gMjVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kdWxlKSB7XHJcblx0aWYoIW1vZHVsZS53ZWJwYWNrUG9seWZpbGwpIHtcclxuXHRcdG1vZHVsZS5kZXByZWNhdGUgPSBmdW5jdGlvbigpIHt9O1xyXG5cdFx0bW9kdWxlLnBhdGhzID0gW107XHJcblx0XHQvLyBtb2R1bGUucGFyZW50ID0gdW5kZWZpbmVkIGJ5IGRlZmF1bHRcclxuXHRcdG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xyXG5cdFx0bW9kdWxlLndlYnBhY2tQb2x5ZmlsbCA9IDE7XHJcblx0fVxyXG5cdHJldHVybiBtb2R1bGU7XHJcbn1cclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAod2VicGFjaykvYnVpbGRpbi9tb2R1bGUuanNcbiAqKiBtb2R1bGUgaWQgPSAyNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyohXG4gKiBVUkkuanMgLSBNdXRhdGluZyBVUkxzXG4gKiBJUHY2IFN1cHBvcnRcbiAqXG4gKiBWZXJzaW9uOiAxLjE2LjFcbiAqXG4gKiBBdXRob3I6IFJvZG5leSBSZWhtXG4gKiBXZWI6IGh0dHA6Ly9tZWRpYWxpemUuZ2l0aHViLmlvL1VSSS5qcy9cbiAqXG4gKiBMaWNlbnNlZCB1bmRlclxuICogICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlXG4gKiAgIEdQTCB2MyBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvR1BMLTMuMFxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL3JldHVybkV4cG9ydHMuanNcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIE5vZGVcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG4gICAgcm9vdC5JUHY2ID0gZmFjdG9yeShyb290KTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAocm9vdCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLypcbiAgdmFyIF9pbiA9IFwiZmU4MDowMDAwOjAwMDA6MDAwMDowMjA0OjYxZmY6ZmU5ZDpmMTU2XCI7XG4gIHZhciBfb3V0ID0gSVB2Ni5iZXN0KF9pbik7XG4gIHZhciBfZXhwZWN0ZWQgPSBcImZlODA6OjIwNDo2MWZmOmZlOWQ6ZjE1NlwiO1xuXG4gIGNvbnNvbGUubG9nKF9pbiwgX291dCwgX2V4cGVjdGVkLCBfb3V0ID09PSBfZXhwZWN0ZWQpO1xuICAqL1xuXG4gIC8vIHNhdmUgY3VycmVudCBJUHY2IHZhcmlhYmxlLCBpZiBhbnlcbiAgdmFyIF9JUHY2ID0gcm9vdCAmJiByb290LklQdjY7XG5cbiAgZnVuY3Rpb24gYmVzdFByZXNlbnRhdGlvbihhZGRyZXNzKSB7XG4gICAgLy8gYmFzZWQgb246XG4gICAgLy8gSmF2YXNjcmlwdCB0byB0ZXN0IGFuIElQdjYgYWRkcmVzcyBmb3IgcHJvcGVyIGZvcm1hdCwgYW5kIHRvXG4gICAgLy8gcHJlc2VudCB0aGUgXCJiZXN0IHRleHQgcmVwcmVzZW50YXRpb25cIiBhY2NvcmRpbmcgdG8gSUVURiBEcmFmdCBSRkMgYXRcbiAgICAvLyBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9kcmFmdC1pZXRmLTZtYW4tdGV4dC1hZGRyLXJlcHJlc2VudGF0aW9uLTA0XG4gICAgLy8gOCBGZWIgMjAxMCBSaWNoIEJyb3duLCBEYXJ0d2FyZSwgTExDXG4gICAgLy8gUGxlYXNlIGZlZWwgZnJlZSB0byB1c2UgdGhpcyBjb2RlIGFzIGxvbmcgYXMgeW91IHByb3ZpZGUgYSBsaW5rIHRvXG4gICAgLy8gaHR0cDovL3d3dy5pbnRlcm1hcHBlci5jb21cbiAgICAvLyBodHRwOi8vaW50ZXJtYXBwZXIuY29tL3N1cHBvcnQvdG9vbHMvSVBWNi1WYWxpZGF0b3IuYXNweFxuICAgIC8vIGh0dHA6Ly9kb3dubG9hZC5kYXJ0d2FyZS5jb20vdGhpcmRwYXJ0eS9pcHY2dmFsaWRhdG9yLmpzXG5cbiAgICB2YXIgX2FkZHJlc3MgPSBhZGRyZXNzLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHNlZ21lbnRzID0gX2FkZHJlc3Muc3BsaXQoJzonKTtcbiAgICB2YXIgbGVuZ3RoID0gc2VnbWVudHMubGVuZ3RoO1xuICAgIHZhciB0b3RhbCA9IDg7XG5cbiAgICAvLyB0cmltIGNvbG9ucyAoOjogb3IgOjphOmI6Y+KApiBvciDigKZhOmI6Yzo6KVxuICAgIGlmIChzZWdtZW50c1swXSA9PT0gJycgJiYgc2VnbWVudHNbMV0gPT09ICcnICYmIHNlZ21lbnRzWzJdID09PSAnJykge1xuICAgICAgLy8gbXVzdCBoYXZlIGJlZW4gOjpcbiAgICAgIC8vIHJlbW92ZSBmaXJzdCB0d28gaXRlbXNcbiAgICAgIHNlZ21lbnRzLnNoaWZ0KCk7XG4gICAgICBzZWdtZW50cy5zaGlmdCgpO1xuICAgIH0gZWxzZSBpZiAoc2VnbWVudHNbMF0gPT09ICcnICYmIHNlZ21lbnRzWzFdID09PSAnJykge1xuICAgICAgLy8gbXVzdCBoYXZlIGJlZW4gOjp4eHh4XG4gICAgICAvLyByZW1vdmUgdGhlIGZpcnN0IGl0ZW1cbiAgICAgIHNlZ21lbnRzLnNoaWZ0KCk7XG4gICAgfSBlbHNlIGlmIChzZWdtZW50c1tsZW5ndGggLSAxXSA9PT0gJycgJiYgc2VnbWVudHNbbGVuZ3RoIC0gMl0gPT09ICcnKSB7XG4gICAgICAvLyBtdXN0IGhhdmUgYmVlbiB4eHh4OjpcbiAgICAgIHNlZ21lbnRzLnBvcCgpO1xuICAgIH1cblxuICAgIGxlbmd0aCA9IHNlZ21lbnRzLmxlbmd0aDtcblxuICAgIC8vIGFkanVzdCB0b3RhbCBzZWdtZW50cyBmb3IgSVB2NCB0cmFpbGVyXG4gICAgaWYgKHNlZ21lbnRzW2xlbmd0aCAtIDFdLmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICAgIC8vIGZvdW5kIGEgXCIuXCIgd2hpY2ggbWVhbnMgSVB2NFxuICAgICAgdG90YWwgPSA3O1xuICAgIH1cblxuICAgIC8vIGZpbGwgZW1wdHkgc2VnbWVudHMgdGhlbSB3aXRoIFwiMDAwMFwiXG4gICAgdmFyIHBvcztcbiAgICBmb3IgKHBvcyA9IDA7IHBvcyA8IGxlbmd0aDsgcG9zKyspIHtcbiAgICAgIGlmIChzZWdtZW50c1twb3NdID09PSAnJykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zIDwgdG90YWwpIHtcbiAgICAgIHNlZ21lbnRzLnNwbGljZShwb3MsIDEsICcwMDAwJyk7XG4gICAgICB3aGlsZSAoc2VnbWVudHMubGVuZ3RoIDwgdG90YWwpIHtcbiAgICAgICAgc2VnbWVudHMuc3BsaWNlKHBvcywgMCwgJzAwMDAnKTtcbiAgICAgIH1cblxuICAgICAgbGVuZ3RoID0gc2VnbWVudHMubGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIHN0cmlwIGxlYWRpbmcgemVyb3NcbiAgICB2YXIgX3NlZ21lbnRzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG90YWw7IGkrKykge1xuICAgICAgX3NlZ21lbnRzID0gc2VnbWVudHNbaV0uc3BsaXQoJycpO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAzIDsgaisrKSB7XG4gICAgICAgIGlmIChfc2VnbWVudHNbMF0gPT09ICcwJyAmJiBfc2VnbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIF9zZWdtZW50cy5zcGxpY2UoMCwxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWdtZW50c1tpXSA9IF9zZWdtZW50cy5qb2luKCcnKTtcbiAgICB9XG5cbiAgICAvLyBmaW5kIGxvbmdlc3Qgc2VxdWVuY2Ugb2YgemVyb2VzIGFuZCBjb2FsZXNjZSB0aGVtIGludG8gb25lIHNlZ21lbnRcbiAgICB2YXIgYmVzdCA9IC0xO1xuICAgIHZhciBfYmVzdCA9IDA7XG4gICAgdmFyIF9jdXJyZW50ID0gMDtcbiAgICB2YXIgY3VycmVudCA9IC0xO1xuICAgIHZhciBpbnplcm9lcyA9IGZhbHNlO1xuICAgIC8vIGk7IGFscmVhZHkgZGVjbGFyZWRcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0b3RhbDsgaSsrKSB7XG4gICAgICBpZiAoaW56ZXJvZXMpIHtcbiAgICAgICAgaWYgKHNlZ21lbnRzW2ldID09PSAnMCcpIHtcbiAgICAgICAgICBfY3VycmVudCArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluemVyb2VzID0gZmFsc2U7XG4gICAgICAgICAgaWYgKF9jdXJyZW50ID4gX2Jlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBjdXJyZW50O1xuICAgICAgICAgICAgX2Jlc3QgPSBfY3VycmVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZWdtZW50c1tpXSA9PT0gJzAnKSB7XG4gICAgICAgICAgaW56ZXJvZXMgPSB0cnVlO1xuICAgICAgICAgIGN1cnJlbnQgPSBpO1xuICAgICAgICAgIF9jdXJyZW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChfY3VycmVudCA+IF9iZXN0KSB7XG4gICAgICBiZXN0ID0gY3VycmVudDtcbiAgICAgIF9iZXN0ID0gX2N1cnJlbnQ7XG4gICAgfVxuXG4gICAgaWYgKF9iZXN0ID4gMSkge1xuICAgICAgc2VnbWVudHMuc3BsaWNlKGJlc3QsIF9iZXN0LCAnJyk7XG4gICAgfVxuXG4gICAgbGVuZ3RoID0gc2VnbWVudHMubGVuZ3RoO1xuXG4gICAgLy8gYXNzZW1ibGUgcmVtYWluaW5nIHNlZ21lbnRzXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIGlmIChzZWdtZW50c1swXSA9PT0gJycpICB7XG4gICAgICByZXN1bHQgPSAnOic7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHQgKz0gc2VnbWVudHNbaV07XG4gICAgICBpZiAoaSA9PT0gbGVuZ3RoIC0gMSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmVzdWx0ICs9ICc6JztcbiAgICB9XG5cbiAgICBpZiAoc2VnbWVudHNbbGVuZ3RoIC0gMV0gPT09ICcnKSB7XG4gICAgICByZXN1bHQgKz0gJzonO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xuICAgIGlmIChyb290LklQdjYgPT09IHRoaXMpIHtcbiAgICAgIHJvb3QuSVB2NiA9IF9JUHY2O1xuICAgIH1cbiAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGJlc3Q6IGJlc3RQcmVzZW50YXRpb24sXG4gICAgbm9Db25mbGljdDogbm9Db25mbGljdFxuICB9O1xufSkpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vVVJJanMvc3JjL0lQdjYuanNcbiAqKiBtb2R1bGUgaWQgPSAyN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyohXG4gKiBVUkkuanMgLSBNdXRhdGluZyBVUkxzXG4gKiBTZWNvbmQgTGV2ZWwgRG9tYWluIChTTEQpIFN1cHBvcnRcbiAqXG4gKiBWZXJzaW9uOiAxLjE2LjFcbiAqXG4gKiBBdXRob3I6IFJvZG5leSBSZWhtXG4gKiBXZWI6IGh0dHA6Ly9tZWRpYWxpemUuZ2l0aHViLmlvL1VSSS5qcy9cbiAqXG4gKiBMaWNlbnNlZCB1bmRlclxuICogICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlXG4gKiAgIEdQTCB2MyBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvR1BMLTMuMFxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL3JldHVybkV4cG9ydHMuanNcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIE5vZGVcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG4gICAgcm9vdC5TZWNvbmRMZXZlbERvbWFpbnMgPSBmYWN0b3J5KHJvb3QpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uIChyb290KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBzYXZlIGN1cnJlbnQgU2Vjb25kTGV2ZWxEb21haW5zIHZhcmlhYmxlLCBpZiBhbnlcbiAgdmFyIF9TZWNvbmRMZXZlbERvbWFpbnMgPSByb290ICYmIHJvb3QuU2Vjb25kTGV2ZWxEb21haW5zO1xuXG4gIHZhciBTTEQgPSB7XG4gICAgLy8gbGlzdCBvZiBrbm93biBTZWNvbmQgTGV2ZWwgRG9tYWluc1xuICAgIC8vIGNvbnZlcnRlZCBsaXN0IG9mIFNMRHMgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZ2F2aW5nbWlsbGVyL3NlY29uZC1sZXZlbC1kb21haW5zXG4gICAgLy8gLS0tLVxuICAgIC8vIHB1YmxpY3N1ZmZpeC5vcmcgaXMgbW9yZSBjdXJyZW50IGFuZCBhY3R1YWxseSB1c2VkIGJ5IGEgY291cGxlIG9mIGJyb3dzZXJzIGludGVybmFsbHkuXG4gICAgLy8gZG93bnNpZGUgaXMgaXQgYWxzbyBjb250YWlucyBkb21haW5zIGxpa2UgXCJkeW5kbnMub3JnXCIgLSB3aGljaCBpcyBmaW5lIGZvciB0aGUgc2VjdXJpdHlcbiAgICAvLyBpc3N1ZXMgYnJvd3NlciBoYXZlIHRvIGRlYWwgd2l0aCAoU09QIGZvciBjb29raWVzLCBldGMpIC0gYnV0IGlzIHdheSBvdmVyYm9hcmQgZm9yIFVSSS5qc1xuICAgIC8vIC0tLS1cbiAgICBsaXN0OiB7XG4gICAgICAnYWMnOicgY29tIGdvdiBtaWwgbmV0IG9yZyAnLFxuICAgICAgJ2FlJzonIGFjIGNvIGdvdiBtaWwgbmFtZSBuZXQgb3JnIHBybyBzY2ggJyxcbiAgICAgICdhZic6JyBjb20gZWR1IGdvdiBuZXQgb3JnICcsXG4gICAgICAnYWwnOicgY29tIGVkdSBnb3YgbWlsIG5ldCBvcmcgJyxcbiAgICAgICdhbyc6JyBjbyBlZCBndiBpdCBvZyBwYiAnLFxuICAgICAgJ2FyJzonIGNvbSBlZHUgZ29iIGdvdiBpbnQgbWlsIG5ldCBvcmcgdHVyICcsXG4gICAgICAnYXQnOicgYWMgY28gZ3Ygb3IgJyxcbiAgICAgICdhdSc6JyBhc24gY29tIGNzaXJvIGVkdSBnb3YgaWQgbmV0IG9yZyAnLFxuICAgICAgJ2JhJzonIGNvIGNvbSBlZHUgZ292IG1pbCBuZXQgb3JnIHJzIHVuYmkgdW5tbyB1bnNhIHVudHogdW56ZSAnLFxuICAgICAgJ2JiJzonIGJpeiBjbyBjb20gZWR1IGdvdiBpbmZvIG5ldCBvcmcgc3RvcmUgdHYgJyxcbiAgICAgICdiaCc6JyBiaXogY2MgY29tIGVkdSBnb3YgaW5mbyBuZXQgb3JnICcsXG4gICAgICAnYm4nOicgY29tIGVkdSBnb3YgbmV0IG9yZyAnLFxuICAgICAgJ2JvJzonIGNvbSBlZHUgZ29iIGdvdiBpbnQgbWlsIG5ldCBvcmcgdHYgJyxcbiAgICAgICdicic6JyBhZG0gYWR2IGFnciBhbSBhcnEgYXJ0IGF0byBiIGJpbyBibG9nIGJtZCBjaW0gY25nIGNudCBjb20gY29vcCBlY24gZWR1IGVuZyBlc3AgZXRjIGV0aSBmYXIgZmxvZyBmbSBmbmQgZm90IGZzdCBnMTIgZ2dmIGdvdiBpbWIgaW5kIGluZiBqb3IganVzIGxlbCBtYXQgbWVkIG1pbCBtdXMgbmV0IG5vbSBub3QgbnRyIG9kbyBvcmcgcHBnIHBybyBwc2MgcHNpIHFzbCByZWMgc2xnIHNydiB0bXAgdHJkIHR1ciB0diB2ZXQgdmxvZyB3aWtpIHpsZyAnLFxuICAgICAgJ2JzJzonIGNvbSBlZHUgZ292IG5ldCBvcmcgJyxcbiAgICAgICdieic6JyBkdSBldCBvbSBvdiByZyAnLFxuICAgICAgJ2NhJzonIGFiIGJjIG1iIG5iIG5mIG5sIG5zIG50IG51IG9uIHBlIHFjIHNrIHlrICcsXG4gICAgICAnY2snOicgYml6IGNvIGVkdSBnZW4gZ292IGluZm8gbmV0IG9yZyAnLFxuICAgICAgJ2NuJzonIGFjIGFoIGJqIGNvbSBjcSBlZHUgZmogZ2QgZ292IGdzIGd4IGd6IGhhIGhiIGhlIGhpIGhsIGhuIGpsIGpzIGp4IGxuIG1pbCBuZXQgbm0gbnggb3JnIHFoIHNjIHNkIHNoIHNuIHN4IHRqIHR3IHhqIHh6IHluIHpqICcsXG4gICAgICAnY28nOicgY29tIGVkdSBnb3YgbWlsIG5ldCBub20gb3JnICcsXG4gICAgICAnY3InOicgYWMgYyBjbyBlZCBmaSBnbyBvciBzYSAnLFxuICAgICAgJ2N5JzonIGFjIGJpeiBjb20gZWtsb2dlcyBnb3YgbHRkIG5hbWUgbmV0IG9yZyBwYXJsaWFtZW50IHByZXNzIHBybyB0bSAnLFxuICAgICAgJ2RvJzonIGFydCBjb20gZWR1IGdvYiBnb3YgbWlsIG5ldCBvcmcgc2xkIHdlYiAnLFxuICAgICAgJ2R6JzonIGFydCBhc3NvIGNvbSBlZHUgZ292IG5ldCBvcmcgcG9sICcsXG4gICAgICAnZWMnOicgY29tIGVkdSBmaW4gZ292IGluZm8gbWVkIG1pbCBuZXQgb3JnIHBybyAnLFxuICAgICAgJ2VnJzonIGNvbSBlZHUgZXVuIGdvdiBtaWwgbmFtZSBuZXQgb3JnIHNjaSAnLFxuICAgICAgJ2VyJzonIGNvbSBlZHUgZ292IGluZCBtaWwgbmV0IG9yZyByb2NoZXN0IHcgJyxcbiAgICAgICdlcyc6JyBjb20gZWR1IGdvYiBub20gb3JnICcsXG4gICAgICAnZXQnOicgYml6IGNvbSBlZHUgZ292IGluZm8gbmFtZSBuZXQgb3JnICcsXG4gICAgICAnZmonOicgYWMgYml6IGNvbSBpbmZvIG1pbCBuYW1lIG5ldCBvcmcgcHJvICcsXG4gICAgICAnZmsnOicgYWMgY28gZ292IG5ldCBub20gb3JnICcsXG4gICAgICAnZnInOicgYXNzbyBjb20gZiBnb3V2IG5vbSBwcmQgcHJlc3NlIHRtICcsXG4gICAgICAnZ2cnOicgY28gbmV0IG9yZyAnLFxuICAgICAgJ2doJzonIGNvbSBlZHUgZ292IG1pbCBvcmcgJyxcbiAgICAgICdnbic6JyBhYyBjb20gZ292IG5ldCBvcmcgJyxcbiAgICAgICdncic6JyBjb20gZWR1IGdvdiBtaWwgbmV0IG9yZyAnLFxuICAgICAgJ2d0JzonIGNvbSBlZHUgZ29iIGluZCBtaWwgbmV0IG9yZyAnLFxuICAgICAgJ2d1JzonIGNvbSBlZHUgZ292IG5ldCBvcmcgJyxcbiAgICAgICdoayc6JyBjb20gZWR1IGdvdiBpZHYgbmV0IG9yZyAnLFxuICAgICAgJ2h1JzonIDIwMDAgYWdyYXIgYm9sdCBjYXNpbm8gY2l0eSBjbyBlcm90aWNhIGVyb3Rpa2EgZmlsbSBmb3J1bSBnYW1lcyBob3RlbCBpbmZvIGluZ2F0bGFuIGpvZ2FzeiBrb255dmVsbyBsYWthcyBtZWRpYSBuZXdzIG9yZyBwcml2IHJla2xhbSBzZXggc2hvcCBzcG9ydCBzdWxpIHN6ZXggdG0gdG96c2RlIHV0YXphcyB2aWRlbyAnLFxuICAgICAgJ2lkJzonIGFjIGNvIGdvIG1pbCBuZXQgb3Igc2NoIHdlYiAnLFxuICAgICAgJ2lsJzonIGFjIGNvIGdvdiBpZGYgazEyIG11bmkgbmV0IG9yZyAnLFxuICAgICAgJ2luJzonIGFjIGNvIGVkdSBlcm5ldCBmaXJtIGdlbiBnb3YgaSBpbmQgbWlsIG5ldCBuaWMgb3JnIHJlcyAnLFxuICAgICAgJ2lxJzonIGNvbSBlZHUgZ292IGkgbWlsIG5ldCBvcmcgJyxcbiAgICAgICdpcic6JyBhYyBjbyBkbnNzZWMgZ292IGkgaWQgbmV0IG9yZyBzY2ggJyxcbiAgICAgICdpdCc6JyBlZHUgZ292ICcsXG4gICAgICAnamUnOicgY28gbmV0IG9yZyAnLFxuICAgICAgJ2pvJzonIGNvbSBlZHUgZ292IG1pbCBuYW1lIG5ldCBvcmcgc2NoICcsXG4gICAgICAnanAnOicgYWMgYWQgY28gZWQgZ28gZ3IgbGcgbmUgb3IgJyxcbiAgICAgICdrZSc6JyBhYyBjbyBnbyBpbmZvIG1lIG1vYmkgbmUgb3Igc2MgJyxcbiAgICAgICdraCc6JyBjb20gZWR1IGdvdiBtaWwgbmV0IG9yZyBwZXIgJyxcbiAgICAgICdraSc6JyBiaXogY29tIGRlIGVkdSBnb3YgaW5mbyBtb2IgbmV0IG9yZyB0ZWwgJyxcbiAgICAgICdrbSc6JyBhc3NvIGNvbSBjb29wIGVkdSBnb3V2IGsgbWVkZWNpbiBtaWwgbm9tIG5vdGFpcmVzIHBoYXJtYWNpZW5zIHByZXNzZSB0bSB2ZXRlcmluYWlyZSAnLFxuICAgICAgJ2tuJzonIGVkdSBnb3YgbmV0IG9yZyAnLFxuICAgICAgJ2tyJzonIGFjIGJ1c2FuIGNodW5nYnVrIGNodW5nbmFtIGNvIGRhZWd1IGRhZWplb24gZXMgZ2FuZ3dvbiBnbyBnd2FuZ2p1IGd5ZW9uZ2J1ayBneWVvbmdnaSBneWVvbmduYW0gaHMgaW5jaGVvbiBqZWp1IGplb25idWsgamVvbm5hbSBrIGtnIG1pbCBtcyBuZSBvciBwZSByZSBzYyBzZW91bCB1bHNhbiAnLFxuICAgICAgJ2t3JzonIGNvbSBlZHUgZ292IG5ldCBvcmcgJyxcbiAgICAgICdreSc6JyBjb20gZWR1IGdvdiBuZXQgb3JnICcsXG4gICAgICAna3onOicgY29tIGVkdSBnb3YgbWlsIG5ldCBvcmcgJyxcbiAgICAgICdsYic6JyBjb20gZWR1IGdvdiBuZXQgb3JnICcsXG4gICAgICAnbGsnOicgYXNzbiBjb20gZWR1IGdvdiBncnAgaG90ZWwgaW50IGx0ZCBuZXQgbmdvIG9yZyBzY2ggc29jIHdlYiAnLFxuICAgICAgJ2xyJzonIGNvbSBlZHUgZ292IG5ldCBvcmcgJyxcbiAgICAgICdsdic6JyBhc24gY29tIGNvbmYgZWR1IGdvdiBpZCBtaWwgbmV0IG9yZyAnLFxuICAgICAgJ2x5JzonIGNvbSBlZHUgZ292IGlkIG1lZCBuZXQgb3JnIHBsYyBzY2ggJyxcbiAgICAgICdtYSc6JyBhYyBjbyBnb3YgbSBuZXQgb3JnIHByZXNzICcsXG4gICAgICAnbWMnOicgYXNzbyB0bSAnLFxuICAgICAgJ21lJzonIGFjIGNvIGVkdSBnb3YgaXRzIG5ldCBvcmcgcHJpdiAnLFxuICAgICAgJ21nJzonIGNvbSBlZHUgZ292IG1pbCBub20gb3JnIHByZCB0bSAnLFxuICAgICAgJ21rJzonIGNvbSBlZHUgZ292IGluZiBuYW1lIG5ldCBvcmcgcHJvICcsXG4gICAgICAnbWwnOicgY29tIGVkdSBnb3YgbmV0IG9yZyBwcmVzc2UgJyxcbiAgICAgICdtbic6JyBlZHUgZ292IG9yZyAnLFxuICAgICAgJ21vJzonIGNvbSBlZHUgZ292IG5ldCBvcmcgJyxcbiAgICAgICdtdCc6JyBjb20gZWR1IGdvdiBuZXQgb3JnICcsXG4gICAgICAnbXYnOicgYWVybyBiaXogY29tIGNvb3AgZWR1IGdvdiBpbmZvIGludCBtaWwgbXVzZXVtIG5hbWUgbmV0IG9yZyBwcm8gJyxcbiAgICAgICdtdyc6JyBhYyBjbyBjb20gY29vcCBlZHUgZ292IGludCBtdXNldW0gbmV0IG9yZyAnLFxuICAgICAgJ214JzonIGNvbSBlZHUgZ29iIG5ldCBvcmcgJyxcbiAgICAgICdteSc6JyBjb20gZWR1IGdvdiBtaWwgbmFtZSBuZXQgb3JnIHNjaCAnLFxuICAgICAgJ25mJzonIGFydHMgY29tIGZpcm0gaW5mbyBuZXQgb3RoZXIgcGVyIHJlYyBzdG9yZSB3ZWIgJyxcbiAgICAgICduZyc6JyBiaXogY29tIGVkdSBnb3YgbWlsIG1vYmkgbmFtZSBuZXQgb3JnIHNjaCAnLFxuICAgICAgJ25pJzonIGFjIGNvIGNvbSBlZHUgZ29iIG1pbCBuZXQgbm9tIG9yZyAnLFxuICAgICAgJ25wJzonIGNvbSBlZHUgZ292IG1pbCBuZXQgb3JnICcsXG4gICAgICAnbnInOicgYml6IGNvbSBlZHUgZ292IGluZm8gbmV0IG9yZyAnLFxuICAgICAgJ29tJzonIGFjIGJpeiBjbyBjb20gZWR1IGdvdiBtZWQgbWlsIG11c2V1bSBuZXQgb3JnIHBybyBzY2ggJyxcbiAgICAgICdwZSc6JyBjb20gZWR1IGdvYiBtaWwgbmV0IG5vbSBvcmcgc2xkICcsXG4gICAgICAncGgnOicgY29tIGVkdSBnb3YgaSBtaWwgbmV0IG5nbyBvcmcgJyxcbiAgICAgICdwayc6JyBiaXogY29tIGVkdSBmYW0gZ29iIGdvayBnb24gZ29wIGdvcyBnb3YgbmV0IG9yZyB3ZWIgJyxcbiAgICAgICdwbCc6JyBhcnQgYmlhbHlzdG9rIGJpeiBjb20gZWR1IGdkYSBnZGFuc2sgZ29yem93IGdvdiBpbmZvIGthdG93aWNlIGtyYWtvdyBsb2R6IGx1YmxpbiBtaWwgbmV0IG5nbyBvbHN6dHluIG9yZyBwb3puYW4gcHdyIHJhZG9tIHNsdXBzayBzemN6ZWNpbiB0b3J1biB3YXJzemF3YSB3YXcgd3JvYyB3cm9jbGF3IHpnb3JhICcsXG4gICAgICAncHInOicgYWMgYml6IGNvbSBlZHUgZXN0IGdvdiBpbmZvIGlzbGEgbmFtZSBuZXQgb3JnIHBybyBwcm9mICcsXG4gICAgICAncHMnOicgY29tIGVkdSBnb3YgbmV0IG9yZyBwbG8gc2VjICcsXG4gICAgICAncHcnOicgYmVsYXUgY28gZWQgZ28gbmUgb3IgJyxcbiAgICAgICdybyc6JyBhcnRzIGNvbSBmaXJtIGluZm8gbm9tIG50IG9yZyByZWMgc3RvcmUgdG0gd3d3ICcsXG4gICAgICAncnMnOicgYWMgY28gZWR1IGdvdiBpbiBvcmcgJyxcbiAgICAgICdzYic6JyBjb20gZWR1IGdvdiBuZXQgb3JnICcsXG4gICAgICAnc2MnOicgY29tIGVkdSBnb3YgbmV0IG9yZyAnLFxuICAgICAgJ3NoJzonIGNvIGNvbSBlZHUgZ292IG5ldCBub20gb3JnICcsXG4gICAgICAnc2wnOicgY29tIGVkdSBnb3YgbmV0IG9yZyAnLFxuICAgICAgJ3N0JzonIGNvIGNvbSBjb25zdWxhZG8gZWR1IGVtYmFpeGFkYSBnb3YgbWlsIG5ldCBvcmcgcHJpbmNpcGUgc2FvdG9tZSBzdG9yZSAnLFxuICAgICAgJ3N2JzonIGNvbSBlZHUgZ29iIG9yZyByZWQgJyxcbiAgICAgICdzeic6JyBhYyBjbyBvcmcgJyxcbiAgICAgICd0cic6JyBhdiBiYnMgYmVsIGJpeiBjb20gZHIgZWR1IGdlbiBnb3YgaW5mbyBrMTIgbmFtZSBuZXQgb3JnIHBvbCB0ZWwgdHNrIHR2IHdlYiAnLFxuICAgICAgJ3R0JzonIGFlcm8gYml6IGNhdCBjbyBjb20gY29vcCBlZHUgZ292IGluZm8gaW50IGpvYnMgbWlsIG1vYmkgbXVzZXVtIG5hbWUgbmV0IG9yZyBwcm8gdGVsIHRyYXZlbCAnLFxuICAgICAgJ3R3JzonIGNsdWIgY29tIGViaXogZWR1IGdhbWUgZ292IGlkdiBtaWwgbmV0IG9yZyAnLFxuICAgICAgJ211JzonIGFjIGNvIGNvbSBnb3YgbmV0IG9yIG9yZyAnLFxuICAgICAgJ216JzonIGFjIGNvIGVkdSBnb3Ygb3JnICcsXG4gICAgICAnbmEnOicgY28gY29tICcsXG4gICAgICAnbnonOicgYWMgY28gY3JpIGdlZWsgZ2VuIGdvdnQgaGVhbHRoIGl3aSBtYW9yaSBtaWwgbmV0IG9yZyBwYXJsaWFtZW50IHNjaG9vbCAnLFxuICAgICAgJ3BhJzonIGFibyBhYyBjb20gZWR1IGdvYiBpbmcgbWVkIG5ldCBub20gb3JnIHNsZCAnLFxuICAgICAgJ3B0JzonIGNvbSBlZHUgZ292IGludCBuZXQgbm9tZSBvcmcgcHVibCAnLFxuICAgICAgJ3B5JzonIGNvbSBlZHUgZ292IG1pbCBuZXQgb3JnICcsXG4gICAgICAncWEnOicgY29tIGVkdSBnb3YgbWlsIG5ldCBvcmcgJyxcbiAgICAgICdyZSc6JyBhc3NvIGNvbSBub20gJyxcbiAgICAgICdydSc6JyBhYyBhZHlnZXlhIGFsdGFpIGFtdXIgYXJraGFuZ2Vsc2sgYXN0cmFraGFuIGJhc2hraXJpYSBiZWxnb3JvZCBiaXIgYnJ5YW5zayBidXJ5YXRpYSBjYmcgY2hlbCBjaGVseWFiaW5zayBjaGl0YSBjaHVrb3RrYSBjaHV2YXNoaWEgY29tIGRhZ2VzdGFuIGUtYnVyZyBlZHUgZ292IGdyb3pueSBpbnQgaXJrdXRzayBpdmFub3ZvIGl6aGV2c2sgamFyIGpvc2hrYXItb2xhIGthbG15a2lhIGthbHVnYSBrYW1jaGF0a2Ega2FyZWxpYSBrYXphbiBrY2hyIGtlbWVyb3ZvIGtoYWJhcm92c2sga2hha2Fzc2lhIGtodiBraXJvdiBrb2VuaWcga29taSBrb3N0cm9tYSBrcmFub3lhcnNrIGt1YmFuIGt1cmdhbiBrdXJzayBsaXBldHNrIG1hZ2FkYW4gbWFyaSBtYXJpLWVsIG1hcmluZSBtaWwgbW9yZG92aWEgbW9zcmVnIG1zayBtdXJtYW5zayBuYWxjaGlrIG5ldCBubm92IG5vdiBub3Zvc2liaXJzayBuc2sgb21zayBvcmVuYnVyZyBvcmcgb3J5b2wgcGVuemEgcGVybSBwcCBwc2tvdiBwdHogcm5kIHJ5YXphbiBzYWtoYWxpbiBzYW1hcmEgc2FyYXRvdiBzaW1iaXJzayBzbW9sZW5zayBzcGIgc3RhdnJvcG9sIHN0diBzdXJndXQgdGFtYm92IHRhdGFyc3RhbiB0b20gdG9tc2sgdHNhcml0c3luIHRzayB0dWxhIHR1dmEgdHZlciB0eXVtZW4gdWRtIHVkbXVydGlhIHVsYW4tdWRlIHZsYWRpa2F2a2F6IHZsYWRpbWlyIHZsYWRpdm9zdG9rIHZvbGdvZ3JhZCB2b2xvZ2RhIHZvcm9uZXpoIHZybiB2eWF0a2EgeWFrdXRpYSB5YW1hbCB5ZWthdGVyaW5idXJnIHl1emhuby1zYWtoYWxpbnNrICcsXG4gICAgICAncncnOicgYWMgY28gY29tIGVkdSBnb3V2IGdvdiBpbnQgbWlsIG5ldCAnLFxuICAgICAgJ3NhJzonIGNvbSBlZHUgZ292IG1lZCBuZXQgb3JnIHB1YiBzY2ggJyxcbiAgICAgICdzZCc6JyBjb20gZWR1IGdvdiBpbmZvIG1lZCBuZXQgb3JnIHR2ICcsXG4gICAgICAnc2UnOicgYSBhYyBiIGJkIGMgZCBlIGYgZyBoIGkgayBsIG0gbiBvIG9yZyBwIHBhcnRpIHBwIHByZXNzIHIgcyB0IHRtIHUgdyB4IHkgeiAnLFxuICAgICAgJ3NnJzonIGNvbSBlZHUgZ292IGlkbiBuZXQgb3JnIHBlciAnLFxuICAgICAgJ3NuJzonIGFydCBjb20gZWR1IGdvdXYgb3JnIHBlcnNvIHVuaXYgJyxcbiAgICAgICdzeSc6JyBjb20gZWR1IGdvdiBtaWwgbmV0IG5ld3Mgb3JnICcsXG4gICAgICAndGgnOicgYWMgY28gZ28gaW4gbWkgbmV0IG9yICcsXG4gICAgICAndGonOicgYWMgYml6IGNvIGNvbSBlZHUgZ28gZ292IGluZm8gaW50IG1pbCBuYW1lIG5ldCBuaWMgb3JnIHRlc3Qgd2ViICcsXG4gICAgICAndG4nOicgYWdyaW5ldCBjb20gZGVmZW5zZSBlZHVuZXQgZW5zIGZpbiBnb3YgaW5kIGluZm8gaW50bCBtaW5jb20gbmF0IG5ldCBvcmcgcGVyc28gcm5ydCBybnMgcm51IHRvdXJpc20gJyxcbiAgICAgICd0eic6JyBhYyBjbyBnbyBuZSBvciAnLFxuICAgICAgJ3VhJzonIGJpeiBjaGVya2Fzc3kgY2hlcm5pZ292IGNoZXJub3Z0c3kgY2sgY24gY28gY29tIGNyaW1lYSBjdiBkbiBkbmVwcm9wZXRyb3ZzayBkb25ldHNrIGRwIGVkdSBnb3YgaWYgaW4gaXZhbm8tZnJhbmtpdnNrIGtoIGtoYXJrb3Yga2hlcnNvbiBraG1lbG5pdHNraXkga2lldiBraXJvdm9ncmFkIGttIGtyIGtzIGt2IGxnIGx1Z2Fuc2sgbHV0c2sgbHZpdiBtZSBtayBuZXQgbmlrb2xhZXYgb2Qgb2Rlc3NhIG9yZyBwbCBwb2x0YXZhIHBwIHJvdm5vIHJ2IHNlYmFzdG9wb2wgc3VteSB0ZSB0ZXJub3BpbCB1emhnb3JvZCB2aW5uaWNhIHZuIHphcG9yaXpoemhlIHpoaXRvbWlyIHpwIHp0ICcsXG4gICAgICAndWcnOicgYWMgY28gZ28gbmUgb3Igb3JnIHNjICcsXG4gICAgICAndWsnOicgYWMgYmwgYnJpdGlzaC1saWJyYXJ5IGNvIGN5bSBnb3YgZ292dCBpY25ldCBqZXQgbGVhIGx0ZCBtZSBtaWwgbW9kIG5hdGlvbmFsLWxpYnJhcnktc2NvdGxhbmQgbmVsIG5ldCBuaHMgbmljIG5scyBvcmcgb3JnbiBwYXJsaWFtZW50IHBsYyBwb2xpY2Ugc2NoIHNjb3Qgc29jICcsXG4gICAgICAndXMnOicgZG5pIGZlZCBpc2Ega2lkcyBuc24gJyxcbiAgICAgICd1eSc6JyBjb20gZWR1IGd1YiBtaWwgbmV0IG9yZyAnLFxuICAgICAgJ3ZlJzonIGNvIGNvbSBlZHUgZ29iIGluZm8gbWlsIG5ldCBvcmcgd2ViICcsXG4gICAgICAndmknOicgY28gY29tIGsxMiBuZXQgb3JnICcsXG4gICAgICAndm4nOicgYWMgYml6IGNvbSBlZHUgZ292IGhlYWx0aCBpbmZvIGludCBuYW1lIG5ldCBvcmcgcHJvICcsXG4gICAgICAneWUnOicgY28gY29tIGdvdiBsdGQgbWUgbmV0IG9yZyBwbGMgJyxcbiAgICAgICd5dSc6JyBhYyBjbyBlZHUgZ292IG9yZyAnLFxuICAgICAgJ3phJzonIGFjIGFncmljIGFsdCBib3Vyc2UgY2l0eSBjbyBjeWJlcm5ldCBkYiBlZHUgZ292IGdyb25kYXIgaWFjY2VzcyBpbXQgaW5jYSBsYW5kZXNpZ24gbGF3IG1pbCBuZXQgbmdvIG5pcyBub20gb2xpdmV0dGkgb3JnIHBpeCBzY2hvb2wgdG0gd2ViICcsXG4gICAgICAnem0nOicgYWMgY28gY29tIGVkdSBnb3YgbmV0IG9yZyBzY2ggJ1xuICAgIH0sXG4gICAgLy8gZ29yaGlsbCAyMDEzLTEwLTI1OiBVc2luZyBpbmRleE9mKCkgaW5zdGVhZCBSZWdleHAoKS4gU2lnbmlmaWNhbnQgYm9vc3RcbiAgICAvLyBpbiBib3RoIHBlcmZvcm1hbmNlIGFuZCBtZW1vcnkgZm9vdHByaW50LiBObyBpbml0aWFsaXphdGlvbiByZXF1aXJlZC5cbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS91cmktanMtc2xkLXJlZ2V4LXZzLWJpbmFyeS1zZWFyY2gvNFxuICAgIC8vIEZvbGxvd2luZyBtZXRob2RzIHVzZSBsYXN0SW5kZXhPZigpIHJhdGhlciB0aGFuIGFycmF5LnNwbGl0KCkgaW4gb3JkZXJcbiAgICAvLyB0byBhdm9pZCBhbnkgbWVtb3J5IGFsbG9jYXRpb25zLlxuICAgIGhhczogZnVuY3Rpb24oZG9tYWluKSB7XG4gICAgICB2YXIgdGxkT2Zmc2V0ID0gZG9tYWluLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICBpZiAodGxkT2Zmc2V0IDw9IDAgfHwgdGxkT2Zmc2V0ID49IChkb21haW4ubGVuZ3RoLTEpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHZhciBzbGRPZmZzZXQgPSBkb21haW4ubGFzdEluZGV4T2YoJy4nLCB0bGRPZmZzZXQtMSk7XG4gICAgICBpZiAoc2xkT2Zmc2V0IDw9IDAgfHwgc2xkT2Zmc2V0ID49ICh0bGRPZmZzZXQtMSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIHNsZExpc3QgPSBTTEQubGlzdFtkb21haW4uc2xpY2UodGxkT2Zmc2V0KzEpXTtcbiAgICAgIGlmICghc2xkTGlzdCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2xkTGlzdC5pbmRleE9mKCcgJyArIGRvbWFpbi5zbGljZShzbGRPZmZzZXQrMSwgdGxkT2Zmc2V0KSArICcgJykgPj0gMDtcbiAgICB9LFxuICAgIGlzOiBmdW5jdGlvbihkb21haW4pIHtcbiAgICAgIHZhciB0bGRPZmZzZXQgPSBkb21haW4ubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgIGlmICh0bGRPZmZzZXQgPD0gMCB8fCB0bGRPZmZzZXQgPj0gKGRvbWFpbi5sZW5ndGgtMSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIHNsZE9mZnNldCA9IGRvbWFpbi5sYXN0SW5kZXhPZignLicsIHRsZE9mZnNldC0xKTtcbiAgICAgIGlmIChzbGRPZmZzZXQgPj0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB2YXIgc2xkTGlzdCA9IFNMRC5saXN0W2RvbWFpbi5zbGljZSh0bGRPZmZzZXQrMSldO1xuICAgICAgaWYgKCFzbGRMaXN0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzbGRMaXN0LmluZGV4T2YoJyAnICsgZG9tYWluLnNsaWNlKDAsIHRsZE9mZnNldCkgKyAnICcpID49IDA7XG4gICAgfSxcbiAgICBnZXQ6IGZ1bmN0aW9uKGRvbWFpbikge1xuICAgICAgdmFyIHRsZE9mZnNldCA9IGRvbWFpbi5sYXN0SW5kZXhPZignLicpO1xuICAgICAgaWYgKHRsZE9mZnNldCA8PSAwIHx8IHRsZE9mZnNldCA+PSAoZG9tYWluLmxlbmd0aC0xKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHZhciBzbGRPZmZzZXQgPSBkb21haW4ubGFzdEluZGV4T2YoJy4nLCB0bGRPZmZzZXQtMSk7XG4gICAgICBpZiAoc2xkT2Zmc2V0IDw9IDAgfHwgc2xkT2Zmc2V0ID49ICh0bGRPZmZzZXQtMSkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB2YXIgc2xkTGlzdCA9IFNMRC5saXN0W2RvbWFpbi5zbGljZSh0bGRPZmZzZXQrMSldO1xuICAgICAgaWYgKCFzbGRMaXN0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHNsZExpc3QuaW5kZXhPZignICcgKyBkb21haW4uc2xpY2Uoc2xkT2Zmc2V0KzEsIHRsZE9mZnNldCkgKyAnICcpIDwgMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkb21haW4uc2xpY2Uoc2xkT2Zmc2V0KzEpO1xuICAgIH0sXG4gICAgbm9Db25mbGljdDogZnVuY3Rpb24oKXtcbiAgICAgIGlmIChyb290LlNlY29uZExldmVsRG9tYWlucyA9PT0gdGhpcykge1xuICAgICAgICByb290LlNlY29uZExldmVsRG9tYWlucyA9IF9TZWNvbmRMZXZlbERvbWFpbnM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFNMRDtcbn0pKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L1VSSWpzL3NyYy9TZWNvbmRMZXZlbERvbWFpbnMuanNcbiAqKiBtb2R1bGUgaWQgPSAyOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyohXG4gKiBVUkkuanMgLSBNdXRhdGluZyBVUkxzXG4gKiBVUkkgVGVtcGxhdGUgU3VwcG9ydCAtIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY1NzBcbiAqXG4gKiBWZXJzaW9uOiAxLjE2LjFcbiAqXG4gKiBBdXRob3I6IFJvZG5leSBSZWhtXG4gKiBXZWI6IGh0dHA6Ly9tZWRpYWxpemUuZ2l0aHViLmlvL1VSSS5qcy9cbiAqXG4gKiBMaWNlbnNlZCB1bmRlclxuICogICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlXG4gKiAgIEdQTCB2MyBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvR1BMLTMuMFxuICpcbiAqL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9yZXR1cm5FeHBvcnRzLmpzXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBOb2RlXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJy4vVVJJJykpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICBkZWZpbmUoWycuL1VSSSddLCBmYWN0b3J5KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuICAgIHJvb3QuVVJJVGVtcGxhdGUgPSBmYWN0b3J5KHJvb3QuVVJJLCByb290KTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAoVVJJLCByb290KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gRklYTUU6IHYyLjAuMCByZW5hbWNlIG5vbi1jYW1lbENhc2UgcHJvcGVydGllcyB0byB1cHBlcmNhc2VcbiAgLypqc2hpbnQgY2FtZWxjYXNlOiBmYWxzZSAqL1xuXG4gIC8vIHNhdmUgY3VycmVudCBVUklUZW1wbGF0ZSB2YXJpYWJsZSwgaWYgYW55XG4gIHZhciBfVVJJVGVtcGxhdGUgPSByb290ICYmIHJvb3QuVVJJVGVtcGxhdGU7XG5cbiAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIGZ1bmN0aW9uIFVSSVRlbXBsYXRlKGV4cHJlc3Npb24pIHtcbiAgICAvLyBzZXJ2ZSBmcm9tIGNhY2hlIHdoZXJlIHBvc3NpYmxlXG4gICAgaWYgKFVSSVRlbXBsYXRlLl9jYWNoZVtleHByZXNzaW9uXSkge1xuICAgICAgcmV0dXJuIFVSSVRlbXBsYXRlLl9jYWNoZVtleHByZXNzaW9uXTtcbiAgICB9XG5cbiAgICAvLyBBbGxvdyBpbnN0YW50aWF0aW9uIHdpdGhvdXQgdGhlICduZXcnIGtleXdvcmRcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVVJJVGVtcGxhdGUpKSB7XG4gICAgICByZXR1cm4gbmV3IFVSSVRlbXBsYXRlKGV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIHRoaXMuZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gICAgVVJJVGVtcGxhdGUuX2NhY2hlW2V4cHJlc3Npb25dID0gdGhpcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGZ1bmN0aW9uIERhdGEoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5jYWNoZSA9IHt9O1xuICB9XG5cbiAgdmFyIHAgPSBVUklUZW1wbGF0ZS5wcm90b3R5cGU7XG4gIC8vIGxpc3Qgb2Ygb3BlcmF0b3JzIGFuZCB0aGVpciBkZWZpbmVkIG9wdGlvbnNcbiAgdmFyIG9wZXJhdG9ycyA9IHtcbiAgICAvLyBTaW1wbGUgc3RyaW5nIGV4cGFuc2lvblxuICAgICcnIDoge1xuICAgICAgcHJlZml4OiAnJyxcbiAgICAgIHNlcGFyYXRvcjogJywnLFxuICAgICAgbmFtZWQ6IGZhbHNlLFxuICAgICAgZW1wdHlfbmFtZV9zZXBhcmF0b3I6IGZhbHNlLFxuICAgICAgZW5jb2RlIDogJ2VuY29kZSdcbiAgICB9LFxuICAgIC8vIFJlc2VydmVkIGNoYXJhY3RlciBzdHJpbmdzXG4gICAgJysnIDoge1xuICAgICAgcHJlZml4OiAnJyxcbiAgICAgIHNlcGFyYXRvcjogJywnLFxuICAgICAgbmFtZWQ6IGZhbHNlLFxuICAgICAgZW1wdHlfbmFtZV9zZXBhcmF0b3I6IGZhbHNlLFxuICAgICAgZW5jb2RlIDogJ2VuY29kZVJlc2VydmVkJ1xuICAgIH0sXG4gICAgLy8gRnJhZ21lbnQgaWRlbnRpZmllcnMgcHJlZml4ZWQgYnkgJyMnXG4gICAgJyMnIDoge1xuICAgICAgcHJlZml4OiAnIycsXG4gICAgICBzZXBhcmF0b3I6ICcsJyxcbiAgICAgIG5hbWVkOiBmYWxzZSxcbiAgICAgIGVtcHR5X25hbWVfc2VwYXJhdG9yOiBmYWxzZSxcbiAgICAgIGVuY29kZSA6ICdlbmNvZGVSZXNlcnZlZCdcbiAgICB9LFxuICAgIC8vIE5hbWUgbGFiZWxzIG9yIGV4dGVuc2lvbnMgcHJlZml4ZWQgYnkgJy4nXG4gICAgJy4nIDoge1xuICAgICAgcHJlZml4OiAnLicsXG4gICAgICBzZXBhcmF0b3I6ICcuJyxcbiAgICAgIG5hbWVkOiBmYWxzZSxcbiAgICAgIGVtcHR5X25hbWVfc2VwYXJhdG9yOiBmYWxzZSxcbiAgICAgIGVuY29kZSA6ICdlbmNvZGUnXG4gICAgfSxcbiAgICAvLyBQYXRoIHNlZ21lbnRzIHByZWZpeGVkIGJ5ICcvJ1xuICAgICcvJyA6IHtcbiAgICAgIHByZWZpeDogJy8nLFxuICAgICAgc2VwYXJhdG9yOiAnLycsXG4gICAgICBuYW1lZDogZmFsc2UsXG4gICAgICBlbXB0eV9uYW1lX3NlcGFyYXRvcjogZmFsc2UsXG4gICAgICBlbmNvZGUgOiAnZW5jb2RlJ1xuICAgIH0sXG4gICAgLy8gUGF0aCBwYXJhbWV0ZXIgbmFtZSBvciBuYW1lPXZhbHVlIHBhaXJzIHByZWZpeGVkIGJ5ICc7J1xuICAgICc7JyA6IHtcbiAgICAgIHByZWZpeDogJzsnLFxuICAgICAgc2VwYXJhdG9yOiAnOycsXG4gICAgICBuYW1lZDogdHJ1ZSxcbiAgICAgIGVtcHR5X25hbWVfc2VwYXJhdG9yOiBmYWxzZSxcbiAgICAgIGVuY29kZSA6ICdlbmNvZGUnXG4gICAgfSxcbiAgICAvLyBRdWVyeSBjb21wb25lbnQgYmVnaW5uaW5nIHdpdGggJz8nIGFuZCBjb25zaXN0aW5nXG4gICAgLy8gb2YgbmFtZT12YWx1ZSBwYWlycyBzZXBhcmF0ZWQgYnkgJyYnOyBhblxuICAgICc/JyA6IHtcbiAgICAgIHByZWZpeDogJz8nLFxuICAgICAgc2VwYXJhdG9yOiAnJicsXG4gICAgICBuYW1lZDogdHJ1ZSxcbiAgICAgIGVtcHR5X25hbWVfc2VwYXJhdG9yOiB0cnVlLFxuICAgICAgZW5jb2RlIDogJ2VuY29kZSdcbiAgICB9LFxuICAgIC8vIENvbnRpbnVhdGlvbiBvZiBxdWVyeS1zdHlsZSAmbmFtZT12YWx1ZSBwYWlyc1xuICAgIC8vIHdpdGhpbiBhIGxpdGVyYWwgcXVlcnkgY29tcG9uZW50LlxuICAgICcmJyA6IHtcbiAgICAgIHByZWZpeDogJyYnLFxuICAgICAgc2VwYXJhdG9yOiAnJicsXG4gICAgICBuYW1lZDogdHJ1ZSxcbiAgICAgIGVtcHR5X25hbWVfc2VwYXJhdG9yOiB0cnVlLFxuICAgICAgZW5jb2RlIDogJ2VuY29kZSdcbiAgICB9XG5cbiAgICAvLyBUaGUgb3BlcmF0b3IgY2hhcmFjdGVycyBlcXVhbHMgKFwiPVwiKSwgY29tbWEgKFwiLFwiKSwgZXhjbGFtYXRpb24gKFwiIVwiKSxcbiAgICAvLyBhdCBzaWduIChcIkBcIiksIGFuZCBwaXBlIChcInxcIikgYXJlIHJlc2VydmVkIGZvciBmdXR1cmUgZXh0ZW5zaW9ucy5cbiAgfTtcblxuICAvLyBzdG9yYWdlIGZvciBhbHJlYWR5IHBhcnNlZCB0ZW1wbGF0ZXNcbiAgVVJJVGVtcGxhdGUuX2NhY2hlID0ge307XG4gIC8vIHBhdHRlcm4gdG8gaWRlbnRpZnkgZXhwcmVzc2lvbnMgW29wZXJhdG9yLCB2YXJpYWJsZS1saXN0XSBpbiB0ZW1wbGF0ZVxuICBVUklUZW1wbGF0ZS5FWFBSRVNTSU9OX1BBVFRFUk4gPSAvXFx7KFteYS16QS1aMC05JV9dPykoW15cXH1dKykoXFx9fCQpL2c7XG4gIC8vIHBhdHRlcm4gdG8gaWRlbnRpZnkgdmFyaWFibGVzIFtuYW1lLCBleHBsb2RlLCBtYXhsZW5ndGhdIGluIHZhcmlhYmxlLWxpc3RcbiAgVVJJVGVtcGxhdGUuVkFSSUFCTEVfUEFUVEVSTiA9IC9eKFteKjpdKykoKFxcKil8OihcXGQrKSk/JC87XG4gIC8vIHBhdHRlcm4gdG8gdmVyaWZ5IHZhcmlhYmxlIG5hbWUgaW50ZWdyaXR5XG4gIFVSSVRlbXBsYXRlLlZBUklBQkxFX05BTUVfUEFUVEVSTiA9IC9bXmEtekEtWjAtOSVfXS87XG5cbiAgLy8gZXhwYW5kIHBhcnNlZCBleHByZXNzaW9uIChleHByZXNzaW9uLCBub3QgdGVtcGxhdGUhKVxuICBVUklUZW1wbGF0ZS5leHBhbmQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBkYXRhKSB7XG4gICAgLy8gY29udGFpbmVyIGZvciBkZWZpbmVkIG9wdGlvbnMgZm9yIHRoZSBnaXZlbiBvcGVyYXRvclxuICAgIHZhciBvcHRpb25zID0gb3BlcmF0b3JzW2V4cHJlc3Npb24ub3BlcmF0b3JdO1xuICAgIC8vIGV4cGFuc2lvbiB0eXBlIChpbmNsdWRlIGtleXMgb3Igbm90KVxuICAgIHZhciB0eXBlID0gb3B0aW9ucy5uYW1lZCA/ICdOYW1lZCcgOiAnVW5uYW1lZCc7XG4gICAgLy8gbGlzdCBvZiB2YXJpYWJsZXMgd2l0aGluIHRoZSBleHByZXNzaW9uXG4gICAgdmFyIHZhcmlhYmxlcyA9IGV4cHJlc3Npb24udmFyaWFibGVzO1xuICAgIC8vIHJlc3VsdCBidWZmZXIgZm9yIGV2YWx1YXRpbmcgdGhlIGV4cHJlc3Npb25cbiAgICB2YXIgYnVmZmVyID0gW107XG4gICAgdmFyIGQsIHZhcmlhYmxlLCBpO1xuXG4gICAgZm9yIChpID0gMDsgKHZhcmlhYmxlID0gdmFyaWFibGVzW2ldKTsgaSsrKSB7XG4gICAgICAvLyBmZXRjaCBzaW1wbGlmaWVkIGRhdGEgc291cmNlXG4gICAgICBkID0gZGF0YS5nZXQodmFyaWFibGUubmFtZSk7XG4gICAgICBpZiAoIWQudmFsLmxlbmd0aCkge1xuICAgICAgICBpZiAoZC50eXBlKSB7XG4gICAgICAgICAgLy8gZW1wdHkgdmFyaWFibGVzIChlbXB0eSBzdHJpbmcpXG4gICAgICAgICAgLy8gc3RpbGwgbGVhZCB0byBhIHNlcGFyYXRvciBiZWluZyBhcHBlbmRlZCFcbiAgICAgICAgICBidWZmZXIucHVzaCgnJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbm8gZGF0YSwgbm8gYWN0aW9uXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBleHBhbmQgdGhlIGdpdmVuIHZhcmlhYmxlXG4gICAgICBidWZmZXIucHVzaChVUklUZW1wbGF0ZVsnZXhwYW5kJyArIHR5cGVdKFxuICAgICAgICBkLFxuICAgICAgICBvcHRpb25zLFxuICAgICAgICB2YXJpYWJsZS5leHBsb2RlLFxuICAgICAgICB2YXJpYWJsZS5leHBsb2RlICYmIG9wdGlvbnMuc2VwYXJhdG9yIHx8ICcsJyxcbiAgICAgICAgdmFyaWFibGUubWF4bGVuZ3RoLFxuICAgICAgICB2YXJpYWJsZS5uYW1lXG4gICAgICApKTtcbiAgICB9XG5cbiAgICBpZiAoYnVmZmVyLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMucHJlZml4ICsgYnVmZmVyLmpvaW4ob3B0aW9ucy5zZXBhcmF0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBwcmVmaXggaXMgbm90IHByZXBlbmRlZCBmb3IgZW1wdHkgZXhwcmVzc2lvbnNcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH07XG4gIC8vIGV4cGFuZCBhIG5hbWVkIHZhcmlhYmxlXG4gIFVSSVRlbXBsYXRlLmV4cGFuZE5hbWVkID0gZnVuY3Rpb24oZCwgb3B0aW9ucywgZXhwbG9kZSwgc2VwYXJhdG9yLCBsZW5ndGgsIG5hbWUpIHtcbiAgICAvLyB2YXJpYWJsZSByZXN1bHQgYnVmZmVyXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIC8vIHBlZm9ybWFuY2UgY3JhcFxuICAgIHZhciBlbmNvZGUgPSBvcHRpb25zLmVuY29kZTtcbiAgICB2YXIgZW1wdHlfbmFtZV9zZXBhcmF0b3IgPSBvcHRpb25zLmVtcHR5X25hbWVfc2VwYXJhdG9yO1xuICAgIC8vIGZsYWcgbm90aW5nIGlmIHZhbHVlcyBhcmUgYWxyZWFkeSBlbmNvZGVkXG4gICAgdmFyIF9lbmNvZGUgPSAhZFtlbmNvZGVdLmxlbmd0aDtcbiAgICAvLyBrZXkgZm9yIG5hbWVkIGV4cGFuc2lvblxuICAgIHZhciBfbmFtZSA9IGQudHlwZSA9PT0gMiA/ICcnOiBVUklbZW5jb2RlXShuYW1lKTtcbiAgICB2YXIgX3ZhbHVlLCBpLCBsO1xuXG4gICAgLy8gZm9yIGVhY2ggZm91bmQgdmFsdWVcbiAgICBmb3IgKGkgPSAwLCBsID0gZC52YWwubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAobGVuZ3RoKSB7XG4gICAgICAgIC8vIG1heGxlbmd0aCBtdXN0IGJlIGRldGVybWluZWQgYmVmb3JlIGVuY29kaW5nIGNhbiBoYXBwZW5cbiAgICAgICAgX3ZhbHVlID0gVVJJW2VuY29kZV0oZC52YWxbaV1bMV0uc3Vic3RyaW5nKDAsIGxlbmd0aCkpO1xuICAgICAgICBpZiAoZC50eXBlID09PSAyKSB7XG4gICAgICAgICAgLy8gYXBwbHkgbWF4bGVuZ3RoIHRvIGtleXMgb2Ygb2JqZWN0cyBhcyB3ZWxsXG4gICAgICAgICAgX25hbWUgPSBVUklbZW5jb2RlXShkLnZhbFtpXVswXS5zdWJzdHJpbmcoMCwgbGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoX2VuY29kZSkge1xuICAgICAgICAvLyBlbmNvZGUgdmFsdWVcbiAgICAgICAgX3ZhbHVlID0gVVJJW2VuY29kZV0oZC52YWxbaV1bMV0pO1xuICAgICAgICBpZiAoZC50eXBlID09PSAyKSB7XG4gICAgICAgICAgLy8gZW5jb2RlIG5hbWUgYW5kIGNhY2hlIGVuY29kZWQgdmFsdWVcbiAgICAgICAgICBfbmFtZSA9IFVSSVtlbmNvZGVdKGQudmFsW2ldWzBdKTtcbiAgICAgICAgICBkW2VuY29kZV0ucHVzaChbX25hbWUsIF92YWx1ZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNhY2hlIGVuY29kZWQgdmFsdWVcbiAgICAgICAgICBkW2VuY29kZV0ucHVzaChbdW5kZWZpbmVkLCBfdmFsdWVdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdmFsdWVzIGFyZSBhbHJlYWR5IGVuY29kZWQgYW5kIGNhbiBiZSBwdWxsZWQgZnJvbSBjYWNoZVxuICAgICAgICBfdmFsdWUgPSBkW2VuY29kZV1baV1bMV07XG4gICAgICAgIGlmIChkLnR5cGUgPT09IDIpIHtcbiAgICAgICAgICBfbmFtZSA9IGRbZW5jb2RlXVtpXVswXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIHVubGVzcyB3ZSdyZSB0aGUgZmlyc3QgdmFsdWUsIHByZXBlbmQgdGhlIHNlcGFyYXRvclxuICAgICAgICByZXN1bHQgKz0gc2VwYXJhdG9yO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWV4cGxvZGUpIHtcbiAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgLy8gZmlyc3QgZWxlbWVudCwgc28gcHJlcGVuZCB2YXJpYWJsZSBuYW1lXG4gICAgICAgICAgcmVzdWx0ICs9IFVSSVtlbmNvZGVdKG5hbWUpICsgKGVtcHR5X25hbWVfc2VwYXJhdG9yIHx8IF92YWx1ZSA/ICc9JyA6ICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkLnR5cGUgPT09IDIpIHtcbiAgICAgICAgICAvLyB3aXRob3V0IGV4cGxvZGUtbW9kaWZpZXIsIGtleXMgb2Ygb2JqZWN0cyBhcmUgcmV0dXJuZWQgY29tbWEtc2VwYXJhdGVkXG4gICAgICAgICAgcmVzdWx0ICs9IF9uYW1lICsgJywnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ICs9IF92YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG9ubHkgYWRkIHRoZSA9IGlmIGl0IGlzIGVpdGhlciBkZWZhdWx0ICg/Jikgb3IgdGhlcmUgYWN0dWFsbHkgaXMgYSB2YWx1ZSAoOylcbiAgICAgICAgcmVzdWx0ICs9IF9uYW1lICsgKGVtcHR5X25hbWVfc2VwYXJhdG9yIHx8IF92YWx1ZSA/ICc9JyA6ICcnKSArIF92YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICAvLyBleHBhbmQgYW4gdW5uYW1lZCB2YXJpYWJsZVxuICBVUklUZW1wbGF0ZS5leHBhbmRVbm5hbWVkID0gZnVuY3Rpb24oZCwgb3B0aW9ucywgZXhwbG9kZSwgc2VwYXJhdG9yLCBsZW5ndGgpIHtcbiAgICAvLyB2YXJpYWJsZSByZXN1bHQgYnVmZmVyXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIC8vIHBlcmZvcm1hbmNlIGNyYXBcbiAgICB2YXIgZW5jb2RlID0gb3B0aW9ucy5lbmNvZGU7XG4gICAgdmFyIGVtcHR5X25hbWVfc2VwYXJhdG9yID0gb3B0aW9ucy5lbXB0eV9uYW1lX3NlcGFyYXRvcjtcbiAgICAvLyBmbGFnIG5vdGluZyBpZiB2YWx1ZXMgYXJlIGFscmVhZHkgZW5jb2RlZFxuICAgIHZhciBfZW5jb2RlID0gIWRbZW5jb2RlXS5sZW5ndGg7XG4gICAgdmFyIF9uYW1lLCBfdmFsdWUsIGksIGw7XG5cbiAgICAvLyBmb3IgZWFjaCBmb3VuZCB2YWx1ZVxuICAgIGZvciAoaSA9IDAsIGwgPSBkLnZhbC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgLy8gbWF4bGVuZ3RoIG11c3QgYmUgZGV0ZXJtaW5lZCBiZWZvcmUgZW5jb2RpbmcgY2FuIGhhcHBlblxuICAgICAgICBfdmFsdWUgPSBVUklbZW5jb2RlXShkLnZhbFtpXVsxXS5zdWJzdHJpbmcoMCwgbGVuZ3RoKSk7XG4gICAgICB9IGVsc2UgaWYgKF9lbmNvZGUpIHtcbiAgICAgICAgLy8gZW5jb2RlIGFuZCBjYWNoZSB2YWx1ZVxuICAgICAgICBfdmFsdWUgPSBVUklbZW5jb2RlXShkLnZhbFtpXVsxXSk7XG4gICAgICAgIGRbZW5jb2RlXS5wdXNoKFtcbiAgICAgICAgICBkLnR5cGUgPT09IDIgPyBVUklbZW5jb2RlXShkLnZhbFtpXVswXSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgX3ZhbHVlXG4gICAgICAgIF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdmFsdWUgYWxyZWFkeSBlbmNvZGVkLCBwdWxsIGZyb20gY2FjaGVcbiAgICAgICAgX3ZhbHVlID0gZFtlbmNvZGVdW2ldWzFdO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIHVubGVzcyB3ZSdyZSB0aGUgZmlyc3QgdmFsdWUsIHByZXBlbmQgdGhlIHNlcGFyYXRvclxuICAgICAgICByZXN1bHQgKz0gc2VwYXJhdG9yO1xuICAgICAgfVxuXG4gICAgICBpZiAoZC50eXBlID09PSAyKSB7XG4gICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICAvLyBtYXhsZW5ndGggYWxzbyBhcHBsaWVzIHRvIGtleXMgb2Ygb2JqZWN0c1xuICAgICAgICAgIF9uYW1lID0gVVJJW2VuY29kZV0oZC52YWxbaV1bMF0uc3Vic3RyaW5nKDAsIGxlbmd0aCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQgdGhlIG5hbWUgbXVzdCBhbHJlYWR5IGJlIGVuY29kZWRcbiAgICAgICAgICBfbmFtZSA9IGRbZW5jb2RlXVtpXVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCArPSBfbmFtZTtcbiAgICAgICAgaWYgKGV4cGxvZGUpIHtcbiAgICAgICAgICAvLyBleHBsb2RlLW1vZGlmaWVyIHNlcGFyYXRlcyBuYW1lIGFuZCB2YWx1ZSBieSBcIj1cIlxuICAgICAgICAgIHJlc3VsdCArPSAoZW1wdHlfbmFtZV9zZXBhcmF0b3IgfHwgX3ZhbHVlID8gJz0nIDogJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5vIGV4cGxvZGUtbW9kaWZpZXIgc2VwYXJhdGVzIG5hbWUgYW5kIHZhbHVlIGJ5IFwiLFwiXG4gICAgICAgICAgcmVzdWx0ICs9ICcsJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXN1bHQgKz0gX3ZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgVVJJVGVtcGxhdGUubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChyb290LlVSSVRlbXBsYXRlID09PSBVUklUZW1wbGF0ZSkge1xuICAgICAgcm9vdC5VUklUZW1wbGF0ZSA9IF9VUklUZW1wbGF0ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gVVJJVGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gZXhwYW5kIHRlbXBsYXRlIHRocm91Z2ggZ2l2ZW4gZGF0YSBtYXBcbiAgcC5leHBhbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gICAgaWYgKCF0aGlzLnBhcnRzIHx8ICF0aGlzLnBhcnRzLmxlbmd0aCkge1xuICAgICAgLy8gbGF6aWx5eSBwYXJzZSB0aGUgdGVtcGxhdGVcbiAgICAgIHRoaXMucGFyc2UoKTtcbiAgICB9XG5cbiAgICBpZiAoIShkYXRhIGluc3RhbmNlb2YgRGF0YSkpIHtcbiAgICAgIC8vIG1ha2UgZ2l2ZW4gZGF0YSBhdmFpbGFibGUgdGhyb3VnaCB0aGVcbiAgICAgIC8vIG9wdGltaXplZCBkYXRhIGhhbmRsaW5nIHRoaW5naWVcbiAgICAgIGRhdGEgPSBuZXcgRGF0YShkYXRhKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMucGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAvKmpzaGludCBsYXhicmVhazogdHJ1ZSAqL1xuICAgICAgcmVzdWx0ICs9IHR5cGVvZiB0aGlzLnBhcnRzW2ldID09PSAnc3RyaW5nJ1xuICAgICAgICAvLyBsaXRlcmFsIHN0cmluZ1xuICAgICAgICA/IHRoaXMucGFydHNbaV1cbiAgICAgICAgLy8gZXhwcmVzc2lvblxuICAgICAgICA6IFVSSVRlbXBsYXRlLmV4cGFuZCh0aGlzLnBhcnRzW2ldLCBkYXRhKTtcbiAgICAgIC8qanNoaW50IGxheGJyZWFrOiBmYWxzZSAqL1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIC8vIHBhcnNlIHRlbXBsYXRlIGludG8gYWN0aW9uIHRva2Vuc1xuICBwLnBhcnNlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcGVyZm9ybWFuY2UgY3JhcFxuICAgIHZhciBleHByZXNzaW9uID0gdGhpcy5leHByZXNzaW9uO1xuICAgIHZhciBlUGF0dGVybiA9IFVSSVRlbXBsYXRlLkVYUFJFU1NJT05fUEFUVEVSTjtcbiAgICB2YXIgdlBhdHRlcm4gPSBVUklUZW1wbGF0ZS5WQVJJQUJMRV9QQVRURVJOO1xuICAgIHZhciBuUGF0dGVybiA9IFVSSVRlbXBsYXRlLlZBUklBQkxFX05BTUVfUEFUVEVSTjtcbiAgICAvLyB0b2tlbiByZXN1bHQgYnVmZmVyXG4gICAgdmFyIHBhcnRzID0gW107XG4gICAgICAvLyBwb3NpdGlvbiB3aXRoaW4gc291cmNlIHRlbXBsYXRlXG4gICAgdmFyIHBvcyA9IDA7XG4gICAgdmFyIHZhcmlhYmxlcywgZU1hdGNoLCB2TWF0Y2g7XG5cbiAgICAvLyBSZWdFeHAgaXMgc2hhcmVkIGFjY3Jvc3MgYWxsIHRlbXBsYXRlcyxcbiAgICAvLyB3aGljaCByZXF1aXJlcyBhIG1hbnVhbCByZXNldFxuICAgIGVQYXR0ZXJuLmxhc3RJbmRleCA9IDA7XG4gICAgLy8gSSBkb24ndCBsaWtlIHdoaWxlKGZvbyA9IGJhcigpKSBsb29wcyxcbiAgICAvLyB0byBtYWtlIHRoaW5ncyBzaW1wbGVyIEkgZ28gd2hpbGUodHJ1ZSkgYW5kIGJyZWFrIHdoZW4gcmVxdWlyZWRcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgZU1hdGNoID0gZVBhdHRlcm4uZXhlYyhleHByZXNzaW9uKTtcbiAgICAgIGlmIChlTWF0Y2ggPT09IG51bGwpIHtcbiAgICAgICAgLy8gcHVzaCB0cmFpbGluZyBsaXRlcmFsXG4gICAgICAgIHBhcnRzLnB1c2goZXhwcmVzc2lvbi5zdWJzdHJpbmcocG9zKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcHVzaCBsZWFkaW5nIGxpdGVyYWxcbiAgICAgICAgcGFydHMucHVzaChleHByZXNzaW9uLnN1YnN0cmluZyhwb3MsIGVNYXRjaC5pbmRleCkpO1xuICAgICAgICBwb3MgPSBlTWF0Y2guaW5kZXggKyBlTWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wZXJhdG9yc1tlTWF0Y2hbMV1dKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBPcGVyYXRvciBcIicgKyBlTWF0Y2hbMV0gICsgJ1wiIGluIFwiJyArIGVNYXRjaFswXSArICdcIicpO1xuICAgICAgfSBlbHNlIGlmICghZU1hdGNoWzNdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgRXhwcmVzc2lvbiBcIicgKyBlTWF0Y2hbMF0gICsgJ1wiJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHBhcnNlIHZhcmlhYmxlLWxpc3RcbiAgICAgIHZhcmlhYmxlcyA9IGVNYXRjaFsyXS5zcGxpdCgnLCcpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YXJpYWJsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZNYXRjaCA9IHZhcmlhYmxlc1tpXS5tYXRjaCh2UGF0dGVybik7XG4gICAgICAgIGlmICh2TWF0Y2ggPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgVmFyaWFibGUgXCInICsgdmFyaWFibGVzW2ldICsgJ1wiIGluIFwiJyArIGVNYXRjaFswXSArICdcIicpO1xuICAgICAgICB9IGVsc2UgaWYgKHZNYXRjaFsxXS5tYXRjaChuUGF0dGVybikpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgVmFyaWFibGUgTmFtZSBcIicgKyB2TWF0Y2hbMV0gKyAnXCIgaW4gXCInICsgZU1hdGNoWzBdICsgJ1wiJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXJpYWJsZXNbaV0gPSB7XG4gICAgICAgICAgbmFtZTogdk1hdGNoWzFdLFxuICAgICAgICAgIGV4cGxvZGU6ICEhdk1hdGNoWzNdLFxuICAgICAgICAgIG1heGxlbmd0aDogdk1hdGNoWzRdICYmIHBhcnNlSW50KHZNYXRjaFs0XSwgMTApXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmICghdmFyaWFibGVzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cHJlc3Npb24gTWlzc2luZyBWYXJpYWJsZShzKSBcIicgKyBlTWF0Y2hbMF0gKyAnXCInKTtcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaCh7XG4gICAgICAgIGV4cHJlc3Npb246IGVNYXRjaFswXSxcbiAgICAgICAgb3BlcmF0b3I6IGVNYXRjaFsxXSxcbiAgICAgICAgdmFyaWFibGVzOiB2YXJpYWJsZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcGFydHMubGVuZ3RoKSB7XG4gICAgICAvLyB0ZW1wbGF0ZSBkb2Vzbid0IGNvbnRhaW4gYW55IGV4cHJlc3Npb25zXG4gICAgICAvLyBzbyBpdCBpcyBhIHNpbXBsZSBsaXRlcmFsIHN0cmluZ1xuICAgICAgLy8gdGhpcyBwcm9iYWJseSBzaG91bGQgZmlyZSBhIHdhcm5pbmcgb3Igc29tZXRoaW5nP1xuICAgICAgcGFydHMucHVzaChleHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhcnRzID0gcGFydHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gc2ltcGxpZnkgZGF0YSBzdHJ1Y3R1cmVzXG4gIERhdGEucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgIC8vIHBlcmZvcm1hbmNlIGNyYXBcbiAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YTtcbiAgICAvLyBjYWNoZSBmb3IgcHJvY2Vzc2VkIGRhdGEtcG9pbnRcbiAgICB2YXIgZCA9IHtcbiAgICAgIC8vIHR5cGUgb2YgZGF0YSAwOiB1bmRlZmluZWQvbnVsbCwgMTogc3RyaW5nLCAyOiBvYmplY3QsIDM6IGFycmF5XG4gICAgICB0eXBlOiAwLFxuICAgICAgLy8gb3JpZ2luYWwgdmFsdWVzIChleGNlcHQgdW5kZWZpbmVkL251bGwpXG4gICAgICB2YWw6IFtdLFxuICAgICAgLy8gY2FjaGUgZm9yIGVuY29kZWQgdmFsdWVzIChvbmx5IGZvciBub24tbWF4bGVuZ3RoIGV4cGFuc2lvbilcbiAgICAgIGVuY29kZTogW10sXG4gICAgICBlbmNvZGVSZXNlcnZlZDogW11cbiAgICB9O1xuICAgIHZhciBpLCBsLCB2YWx1ZTtcblxuICAgIGlmICh0aGlzLmNhY2hlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gd2UndmUgYWxyZWFkeSBwcm9jZXNzZWQgdGhpcyBrZXlcbiAgICAgIHJldHVybiB0aGlzLmNhY2hlW2tleV07XG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZVtrZXldID0gZDtcblxuICAgIGlmIChTdHJpbmcoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJykge1xuICAgICAgLy8gZGF0YSBpdHNlbGYgaXMgYSBjYWxsYmFjayAoZ2xvYmFsIGNhbGxiYWNrKVxuICAgICAgdmFsdWUgPSBkYXRhKGtleSk7XG4gICAgfSBlbHNlIGlmIChTdHJpbmcoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGFba2V5XSkpID09PSAnW29iamVjdCBGdW5jdGlvbl0nKSB7XG4gICAgICAvLyBkYXRhIGlzIGEgbWFwIG9mIGNhbGxiYWNrcyAobG9jYWwgY2FsbGJhY2spXG4gICAgICB2YWx1ZSA9IGRhdGFba2V5XShrZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkYXRhIGlzIGEgbWFwIG9mIGRhdGFcbiAgICAgIHZhbHVlID0gZGF0YVtrZXldO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYWxpemUgaW5wdXQgaW50byBbIFtuYW1lMSwgdmFsdWUxXSwgW25hbWUyLCB2YWx1ZTJdLCDigKYgXVxuICAgIC8vIHNvIGV4cGFuc2lvbiBoYXMgdG8gZGVhbCB3aXRoIGEgc2luZ2xlIGRhdGEgc3RydWN0dXJlIG9ubHlcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgLy8gdW5kZWZpbmVkIGFuZCBudWxsIHZhbHVlcyBhcmUgdG8gYmUgaWdub3JlZCBjb21wbGV0ZWx5XG4gICAgICByZXR1cm4gZDtcbiAgICB9IGVsc2UgaWYgKFN0cmluZyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgZm9yIChpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAodmFsdWVbaV0gIT09IHVuZGVmaW5lZCAmJiB2YWx1ZVtpXSAhPT0gbnVsbCkge1xuICAgICAgICAgIC8vIGFycmF5cyBkb24ndCBoYXZlIG5hbWVzXG4gICAgICAgICAgZC52YWwucHVzaChbdW5kZWZpbmVkLCBTdHJpbmcodmFsdWVbaV0pXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGQudmFsLmxlbmd0aCkge1xuICAgICAgICAvLyBvbmx5IHRyZWF0IG5vbi1lbXB0eSBhcnJheXMgYXMgYXJyYXlzXG4gICAgICAgIGQudHlwZSA9IDM7IC8vIGFycmF5XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChTdHJpbmcoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICBmb3IgKGkgaW4gdmFsdWUpIHtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHZhbHVlLCBpKSAmJiB2YWx1ZVtpXSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlW2ldICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gb2JqZWN0cyBoYXZlIGtleXMsIHJlbWVtYmVyIHRoZW0gZm9yIG5hbWVkIGV4cGFuc2lvblxuICAgICAgICAgIGQudmFsLnB1c2goW2ksIFN0cmluZyh2YWx1ZVtpXSldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZC52YWwubGVuZ3RoKSB7XG4gICAgICAgIC8vIG9ubHkgdHJlYXQgbm9uLWVtcHR5IG9iamVjdHMgYXMgb2JqZWN0c1xuICAgICAgICBkLnR5cGUgPSAyOyAvLyBvYmplY3RcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZC50eXBlID0gMTsgLy8gcHJpbWl0aXZlIHN0cmluZyAoY291bGQndmUgYmVlbiBzdHJpbmcsIG51bWJlciwgYm9vbGVhbiBhbmQgb2JqZWN0cyB3aXRoIGEgdG9TdHJpbmcoKSlcbiAgICAgIC8vIGFycmF5cyBkb24ndCBoYXZlIG5hbWVzXG4gICAgICBkLnZhbC5wdXNoKFt1bmRlZmluZWQsIFN0cmluZyh2YWx1ZSldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZDtcbiAgfTtcblxuICAvLyBob29rIGludG8gVVJJIGZvciBmbHVpZCBhY2Nlc3NcbiAgVVJJLmV4cGFuZCA9IGZ1bmN0aW9uKGV4cHJlc3Npb24sIGRhdGEpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBuZXcgVVJJVGVtcGxhdGUoZXhwcmVzc2lvbik7XG4gICAgdmFyIGV4cGFuc2lvbiA9IHRlbXBsYXRlLmV4cGFuZChkYXRhKTtcblxuICAgIHJldHVybiBuZXcgVVJJKGV4cGFuc2lvbik7XG4gIH07XG5cbiAgcmV0dXJuIFVSSVRlbXBsYXRlO1xufSkpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vVVJJanMvc3JjL1VSSVRlbXBsYXRlLmpzXG4gKiogbW9kdWxlIGlkID0gMjlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=