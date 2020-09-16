import { Component, OnDestroy, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
// import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';

import { Plugins, Capacitor, AppState } from '@capacitor/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private authSub: Subscription;
  private previousAuthState = false;

  constructor(
    private platform: Platform,
    // private splashScreen: SplashScreen,
    // private statusBar: StatusBar,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      // this.splashScreen.hide();
      if(Capacitor.isPluginAvailable('SplashScreen')){
        Plugins.SplashScreen.hide();
      }
    });
  }

  onLogOut(){
    this.authService.logout();
    //this.router.navigateByUrl('/auth');
  }

  ngOnInit(){
    this.authSub = this.authService.userIsAuthenticated.subscribe(isAuth => {
      if(!isAuth && this.previousAuthState !== isAuth)
        this.router.navigateByUrl('/auth');
      this.previousAuthState = isAuth;
    });
    Plugins.App.addListener('appStateChange',this.checkAuthOnResume.bind(this))
  }

  ngOnDestroy(){
    if(this.authSub){
      this.authSub.unsubscribe();
    }
  }

  private checkAuthOnResume(state: AppState) {
    if (state.isActive) {
      this.authService
        .autoLogin()
        .pipe(take(1))
        .subscribe(success => {
          if (!success) {
            this.onLogOut();
          }
        });
    }
  }
}
