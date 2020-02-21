import {DragStrategy} from './types'

export interface PanData {
  selectionX: number
  selectionY: number
  movementX: number
  movementY: number
}

const sense = 1 // 3

export class PanDragStrategy extends DragStrategy<PanData> {
  private lastRenderPos: PanData

  public onStartDrag(_event: MouseEvent): PanData {
    this.lastRenderPos = {
      selectionX: 0,
      selectionY: 0,
      movementX: 0,
      movementY: 0,
    }

    return this.lastRenderPos
  }

  public async onDragging(event: MouseEvent): Promise<PanData> {
    const panData: PanData = {
      selectionX: this.lastRenderPos.selectionX + event.movementX,
      selectionY: this.lastRenderPos.selectionY + event.movementY,
      movementX: event.movementX,
      movementY: event.movementY,
    }

    if (
      Math.abs(panData.selectionX - this.lastRenderPos.selectionX) > sense ||
      Math.abs(panData.selectionY - this.lastRenderPos.selectionY) > sense
    ) {
      this.lastRenderPos = panData
    }

    return panData
  }

  public endDrag(_event: MouseEvent): PanData {
    return this.lastRenderPos
  }
}
