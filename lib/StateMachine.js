"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function() {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	return function(Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
})();

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : {
		"default": obj
	};
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

var State = (function() {
	function State(name, from, enter, exit, parent) {
		_classCallCheck(this, State);

		this.name = name;
		this.from = from || "*";
		this.enter = enter;
		this.exit = exit;
		this.children = [];
		if (typeof parent !== "undefined" && parent !== null) {
			this._parent = parent;
			this._parent.children.push(this);
		}
	}

	_createClass(State, [{
		key: "parent",
		set: function set(parent) {
			this._parent = parent;
			this._parent.children.push(this);
		},
		get: function get() {
			return this._parent;
		}
	}, {
		key: "root",
		get: function get() {
			var parentState = this._parent;
			if (typeof parentState !== "undefined" && parentState !== null) {
				while (parentState.parent) {
					parentState = parentState.parent;
				}
			}
			return parentState;
		}
	}, {
		key: "parents",
		get: function get() {
			var parentList = [];
			var parentState = this._parent;
			if (typeof parentState !== "undefined" && parentState !== null) {
				parentList.push(parentState);
				while (parentState.parent) {
					parentState = parentState.parent;
					parentList.push(parentState);
				}
			}
			return parentList;
		}
	}]);

	return State;
})();

exports["default"] = State;

var ENTER_EVENT = 'enter';
var TRANSITION_COMPLETE_EVENT = 'transition_complete';
var TRANSITION_DENIED_EVENT = 'transition_denied';

var emitter = new _eventEmitter2["default"]();
/**
* Creates a generic StateMachine. Available states can be set with addState and initial state can
* be set using initialState setter.
* @example This sample creates a state machine for a player model with 3 states (Playing, paused and stopped)
* <pre>
*	playerSM = new StateMachine();
*
*	playerSM.addState("playing",{ enter: onPlayingEnter, exit: onPlayingExit, from:["paused","stopped"] });
*	playerSM.addState("paused",{ enter: onPausedEnter, from:"playing"});
*	playerSM.addState("stopped",{ enter: onStoppedEnter, from:"*"});
*
*	playerSM.addEventListener(StateMachineEvents.TRANSITION_DENIED,transitionDeniedFunction);
*	playerSM.addEventListener(StateMachineEvents.TRANSITION_COMPLETE,transitionCompleteFunction);
*
*	playerSM.initialState = "stopped";
* </pre>
*
* It's also possible to create hierarchical state machines using the argument "parent" in the addState method
* @example This example shows the creation of a hierarchical state machine for the monster of a game
* (Its a simplified version of the state machine used to control the AI in the original Quake game)
*	<pre>
*  var monsterSM = new StateMachine()
*  monsterSM.addState("idle",{enter:this.onIdle, from:["smash", "punch", "missle attack"]})
*  monsterSM.addState("attack",{enter:this.onAttack, from:"idle"})
*  monsterSM.addState("melee attack",{parent:"attack", enter:this.onMeleeAttack, from:"attack"})
*  monsterSM.addState("smash",{parent:"melee attack", enter:this.onSmash})
*  monsterSM.addState("punch",{parent:"melee attack", enter:this.onPunch})
*  monsterSM.addState("missle attack",{parent:"attack", enter:this.onMissle})
*  monsterSM.addState("die",{enter:this.onDead, from:["smash", "punch", "missle attack"]})
*
*  monsterSM.initialState = "idle"
*	</pre>
*/

