import {Connector} from './connector'
import {Metadata} from './metadata'

export interface Link {
  id?: string
  source?: Connector
  target?: Connector
  metadata?: Metadata
  strokeWidth?: number
}

export type RenderLink = Link & {
  renderId: number
  sourceX?: number
  sourceY?: number
  targetX?: number
  targetY?: number
}
