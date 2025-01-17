import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Booking } from './booking.model';
import { take, tap, delay, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
    bookedFrom: string;
    bookedTo: string;
    firstName: string;
    guestNumber: number;
    lastName: string;
    placeId: string;
    placeImage : string;
    placeTitle: string;
    userId: string;
    price: number;
}

@Injectable({providedIn: 'root'})
export class BookingService {
    private _bookings = new BehaviorSubject<Booking[]>([]);

    constructor(private authService: AuthService, private http: HttpClient){

    }

    get bookings(){
        return this._bookings.asObservable();
    }

    addBooking(
        placeId: string, 
        placeTitle: string, 
        placeImage: string, 
        firstName: string, 
        lastName: string, 
        guestNumber: number, 
        dateFrom: Date, 
        dateTo: Date){
        let generatedId: string;
        let newBooking: Booking;
        let fetchedUserId: string;
        return this.authService.userId.pipe(take(1), switchMap(userId => {
            if(!userId){
                throw new Error ('No user id found!');
            }
            fetchedUserId = userId;
            return this.authService.token;            
        }),
        take(1),
        switchMap(token => {
            newBooking = new Booking(
                Math.random().toString(),
                placeId,
                fetchedUserId,
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
                `https://ionic-angular-project-d88b4.firebaseio.com/bookings.json?auth=${token}`,
                {
                    ...newBooking,
                    id: null
                }
            )
        }),
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
        return this.authService.token.pipe(
            take(1),
            switchMap(token => {
                //Sends delete request
                return this.http.delete(`https://ionic-angular-project-d88b4.firebaseio.com/bookings/${bookingId}.json?auth=${token}`)
            }),
            switchMap(()=>{
                return this.bookings; //Delete list of bookings locally
            }),
            take(1),
            tap(bookings => {
                this._bookings.next(bookings.filter(b=> b.id!==bookingId));
            })
        );
    }

    fetchBooking(bookingId: string){
        return this.authService.token.pipe(
            take(1),
            switchMap( token => {
                return this.http.get<BookingData>(
                    `https://ionic-angular-project-d88b4.firebaseio.com/bookings/${bookingId}.json?&auth=${token}`
                )
            }),
            map( b => {
                return new Booking(
                    bookingId,
                    b.placeId,
                    b.userId,
                    b.placeTitle,
                    b.placeImage,
                    b.firstName,
                    b.lastName,
                    b.guestNumber,
                    new Date(b.bookedFrom),
                    new Date(b.bookedTo),
                )
            })
        );
    }

    fetchBookings(){   
        let fetchedUserId: string;
        return this.authService.userId.pipe(take(1), switchMap(userId => {
            if(!userId)
                throw new Error('User not found!');
            fetchedUserId = userId;

            return this.authService.token;
            
        }),
        take(1),
        switchMap(token => {
            return this.http.get<{[key: string] : BookingData}>(
                `https://ionic-angular-project-d88b4.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${fetchedUserId}"&auth=${token}`)
        }),
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
                            new Date(bookingData[key].bookedTo)
                        ))
                    }
                }
                return bookings;
            }),
            tap(bookings => {
                //Emits fetch as new list of bookings
                this._bookings.next(bookings);
            })
        );
    }
}