export interface DragData {
  x: number
  y: number
  movementX?: number
  movementY?: number
}

export abstract class DragStrategy<T> {
  public abstract onStartDrag(event: PointerEvent): T
  public abstract onDragging(event: PointerEvent): Promise<T>
  public abstract endDrag(event: PointerEvent): T
  public configure(_settings: DragSettings): void {}
  public onInitDrag(event: PointerEvent): void {}
}

export interface Position {
  x: number
  y: number
}

export class DragSettings {
  public dragScale: number
}
