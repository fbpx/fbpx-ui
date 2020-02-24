// tslint:disable:no-output-on-prefix
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  QueryList,
} from '@angular/core'
import {Node, Port} from '../graph/models'
import {throttle, Cancelable} from 'lodash'
import {PortComponent, PortEvent} from '../port'

export interface PortPosition {
  id: string
  port: string
  x: number
  y: number
}

export interface PortPositions {
  input: {
    [key: string]: PortPosition
  }
  output: {
    [key: string]: PortPosition
  }
}

export type NodeHandlers =
  | 'onClick'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onMouseOver'
  | 'onMouseLeave'
  | 'onDoubleClick'

export interface NodeMouseEvent {
  node: Node
  nodeComponent: NodeComponent
  event: MouseEvent
}

export interface NodePortEvent {
  nodeId: string
  type: string
  port: Port
  portComponent: PortComponent
  nodeComponent: NodeComponent
  event: MouseEvent
}

export interface TargetPortToggleEvent {
  id: string
  port: Port
  portComponent: PortComponent
  nodeComponent: NodeComponent
  isTarget: boolean
  event: MouseEvent
}

export interface PortPositions {
  input: {
    [port: string]: PortPosition
  }
  output: {
    [port: string]: PortPosition
  }
}

/**
 * Directive to render a graph node.
 *
 * The directive is to be applied to an <svg /> element.
 */
@Component({
  selector: 'fbpx-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  templateUrl: './node.html',
  styleUrls: ['node.scss'],
})
export class NodeComponent implements OnInit, AfterViewInit {
  /**
   * The node declaration as defined within the flow.
   *
   * Can contain context and extra settings which will be used in conjunction with the node definition.
   */
  @Input() public node: Node

  @Output() public afterViewInit = new EventEmitter<NodeComponent>(true)

  /**
   * EventEmitter which will be triggered when during drag a target input port will be entered or left.
   */
  @Output() public onToggleTargetPort = new EventEmitter<
    TargetPortToggleEvent
  >()

  /**
   * EventEmitter which will be triggered once edge creation is initiated.
   */
  @Output() public onEdgeStart = new EventEmitter()

  /**
   * EventEmitter which will be triggered once an input port is entered.
   */
  @Output() public onInputPortEnter = new EventEmitter<NodePortEvent>()

  /**
   * EventEmitter which will be triggered once an input port is left.
   */
  @Output() public onInputPortLeave = new EventEmitter<NodePortEvent>()

  /**
   * EventEmitter which will be triggered once an input port is pressed.
   */
  @Output() public onInputPortPressed = new EventEmitter<NodePortEvent>()

  /**
   * EventEmitter which will be triggered once an output port is entered.
   */
  @Output() public onOutputPortEnter = new EventEmitter<NodePortEvent>()

  /**
   * EventEmitter which will be triggered once an output port is left.
   */
  @Output() public onOutputPortLeave = new EventEmitter<NodePortEvent>()

  /**
   * EventEmitter which will be triggered once an output port is pressed.
   */
  @Output() public onOutputPortPressed = new EventEmitter<NodePortEvent>()

  /**
   * EventEmitter which will be triggered when a node is clicked.
   */
  @Output() public onClick = new EventEmitter<NodeMouseEvent>()

  /**
   * EventEmitter which will be triggered when a node is double clicked.
   */
  @Output() public onDoubleClick = new EventEmitter<NodeMouseEvent>()

  /**
   * EventEmitter which will be triggered when a node is hovered.
   */
  @Output() public onMouseOver = new EventEmitter<NodeMouseEvent>()

  /**
   * EventEmitter which will be triggered when a node is left.
   */
  @Output() public onMouseLeave = new EventEmitter<NodeMouseEvent>()

  /**
   * EventEmitter which will be triggered on mouse down.
   */
  @Output() public onMouseDown = new EventEmitter<NodeMouseEvent>()

  /**
   * EventEmitter which will be triggered on mouse up.
   */
  @Output() public onMouseUp = new EventEmitter<NodeMouseEvent>()

  /**
   * EventEmitter which will trigger whenever context is updated.
   */
  @Output() public onContextUpdate = new EventEmitter()

  /**
   * The positions of the ports in viewport coordinates.
   */
  public portPositions: PortPositions = {
    input: {},
    output: {},
  }

  @ViewChild('nodeElement', {static: true}) public nodeRef: ElementRef
  @ViewChild('contentDiv') public contentRef: ElementRef
  @ViewChildren('inputPort') public inputPortElements: QueryList<PortComponent>
  @ViewChildren('outputPort') public outputPortElements: QueryList<
    PortComponent
  >

  public get width() {
    return this._width
  }

  public get height() {
    return this._height
  }

  public nodeClasses: {[className: string]: boolean} = {node: true}

