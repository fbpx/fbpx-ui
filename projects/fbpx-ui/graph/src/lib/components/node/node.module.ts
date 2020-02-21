import {CommonModule} from '@angular/common'
import {NgModule} from '@angular/core'
import {NgDragDropModule} from 'ng-drag-drop'
import {PortModule} from '../port/port.module'
import {NodeComponent} from './node.component'
import {SharedModule} from '../shared'

@NgModule({
  imports: [CommonModule, NgDragDropModule, PortModule, SharedModule],
  declarations: [NodeComponent],
  exports: [NodeComponent],
})
export class NodeModule {}
