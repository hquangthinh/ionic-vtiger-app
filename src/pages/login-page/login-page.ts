import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Platform, NavController, AlertController, MenuController, LoadingController } from 'ionic-angular';
import { Network } from '@ionic-native/network';

import { STORAGE_KEYS } from '../../providers/configuration-service';
import { AuthenticationService } from '../../providers/authentication-service';
import { OfflineService } from '../../providers/offline-service';

import { LoginDto, UserLoginSessionDto } from '../../model/login-dto';
import { DashboardPage } from '../dashboard/dashboard';
import { SyncModulesPage } from '../sync-modules-page';
//import { TabsPage } from '../tabs/tabs';

@Component({
  selector: 'page-login',
  templateUrl: 'login-page.html'
})
export class LoginPage {

    model: LoginDto = {
        crmUrl: 'dea.prisma.vn',//'hnt.prisma.vn',//'hyundai.prisma.vn',//hbn.prisma.vn
        userName: 'admin',//admin
        password: 'admin123kcml'//admin123kcml789 // admin123kcml789
    };
    rememberPassword: boolean = false;
    disableInputCrmUrl: boolean = false;

    constructor(
        public platform: Platform,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public menuCtrl: MenuController,
        public storage: Storage,
        public network: Network,
        public appOfflineService: OfflineService,
        public authService: AuthenticationService) {

        this.menuCtrl.enable(false);
    }

    ionViewDidLoad() {
        // check for network status
        this.platform.ready().then(
            () => {

                this.network.onDisconnect()
                    .subscribe(() => this.appOfflineService.showOfflineModeConfirmation());

                this.storage.get(STORAGE_KEYS.storedCrmUrl).then(storedCrmUrl => {
                    if(storedCrmUrl){
                        this.model.crmUrl = storedCrmUrl;
                        this.disableInputCrmUrl = true;
                    }

                    this.storage.get(STORAGE_KEYS.rememberPassword).then(rememberPwd => {
                        this.rememberPassword = rememberPwd;
                        if(this.rememberPassword === true) {
                            this.storage.get(STORAGE_KEYS.storedUserName).then(storedUserName => {
                                this.model.userName = storedUserName;
                                this.storage.get(STORAGE_KEYS.storedPassword).then(storedPwd => {
                                    this.model.password = storedPwd;
                                });
                            });
                        }
                    });
                });
            }
        );
    }

    updateRememberPassword() {
        this.storage.set(STORAGE_KEYS.storedCrmUrl, this.model.crmUrl);
        this.storage.set(STORAGE_KEYS.rememberPassword, this.rememberPassword);
        this.storage.set(STORAGE_KEYS.storedUserName, this.model.userName);
        this.storage.set(STORAGE_KEYS.storedPassword, this.model.password);
    }

    doLogin() {
        let loader = this.loadingCtrl.create(
            {
                content: 'Please wait...',
                dismissOnPageChange: false
            }
        );
        loader.present().then(
            () => {
                this.updateRememberPassword();
                var $obs = this.authService.signin(this.model.crmUrl, this.model.userName, this.model.password);
                $obs.subscribe(
                        res => {
                            let data = res.json();
                            if(data && data.result && data.success) {
                                this.storage.set(STORAGE_KEYS.userLoginToken, data.result.login);
                                this.storage.set(STORAGE_KEYS.loginStateKey, 'OK');
                                //console.log('login ok with session -> ' + data.result.login.session);

                                let serverLoginDto = data.result.login;
                                let userLoginSession = new UserLoginSessionDto();
                                userLoginSession.createdAt = new Date();
                                userLoginSession.userid = serverLoginDto.userid;
                                userLoginSession.userIdWithModuleId = '19x' + serverLoginDto.userid;
                                userLoginSession.userName = this.model.userName;
                                userLoginSession.crm_tz = serverLoginDto.crm_tz;
                                userLoginSession.user_tz = serverLoginDto.user_tz;
                                userLoginSession.user_currency = serverLoginDto.user_currency;
                                userLoginSession.session = serverLoginDto.session;
                                userLoginSession.vtiger_version = serverLoginDto.vtiger_version;
                                userLoginSession.date_format = serverLoginDto.date_format;
                                userLoginSession.mobile_module_version = serverLoginDto.mobile_module_version;
                                userLoginSession.isOfflineMode = false;

                                if(!this.model.crmUrl.toLocaleLowerCase().startsWith('http')){
                                    userLoginSession.appBaseUrl = 'http://' + this.model.crmUrl.toLocaleLowerCase();
                                }

                                //console.log('set userLoginSession: ', userLoginSession);
                                this.storage.set(STORAGE_KEYS.userSessionId, userLoginSession);

                                loader.dismissAll();
                                this.navCtrl.setRoot(SyncModulesPage);
                                // this.navCtrl.setRoot(DashboardPage);
                            } else if(data && data.error && !data.success) {
                              this.showLoginError(data.error.message);
                              loader.dismissAll();
                            }
                            else {
                              this.showLoginError();
                              loader.dismissAll();
                            }
                        },
                        err => {
                            console.log('Error: ', err);
                            this.showLoginError();
                            loader.dismissAll();
                        },
                        () => {
                            console.log('Finish Auth');
                        });
            }
        );
    }

    // private methods
    private showLoginError(error?) {
        let alert = this.alertCtrl.create({
                        title: 'Lỗi đăng nhập',
                        subTitle: error || 'Xin vui lòng thử lại.',
                        buttons: ['OK']
                    });
        alert.present();
    }

}
