export default class State {
  construtor(name:string, from:Object, enter:Function, exit:Function, parent:State) {
    this.name = name;
    this.from = from || "*";
    this.enter = enter;
    this.exit = exit;
    this.children = [];
    if (parent)
    {
      this._parent = parent;
      _parent.children.push(this);
    }
  }

  set parent(parent):void {
    this._parent = parent;
    this._parent.children.push(this);
  }

  get parent():State {
    return this._parent;
  }

  get root():State {
    let parentState:State = this._parent;
    if(parentState)
    {
      while (parentState.parent)
      {
        parentState = parentState.parent;
      }
    }
    return parentState;
  }

  get parents():Array {
    let parentList:Array = [];
    let parentState:State = this._parent;
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
};
