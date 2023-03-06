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

const suite = new Benchmark.Suite

if (run === "all" || run === "important") {
  suite.add('Native Event Emitter', () => {
    ee1.on('foo', handle);
    ee1.removeListener('foo', handle);
  })
  suite.add('EventEmitter3', () => {
    ee3.on('foo', handle);
    ee3.removeListener('foo', handle);
  })
}
if (run === "all") {
  suite.add('EventEmitter2', () => {
    ee2.on('foo', handle);
    ee2.removeListener('foo', handle);
  })
  suite.add('Drip', () => {
    drip.on('foo', handle);
    drip.removeListener('foo', handle);
  })
  suite.add('fastemitter', () => {
    fe.on('foo', handle);
    fe.removeListener('foo', handle);
  })
  suite.add('event-emitter', () => {
    ee.on('foo', handle);
    ee.off('foo', handle);
  })
  suite.add('contra/emitter', () => {
    ce.on('foo', handle);
    ce.off('foo', handle);
  })
}
suite.add('zod-pubsub', () => {
  const unSub = eeZod.listen('foo', handle);
  unSub();
})
suite.on('cycle', (e: any) => {
  console.log(e.target.toString());
})
suite.on('complete', () => {
  console.log('Fastest is %s', suite.filter('fastest').map('name')[0]);
})
console.log("Running Benchmark: add-remove")
suite.run({ async: true });