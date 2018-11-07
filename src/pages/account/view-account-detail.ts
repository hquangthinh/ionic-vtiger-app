import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController, NavParams, Loading,
    ToastController, ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from '../../providers/user-service';
import { AccountService } from '../../providers/account-service';
import { MockDataService } from '../../providers/mock-data-service';

import { BasePage } from '../base-page';
import { EditAccountDetailPage } from './edit-account-detail';
import { DynamicEditAccountDetailPage } from './dynamic-edit-account-detail';
import { AccountActivityListModalPage } from './account-activity-list-modal';
import { AccountContactListModalPage } from './account-contact-list-modal';
import { AccountPotentialListModalPage } from './account-potential-list-modal';

import { AccountDto, AccountDetailDto } from '../../model/shared-dto';
import { UserLoginSessionDto } from '../../model/login-dto';

@Component({
  selector: 'page-view-account-detail',
  templateUrl: 'view-account-detail.html'
})
export class ViewAccountDetailPage extends BasePage {

    selectedAccountId: any;
    model : any = {};
    tabName: string = "details";
    relatedModulesLoaded: boolean = false;
    userSession: UserLoginSessionDto;
    totalRelatedOpportunities: number = 0;
    totalRelatedActivities: number = 0;
    totalRelatedContacts: number = 0;

  constructor(
    public menuCtrl: MenuController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public modalCtrl: ModalController,
    public translate: TranslateService,
    public userService: UserService,
    public accountService: AccountService
    ) {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
        this.selectedAccountId = navParams.get('accountId');
  }

  loadMockData() {
      this.model = MockDataService.AccountDetailViewModel;
  }

  ionViewDidEnter() {
    if(!this.selectedAccountId){
        this.loadMockData();
        return;
    }

    let loading = super.createLoading();
    loading.present().then(
        () => this.loadAccountDetail(loading)
    );
  }

  private loadAccountDetail(loading: Loading) {

    this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
            this.userSession = userSessionDto;
            this.accountService.loadAccountDetailFromStorage(this.selectedAccountId).then(
                dto => {
                    this.model = dto;
                    loading.dismissAll();
                }
            );
        }
    ).catch(super.showUIError);
  }

  editAccountDetail(model: any){
    this.navCtrl.push(EditAccountDetailPage, { accountId: model.id });
    //this.navCtrl.push(DynamicEditAccountDetailPage, { accountId: model.id });
  }

  getFieldType(uitype: any): string {
    let uiTypeNumber = parseInt(uitype);
    if(uiTypeNumber === 15 || uiTypeNumber === 16 || uiTypeNumber === 52
        || uiTypeNumber === 53 || uiTypeNumber === 55)
        return 'dropdown';

    if(uiTypeNumber === 56)
        return 'boolean';

    if(uiTypeNumber === 5 || uiTypeNumber === 6 || uiTypeNumber === 23 || uiTypeNumber === 70)
        return 'datetime';

      return  'text';
  }

  getDateValue(sValue: string): Date {
    if(sValue && sValue != '')
        return new Date(sValue);
    return null;
  }

  loadRelatedModules() {
    if(this.relatedModulesLoaded)
        return;

    let loader = super.createLoading();
    loader.present().then(
        () => this.performLoadContactRelatedModules(loader)
    );
  }

  private performLoadContactRelatedModules(loader: Loading) {
    let sessionDto = this.userSession;
    let recordId = this.model.id;
    let res1 = this.accountService.getRelatedPotentials(sessionDto, recordId);
    let res2 = this.accountService.getRelatedCalendars(sessionDto, recordId);
    let res3 = this.accountService.getRelatedContacts(sessionDto, recordId);

    Promise.all([res1, res2, res3])
      .then(
        resultlist => {
          this.totalRelatedOpportunities = resultlist[0].length;
          this.totalRelatedActivities = resultlist[1].length;
          this.totalRelatedContacts = resultlist[2].length;
          loader.dismissAll();
          this.relatedModulesLoaded = true;
        }
      )
      .catch(super.showConsoleError);
  }

  // navigate to page to view Related Entities
  viewRelatedModules(relatedModuleName: string) {
    let accountName = this.model.blocks[0].fields[0].value;
    if('Opportunities' === relatedModuleName) {
      let oppModal = this.modalCtrl.create(AccountPotentialListModalPage, {recordId: this.model.id, title: accountName });
      oppModal.present();
    }else if('Activities' === relatedModuleName) {
      let activityModal = this.modalCtrl.create(AccountActivityListModalPage, {recordId: this.model.id, title: accountName });
      activityModal.present();
    }else if('Contacts' === relatedModuleName) {
      let contactModal = this.modalCtrl.create(AccountContactListModalPage, {recordId: this.model.id, title: accountName });
      contactModal.present();
    }
  }

}
