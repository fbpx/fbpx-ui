import {BehaviorSubject, Subject} from 'rxjs'

export interface WithId {
  id?: string
}

export interface SelectionChange<T> {
  type: 'select' | 'deselect'
  data: T
  preserve: boolean
}

export class Selector<T extends WithId> {
  public selection$ = new BehaviorSubject<T[]>([])
  public changes$ = new Subject<SelectionChange<T>>()
  private isLocked: boolean = false

  public lock(): void {
    this.isLocked = true
  }

  public unlock(): void {
    this.isLocked = false
  }

  public getSelected(): T[] {
    return this.selection$.getValue()
  }

  public hasSelections(): number {
    return this.selection$.getValue().length
  }

  public toggleSelection(id: string, data: T, preserve = false): void {
    if (!preserve) {
      this.deselectAll()
    }

    const index = this.selection$.getValue().findIndex(item => item.id === id)

    if (index >= 0) {
      this.deselect(id, preserve)
    } else {
      this.select(data, preserve)
    }
  }

  public select(data: T, preserve: boolean) {
    this.selection$.next([...this.selection$.getValue(), data])
    console.log('select port?')
    this.changes$.next({
      type: 'select',
      data,
      preserve,
    })
  }

  public deselect(id: string, preserve: boolean) {
    const currentSelection = this.getSelected()

    let deselectIndex: number
    for (const [index, selected] of currentSelection.entries()) {
      if (selected.id === id) {
        deselectIndex = index

        break
      }
    }

    if (deselectIndex) {
      const [data] = currentSelection.splice(deselectIndex)

      this.changes$.next({
        type: 'deselect',
        data,
        preserve,
      })
    }

    this.selection$.next(currentSelection)
  }

  public deselectAll() {
    const currentSelection = this.getSelected()

    for (const selected of currentSelection) {
      this.deselect(selected.id, false)
    }
  }

  public addDeselectArea(el: EventTarget): () => void {
    el.addEventListener('click', this.deselectHandler)

    return () => el.removeEventListener('click', this.deselectHandler)
  }

  public deselectHandler = () => {
    if (!this.isLocked) {
      this.deselectAll()
    }
  }
}
