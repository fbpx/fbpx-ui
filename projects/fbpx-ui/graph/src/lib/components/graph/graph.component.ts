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
import {debugElement, getCoords, Position, writeTransform} from '@fbpx-ui/core'
import {LinkComponent, LinkEvent} from '../link/link.component'
import {
  NodeComponent,
  NodeMouseEvent,
  PortPositions,
  NodePortEvent,
  TargetPortToggleEvent,
  PortPosition,
} from '../node'
import {PanData} from '../shared'
import {Flow, Link, Node, Connector, RenderNode, RenderLink} from './models'
import {DropEvent} from 'ng-drag-drop'
import {BehaviorSubject} from 'rxjs'
import uuid from 'uuid'
import {autoScaleFromElement} from './layout'
import {SelectionManager} from './services'

let nodeRenderId = 0
let linkRenderId = 0

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
  [nodeId: string]: {
    portPositions: PortPositions
    dimensions: NodeDimensions
  }
}

export type ConnectorWithPosition = Connector & Position

export interface GraphNodeMouseEvent extends NodeMouseEvent {
  graph: Flow
}

@Component({
  selector: 'fbpx-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './graph.component.html',
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

  private _graph: Flow

  public nodes$ = new BehaviorSubject<RenderNode[]>([])
  public links$ = new BehaviorSubject<RenderLink[]>([])

  /**
   * The graph model containing all nodes and links.
   */
  @Input()
  public set graph(graph: Flow) {
    this.log('set graph', graph && graph.title)
    this.resetState()
    this.initializeNodes(graph.nodes)
    this.initializeLinks(graph.links)
    this._graph = graph
  }

  public get graph(): Flow {
    return this._graph
  }

  public initializeNodes(nodes: Node[]) {
    this.nodes$.next(nodes.map(node => ({renderId: nodeRenderId++, ...node})))
  }

  public initializeLinks(links: Link[]) {
    this.links$.next(links.map(link => ({renderId: linkRenderId++, ...link})))
  }

  public _initialScale: number | 'auto'

  @Input() public set initialScale(value: number | 'auto') {
    this.log('set initialScale')
    this._initialScale = value

    this.setInitialScale(value)
  }

  public get scale() {
    return this._scale
  }

  /**
   * The zoom factor
   */
  @Input() public zoomFactor = 0.3
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
   * Enable debug log
   */
  @Input() public debug = false
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
  private portInfo: PortInfo = {}
  private nodeInfo: NodeInfo = {}
  private targetPort: Connector
  private sourcePort: ConnectorWithPosition
  private element: HTMLElement
  private cancelClick: boolean = false
  private _autoScale: boolean = false
  public _scale: number = 1

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private selectionManager: SelectionManager,
    private zone: NgZone,
    elementRef: ElementRef
  ) {
    this.element = elementRef.nativeElement
    this.parentContainer = this.element.parentNode || this.element
  }

  public log(...args) {
    if (this.debug) {
      console.log(...args)
    }
  }

  public async ngOnInit() {
    this.log('ngOnInit')
    this.loading$.next(false)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('wheel', this.onWheel)
  }

  public async ngOnChanges(changes: SimpleChanges) {}

  public logChanges(changes: SimpleChanges) {
    this.log('Changes:', {
      graphChanged:
        changes.graph &&
        changes.graph.currentValue !== changes.graph.previousValue,
      scaleChanged:
        changes.scale &&
        changes.scale.currentValue !== changes.scale.previousValue,
    })
  }

  /**
   * Resets the internal state.
   *
   * Called each time a new graph is passed in as input.
   */
  public resetState() {
    this.log('resetState')
    this.portInfo = {}
    this.nodeInfo = {}
    this.targetPort = undefined
    this.sourcePort = undefined
    this._scale = 1
    this._autoScale = false
    this.linksCreated = false
    this.isInitialized = false
    this.offset = {
      x: 0,
      y: 0,
    }
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
    this.log('afterNodeViewInit')
    setTimeout(() => {
      this.updateNodeDimensions(nodeComponent)

      if (Object.keys(this.nodeInfo).length === this.graph.nodes.length) {
        setTimeout(() => this.layoutGraph())
      }
    })
  }

  public setInitialScale(value: number | 'auto') {
    this.log('setInitialScale')
    if (value === 'auto') {
      this._autoScale = true
    } else {
      this.zoom(value)
    }
  }

  /**
   * Zooms the graph using the center as focal point.
   */
  public zoom(scale: number) {
    const {x, y, width, height} = this.parentContainer.getBoundingClientRect()

    debugElement()({x, y})

    this.zoomToFocalPoint(scale, {
      x: x + width / 2,
      y: y + height / 2,
    })

    this.setScale(scale)
    this.changeDetectorRef.detectChanges()
  }

  public onResize = (event: UIEvent) => {
    this.log('onResize')
  }

  public autoScale(nodes: Node[]) {
    this.log('autoScale')
    const coords = autoScaleFromElement(this.parentContainer, nodes)

    const rect = this.parentContainer.getBoundingClientRect()

    const halfHeight = rect.height / 2
    const halfWidth = rect.width / 2

    const offsetY = halfHeight - (coords.bottom * coords.scale) / 2
    const offsetX = -(coords.left * this._scale)

    this.offset = {
      x: offsetX + halfWidth - (coords.width * coords.scale) / 2,
      y: offsetY - halfHeight,
    }

    this.setScale(coords.scale)

    this.changeDetectorRef.detectChanges()
  }

  public ngAfterViewInit() {
    this.log('afterViewInit')
    /*
    this.log('nodeComponentsLength?', this.nodeComponents.length)
    this.nodeComponents.changes.subscribe(this.nodeComponentsListChanged)
    */
    this.afterViewInit.emit(this.parentContainer)
  }

  public nodeComponentsListChanged = (value: QueryList<NodeComponent>) => {
    this.log('No of node components', this.nodeComponents.length, value)
    if (value.last) {
      this.updateNodeDimensions(value.last)
    }
  }

  public initializeGraph() {
    this.log('initializeGraph')

    this._removeDeselectAreaForNodesHandler = this.selectionManager.nodeSelector.addDeselectArea(
      this.parentContainer
    )
    this._removeDeselectAreaForLinksHandler = this.selectionManager.linkSelector.addDeselectArea(
      this.parentContainer
    )

    /* Don't automatically deselect ports
    this._removeDeselectAreaForPortsHandler = this.selectionManager.addDeselectArea(
      this.parentContainer
    )
    */
  }

  public currentGraph: Flow

  public nodes: Node[]
  /**
   * This method is called as soon as all node positions are known.
   */
  public layoutGraph() {
    this.log('layoutGraph')
    const nodes = this.nodes$.getValue().map(node => ({
      ...node,
      metadata: {
        ...node.metadata,
        ...this.nodeInfo[node.id].dimensions, // add dimensions
      },
    }))

    if (this._autoScale) {
      this.autoScale(nodes)
    }

    this.nodes$.next(nodes)

    this.initializeGraph()

    this.changeDetectorRef.detectChanges()

    setTimeout(() => {
      this.isInitialized = true
      this.buildLinks()
    })
  }

  public buildLinks() {
    // just only now collect all port positions.
    for (const nodeComponent of this.nodeComponents) {
      this.updatePortPositionsForNode(
        nodeComponent.node.id,
        nodeComponent.getPortPositions(this._scale)
      )
    }
    // now all correct portInfo is set.
    this.updateLinkPositions()

    this.changeDetectorRef.detectChanges()
  }

  public ngAfterContentInit() {
    this.log('ngAfterContentInit')
    this.afterContentInit.emit(this.parentContainer)
  }

  /**
   * Augments the links of the graph with their source and target positions.
   *
   * These positions are based on whatever is the current location of the source and target ports.
   */
  public links: Link[] = []
  public updateLinkPositions() {
    this.links$.next(this.links$.getValue().map(link => this.updateLink(link)))
  }

  public updateViewModelLinksForNodes(nodeIds: string[]) {
    this.log('updateViewModelLinksForNodes')
    this.links$.next(
      this.links$.getValue().map(link => {
        if (
          nodeIds.includes(link.source.id) ||
          nodeIds.includes(link.target.id)
        ) {
          return this.updateLink(link)
        }

        return link
      })
    )
  }

  /**
   * Executes during panning of the canvas.
   */
  public handlePan(data: PanData) {
    this.log('handlePan')
    this.offset = {
      x: this.offset.x + data.movementX,
      y: this.offset.y + data.movementY,
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
    this.log('panToNode')
    const node = this.nodes$.getValue().find(item => item.id === nodeId)

    const rect = this.graphElementRef.nativeElement.getBoundingClientRect()
    if (node) {
      this.offset = {
        x: (rect.width / 2 - node.metadata.x) * this._scale,
        y: (rect.height / 2 - node.metadata.y) * this._scale,
      }

      this.changeDetectorRef.detectChanges()
    }
  }

  /**
   * Executes when panning starts.
   */
  public handlePanStart(_event) {
    this.log('handlePanStart')
    this.selectionManager.lockAll()
  }

  /**
   * Executes when panning has ended.
   */
  public handlePanEnd(_event) {
    this.log('handlePanEnd')
    setTimeout(() => {
      this.selectionManager.unlockAll()
    })
    this.changeDetectorRef.detectChanges()
  }

  /**
   * Executes when a node drag is initiated
   */
  public onNodeDragInit = (event: MouseEvent) => {
    this.log('onNodeDragInit')
    if (event.ctrlKey) {
      return false
    }
    return true
  }

  /**
   *  Executes whenever a node drag has finished.
   */
  public onNodeDragEnd(node: Node, {x, y}) {
    this.log('onNodeDragEnd')
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
    this.log('onNodeResize')
    if (this.isInitialized) {
      this.updatePortPositionsForNode(
        nodeComponent.node.id,
        nodeComponent.getPortPositions(this._scale)
      )
      this.updateViewModelLinksForNodes([nodeComponent.node.id])
      this.changeDetectorRef.detectChanges()
    }
  }

  public updatePortPositionsForNode(
    nodeId: string,
    portPositions: PortPositions
  ) {
    this.log('updatePortPositionsForNode')
    const {input, output} = portPositions

    const nodeGroupOffset = this.nodeGroupRef.nativeElement.getBoundingClientRect()

    this.updatePortPositions(input, nodeGroupOffset)
    this.updatePortPositions(output, nodeGroupOffset)

    this.portInfo[nodeId] = {input, output}
  }

  /**
   * Executes whenever a node is moved across the canvas.
   */
  public onNodeMovement(node: Node) {
    this.log('onNodeMovement')
    if (!this.editable) {
      return
    }

    const nodeComponent = this.nodeComponents.find(
      item => item.node.id === node.id
    )

    this.updatePortPositionsForNode(
      node.id,
      nodeComponent.getPortPositions(this._scale)
    )
    this.updateViewModelLinksForNodes([nodeComponent.node.id])

    // removing this will cause lag for the edges during drag.
    this.changeDetectorRef.detectChanges()
  }

  public updateNodeDimensions(nodeComponent) {
    this.log('updateNodeDimensions')
    const {
      width,
      height,
      node: {id},
    } = nodeComponent
    this.log('Getting port positions with current scale', this._scale)
    const positions = nodeComponent.getPortPositions()

    this.nodeInfo[id] = {dimensions: {width, height}, portPositions: positions}
  }

  /**
   * Executed when any of the nodes is clicked upon.
   */
  public handleNodeClick(event) {
    this.log('handleNodeClick')
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
  public onToggleTargetPort({id, port, isTarget}: TargetPortToggleEvent) {
    this.log('onToggleTargetPort')
    if (!this.editable) {
      return
    }

    if (isTarget) {
      this.targetPort = {
        id,
        port: port.name,
      }
    } else {
      this.targetPort = undefined
    }
  }

  /**
   * Executed when an edge is started.
   */
  public onEdgeStart({id, port: portName}) {
    this.log('onEdgeStart')
    if (!this.editable) {
      return
    }

    const port = this.portInfo[id].output[portName]

    this.sourcePort = {
      ...port,
      x: port.x / this._scale,
      y: port.y / this._scale,
    }

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
    this.log('onEdgeDraw')
    if (!this.editable) {
      return
    }

    const nodeOffset = this.nodeGroupRef.nativeElement.getBoundingClientRect()

    const target = {
      id: null,
      port: null,
      x: (position.clientX - nodeOffset.x) / this._scale,
      y: (position.clientY - nodeOffset.y) / this._scale,
    }

    const drawEdge = {
      id: uuid.v4(),
      source: this.sourcePort,
      target,
      sourceX: this.sourcePort.x * this._scale,
      sourceY: this.sourcePort.y * this._scale,
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
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('wheel', this.onWheel)
    this._removeDeselectAreaForLinksHandler()
    this._removeDeselectAreaForNodesHandler()
    // this._removeDeselectAreaForPortsHandler()
  }

  public linkTracker = (_index, item) => {
    return item.renderId
  }

  public nodeTracker = (_index, item) => {
    return item.renderId
  }

  /**
   * Creates a Link containing positional information.
   *
   * Based on the collected portInfo of both source and target.
   *
   * The PortInfo contains the location of the ports.
   */
  private updateLink(link: RenderLink): RenderLink | null {
    const source = this.portInfo[link.source.id]
    const target = this.portInfo[link.target.id]

    if (source?.output && target?.input) {
      const sourcePort = source.output[link.source.port]
      const targetPort = target.input[link.target.port]

      const hasChanged =
        sourcePort.x !== link.sourceX ||
        sourcePort.y !== link.sourceY ||
        targetPort.x !== link.targetX ||
        targetPort.y !== link.targetY

      if (hasChanged) {
        return {
          ...link,
          sourceX: sourcePort.x,
          sourceY: sourcePort.y,
          targetX: targetPort.x,
          targetY: targetPort.y,
          renderId: ++linkRenderId,
        }
      }
    }

    return link
  }

  private updatePortPositions(
    ports: {[key: string]: PortPosition},
    offset: Position
  ) {
    for (const [name, port] of Object.entries(ports)) {
      port.x = ports[name].x - offset.x / this._scale
      port.y = ports[name].y - offset.y / this._scale
    }
  }

  private onWheel = (event: MouseWheelEvent) => {
    const delta =
      event.deltaY === 0 && event.deltaX ? event.deltaX : event.deltaY
    const wheel = delta < 0 ? 1 : -1

    const scale = this._scale * Math.exp((wheel * this.zoomFactor) / 3)

    this.zoomToFocalPoint(scale, {
      x: event.clientX,
      y: event.clientY,
    })
  }

  /**
   * Zooms to the given focal point using the provided scale.
   *
   * The focal point must be provided in coordinates relative to the window.
   */
  private zoomToFocalPoint(scale: number, position: Position) {
    const relativeFocalPoint = this.getRelativeFocalPoint(position)

    const scaleFactor = scale / this._scale

    const adjustment = this.getOffsetAdjustment(scaleFactor, relativeFocalPoint)

    this.offset = {
      x: this.offset.x - adjustment.x,
      y: this.offset.y - adjustment.y,
    }

    this.setScale(scale)

    this.changeDetectorRef.detectChanges()
  }

  private setScale(scale: number) {
    this._scale = scale
    this.onScale.emit(scale)
  }

  /**
   * Calculate the difference between the original point
   * and the new scaled position of this point.
   *
   * Which will give the amount the new offset has to be adjusted.
   */
  private getOffsetAdjustment(scaleFactor: number, {x, y}: Position): Position {
    return {
      x: x * scaleFactor - x,
      y: y * scaleFactor - y,
    }
  }

  /**
   * Get position of pointer relative to the parent container
   */
  private getRelativeFocalPoint({x, y}: Position): Position {
    const rect = this.parentContainer.getBoundingClientRect()

    return {
      x: x - this.offset.x - rect.x,
      y: y - this.offset.y - rect.y,
    }
  }
}
