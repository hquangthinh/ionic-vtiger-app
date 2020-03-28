import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController, NavParams,
  ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { AlertService } from '../../providers/alert-service';
import { CalendarService } from '../../providers/calendar-service';

import { FetchModuleQueryForAlertCommand } from '../../model/search-commands';
import { BasePage } from '../base-page';
import { ViewPotentialDetailPage } from '../potential/view-potential-detail';
import { MyCalendarDetailPage } from '../calendar/my-calendar-detail';
import { CalendarGroupDto } from '../../model/shared-dto';

@Component({
  selector: 'page-my-alert-list',
  templateUrl: 'my-alert-list.html'
})
export class MyAlertListPage extends BasePage {

    private alertRecords: Array<any> = new Array<any>();
    private overdueActivities: Array<CalendarGroupDto> = new Array<CalendarGroupDto>();
    private alertCategory = '';
    private title = 'Cơ Hội Sắp Tới';

    constructor(
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public translate: TranslateService,
        public navParams: NavParams,
        public storage: Storage,
        public userService: UserService,
        public alertService: AlertService,
        public calendarService: CalendarService
      )
    {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    }

    ionViewDidLoad() {

        let alertDto = this.navParams.get("model");

        if(alertDto === undefined || alertDto === null) {
            this.alertCategory = 'Calendar';
        }
        else {
            this.alertCategory = alertDto.category;
        }

        let loading = super.createLoading();
        loading.present().then(
            () => {
                //console.log('alert category :: ', this.alertCategory);
                if(this.alertCategory === 'Potentials') {
                    this.userService.getCurrentUserSessionId().then(
                        userSessionDto => {
                            let cmd = new FetchModuleQueryForAlertCommand();
                            cmd.sessionId = userSessionDto.session;
                            cmd.appBaseUrl = userSessionDto.appBaseUrl;
                            cmd.module = alertDto.category;
                            cmd.alertId = alertDto.alertid;

                            this.alertService.fetchModuleRecordsWithAlertId(cmd).then(
                                data => {
                                    this.alertRecords = this.sortAlertList(data);
                                    loading.dismissAll();
                                }
                            );
                        }
                    );
                }//end of Potentials query

                if(this.alertCategory === 'Calendar') {
                    this.title = 'Hoạt Động Tới Hạn';
                    this.userService.getCurrentUserSessionId().then(
                        userSessionDto => {
                            this.calendarService.getOverdueActivities(userSessionDto).then(
                                overdueData => {
                                    //console.log('overdueData -> ', overdueData);
                                    this.overdueActivities = overdueData;
                                    loading.dismissAll();
                                }
                            );
                        }
                    );
                }//end of Calendar query
            }
        );
    }

    private sortAlertList(arr : Array<any>): Array<any> {
        let compareByDate = function(a: any, b: any) {
            if(a.eventstartdate && b.eventstartdate && a.eventstartdate > b.eventstartdate)
                return -1;
            if(a.eventstartdate && b.eventstartdate && a.eventstartdate < b.eventstartdate)
                return 1;
            return 0;
        }
        return arr.sort(compareByDate);
    }

    viewRecordDetail(item: any) {
        if(this.alertCategory === 'Potentials') {
            this.navCtrl.push(ViewPotentialDetailPage, { potentialId : item.id });
        }else if(this.alertCategory === 'Calendar') {
            this.navCtrl.push(MyCalendarDetailPage, { selectedId : item.id });
        }
    }
}
