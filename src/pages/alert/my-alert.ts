import { Component } from '@angular/core';
import { NavController, LoadingController, Loading, AlertController, MenuController, 
    ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';    
import { TranslateService } from '@ngx-translate/core';
import { MODULE_NAMES  } from '../../providers/configuration-service';
import { MyAlertListPage } from './my-alert-list';

import { UserService } from '../../providers/user-service';
import { AlertService } from '../../providers/alert-service';
import { CalendarService } from '../../providers/calendar-service';

import { BaseQueryCommand, FetchModuleQueryForAlertCommand } from '../../model/search-commands';
import { AlertDto } from '../../model/alert-dto';
import { UserLoginSessionDto } from '../../model/login-dto';

import { BasePage } from '../base-page';

@Component({
  selector: 'page-my-alert',
  templateUrl: 'my-alert.html'
})
export class MyAlertPage extends BasePage {

    private alertList: Array<AlertDto> = new Array<AlertDto>();

    constructor(
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public storage: Storage,
        public translate: TranslateService,
        public userService: UserService,
        public alertService: AlertService,        
        public calendarService: CalendarService
      )
    {        
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    }

    ionViewDidLoad() {
      let loading = super.createLoading();
      loading.present().then(
        () => {
          this.performLoadAlertList(loading);    
        }
      );      
    }

    private createFetchModuleQueryForAlertCommand(userSessionDto: UserLoginSessionDto, dto: AlertDto): FetchModuleQueryForAlertCommand {
        let cmd = new FetchModuleQueryForAlertCommand();
        cmd.sessionId = userSessionDto.session;
        cmd.appBaseUrl = userSessionDto.appBaseUrl;
        cmd.module = dto.category;
        cmd.alertId = dto.alertid;
        return cmd;
    }

    private performLoadAlertList(loading: Loading) {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          let queryCommand = new BaseQueryCommand();
          queryCommand.sessionId = userSessionDto.session;
          queryCommand.appBaseUrl = userSessionDto.appBaseUrl;          

          this.alertService.fetchAllAlerts(queryCommand).then(
            data => {              
              //console.log('alert list -> ', data);
              this.alertList = data;              
              // get total alert count              
              let promiseList = this.alertList.map(
                dto => this.createFetchModuleQueryForAlertCommand(userSessionDto, dto)
              )
              .map(
                fetchCmd => {
                  if(fetchCmd.module === MODULE_NAMES.Calendar){
                    return this.calendarService.getOverdueActivitiesFlatList();
                  }
                  return this.alertService.fetchModuleRecordsWithAlertId(fetchCmd);
                }
              );

              return Promise.all(promiseList).then(
                resList => {                  
                  this.alertList.forEach(
                    (dto, idx) => dto.totalAlertCount = resList[idx].length
                  );
                  loading.dismissAll();
                  return resList;
                }
              );              
            }
          );
        }
      );
    }

    viewAlertDetails(alertDto: AlertDto){
      this.navCtrl.push(MyAlertListPage, { model: alertDto });            
    }

}
