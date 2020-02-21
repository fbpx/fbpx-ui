import {Position, TransformObject} from '../interfaces'

export function getPositionFromTransform(
  transform: TransformObject,
  defaultPosition: Position = {x: 0, y: 0}
): Position {
  if (transform.translate) {
    const pos = transform.translate.map(val => parseInt(val, 10))

    if (pos.length !== 2) {
      throw Error('Cannot determine transform.')
    }

    return {
      x: pos[0],
      y: pos[1],
    }
  }

  return defaultPosition
}
