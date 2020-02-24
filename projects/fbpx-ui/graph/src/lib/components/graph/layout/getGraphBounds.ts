import {Node} from '../models'

export interface GraphBounds {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
}

export const getGraphBounds = (nodes: Node[]): GraphBounds => {
  const positions = nodes.reduce(
    (value, node) => {
      const rightX = node.metadata.x + node.metadata.width
      const bottomY = node.metadata.y + node.metadata.height

      return {
        top: value.top < node.metadata.y ? value.top : node.metadata.y,
        bottom: value.bottom > bottomY ? value.bottom : bottomY,
        left: value.left < node.metadata.x ? value.left : node.metadata.x,
        right: value.right > rightX ? value.right : rightX,
      }
    },
    {
      top: Infinity,
      bottom: 0,
      left: Infinity,
      right: 0,
    }
  )

  return {
    ...positions,
    width: positions.right - positions.left,
    height: positions.bottom - positions.top,
  }
}
