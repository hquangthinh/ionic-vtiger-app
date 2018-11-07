import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController, 
          NavParams, Loading, ToastController, ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';
import { MockDataService } from '../../providers/mock-data-service';

import { BasePage } from '../base-page';
import { EditContactDetailPage } from './edit-contact-detail';
import { PotentialListModalPage } from './potential-list-modal';
import { ActivityListModalPage } from './activity-list-modal';

import { ContactDto } from '../../model/contact-dto';
import { UserLoginSessionDto } from '../../model/login-dto';

@Component({
  selector: 'page-view-contact-detail',
  templateUrl: 'view-contact-detail.html'
})
export class ViewContactDetailPage extends BasePage {

  selectedContactId: any;
  model : any = {};
  tabName: string = "summary";
  relatedModulesLoaded: boolean = false;
  userSession: UserLoginSessionDto;
  totalRelatedOpportunities: number = 0;
  totalRelatedActivities: number = 0;

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
    public contactService: ContactService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.selectedContactId = navParams.get('contactId');
  }

  // method load mock data for quick testing ui 
  loadMockData() {
    this.model = MockDataService.ContactDetailViewModel;
  }

  // load real contact data from server
  ionViewDidEnter() {
    
    if(!this.selectedContactId){
      this.loadMockData();
      return ;
    }

    let loading = super.createLoading();
    loading.present()
        .then(() => {
          this.loadContactDetail(loading);
        })
        .catch(super.showUIError);
  }

  private loadContactDetail(loading: Loading) {
    this.userService.getCurrentUserSessionId().then(
      sessionDto => {
        this.userSession = sessionDto;
        this.contactService.getContactDetail(sessionDto, this.selectedContactId)
          .subscribe(
            data => {              
              this.model = data;
              loading.dismissAll();
            },
            super.showUIError
          );
      }
    );
    
  }  

  editContactDetail(contactDetail : ContactDto) {
    this.navCtrl.push(EditContactDetailPage, { contactModel: this.model });
  }

  // load contact related modules when click on Related segment  
  loadContactRelatedModules() {
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
    let res1 = this.contactService.getRelatedPotentials(sessionDto, recordId);
    let res2 = this.contactService.getRelatedCalendars(sessionDto, recordId);

    Promise.all([res1, res2])
      .then(
        resultlist => {          
          this.totalRelatedOpportunities = resultlist[0].length;
          this.totalRelatedActivities = resultlist[1].length;
          loader.dismissAll();
          this.relatedModulesLoaded = true;
        }
      )
      .catch(super.showConsoleError);
  }

  // navigate to page to view Related Entities  
  viewRelatedModules(relatedModuleName: string) {
    if('Opportunities' === relatedModuleName) {
      let oppModal = this.modalCtrl.create(PotentialListModalPage, {recordId: this.model.id, contactName: this.model.firstname || this.model.lastname });
      oppModal.present();
    }else if('Activities' === relatedModuleName) {
      let activityModal = this.modalCtrl.create(ActivityListModalPage, {recordId: this.model.id, contactName: this.model.firstname || this.model.lastname });
      activityModal.present();
    }
  }

}
