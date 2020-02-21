import {CommonModule} from '@angular/common'
import {NgModule} from '@angular/core'
import {DraggableDirective} from './directives/draggable/draggable'
import {StopEventPropagationDirective} from './directives/stop-event-propagation'

@NgModule({
  imports: [CommonModule],
  declarations: [DraggableDirective, StopEventPropagationDirective],
  exports: [DraggableDirective, StopEventPropagationDirective],
})
export class SharedModule {}
