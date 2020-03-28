import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { PotentialService } from '../../providers/potential-service';
import { ContactService } from '../../providers/contact-service';

import { BasePage } from '../base-page';
import { ViewContactDetailPage } from '../contact/view-contact-detail';

@Component({
    templateUrl: 'potential-contact-list-modal.html'
})
export class PotentialContactListModalPage extends BasePage {

    contacts: any[] = new Array();
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
    public potentialService: PotentialService,
    public contactService: ContactService
    ) {
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
            return this.potentialService.getRelatedContacts(sessionDto, recordId)
            .then(
                data => {
                    this.contacts = this.contactService.extractContactList(data);
                    return this.contacts;
                }
            )
            .catch(super.showConsoleError);
          }
      );
  }

  viewContactDetail(dto: any) {
    this.navCtrl.push(ViewContactDetailPage, { contactId: dto.id});
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
