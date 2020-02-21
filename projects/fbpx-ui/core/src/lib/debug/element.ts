import {Position} from '../interfaces'

export function createPositionedElement(
  position: Position,
  color: string
): HTMLElement {
  const el = document.createElement('div')

  el.style.top = '0px'
  el.style.left = '0px'
  el.style.width = '10px'
  el.style.height = '10px'
  el.style.transform = `translate(${position.x}px, ${position.y}px)`
  el.style.position = 'absolute'
  el.style.backgroundColor = color

  return el
}

export function debugElement(container: HTMLElement = document.body) {
  const containerPoint = createPositionedElement({x: 0, y: 0}, 'blue')

  container.appendChild(containerPoint)

  return (position: Position, color: string = 'red') => {
    const el = createPositionedElement(position, color)

    container.appendChild(el)

    return el
  }
}
