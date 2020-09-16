import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Place } from './places.model';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PlaceLocation } from './location.model';
import { PlaceDetailPage } from './discover/place-detail/place-detail.page';

// [
//   new Place(
//     'p1',
//     'Manhattan Mansion', 
//     'In the heart of New York.',
//     'https://loveincorporated.blob.core.windows.net/contentimages/main/4616685d-18b0-4bcf-b5dd-24ffec6e7275-mansions-for-sale-with-secrets-3.jpg',
//     149.99,
//     new Date('2020-09-11'),
//     new Date('2020-12-31'),
//     'xyz'
//   ),
//   new Place(
//     'p2',
//     'L\'Amour Toujour', 
//     'Somewhere in France.',
//     'https://townsquare.media/site/204/files/2018/08/spectacular-celebrity-homes.jpg?w=980&q=75',
//     189.99,
//     new Date('2020-09-11'),
//     new Date('2020-12-31'),
//     'abc'
//   ),
//   new Place(
//     'p3',
//     'Casa di mama', 
//     'Fancy looking place.',
//     'https://thumbor.thedailymeal.com/slySP3HFrz6FEUp4xJRBYv-dxlc=//https://www.theactivetimes.com/sites/default/files/[current-date:custom:Y/m/d]/HERO_Mansions.jpg',
//     199.99,
//     new Date('2020-09-11'),
//     new Date('2020-12-31'),
//     'xyz'
//   )
// ]

interface PlaceData{
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation,
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]) ;

  get places(){
    return this._places.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient) { }

  fetchPlaces(){
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.get<{[key: string] : PlaceData}>(
          `https://ionic-angular-project-d88b4.firebaseio.com/offered-places.json?auth=${token}`
        )
      }),
      map(resData => {
          const places = [];
          for(const key in resData){
            if(resData.hasOwnProperty(key)){
              places.push(new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              ))
            }
          }
          return places;
          // return [];
        }),
        tap(places => {
          this._places.next(places);
        })
      )
  }

  getPlace(id: string){
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.get<PlaceData>(
          `https://ionic-angular-project-d88b4.firebaseio.com/offered-places/${id}.json?auth=${token}`
        )
      }),
      map(placeData => {
        return new Place(id, placeData.title, placeData. description, placeData.imageUrl, placeData.price, new Date(placeData.availableFrom), new Date(placeData.availableTo), placeData.userId, placeData.location);
      })
    )    
  }

  addPlace(
    title: string, 
    description: string, 
    price: number, 
    dateFrom: Date, 
    dateTo: Date, 
    location: PlaceLocation, 
    imageUrl: string)
  {
    let generatedId: string;
    let fetchedUserId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        if(!fetchedUserId){
          throw new Error ('No user found!');
        }
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          imageUrl,
          price,
          dateFrom,
          dateTo,
          fetchedUserId,
          location
          );
          return this.http.post<{name: string }>(
            `https://ionic-angular-project-d88b4.firebaseio.com/offered-places.json?auth=${token}`,
            {
              ...newPlace,
              id: null
            }
          )
      }),
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

  deletePlace(
    placeId: string
  ){
    return this.authService.token.pipe(
      take(1),
      switchMap( token => {
        return this.http.delete(
          `https://ionic-angular-project-d88b4.firebaseio.com/offered-places/${placeId}.json?auth=${token}`
        );
      }),
      switchMap( () => {
        return this.places;
      }),
      take(1),
      tap( places => {
        this._places.next(places.filter( p => p.id !== placeId));
      })
    );
  }

  updatePlace(
    placeId: string, 
    title: string, 
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation, 
    imageUrl: string
  ){
    let updatedPlaces: Place[];
    let fetchedToken: string;

    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        fetchedToken = token;
        return this.places;
      }),
      take(1),
      switchMap(places => {

        // Errors when updating a place when places is empty - call fetchPlaces to load the updated list of places first
        if(!places || places.length <= 0){
          return this.fetchPlaces();
        } else {
          return of(places);  // wraps 'places' with an observable
        }
      }),
      switchMap(places => {   // Places is guaranteed to have a list of places
        const updatedPlaceIndex = places.findIndex(pl => pl.id===placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id, 
          title, 
          description, 
          imageUrl, 
          price, 
          dateFrom, 
          dateTo, 
          oldPlace.id, 
          location);

        return this.http.put(
          `https://ionic-angular-project-d88b4.firebaseio.com/offered-places/${placeId}.json?auth=${fetchedToken}`,
          { ... updatedPlaces[updatedPlaceIndex]}
        );
      }),
      tap( () => {
        this._places.next(updatedPlaces)
      })
    );
  }

  uploadImage(image: File){
    const uploadData = new FormData();
    uploadData.append('image', image);

    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.post<{imageUrl: string, imagePath: string}>(
          'https://us-central1-ionic-angular-project-d88b4.cloudfunctions.net/storeImage',
          uploadData,
          {
            headers: {Authorization: 'Bearer ' + token}
          }
        )
      })
    )
  }
}
