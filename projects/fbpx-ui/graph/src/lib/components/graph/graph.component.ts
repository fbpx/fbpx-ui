import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  QueryList,
  ViewEncapsulation,
} from '@angular/core'
import {getCoords, Position, writeTransform} from '@fbpx-ui/core'
import {LinkComponent, LinkEvent} from '../link/link.component'
import {
  NodeComponent,
  NodeMouseEvent,
  PortPositions,
  PortUpdate,
  NodePortEvent,
} from '../node'
import {PanData} from '../shared'
import {Flow, Link, Node, Connector} from './models'
import PanZoom from '@panzoom/panzoom'
import {DropEvent} from 'ng-drag-drop'
import {BehaviorSubject} from 'rxjs'
import uuid from 'uuid'
import {autoScaleFromElement} from './layout'
import {PanzoomObject} from '@panzoom/panzoom/dist/src/types'
import {SelectionManager} from './services'

export interface AddNodeEvent {
  node: Node
  position: Position
}

export interface PanEvent {
  data: PanData
  offset: Position
}

export interface NodeDimensions {
  x?: number
  y?: number
  width: number
  height: number
}

export interface PortInfo {
  [nodeId: string]: PortPositions
}

export interface NodeInfo {
  [nodeId: string]: NodeDimensions
}

export type ConnectorWithPosition = Connector & Position

export interface GraphNodeMouseEvent extends NodeMouseEvent {
  graph: Flow
}

// the amount to zoom in
const panZoomDepth = 0.15

