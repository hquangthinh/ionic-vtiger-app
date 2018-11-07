import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { BrowserModule } from '@angular/platform-browser';
import { IonicStorageModule } from '@ionic/storage';
//import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Camera } from '@ionic-native/camera';
import { Network } from '@ionic-native/network';

import { HttpModule, Http } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { MomentModule } from 'angular2-moment';

import { FormatFieldValueAsStringPipe, FormatFieldValueAsDateTimePipe, FormatSalutationType } from '../pipes/format-field-value.pipe';

import { AuthenticationService } from '../providers/authentication-service';
import { DashboardService } from '../providers/dashboard-service';
import { UserService } from '../providers/user-service';
import { ContactService } from '../providers/contact-service';
import { ModuleService } from '../providers/module-service';
import { DataSyncService } from '../providers/data-sync-service';
import { AlertService } from '../providers/alert-service';
import { CalendarService } from '../providers/calendar-service';
import { AccountService } from '../providers/account-service';
import { PotentialService } from '../providers/potential-service';
import { DataContextService } from '../providers/data-context-service';
import { OfflineService } from '../providers/offline-service';
import { CommentService } from '../providers/comment-service';
import { CampaignService } from '../providers/campaign-service';
import { OcrService } from '../providers/ocr-service';

import { MyApp } from './app.component';

import { BasePage } from '../pages/base-page';
import { SyncModulesPage } from '../pages/sync-modules-page';
import { LoginPage } from '../pages/login-page/login-page';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { TabsPage } from '../pages/tabs/tabs';

import { ContactPage } from '../pages/contact/contact';
import { ViewContactDetailPage } from '../pages/contact/view-contact-detail';
import { EditContactDetailPage } from '../pages/contact/edit-contact-detail';
import { PotentialListModalPage } from '../pages/contact/potential-list-modal';
import { ActivityListModalPage } from '../pages/contact/activity-list-modal';

import { AccountPage } from '../pages/account/account';
import { ViewAccountDetailPage } from '../pages/account/view-account-detail';
import { EditAccountDetailPage } from '../pages/account/edit-account-detail';
import { DynamicEditAccountDetailPage } from '../pages/account/dynamic-edit-account-detail';
import { AccountActivityListModalPage } from '../pages/account/account-activity-list-modal';
import { AccountContactListModalPage } from '../pages/account/account-contact-list-modal';
import { AccountPotentialListModalPage } from '../pages/account/account-potential-list-modal';

import { PotentialPage } from '../pages/potential/potential';
import { ViewPotentialDetailPage } from '../pages/potential/view-potential-detail';
import { EditPotentialDetailPage } from '../pages/potential/edit-potential-detail';
import { PotentialActivityListModalPage } from '../pages/potential/potential-activity-list-modal';
import { PotentialContactListModalPage } from '../pages/potential/potential-contact-list-modal';

import { SettingPage } from '../pages/setting/setting';
import { MyAlertPage } from '../pages/alert/my-alert';
import { MyCalendarPage } from '../pages/calendar/my-calendar';
import { MyCalendarDetailPage } from '../pages/calendar/my-calendar-detail';
import { EditCalendarDetailPage } from '../pages/calendar/edit-calendar-detail';
import { EditTaskDetailPage } from '../pages/calendar/edit-task-detail';
import { MyTaskPage } from '../pages/task/my-task';
import { ScanBusinessCardPage} from '../pages/scan-business-card/scan-business-card-page';
import { MyAlertListPage } from '../pages/alert/my-alert-list';
import { SearchAccountModalPage } from '../pages/modals/search-account-modal';
import { SearchContactModalPage } from '../pages/modals/search-contact-modal';
import { ProgressBarComponent } from '../components/progress-bar/progress-bar';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    FormatFieldValueAsStringPipe,
    FormatFieldValueAsDateTimePipe,
    FormatSalutationType,
    ProgressBarComponent,

    BasePage,
    SyncModulesPage,
    LoginPage,
    DashboardPage,
    TabsPage,

    ContactPage,
    ViewContactDetailPage,
    EditContactDetailPage,
    PotentialListModalPage,
    ActivityListModalPage,

    AccountPage,
    ViewAccountDetailPage,
    EditAccountDetailPage,
    DynamicEditAccountDetailPage,
    AccountActivityListModalPage,
    AccountContactListModalPage,
    AccountPotentialListModalPage,

    PotentialPage,
    ViewPotentialDetailPage,
    EditPotentialDetailPage,
    PotentialActivityListModalPage,
    PotentialContactListModalPage,

    SettingPage,
    MyAlertPage,
    MyCalendarPage,
    MyCalendarDetailPage,
    EditCalendarDetailPage,
    EditTaskDetailPage,

    MyTaskPage,
    ScanBusinessCardPage,
    MyAlertListPage,
    SearchAccountModalPage,
    SearchContactModalPage
  ],

  imports: [
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    BrowserModule,
    HttpModule, // TODO: should migrate all http from this module to httpclient of HttpClientModule
    HttpClientModule,
    MomentModule,
    TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            }
        })
  ],

  bootstrap: [IonicApp],

  entryComponents: [
    MyApp,
    BasePage,
    SyncModulesPage,
    LoginPage,
    DashboardPage,
    TabsPage,

    ContactPage,
    ViewContactDetailPage,
    EditContactDetailPage,
    PotentialListModalPage,
    ActivityListModalPage,

    AccountPage,
    ViewAccountDetailPage,
    EditAccountDetailPage,
    DynamicEditAccountDetailPage,
    AccountActivityListModalPage,
    AccountContactListModalPage,
    AccountPotentialListModalPage,

    PotentialPage,
    ViewPotentialDetailPage,
    EditPotentialDetailPage,
    PotentialActivityListModalPage,
    PotentialContactListModalPage,

    SettingPage,
    MyAlertPage,
    MyCalendarPage,
    MyCalendarDetailPage,
    EditCalendarDetailPage,
    EditTaskDetailPage,

    MyTaskPage,
    ScanBusinessCardPage,
    MyAlertListPage,
    SearchAccountModalPage,
    SearchContactModalPage
  ],

  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    StatusBar,
    SplashScreen,
    Network,
    Camera,

    AuthenticationService,
    DashboardService,
    UserService,
    ContactService,
    ModuleService,
    DataSyncService,
    AlertService,
    CalendarService,
    AccountService,
    PotentialService,
    DataContextService,
    OfflineService,
    CommentService,
    CampaignService,
    OcrService
  ]
})
export class AppModule {}
