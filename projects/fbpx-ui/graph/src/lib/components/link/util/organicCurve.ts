export function organicCurve(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
) {
  let c1X: number
  let c1Y: number
  let c2X: number
  let c2Y: number

  const CURVE = 300
  const nodeSize = 300

  if (targetX - 5 < sourceX) {
    const curveFactor = ((sourceX - targetX) * CURVE) / 200

    if (Math.abs(targetY - sourceY) < nodeSize / 2) {
      c1X = sourceX + curveFactor
      c1Y = sourceY - curveFactor
      c2X = targetX - curveFactor
      c2Y = targetY - curveFactor
    } else {
      c1X = sourceX + curveFactor
      c1Y = sourceY + (targetY > sourceY ? curveFactor : -curveFactor)
      c2X = targetX - curveFactor
      c2Y = targetY + (targetY > sourceY ? -curveFactor : curveFactor)
    }
  } else {
    c1X = sourceX + (targetX - sourceX) / 2
    c1Y = sourceY
    c2X = c1X
    c2Y = targetY
  }

  return {
    c1X,
    c1Y,
    c2X,
    c2Y,
  }
}
