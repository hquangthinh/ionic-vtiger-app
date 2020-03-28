import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController, NavParams,
  Loading, ToastController, ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { PotentialService } from '../../providers/potential-service';
import { MockDataService } from '../../providers/mock-data-service';
import { DataFormatUtil } from '../../utils/data-format-util';

import { BasePage } from '../base-page';
import { EditPotentialDetailPage } from './edit-potential-detail';
import { PotentialActivityListModalPage } from './potential-activity-list-modal';
import { PotentialContactListModalPage } from './potential-contact-list-modal';

import { PotentialDto, PotentialDetailDto } from '../../model/shared-dto';
import { UserLoginSessionDto } from '../../model/login-dto';

@Component({
  selector: 'page-view-potential-detail',
  templateUrl: 'view-potential-detail.html'
})
export class ViewPotentialDetailPage extends BasePage {

    selectedPotentialId: any;
    model : any = {};
    tabName: string = "details";
    relatedModulesLoaded: boolean = false;
    userSession: UserLoginSessionDto;
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
    public potentialService: PotentialService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.selectedPotentialId = navParams.get('potentialId');
  }

  loadMockData() {
      this.model = MockDataService.PotentialDetailViewModel;
  }

  ionViewDidEnter() {
    if(!this.selectedPotentialId){
        this.loadMockData();
        return;
    }

    let loading = super.createLoading();
    loading.present().then(
        () => this.loadPotentialDetail(loading)
    );
  }

  private loadPotentialDetail(loading: Loading) {
    let potentialId = this.selectedPotentialId;

    this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          this.userSession = userSessionDto;
          if(userSessionDto.isOfflineMode){
            this.potentialService.loadPotentialDetailFromStorage(potentialId).then(
                dto => {
                    this.model = dto;
                    console.log('loadPotentialDetail -> ' + potentialId);
                    console.log(this.model);
                    loading.dismissAll();
                }
            ).catch(super.showConsoleError);
          }else{
            // get from server
            this.potentialService.getPotentialDetailWithGrouping(userSessionDto, potentialId).then(
              dto => {
                this.model = dto;
                console.log('model from server ', this.model);
                loading.dismissAll();
              }
            ).catch(super.showConsoleError);
          }
        }
    ).catch(super.showUIError);
  }

  editPotentialDetail(model: any){
    this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Cannot edit record when app in offline mode');
            return;
          }else{
            this.navCtrl.push(EditPotentialDetailPage, { potentialId: model.id });
          }
        }
      );
  }

  getFieldType(uitype: any): string {
    return DataFormatUtil.getFieldType(uitype);
  }

  getDateValue(sValue: string): Date {
    return DataFormatUtil.getDateValue(sValue);
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
    let res1 = this.potentialService.getRelatedCalendars(sessionDto, recordId);
    let res2 = this.potentialService.getRelatedContacts(sessionDto, recordId);

    Promise.all([res1, res2])
      .then(
        resultlist => {
          this.totalRelatedActivities = resultlist[0].length;
          this.totalRelatedContacts = resultlist[1].length;
          loader.dismissAll();
          this.relatedModulesLoaded = true;
        }
      )
      .catch(super.showConsoleError);
  }

  // navigate to page to view Related Entities
  viewRelatedModules(relatedModuleName: string) {
    let potentialName = this.model.blocks[0].fields[1].value;
    if('Activities' === relatedModuleName) {
      let activityModal = this.modalCtrl.create(PotentialActivityListModalPage, {recordId: this.model.id, title: potentialName });
      activityModal.present();
    }else if('Contacts' === relatedModuleName) {
      let contactModal = this.modalCtrl.create(PotentialContactListModalPage, {recordId: this.model.id, title: potentialName });
      contactModal.present();
    }
  }


}
