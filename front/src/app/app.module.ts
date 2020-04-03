import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductsComponent } from './products/products.component';
import { ModalComponent } from './modal/modal.component';


import { NotificationService } from './service/notification.service';
import { RestService } from './service/rest.service';

import { BigvaluePipe } from './pipe/bigvalue.pipe';
import { TimerPipe } from './pipe/timer.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ProductsComponent,
    BigvaluePipe,
    ModalComponent,
    TimerPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule, 
    NgbModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  providers: [RestService, NotificationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
