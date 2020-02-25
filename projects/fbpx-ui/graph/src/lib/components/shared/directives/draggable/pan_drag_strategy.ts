import {DragStrategy} from './types'
import {Position} from '@fbpx-ui/core'

export interface PanData {
  selectionX: number
  selectionY: number
  movementX: number
  movementY: number
}

const sense = 1 // 3

export class PanDragStrategy extends DragStrategy<PanData> {
  private lastRenderPos: PanData
  private lastPos: Position

  public onStartDrag(_event: PointerEvent): PanData {
    this.lastRenderPos = {
      selectionX: 0,
      selectionY: 0,
      movementX: 0,
      movementY: 0,
    }

    this.lastPos = {
      x: _event.clientX,
      y: _event.clientY,
    }

    return this.lastRenderPos
  }

  public async onDragging(event: PointerEvent): Promise<PanData> {
    console.log('dragging?')

    // more exact than event.movement{X,Y}
    const movementX = event.clientX - this.lastPos.x
    const movementY = event.clientY - this.lastPos.y

    const panData: PanData = {
      selectionX: this.lastRenderPos.selectionX + movementX,
      selectionY: this.lastRenderPos.selectionY + movementY,
      movementX,
      movementY,
    }

    this.lastPos = {
      x: event.clientX,
      y: event.clientY,
    }

    if (
      Math.abs(panData.selectionX - this.lastRenderPos.selectionX) > sense ||
      Math.abs(panData.selectionY - this.lastRenderPos.selectionY) > sense
    ) {
      this.lastRenderPos = panData
    }

    return panData
  }

  public endDrag(_event: PointerEvent): PanData {
    return this.lastRenderPos
  }
}
