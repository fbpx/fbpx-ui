import {Position} from '@fbpx-ui/core'

export interface Port {
  id: string
  name: string
  title?: string
  description?: string
  translate?: Position
  x?: number
  y?: number
  radius: number
  width: number
  // same params as ngClass accepts
  classes?: string | string[] | Set<string> | {[klass: string]: any}
}
