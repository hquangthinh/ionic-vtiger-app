import { Injectable } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { STORAGE_KEYS } from './configuration-service';

@Injectable()
export class OfflineService {

    constructor(
        public platform: Platform,
        public alertCtrl: AlertController,
        public storage: Storage
    ){
    }

    public showOfflineModeConfirmation(): Promise<any> {
        let alert = this.alertCtrl.create({
                        title: 'Lỗi kết nối',
                        subTitle: 'Không thể kết nối đến internet. Bạn có muốn hoạt động ở chế độ offline?',
                        buttons: [
                            {
                                text: 'Exit App',
                                handler: data => {
                                    this.platform.exitApp();
                                }
                            },
                            {
                                text: 'Continue Offline',
                                handler: data => {
                                    console.log('switchAppToOfflineMode');
                                    this.switchAppToOfflineMode();
                                }
                            }
                        ]
                    });
        return alert.present();
    }

    public switchAppToOfflineMode(): Promise<any> {
        let userSessionDtoRes = this.storage.get(STORAGE_KEYS.userSessionId);
        let userDetailDtoRes = this.storage.get(STORAGE_KEYS.userDetailDtoKey);

        return Promise.all([userSessionDtoRes, userDetailDtoRes]).then(
            values => {
                if(!values || !values[0] || !values[1]){
                    let alert = this.alertCtrl.create({
                        title: 'Lỗi',
                        subTitle: 'App chưa có dữ liệu offline. Bạn hãy kiểm tra kết nối internet và thử lại.',
                        buttons: [{
                            text: 'Exit App',
                            handler: data => {
                                this.platform.exitApp();
                            }
                        }]
                    });
                    return alert.present();
                }
                let userSessionDto = values[0];
                userSessionDto.isOfflineMode = true;
                return this.storage.set(STORAGE_KEYS.userSessionId, userSessionDto);
            }
        );
    }
}
