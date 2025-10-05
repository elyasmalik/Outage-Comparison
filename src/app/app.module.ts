import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { ExcelImportComponent } from './components/excel-import/excel-import.component';
import { OutageTableComponent } from './components/outage-table/outage-table.component';
import { SiteFilterComponent } from './components/site-filter/site-filter.component';
import { OutagePageComponent } from './outage-page/outage-page.component';

@NgModule({
  declarations: [
    AppComponent,
    ExcelImportComponent,
    OutageTableComponent, // ✅ must be declared
    SiteFilterComponent,
    OutagePageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
