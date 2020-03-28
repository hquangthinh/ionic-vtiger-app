import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController, Loading, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { STORAGE_KEYS } from '../providers/configuration-service';
import { LoginPage } from '../pages/login-page/login-page';

@Component({
  selector: 'base-page',
  template: ``
})
export class BasePage {

    constructor(
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public translate: TranslateService
    )
    {
        this.menuCtrl.enable(true);
    }

    public showUIMessage(msg: any): Promise<any> {
        let alert = this.alertCtrl.create({
            title: 'Info',
            subTitle: msg,
            buttons: ['OK']
        });
        return alert.present();
    }

    public showUIError(err: any): Promise<any> {
      let alert = this.alertCtrl.create({
          title: 'Error',
          subTitle: err,
          buttons: ['OK']
      });
      return alert.present();
    }

    public showConsoleError(err: any) {
        console.log(err);
    }

    public signOut(storage: Storage) {
        let p1 = storage.remove(STORAGE_KEYS.loginStateKey);
        let p2 = storage.remove(STORAGE_KEYS.userLoginToken);
        let p3 = storage.remove(STORAGE_KEYS.userSessionId);

        Promise.all([p1, p2, p3]).then(
            () => this.navCtrl.setRoot(LoginPage)
        );
    }

    protected getInstantLocalizedText(key: string): string {
        return this.translate.instant(key);
    }

    protected createLoading(msg?: string): Loading {

        let pleaseWaitText = this.getInstantLocalizedText('shared.Please_wait');

        let loader = this.loadingCtrl.create({
            content: msg || pleaseWaitText,
            dismissOnPageChange: false
        });
        return loader;
    }

    protected showToastMessage(msg: string): Promise<any> {
        let toast = this.toastCtrl.create({
            message: msg,
            duration: 3000,
            position: 'top'
        });
        return toast.present();
    }
}
