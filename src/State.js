/* @flow */

export default class State {

  name: string;
  from: any;
  enter: Function;
  exit: Function;
  parent: State;
  children: Array<State>;
  _parent: State;

  construtor(name:string, from:any, enter:Function, exit:Function, parent:State) {
    this.name = name;
    this.from = from || "*";
    this.enter = enter;
    this.exit = exit;
    this.children = [];
    if ((typeof parent !== "undefined" && parent !== null)) {
      this._parent = parent;
      this._parent.children.push(this);
    }
  }

  set parent(parent:State):void {
    this._parent = parent;
    this._parent.children.push(this);
  }

  get parent():State {
    return this._parent;
  }

  get root():State {
    let parentState:State = this._parent;
    if ((typeof parentState !== "undefined" && parentState !== null)) {
      while (parentState.parent)
      {
        parentState = parentState.parent;
      }
    }
    return parentState;
  }

  get parents():Array<State> {
    let parentList:Array<State> = [];
    let parentState:State = this._parent;
    if ((typeof parentState !== "undefined" && parentState !== null)) {
      parentList.push(parentState);
      while (parentState.parent)
      {
        parentState = parentState.parent;
        parentList.push(parentState);
      }
    }
    return parentList;
  }
}
