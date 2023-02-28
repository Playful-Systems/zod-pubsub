import { z } from "zod"

export type PubSubEvents = Record<string, z.ZodType<any, any>>

export type PubSubConfig<Events extends PubSubEvents> = {

  /**
   * Define the events you want to use,
   * the key is a string that is the event name to call,
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

  type EventName = keyof Events
  type EventCallback<Name extends EventName = EventName> = (data: z.infer<Events[Name]>, event: Name, remoteId: string) => void | Promise<void>

  type ListenerId = string
  const listeners = new Map<keyof Events, Map<ListenerId, EventCallback>>()
  const allListeners = new Map<ListenerId, EventCallback>()
  const remoteListeners = new Map<ListenerId, EventCallback>()

  const generateListenerId = () => config.crypto ? config.crypto.randomUUID() : crypto.randomUUID();

  /**
   * Subscribe to the event, the callback will be called when a new event is published
   */
  const subscribe = <Name extends EventName>(event: Name, callback: EventCallback<Name>) => {
    const listenerId = generateListenerId();

    const currentListeners = listeners.get(event) ?? new Map<ListenerId, EventCallback>();
    currentListeners.set(listenerId, callback as EventCallback);
    listeners.set(event, currentListeners)

    /**
     * UnSubscribe from the event
     */
    return () => {
      const currentListeners = listeners.get(event) ?? new Map<ListenerId, EventCallback>();
      currentListeners.delete(listenerId)
      listeners.set(event, currentListeners)
    }
  }

  /**
   * Subscribe to some of the events, the callback will be called when a new event is published to the specified events
   */
  const subscribeMany = <Name extends EventName>(events: Name[], callback: EventCallback<Name>) => {
    const unSubs = events.map((event) => {
      return subscribe(event, callback)
    })

    /**
     * UnSubscribe from the events
     */
    return () => {
      unSubs.map((unSub) => {
        return unSub()
      })
    }
  }

  /**
   * Subscribe to all events, the callback will be called when any new event is published
   */
  const subscribeAll = (callback: EventCallback) => {
    const listenerId = generateListenerId();

    allListeners.set(listenerId, callback)

    /**
     * UnSubscribe from the events
     */
    return () => {
      allListeners.delete(listenerId)
    }
  }

  /**
   * Publish an event, all listeners to the event will be called
   */
  const publish = <Name extends EventName>(event: Name, data: z.infer<Events[Name]>, options?: { listenerId: string }) => {
    const validatedData = config.validate ? config.events[event].parse(data) : data
    
    const currentListeners = listeners.get(event) ?? new Map() as Map<string, EventCallback<keyof Events>>

    for (const [listenerId, listener] of currentListeners) {
      if (listenerId !== options?.listenerId) {
        listener(validatedData, event, listenerId)
      }
    }
    for (const [listenerId, listener] of allListeners) {
      if (listenerId !== options?.listenerId) {
        listener(validatedData, event, listenerId)
      }
    }
    for (const [listenerId, listener] of remoteListeners) {
      if (listenerId !== options?.listenerId) {
        listener(validatedData, event, listenerId)
      }
    }
  }

  type Connections = {

    /**
     * Called on every single message emit, use this to send the message to the other side.
     * You need to ensure you encode this in a way that the other side can decode.
     */
    onSendMessage: <Name extends EventName = EventName>(payload: z.infer<Events[Name]>, event: Name) => void;

    /**
     * This is essentially a setup function, its called once when this .connect() method is called.
     * This passes through two functions, a publish function and a validate function.
     * Add some kind of event listen that will run a callback when a message is received,
     * then in that callback, call the publish function with the event name and data.
     * To ensure the event name is valid, use the validate function.
     */
    onReceiveMessage: <Name extends EventName = EventName>(publish: (event: Name, data: z.infer<Events[Name]>) => void, validate: (eventName: string) => Name) => (void | (() => void));

  }

  const validate = (eventName: string): EventName => {
    const names = Object.keys(config.events)
    if (!names.includes(eventName)) {
      throw new Error(`Event ${eventName} does not exist`)
    }
    return eventName as EventName
  }

  const connect = (conn: Connections) => {

    const listenerId = generateListenerId();

    remoteListeners.set(listenerId, conn.onSendMessage)

    const unSub = conn.onReceiveMessage((event, data) => {
      publish(event, data, { listenerId })
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
    _events: Object.keys(config.events) as EventName[]
  }
}