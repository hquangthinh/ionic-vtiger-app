import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from '../../providers/user-service';
import { AccountService } from '../../providers/account-service';
import { CalendarService } from '../../providers/calendar-service';

import { BasePage } from '../base-page';

@Component({
    templateUrl: 'account-activity-list-modal.html'
})
export class AccountActivityListModalPage extends BasePage {

    activities: any[] = new Array();
    recordId: any;
    title: string;

    constructor(
    public menuCtrl: MenuController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public viewCtrl: ViewController,
    public translate: TranslateService,
    public userService: UserService,
    public accountService: AccountService,
    public calendarService: CalendarService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.recordId = navParams.get('recordId');
      this.title = navParams.get('title');
  }

  ionViewDidLoad() {
    let loader = super.createLoading();
    loader.present().then(
        () => this.loadActivities(this.recordId).then(
            () => loader.dismissAll()
        )
    );
  }

  private loadActivities(recordId: any): Promise<any> {
      return this.userService.getCurrentUserSessionId().then(
          sessionDto => {
            return this.accountService.getRelatedCalendars(sessionDto, recordId)
            .then(
                data => {
                    this.activities = this.calendarService.extractCalendarList(data);
                    return this.activities;
                }
            )
            .catch(super.showConsoleError);
          }
      );
  }

  viewActivityDetail(dto: any) {

  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
