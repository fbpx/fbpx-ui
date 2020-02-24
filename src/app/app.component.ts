import {Component, ViewEncapsulation, OnDestroy, ViewChild} from '@angular/core'
import {SelectionChange} from '@fbpx-ui/core'
import {exampleFlows} from './examples'
import {
  dagreLayout,
  GraphNodePointerEvent,
  SelectionManager,
  Flow,
  Link,
  Node,
  NodePortEvent,
  PortSelection,
  PanEvent,
  GraphComponent,
  AddNodeEvent,
} from '@fbpx-ui/graph'
import {graph, graph2} from './graphs/graph'
import {Subscription, BehaviorSubject} from 'rxjs'

export interface GraphEvents {}

export interface Example {
  title: string
}

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

  public exampleFlows = exampleFlows
  public currentExample: Flow = exampleFlows[0]

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

  onPan = (event: PanEvent) => {}

  onScale = (scale: number) => {
    this.scale$.next(scale)
  }

  zoom(scale: number) {
    this.graphComponent.zoom(scale)
  }

  onNodeClick = (event: GraphNodePointerEvent) => {
    event.nodeComponent.toggleClass('selected')
  }

  onAddNode = (event: AddNodeEvent) => {}

  onNodeUpdate = (event: Node) => {
    this.log(
      `Node ${event.name} has been updated, position: ${event.metadata?.x}:${event.metadata?.y}`
    )
  }
  onLinkCreated = ({source, target}: Link) => {
    this.log(
      `A new link has been created between ${source.id}:${source.port} and ${target.id}:${target.port}`
    )
  }

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

  public chooseExample(example: Flow) {
    this.currentExample = example
  }
}
