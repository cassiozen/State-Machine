/* @flow */

import EventEmitter from 'event-emitter';
import State from './State';

const ENTER_EVENT:string = 'enter';
const TRANSITION_COMPLETE_EVENT:string = 'transition_complete';
const TRANSITION_DENIED_EVENT:string = 'transition_denied';

const emitter = new EventEmitter();
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
export default class StateMachine {
	_state:string;
	_states:Array<State>;
	parentState:State;
	parentStates:Array<State>;
	path:Array<number>;

  constructor(){
    this._states = [];
    this.parentStates = [];
    this.path = [];

  }

	emit(){
		emitter.emit(...arguments);
	}

  hasState(stateName:string):boolean {
    return Object.keys(this._states).indexOf(stateName) !== -1;
  }

  /**
   * Adds a new state
   * stateName	The name of the new State
   * stateData	An objct containing state enter and exit callbacks and allowed states to transition from
   * The "from" property can be a string or and array with the state names or * to allow any transition
  **/
  addState(stateName:string, stateData:Object = {}):void {
    if(this.hasState(stateName)){
      console.log("[StateMachine] Overriding existing state " + stateName);
    }

    this._states[stateName] = new State(stateName, stateData.from, stateData.enter, stateData.exit, this._states[stateData.parent]);
  }

  /**
   * Sets the first state, calls enter callback and dispatches TRANSITION_COMPLETE
   * These will only occour if no state is defined
   * stateName	The name of the State
  **/
  set initialState(stateName:string):void {
    if (this._state === undefined && this.hasState(stateName)) {
      this._state = stateName;

      // Invoke the enter callback for all parent states down from the root parent of the state we're transitioning into

      if(typeof this._states[this._state].root !== "undefined" && this._states[this._state].root !== null){
        let parentStates:Array<State> = this._states[this._state].parents;
        for (parentState of parentStates) {

          if(parentState.enter !== null && typeof parentState.enter === "function"){
            parentState.enter.call(this, {toState: stateName});
          }
        };
      }

      // Invoke the enter callback of the state we're transitioning into
      if(this._states[this._state].enter !== null && typeof this._states[this._state].enter === "function"){
        this._states[this._state].enter.call(this, {currentState: this._state});
      }

      this.emit(TRANSITION_COMPLETE_EVENT, {toState:stateName});
    }
  }

	/**
	 *	Getters for the current state and for the Dictionary of states
	 */
	get state():string {
		return this._states[this._state];
	}

	get states():Object {
		return this._states;
	}

	getStateByName(name:string):any	{
		for (state of this._states) {
			if(state.name === name){
				return state;
			}
		}
		return null;
	}

	/**
	 * Verifies if a transition can be made from the current state to the state passed as param
	 * stateName	The name of the State
	**/
	canChangeStateTo(stateName:string):boolean {
		return (stateName !== this._state && ( this._states[stateName].from.indexOf(this._state)!== -1) || this._states[stateName].from === '*' );
	}

	/**
	 * Discovers the how many "exits" and how many "enters" are there between two
	 * given states and returns an array with these two integers
	 * stateFrom The state to exit
	 * stateTo The state to enter
	**/
	findPath(stateFrom:string, stateTo:string):Array<number> {
		// Verifies if the states are in the same "branch" or have a common parent
		let fromState:State = this._states[stateFrom];
		let c:number = 0;
		let d:number = 0;
		while (fromState)
		{
			d=0;
			let toState:State = this._states[stateTo];
			while (toState)
			{
				if(fromState == toState)
				{
					// They are in the same brach or have a common parent Common parent
					return [c,d];
				}
				d++;
				toState = toState.parent;
			}
			c++;
			fromState = fromState.parent;
		}
		// No direct path, no commom parent: exit until root then enter until element
		return [c,d];
	}

	/**
	 * Changes the current state
	 * This will only be done if the intended state allows the transition from the current state
	 * Changing states will call the exit callback for the exiting state and enter callback for the entering state
	 * stateTo	The name of the state to transition to
	**/
	changeState(stateTo:string):void {
		// If there is no state that maches stateTo
		if (!this.hasState(stateTo)){
			console.warn("[StateMachine] Cannot make transition: State "+ stateTo +" is not defined");
			return;
		}

		// If current state is not allowed to make this transition
		if(!this.canChangeStateTo(stateTo))
		{
			console.warn("[StateMachine] Transition to "+ stateTo +" denied");
			this.emit(TRANSITION_COMPLETE_EVENT, {
				fromState:this._state,
				toState:stateTo,
				allowedStates: this._states[stateTo].from
			});
			return;
		}

		// call exit and enter callbacks (if they exits)
		let path:Array<number> = this.findPath(this._state,stateTo);
		if(path[0]>0){
			if(this._states[this._state].exit !== null && typeof this._states[this._state].exit === "function"){
				this._states[this._state].exit.call(null,{currentState: this._state});
			};

			let parentState:State = this._states[this._state];

			for(let i:number=0; i<path[0]-1; i++)
			{
				parentState = parentState.parent;
				if(parentState.exit !== null && typeof parentState.exit === "function"){
					parentState.exit.call(null,{currentState: parentState.name});
				}
			}
		}
		let oldState:String = this._state;
		this._state = stateTo;
		if(path[1]>0)
		{
			if(typeof this._states[stateTo].root !== "undefined" && this._states[stateTo].root !== null){
				let parentStates:Array<State> = this._states[stateTo].parents;
				for(var k:number = path[1]-2; k>=0; k--){
					if(typeof parentStates[k] !== "undefined" &&
					parentStates[k] !== null &&
					parentStates[k].enter !== null &&
					typeof parentStates[k].enter === "function"){
						parentStates[k].enter.call(null,{currentState: parentStates[k].name});
					}
				}
			}
			if(this._states[this._state].enter !== null && typeof this._states[this._state].enter === "function"){
				this._states[this._state].enter.call(null,{currentState: this._state});
			}
		}
		console.log("[StateMachine] State Changed to " + this._state);

		// Transition is complete. dispatch TRANSITION_COMPLETE
		this.emit(TRANSITION_COMPLETE_EVENT, {fromState:oldState, toState:stateTo});
	}
}
