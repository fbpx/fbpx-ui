import {Flow} from '../models'
import * as dagre from 'dagre'

const defaultNodeWidth = 450
const defaultNodeHeight = 300

export function dagreLayout(
  flow: Flow,
  dir = 'LR',
  updateOnly: boolean = false
) {
  const graph = new dagre.graphlib.Graph()

  graph.setGraph({
    rankdir: dir,
    marginx: 500,
    marginy: 200,
    nodesep: 120,
    edgesep: 20,
    ranksep: 0,
    // ranker: 'longest-path' // network-simplex, tight-tree, longest-path
    ranker: 'tight-tree', // network-simplex, tight-tree, longest-path
  })

  graph.setDefaultEdgeLabel(() => {
    return {
      /* empty */
    }
  })

  for (const node of flow.nodes) {
    graph.setNode(node.id, {
      width: node.metadata?.width || defaultNodeWidth,
      height: node.metadata?.height || defaultNodeHeight,
    })
  }

  for (const link of flow.links) {
    if (link.source.id !== flow.id) {
      graph.setEdge(link.source.id, link.target.id)
    }
  }

  dagre.layout(graph)

  console.log('DAGRE LAYOUT', graph)

  return {
    ...flow,
    nodes: graph.nodes().map((v, index) => {
      const node = flow.nodes[index]
      const dnode = graph.node(v)

      if (
        !updateOnly ||
        !node.metadata ||
        !node.metadata.x ||
        !node.metadata.y
      ) {
        return {
          ...node,
          metadata: {
            ...node.metadata,
            x: dnode.x,
            y: dnode.y,
          },
        }
      }

      return node
    }),
  }
}
