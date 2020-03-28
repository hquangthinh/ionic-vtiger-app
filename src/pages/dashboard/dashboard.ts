// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController, Loading, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { DashboardService } from '../../providers/dashboard-service';
import { UserService } from '../../providers/user-service';
// import { MODULE_NAMES } from '../../providers/configuration-service';

import { RecentActivityDto } from '../../model/user-dashboard-dto';
// import { UserDetailDto } from '../../model/user-detail-dto';
// import { UserLoginSessionDto } from '../../model/login-dto';

import { BasePage } from '../base-page';
import { ContactPage } from '../contact/contact';
import { AccountPage } from '../account/account';
import { PotentialPage } from '../potential/potential';
import { SettingPage } from '../setting/setting';
import { MyAlertListPage } from '../alert/my-alert-list';
import { MyCalendarPage } from '../calendar/my-calendar';
// import { MyTaskPage } from '../task/my-task';

@Component({
  selector: 'page-dashboard',
  templateUrl: 'dashboard.html'
})
export class DashboardPage extends BasePage {

    cards : Array<{ titleKey: string, title: string, totalCount: number, component: any}>;
    recentActivities: Array<RecentActivityDto>;
    currentMonth: number;
    currentYear: number;

    constructor(
      public menuCtrl: MenuController,
      public navCtrl: NavController,
      public loadingCtrl: LoadingController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public storage: Storage,
      public translate: TranslateService,
      public dashboardService: DashboardService,
      public userService: UserService
      ) {

        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);

        this.cards = [
          { titleKey: 'dashboard.Test_Drive', title : "Test Drive", totalCount: 0, component: MyCalendarPage},
          { titleKey: 'dashboard.My_Alerts', title : "My Alerts", totalCount: 0, component: MyAlertListPage},
          { titleKey: 'dashboard.Contacts', title : "Contacts", totalCount: 0, component: ContactPage},
          { titleKey: 'dashboard.Accounts', title : "Accounts", totalCount: 0, component: AccountPage},
          { titleKey: 'dashboard.Potentials', title : "Potentials", totalCount: 0, component: PotentialPage},
          { titleKey: 'dashboard.Settings', title : "Settings", totalCount: 0, component: SettingPage},
        ];
    }

    // ionic view life cycle hook
    ionViewDidLoad() {
      this.currentMonth = new Date().getMonth() + 1;
      this.currentYear = new Date().getFullYear();
      const thisPage = this;
      let loader = super.createLoading();
      loader.present()
      .then(
        () => this.loadDashboardData(loader)
      )
      .catch(
        (err) => this.handleApiError(err, thisPage)
      );
    }

    openPage(cardIndex) {
      var card = this.cards[cardIndex];
      this.navCtrl.setRoot(card.component);
    }

    loadDashboardData(loader: Loading) {
      const thisPage = this;
      this.userService.getCurrentUserSessionId().then(
        (sessionDto) => {
          if(!sessionDto){
            this.handleApiError('Please login', thisPage);
            return;
          }

          this.dashboardService.getStatisticCountForDashboard(sessionDto)
            .subscribe(
                dataList => {
                  // contact count
                  this.cards[2].totalCount = dataList[0];
                  // account count
                  this.cards[3].totalCount = dataList[1];
                  // potential count
                  this.cards[4].totalCount = dataList[2];
                  // calendar count
                  this.cards[0].totalCount = dataList[3];
                },

                (err) => this.handleApiError(err, thisPage),

                () => loader.dismissAll()
              );
        }
      );

    }

    handleApiError(err: any, thisPage) {
      console.log(err);
      // super.showUIError(err)
      //   .then(() => super.signOut(this.storage));
      thisPage.showUIError(err)
        .then(() => super.signOut(this.storage));
    }

}
