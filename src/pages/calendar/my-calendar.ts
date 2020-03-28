import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController,
  MenuController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
// import { APP_CONSTANTS, API_URLS, STORAGE_KEYS, MODULE_NAMES  } from '../../providers/configuration-service';
import { UserLoginSessionDto } from '../../model/login-dto';
import { CalendarDto, CalendarGroupDto, CALENDAR_EVENT_TYPES } from '../../model/shared-dto';
import { KeywordSearchCommand } from '../../model/search-commands';
import { UserService } from '../../providers/user-service';
import { CalendarService } from '../../providers/calendar-service';
import { DataSyncService } from '../../providers/data-sync-service';

import { BasePage } from '../base-page';
import { MyCalendarDetailPage } from './my-calendar-detail';
import { EditCalendarDetailPage } from './edit-calendar-detail';
import { EditTaskDetailPage } from './edit-task-detail';

@Component({
  selector: 'page-my-calendar',
  templateUrl: 'my-calendar.html'
})
export class MyCalendarPage extends BasePage {

    private calendars: Array<CalendarGroupDto> = new Array<CalendarGroupDto>();
    private localSearchKeyword = '';
    private currentUserSessionDto: UserLoginSessionDto;

    constructor(
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public storage: Storage,
        public translate: TranslateService,
        public userService: UserService,
        public calendarService: CalendarService,
        public dataSyncService: DataSyncService
    )
    {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    }

    ionViewDidEnter() {
      let loader = super.createLoading();
      loader.present().then(
        () => {
          this.userService.getCurrentUserSessionId().then(
            userSessionDto => {
              this.currentUserSessionDto = userSessionDto;
              this.loadCalendars('').then(
                (data) => loader.dismissAll()
              );
            }
          );
        }
      );
    }

    loadCalendars(keyword: string): Promise<any>{
      return this.calendarService.loadCalendarListFromStorage(this.currentUserSessionDto).then(
        data => {
          this.calendars = data;
          //console.log('calendar list :', this.calendars);
          return data;
        }
      );
    }

    searchCalendars(ev) {
      this.searchCalendarsFromStorage(ev.target.value || '');
    }

    private searchCalendarsFromStorage(keyword: string) {
      let searchCommand = new KeywordSearchCommand();
      searchCommand.keyword = keyword;
      this.calendarService.searchCalendarsFromStorage(searchCommand, this.currentUserSessionDto).then(
        searchRes => this.calendars = searchRes
      ).catch(super.showConsoleError);
    }

    // cancel search on search bar
    cancelSearch(ev) {
      super.showConsoleError(ev);
    }

    viewCalendarDetail(dto: CalendarDto) {
      this.navCtrl.push(MyCalendarDetailPage, { selectedId: dto.id });
    }

    editCalendarDetail(dto: CalendarDto) {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Cannot edit record when app in offline mode');
            return;
          }else{
            if(dto.eventType === CALENDAR_EVENT_TYPES.task){
              this.navCtrl.push(EditTaskDetailPage, { selectedId: dto.id });
            }else if(dto.eventType === CALENDAR_EVENT_TYPES.event){
              this.navCtrl.push(EditCalendarDetailPage, { selectedId: dto.id });
            }else{
              console.log(dto);
            }
          }
        }
      );
    }

    deleteCalendar(dto: CalendarDto) {

    }

    addEvent() {
      this.performAddCalendarEntry(
        () => this.navCtrl.push(EditCalendarDetailPage, { selectedId: '0'})
      );
    }

    addTask() {
      this.performAddCalendarEntry(
        () => this.navCtrl.push(EditTaskDetailPage, { selectedId: '0'})
      );
    }

    private performAddCalendarEntry(addAction) {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Cannot add record when app in offline mode');
            return;
          }else{
            addAction();
          }
        }
      );
    }

    refreshServer(searchKeyword: string) {

      let loader = super.createLoading();
      loader.present().then(
        () => {
          return this.userService.getCurrentUserSessionId().then(
            userSessionDto => {
              this.dataSyncService.syncCalendarModuleData(userSessionDto, this.storage).then(
                    syncData => {
                      this.loadCalendars('').then(
                        () => loader.dismissAll()
                      ).catch(super.showConsoleError);
                    }
                  ).catch(super.showConsoleError);
              }
          );
        }
      );
    }

    resetSearch() {
      this.ionViewDidEnter();
      this.localSearchKeyword = "";
    }

    // sync updated result from server to offline store then search
    openSearchAccountsModal() {
      let alert = this.alertCtrl.create({
        title: 'Search',
        inputs: [
          {
            name: 'keyword',
            placeholder: 'Search keyword'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: data => {
            }
          },
          {
            text: 'Search',
            handler: data => {

              let loader = super.createLoading();

              loader.present().then(
                () => {
                  this.loadCalendars(data.keyword).then(
                    () => loader.dismissAll()
                  ).catch(super.showConsoleError);
                }
              );
            }
          }
        ]
      });
      alert.present();
    }

}
