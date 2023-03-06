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

for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {
    ce.on('event:' + i, foo);
    ee.on('event:' + i, foo);
    fe.on('event:' + i, foo);
    ee1.on('event:' + i, foo);
    ee2.on('event:' + i, foo);
    ee3.on('event:' + i, foo);
    drip.on('event:' + i, foo);
    // @ts-expect-error ts not happy with us
    eeZod.listen(`event:${i}`, foo);
  }
}

const suite = new Benchmark.Suite;

if (run === "all" || run === "important") {
  suite.add('Native Event Emitter', function() {
    for (let i = 0; i < 10; i++) {
      ee1.emit('event:' + i);
    }
  })
  suite.add('EventEmitter3', function() {
    for (let i = 0; i < 10; i++) {
      ee3.emit('event:' + i);
    }
  })
}
if (run === "all") {
  suite.add('EventEmitter2', function() {
    for (let i = 0; i < 10; i++) {
      ee2.emit('event:' + i);
    }
  })

  suite.add('Drip', function() {
    for (let i = 0; i < 10; i++) {
      drip.emit('event:' + i);
    }
  })
  suite.add('fastemitter', function() {
    for (let i = 0; i < 10; i++) {
      fe.emit('event:' + i);
    }
  })
  suite.add('event-emitter', function() {
    for (let i = 0; i < 10; i++) {
      ee.emit('event:' + i);
    }
  })
  suite.add('contra/emitter', function() {
    for (let i = 0; i < 10; i++) {
      ce.emit('event:' + i);
    }
  })
}
suite.add('zod-pubsub', function() {
  for (let i = 0; i < 10; i++) {
    // @ts-expect-error ts not happy with us
    eeZod.publish(`event:${i}`, {});
  }
})
suite.on('cycle', (e: any) => {
  console.log(e.target.toString());
})
suite.on('complete', () => {
  console.log('Fastest is %s', suite.filter('fastest').map('name')[0]);
})
console.log("Running Benchmark: hundreds")
suite.run({ async: true });
