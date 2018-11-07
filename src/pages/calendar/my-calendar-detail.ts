import { Component } from '@angular/core';
import { NavController, LoadingController, NavParams, Loading, AlertController,
  MenuController, ToastController } from 'ionic-angular';
// import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { UserLoginSessionDto } from '../../model/login-dto';
// import { CalendarDetailDto } from '../../model/shared-dto';

import { UserService } from '../../providers/user-service';
import { MockDataService } from '../../providers/mock-data-service';
// import { DataFormatUtil } from '../../utils/data-format-util';
import { CalendarService } from '../../providers/calendar-service';

import { BasePage } from '../base-page';
// import { EditCalendarDetailPage } from './edit-calendar-detail';
// import { EditTaskDetailPage } from './edit-task-detail';

@Component({
  selector: 'page-my-calendar-detail',
  templateUrl: 'my-calendar-detail.html'
})
export class MyCalendarDetailPage extends BasePage {

    selectedId: any;
    model : any = {};
    userSession: UserLoginSessionDto;

    constructor(
      public menuCtrl: MenuController,
      public navCtrl: NavController,
      public loadingCtrl: LoadingController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public translate: TranslateService,
      public navParams: NavParams,
      public userService: UserService,
      public calendarService: CalendarService
    )
    {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
        this.selectedId = navParams.get('selectedId');
    }


    loadMockData() {
      this.model = MockDataService.CalendarDetailViewModel;
    }

    ionViewDidEnter() {
        if(!this.selectedId){
            this.loadMockData();
            return;
        }

        let loading = super.createLoading();
        loading.present().then(
            () => this.loadModelDetail(loading)
        );
    }

    private loadModelDetail(loading: Loading) {
        let calendarId = this.selectedId;

        this.userService.getCurrentUserSessionId().then(
            userSessionDto => {
            this.userSession = userSessionDto;
            if(userSessionDto.isOfflineMode){
                this.calendarService.loadCalendarDetailFromStorage(calendarId).then(
                    dto => {
                        this.model = dto;
                        loading.dismissAll();
                    }
                ).catch(super.showConsoleError);
            }else{
                // get from server
                this.calendarService.getCalendarDetailWithGrouping(userSessionDto, calendarId).then(
                dto => {
                    this.model = dto;
                    loading.dismissAll();
                }
                ).catch(super.showConsoleError);
            }
            }
        ).catch(super.showUIError);
    }

    // private editCalendarDetail(model: any){
    //     this.userService.getCurrentUserSessionId().then(
    //     userSessionDto => {
    //       if(userSessionDto.isOfflineMode){
    //         super.showUIMessage('Cannot edit record when app in offline mode');
    //         return;
    //       }else{
    //         // TODO: get activitytype value from block fields
    //         let targetPage = model.id.startsWith('9x') ?
    //                 EditTaskDetailPage : EditCalendarDetailPage;
    //         this.navCtrl.push(targetPage, { selectedId: model.id });
    //       }
    //     }
    //   );
    // }

    // private getFieldType(uitype: any): string {
    //     return DataFormatUtil.getFieldType(uitype);
    // }

    // private getDateValue(sValue: string): Date {
    //     return DataFormatUtil.getDateValue(sValue);
    // }

}
