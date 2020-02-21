import {TransformObject} from '../interfaces'

/**
 * Writes back a css transform object
 * previously created with readTransform
 */
export const writeTransform = (
  transformObject: TransformObject,
  separator: string = ','
) => {
  const keys = Object.keys(transformObject)

  keys.sort((a, b) => {
    if (a === 'translate') {
      return -1
    }
    return 1
  })
  return keys
    .map(prop => `${prop}(${transformObject[prop].join(separator)})`)
    .join(' ')
}
