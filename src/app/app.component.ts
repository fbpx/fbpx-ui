import {Component, ViewEncapsulation, OnDestroy, ViewChild} from '@angular/core'
import {SelectionChange} from '@fbpx-ui/core'
import {
  dagreLayout,
  GraphNodeMouseEvent,
  SelectionManager,
  Port,
  Link,
  Node,
  NodePortEvent,
  PortSelection,
  OnPanEvent,
  GraphComponent,
} from '@fbpx-ui/graph'
import {graph, graph2} from './graphs/graph'
import {Subscription, BehaviorSubject} from 'rxjs'

export interface GraphEvents {}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./scss/app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnDestroy {
  public title = 'fbpx-graph'
  public graph = dagreLayout(graph)
  public graph2 = dagreLayout(graph2)
  public subscriptions: Subscription[] = []
  public offset$ = new BehaviorSubject({x: 0, y: 0})
  public log$ = new BehaviorSubject<string[]>([])

  public scale$ = new BehaviorSubject(1)

  public events = {}

  @ViewChild('graphComponent')
  public graphComponent: GraphComponent

  constructor(private selectionManager: SelectionManager) {
    this.subscriptions.push(
      this.selectionManager.nodeSelector.changes$.subscribe(
        this.handleNodeSelectionChanged
      ),
      this.selectionManager.linkSelector.changes$.subscribe(
        this.handleLinkSelectionChanged
      ),
      this.selectionManager.portSelector.changes$.subscribe(
        this.handlePortSelectionChanged
      )
    )
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe()
    }
  }

  onPan = (event: OnPanEvent) => {}

  onScale = (scale: number) => {
    this.scale$.next(scale)
  }

  zoom(scale: number) {
    this.graphComponent.zoom(scale)
  }

  onNodeClick = (event: GraphNodeMouseEvent) => {
    event.nodeComponent.toggleClass('selected')
  }

  onAddNode = event => {}

  onNodeUpdate = event => {}

  onInputPortEnter = (event: NodePortEvent) => {
    this.log(`Input port ${event.port.name} Entered`)
  }

  log(message: string) {
    this.log$.next([message, ...this.log$.getValue()])
  }

  onInputPortLeave = (event: NodePortEvent) => {
    this.log(`Input port ${event.port.name} left`)
  }

  onOutputPortEnter = (event: NodePortEvent) => {
    this.log(`Output port ${event.port.name} entered`)
  }

  onOutputPortLeave = (event: NodePortEvent) => {
    this.log(`Output port ${event.port.name} left`)
  }

  private handleNodeSelectionChanged = (change: SelectionChange<Node>) => {
    this.log(`Node Selection Changed type: ${change.type}`)
  }

  private handleLinkSelectionChanged = (change: SelectionChange<Link>) => {
    this.log(`Link Selection Changed`)
  }

  private handlePortSelectionChanged = (
    change: SelectionChange<PortSelection>
  ) => {
    this.log(`Port Selection Changed`)
  }

  public removeSelectedItems() {
    const selectedLinks = this.selectionManager.linkSelector.getSelected()
    const selectedNodes = this.selectionManager.nodeSelector.getSelected()

    for (const link of selectedLinks) {
    }
    for (const node of selectedNodes) {
    }
  }

  public onInputPortPressed({nodeId, port, event}: NodePortEvent) {
    this.log(`Input Port ${port.name} Pressed`)

    this.selectionManager.portSelector.toggleSelection(
      `${nodeId}:input:${port.name}`,
      {
        type: 'input',
        id: nodeId,
        port,
      },
      event.ctrlKey
    )
  }

  public onOutputPortPressed({nodeId, port, event}: NodePortEvent) {
    this.log(`Output Port ${port.name} Pressed`)

    this.selectionManager.portSelector.toggleSelection(
      `${nodeId}:output:${port.name}`,
      {
        type: 'output',
        id: nodeId,
        port,
      },
      event.ctrlKey
    )
  }
}
