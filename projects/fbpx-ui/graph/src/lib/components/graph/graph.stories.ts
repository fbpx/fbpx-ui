import {dagreLayout, GraphComponent} from '@fbpx-ui/graph'
import {action} from '@storybook/addon-actions'
import {number, withKnobs} from '@storybook/addon-knobs'
import {storiesOf, moduleMetadata} from '@storybook/angular'
import {Flow} from './models'
import {CommonModule} from '@angular/common'
import {SharedModule} from '../shared'
import {LinkModule} from '../link'
import {NodeModule} from '../node'
import {NgDragDropModule} from 'ng-drag-drop'

const graph: Flow = {
  id: 'graph',
  type: 'not-used',
  nodes: [
    {
      id: 'id',
      name: 'node1',
      title: 'Node 1',
      ports: {
        input: [
          {
            id: 'in-1',
            nodeId: 'node1',
            type: 'whatever,',
            name: 'in-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
          {
            id: 'in-2',
            nodeId: 'node2',
            type: 'whatever2,',
            name: 'in-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
        ],
        output: [
          {
            id: 'out-1',
            nodeId: 'node1',
            type: 'whatever,',
            name: 'out-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
          {
            id: 'out-2',
            nodeId: 'node2',
            type: 'whatever2,',
            name: 'out-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
        ],
      },
    },
    {
      id: 'id2',
      name: 'node2',
      title: 'Node 2',
      ports: {
        input: [
          {
            id: 'in-1',
            nodeId: 'node1',
            type: 'whatever,',
            name: 'in-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
          {
            id: 'in-2',
            nodeId: 'node2',
            type: 'whatever2,',
            name: 'in-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
        ],
        output: [
          {
            id: 'out-1',
            nodeId: 'node1',
            type: 'whatever,',
            name: 'out-2',
            radius: 20,
            width: 20,
            color: 'black',
            stroke: 'green',
          },
        ],
      },
    },
    {
      id: 'id3',
      name: 'node3',
      title: 'Node 3',
      ports: {
        input: [],
        output: [],
      },
    },
  ],
  links: [],
}

storiesOf('Graph', module)
  .addDecorator(withKnobs)
  .addDecorator(
    moduleMetadata({
      imports: [
        CommonModule,
        SharedModule,
        LinkModule,
        NodeModule,
        NgDragDropModule.forRoot(),
      ],
    })
  )
  .add('default', () => ({
    component: GraphComponent,
    props: {
      scale: number('Scale', 1),
      scaleFactor: number('ScaleFactor', 0.1),
      minScale: number('MinScale', 0.2),
      maxScale: number('MaxScale', 10),
      graph: dagreLayout(graph),
      onLinkCreated: action('addLink'),
      onLinkSelection: link => action('linkSelection')(link),
      onNodeMove: action('onNodeMove'),
    },
  }))
