import {Directive, ElementRef, Input, OnDestroy, OnInit} from '@angular/core'
import {eventSink} from './util'

@Directive({
  selector: '[stopEventPropagation]',
})
export class StopEventPropagationDirective implements OnInit, OnDestroy {
  public off
  @Input('stopEventPropagation') public events: string[] = [
    'click',
    'contextmenu',
    'dblclick',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseover',
    'mouseout',
    'mouseup',
    'pointerdown',
    'pointerenter',
    'pointerleave',
    'pointermove',
    'pointerover',
    'pointerout',
    'pointerup',
    'keydown',
    'keypress',
    'keyup',
    'blur',
    'change',
    'focus',
    'focusin',
    'focusout',
    'input',
    'invalid',
    'reset',
    'search',
    'select',
    'submit',
    'drag',
    'dragend',
    'dragenter',
    'dragleave',
    'dragover',
    'dragstart',
    'drop',
    'copy',
    'cut',
    'paste',
    'mousewheel',
    'wheel',
    'touchcancel',
    'touchend',
    'touchmove',
    'touchstart',
  ]

  constructor(private elementRef: ElementRef) {}

  public ngOnInit() {
    this.off = eventSink(this.elementRef.nativeElement, this.events)
  }

  public ngOnDestroy() {
    this.off()
  }
}
