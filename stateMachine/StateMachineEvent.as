package stateMachine
{
	import flash.events.Event;
	
	public class StateMachineEvent extends Event
	{
		public static const EXIT_CALLBACK:String = "exit";
		public static const ENTER_CALLBACK:String = "enter";
		public static const TRANSITION_COMPLETE:String = "transition complete";
		public static const TRANSITION_DENIED:String = "transition denied";
		
		public var fromState : String;
		public var toState : String;
		public var currentState : String;
		public var allowedStates : Object;

		public function StateMachineEvent(type:String, bubbles:Boolean=false, cancelable:Boolean=false)
		{
			super(type, bubbles, cancelable);
		}
	}
}