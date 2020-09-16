import { Component, OnDestroy, OnInit } from '@angular/core';
import { BookingService } from './booking.service';
import { Booking } from './booking.model';
import { AlertController, IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  private bookingSub: Subscription;
  isLoading = false;

  constructor(
    private bookingService: BookingService, 
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController) { }

  ngOnInit() {
    this.bookingSub = this.bookingService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
    });
  }

  ngOnDestroy(){
    if(this.bookingSub)
      this.bookingSub.unsubscribe();
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.bookingService.fetchBookings().subscribe( () => {
      this.isLoading = false;
    });

  }

  onCancelBooking(bookingId: string, slidingEl: IonItemSliding){
    this.alertCtrl.create({
      header: 'Booking Cancellation',
      message: 'Are you sure you want to cancel this booking?',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.bookingService.cancelBooking(bookingId).subscribe();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            slidingEl.close();
          }
        }
      ]
    }).then(alertel => {
      alertel.present();
    })    
  }
}
