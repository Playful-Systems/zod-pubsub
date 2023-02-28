

export const createQueue = <QueueItem>(handler: (item: QueueItem) => void) => {

  const queue: QueueItem[] = []
  let processing = false

  const add = (item: QueueItem) => {
    // console.log('[queue] add', item)
    queue.push(item)
    start();
  }

  const start = () => {
    if (processing) return
    processing = true
    // console.log('[queue]', 'action: start')
    process()
  }

  const stop = () => {
    // console.log('[queue]', 'action: stop')
    processing = false
  }

  const process = () => {
    while(processing) {
      const item = queue.shift()
      if (!item) {
        stop()
        return
      }
    // console.log('[queue] process', item)
    handler(item)
    }
  }

  return {
    add,
    stop,
  }
}