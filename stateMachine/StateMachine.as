package stateMachine
{
	import flash.events.*;
	import flash.utils.Dictionary; 

	public class StateMachine extends EventDispatcher
	{
		public var id:String
		/* @private */
		public var _state:String;
		/* @private */
		public var _states:Dictionary;
		/* @private */
		public var _outEvent:StateMachineEvent;
		/* @private */
		public var parentState:State;
		/* @private */
		public var parentStates:Array;
		/* @private */
		public var path:Array;
		
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
		 *	playerSM.addEventListener(StateMachineEvent.TRANSITION_DENIED,transitionDeniedFunction);
		 *	playerSM.addEventListener(StateMachineEvent.TRANSITION_COMPLETE,transitionCompleteFunction);
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
		public function StateMachine()
		{
			_states = new Dictionary();
		}

		/**
		 * Adds a new state
		 * @param stateName	The name of the new State
		 * @param stateData	A hash containing state enter and exit callbacks and allowed states to transition from
		 * The "from" property can be a string or and array with the state names or * to allow any transition
		**/
		public function addState(stateName:String, stateData:Object=null):void
		{
			if(stateName in _states) trace("[StateMachine]",id,"Overriding existing state " + stateName);
			if(stateData == null) stateData = {};
			_states[stateName] = new State(stateName, stateData.from, stateData.enter, stateData.exit, _states[stateData.parent])
		}

		/**
		 * Sets the first state, calls enter callback and dispatches TRANSITION_COMPLETE
		 * These will only occour if no state is defined
		 * @param stateName	The name of the State
		**/
		public function set initialState(stateName:String):void
		{
			if (_state == null && stateName in _states){
				_state = stateName;
				
				var _callbackEvent:StateMachineEvent = new StateMachineEvent(StateMachineEvent.ENTER_CALLBACK);
				_callbackEvent.toState = stateName;
					
				if(_states[_state].root){
					parentStates = _states[_state].parents
					for(var j:int = _states[_state].parents.length-1; j>=0; j--){
						if(parentStates[j].enter){
							_callbackEvent.currentState = parentStates[j].name
							parentStates[j].enter.call(null,_callbackEvent)
						}
					}
				}
			
				if(_states[_state].enter){
					_callbackEvent.currentState = _state
					_states[_state].enter.call(null,_callbackEvent)
				}
				_outEvent = new StateMachineEvent(StateMachineEvent.TRANSITION_COMPLETE);
				_outEvent.toState = stateName;
				dispatchEvent(_outEvent);
			}
		}

		/**
		 *	Getters for the current state and for the Dictionary of states
		 */
		public function get state():String
		{
			return _states[_state];
		}
		
		public function get states():Dictionary
		{
			return _states;
		}
		
		public function getStateByName( name:String ):State
		{
			for each( var s:State in _states ){
				if( s.name == name )
					return s;
			}
			
			return null;
		}
		/**
		 * Verifies if a transition can be made from the current state to the state passed as param
		 * @param stateName	The name of the State
		**/
		public function canChangeStateTo(stateName:String):Boolean
		{
			return (stateName!=_state && (_states[stateName].from.indexOf(_state)!=-1 || _states[stateName].from == "*"));
		}

		/**
		 * Discovers the how many "exits" and how many "enters" are there between two
		 * given states and returns an array with these two integers
		 * @param stateFrom The state to exit
		 * @param stateTo The state to enter
		**/
		public function findPath(stateFrom:String, stateTo:String):Array
		{
			// Verifies if the states are in the same "branch" or have a common parent
			var fromState:State = _states[stateFrom];
			var c:int = 0;
			var d:int = 0;
			while (fromState)
			{
				d=0;
				var toState:State = _states[stateTo];
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
		 * @param stateTo	The name of the state to transition to
		**/
		public function changeState(stateTo:String):void
		{
			// If there is no state that maches stateTo
			if (!(stateTo in _states)){
				trace("[StateMachine]",id,"Cannot make transition: State "+ stateTo +" is not defined");
				return;
			}
			
			// If current state is not allowed to make this transition
			if(!canChangeStateTo(stateTo))
			{
				trace("[StateMachine]",id,"Transition to "+ stateTo +" denied");
				_outEvent = new StateMachineEvent(StateMachineEvent.TRANSITION_DENIED);
				_outEvent.fromState = _state;
				_outEvent.toState = stateTo;
				_outEvent.allowedStates = _states[stateTo].from;
				dispatchEvent(_outEvent);
				return;
			}
			
			// call exit and enter callbacks (if they exits)
			path = findPath(_state,stateTo);
			if(path[0]>0)
			{
				var _exitCallbackEvent:StateMachineEvent = new StateMachineEvent(StateMachineEvent.EXIT_CALLBACK);
				_exitCallbackEvent.toState = stateTo;
				_exitCallbackEvent.fromState = _state;
				
				if(_states[_state].exit){
					_exitCallbackEvent.currentState = _state;
					_states[_state].exit.call(null,_exitCallbackEvent);
				}
				parentState = _states[_state];
				for(var i:int=0; i<path[0]-1; i++)
				{
					parentState = parentState.parent;
					if(parentState.exit != null){
						_exitCallbackEvent.currentState = parentState.name;
						parentState.exit.call(null,_exitCallbackEvent);
					}
				}
			}
			var oldState:String = _state;
			_state = stateTo;
			if(path[1]>0)
			{
				var _enterCallbackEvent:StateMachineEvent = new StateMachineEvent(StateMachineEvent.ENTER_CALLBACK);
				_enterCallbackEvent.toState = stateTo;
				_enterCallbackEvent.fromState = oldState;
				
				if(_states[stateTo].root)
				{
					parentStates = _states[stateTo].parents
					for(var k:int = path[1]-2; k>=0; k--)
					{
						if(parentStates[k] && parentStates[k].enter){
							_enterCallbackEvent.currentState = parentStates[k].name;
							parentStates[k].enter.call(null,_enterCallbackEvent);
						}
					}
				}
				 if(_states[_state].enter){
					_enterCallbackEvent.currentState = _state;
					_states[_state].enter.call(null,_enterCallbackEvent);
				}
			}
			trace("[StateMachine]",id,"State Changed to " + _state);
			
			// Transition is complete. dispatch TRANSITION_COMPLETE
			_outEvent = new StateMachineEvent(StateMachineEvent.TRANSITION_COMPLETE);
			_outEvent.fromState = oldState ;
			_outEvent.toState = stateTo;
			dispatchEvent(_outEvent);
		}
	}
}