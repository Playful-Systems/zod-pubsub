import { z } from "zod"
import { createQueue } from "./queue"

export type PubSubEvents = Record<string, z.ZodType<any, any>>

export type PubSubConfig<Events extends PubSubEvents> = {

  /**
   * Define the events you want to use,
   * the key is a string that is the event topic to call,
   * the value is a zod schema to define the types of the data
   */
  events: Events

  /**
   * If you want to validate the data passed to the publish method, set this to true.
   * If you trust the input, don't bother as this just adds overhead
   */
  validate?: boolean

  /**
   * Overwrite the default crypto module if you need too
   */
  crypto?: {
    randomUUID: () => string
  }
}

/**
 * If you need access to a union type of the available events, you can use this
 * 
 * example: type events = inferEvents<typeof x>
 */
export type inferEvents<pubsub extends ReturnType<typeof pubSub>> = pubsub["_events"][number]

/**
 * Create a new pub sub instance, pass in the events you want to use
 */
export const pubSub = <Events extends PubSubEvents>(config: PubSubConfig<Events>) => {

  type TopicName = keyof Events
  type EventCallback<Topic extends TopicName = TopicName> = (data: z.infer<Events[Topic]>, topic: Topic, options: { publishId: string, listenerId: string }) => void | Promise<void> | any | Promise<any>

  type ListenerId = string
  const listeners = new Map<keyof Events, Map<ListenerId, EventCallback>>()
  const allListeners = new Map<ListenerId, EventCallback>()
  const remoteListeners = new Map<ListenerId, EventCallback>()

  const generateId = config.crypto ? config.crypto.randomUUID : crypto.randomUUID;
  const generateListenerId = () => generateId();
  const generatePublishId = () => generateId();

  /**
   * Subscribe to the topic, the callback will be called when a new event is published
   */
  const subscribe = <Topic extends TopicName>(topic: Topic, callback: EventCallback<Topic>) => {
    const listenerId = generateListenerId();

    const currentListeners = listeners.get(topic) ?? new Map<ListenerId, EventCallback>();
    currentListeners.set(listenerId, callback as EventCallback);
    listeners.set(topic, currentListeners)

    /**
     * UnSubscribe from the topic
     */
    return () => {
      const currentListeners = listeners.get(topic) ?? new Map<ListenerId, EventCallback>();
      currentListeners.delete(listenerId)
      listeners.set(topic, currentListeners)
    }
  }

  /**
   * Subscribe to some of the topics, the callback will be called when a new event is published to the specified topics
   */
  const subscribeMany = <Topic extends TopicName>(topics: Topic[], callback: EventCallback<Topic>) => {
    const unSubs = topics.map((topic) => {
      return subscribe(topic, callback)
    })

    /**
     * UnSubscribe from the topics
     */
    return () => {
      unSubs.map((unSub) => {
        return unSub()
      })
    }
  }

  /**
   * Subscribe to all topics, the callback will be called when any new event is published
   */
  const subscribeAll = (callback: EventCallback) => {
    const listenerId = generateListenerId();

    allListeners.set(listenerId, callback)

    /**
     * UnSubscribe from the topics
     */
    return () => {
      allListeners.delete(listenerId)
    }
  }

  type QueueItem<Topic extends TopicName> = { 
    topic: Topic, 
    data: z.infer<Events[Topic]>
    options: { 
      listenerId?: string;
      publishId: string;
    }
  }

  const publishHandler = ({ topic, data, options }: QueueItem<TopicName>) => {
    const currentListeners = listeners.get(topic) ?? new Map() as Map<string, EventCallback<keyof Events>>

    // console.log({
    //   currentListeners,
    //   allListeners,
    //   remoteListeners,
    //   event,
    //   options
    // })

    for (const [listenerId, listener] of currentListeners) {
      if (listenerId !== options?.listenerId) {
        listener(data, topic, { listenerId, publishId: options.publishId })
      }
    }
    for (const [listenerId, listener] of allListeners) {
      if (listenerId !== options?.listenerId) {
        listener(data, topic, { listenerId, publishId: options.publishId })
      }
    }
    for (const [listenerId, listener] of remoteListeners) {
      if (listenerId !== options?.listenerId) {
        listener(data, topic, { listenerId, publishId: options.publishId })
      }
    }
  }

  const queue = createQueue<QueueItem<TopicName>>(publishHandler)

  /**
   * Publish an topic, all listeners to the topic will be called
   */
  const publish = <Topic extends TopicName>(topic: Topic, data: z.infer<Events[Topic]>, options?: { listenerId?: string }) => {
    const validatedData: z.infer<Events[Topic]> = config.validate ? config.events[topic].parse(data) : data

    const publishId = generatePublishId();

    queue.add({ topic, data: validatedData, options: { ...options, publishId } })
  }

  type Connections = {

    /**
     * Called on every single message emit, use this to send the message to the other side.
     * You need to ensure you encode this in a way that the other side can decode.
     */
    onSendMessage: <Topic extends TopicName = TopicName>(payload: z.infer<Events[Topic]>, topic: Topic) => void;

    /**
     * This is essentially a setup function, its called once when this .connect() method is called.
     * This passes through two functions, a publish function and a validate function.
     * Add some kind of event listen that will run a callback when a message is received,
     * then in that callback, call the publish function with the topic name and data.
     * To ensure the topic name is valid, use the validate function.
     */
    onReceiveMessage: <Topic extends TopicName = TopicName>(publish: (topic: Topic, data: z.infer<Events[Topic]>) => void, validate: (topic: string) => Topic) => (void | (() => void));

  }

  const validate = (topic: string): TopicName => {
    const names = Object.keys(config.events)
    if (!names.includes(topic)) {
      throw new Error(`Topic ${topic} does not exist`)
    }
    return topic as TopicName
  }

  const connect = (conn: Connections) => {

    const listenerId = generateListenerId();

    remoteListeners.set(listenerId, conn.onSendMessage)

    const unSub = conn.onReceiveMessage((topic, data) => {
      publish(topic, data, { listenerId })
    }, validate)

    return () => {
      remoteListeners.delete(listenerId)
      unSub && unSub()
    }

  }

  return {

    subscribe,
    sub: subscribe,
    listen: subscribe,
    watch: subscribe,

    subscribeMany,
    subMany: subscribeMany,
    listenMany: subscribeMany,
    watchMany: subscribeMany,

    subscribeAll,
    subAll: subscribeAll,
    listenAll: subscribeAll,
    watchAll: subscribeAll,

    publish,
    pub: publish,
    send: publish,
    emit: publish,

    connect,

    schemas: config.events,
    _events: Object.keys(config.events) as TopicName[]
  }
}