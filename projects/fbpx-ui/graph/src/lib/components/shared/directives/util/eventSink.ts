export function eventSink(el: HTMLElement, events: string[], capture = false) {
  const handler = event => {
    event.stopPropagation()
    if (event.button === 2) {
      event.preventDefault()
    }
  }

  for (let i = 0, l = events.length; i < l; i++) {
    el.addEventListener(events[i], handler, capture)
  }

  return () => {
    for (let i = 0, l = events.length; i < l; i++) {
      el.removeEventListener(events[i], handler, capture)
    }
  }
}
