import {TransformObject} from '../interfaces'

/**
 * Reads a css transform string.
 *
 * e.g.
 *
 * scale(1) translate(12px,2px)
 *
 * becomes:
 *
 * {
 *   scale: ['1'],
 *   translate: ['12px', '2px']
 * }
 */
export function readTransform(transform: string): TransformObject {
  const parts = transform.replace(/[,\s]+/g, ',').split(/\s+/)

  const result = {}
  for (const part of parts) {
    const segments = part.match(/([A-z]+)\(([0-9A-z,.-]+)\)/)

    if (segments && segments.length === 3) {
      const [, key, paramString] = segments

      result[key] = paramString.split(',')
    } else {
      console.error(segments)
      throw Error(`Failed to parse transform string ${transform}`)
    }
  }

  return result
}
