"use strict";

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var State = (function () {
  function State() {
    _classCallCheck(this, State);
  }

  _createClass(State, [{
    key: "construtor",
    value: function construtor(name, from, enter, exit, parent) {
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
  }, {
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

var EventEmitter = require('event-emitter');

var ENTER_EVENT = 'enter';
var TRANSITION_COMPLETE_EVENT = 'transition_complete';
var TRANSITION_DENIED_EVENT = 'transition_denied';
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

var StateMachine = (function (_EventEmmiter) {
  _inherits(StateMachine, _EventEmmiter);

  function StateMachine() {
    _classCallCheck(this, StateMachine);

    _get(Object.getPrototypeOf(StateMachine.prototype), "constructor", this).call(this);
    this.states = {};
    this.parentStates = [];
    this.path = [];
  }

  _createClass(StateMachine, [{
    key: "hasState",
    value: function hasState(stateName) {
      return Object.keys(this.states).indexOf(stateName) !== -1;
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

      this.states[stateName] = new State(stateName, stateData.from, stateData.enter, stateData.exit, this.states[stateData.parent]);
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
      return stateName !== this.state && this.states[stateName].from.indexOf(this.state) !== -1 || this.states[stateName].from === '*';
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
      var fromState = this.states[stateFrom];
      var c = 0;
      var d = 0;
      while (fromState) {
        d = 0;
        var toState = this.states[stateTo];
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
        this.emit(TRANSITION_COMPLETE_EVENT, {
          fromState: this.state,
          toState: stateTo,
          allowedStates: this.states[stateTo].from
        });
        return;
      }

      // call exit and enter callbacks (if they exits)
      var path = this.findPath(this.state, stateTo);
      if (path[0] > 0) {
        if (this.states[this.state].exit !== null && typeof this.states[this.state].exit === "function") {
          this.states[this.state].exit.call(null, { currentState: this.state });
        };

        var _parentState = this.states[this.state];

        for (var i = 0; i < path[0] - 1; i++) {
          _parentState = _parentState.parent;
          if (_parentState.exit !== null && typeof _parentState.exit === "function") {
            _parentState.exit.call(null, { currentState: _parentState.name });
          }
        }
      }
      var oldState = this.state;
      this.state = stateTo;
      if (path[1] > 0) {
        if (typeof this.states[stateTo].root !== "undefined" && this.states[stateTo].root !== null) {
          var parentStates = this.states[stateTo].parents;
          for (var k = path[1] - 2; k >= 0; k--) {
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
    key: "initialState",
    set: function set(stateName) {
      if (this.state === undefined && this.hasState(stateName)) {
        this.state = stateName;

        // Invoke the enter callback for all parent states down from the root parent of the state we're transitioning into

        if (typeof this.states[this.state].root !== "undefined" && this.states[this.state].root !== null) {
          var parentStates = this.states[this.state].parents;
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
              if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                _iterator2["return"]();
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
    key: "state",
    get: function get() {
      return this.states[this.state];
    }
  }, {
    key: "states",
    get: function get() {
      return this.states;
    }
  }]);

  return StateMachine;
})(EventEmmiter);

module.exports = StateMachine;
