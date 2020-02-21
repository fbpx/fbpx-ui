import {NodeComponent} from './node.component'
import {NodeModule} from './node.module'
import {action} from '@storybook/addon-actions'
import {moduleMetadata, storiesOf} from '@storybook/angular'

const nodeDef = {
  ns: 'hello',
  name: 'world',
  ports: {
    input: {
      in: {
        title: 'In',
        type: 'string',
      },
      email: {
        title: 'Email',
        type: 'string',
        format: 'email',
      },
      number: {
        title: 'Number',
        type: 'number',
      },
      boolean: {
        title: 'Boolean',
        type: 'boolean',
      },
      enum: {
        title: 'Enum',
        type: 'string',
        enum: ['one', 'two', 'three'],
      },
    },
    output: {
      out: {
        title: 'Out',
        type: 'string',
      },
    },
  },
}

storiesOf('Node', module)
  .addDecorator(
    moduleMetadata({
      imports: [NodeModule],
    })
  )
  .add('default', () => ({
    component: NodeComponent,
    props: {
      onPortPositions: action('onPortPositions'),
      onNodeMovement: action('onNodeMovement'),
      onToggleTargetPort: action('onToggleTargetPort'),
      onEdgeStart: action('onEdgeStart'),
      x: 500,
      y: 500,
      node: {
        id: 'MyId',
        title: 'Hello World?',
        ns: 'hello',
        name: 'world',
      },
      nodeDef,
    },
  }))
  .add('context', () => ({
    component: NodeComponent,
    props: {
      onPortPositions: action('onPortPositions'),
      onNodeMovement: action('onNodeMovement'),
      onToggleTargetPort: action('onToggleTargetPort'),
      onEdgeStart: action('onEdgeStart'),
      x: 200,
      y: 100,
      node: {
        id: 'MyId',
        title: 'Hello World',
        ns: 'hello',
        name: 'world',
        context: {
          in: 'InValue',
          email: 'info@test.com',
          number: 5,
          boolean: true,
          enum: ['two'],
        },
      },
      nodeDef,
    },
  }))
