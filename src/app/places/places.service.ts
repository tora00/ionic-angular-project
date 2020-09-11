import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Place } from './places.model';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([
    new Place(
      'p1',
      'Manhattan Mansion', 
      'In the heart of New York.',
      'https://loveincorporated.blob.core.windows.net/contentimages/main/4616685d-18b0-4bcf-b5dd-24ffec6e7275-mansions-for-sale-with-secrets-3.jpg',
      149.99,
      new Date('2020-09-11'),
      new Date('2020-12-31'),
      'xyz'
    ),
    new Place(
      'p2',
      'L\'Amour Toujour', 
      'Somewhere in France.',
      'https://townsquare.media/site/204/files/2018/08/spectacular-celebrity-homes.jpg?w=980&q=75',
      189.99,
      new Date('2020-09-11'),
      new Date('2020-12-31'),
      'abc'
    ),
    new Place(
      'p3',
      'Casa di mama', 
      'Fancy looking place.',
      'https://thumbor.thedailymeal.com/slySP3HFrz6FEUp4xJRBYv-dxlc=//https://www.theactivetimes.com/sites/default/files/[current-date:custom:Y/m/d]/HERO_Mansions.jpg',
      199.99,
      new Date('2020-09-11'),
      new Date('2020-12-31'),
      'xyz'
    )
  ]) ;

  get places(){
    return this._places.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient) { }

  getPlace(id: string){
    return this.places.pipe(take(1), map(places=>{
      return {...places.find(
        p => p.id === id
      )}
    })
    );
    
  }

  addPlace(title: string, description: string, price: number, dateFrom: Date, dateTo: Date){
    let generatedId: string;
    const newPlace = new Place(
      Math.random().toString(),
      title,
      description,
      'https://thumbor.thedailymeal.com/slySP3HFrz6FEUp4xJRBYv-dxlc=//https://www.theactivetimes.com/sites/default/files/[current-date:custom:Y/m/d]/HERO_Mansions.jpg',
      price,
      dateFrom,
      dateTo,
      this.authService.userId
      );
      return this.http.post<{name: string }>('https://ionic-angular-project-d88b4.firebaseio.com/offered-places.json',
        {
          ...newPlace,
          id: null
        }
      ).pipe(
        switchMap(resData => {
          generatedId = resData.name;
          return this.places;
        }),
        take(1),
        tap( places => {
          newPlace.id = generatedId;
          this._places.next(places.concat(newPlace));
        }
      ));
      // return this.places.pipe(take(1), delay(1000), tap( places => {
      //   this._places.next(places.concat(newPlace));
      // }));
  }

  updatePlace(placeId: string, title: string, description: string){
    return this.places.pipe(take(1), delay(1000), tap(places=>{
      const updatedPlaceIndex = places.findIndex(pl => pl.id===placeId);
      const updatedPlaces = [...places];
      const oldPlace = updatedPlaces[updatedPlaceIndex];
      updatedPlaces[updatedPlaceIndex] = new Place(oldPlace.id, title, description, oldPlace.imageUrl, oldPlace.price, oldPlace.availableFrom, oldPlace.availableTo, oldPlace.id);
      this._places.next(updatedPlaces);}))
  }
}
