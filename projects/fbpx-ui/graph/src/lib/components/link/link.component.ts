import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core'
import {Link, RenderLink} from '../graph/models'
import {throttle, Cancelable} from 'lodash'
import {createBoundingBox, createEdgePath, BoundingBox} from './util'

export interface LinkEvent {
  link: Link
  linkComponent: LinkComponent
  element: HTMLElement
  event: MouseEvent
}

@Component({
  selector: 'g[fbpx-graph-link]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  template: `
    <svg:path
      [ngClass]="linkClasses"
      stroke="silver"
      fill="transparent"
      (click)="onClick($event)"
      [attr.stroke-width]="link.strokeWidth || 12"
      [attr.d]="d"
    />
  `,
  styles: [
    `
      :host {
        border: 1px solid transparent;
        position: absolute;
      }
    `,
  ],
})
export class LinkComponent implements OnChanges {
  public get linkClasses() {
    const classes = {
      error: false,
      edge: true,
      active: this.active,
      selected: this.selected,
      persist: this.persist,
    }

    return classes
  }

  get d() {
    return createEdgePath(
      this.boundingBox.leftX,
      this.boundingBox.leftY,
      this.boundingBox.rightX,
      this.boundingBox.rightY
    )
  }

  @HostBinding('attr.transform')
  get translate() {
    return `translate(${this.boundingBox.transformX}, ${this.boundingBox.transformY})`
  }

  @HostBinding('attr.width')
  get width() {
    return `${this.boundingBox.width}px`
  }

  @HostBinding('attr.height')
  get height() {
    return `${this.boundingBox.height}px`
  }
  @Input() public link: RenderLink // only used as reference during active data
  @Input() public selected: boolean = false
  @Input() public persist: boolean = false
  @Input() public active: boolean = false
  @Output() public onLinkSelection = new EventEmitter<LinkEvent>()

  public boundingBox: BoundingBox
  public activate: (() => void) & Cancelable
  public deactivate: (() => void) & Cancelable

  constructor(private elementRef: ElementRef) {
    this.activate = throttle(this._activate, 300, {trailing: false})
    this.deactivate = throttle(this._deactivate, 300, {leading: false})
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.boundingBox = createBoundingBox(
      {
        x: this.link.sourceX,
        y: this.link.sourceY,
      },

      {
        x: this.link.targetX,
        y: this.link.targetY,
      },
      (this.link.strokeWidth || 12) / 2
    )
  }

  public onClick(event: MouseEvent) {
    event.stopPropagation()

    this.onLinkSelection.emit({
      link: this.link,
      linkComponent: this,
      element: this.elementRef.nativeElement.firstChild,
      event,
    })
  }

  private _activate = () => {
    if (!this.active) {
      requestAnimationFrame(() =>
        this.elementRef.nativeElement.firstChild.classList.add('active')
      )
    }
    this.active = true
  }

  private _deactivate = () => {
    if (this.active) {
      requestAnimationFrame(() =>
        this.elementRef.nativeElement.firstChild.classList.remove('active')
      )
    }
    this.active = false
  }
}
