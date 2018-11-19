import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { BasePage } from './base-page';
import { DashboardPage } from './dashboard/dashboard';
import { SettingPage } from './setting/setting';
import { DataSyncInfoDto } from '../model/shared-dto';
// import { UserService } from '../providers/user-service';
// import { DataSyncService } from '../providers/data-sync-service';
import { STORAGE_KEYS } from '../providers/configuration-service';

@Component({
  selector: 'sync-modules-page',
  template: `<ion-header>
                <ion-navbar>
                    <button ion-button menuToggle>
                    <ion-icon name="menu"></ion-icon>
                    </button>
                    <ion-title>Sync data for offline</ion-title>
                </ion-navbar>
            </ion-header>
            <ion-content padding>
            </ion-content>`
})
export class SyncModulesPage extends BasePage {

    CACHE_DATA_EXPIRED_DURATION: Number = 30;

    constructor(
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public translate: TranslateService,
        public storage: Storage
    ){
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    }

    ionViewDidLoad() {

        this.storage.get(STORAGE_KEYS.autoRunSyncAfterLogin).then(
            autoRunSync => {
                if(autoRunSync === null || autoRunSync)
                {
                    this.navCtrl.setRoot(SettingPage, { autoRunSync: true });
                }
                else
                {
                    this.navCtrl.setRoot(DashboardPage);
                }
            }
        );
    }

    private needDataSyncRun(dataSyncInfo: DataSyncInfoDto): Boolean{
        if(dataSyncInfo === null || dataSyncInfo === undefined)
            return true;

        let lastSyncRun = new Date(dataSyncInfo.lastSyncDateTime);
        let now = new Date();
        let dateDiff = now.getTime() - lastSyncRun.getTime();
        let dayInMs = 24 * 60 * 60 * 1000;
        if(dateDiff / dayInMs > this.CACHE_DATA_EXPIRED_DURATION) {
            console.log('sync data is our of to date');
            return true;
        }
        console.log('sync data is up to date');
        return false;
    }

    private performSyncDataForOffline(dataSyncInfo: DataSyncInfoDto){
        console.log('performSyncDataForOffline');
        let loader = this.loadingCtrl.create({
            content: 'Setup data for offline access...'
        });
        loader.present();
    }
}
