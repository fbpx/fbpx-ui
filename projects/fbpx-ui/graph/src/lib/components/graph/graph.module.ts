import {CommonModule} from '@angular/common'
import {NgModule} from '@angular/core'
import {LinkModule} from '../link/link.module'
import {NodeModule} from '../node/node.module'
import {SharedModule} from '../shared/shared.module'
import {NgDragDropModule} from 'ng-drag-drop'
import {GraphComponent} from './graph.component'
import {SelectionManager} from './services'

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    LinkModule,
    NodeModule,
    NgDragDropModule.forRoot(),
  ],
  providers: [SelectionManager],
  declarations: [GraphComponent],
  exports: [GraphComponent],
})
export class GraphModule {}
