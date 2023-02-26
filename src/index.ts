import { z } from "zod"

export type PubSubEvents = Record<string, z.ZodType<any, any>>

export type PubSubConfig<Events extends PubSubEvents, EventName = keyof Events> = {

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
  type EventCallback<Name extends EventName = EventName> = (data: z.infer<Events[Name]>, event: Name) => void | Promise<void>

  const listeners = new Map<keyof Events, EventCallback<EventName>[]>()
  const allListeners = new Set<EventCallback<EventName>>()
  const remoteListeners = new Map<string, (event: EventName, data: z.infer<Events[EventName]>) => void>()

  /**
   * Subscribe to the event, the callback will be called when a new event is published
   */
  const subscribe = <Name extends EventName>(event: Name, callback: EventCallback<Name>) => {
    const currentListeners = (listeners.get(event) ?? []) as EventCallback<Name>[]
    (listeners as Map<keyof Events, EventCallback<Name>[]>).set(event, [...currentListeners, callback])

    /**
     * UnSubscribe from the event
     */
    return () => {
      const currentListeners = (listeners.get(event) ?? []) as EventCallback<Name>[]
      const newListeners  = currentListeners.filter((listener) => listener !== callback) as EventCallback<Name>[]
      (listeners as Map<keyof Events, EventCallback<Name>[]>).set(event, newListeners)
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
    allListeners.add(callback)

    /**
     * UnSubscribe from the events
     */
    return () => {
      allListeners.delete(callback)
    }
  }

  /**
   * Publish an event, all listeners to the event will be called
   */
  const publish = <Name extends EventName>(event: Name, data: z.infer<Events[Name]>, _config?: { remoteId: string }) => {
    const currentListeners = listeners.get(event) || []
    const validatedData = config.validate ? config.events[event].parse(data) : data
    currentListeners.forEach((listener) => {
      listener(validatedData, event)
    })
    for (const listener of allListeners) {
      listener(validatedData, event)
    }
    for (const [remoteId, listener] of remoteListeners) {
      if (remoteId !== _config?.remoteId) {
        listener(event, validatedData)
      }
    }
  }

  type Connections = {

    onSendMessage: <Name extends EventName = EventName>(event: Name, payload: z.infer<Events[Name]>) => void;

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

    const remoteId = config.crypto ? config.crypto.randomUUID() : crypto.randomUUID();

    remoteListeners.set(remoteId, conn.onSendMessage)

    const unSub = conn.onReceiveMessage((event, data) => {
      publish(event, data, { remoteId })
    }, validate)

    return () => {
      remoteListeners.delete(remoteId)
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

    connect,

    _events: Object.keys(config.events) as EventName[]
  }
}