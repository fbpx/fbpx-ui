import {Node} from '../models'
import {getGraphBounds} from './getGraphBounds'

export interface AutoScale {
  scale: number
  width: number
  height: number
  top: number
  bottom: number
  left: number
  right: number
}

export function autoScaleFromElement(
  element: HTMLElement,
  nodes: Node[]
): AutoScale {
  const {width} = element.getBoundingClientRect()

  return autoScale(width, nodes)
}

export function autoScale(width: number, nodes: Node[]): AutoScale {
  const bounds = getGraphBounds(nodes)

  return {
    ...bounds,
    scale: width / bounds.width,
  }
}
