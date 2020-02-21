// tslint:disable:no-output-on-prefix
import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
} from '@angular/core'
import {DefaultDragStrategy} from './default_drag_strategy'
import {PanDragStrategy} from './pan_drag_strategy'

@Directive({
  selector: '[drag]',
})
export class DraggableDirective implements AfterViewInit, OnChanges {
  @Output() public onDrag = new EventEmitter()
  @Output() public onDragStart = new EventEmitter()
  @Output() public onDragEnd = new EventEmitter()
  @Input() public onDragInit: (event: MouseEvent) => boolean
  @Input() public dragSource: boolean = true
  @Input() public dragTarget
  @Input() public dragScale = 1
  @Input() public dragEnabled: boolean = true

  public _dragTarget
  public dragging = false

  private _dragStrategy: DefaultDragStrategy | PanDragStrategy

  private _element: HTMLElement

  constructor(
    _elementRef: ElementRef,
    private _renderer: Renderer2,
    private _ngZone: NgZone
  ) {
    this._element = _elementRef.nativeElement

    this.initDragStrategy()
    this.onStartDrag = this.onStartDrag.bind(this)
    this.onDragging = this.onDragging.bind(this)
    this.endDrag = this.endDrag.bind(this)
  }

  public initDragStrategy() {
    if (this.dragSource) {
      this._dragStrategy = new DefaultDragStrategy({
        settings: {dragScale: this.dragScale},
        renderer: this._renderer,
        element: this._element,
      })
    } else {
      this._dragStrategy = new PanDragStrategy()
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.dragSource &&
      changes.dragSource.currentValue !== changes.dragSource.previousValue
    ) {
      this.initDragStrategy()
    }
    if (
      changes.dragScale &&
      changes.dragScale.currentValue !== changes.dragScale.previousValue
    ) {
      this._dragStrategy.configure({
        dragScale: changes.dragScale.currentValue,
      })
    }
  }

  public ngAfterViewInit() {
    this._dragTarget = this.determineDragTarget()

    if (this.dragEnabled) {
      this._dragTarget.addEventListener('mousedown', this.onStartDrag)
    }
  }

  public determineDragTarget() {
    if (this.dragTarget) {
      if (this.dragTarget instanceof HTMLElement) {
        return this.dragTarget
      }

      if (this.dragTarget === 'document') {
        return document
      }

      return document.querySelector(this.dragTarget)
    }

    return this._element
  }

  public isRightClick(event) {
    return event.button === 2 || event.buttons === 2
  }

  public onStartDrag(event: MouseEvent) {
    if (this.isRightClick(event)) {
      return
    }

    event.stopPropagation()

    this._dragStrategy.onInitDrag(event)

    if (this.onDragInit && !this.onDragInit(event)) {
      return
    }

    document.addEventListener('mousemove', this.onDragging)
    document.addEventListener('mouseup', this.endDrag)
  }

  public async onDragging(event: MouseEvent): Promise<void> {
    if (!this.dragging) {
      this.dragging = true
      const dragData = this._dragStrategy.onStartDrag(event)

      this.onDragStart.emit(dragData)
    } else {
      this._ngZone.runOutsideAngular(async () => this._onDragging(event))
    }
  }

  public async _onDragging(event: MouseEvent): Promise<void> {
    const dragData = await this._dragStrategy.onDragging(event)

    if (dragData) {
      this.onDrag.emit(dragData)
    }
  }

  public endDrag(event: MouseEvent): void {
    document.removeEventListener('mousemove', this.onDragging)
    document.removeEventListener('mouseup', this.endDrag)

    if (this.dragging) {
      const position = this._dragStrategy.endDrag(event)

      this.onDragEnd.emit(position)
    }

    this.dragging = false
  }
}
