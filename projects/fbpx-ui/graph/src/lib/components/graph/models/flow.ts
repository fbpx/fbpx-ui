import {Link} from './link'
import {Node} from './node'
import {Port} from './port'

export interface Flow {
  id: string
  title?: string
  ports?: {
    input?: Port[]
    output?: Port[]
  }
  nodes: Node[]
  links: Link[]
}
