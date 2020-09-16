import { Component, OnInit } from '@angular/core';
import { AuthResponseData, AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLoggedIn = true;
  constructor(private authService: AuthService, private router:Router, private loadingCtrl: LoadingController,
    private alertCtrl: AlertController) { }

  ngOnInit() {
  }


  authenticate(email: string, password: string){
    this.isLoading = true;
    this.loadingCtrl
    .create({
      keyboardClose: true,
      message: 'Logging in...'
    })
    .then(loadingEl => {
      loadingEl.present();

      let authObs: Observable<AuthResponseData>;

      if(this.isLoggedIn){
        authObs = this.authService.login(email,password);
      }
      else{
        authObs = this.authService.signup(email, password);
      }
      authObs.subscribe(resData => {
          this.isLoading = false;
          loadingEl.dismiss();
          this.router.navigateByUrl('/places/tabs/discover');
      },
      errRes => {
        loadingEl.dismiss();
        const code = errRes.error.error.message;
        let message ='Could not create new user, please try again.';
        if(code === 'EMAIL_EXISTS'){
          message = 'This email address already exists'; 
        }
        else if(code === 'EMAIL_NOT_FOUND'){
          message ='Email address could not be found';
        }
        else if(code === 'INVALID_PASSWORD'){
          message = 'Invalid login information'
        }
        this.showAlert(message);
      });
    });    
  }

  onSubmit(form: NgForm){
    if(!form.valid)
      return;
    
    const email = form.value.email;
    const password = form.value.password;
    this.authenticate(email, password);
    form.reset();
  }

  onSwitchAuthMode(){
    this.isLoggedIn = !this.isLoggedIn;
  }

  private showAlert(message: string){
    this.alertCtrl.create({
      header: 'Authentication failed',
      message: message,
      buttons: [
        'Okay'
      ]
    })
    .then(alertEl => {
      alertEl.present()
    });
  }
}
