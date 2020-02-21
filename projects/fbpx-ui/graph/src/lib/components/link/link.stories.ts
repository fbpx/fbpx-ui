import {LinkComponent} from './link.component'
import {LinkModule} from './link.module'
import {action} from '@storybook/addon-actions'
import {number, withKnobs} from '@storybook/addon-knobs'
import {moduleMetadata, storiesOf} from '@storybook/angular'

storiesOf('Link', module)
  .addDecorator(withKnobs)
  .addDecorator(
    moduleMetadata({
      imports: [LinkModule],
    })
  )
  .add('leftTop RightBottom', () => ({
    component: LinkComponent,
    template: `
      <svg>
        <g
           fbpx-graph-link
           (onLinkSelection)="onLinkSelection($event)"
           [sourceX]="sourceX"
           [sourceY]="sourceY"
           [targetX]="targetX"
           [targetY]="targetY"
        />
      </svg>
    `,
    props: {
      onLinkSelection: action('onLinkSelection'),
      sourceX: number('SourceX', 100),
      sourceY: number('SourceY', 100),
      targetX: number('TargetX', 180),
      targetY: number('TargetY', 180),
    },
  }))
  .add('leftBottom RightTop', () => ({
    component: LinkComponent,
    props: {
      onLinkSelection: action('onLinkSelection'),
      sourceX: number('SourceX', 100),
      sourceY: number('SourceY', 180),
      targetX: number('TargetX', 180),
      targetY: number('TargetY', 100),
      source: {
        id: 'someId',
        ns: 'hello',
        name: 'world',
      },
      target: {
        id: 'someId',
        ns: 'hello',
        name: 'world',
      },
    },
  }))
