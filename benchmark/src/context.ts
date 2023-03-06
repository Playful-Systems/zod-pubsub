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

const ctx = { foo: 'bar' };

function handle() {
  if (arguments.length > 100) console.log('damn');
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

ee3.on('foo', handle, ctx);
ee2.on('foo', handle.bind(ctx));
ee1.on('foo', handle.bind(ctx));
drip.on('foo', handle.bind(ctx));
ee.on('foo', handle.bind(ctx));
fe.on('foo', handle.bind(ctx));
ce.on('foo', handle.bind(ctx));
eeZod.listen('foo', handle.bind(ctx));

const suite = new Benchmark.Suite

suite.add('Native Event Emitter', () => {
  ee1.emit('foo');
  ee1.emit('foo', 'bar');
  ee1.emit('foo', 'bar', 'baz');
  ee1.emit('foo', 'bar', 'baz', 'boom');
})
suite.add('EventEmitter2', () => {
  ee2.emit('foo');
  ee2.emit('foo', 'bar');
  ee2.emit('foo', 'bar', 'baz');
  ee2.emit('foo', 'bar', 'baz', 'boom');
})
suite.add('EventEmitter3', () => {
  ee3.emit('foo');
  ee3.emit('foo', 'bar');
  ee3.emit('foo', 'bar', 'baz');
  ee3.emit('foo', 'bar', 'baz', 'boom');
})
suite.add('Drip', () => {
  drip.emit('foo');
  drip.emit('foo', 'bar');
  drip.emit('foo', 'bar', 'baz');
  drip.emit('foo', 'bar', 'baz', 'boom');
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
suite.add('zod-pubsub', () => {
  eeZod.publish('empty', {});
  eeZod.publish('oneArg', { foo: 'foo' });
  eeZod.publish('twoArgs', { foo: 'foo', bar: 'bar' });
  eeZod.publish('threeArgs', { foo: 'foo', bar: 'bar', baz: 'baz' });
})
suite.on('cycle', (e: any) => {
  console.log(e.target.toString());
})
suite.on('complete', () => {
  console.log('Fastest is %s', suite.filter('fastest').map('name')[0]);
})
suite.run({ async: true });