import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { KeywordSearchCommand } from '../../model/search-commands';
import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';

import { BasePage } from '../base-page';

@Component({
    templateUrl: 'search-contact-modal.html'
})
export class SearchContactModalPage extends BasePage {

    contacts: any[] = new Array();

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
    public contactService: ContactService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
  }

  ionViewDidLoad() {
    let loader = super.createLoading();
    loader.present().then(
        () => this.loadData().then(
            () => loader.dismissAll()
        )
    );
  }

  private loadData(): Promise<any> {
      return this.userService.getCurrentUserSessionId().then(
          sessionDto => {
            return this.contactService.loadContactListFromStorage()
            .then(
                data => {
                    this.contacts = data;
                    return this.contacts;
                }
            )
            .catch(super.showConsoleError);
          }
      );
  }

  searchContacts(ev) {
    let cmd = new KeywordSearchCommand();
    cmd.keyword = ev.target.value || '';
    this.contactService.searchContactsFromStorage(cmd)
        .then(data => {
            this.contacts = data;
        })
        .catch(super.showConsoleError);
  }

  cancelSearch(ev) {
      this.loadData();
  }

  selectItem(dto: any) {
    let data = { 'selectedModel': dto };
    this.viewCtrl.dismiss(data);
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
