import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController,
            NavParams, ToastController, ViewController }
                from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { KeywordSearchCommand } from '../../model/search-commands';
import { UserService } from '../../providers/user-service';
import { AccountService } from '../../providers/account-service';

import { BasePage } from '../base-page';

@Component({
    templateUrl: 'search-account-modal.html'
})
export class SearchAccountModalPage extends BasePage {

    accounts: any[] = new Array();

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
    public accountService: AccountService
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
            return this.accountService.loadAccountListFromStorage()
            .then(
                data => {
                    this.accounts = data;
                    return this.accounts;
                }
            )
            .catch(super.showConsoleError);
          }
      );
  }

  searchAccounts(ev) {
    let cmd = new KeywordSearchCommand();
    cmd.keyword = ev.target.value || '';
    this.accountService.searchAccountsFromStorage(cmd)
        .then(data => {
            this.accounts = data;
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
