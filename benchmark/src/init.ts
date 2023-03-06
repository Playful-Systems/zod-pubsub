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

const suite = new Benchmark.Suite;

if (run === "all" || run === "important") {
  suite.add('Native Event Emitter', () => {
    const emitter = new EventEmitter1();
  })
  suite.add('EventEmitter3', () => {
    const emitter = new EventEmitter3();
  })
}
if (run === "all") {
  suite.add('EventEmitter2', () => {
    const emitter = new EventEmitter2();
  })
  suite.add('Drip', () => {
    const emitter = new Drip();
  })
  suite.add('fastemitter', () => {
    const emitter = new FE();
  })
  suite.add('event-emitter', () => {
    const emitter = EE();
  })
  suite.add('contra/emitter', () => {
    const emitter = CE();
  })
}
suite.add('zod-pubsub', () => {
  const emitter = pubSub({
    events,
    crypto
  });
})
suite.on('cycle', (e: any) => {
  console.log(e.target.toString());
})
suite.on('complete', () => {
  console.log('Fastest is %s', suite.filter('fastest').map('name')[0]);
})
console.log("Running Benchmark: init")
suite.run({ async: true });
