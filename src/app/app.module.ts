import {BrowserModule} from '@angular/platform-browser'
import {NgModule} from '@angular/core'

import {FlexLayoutModule} from '@angular/flex-layout'

import {AppComponent} from './app.component'
import {GraphModule} from '@fbpx-ui/graph'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, GraphModule, FlexLayoutModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
