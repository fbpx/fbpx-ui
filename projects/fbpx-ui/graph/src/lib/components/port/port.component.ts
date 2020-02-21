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
  event: MouseEvent
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
  @Output() public onMouseEnter = new EventEmitter<PortEvent>()
  @Output() public onMouseLeave = new EventEmitter<PortEvent>()
  @ViewChild('portCircle') public portCircle: ElementRef

  public isActive = false

  constructor(private elementRef: ElementRef) {
    const element = this.elementRef.nativeElement

    element.addEventListener('mousedown', this.handleMouseDown)
    element.addEventListener('mouseleave', this.handleMouseLeave)
    element.addEventListener('mouseenter', this.handleMouseEnter)
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

    element.removeEventListener('mousedown', this.handleMouseDown)
    element.removeEventListener('mouseleave', this.handleMouseLeave)
    element.removeEventListener('mouseenter', this.handleMouseEnter)
  }

  private handleMouseEnter = (event: MouseEvent): void => {
    this.onMouseEnter.emit({
      event,
      port: this.port,
      portComponent: this,
    })
  }

  private handleMouseLeave = (event: MouseEvent): void => {
    this.onMouseLeave.emit({
      event,
      port: this.port,
      portComponent: this,
    })
  }

  private handleMouseDown = (event: MouseEvent): void => {
    event.stopPropagation()

    this.isActive = true

    this.onPress.emit({
      event,
      port: this.port,
      portComponent: this,
    })
  }

  public getPortPosition(): Position {
    const {x, y} = this.portCircle.nativeElement.getBoundingClientRect()

    return {
      x,
      y,
    }
  }
}
