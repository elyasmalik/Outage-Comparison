import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OutagePageComponent } from './outage-page/outage-page.component';

const routes: Routes = [
  { path: 'outage', component: OutagePageComponent },
  { path: '', redirectTo: '/outage', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
