import Benchmark from 'benchmark';

import { EventEmitter as EventEmitter1 } from 'node:events'
import { EventEmitter2 } from 'eventemitter2'
import EventEmitter3 from 'eventemitter3';
// @ts-expect-error Drip doesn't have any types
import { EventEmitter as Drip } from 'drip';
// @ts-expect-error Contra doesn't have any types
import CE from 'contra/emitter';
import EE from 'event-emitter';
// @ts-expect-error FastEmitter doesn't have any types
import FE from 'fastemitter';
import { pubSub } from 'zod-pubsub';
import { events } from './_events';
import crypto from "node:crypto"
import { run } from "./options";

function foo() {
  if (arguments.length > 100) console.log('damn');

  return 1;
}

function bar() {
  if (arguments.length > 100) console.log('damn');

  return false;
}

function baz() {
  if (arguments.length > 100) console.log('damn');

  return true;
}

const ee1 = new EventEmitter1()
const ee2 = new EventEmitter2()
const ee3 = new EventEmitter3()
const drip = new Drip()
const fe = new FE()
const ce = CE()
const ee = EE();
const eeZod = pubSub({
  events,
  crypto
});

ce.on('foo', foo).on('foo', bar).on('foo', baz);
ee.on('foo', foo)
ee.on('foo', bar)
ee.on('foo', baz);
fe.on('foo', foo).on('foo', bar).on('foo', baz);
ee3.on('foo', foo).on('foo', bar).on('foo', baz);
ee2.on('foo', foo)
ee2.on('foo', bar)
ee2.on('foo', baz);
ee1.on('foo', foo).on('foo', bar).on('foo', baz);
eeZod.listen("multi", foo);
eeZod.listen("multi", bar);
eeZod.listen("multi", baz);

//
// Drip is omitted as it throws an error.
// Ref: https://github.com/qualiancy/drip/pull/4
//

const suite = new Benchmark.Suite

if (run === "all" || run === "important") {
  suite.add('Native Event Emitter', () => {
    ee1.emit('foo');
    ee1.emit('foo', 'bar');
    ee1.emit('foo', 'bar', 'baz');
    ee1.emit('foo', 'bar', 'baz', 'boom');
  })
  suite.add('EventEmitter3', () => {
    ee3.emit('foo');
    ee3.emit('foo', 'bar');
    ee3.emit('foo', 'bar', 'baz');
    ee3.emit('foo', 'bar', 'baz', 'boom');
  })
}
if (run === "all") {
  suite.add('EventEmitter2', () => {
    ee2.emit('foo');
    ee2.emit('foo', 'bar');
    ee2.emit('foo', 'bar', 'baz');
    ee2.emit('foo', 'bar', 'baz', 'boom');
  })
  suite.add('fastemitter', () => {
    fe.emit('foo');
    fe.emit('foo', 'bar');
    fe.emit('foo', 'bar', 'baz');
    fe.emit('foo', 'bar', 'baz', 'boom');
  })
  suite.add('event-emitter', () => {
    ee.emit('foo');
    ee.emit('foo', 'bar');
    ee.emit('foo', 'bar', 'baz');
    ee.emit('foo', 'bar', 'baz', 'boom');
  })
  suite.add('contra/emitter', () => {
    ce.emit('foo');
    ce.emit('foo', 'bar');
    ce.emit('foo', 'bar', 'baz');
    ce.emit('foo', 'bar', 'baz', 'boom');
  })
}
suite.add('zod-pubsub', () => {
  eeZod.emit("multi", undefined);
  eeZod.emit("multi", { foo: "bar" });
  eeZod.emit("multi", { foo: "bar", bar: "baz" });
  eeZod.emit("multi", { foo: "bar", bar: "baz", baz: "boom" });
})
suite.on('cycle', (e: any) => {
  console.log(e.target.toString());
})
suite.on('complete', () => {
  console.log('Fastest is %s', suite.filter('fastest').map('name')[0]);
})
console.log("Running Benchmark: emit-multiple-listeners")
suite.run({ async: true });
