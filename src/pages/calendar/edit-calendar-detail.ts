import {Observable} from 'rxjs';
import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController, NavParams,
  Loading, ToastController, ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserLoginSessionDto } from '../../model/login-dto';
import { UserDetailDto } from '../../model/user-detail-dto';
// import { CALENDAR_EVENT_TYPES } from '../../model/shared-dto';

import { UserService } from '../../providers/user-service';
import { ModuleService, PickListDto } from '../../providers/module-service';
// import { DataFormatUtil } from '../../utils/data-format-util';
import { CalendarService } from '../../providers/calendar-service';
import { DataSyncService } from '../../providers/data-sync-service';

import { BasePage } from '../base-page';

@Component({
  selector: 'page-edit-calendar-detail',
  templateUrl: 'edit-calendar-detail.html'
})
export class EditCalendarDetailPage extends BasePage {

    pageTitle: string = "Edit Event";
    selectedId: any;
    model : any = {};
    userSessionDto: UserLoginSessionDto;
    isNewMode: boolean = false;
    allUserList: Array<UserDetailDto> = new Array<UserDetailDto>();
    eventStatusList: Array<PickListDto> = new Array<PickListDto>();
    activityTypeList: Array<PickListDto> = new Array<PickListDto>();

    constructor(
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public navParams: NavParams,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public modalCtrl: ModalController,
        public translate: TranslateService,
        public moduleService: ModuleService,
        public userService: UserService,
        public calendarService: CalendarService,
        public dataSyncService: DataSyncService,
    )
    {
      super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      this.selectedId = navParams.get('selectedId');
    }


  ionViewDidLoad() {

    this.setPageMode(this.selectedId);
    let loader = super.createLoading();
    loader.present().then(
      () => this.loadDataForEdit(loader)
    );
  }

  protected loadDataForEdit(loader: Loading) {
    this.userService.getCurrentUserSessionId().then(
      sessionDto => {
        this.userSessionDto = sessionDto;

        let obModuleMeta = this.moduleService.getCalendarModuleMetadataFromCache();
        let obUsers = this.userService.getAllSystemUsersFromStorage();

        Observable.zip(obModuleMeta, obUsers).subscribe(dataList => {
            let formMeta = dataList[0];
            let userData = dataList[1];

            if(formMeta) {
              this.eventStatusList = formMeta.eventStatusList;
              this.activityTypeList = formMeta.activityTypeList.filter(item => item.value !== 'Task');
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
              this.loadModelDetailById(this.userSessionDto, this.selectedId, loader);
            }
          }
        );
      }
    ).catch(super.showConsoleError);
  }

  protected setPageMode(modelId: any) {
    if("0" === modelId){
      this.isNewMode = true;
      this.pageTitle = "Add Event";
    }
  }

  protected initModelForCreatingNew(sessionDto: UserLoginSessionDto) {
    this.model = {
			"subject": "",
			"assigned_user_id": {
				"value": "",
				"label": ""
			},
			"date_start": "",
			"time_start": "",
			"due_date": "",
			"time_end": "",
			"recurringtype": "--None--",//"Daily",
			"duration_hours": "",
			"duration_minutes": "",
			"eventstatus": "",
			"sendnotification": "0",
			"activitytype": "",
			"notime": "0",
			"visibility": "Public"
		};

    // default values
    if(sessionDto) {
      this.model.assigned_user_id_input = sessionDto.userIdWithModuleId;
      this.model.assigned_user_id = {
        value: this.model.assigned_user_id_input,
        label: ''
      };
      this.model.date_start = new Date().toISOString();
      this.model.due_date = new Date().toISOString();
    }
  }

  protected loadModelDetailById(sessionDto: UserLoginSessionDto, modelId: string, loader: Loading) {
    this.calendarService.getCalendarDetail(sessionDto, modelId).subscribe(
      data => {
        this.model = data;
        this.model.assigned_user_id_input = this.model.assigned_user_id.value;
        //console.log('model : ', this.model);
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
        this.calendarService.saveChanges(this.userSessionDto, this.model).subscribe(
          data => {
            if(data && !data.success){
              super.showUIError(`Lỗi cập nhật dữ liệu. ${data.error.message}`);
            }else {
              let updatedModel = data.result.record;
              this.model.id = updatedModel.id;
              this.dataSyncService.addOrUpdateCalendarModelToStorage(this.isNewMode, updatedModel)
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
