import {Observable} from 'rxjs';
import { Component } from '@angular/core';
import { MenuController, NavController, LoadingController, AlertController, NavParams,
  Loading, ToastController, ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserLoginSessionDto } from '../../model/login-dto';
import { UserDetailDto } from '../../model/user-detail-dto';

import { UserService } from '../../providers/user-service';
import { ModuleService } from '../../providers/module-service';
// import { DataFormatUtil } from '../../utils/data-format-util';
import { CalendarService } from '../../providers/calendar-service';
import { DataSyncService } from '../../providers/data-sync-service';

// import { BasePage } from '../base-page';
import { EditCalendarDetailPage } from './edit-calendar-detail';

@Component({
  selector: 'page-edit-task-detail',
  templateUrl: 'edit-task-detail.html'
})
export class EditTaskDetailPage extends EditCalendarDetailPage {

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
      super(menuCtrl, navCtrl, navParams, loadingCtrl, alertCtrl,
        toastCtrl, modalCtrl, translate, moduleService, userService,
        calendarService, dataSyncService);
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
            this.pageTitle = "Add Task";
        }else{
            this.pageTitle = "Edit Task";
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
			"time_end": "",
			"due_date": "",
			"taskstatus": "Planned",
			"eventstatus": "",
			"taskpriority": "High",
			"sendnotification": "1",
			"activitytype": "Task",
			"visibility": "Private",
			"description": "",
			"duration_hours": "",
			"duration_minutes": "",
			"location": "",
			"reminder_time": "",
			"recurringtype": "",
			"notime": "0"
		};

        // default values
        if(sessionDto) {
            this.model.assigned_user_id_input = '19x' + sessionDto.userid;
            this.model.assigned_user_id = {
                value: this.model.assigned_user_id_input,
                label: ''
            };
            this.model.date_start = new Date().toISOString();
            this.model.due_date = new Date().toISOString();
        }
    }

}
