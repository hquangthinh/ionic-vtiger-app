import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';
import { CalendarService } from '../../providers/calendar-service';

import { BasePage } from '../base-page';

@Component({
    templateUrl: 'activity-list-modal.html'
})
export class ActivityListModalPage extends BasePage {

    activities: any[] = new Array();
    recordId: string;
    potentialId: string;
    contactName: string;
    activityType: string;

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
    public contactService: ContactService,
    public calendarService: CalendarService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.recordId = navParams.get('recordId');
      this.potentialId = navParams.get('potentialId');
      this.contactName = navParams.get('contactName');
      this.activityType = navParams.get('activityType');
  }

  ionViewDidLoad() {
    let loader = super.createLoading();
    loader.present().then(
        () => this.loadActivities(this.recordId, this.potentialId).then(
          () => loader.dismissAll()
        )
    );
  }

  private loadActivities(recordId: string, potentialId: string): Promise<any> {

    // let fnByActivityType;
    return this.userService.getCurrentUserSessionId().then(
        sessionDto => {
          if(this.activityType === 'TestDrive') {
            return this.contactService.getRelatedTestDrives(sessionDto, recordId).then(
              data => {
                // console.log('TestDrive ', data);
                this.activities = data;
                return this.activities;
              }
            );
          }
          // others
          return this.contactService.getRelatedCalendars(sessionDto, potentialId)
          .then(
              data => {
                  // console.log(data);
                  switch(this.activityType) {
                    case 'Task':
                    const taskFilter = (item) => item && item.activitytype === 'Task'
                        && item.subject.indexOf('SMS') === -1
                        && item.subject.indexOf('Gọi') === -1
                        && item.subject.indexOf('ĐT') === -1
                        && item.subject.indexOf('Gặp') === -1;
                    this.activities = data.filter(taskFilter);
                    break;
                    case 'Call':
                      const callFilter = (item) => item && item.activitytype === 'Task'
                        && (item.subject.indexOf('Gọi') > -1 || item.subject.indexOf('ĐT') > -1);
                      this.activities = data.filter(callFilter);
                    break;
                    case 'SMS':
                      const smsFilter = (item) => item && item.activitytype === 'Task' && item.subject.indexOf('SMS') > -1;
                      this.activities = data.filter(smsFilter);
                    break;
                    case 'Meeting':
                      const meetingFilter = (item) => item && item.activitytype === 'Task' && item.subject.indexOf('Gặp') > -1;
                      this.activities = data.filter(meetingFilter);
                    break;
                    default:
                      this.activities = data;
                    break;
                  }
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
