import {Injectable} from '@angular/core'
import {Selector, SelectionChange} from '@fbpx-ui/core'
import {Link, Node, Port} from '../models'
import {Subject, BehaviorSubject} from 'rxjs'

export interface PortSelection {
  type: 'input' | 'output'
  id: string
  port: Port
}

@Injectable()
export class SelectionManager {
  public readonly nodeSelector = new Selector<Node>()
  public readonly linkSelector = new Selector<Link>()
  public readonly portSelector = new Selector<PortSelection>()

  public lockAll() {
    this.nodeSelector.lock()
    this.linkSelector.lock()
    this.portSelector.lock()
  }

  public unlockAll() {
    this.nodeSelector.lock()
    this.linkSelector.lock()
    this.portSelector.lock()
  }

  public hasSelections() {
    return (
      this.nodeSelector.hasSelections() ||
      this.linkSelector.hasSelections() ||
      this.portSelector.hasSelections()
    )
  }

  public addDeselectArea(el: EventTarget): () => void {
    el.addEventListener('click', this.deselectAll)

    return () => el.removeEventListener('click', this.deselectAll)
  }

  public deselectAllHandler() {
    this.nodeSelector.deselectHandler()
    this.linkSelector.deselectHandler()
    this.portSelector.deselectHandler()
  }

  public get nodeSelection$(): BehaviorSubject<Node[]> {
    return this.nodeSelector.selection$
  }

  public get nodeChanges$(): Subject<SelectionChange<Node>> {
    return this.nodeSelector.changes$
  }

  public get linkSelection$(): BehaviorSubject<Link[]> {
    return this.linkSelector.selection$
  }

  public get linkChanges$(): Subject<SelectionChange<Link>> {
    return this.linkSelector.changes$
  }

  public get portSelection$(): BehaviorSubject<PortSelection[]> {
    return this.portSelector.selection$
  }

  public get portChanges$(): Subject<SelectionChange<PortSelection>> {
    return this.portSelector.changes$
  }

  public selectNode(data: Node, preserve: boolean): void {
    this.nodeSelector.select(data, preserve)
  }

  public deselectNode(id: string, preserve: boolean): void {
    this.nodeSelector.deselect(id, preserve)
  }

  public selectPort(
    type: 'input' | 'output',
    nodeId: string,
    port: Port,
    preserve: boolean
  ): void {
    this.portSelector.select({type, id: nodeId, port}, preserve)
  }

  public deselectPort(id: string, preserve: boolean): void {
    this.portSelector.deselect(id, preserve)
  }

  public selectLink(data: Link, preserve: boolean): void {
    this.linkSelector.select(data, preserve)
  }

  public deselectLink(id: string, preserve: boolean): void {
    this.linkSelector.deselect(id, preserve)
  }

  public deselectAll(): void {
    this.nodeSelector.deselectAll()
    this.linkSelector.deselectAll()
    this.portSelector.deselectAll()
  }
}
