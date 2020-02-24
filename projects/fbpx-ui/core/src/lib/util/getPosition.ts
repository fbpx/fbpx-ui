/**
 * Get position of an element without css transforms applied.
 *
 * Err ok, then we also do not get the translate.
 *
 * And then I arrive at the essence, all I need to know is the actual width of the node itself.
 *
 */
export function getPosition(elm: HTMLElement) {
  let x = 0
  let y = 0

  while (elm) {
    x += elm.offsetLeft - elm.scrollLeft + elm.clientLeft
    y += elm.offsetTop - elm.scrollTop + elm.clientTop
    elm = elm.offsetParent as HTMLElement
  }

  return {x, y}
}
