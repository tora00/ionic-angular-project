import { Component, OnDestroy, OnInit } from '@angular/core';

import { PlacesService } from '../places.service';
import { Place } from '../places.model';
import { AlertController, IonItemSliding, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit, OnDestroy {
  offers: Place[];
  isLoading = false;
  private placesSub: Subscription;

  constructor(
    private placesService: PlacesService, 
    private router: Router, 
    private alertCtrl: AlertController) { }

  ngOnInit() {
      this.placesSub = this.placesService.places.subscribe(places=>{
        this.offers=places;
      });
  }

  ngOnDestroy(){
    if(this.placesSub){
      this.placesSub.unsubscribe();
    }
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe( () => {
      this.isLoading = false;
    });
  }

  onEdit(offerId: string, slidingItem: IonItemSliding){
    slidingItem.close();
    this.router.navigate(['/','places','tabs','offers','edit',offerId]);
  }

  onDelete(offerId: string, slidingItem: IonItemSliding){    
    this.alertCtrl.create({
      header: 'Deleting Offer',
      message: 'Are you sure you want to delete this offer?',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.placesService.deletePlace(offerId).subscribe();
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
    });
  }

}
