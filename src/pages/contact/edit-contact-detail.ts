import {Observable} from 'rxjs';
import { Component } from '@angular/core';
import { FormBuilder} from '@angular/forms';
import { MenuController, NavController, LoadingController, Loading, NavParams, AlertController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';
import { ModuleService } from '../../providers/module-service';
import { DataSyncService } from '../../providers/data-sync-service';

import { ContactDto } from '../../model/contact-dto';
import { UserDetailDto } from '../../model/user-detail-dto';
import { UserLoginSessionDto } from '../../model/login-dto';

import { BasePage } from '../base-page';

@Component({
  selector: 'page-edit-contact-detail',
  templateUrl: 'edit-contact-detail.html'
})
export class EditContactDetailPage extends BasePage {

  pageTitle:string = "contacts.pageTitleEdit";
  selectedContactId: any;
  selectedContactModel: any;
  defaultContactModel: ContactDto;
  model : any = {};
  tabName: string = "summary";
  yearList: Array<string> = new Array<string>();
  leadSourceList: Array<string> = new Array<string>();
  mailingCityList: Array<string> = new Array<string>();
  carManList: Array<string> = new Array<string>();
  carList: Array<string> = new Array<string>();
  allUserList: Array<UserDetailDto> = new Array<UserDetailDto>();
  userSessionDto: UserLoginSessionDto;
  isNewMode: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public menuCtrl: MenuController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public translate: TranslateService,
    public userService: UserService,
    public contactService: ContactService,
    public moduleService: ModuleService,
    public dataSyncService: DataSyncService
  )
  {
    super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    this.selectedContactModel = navParams.get('contactModel');
    this.selectedContactId = navParams.get('contactId');
    this.defaultContactModel = navParams.get('defaultModel');

    for(let y = 1990; y < 2030; y++) {
      this.yearList.push(y.toString());
    }
  }

  ionViewDidLoad() {

    this.setPageMode(this.selectedContactId);
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

        let obModuleMeta = this.moduleService.getContactModuleMetadataFromCache();
        let obUsers = this.userService.getAllSystemUsersFromStorage();

        Observable.zip(obModuleMeta, obUsers).subscribe(dataList => {
            let formMeta = dataList[0];
            let userData = dataList[1];

            if(formMeta) {
              this.leadSourceList = formMeta.leadSourceList.map(item => item.value).filter(distinctFilter);
              this.mailingCityList = formMeta.mailingCityList.map(item => item.value);
              this.mailingCityList.unshift('');
              this.carManList = formMeta.carManufacturerList.map(item => item.value);
              this.carList = formMeta.carList.map(item => item.value);
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
            if(this.selectedContactModel) {
              this.model = this.selectedContactModel;
              if(this.model.assigned_user_id) {
                this.model.assigned_user_id_input = this.model.assigned_user_id.value;
              }
              loader.dismissAll();
            } else if(this.isNewMode) {
              this.initModelForCreatingNew(this.userSessionDto);
              loader.dismissAll();
            } else {
              this.loadModelDetailById(this.userSessionDto, this.selectedContactId, loader);
            }
          }
        );
      }
    ).catch(super.showConsoleError);
  }

  private setPageMode(contactId: any) {
    if("0" === contactId){
      this.isNewMode = true;
      this.pageTitle = "contacts.pageTitleAdd";
    }
  }

  private initModelForCreatingNew(sessionDto: UserLoginSessionDto) {
    this.model = {
      "salutationtype": "",
      "firstname": "",
      "phone": "",
      "lastname": "",
      "mobile": "",
      "account_id": {
        "value": "",
        "label": ""
      },
      "homephone": "",
      "leadsource": "Website",
      "otherphone": "",
      "title": "",
      "fax": "",
      "department": "",
      "birthday": "",
      "email": "",
      "contact_id": {
        "value": "",
        "label": ""
      },
      "assistant": "",
      "secondaryemail": "",
      "assistantphone": "",
      "donotcall": "",
      "emailoptout": "",
      "assigned_user_id_input": "",
      "assigned_user_id": {
        "value": "",
        "label": ""
      },
      "reference": "",
      "notify_owner": "",
      "mailingstreet": "",
      "mailingcity": "",
      "mailingstate": "",
      "mailingcountry": "Việt Nam",
      "cf_771": "",
      "cf_775": "",
      "cf_777": "",
      "cf_779": "0",
      "cf_797": "",
      "cf_835": "",
      "cf_837": "",
      "cf_839": "",
      "cf_861": "",
      "cf_863": "",
      "cf_865": ""
    };

    // default values
    if(sessionDto) {
      this.model.assigned_user_id_input = sessionDto.userIdWithModuleId;
      this.model.assigned_user_id = {
        value: this.model.assigned_user_id_input,
        label: ''
      };
    }

    if(this.defaultContactModel) {
      this.model.salutationtype = this.defaultContactModel.salutationType;
      this.model.firstname = this.defaultContactModel.name;
      this.model.mobile = this.defaultContactModel.phoneNumber;
      //this.model.homephone = this.defaultContactModel.homePhone;
      this.model.fax = this.defaultContactModel.fax;
      this.model.email = this.defaultContactModel.email;
      this.model.mailingstreet = this.defaultContactModel.address;
    }
  }

  private loadModelDetailById(sessionDto: UserLoginSessionDto, contactId: string, loader: Loading) {
    this.contactService.getContactDetail(sessionDto, contactId).subscribe(
      data => {
        this.model = data;
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
        // validate saving
        this.contactService.loadContactListFromStorage().then(
          contactList => {
            if(this.isNewMode) {
              let phoneList = contactList.map(c => c.phoneNumber || c.homePhone);
              let matchPhone = phoneList.find(p => p === this.model.mobile);
              if(matchPhone) {
                loader.dismissAll();
                super.showUIError('Số điện thoại đã được sử dụng.');
                return;
              }
            }
            else {
              let contactWithSamePhone = contactList.find(dto => dto.id !== this.model.id && (dto.phoneNumber === this.model.mobile
                || dto.homePhone === this.model.mobile));
              if(contactWithSamePhone){
                loader.dismissAll();
                super.showUIError('Số điện thoại đã được sử dụng bởi ' + contactWithSamePhone.fullName);
                return;
              }
            }
            // performing save
            this.model.assigned_user_id = this.model.assigned_user_id_input;
            this.model.modifiedby = this.model.assigned_user_id;
            //cf_837-SocialIdDateIssue
            if(this.model.cf_837 && this.model.cf_837.year && this.model.cf_837.month && this.model.cf_837.day){
              this.model.cf_837 = this.model.cf_837.year + '-' + this.model.cf_837.month + '-' + this.model.cf_837.day;
            }

            this.contactService.saveChanges(this.userSessionDto, this.model).subscribe(
              data => {
                if(data && !data.success){
                  super.showUIError(`Lỗi cập nhật dữ liệu. ${data.error.message}`);
                }else {
                  let updatedModel = data.result.record;
                  this.model.id = updatedModel.id;
                  this.dataSyncService.addOrUpdateContactModelToStorage(this.isNewMode, updatedModel)
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
        ).catch(err => {
          super.showConsoleError(err);
          loader.dismissAll();
        });
      }
    );
  }

}