var StateMachine = (function() {
	function StateMachine() {
		_classCallCheck(this, StateMachine);

		this._states = {};
		this.parentStates = [];
		this.path = [];
	}

	_createClass(StateMachine, [{
		key: "emit",
		value: function emit() {
			emitter.emit.apply(emitter, arguments);
		}
	}, {
		key: "on",
		value: function on() {
			emitter.on.apply(emitter, arguments);
		}
	}, {
		key: "off",
		value: function off() {
			emitter.off.apply(emitter, arguments);
		}
	}, {
		key: "hasState",
		value: function hasState(stateName) {
			return Object.keys(this._states).indexOf(stateName) !== -1;
		}

		/**
		* Adds a new state
		* stateName	The name of the new State
		* stateData	An objct containing state enter and exit callbacks and allowed states to transition from
		* The "from" property can be a string or and array with the state names or * to allow any transition
		**/
	}, {
		key: "addState",
		value: function addState(stateName) {
			var stateData = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			if (this.hasState(stateName)) {
				console.log("[StateMachine] Overriding existing state " + stateName);
			}

			this._states[stateName] = new State(stateName, stateData.from, stateData.enter, stateData.exit, this._states[stateData.parent]);
		}

		/**
		* Sets the first state, calls enter callback and dispatches TRANSITION_COMPLETE
		* These will only occour if no state is defined
		* stateName	The name of the State
		**/
	}, {
		key: "getStateByName",
		value: function getStateByName(name) {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this._states[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					state = _step.value;

					if (state.name === name) {
						return state;
					}
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator["return"]) {
						_iterator["return"]();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			return null;
		}

		/**
		* Verifies if a transition can be made from the current state to the state passed as param
		* stateName	The name of the State
		**/
	}, {
		key: "canChangeStateTo",
		value: function canChangeStateTo(stateName) {
			return stateName !== this._state && this._states[stateName].from.indexOf(this._state) !== -1 || this._states[stateName].from === '*';
		}

		/**
		* Discovers the how many "exits" and how many "enters" are there between two
		* given states and returns an array with these two integers
		* stateFrom The state to exit
		* stateTo The state to enter
		**/
	}, {
		key: "findPath",
		value: function findPath(stateFrom, stateTo) {
			// Verifies if the states are in the same "branch" or have a common parent
			var fromState = this._states[stateFrom];
			var c = 0;
			var d = 0;
			while (fromState) {
				d = 0;
				var toState = this._states[stateTo];
				while (toState) {
					if (fromState == toState) {
						// They are in the same brach or have a common parent Common parent
						return [c, d];
					}
					d++;
					toState = toState.parent;
				}
				c++;
				fromState = fromState.parent;
			}
			// No direct path, no commom parent: exit until root then enter until element
			return [c, d];
		}

		/**
		* Changes the current state
		* This will only be done if the intended state allows the transition from the current state
		* Changing states will call the exit callback for the exiting state and enter callback for the entering state
		* stateTo	The name of the state to transition to
		**/
	}, {
		key: "changeState",
		value: function changeState(stateTo) {
			// If there is no state that maches stateTo
			if (!this.hasState(stateTo)) {
				console.warn("[StateMachine] Cannot make transition: State " + stateTo + " is not defined");
				return;
			}

			// If current state is not allowed to make this transition
			if (!this.canChangeStateTo(stateTo)) {
				console.warn("[StateMachine] Transition to " + stateTo + " denied");
				this.emit(TRANSITION_DENIED_EVENT, {
					fromState: this._state,
					toState: stateTo,
					allowedStates: this._states[stateTo].from
				});
				return;
			}

			// call exit and enter callbacks (if they exits)
			var path = this.findPath(this._state, stateTo);
			if (path[0] > 0) {
				if (this._states[this._state].exit !== null && typeof this._states[this._state].exit === "function") {
					this._states[this._state].exit.call(null, {
						currentState: this._state
					});
				};

				var _parentState = this._states[this._state];

				for (var i = 0; i < path[0] - 1; i++) {
					_parentState = _parentState.parent;
					if (_parentState.exit !== null && typeof _parentState.exit === "function") {
						_parentState.exit.call(null, {
							currentState: _parentState.name
						});
					}
				}
			}
			var oldState = this._state;
			this._state = stateTo;
			if (path[1] > 0) {
				if (typeof this._states[stateTo].root !== "undefined" && this._states[stateTo].root !== null) {
					var parentStates = this._states[stateTo].parents;
					for (var k = path[1] - 2; k >= 0; k--) {
						if (typeof parentStates[k] !== "undefined" && parentStates[k] !== null && parentStates[k].enter !== null && typeof parentStates[k].enter === "function") {
							parentStates[k].enter.call(null, {
								currentState: parentStates[k].name
							});
						}
					}
				}
				if (this._states[this._state].enter !== null && typeof this._states[this._state].enter === "function") {
					this._states[this._state].enter.call(null, {
						currentState: this._state
					});
				}
			}
			console.log("[StateMachine] State Changed to " + this._state);

			// Transition is complete. dispatch TRANSITION_COMPLETE
			this.emit(TRANSITION_COMPLETE_EVENT, {
				fromState: oldState,
				toState: stateTo
			});
		}
	}, {
		key: "initialState",
		set: function set(stateName) {
			if (this._state === undefined && this.hasState(stateName)) {
				this._state = stateName;

				// Invoke the enter callback for all parent states down from the root parent of the state we're transitioning into

				if (typeof this._states[this._state].root !== "undefined" && this._states[this._state].root !== null) {
					var parentStates = this._states[this._state].parents;
					var _iteratorNormalCompletion2 = true;
					var _didIteratorError2 = false;
					var _iteratorError2 = undefined;

					try {
						for (var _iterator2 = parentStates[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
							parentState = _step2.value;

							if (parentState.enter !== null && typeof parentState.enter === "function") {
								parentState.enter.call(this, {
									toState: stateName
								});
							}
						}
					} catch (err) {
						_didIteratorError2 = true;
						_iteratorError2 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
								_iterator2["return"]();
							}
						} finally {
							if (_didIteratorError2) {
								throw _iteratorError2;
							}
						}
					};
				}

				// Invoke the enter callback of the state we're transitioning into
				if (this._states[this._state].enter !== null && typeof this._states[this._state].enter === "function") {
					this._states[this._state].enter.call(this, {
						currentState: this._state
					});
				}

				this.emit(TRANSITION_COMPLETE_EVENT, {
					toState: stateName
				});
			}
		}

		/**
		*	Getters for the current state and for the Dictionary of states
		*/
	}, {
		key: "state",
		get: function get() {
			return this._states[this._state];
		}
	}, {
		key: "states",
		get: function get() {
			return this._states;
		}
	}]);

	return StateMachine;
})();

exports["default"] = StateMachine;
module.exports = exports["default"];
