import {Flow, Link} from '@fbpx-ui/graph'
import uuid from 'uuid'

const createPort = (
  type: string,
  nr: number,
  {radius, width, color, stroke, strokeWidth, classes}: PortOptions
) => {
  return {
    id: `${type}-${nr}`,
    nodeId: 'node1',
    name: `${type}-${nr}`,
    radius: radius || 8,
    width: width || 20,
    color: color || 'black',
    stroke: stroke || 'white',
    strokeWidth: strokeWidth || 2,
    classes: classes || [],
  }
}

export interface PortOptions {
  color?: string
  stroke?: string
  strokeWidth?: number
  radius?: number
  width?: number
  classes?: string[]
}

const generatePorts = (
  type: string,
  count: number,
  options: PortOptions = {}
) => {
  const ports = []
  for (let i = 1; i <= count; i++) {
    ports.push(createPort(type, i, options))
  }

  return ports
}

const createNode = (
  nr: number,
  inPortCount: number = 2,
  outputPortCount: number = 2
) => {
  return {
    id: `node${nr}`,
    name: `node${nr}`,
    ports: {
      input: generatePorts('in', inPortCount, {
        radius: 6,
        width: 20,
        classes: ['context'],
      }),
      output: generatePorts('out', outputPortCount, {
        radius: 6,
        width: 20,
        classes: [],
      }),
    },
  }
}

const generateLinks = (nodes): Link[] => {
  let source
  const links: Link[] = []
  if (nodes.length) {
    for (const node of nodes) {
      if (source) {
        links.push({
          id: uuid.v4(),
          source,
          target: {
            id: node.id,
            port: node.ports.input[0].name,
          },
        })
      }
      source = {
        id: node.id,
        port: node.ports.output[0].name,
      }
    }
  }

  return links
}

const nodes = [
  createNode(1, 2, 2),
  createNode(2, 2, 1),
  createNode(3, 1, 1),
  createNode(4, 2, 3),
  createNode(5, 2, 3),
  createNode(6, 2, 3),
  createNode(7, 2, 3),
  createNode(8, 2, 3),
]

const nodes2 = [
  createNode(4, 2, 3),
  createNode(5, 1, 2),
  createNode(6, 2, 3),
  createNode(7, 1, 2),
  createNode(8, 2, 3),
]

export const graph: Flow = {
  id: 'graph',
  nodes,
  links: generateLinks(nodes),
}

export const graph2: Flow = {
  id: 'graph2',
  nodes: nodes2,
  links: generateLinks(nodes2),
}
