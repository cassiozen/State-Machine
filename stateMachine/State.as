package stateMachine
{
	public class State
	{
		public var name:String;
		public var from:Object;
		public var enter:Function;
		public var exit:Function;
		public var _parent:State;
		public var children:Array;
		
		public function State(name:String, from:Object = null, enter:Function = null, exit:Function = null, parent:State = null)
		{
			this.name = name;
			if (!from) from = "*";
			this.from = from;
			this.enter = enter;
			this.exit = exit;
			this.children = [];
			if (parent)
			{
				_parent = parent;
				_parent.children.push(this);
			}
		}
		
		public function set parent(parent:State):void
		{
			_parent = parent;
			_parent.children.push(this);
		}
		
		public function get parent():State
		{
			return _parent;
		}
		
		public function get root():State
		{
			var parentState:State = _parent;
			if(parentState)
			{
				while (parentState.parent)
				{
					parentState = parentState.parent;
				}
			}
			return parentState;
		}
		public function get parents():Array
		{
			var parentList:Array = [];
			var parentState:State = _parent;
			if(parentState)
			{
				parentList.push(parentState);
				while (parentState.parent)
				{
					parentState = parentState.parent;
					parentList.push(parentState);
				}
			}
			return parentList;
		}
		public function toString():String
		{
			return this.name;
		}
	}
}