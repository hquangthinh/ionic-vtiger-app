import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';
import { PotentialService } from '../../providers/potential-service';

import { BasePage } from '../base-page';
import { ViewPotentialDetailPage } from '../potential/view-potential-detail';

@Component({
    templateUrl: 'potential-list-modal.html'
})
export class PotentialListModalPage extends BasePage {

    potentials: any[] = new Array();
    recordId: any;
    contactName: string;

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
    public potentialService: PotentialService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.recordId = navParams.get('recordId');
      this.contactName = navParams.get('contactName');
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
            return this.contactService.getRelatedPotentials(sessionDto, recordId)
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
