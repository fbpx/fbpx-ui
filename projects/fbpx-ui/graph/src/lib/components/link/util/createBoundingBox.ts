import {Position} from '../../shared'

export interface BoundingBox {
  transformX: number
  transformY: number
  width: number
  height: number
  leftX: number
  leftY: number
  rightX: number
  rightY: number
}

export function createBoundingBox(
  source: Position,
  target: Position,
  padding: number
): BoundingBox {
  const left = source.x < target.x ? source : target
  const right = left === source ? target : source

  const top = source.y < target.y ? source : target
  const bottom = top === source ? target : source

  const leftPos = left.y < right.y ? 'top' : 'bottom'
  const rightPos = leftPos === 'bottom' ? 'top' : 'bottom'

  const width = right.x - left.x
  const height = bottom.y - top.y

  return {
    transformX: left.x,
    transformY: top.y,
    width: width + 2 * padding,
    height: height + 2 * padding,
    leftX: 0 + padding,
    leftY: leftPos === 'bottom' ? height + padding : padding,
    rightX: width + padding,
    rightY: rightPos === 'bottom' ? height + padding : padding,
  }
}
