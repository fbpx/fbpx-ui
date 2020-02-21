import {Renderer2} from '@angular/core'
import {
  getPositionFromTransform,
  readTransform,
  Position,
  TransformObject,
  writeTransform,
} from '@fbpx-ui/core'
import {DragData, DragSettings, DragStrategy} from './types'

export interface DefaultDragStrategyOptions {
  settings: DragSettings
  element: HTMLElement
  renderer: Renderer2
}

const sense = 1 // 3

export class DefaultDragStrategy extends DragStrategy<DragData> {
  private currentTransform: TransformObject
  private startPosition: DragData
  private lastRenderPos: DragData
  private settings: DragSettings
  private element: HTMLElement
  private renderer: Renderer2

  public constructor({
    settings,
    element,
    renderer,
  }: DefaultDragStrategyOptions) {
    super()
    this.settings = settings
    this.element = element
    this.renderer = renderer
  }

  public configure(settings: DragSettings): void {
    this.settings = settings
  }

  public onInitDrag(event: MouseEvent): void {
    const x = event.x / this.settings.dragScale
    const y = event.y / this.settings.dragScale

    this.currentTransform = this.getTransform(this.element)
    const pos = this.currentTransform
      ? getPositionFromTransform(this.currentTransform)
      : {x: 0, y: 0}

    this.startPosition = {
      x: x - pos.x,
      y: y - pos.y,
      movementX: 0,
      movementY: 0,
    }

    this.lastRenderPos = this.startPosition
  }

  public onStartDrag(event: MouseEvent): DragData {
    return this.startPosition
  }

  public getTransform(element: HTMLElement) {
    const {transform} = element.style

    return transform ? readTransform(transform) : {translate: ['0px', '0px']}
  }

  public async onDragging(event: MouseEvent): Promise<DragData> {
    const dragData = this.getDragData(event)
    return new Promise(resolve => {
      if (
        Math.abs(dragData.movementX) > sense ||
        Math.abs(dragData.movementY) > sense
      ) {
        requestAnimationFrame(() => {
          this.render(dragData)
          // important to run in animation frame, but callback should prevent doing too much work.
          resolve(dragData)
          this.lastRenderPos = dragData
        })
      } else {
        resolve(null)
      }
    })
  }

  public getDragData(event: MouseEvent): DragData {
    const eventX = event.x / this.settings.dragScale
    const eventY = event.y / this.settings.dragScale

    const newPos = {
      x: eventX - this.startPosition.x,
      y: eventY - this.startPosition.y,
    }
    const movementX = newPos.x - this.lastRenderPos.x
    const movementY = newPos.y - this.lastRenderPos.y
    return {
      x: newPos.x,
      y: newPos.y,
      movementX,
      movementY,
    }
  }

  public endDrag(event: MouseEvent): Position {
    return this.getDragData(event)
  }

  public render({x, y}: Position) {
    const transform = writeTransform({
      ...this.currentTransform,
      translate: [`${x}px`, `${y}px`],
    })
    this.renderer.setStyle(this.element, 'transform', transform)
  }
}
