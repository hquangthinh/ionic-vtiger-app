import {Observable} from 'rxjs';
import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, Loading, NavParams, AlertController,
          ToastController, ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
// import { AccountService } from '../../providers/account-service';
import { ModuleService } from '../../providers/module-service';
import { DataSyncService } from '../../providers/data-sync-service';
import { PotentialService } from '../../providers/potential-service';
import { CampaignService } from '../../providers/campaign-service';

import { CampaignDto } from '../../model/shared-dto';
import { UserLoginSessionDto } from '../../model/login-dto';
import { UserDetailDto } from '../../model/user-detail-dto';

import { BasePage } from '../base-page';
import { SearchContactModalPage } from '../modals/search-contact-modal';
import { SearchAccountModalPage } from '../modals/search-account-modal';

@Component({
  selector: 'page-edit-potential-detail',
  templateUrl: 'edit-potential-detail.html'
})
export class EditPotentialDetailPage extends BasePage {

    selectedPotentialId: any;
    pageTitle:string = "potentials.pageTitleEdit";
    model : any = {};
    tabName: string = "summary";
    potentialNameList: Array<string> = new Array<string>();
    opportunityTypeList: Array<string> = new Array<string>();
    leadSourceList: Array<string> = new Array<string>();
    saleStageList: Array<string> = new Array<string>();
    campaignList: Array<CampaignDto> = new Array<CampaignDto>();
    allUserList: Array<UserDetailDto> = new Array<UserDetailDto>();
    userSessionDto: UserLoginSessionDto;
    isNewMode: boolean = false;

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
    public potentialService: PotentialService,
    public moduleService: ModuleService,
    public dataSyncService: DataSyncService,
    public campaignService: CampaignService
    ) {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.selectedPotentialId = navParams.get('potentialId');
  }

  ionViewDidLoad() {
    this.setPageMode(this.selectedPotentialId);
    let loader = super.createLoading();
    loader.present().then(
      () => this.loadDataForEdit(loader)
    );
  }

  private loadDataForEdit(loader: Loading) {
    let distinctFilter = function(value, index, self) {
      return self.indexOf(value) === index;
    };
    this.userService.getCurrentUserSessionId().then(
      sessionDto => {
        this.userSessionDto = sessionDto;
        let obModuleMeta = this.moduleService.getPotentialModuleMetadataFromCache();
        let obUsers = this.userService.getAllSystemUsersFromStorage();
        let obCampaign = Observable.fromPromise(this.campaignService.loadCampaignListFromStorage());

        Observable.zip(obModuleMeta, obUsers, obCampaign)
          .subscribe(dataList => {
              let formMeta = dataList[0];
              let userData = dataList[1];
              let campaignDtoList = dataList[2];

              // module metadata
              if(formMeta) {
                this.potentialNameList = formMeta.potentialNameList.map(item => item.value);
                this.leadSourceList = formMeta.leadSourceList.map(item => item.value).filter(distinctFilter);
                this.opportunityTypeList = formMeta.opportunityTypeList.map(item => item.value);
                this.saleStageList = formMeta.salesStageList.map(item => item.value);
              }

              // data for NVBH field
              if(userData) {
                this.allUserList = userData;
              }

              if(!this.allUserList || this.allUserList.length === 0) {
                let currentUserInfo = new UserDetailDto();
                currentUserInfo.userId = sessionDto.userIdWithModuleId;
                currentUserInfo.userName = sessionDto.userName;
                currentUserInfo.fullName = sessionDto.userName;
                this.allUserList.push(currentUserInfo);
              }

              // campaign list
              if(campaignDtoList) {
                this.campaignList = campaignDtoList;
              }
            },
            () => super.showUIError('Lỗi tải dữ liệu. Xin vui lòng thử lại').then(
              () => loader.dismissAll()
            ),
            () => {
              if(this.isNewMode) {
                this.initModelForCreatingNew(this.userSessionDto);
                loader.dismissAll();
              } else {
                this.loadModelDetailById(this.userSessionDto, this.selectedPotentialId, loader);
              }
            }
          );
      }
    ).catch(super.showConsoleError);
  }

  private setPageMode(contactId: any) {
    if("0" === contactId){
      this.isNewMode = true;
      this.pageTitle = "potentials.pageTitleAdd";
    }
  }

  private initModelForCreatingNew(sessionDto: UserLoginSessionDto) {
    this.model = {};
    // default values
    if(sessionDto) {
      this.model.assigned_user_id_input = sessionDto.userIdWithModuleId;
      this.model.assigned_user_id = {
        value: this.model.assigned_user_id_input,
        label: ''
      };
    }
  }

  private loadModelDetailById(userSessionDto: UserLoginSessionDto, id: string, loader: Loading){
      this.potentialService.getPotentialDetail(userSessionDto, id)
        .subscribe(
            data => {
                this.model = data;
                if(this.model.assigned_user_id) {
                    this.model.assigned_user_id_input = this.model.assigned_user_id.value;
                }
                if(this.model.contact_id) {
                    let objContact = this.model.contact_id;
                    this.model.contact_id_input = objContact.label;
                    this.model.contact_id = objContact.value;
                }
                if(this.model.related_to) {
                    let objRelatedTo = this.model.related_to;
                    this.model.related_to_input = objRelatedTo.label;
                    this.model.related_to = objRelatedTo.value;
                }
                if(this.model.campaignid) {
                    let objCamp = this.model.campaignid;
                    this.model.campaignid_input = objCamp.value;
                    this.model.campaignid = objCamp.value;
                }
            },
            err => {
              super.showConsoleError(err);
              loader.dismissAll();
            },
            () => loader.dismissAll()
        );
  }

  openContactModal() {
    let contactModal = this.modalCtrl.create(SearchContactModalPage);
    contactModal.onDidDismiss(
      data => {
        if(data && data.selectedModel) {
          this.model.contact_id = data.selectedModel.id;
          this.model.contact_id_input = data.selectedModel.fullName;
        }
      }
    );
    contactModal.present();
  }

  openAccountModal() {
    let accountModal = this.modalCtrl.create(SearchAccountModalPage);
    accountModal.onDidDismiss(
      data => {
        if(data && data.selectedModel) {
          this.model.related_to = data.selectedModel.id;
          this.model.related_to_input = data.selectedModel.accountname;
        }
      }
    );
    accountModal.present();
  }

  onAssignedUserChange() {
    if(this.model.assigned_user_id_input) {
      this.model.assigned_user_id = {
        value: this.model.assigned_user_id_input
      }
    }
  }

  onCampaignSelected() {
    this.model.campaignid = this.model.campaignid_input;
  }

  private validateInput(model) {

    let isValid = true;

    if(!model.sales_stage) {
      model.sales_stageError = 'Vui lòng chọn trạng thái bán hàng';
      return false;
    } else {
      delete model.sales_stageError;
    }

    return isValid;
  }

  saveChanges() {
    let validationRes = this.validateInput(this.model);
    if(!validationRes)
      return;

    let loader = super.createLoading();
    loader.present().then(
        () => {
            this.model.assigned_user_id = this.model.assigned_user_id_input;
            this.model.modifiedby = this.model.assigned_user_id;
            if(this.model.closingdate && this.model.closingdate.year && this.model.closingdate.month && this.model.closingdate.day){
              this.model.closingdate = this.model.closingdate.year + '-' + this.model.closingdate.month + '-' + this.model.closingdate.day;
            }
            this.potentialService.saveChanges(this.userSessionDto, this.model)
                .subscribe(
                    data => {
                        if(data && !data.success){
                            super.showUIError(`Lỗi cập nhật dữ liệu. ${data.error.message}`);
                        }else {
                            let updatedModel = data.result.record;
                            this.model.id = updatedModel.id;
                            this.dataSyncService.addOrUpdatePotentialModelToStorage(this.isNewMode, updatedModel)
                              .then(
                                () => super.showToastMessage('Dữ liệu lưu thành công.')
                              );
                        }
                    }
                ,super.showConsoleError
                ,() => {
                    loader.dismissAll();
                    this.navCtrl.pop();
                }
            );
        }
    );
  }

}
