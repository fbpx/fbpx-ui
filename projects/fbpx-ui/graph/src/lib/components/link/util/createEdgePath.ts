import {organicCurve} from './organicCurve'

export function createEdgePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  const curve = organicCurve(sourceX, sourceY, targetX, targetY)

  return [
    'M',
    sourceX,
    sourceY,
    'C',
    curve.c1X,
    curve.c1Y,
    curve.c2X,
    curve.c2Y,
    targetX,
    targetY,
  ].join(' ')
}
