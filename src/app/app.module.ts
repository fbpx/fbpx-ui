import {BrowserModule} from '@angular/platform-browser'
import {NgModule} from '@angular/core'
import {FlexLayoutModule} from '@angular/flex-layout'
import {AppComponent} from './app.component'
import {GraphModule} from '@fbpx-ui/graph'
import {NgbModule} from '@ng-bootstrap/ng-bootstrap'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, GraphModule, FlexLayoutModule, NgbModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
