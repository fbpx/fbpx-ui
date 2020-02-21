export interface DragData {
  x: number
  y: number
  movementX?: number
  movementY?: number
}

export abstract class DragStrategy<T> {
  public abstract onStartDrag(event: MouseEvent): T
  public abstract onDragging(event: MouseEvent): Promise<T>
  public abstract endDrag(event: MouseEvent): T
  public configure(_settings: DragSettings): void {}
  public onInitDrag(event: MouseEvent): void {}
}

export interface Position {
  x: number
  y: number
}

export class DragSettings {
  public dragScale: number
}
