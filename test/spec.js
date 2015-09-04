var expect    = require("chai").expect;
var StateMachine = require("../lib/StateMachine");
var should = require('chai').should()

describe("State Machine", function() {

  describe("Non-hierarchical state machine", function() {

    describe("basic state changing", function() {
      var basic_sm = new StateMachine();
      basic_sm.addState("playing",{ from:"*" });
      basic_sm.addState("stopped",{ from:"*" });
      basic_sm.addState("paused",{ from:"playing" });
      basic_sm.initialState = "stopped";

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
        basic_sm.changeState('paused');
        basic_sm.state.name.should.equal('paused');
      });
    });

    describe("Event dispatching", function() {
      var event_sm = new StateMachine();
      event_sm.addState("playing",{ from:"*" });
      event_sm.addState("stopped",{ from:"*" });
      event_sm.addState("paused",{ from:"playing" });
      event_sm.initialState = "stopped";

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
});
