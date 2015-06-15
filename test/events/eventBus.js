var cwd = process.cwd();

var assert = require("chai").assert;
var sinon  = require("sinon");

var events = require(cwd + '/events');

describe('EventBus', function() {
    it('Init', function() {
        var obj = {};
        events(obj);

        assert.isNotNull(obj.handlers, 'See handlers');
        assert(obj.on instanceof Function, 'See on');
        assert(obj.dispatchEvent instanceof Function, 'See dispatchEvent');
    });

    it('on', function() {
        var obj = {};
        events(obj);

        obj.on('complete', 1);
        obj.on('event', 0);
        obj.on('event', 2);

        assert.deepEqual(obj.handlers, { complete : [ 1 ], event : [ 0, 2 ] }, 'See valid handlers');
    });

    it('unbind', function() {
        var obj = {};
        events(obj);

        obj.on('event', 0);
        obj.on('event', 1);
        obj.on('event', 1);
        obj.on('event', 2);
        obj.on('event', 3);
        obj.on('event', 5);
        obj.on('event', 8);
        obj.on('event', 13);

        obj.unbind('event', 2);

        assert.deepEqual(obj.handlers, { event : [ 0, 1, 1, 3, 5, 8, 13 ] }, 'See valid handlers');
    });

    it('dispatchEvent', function(done) {
        var h1 = sinon.spy();
        var h2 = sinon.spy();
        var obj = {};
        events(obj);

        obj.on('event', h1);
        obj.on('event', h2);

        obj.dispatchEvent('event', [ 1, 2 ]).then(function() {
            assert(h1.calledOnce, 'Handler was called');
            assert(h1.calledWith(1, 2), 'Handler was called with valid arguments');
            assert(h2.calledOnce, 'Another handler was called');
            assert(h2.calledWith(1, 2), 'Another Handler was called with valid arguments');

            done();
        });
    });
});