@Component({
  selector: 'fbpx-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      #graphContainer
      class="dropZone"
      droppable
      [dropScope]="['nodes']"
      (onDrop)="onNodeDrop($event)"
    >
      <div
        *ngIf="!(loading$ | async)"
        #graphElement
        drag
        [dragTarget]="graphContainer"
        [dragEnabled]="panEnabled"
        [dragScale]="1"
        [dragSource]="false"
        (onDrag)="handlePan($event)"
        (onDragStart)="handlePanStart($event)"
        (onDragEnd)="handlePanEnd($event)"
        class="graph"
      >
        <svg *ngIf="isInitialized" class="link-canvas">
          <g
            class="link-group"
            #linkGroup
            [attr.transform]="currentTransformSVG"
          >
            <g
              *ngFor="let link of links; trackBy: linkTracker"
              fbpx-graph-link
              (onLinkSelection)="onLinkSelection($event)"
              [link]="link"
              [selected]="link.metadata?.ui?.selected"
              [active]="link.metadata?.ui?.active"
              [persist]="link.target?.setting?.persist"
            ></g>

            <g
              *ngIf="drawEdge$ | async; let drawEdge"
              fbpx-graph-link
              class="drawEdge"
              [link]="drawEdge"
              [attr.isDragging]="true"
            ></g>
          </g>
        </svg>
        <div
          class="node-group"
          #nodeGroup
          [ngStyle]="{transform: currentTransform}"
        >
          <fbpx-node
            *ngFor="let node of graph.nodes; trackBy: nodeTracker"
            [node]="node"
            [title]="node.title || node.name"
            (afterViewInit)="afterNodeViewInit($event)"
            (onToggleTargetPort)="onToggleTargetPort($event)"
            (onEdgeStart)="onEdgeStart($event)"
            (onClick)="handleNodeClick($event)"
            (onInputPortEnter)="onInputPortEnter.emit($event)"
            (onInputPortLeave)="onInputPortLeave.emit($event)"
            (onInputPortPressed)="onInputPortPressed.emit($event)"
            (onOutputPortEnter)="onOutputPortEnter.emit($event)"
            (onOutputPortLeave)="onOutputPortLeave.emit($event)"
            (onOutputPortPressed)="onOutputPortPressed.emit($event)"
            drag
            [dragScale]="this.panZoomScale && this.computedScale"
            [dragEnabled]="editable"
            [onDragInit]="onNodeDragInit"
            (onDrag)="onNodeMovement(node)"
            (onDragEnd)="onNodeDragEnd(node, $event)"
            [style.transform]="
              node.metadata?.x && node.metadata?.y
                ? translateNode({x: node.metadata.x, y: node.metadata.y})
                : ''
            "
          >
          </fbpx-node>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./graph.scss'],
})
export class GraphComponent
  implements OnDestroy, AfterViewInit, AfterContentInit, OnChanges, OnInit {
  get currentTransform() {
    return this._scale
      ? writeTransform({
          scale: [this._scale.toString()],
          translate: [`${this.offset.x}px`, `${this.offset.y}px`],
        })
      : ''
  }

  get currentTransformSVG() {
    return this._scale
      ? writeTransform({
          scale: [this._scale.toString()],
          translate: [`${this.offset.x}`, `${this.offset.y}`],
        })
      : ''
  }

  /**
   * The graph model containing all nodes and links.
   */
  @Input()
  public graph: Flow

  public _initialScale: number | 'auto'

  @Input() public set initialScale(value: number | 'auto') {
    this._initialScale = value

    this.setInitialScale(value)
  }

  public get scale() {
    return this._scale
  }

  /**
   * The maximum scale value
   */
  @Input() public maxScale = 100
  /**
   * Whether this graph is editable
   */
  @Input() public editable: boolean = true
  /**
   * Whether to enabling panning of the canvas
   */
  @Input() public panEnabled: boolean = true
  /**
   * Triggers when a link has been created.
   */
  @Output() public onLinkCreated = new EventEmitter<Link>()

  /**
   * Triggers when a node is clicked
   */
  @Output() public onNodeClick = new EventEmitter<GraphNodeMouseEvent>()
  /**
   * Triggers when a node is added to the canvas by a drop event
   */
  @Output() public onAddNode = new EventEmitter<AddNodeEvent>()

  /**
   * Triggers whenever the node updates.
   *
   * e.g. after drag it
   */
  @Output() public onNodeUpdate = new EventEmitter<Node>()

  /**
   * Triggers during canvas panning.
   */
  @Output() public onPan = new EventEmitter<PanEvent>()

  /**
   * Triggers on entering an input port
   */
  @Output() public onInputPortEnter = new EventEmitter<NodePortEvent>()
  /**
   * Triggers on mouse leave of an input port
   */
  @Output() public onInputPortLeave = new EventEmitter<NodePortEvent>()
  /**
   * Triggers when the input port is pressed
   */
  @Output() public onInputPortPressed = new EventEmitter<NodePortEvent>()
  /**
   * Triggers on mouse enter of an output port
   */
  @Output() public onOutputPortEnter = new EventEmitter<NodePortEvent>()
  /**
   * Triggers on mouse leave of an output port
   */
  @Output() public onOutputPortLeave = new EventEmitter<NodePortEvent>()
  /**
   * Triggers when the output port is pressed
   */
  @Output() public onOutputPortPressed = new EventEmitter<NodePortEvent>()

  /**
   * Triggers when the scale changes
   */
  @Output() public onScale = new EventEmitter<number>()

  @Output() public afterViewInit = new EventEmitter()
  @Output() public afterContentInit = new EventEmitter()

  public drawEdge$: BehaviorSubject<Link | null> = new BehaviorSubject(null)

  public offset = {
    x: 0,
    y: 0,
  }

  public panZoomScale: number = 1
  public loading$ = new BehaviorSubject(true)

  @ViewChild('graphElement') public graphElementRef: ElementRef
  @ViewChild('nodeGroup') public nodeGroupRef: ElementRef
  @ViewChild('linkCanvas') public linkCanvasRef: ElementRef
  @ViewChild('linkGroup') public linkGroupRef: ElementRef
  @ViewChildren(NodeComponent) public nodeComponents: QueryList<NodeComponent>
  @ViewChildren(LinkComponent)
  public linkComponents: QueryList<LinkComponent>
  public linksCreated: boolean = false
  public isInitialized: boolean = false

  private _removeDeselectAreaForNodesHandler: Function
  private _removeDeselectAreaForLinksHandler: Function
  private _removeDeselectAreaForPortsHandler: Function

  private parentContainer
  private panZoom: PanzoomObject
  private portInfo: PortInfo = {}
  private nodeInfo: NodeInfo = {}
  private targetPort: Connector
  private sourcePort: ConnectorWithPosition
  private element: HTMLElement
  private cancelClick: boolean = false
  private _autoScale: boolean = false
  public _scale: number

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private selectionManager: SelectionManager,
    private zone: NgZone,
    elementRef: ElementRef
  ) {
    this.element = elementRef.nativeElement
    this.parentContainer = this.element.parentNode || this.element
  }

  public async ngOnInit() {
    this.loading$.next(false)
  }

  public async ngOnChanges({graph, scale}: SimpleChanges) {
    if (graph.currentValue !== graph.previousValue) {
      setTimeout(() => {
        this.resetState()
        this.changeDetectorRef.detectChanges()
      })
    }
  }

  public resetState() {
    this.panZoom = undefined
    this.portInfo = {}
    this.nodeInfo = {}
    this.targetPort = undefined
    this.sourcePort = undefined
    this._scale = undefined
    this._autoScale = false
    this.linksCreated = false
    this.isInitialized = false
    this.offset = {
      x: 0,
      y: 0,
    }
    this.panZoomScale = 1
    this.setInitialScale(this._initialScale || 'auto')
  }

  /**
   * Triggers when any of the nodes has finished rendering.
   *
   * The graph uses this information to become aware of these port positions.
   *
   * This information is then used to draw the edges between source and target ports.
   */
  public afterNodeViewInit(nodeComponent: NodeComponent) {
    this.updateNodeDimensions(nodeComponent)

    if (Object.keys(this.nodeInfo).length === this.graph.nodes.length) {
      this.layoutGraph()
    }
  }

  public setInitialScale(value: number | 'auto') {
    if (value === 'auto') {
      this._autoScale = true
    } else {
      this.zoom(value)
    }
  }

  public zoom(scale: number) {
    this.panZoom.zoom(scale / panZoomDepth)
    this.changeDetectorRef.detectChanges()
  }

  public autoScale() {
    const coords = autoScaleFromElement(this.parentContainer, this.graph)

    this.panZoomScale = 1 / panZoomDepth
    this._scale = coords.scale * panZoomDepth

    const rect = this.parentContainer.getBoundingClientRect()

    const halfHeight = rect.height / 2
    const halfWidth = rect.width / 2

    const offsetY = halfHeight - (coords.bottom * this._scale) / 2
    const offsetX = -(coords.left * this._scale)

    this.offset = {
      x: offsetX + halfWidth - (coords.width * this._scale) / 2,
      y: offsetY - halfHeight / this.panZoomScale,
    }
    this.changeDetectorRef.detectChanges()
  }

  public panZoomChange = change => {
    this.panZoomScale = change.detail.scale

    this.onScale.emit(this.computedScale)
  }

  public get computedScale() {
    return this.panZoomScale * this._scale
  }

  public ngAfterViewInit() {
    this.afterViewInit.emit(this.parentContainer)
  }

  public initializeGraph() {
    this.panZoom = PanZoom(this.graphElementRef.nativeElement, {
      startScale: this.panZoomScale,
      disablePan: true,
      maxScale: this.maxScale,
      contain: 'outside',
    })

    this.parentContainer.addEventListener('wheel', this.panZoom.zoomWithWheel)
    this.graphElementRef.nativeElement.addEventListener(
      'panzoomchange',
      this.panZoomChange
    )

    this._removeDeselectAreaForNodesHandler = this.selectionManager.nodeSelector.addDeselectArea(
      this.parentContainer
    )
    this._removeDeselectAreaForLinksHandler = this.selectionManager.linkSelector.addDeselectArea(
      this.parentContainer
    )

    this.isInitialized = true

    /* Don't automatically deselect ports
    this._removeDeselectAreaForPortsHandler = this.selectionManager.addDeselectArea(
      this.parentContainer
    )
    */
  }

  /**
   * This method is called as soon as all node positions are known.
   */
  public layoutGraph() {
    const graph = {
      ...this.graph,
      nodes: this.graph.nodes.map(node => ({
        ...node,
        metadata: {
          ...node.metadata,
          ...this.nodeInfo[node.id], // add dimensions
        },
      })),
    }

    this.graph = graph

    if (this._autoScale) {
      this.autoScale()
    }

    this.initializeGraph()

    setTimeout(() => {
      for (const nodeComponent of this.nodeComponents) {
        this.updatePortPositionsForNode(nodeComponent)
      }

      this.createViewModelLinks(this.graph.links)

      this.changeDetectorRef.detectChanges()
    })
  }

  public ngAfterContentInit() {
    this.afterContentInit.emit(this.parentContainer)
  }

  /**
   * Augments the links of the graph with their source and target positions.
   *
   * These positions are based on whatever is the current location of the source and target ports.
   */
  public links: Link[] = []
  public createViewModelLinks(links: Link[]) {
    this.links = []

    for (const link of links) {
      const _link = this.makeLink(link)
      if (_link) {
        this.links.push(_link)
      }
    }
  }

  public updateViewModelLinksForNodes(nodeIds: string[]) {
    this.links = this.links
      .map(link => {
        if (
          nodeIds.includes(link.source.id) ||
          nodeIds.includes(link.target.id)
        ) {
          return this.makeLink(link)
        }

        return link
      })
      .filter(link => link !== null)
  }

  /**
   * Executes during panning of the canvas.
   */
  public handlePan(data: PanData) {
    this.offset = {
      x: this.offset.x + data.movementX / this.panZoomScale,
      y: this.offset.y + data.movementY / this.panZoomScale,
    }

    this.onPan.emit({
      offset: this.offset,
      data,
    })

    this.changeDetectorRef.detectChanges()
  }

  /**
   * Api to allow panning to a node.
   */
  public panToNode(nodeId: string) {
    const node = this.graph.nodes.find(item => item.id === nodeId)

    const rect = this.graphElementRef.nativeElement.getBoundingClientRect()
    if (node) {
      this.offset = {
        x: (rect.width / 2 - node.metadata.x) * this.computedScale,
        y: (rect.height / 2 - node.metadata.y) * this.computedScale,
      }

      this.changeDetectorRef.detectChanges()
    }
  }

  /**
   * Executes when panning starts.
   */
  public handlePanStart(_event) {
    this.selectionManager.lockAll()
  }

  /**
   * Executes when panning has ended.
   */
  public handlePanEnd(_event) {
    setTimeout(() => {
      this.selectionManager.unlockAll()
    })
    this.changeDetectorRef.detectChanges()
  }

  /**
   * Executes when a node drag is initiated
   */
  public onNodeDragInit = (event: MouseEvent) => {
    if (event.ctrlKey) {
      return false
    }
    return true
  }

  /**
   *  Executes whenever a node drag has finished.
   */
  public onNodeDragEnd(node: Node, {x, y}) {
    if (!this.editable) {
      return
    }

    this.cancelClick = true

    this.onNodeUpdate.emit({
      ...node,
      metadata: {
        ...node.metadata,
        x,
        y,
      },
    })
  }

  public onNodeResize(nodeComponent: NodeComponent) {
    if (this.isInitialized) {
      this.updatePortPositionsForNode(nodeComponent)
      this.changeDetectorRef.detectChanges()
    }
  }

  public updatePortPositionsForNode(nodeComponent: NodeComponent) {
    if (nodeComponent) {
      const {
        node: {id: nodeId},
      } = nodeComponent
      const {input, output} = nodeComponent.getPortPositions()

      const nodeGroupOffset = this.nodeGroupRef.nativeElement.getBoundingClientRect()

      this.updatePortPositions(input, nodeGroupOffset)
      this.updatePortPositions(output, nodeGroupOffset)

      this.portInfo[nodeId] = {input, output}

      this.updateViewModelLinksForNodes([nodeId])
    }
  }

  /**
   * Executes whenever a node is moved across the canvas.
   */
  public onNodeMovement(node: Node) {
    if (!this.editable) {
      return
    }

    const nodeComponent = this.nodeComponents.find(
      item => item.node.id === node.id
    )

    this.updatePortPositionsForNode(nodeComponent)

    // removing this will cause lag for the edges during drag.
    this.changeDetectorRef.detectChanges()
  }

  public updateNodeDimensions({width, height, node: {id}}: NodeComponent) {
    this.nodeInfo[id] = {width, height}
  }

  /**
   * Executed when any of the nodes is clicked upon.
   */
  public handleNodeClick(event) {
    if (!this.cancelClick) {
      this.onNodeClick.emit({
        ...event,
        graph: this.graph,
      })
    } else {
      this.cancelClick = false
    }
  }

  /**
   * Executed when a target port is entered or left using the mouse.
   */
  public onToggleTargetPort({id, port, isTarget}) {
    if (!this.editable) {
      return
    }

    if (isTarget) {
      this.targetPort = {
        id,
        port,
      }
    } else {
      this.targetPort = undefined
    }
  }

  /**
   * Executed when an edge is started.
   */
  public onEdgeStart({id, port}) {
    if (!this.editable) {
      return
    }

    this.sourcePort = this.portInfo[id].output[port]

    this.zone.runOutsideAngular(() => {
      this.parentContainer.addEventListener('mousemove', this.onEdgeDraw)
      this.parentContainer.addEventListener('mouseup', this.onEdgeFinish)
    })
  }

  /**
   * Position with scale one works ok, needs tiny fix.
   *
   * onEdgeDraw receives the direct x, y coordinates during drag.
   *
   * @param position
   */
  public onEdgeDraw = position => {
    if (!this.editable) {
      return
    }

    const nodeOffset = this.nodeGroupRef.nativeElement.getBoundingClientRect()

    const target = {
      id: null,
      port: null,
      x: (position.clientX - nodeOffset.x) / this.computedScale,
      y: (position.clientY - nodeOffset.y) / this.computedScale,
    }

    const drawEdge = {
      id: uuid.v4(),
      source: this.sourcePort,
      target,
      sourceX: this.sourcePort.x,
      sourceY: this.sourcePort.y,
      targetX: target.x,
      targetY: target.y,
    }

    this.drawEdge$.next(drawEdge)

    this.changeDetectorRef.detectChanges()
  }

  /**
   * Executed when an edge is finished.
   */
  public onEdgeFinish = () => {
    if (!this.editable) {
      return
    }

    if (this.targetPort) {
      if (this.drawEdge$.getValue()) {
        const newLink = {
          source: this.sourcePort,
          target: this.targetPort,
        }

        this.onLinkCreated.emit(newLink)

        this.sourcePort = null
      }
    }

    this.drawEdge$.next(null)
    this.targetPort = null

    this.parentContainer.removeEventListener('mousemove', this.onEdgeDraw)
    this.parentContainer.removeEventListener('mouseup', this.onEdgeFinish)

    this.changeDetectorRef.detectChanges()
  }

  /**
   * Executed when a link is being selected.
   */
  public onLinkSelection(event: LinkEvent) {
    const {
      link,
      event: {ctrlKey},
    } = event

    if (!this.editable) {
      return
    }

    this.selectionManager.linkSelector.toggleSelection(link.id, link, ctrlKey)
  }

  /**
   * Executed when a node is dropped upon the canvas.
   */
  public onNodeDrop({dragData: node, nativeEvent}: DropEvent) {
    if (!this.editable) {
      return
    }

    const rect = getCoords(this.graphElementRef.nativeElement)

    this.onAddNode.emit({
      node,
      position: {
        x: nativeEvent.x - rect.x,
        y: nativeEvent.y - rect.y,
      },
    })
  }

  public translateNode(position: Position) {
    return `translate(${position.x}px, ${position.y}px)`
  }

  public ngOnDestroy() {
    this._removeDeselectAreaForLinksHandler()
    this._removeDeselectAreaForNodesHandler()
    // this._removeDeselectAreaForPortsHandler()
  }

  public linkTracker = (_index, item) => {
    return `${this.graph.id}-${item.id}`
  }

  public nodeTracker = (_index, item) => {
    return `${this.graph.id}-${item.id}`
  }

  /**
   * Creates a Link containing positional information.
   *
   * Based on the collected portInfo of both source and target.
   *
   * The PortInfo contains the location of the ports.
   */
  private makeLink(link: Link): Link | null {
    const source = this.portInfo[link.source.id]
    const target = this.portInfo[link.target.id]

    if (source?.output && target?.input) {
      const sourcePort = source.output[link.source.port]
      const targetPort = target.input[link.target.port]

      return {
        id: link.id,
        sourceX: sourcePort.x,
        sourceY: sourcePort.y,
        targetX: targetPort.x,
        targetY: targetPort.y,
        source: {
          ...link.source,
          ...sourcePort,
        },
        target: {
          ...link.target,
          ...targetPort,
        },
        metadata: link.metadata,
      }
    }

    return null
  }

  private updatePortPositions(
    ports: {[key: string]: PortUpdate},
    offset: Position
  ) {
    for (const [name, port] of Object.entries(ports)) {
      port.x = (ports[name].x - offset.x) / this.computedScale
      port.y = (ports[name].y - offset.y) / this.computedScale
    }
  }
}
