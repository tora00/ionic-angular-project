import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BookingsPage } from './bookings.page';

const routes: Routes = [
  {
    path: '',
    component: BookingsPage
  },
  {
    path: 'booking-detail',
    children: [
      {
        path: '',
        loadChildren: () => import('./booking-detail/booking-detail.module').then( m => m.BookingDetailPageModule)
      },
      {
        path: ':bookingId',
        loadChildren: () => import('./booking-detail/booking-detail.module').then( m => m.BookingDetailPageModule)
      }
    ]
    
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookingsPageRoutingModule {}
