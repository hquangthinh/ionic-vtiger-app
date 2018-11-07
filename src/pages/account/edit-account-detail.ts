import {Observable} from 'rxjs';
import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, Loading, NavParams, AlertController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from '../../providers/user-service';
import { AccountService } from '../../providers/account-service';
import { ModuleService } from '../../providers/module-service';
import { DataSyncService } from '../../providers/data-sync-service';

// import { AccountDto, AccountDetailDto } from '../../model/shared-dto';
import { UserLoginSessionDto } from '../../model/login-dto';
import { UserDetailDto } from '../../model/user-detail-dto';

import { BasePage } from '../base-page';

@Component({
  selector: 'page-edit-account-detail',
  templateUrl: 'edit-account-detail.html'
})
export class EditAccountDetailPage extends BasePage {

    pageTitle:string = "accounts.pageTitleEdit";
    selectedAccountId: any;
    model : any = {};
    tabName: string = "summary";
    mailingCityList: Array<string> = new Array<string>();
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
    public translate: TranslateService,
    public userService: UserService,
    public accountService: AccountService,
    public moduleService: ModuleService,
    public dataSyncService: DataSyncService
    ) {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
        this.selectedAccountId = navParams.get('accountId');
  }

  ionViewDidLoad() {

    this.setPageMode(this.selectedAccountId);
    let loader = super.createLoading();
    loader.present().then(
      () => this.loadDataForEdit(loader)
    );
  }

  private loadDataForEdit(loader: Loading) {
    this.userService.getCurrentUserSessionId().then(
      sessionDto => {
        this.userSessionDto = sessionDto;
        let obModuleMeta = this.moduleService.getContactModuleMetadataFromCache();
        let obUsers = this.userService.getAllSystemUsersFromStorage();

        Observable.zip(obModuleMeta, obUsers).subscribe(dataList => {
            let formMeta = dataList[0];
            let userData = dataList[1];

            if(formMeta) {
              this.mailingCityList = formMeta.mailingCityList.map(item => item.value);
            }
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

          },
          () => super.showUIError('Lỗi tải dữ liệu. Xin vui lòng thử lại').then(
              () => loader.dismissAll()
          ),
          () => {
            if(this.isNewMode) {
              this.initModelForCreatingNew(this.userSessionDto);
              loader.dismissAll();
            } else {
              this.loadModelDetailById(this.userSessionDto, this.selectedAccountId, loader);
            }
          }
        );
      }
    ).catch(super.showConsoleError);
  }

  private setPageMode(contactId: any) {
    if("0" === contactId){
      this.isNewMode = true;
      this.pageTitle = "accounts.pageTitleAdd";
    }
  }

  private initModelForCreatingNew(sessionDto: UserLoginSessionDto) {
    this.model = {
        "accountname": "",
        "account_no": "",
        "phone": "",
        "website": "",
        "fax": "",
        "tickersymbol": "",
        "otherphone": "",
        "account_id": {
            "value": ""
        },
        "email1": "",
        "employees": "",
        "email2": "",
        "ownership": "",
        "rating": "",
        "industry": "",
        "siccode": "",
        "accounttype": "",
        "annual_revenue": "",
        "emailoptout": "",
        "notify_owner": "1",
        "assigned_user_id": {
            "value": ""
        },
        "createdtime": "",
        "modifiedtime": "",
        "modifiedby": {
            "value": ""
        },
        "bill_street": "",
        "ship_street": "",
        "bill_city": "",
        "ship_city": "",
        "bill_state": "",
        "ship_state": "",
        "bill_code": "",
        "ship_code": "",
        "bill_country": "Việt Nam",
        "ship_country": "",
        "bill_pobox": "",
        "ship_pobox": "",
        "description": "",
        "isconvertedfromlead": "0",
        "cf_789": "",
        "cf_791": "",
        "cf_799": ""
    };

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
      this.accountService.getAccountDetail(userSessionDto, id)
        .subscribe(
            data => {
                this.model = data;
                if(this.model.assigned_user_id) {
                    this.model.assigned_user_id_input = this.model.assigned_user_id.value;
                }
            },
            super.showConsoleError,
            () => loader.dismissAll()
        );
  }

  onAssignedUserChange() {
    if(this.model.assigned_user_id_input) {
      this.model.assigned_user_id = {
        value: this.model.assigned_user_id_input
      }
    }
  }

  saveChanges() {
    let loader = super.createLoading();
    loader.present().then(
        () => {
            this.model.assigned_user_id = this.model.assigned_user_id_input;
            this.model.modifiedby = this.model.assigned_user_id;
            this.model.cf_963 = this.model.cf_963.year + '-' + this.model.cf_963.month + '-' + this.model.cf_963.day;
            this.accountService.saveChanges(this.userSessionDto, this.model)
                .subscribe(
                    data => {
                        if(data && !data.success){
                            super.showUIError(`Lỗi cập nhật dữ liệu. ${data.error.message}`);
                        }else {
                            let updatedModel = data.result.record;
                            this.model.id = updatedModel.id;
                            this.dataSyncService.addOrUpdateAccountModelToStorage(this.isNewMode, updatedModel)
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
