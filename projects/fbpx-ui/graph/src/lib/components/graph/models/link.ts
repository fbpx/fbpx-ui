import {Connector} from './connector'
import {Metadata} from './metadata'

export interface Link {
  id: string
  sourceX?: number
  sourceY?: number
  targetX?: number
  targetY?: number
  source?: Connector
  target?: Connector
  metadata?: Metadata
  strokeWidth?: number
}
