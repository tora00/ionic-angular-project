import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';

import { PlacesService } from '../../places.service';

import { Place } from '../../places.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PlaceLocation } from '../../location.model';
import { switchMap } from 'rxjs/operators';

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss']
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  form: FormGroup;
  private placeSub: Subscription;
  isLoading = false;
  placeId: string;

  constructor(
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }
      this.placeId = paramMap.get('placeId');
      this.isLoading = true;
      this.placeSub = this.placesService.getPlace(paramMap.get('placeId')).subscribe(place => {
        this.place = place;
        this.form = new FormGroup({
          title: new FormControl(this.place.title, {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          description: new FormControl(this.place.description, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.maxLength(180)]
          }),
          price: new FormControl(this.place.price, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(1)]
          }),
          dateFrom: new FormControl(this.place.availableFrom.toISOString(), {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          dateTo: new FormControl(this.place.availableTo.toISOString(), {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          location: new FormControl(this.place.location.staticMapImageUrl, {
            validators: [Validators.required]
          }),
          image: new FormControl(this.place.imageUrl)
        });
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header:'An error ocurred!',
          message: 'Place could not be loaded. Please try again later.',
          buttons: [{
            text:'Okay',
            handler: () => {
              this.router.navigate(['/places/tabs/offers']);
            }
          }]
        }).then(alertEl => {
          alertEl.present();
        })
      });
    });
  }

  ngOnDestroy(){
    if(this.placeSub)
      this.placeSub.unsubscribe();
  }

  onUpdateOffer(){
    if(!this.form.valid)
      return;
    
    this.loadingCtrl.create({
      message: 'Updating place...'
    }).then(loadingEl => {
      loadingEl.present();

      this.placesService.uploadImage(this.form.get('image').value)
        .pipe(
          switchMap(uploadRes => {
            return this.placesService.updatePlace(
              this.place.id,
              this.form.value.title,
              this.form.value.description,
              +this.form.value.price,
              new Date(this.form.value.dateFrom),
              new Date(this.form.value.dateTo),
              this.form.value.location,
              uploadRes.imageUrl
            )
          })
        )
        .subscribe( () => {
        loadingEl.dismiss();
        this.form.reset();
        this.router.navigate(['/places/tabs/offers']);
      });
    })
    console.log(this.form);
  }

  onLocationPicked(location: PlaceLocation){
    this.form.patchValue({
      location: location
    });
  }

  onImagePicked(imageData: string | File){
    let imageFile;
    // Convert base 64 string to file
    if(typeof imageData === 'string'){
      try{
        imageFile = base64toBlob(imageData.replace('data:image/jpeg;base64,',''),'image/jpeg');
      }catch(e){
        console.log(e);
        return;
      }
    }
    else {
      imageFile = imageData;
    }

    this.form.patchValue({image:imageFile});
  }
}
