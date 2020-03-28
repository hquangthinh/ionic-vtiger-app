import { Component } from '@angular/core';
import { Nav, ActionSheetController } from 'ionic-angular';
import { Camera } from '@ionic-native/camera';

//import { LoginPage } from '../login-page/login-page';
import { DashboardPage } from '../dashboard/dashboard';
//import { ContactPage } from '../contact/contact';
//import { AccountPage } from '../account/account';
//import { PotentialPage } from '../potential/potential';
//import { SettingPage } from '../setting/setting';
import { MyAlertPage } from '../alert/my-alert';
import { MyCalendarPage } from '../calendar/my-calendar';
//import { MyTaskPage } from '../task/my-task';
import { ScanBusinessCardPage } from '../scan-business-card/scan-business-card-page';

// quick access to test pages
//import { ViewContactDetailPage } from '../contact/view-contact-detail';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  dashboardPage: any = DashboardPage; // ViewContactDetailPage
  alertPage: any = MyAlertPage;
  calendarPage: any = MyCalendarPage;

  private imageSrc: string;
  private base64Image: string;

  constructor(
    public nav: Nav, 
    public camera: Camera,
    public actionSheetCtrl: ActionSheetController) {

  }

  quickAdd() {
    console.log('quick add from tab page');
  }

  scanBusinessCard() {
    //console.log('scanBusinessCard from tab page');
    this.presentScanCardActionSheet();
  }

  presentScanCardActionSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Scan business card',
      buttons: [
        {
          text: 'Test Scan',
          handler: () => {
            this.nav.push(ScanBusinessCardPage, { imageSrc: "assets/images/biz-card-en-1.jpg" });
          }
        },
        {
          text: 'Use Gallery',
          handler: () => {
            this.openGallery();
          }
        },
        {
          text: 'Use Camera',
          handler: () => {
            this.takePhoto();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
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
        this.nav.push(ScanBusinessCardPage, { imageType: "DATA_URL", base64Image: this.base64Image});

    }, (err) => {
        console.log(err);
    });
  }
}
