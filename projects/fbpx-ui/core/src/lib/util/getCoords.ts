export function getCoords(element: HTMLElement) {
  const rect = element.getBoundingClientRect()

  return {
    x: rect.left + window.pageXOffset,
    y: rect.top + window.pageYOffset,
  }
}
