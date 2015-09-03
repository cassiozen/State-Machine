import EventEmitter from 'events-emitter';
import State from './State';

const ENTER_EVENT = 'enter';
const TRANSITION_COMPLETE_EVENT = 'transition_complete';
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
class StateMachine extends EventEmmiter {
  constructor(){
    this.state:string = undefined;
    this.states:Object = {};
    this.parentState:State = undefined;
    this.parentStates:Array = [];
    this.path:Array = [];
  }

  hasState(stateName):boolean {
    return Object.keys(this.states).indexOf(stateName) !== -1;
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

    states[stateName] = new State(stateName, stateData.from, stateData.enter, stateData.exit, states[stateData.parent]);
  }

  /**
   * Sets the first state, calls enter callback and dispatches TRANSITION_COMPLETE
   * These will only occour if no state is defined
   * stateName	The name of the State
  **/
  set initialState(stateName:string):void {
    if (this.state === undefined && this.hasState(stateName)) {
      this.state = stateName;

      // Invoke the enter callback for all parent states down from the root parent of the state we're transitioning into
      if(this.states[this.state].root){
        let parentStates:Array = this.states[this.state].parents;
        for (parentState:State of parentStates) {
          if(parentState.enter){
            parentState.enter.call(this, {toState: stateName});
          }
        };
      }

      // Invoke the enter callback of the state we're transitioning into
      if(this.states[this.state].enter){
        parentState.enter.call(this, {currentState: this.state});
      }

      this.emit(TRANSITION_COMPLETE_EVENT, {toState:stateName});
    }
  }

}
