import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, MenuController, ToastController } from 'ionic-angular';
// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import 'rxjs/Rx';
// import {Http, Headers, URLSearchParams, Response } from '@angular/http';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
// import { UserLoginSessionDto } from '../../model/login-dto';
import { DataSyncInfoDto } from '../../model/shared-dto';
import { UserService } from '../../providers/user-service';
import { ModuleService } from '../../providers/module-service';
import { DataSyncService } from '../../providers/data-sync-service';
import { STORAGE_KEYS } from '../../providers/configuration-service';
import { DashboardPage } from '../dashboard/dashboard';

import { BasePage } from '../base-page';

@Component({
  selector: 'page-setting',
  templateUrl: 'setting.html'
})
export class SettingPage extends BasePage {

    private lastRun: Date;
    private syncMessage: string;
    private appLanguage: string;
    private autoRunSyncAfterLogin: boolean = true;
    private needRunSync: boolean = false;

    constructor(
      public menuCtrl: MenuController,
      public navCtrl: NavController,
      public navParams: NavParams,
      public loadingCtrl: LoadingController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public storage: Storage,
      public translateService: TranslateService,
      public userService: UserService,
      public moduleService: ModuleService,
      public dataSyncService: DataSyncService
    )
    {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translateService);
    }

    ionViewDidLoad(){
      let autoRunSync = this.navParams.get('autoRunSync');
      if(autoRunSync) {
        this.syncServerData();
      }else {

        this.storage.get(STORAGE_KEYS.dataSyncInfo).then(
          dataSyncInfo => {
            //console.log('dataSyncInfo ', dataSyncInfo);
            this.lastRun = dataSyncInfo ? new Date(dataSyncInfo.lastSyncDateTime) : new Date();
            //console.log(this.lastRun);
            this.syncMessage = `${this.lastRun.toLocaleDateString()} ${this.lastRun.toLocaleTimeString()}`;

            if(dataSyncInfo){
              this.needRunSync = false;
            }
            else {
              this.needRunSync = true;
            }
          }
        );

        this.loadLanguageSetting();
        this.loadAutoRunSyncSetting();
      }
    }

    private loadLanguageSetting() {
      this.storage.get(STORAGE_KEYS.currentLanguage).then(
        lang => {
          this.appLanguage = lang ? lang : 'vi';
        }
      );
    }

    private loadAutoRunSyncSetting() {
      this.storage.get(STORAGE_KEYS.autoRunSyncAfterLogin).then(
        val => {
          this.autoRunSyncAfterLogin = val;
        }
      );
    }

    saveChangeLanguage() {
      this.storage.set(STORAGE_KEYS.currentLanguage, this.appLanguage).then(
        () => {
          this.translateService.use(this.appLanguage);
        }
      );
    }

    toggleAutoRunSyncSetting() {
      this.storage.set(STORAGE_KEYS.autoRunSyncAfterLogin, this.autoRunSyncAfterLogin);
    }

    syncServerData() {
      let loader = this.loadingCtrl.create({
            content: 'Users...'
        });
      loader.present();
      this.userService.getCurrentUserSessionId().then(
        sessionDto => {

          this.dataSyncService.syncUserDetail(sessionDto, this.storage, this.userService).then(() => {
            loader.dismissAll();
            loader = this.loadingCtrl.create({
              content: 'Contact Picklist...'
            });

            loader.present().then(
              () => {
                this.dataSyncService.syncContactModulePickList(sessionDto, this.storage, this.moduleService).then(() => {
                  loader.dismissAll();
                  loader = this.loadingCtrl.create({
                    content: 'Potential Picklist...'
                  });

                  loader.present().then(() => {
                    this.dataSyncService.syncPotentialModulePickList(sessionDto, this.storage, this.moduleService).then(() => {
                      loader.dismissAll();
                      loader = this.loadingCtrl.create({
                        content: 'Calendar Picklist...'
                      });

                      loader.present().then(() => {
                        this.dataSyncService.syncCalendarModulePickList(sessionDto, this.storage, this.moduleService).then(() => {
                          loader.dismissAll();
                          loader = this.loadingCtrl.create({
                            content: 'Calendars...'
                          });

                          loader.present().then(() => {
                            this.dataSyncService.syncCalendarModuleData(sessionDto, this.storage).then(() => {
                              loader.dismissAll();
                              loader = this.loadingCtrl.create({
                                content: 'Contacts...'
                              });

                              loader.present().then(() => {
                                this.dataSyncService.syncContactModuleData(sessionDto, this.storage).then(() => {
                                  loader.dismissAll();
                                  loader = this.loadingCtrl.create({
                                    content: 'Accounts...'
                                  });

                                  loader.present().then(() => {
                                    this.dataSyncService.syncAccountModuleData(sessionDto, this.storage).then(() => {
                                      loader.dismissAll();
                                      loader = this.loadingCtrl.create({
                                        content: 'Potentials...'
                                      });

                                      loader.present().then(() => {
                                        this.dataSyncService.syncPotentialModuleData(sessionDto, this.storage).then(() => {
                                          loader.dismissAll();
                                          loader = this.loadingCtrl.create({
                                            content: 'All Users...'
                                          });

                                          loader.present().then(() => {
                                            this.dataSyncService.syncAllUsers(sessionDto, this.storage, this.userService).then(() => {
                                              loader.dismissAll();
                                              loader = this.loadingCtrl.create({
                                                content: 'Form metadata...'
                                              });

                                              loader.present().then(() => {
                                                this.dataSyncService.syncFormSchemaMetadata(sessionDto, this.storage, this.moduleService).then(() => {
                                                  loader.dismissAll();
                                                  loader = this.loadingCtrl.create({
                                                    content: 'Others...'
                                                  });

                                                  loader.present().then(() => {
                                                    this.dataSyncService.syncCampaignModuleData(sessionDto, this.storage).then(() => {
                                                      let lastRun = new Date();
                                                      this.lastRun = lastRun;
                                                      this.syncMessage = `${lastRun.toLocaleDateString()} ${lastRun.toLocaleTimeString()}`;
                                                      let dataSyncInfo = new DataSyncInfoDto();
                                                      dataSyncInfo.lastSyncDateTime = lastRun;
                                                      this.storage.set(STORAGE_KEYS.dataSyncInfo, dataSyncInfo).then(() => loader.dismissAll());
                                                      this.loadLanguageSetting();
                                                      this.loadAutoRunSyncSetting();
                                                      this.navCtrl.setRoot(DashboardPage);
                                                    }
                                                    ,err => this.handleSyncError(err, loader));
                                                  });
                                                }
                                                ,err => this.handleSyncError(err, loader));
                                              });
                                            }
                                            ,err => this.handleSyncError(err, loader));
                                          });
                                        }
                                        ,err => this.handleSyncError(err, loader));
                                      });
                                    }
                                    ,err => this.handleSyncError(err, loader));
                                  });
                                }
                                ,err => this.handleSyncError(err, loader));
                              });
                            }
                            ,err => this.handleSyncError(err, loader));
                          });
                        }
                        ,err => this.handleSyncError(err, loader));
                      });
                    }
                    ,err => this.handleSyncError(err, loader));
                  });
                }
                ,err => this.handleSyncError(err, loader));
              }
            );
          }
          ,err => this.handleSyncError(err, loader));
        }
        ,err => this.handleSyncError(err, loader)
      );
    }

    handleSyncError(err, loader) {
      loader.dismissAll();
      this.showUIError(err);
    }

    syncServerDataAllPromise() {
      let loader = this.loadingCtrl.create({
            content: 'Please wait...'
        });
      loader.present();
      this.userService.getCurrentUserSessionId().then(
        sessionDto => {

          let syncRes1 = this.dataSyncService.syncUserDetail(sessionDto, this.storage, this.userService);
          let syncRes2 = this.dataSyncService.syncContactModulePickList(sessionDto, this.storage, this.moduleService);
          let syncRes3 = this.dataSyncService.syncPotentialModulePickList(sessionDto, this.storage, this.moduleService);

          let syncRes4 = this.dataSyncService.syncCalendarModuleData(sessionDto, this.storage);
          let syncRes5 = this.dataSyncService.syncContactModuleData(sessionDto, this.storage);
          let syncRes6 = this.dataSyncService.syncAccountModuleData(sessionDto, this.storage);
          let syncRes7 = this.dataSyncService.syncPotentialModuleData(sessionDto, this.storage);
          let syncRes8 = this.dataSyncService.syncCampaignModuleData(sessionDto, this.storage);
          let syncRes9 = this.dataSyncService.syncAllUsers(sessionDto, this.storage, this.userService);
          let syncRes10 = this.dataSyncService.syncCalendarModulePickList(sessionDto, this.storage, this.moduleService);

          Promise.all([syncRes1, syncRes2, syncRes3, syncRes4, syncRes5,
              syncRes6, syncRes7, syncRes8, syncRes9, syncRes10])
            .then(() => {
              //console.log('all sync tasks have finished.');
              let lastRun = new Date();
              this.syncMessage = `Lần cuối chạy đồng bộ dữ liệu ${lastRun.toLocaleDateString()} ${lastRun.toLocaleTimeString()}`;
              let dataSyncInfo = new DataSyncInfoDto();
              dataSyncInfo.lastSyncDateTime = lastRun;

              this.storage.set(STORAGE_KEYS.dataSyncInfo, dataSyncInfo).then(
                () => loader.dismissAll()
              )
          },
          (err) => {
            loader.dismissAll();
            this.showUIError(err);
          });
        }
      );
    }
}
