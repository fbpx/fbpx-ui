import {Flow} from '../models'
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
  flow: Flow
): AutoScale {
  const {width} = element.getBoundingClientRect()

  return autoScale(width, flow)
}

export function autoScale(width: number, flow: Flow): AutoScale {
  const bounds = getGraphBounds(flow)

  return {
    ...bounds,
    scale: width / bounds.width,
  }
}
