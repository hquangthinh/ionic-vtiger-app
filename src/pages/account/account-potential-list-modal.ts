import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from '../../providers/user-service';
import { AccountService } from '../../providers/account-service';
import { PotentialService } from '../../providers/potential-service';

import { BasePage } from '../base-page';
import { ViewPotentialDetailPage } from '../potential/view-potential-detail';

@Component({
    templateUrl: 'account-potential-list-modal.html'
})
export class AccountPotentialListModalPage extends BasePage {

    potentials: any[] = new Array();
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
    public potentialService: PotentialService
    )
    {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.recordId = navParams.get('recordId');
      this.title = navParams.get('title');
    }

  ionViewDidLoad() {
    let loader = super.createLoading();
    loader.present().then(
        () => this.loadPotentials(this.recordId).then(
            () => loader.dismissAll()
        )
    );
  }

  private loadPotentials(recordId: any): Promise<any> {
      return this.userService.getCurrentUserSessionId().then(
          sessionDto => {
            return this.accountService.getRelatedPotentials(sessionDto, recordId)
            .then(
                data => {
                    this.potentials = this.potentialService.extractPotentialList(data);
                    return this.potentials;
                }
            )
            .catch(super.showConsoleError);
          }
      );
  }

  viewPotentialDetail(dto: any) {
    this.navCtrl.push(ViewPotentialDetailPage, { potentialId: dto.id});
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
