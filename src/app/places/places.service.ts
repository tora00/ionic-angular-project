import { Injectable } from '@angular/core';
import { Place } from './places.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places: Place[] = [
    new Place(
      'p1',
      'Manhattan Mansion', 
      'In the heart of New York.',
      'https://loveincorporated.blob.core.windows.net/contentimages/main/4616685d-18b0-4bcf-b5dd-24ffec6e7275-mansions-for-sale-with-secrets-3.jpg',
      149.99
    ),
    new Place(
      'p2',
      'L\'Amour Toujour', 
      'Somewhere in France.',
      'https://townsquare.media/site/204/files/2018/08/spectacular-celebrity-homes.jpg?w=980&q=75',
      189.99
    ),
    new Place(
      'p2',
      'Casa di mama', 
      'Fancy looking place.',
      'https://thumbor.thedailymeal.com/slySP3HFrz6FEUp4xJRBYv-dxlc=//https://www.theactivetimes.com/sites/default/files/[current-date:custom:Y/m/d]/HERO_Mansions.jpg',
      199.99
    )
  ];

  get places(){
    return [...this._places];
  }

  constructor() { }

  getPlace(id: string){
    return {...this._places.find(
      p => p.id === id
    )}
  }
}
