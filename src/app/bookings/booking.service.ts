import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Booking } from './booking.model';
import { take, tap, delay, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
    bookedFrom: string;
    bookedto: string;
    firstName: string;
    guestNumber: number;
    lastName: string;
    placeId: string;
    placeImage : string;
    placeTitle: string;
    userId: string;
}

@Injectable({providedIn: 'root'})
export class BookingService {
    private _bookings = new BehaviorSubject<Booking[]>([]);

    constructor(private authService: AuthService, private http: HttpClient){

    }

    get bookings(){
        return this._bookings.asObservable();
    }

    addBooking(placeId: string, placeTitle: string, placeImage: string, firstName: string, lastName: string, guestNumber: number, dateFrom: Date, dateTo: Date){
        let generatedId: string;
        const newBooking = new Booking(
            Math.random().toString(),
            placeId,
            this.authService.userId,
            placeTitle,
            placeImage,
            firstName,
            lastName,
            guestNumber,
            dateFrom,
            dateTo
        );
        
        // Sends POST request to add booking
        // Store data we get back to "name" field
        // Return observable chain for subscription
        return this.http.post<{name: string}>(
            'https://ionic-angular-project-d88b4.firebaseio.com/bookings.json',
            {
                ...newBooking,
                id: null
            }
        )
        .pipe(
            switchMap(resData => {
                generatedId = resData.name;
                return this.bookings;
            }),
            take(1),            
            tap(bookings => {
                newBooking.id=generatedId;
                this._bookings.next(bookings.concat(newBooking));
            })
        )
    }

    cancelBooking(bookingId: string){

        //Sends delete request
        return this.http.delete(`https://ionic-angular-project-d88b4.firebaseio.com/bookings/${bookingId}.json`)
        .pipe(
            switchMap(()=>{
                return this.bookings; //Delete list of bookings locally
            }),
            take(1),
            tap(bookings => {
                this._bookings.next(bookings.filter(b=> b.id!==bookingId));
            })
        );

        // return this.bookings.pipe(
        //     take(1), 
        //     delay(1000), 
        //     tap(bookings => {
        //     this._bookings.next(bookings.filter(b=> b.id!==bookingId));
        //     })
        // );
    }

    fetchBookings(){
        //Fetch orders for currently logged in user
        return this.http.get<{[key: string] : BookingData}>(`https://ionic-angular-project-d88b4.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${this.authService.userId}"`)
        .pipe(
            map(bookingData => {
                const bookings = [];
                for(const key in bookingData){
                    if(bookingData.hasOwnProperty(key)){
                        bookings.push(new Booking(
                            key,
                            bookingData[key].placeId,
                            bookingData[key].userId,
                            bookingData[key].placeTitle,
                            bookingData[key].placeImage,
                            bookingData[key].firstName,
                            bookingData[key].lastName,
                            bookingData[key].guestNumber,
                            new Date(bookingData[key].bookedFrom),
                            new Date(bookingData[key].bookedto)
                        ))
                    }
                }
                return bookings;
            }),
            tap(bookings => {
                //Emits fetch as new list of bookings
                this._bookings.next(bookings);
            })
        )
    }
}