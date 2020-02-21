import {PortComponent} from './port.component'
import {PortModule} from './port.module'
import {action} from '@storybook/addon-actions'
import {number, text, withKnobs} from '@storybook/addon-knobs'
import {moduleMetadata, storiesOf} from '@storybook/angular'

storiesOf('Port', module)
  .addDecorator(
    moduleMetadata({
      imports: [PortModule],
    })
  )
  .addDecorator(withKnobs)
  .add('with port info', () => ({
    component: PortComponent,
    props: {
      port: {
        radius: number('Radius', 15),
        width: number('Width', 30),
        color: text('Color', 'red'),
        stroke: text('Stroke', 'green'),
      },
      onPortPosition: action('OnPortPosition'),
      onPress: action('OnPress'),
      onEnter: action('OnEnter'),
      onLeave: action('OnLeave'),
    },
  }))
