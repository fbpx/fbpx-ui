import {Metadata} from './metadata'
import {Port} from './port'

export interface Node {
  id?: string
  name: string
  description?: string
  title?: string
  metadata?: Metadata
  ports?: {
    input?: Port[]
    output?: Port[]
  }
}

export type RenderNode = Node & {renderId: number}
