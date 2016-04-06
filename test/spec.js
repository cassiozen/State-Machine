var expect    = require("chai").expect;
var StateMachine = require("../lib/StateMachine");
var should = require('chai').should()
var basic_sm, event_sm, hierachical_sm;
var executedCallbacks = [];

describe("State Machine", function() {
  describe("Non-hierarchical", function() {
    beforeEach(function(){
      basic_sm = new StateMachine();
      basic_sm.addState("playing",{ from:"*" });
      basic_sm.addState("stopped",{ from:"*" });
      basic_sm.addState("paused",{ from:"playing" });
      basic_sm.initialState = "stopped";
    });

    it("should be on defined initial state", function() {
      basic_sm.should.have.property('state');
      basic_sm.state.should.be.a('object');
      basic_sm.state.should.have.property('name');
      basic_sm.state.name.should.equal('stopped');
    });

    it("should not be able to change to paused from stopped", function() {
      basic_sm.changeState('paused');
      basic_sm.state.name.should.equal('stopped');
    });

    it("should be able to change to playing from stopped", function() {
      basic_sm.changeState('playing');
      basic_sm.state.name.should.equal('playing');
    });

    it("should be able to change to paused from playing", function() {
      basic_sm.changeState('playing');
      basic_sm.changeState('paused');
      basic_sm.state.name.should.equal('paused');
    });
  });

  describe("Hierarchical", function() {

    beforeEach(function(){
      executedCallbacks = []
    })

    before(function(){
      var onAttack = function(){
        executedCallbacks.push('onAttack');
      };
      var onExitAttack = function(){
        executedCallbacks.push('onExitAttack');
      };
      var onMeleeAttack = function(){
        executedCallbacks.push('onMeleeAttack');
      };
      var onPunch = function(){
        executedCallbacks.push('onPunch');
      };
      var onExitMeleeAttack = function(){
        executedCallbacks.push('onExitMeleeAttack');
      };
      var onExitPunch = function(){
        executedCallbacks.push('onExitPunch');
      };

      hierachical_sm = new StateMachine();
      hierachical_sm.addState("idle",{from:["smash", "punch", "missle attack"]});
      hierachical_sm.addState("attack",{enter:onAttack, exit:onExitAttack, from:"idle"});
      hierachical_sm.addState("melee attack",{parent:"attack", enter:onMeleeAttack, exit:onExitMeleeAttack, from:"attack"});
      hierachical_sm.addState("smash",{parent:"melee attack"});
      hierachical_sm.addState("punch",{parent:"melee attack", enter:onPunch, exit:onExitPunch});
      hierachical_sm.addState("missle attack",{parent:"attack"});
      hierachical_sm.addState("die",{from:["smash", "punch", "missle attack"]});

      hierachical_sm.initialState = "idle";
    });

    it("should dispatch enter for each nested state", function() {
      hierachical_sm.changeState('punch');
      executedCallbacks.join().should.equal('onAttack,onMeleeAttack,onPunch');
      hierachical_sm.state.name.should.equal('punch');
    });

    it("should dispatch exit for each nested state", function() {
      hierachical_sm.changeState('die');
      executedCallbacks.join().should.equal('onExitPunch,onExitMeleeAttack,onExitAttack');
      hierachical_sm.state.name.should.equal('die');
    });


  });

  describe("Event dispatching", function() {
    beforeEach(function(){
      event_sm = new StateMachine();
      event_sm.addState("playing",{ from:"*" });
      event_sm.addState("stopped",{ from:"*" });
      event_sm.addState("paused",{ from:"playing" });
      event_sm.initialState = "stopped";
    });


    it("should dispatch a denied event on denied transitions", function(done) {
      event_sm.on('transition_denied', function(event){
        event.should.have.property('fromState');
        event.fromState.should.equal('stopped');
        event.should.have.property('toState');
        event.toState.should.equal('paused');
        event.should.have.property('allowedStates');
        event.allowedStates.should.equal('playing');
        done();
      });
      event_sm.changeState('paused');
    });

    it("should dispatch a complete event for transitions", function(done) {
      event_sm.on('transition_complete', function(event){
        event.should.have.property('fromState');
        event.fromState.should.equal('stopped');
        event.should.have.property('toState');
        event.toState.should.equal('playing');
        done();
      });
      event_sm.changeState('playing');
    });
  });



});
