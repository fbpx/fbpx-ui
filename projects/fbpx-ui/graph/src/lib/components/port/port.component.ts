import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core'
import {Port} from '../graph/models'
import {Position} from '@fbpx-ui/core'

export interface PortEvent {
  event: PointerEvent
  port: Port
  portComponent: PortComponent
}

/**
 * Port component
 *
 * Represents a single port within a Node
 */
@Component({
  selector: 'svg[fbpx-graph-port]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './port.html',
})
export class PortComponent implements OnDestroy {
  @Input() public port: Port
  @Output() public onPress = new EventEmitter<PortEvent>()
  @Output() public onPointerEnter = new EventEmitter<PortEvent>()
  @Output() public onPointerLeave = new EventEmitter<PortEvent>()
  @ViewChild('portCircle') public portCircle: ElementRef

  public isActive = false

  constructor(private elementRef: ElementRef) {
    const element = this.elementRef.nativeElement

    element.addEventListener('pointerdown', this.handlePointerDown)
    element.addEventListener('pointerleave', this.handlePointerLeave)
    element.addEventListener('pointerenter', this.handlePointerEnter)
  }

  @HostBinding('attr.width')
  get width() {
    return this.port.width
  }

  @HostBinding('attr.height')
  get height() {
    return this.port.width
  }

  public ngOnDestroy() {
    const element = this.elementRef.nativeElement

    element.removeEventListener('pointerdown', this.handlePointerDown)
    element.removeEventListener('pointerleave', this.handlePointerLeave)
    element.removeEventListener('pointerenter', this.handlePointerEnter)
  }

  private handlePointerEnter = (event: PointerEvent): void => {
    this.onPointerEnter.emit({
      event,
      port: this.port,
      portComponent: this,
    })
  }

  private handlePointerLeave = (event: PointerEvent): void => {
    this.onPointerLeave.emit({
      event,
      port: this.port,
      portComponent: this,
    })
  }

  private handlePointerDown = (event: PointerEvent): void => {
    event.preventDefault()
    event.stopPropagation()

    this.isActive = true

    this.onPress.emit({
      event,
      port: this.port,
      portComponent: this,
    })
  }

  public getPortPosition(scale: number): Position {
    const {x, y} = this.portCircle.nativeElement.getBoundingClientRect()

    return {
      x: x / scale,
      y: y / scale,
    }
  }
}
