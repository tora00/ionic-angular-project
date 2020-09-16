import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonItemSliding, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { Booking } from '../booking.model';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./booking-detail.page.scss'],
})
export class BookingDetailPage implements OnInit, OnDestroy {
  booking: Booking;
  isLoading = false;
  private placeSub: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private authService: AuthService,
    private bookingService: BookingService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.placeSub = this.route.paramMap.subscribe( paramMap => {
      if(!paramMap.has('bookingId')){
        this.navCtrl.navigateBack('/bookings');
        return;
      }
      this.isLoading = true;
      let fetchedUserId: string;
      this.authService.userId.pipe(
        take(1),
        switchMap( userId=> {
          if(!userId)
            throw new Error('Found no user!');
          fetchedUserId = userId;
          return this.bookingService.fetchBooking(paramMap.get('bookingId'))
        })
      )
      .subscribe( booking => {
        this.booking = booking;
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header: 'An error occured',
          message: 'Could not load booking',
          buttons: [
            {
              text: 'Okay',
              handler: () => {
                this.router.navigate(['/bookings']);
              }
            }
          ]
        }).then(alertEl => alertEl.present());
      })
    })
  }

  ngOnDestroy(){
    if(this.placeSub)
      this.placeSub.unsubscribe();
  }

  onCancelBooking(bookingId: string){
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
          role: 'cancel'
        }
      ]
    })
    .then(alertEl => {
      alertEl.present();
    })
  }

}
