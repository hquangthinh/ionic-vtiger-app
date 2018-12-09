import {Observable} from 'rxjs';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, ActionSheetController, Menu } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Camera } from '@ionic-native/camera';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';

import { STORAGE_KEYS } from '../providers/configuration-service';

import { LoginPage } from '../pages/login-page/login-page';
import { DashboardPage } from '../pages/dashboard/dashboard';
//import { TabsPage } from '../pages/tabs/tabs';
import { ContactPage } from '../pages/contact/contact';
import { AccountPage } from '../pages/account/account';
import { PotentialPage } from '../pages/potential/potential';
import { SettingPage } from '../pages/setting/setting';
import { MyAlertListPage } from '../pages/alert/my-alert-list';
import { MyCalendarPage } from '../pages/calendar/my-calendar';
// import { MyTaskPage } from '../pages/task/my-task';
import { ScanBusinessCardPage } from '../pages/scan-business-card/scan-business-card-page';

import { UserService } from '../providers/user-service';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  @ViewChild(Nav) nav: Nav;
  @ViewChild(Menu) menu: Menu;

  rootPage: any = LoginPage;
  language: string = "en";
  pages: Array<{ titleKey: string, title: string, icon: string, component: any }>;
  currentUserName: string;

  private imageSrc: string;
  private base64Image: string;


  constructor(
      public platform: Platform,
      public actionSheetCtrl: ActionSheetController,
      public userService: UserService,
      public storage: Storage,
      public statusBar: StatusBar,
      public splashScreen: SplashScreen,
      public camera: Camera,
      public translate: TranslateService) {

    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { titleKey: 'Menu.Dashboard', title: 'Dashboard', icon: 'apps', component: DashboardPage },
      { titleKey: 'Menu.Alerts', title: 'Alerts', icon: 'alert', component: MyAlertListPage },
      { titleKey: 'Menu.Today_Calendar', title: "Today's Calendar", icon: 'calendar', component: MyCalendarPage },
      { titleKey: 'Menu.Contacts', title: 'Contacts', icon: 'contacts', component: ContactPage },
      { titleKey: 'Menu.Accounts', title: 'Accounts', icon: 'office', component: AccountPage },
      { titleKey: 'Menu.Potentials', title: 'Potentials', icon: 'logo-usd', component: PotentialPage },
      { titleKey: 'Menu.Settings', title: 'Settings', icon: 'settings', component: SettingPage }
    ];

    this.userService.getCurrentUserSessionId().then(
      sessionDto => {
        //console.log('sessionDto: ', sessionDto);
        this.currentUserName = sessionDto ? sessionDto.userName : '';
      }
    );
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      if (this.splashScreen) {
        setTimeout(() => {
            this.splashScreen.hide();
        }, 100);
      }
      this.initializeTranslateServiceConfig();
    });
  }

  private initializeTranslateServiceConfig() {
    let defaultLang = 'vi';
    let userLang = defaultLang;
    this.storage.get(STORAGE_KEYS.currentLanguage).then(
        lang => {
          userLang = lang ? lang : defaultLang;
          this.translate.setDefaultLang(defaultLang);
          this.translate.use(userLang);
        }
      );
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  openTab(tabPage) {
    if(tabPage != null){
      this.nav.setRoot(tabPage);
    }
  }

  signOut() {
    let p1 = this.storage.remove(STORAGE_KEYS.loginStateKey);
    let p2 = this.storage.remove(STORAGE_KEYS.userLoginToken);
    let p3 = this.storage.remove(STORAGE_KEYS.userSessionId);
    Promise.all([p1, p2, p3]).then(
        () => this.nav.setRoot(LoginPage)
    );
  }

  scanBusinessCard() {
    this.presentScanCardActionSheet();
  }

  getLocalizedText(keys: Array<string>): Observable<any> {
    return this.translate.get(keys);
  }

  presentScanCardActionSheet() {
    this.getLocalizedText([
      'shared.Scan_business_card',
      'shared.Test_Scan',
      'shared.Use_Gallery',
      'shared.Use_Camera',
      'shared.Cancel'
    ])
    .subscribe(localizedText => {

      //console.log('localizedText :: ', localizedText);

      let actionSheet = this.actionSheetCtrl.create({
          title: localizedText['shared.Scan_business_card'],
          buttons: [
            {
              text: localizedText['shared.Test_Scan'],
              handler: () => {
                this.nav.push(ScanBusinessCardPage, { imageSrc: "assets/images/biz-card-en-1.jpg" });
              }
            },
            {
              text: localizedText['shared.Use_Gallery'],
              handler: () => {
                this.openGallery();
              }
            },
            {
              text: localizedText['shared.Use_Camera'],
              handler: () => {
                this.takePhoto();
              }
            },
            {
              text: localizedText['shared.Cancel'],
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
              }
            }
          ]
        });
        actionSheet.present();
    });
  }

  private openGallery() {
    let cameraOptions = {
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      destinationType: this.camera.DestinationType.FILE_URI,
      quality: 100,
      targetWidth: 1000,
      targetHeight: 1000,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true
    }

    this.camera.getPicture(cameraOptions)
      .then(file_uri => {
        this.imageSrc = file_uri;
        this.nav.push(ScanBusinessCardPage, { imageType: "FILE_URI", imageSrc: this.imageSrc});
      },
      err => console.log(err));
  }

  private takePhoto() {
    this.camera.getPicture({
        destinationType: this.camera.DestinationType.DATA_URL,
        targetWidth: 1000,
        targetHeight: 1000
    }).then((imageData) => {
        // imageData is a base64 encoded string
        this.base64Image = "data:image/jpeg;base64," + imageData;
        this.nav.push(ScanBusinessCardPage, { imageType: "DATA_URL", base64Image: this.base64Image, rawImageDataBase64: imageData});

    }, (err) => {
        console.log(err);
    });
  }
}