  public activate: (() => void) & Cancelable
  public deactivate: (() => void) & Cancelable
  public content: string
  public contentUpdate: any
  private _width: number
  private _height: number

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.activate = throttle(this._activate, 300, {trailing: false})
    this.deactivate = throttle(this._deactivate, 300, {leading: false})
    this.contentUpdate = throttle(this._contentUpdate, 200, {leading: false})
  }

  /**
   * Takes care of initializing the input and output ports as expected by the view.
   *
   * @memberof NodeComponent
   */
  public ngOnInit() {}

  /**
   * When the view has finished (re-)rendering the current port positions will be emitted.
   *
   * Thus instead of calculating these positions up front, the view itself reports the port locations.
   *
   * Port Positions are mainly used to be able to render the links at the correct positions.
   *
   * Whenever a node is moved the view will emit new port positions and links are updated accordingly.
   *
   * @memberof NodeComponent
   */
  public ngAfterViewInit() {
    setTimeout(() => {
      this.afterViewInit.emit(this)
      const {width, height} = this.nodeRef.nativeElement.getBoundingClientRect()

      this._width = width
      this._height = height
    })

    // this.changeDetectorRef.detach()
  }

  public handleInputPortEnter(port: Port, {event, portComponent}: PortEvent) {
    this.onToggleTargetPort.emit({
      id: this.node.id,
      port,
      portComponent,
      nodeComponent: this,
      isTarget: true,
      event,
    })

    this.onInputPortEnter.emit({
      type: 'input',
      nodeId: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      event,
    })
  }

  public handleInputPortLeave(port: Port, {event, portComponent}: PortEvent) {
    this.onToggleTargetPort.emit({
      id: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      isTarget: false,
      event,
    })

    this.onInputPortLeave.emit({
      type: 'input',
      nodeId: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      event,
    })
  }

  public handleInputPortPressed(port: Port, {event, portComponent}: PortEvent) {
    if (event.button === 2) {
      return
    }

    this.onInputPortPressed.emit({
      type: 'input',
      nodeId: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      event,
    })
  }

  public handleOutputPortEnter(port: Port, {event, portComponent}: PortEvent) {
    this.onOutputPortEnter.emit({
      type: 'output',
      nodeId: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      event,
    })
  }

  public handleOutputPortLeave(port: Port, {event, portComponent}: PortEvent) {
    this.onOutputPortLeave.emit({
      type: 'output',
      nodeId: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      event,
    })
  }

  public handleOutputPortPressed(
    port: Port,
    {event, portComponent}: PortEvent
  ) {
    if (event.button === 2) {
      return
    }

    this.onEdgeStart.emit({
      id: this.node.id,
      port: port.name,
    })

    this.onOutputPortPressed.emit({
      type: 'output',
      nodeId: this.node.id,
      port,
      nodeComponent: this,
      portComponent,
      event,
    })
  }

  public trackByPortName(index: number, item) {
    return item.name
  }

  public error() {
    this.nodeClasses.error = true
    this.changeDetectorRef.detectChanges()
  }

  public reset() {
    this.nodeClasses.active = false
    this.nodeClasses.error = false
    this.changeDetectorRef.detectChanges()
  }

  public handleEvent(handler: NodeHandlers, event: MouseEvent) {
    this[handler].emit({
      node: this.node,
      nodeComponent: this,
      event,
    })
  }

  public getPortPositions(scale: number = 1): PortPositions {
    return {
      input: this.collectPortPositions(this.inputPortElements, scale),
      output: this.collectPortPositions(this.outputPortElements, scale),
    }
  }

  public updateContent = (content: string) => {
    if (this.contentUpdate) {
      this.contentUpdate(content)
    }
  }

  public addClass(className: string) {
    this.nodeClasses[name] = true
    this.nodeRef.nativeElement.classList.add(className)
  }

  public removeClass(className: string) {
    this.nodeClasses[name] = false
    this.nodeRef.nativeElement.classList.remove(className)
  }

  public toggleClass(className: string) {
    if (this.nodeClasses[name] === true) {
      this.removeClass(className)
    } else {
      this.addClass(className)
    }
  }

  private _contentUpdate = (content: string) => {
    this.content = content
    if (this.contentRef) {
      this.contentRef.nativeElement.innerHTML = JSON.stringify(content)
    }
  }

  private _activate = () => {
    if (!this.nodeClasses.active) {
      this.addClass('active')
    }
  }

  private _deactivate = () => {
    if (this.nodeClasses.active) {
      this.removeClass('active')
    }
  }

  private collectPortPositions(
    portElements: QueryList<PortComponent>,
    scale: number = 1
  ) {
    const ports = {}
    for (const portElement of portElements) {
      ports[portElement.port.name] = {
        id: this.node.id,
        port: portElement.port.name,
        ...portElement.getPortPosition(scale),
      }
    }
    return ports
  }
}
