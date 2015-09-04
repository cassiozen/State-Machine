/* @flow */

'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

var _State = require('./State');

var _State2 = _interopRequireDefault(_State);

var ENTER_EVENT: string = 'enter';
var TRANSITION_COMPLETE_EVENT: string = 'transition_complete';
var TRANSITION_DENIED_EVENT: string = 'transition_denied';

var emitter = new _eventEmitter2['default']();
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
 *	monsterSM = new StateMachine()
 *
 *	monsterSM.addState("idle",{enter:onIdle, from:"attack"})
 *	monsterSM.addState("attack",{enter:onAttack, from:"idle"})
 *	monsterSM.addState("melee attack",{parent:"atack", enter:onMeleeAttack, from:"attack"})
 *	monsterSM.addState("smash",{parent:"melle attack", enter:onSmash})
 *	monsterSM.addState("punch",{parent:"melle attack", enter:onPunch})
 *	monsterSM.addState("missle attack",{parent:"attack", enter:onMissle})
 *	monsterSM.addState("die",{enter:onDead, from:"attack", enter:onDie})
 *
 *	monsterSM.initialState = "idle"
 *	</pre>
*/

var StateMachine = (function () {
	function StateMachine() {
		_classCallCheck(this, StateMachine);

		this.states = {};
		this.parentStates = [];
		this.path = [];
	}

	_createClass(StateMachine, [{
		key: 'emit',
		value: function emit() {
			emitter.emit.apply(emitter, arguments);
		}
	}, {
		key: 'hasState',
		value: function hasState(stateName: string): bool {
			return Object.keys(this.states).indexOf(stateName) !== -1;
		}

		/**
   * Adds a new state
   * stateName	The name of the new State
   * stateData	An objct containing state enter and exit callbacks and allowed states to transition from
   * The "from" property can be a string or and array with the state names or * to allow any transition
  **/
	}, {
		key: 'addState',
		value: function addState(stateName: string): void {
			var stateData: Object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			if (this.hasState(stateName)) {
				console.log("[StateMachine] Overriding existing state " + stateName);
			}

			this.states[stateName] = new _State2['default'](stateName, stateData.from, stateData.enter, stateData.exit, this.states[stateData.parent]);
		}

		/**
   * Sets the first state, calls enter callback and dispatches TRANSITION_COMPLETE
   * These will only occour if no state is defined
   * stateName	The name of the State
  **/
	}, {
		key: 'getStateByName',
		value: function getStateByName(name: string): any {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this.states[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
					if (!_iteratorNormalCompletion && _iterator['return']) {
						_iterator['return']();
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
		key: 'canChangeStateTo',
		value: function canChangeStateTo(stateName: string): bool {
			return stateName !== this.state && this.states[stateName].from.indexOf(this.state) !== -1 || this.states[stateName].from === '*';
		}

		/**
   * Discovers the how many "exits" and how many "enters" are there between two
   * given states and returns an array with these two integers
   * stateFrom The state to exit
   * stateTo The state to enter
  **/
	}, {
		key: 'findPath',
		value: function findPath(stateFrom: string, stateTo: string): Array<number> {
			// Verifies if the states are in the same "branch" or have a common parent
			var fromState: _State2['default'] = this.states[stateFrom];
			var c: number = 0;
			var d: number = 0;
			while (fromState) {
				d = 0;
				var toState: _State2['default'] = this.states[stateTo];
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
		key: 'changeState',
		value: function changeState(stateTo: string): void {
			// If there is no state that maches stateTo
			if (!this.hasState(stateTo)) {
				console.warn("[StateMachine] Cannot make transition: State " + stateTo + " is not defined");
				return;
			}

			// If current state is not allowed to make this transition
			if (!this.canChangeStateTo(stateTo)) {
				console.warn("[StateMachine] Transition to " + stateTo + " denied");
				this.emit(TRANSITION_COMPLETE_EVENT, {
					fromState: this.state,
					toState: stateTo,
					allowedStates: this.states[stateTo].from
				});
				return;
			}

			// call exit and enter callbacks (if they exits)
			var path: Array<number> = this.findPath(this.state, stateTo);
			if (path[0] > 0) {
				if (this.states[this.state].exit !== null && typeof this.states[this.state].exit === "function") {
					this.states[this.state].exit.call(null, { currentState: this.state });
				};

				var _parentState: _State2['default'] = this.states[this.state];

				for (var i: number = 0; i < path[0] - 1; i++) {
					_parentState = _parentState.parent;
					if (_parentState.exit !== null && typeof _parentState.exit === "function") {
						_parentState.exit.call(null, { currentState: _parentState.name });
					}
				}
			}
			var oldState: String = this.state;
			this.state = stateTo;
			if (path[1] > 0) {
				if (typeof this.states[stateTo].root !== "undefined" && this.states[stateTo].root !== null) {
					var parentStates: Array<_State2['default']> = this.states[stateTo].parents;
					for (var k: number = path[1] - 2; k >= 0; k--) {
						if (typeof parentStates[k] !== "undefined" && parentStates[k] !== null && parentStates[k].enter !== null && typeof parentStates[k].enter === "function") {
							parentStates[k].enter.call(null, { currentState: parentStates[k].name });
						}
					}
				}
				if (this.states[this.state].enter !== null && typeof this.states[this.state].enter === "function") {
					this.states[this.state].enter.call(null, { currentState: this.state });
				}
			}
			console.log("[StateMachine] State Changed to " + this.state);

			// Transition is complete. dispatch TRANSITION_COMPLETE
			this.emit(TRANSITION_COMPLETE_EVENT, { fromState: oldState, toState: stateTo });
		}
	}, {
		key: 'initialState',
		set: function set(stateName: string): void {
			if (this.state === undefined && this.hasState(stateName)) {
				this.state = stateName;

				// Invoke the enter callback for all parent states down from the root parent of the state we're transitioning into

				if (typeof this.states[this.state].root !== "undefined" && this.states[this.state].root !== null) {
					var parentStates: Array<_State2['default']> = this.states[this.state].parents;
					var _iteratorNormalCompletion2 = true;
					var _didIteratorError2 = false;
					var _iteratorError2 = undefined;

					try {
						for (var _iterator2 = parentStates[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
							parentState = _step2.value;

							if (parentState.enter !== null && typeof parentState.enter === "function") {
								parentState.enter.call(this, { toState: stateName });
							}
						}
					} catch (err) {
						_didIteratorError2 = true;
						_iteratorError2 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion2 && _iterator2['return']) {
								_iterator2['return']();
							}
						} finally {
							if (_didIteratorError2) {
								throw _iteratorError2;
							}
						}
					}

					;
				}

				// Invoke the enter callback of the state we're transitioning into
				if (this.states[this.state].enter !== null && typeof this.states[this.state].enter === "function") {
					this.states[this.state].enter.call(this, { currentState: this.state });
				}

				this.emit(TRANSITION_COMPLETE_EVENT, { toState: stateName });
			}
		}

		/**
   *	Getters for the current state and for the Dictionary of states
   */
	}, {
		key: 'state',
		get: function get(): string {
			return this.states[this.state];
		}
	}, {
		key: 'states',
		get: function get(): Object {
			return this.states;
		}
	}]);

	return StateMachine;
})();

exports['default'] = StateMachine;
module.exports = exports['default'];