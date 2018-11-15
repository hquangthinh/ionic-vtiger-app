import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { CallNumber } from '@ionic-native/call-number';
import { STORAGE_KEYS, SORTED_FIELDS  } from '../../providers/configuration-service';
import { UserLoginSessionDto } from '../../model/login-dto';
import { PotentialDto } from '../../model/shared-dto';
import { KeywordSearchCommand } from '../../model/search-commands';
import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';
import { PotentialService } from '../../providers/potential-service';
import { DataSyncService } from '../../providers/data-sync-service';

import { BasePage } from '../base-page';
import { ViewPotentialDetailPage } from './view-potential-detail';
import { EditPotentialDetailPage } from './edit-potential-detail';

@Component({
  selector: 'page-potential',
  templateUrl: 'potential.html'
})
export class PotentialPage extends BasePage {

    private potentials: Array<PotentialDto> = new Array<PotentialDto>();
    bSortByPotentialName: boolean = false;
    bSortByCreatedDate: boolean = false;
    bSortByModifedDate: boolean = true;
    localSearchKeyword: string = "";

    constructor(
      public menuCtrl: MenuController,
      public navCtrl: NavController,
      public loadingCtrl: LoadingController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public storage: Storage,
      public translate: TranslateService,
      public userService: UserService,
      public potentialService: PotentialService,
      public dataSyncService: DataSyncService,
      public contactService: ContactService,
      public callNumber: CallNumber
    )
    {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    }

    ionViewDidEnter() {
      let loader = super.createLoading();
      loader.present().then(
        () => {
          this.loadPotentials('', '').then(
            data => {
              loader.dismissAll();
              if(data && data.length === 0) {
                this.refreshServer('');
              }
            }
          );
        }
      );
    }

    loadPotentials(keyword: string, sortedField: string): Promise<any>{

      if(!keyword || keyword == ''){
        return this.potentialService.loadPotentialListFromStorage().then(
          data => {
            this.potentials = this.sortData(data, sortedField);
            return this.potentials;
          }
        );
      }

      return this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          this.dataSyncService.syncPotentialModuleData(userSessionDto, this.storage).then(
                syncData => {
                  this.searchPotentialsFromStorage(keyword);
                }
              ).catch(super.showConsoleError);
          }
      );
    }

    private sortData(dataList: PotentialDto[], sortedField: string): PotentialDto[] {

      if(!sortedField || sortedField == '')
        return dataList;

      return dataList.sort((a,b) => {
        if(sortedField === SORTED_FIELDS.PotentialName){
          return this.sortByNameComparer(a,b);
        }else if(sortedField === SORTED_FIELDS.PotentialCreatedTime){
          return this.sortByCreatedTimeComparer(a,b);
        }
        return this.sortByModifiedTimeComparer(a,b);
      });
    }

    private sortByNameComparer(a: PotentialDto, b: PotentialDto): number {
      if(a && b && a.potentialname && b.potentialname)
        return a.potentialname.localeCompare(b.potentialname);
      return 0;
    }

    private sortByCreatedTimeComparer(a: PotentialDto, b: PotentialDto): number {
      if(a && b && a.createdtime && b.createdtime){
        let createdTime1 = new Date(a.createdtime);
        let createdTime2 = new Date(b.createdtime);
        return createdTime1 < createdTime2 ? -1 :
          createdTime1 > createdTime2 ? 1 : 0;
      }
    }

    private sortByModifiedTimeComparer(a: PotentialDto, b: PotentialDto): number {
      if(a && b && a.modifiedtime && b.modifiedtime){
        let modifiedTime1 = new Date(a.modifiedtime);
        let modifiedTime2 = new Date(b.modifiedtime);
        return modifiedTime1 < modifiedTime2 ? -1 :
          modifiedTime1 > modifiedTime2 ? 1 : 0;
      }
    }

    // search offline data trigger by search bar
    searchPotentials(ev) {
      this.searchPotentialsFromStorage(ev.target.value || '');
    }

    private searchPotentialsFromStorage(keyword: string) {
      let searchCommand = new KeywordSearchCommand();
      searchCommand.keyword = keyword;
      this.potentialService.searchPotentialsFromStorage(searchCommand).then(
        searchRes => this.potentials = searchRes
      ).catch(super.showConsoleError);
    }

    // cancel search on search bar
    cancelSearch(ev) {
      console.log(ev);
    }

    viewPotentialDetail(dto: PotentialDto) {
      this.navCtrl.push(ViewPotentialDetailPage, { potentialId: dto.id });
    }

    editPotentialDetail(dto: PotentialDto) {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Cannot edit record when app in offline mode');
            return;
          }else{
            this.navCtrl.push(EditPotentialDetailPage, { potentialId: dto.id });
          }
        }
      );
    }

    deletePotential(dto: PotentialDto) {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Không thể xoá dữ liệu khi app đang ở chể độ offline.');
            return;
          }else{
            this.performDeleteRecord(userSessionDto, dto);
          };
        }
      );
    }

    private performDeleteRecord(userSessionDto: UserLoginSessionDto, dto: PotentialDto) {
      let loader = super.createLoading();
      loader.present().then(
        () => {
            // delete from local storage
            let res1 = this.storage.get(STORAGE_KEYS.potentialModuleSyncData).then(
              storedData => {
                let deletedIndex = storedData.findIndex(
                  item => item.id === dto.id
                );
                if(deletedIndex > -1) {
                  storedData.splice(deletedIndex, 1);
                  return this.storage.set(STORAGE_KEYS.potentialModuleSyncData, storedData);
                }
                return storedData;
              }
            );

            // delete from server
            let res2 = this.potentialService.deletePotential(userSessionDto, dto.id);
            Promise.all([res1, res2]).then(
              () => {
                // reload data list
                this.loadPotentials('', '').then(
                  () => {
                    loader.dismissAll();
                    super.showToastMessage('Dữ liệu đã được xoá');
                  }
                );
              }
            );
        }
      );
    }

    resetSearch() {
      this.ionViewDidEnter();
      this.localSearchKeyword = "";
    }

    // go to add potential page
    addPotential() {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Không thể tạo mới dữ liệu khi app đang ở chể độ offline.');
            return;
          }else{
            this.navCtrl.push(EditPotentialDetailPage, { potentialId: "0" });
          };
        }
      );
    }

    openSortOptionsModal() {
      let alert = this.alertCtrl.create();
      alert.setTitle('Sort By');

      alert.addInput({
        type: 'radio',
        label: 'Potential Name',
        value: 'potentialname',
        checked: this.bSortByPotentialName
      });
      alert.addInput({
        type: 'radio',
        label: 'Created Date',
        value: 'createdtime',
        checked: this.bSortByCreatedDate
      });
      alert.addInput({
        type: 'radio',
        label: 'Modifed Date',
        value: 'modifiedtime',
        checked: this.bSortByModifedDate
      });

      alert.addButton('Cancel');
      alert.addButton({
        text: 'OK',
        handler: data => {
          this.bSortByPotentialName = "potentialname" === data;
          this.bSortByCreatedDate = "createdtime" === data;
          this.bSortByModifedDate = "modifiedtime" === data;

          if(this.bSortByCreatedDate) {
            this.loadPotentials('', SORTED_FIELDS.PotentialCreatedTime);
          }

          if(this.bSortByModifedDate){
            this.loadPotentials('', SORTED_FIELDS.PotentialModifiedTime);
          }

          if(this.bSortByPotentialName){
            this.loadPotentials('', SORTED_FIELDS.PotentialName);
          }

        }
      });
      alert.present();
    }

    refreshServer(searchKeyword: string) {
      let sortedField = SORTED_FIELDS.PotentialModifiedTime;
      if(this.bSortByCreatedDate)
        sortedField = SORTED_FIELDS.PotentialCreatedTime;
      else if(this.bSortByPotentialName)
        sortedField = SORTED_FIELDS.PotentialName;

      let loader = super.createLoading();
      loader.present().then(
        () => {
          return this.userService.getCurrentUserSessionId().then(
            userSessionDto => {
              this.dataSyncService.syncPotentialModuleData(userSessionDto, this.storage).then(
                    syncData => {
                      this.loadPotentials('','').then(
                        () => loader.dismissAll()
                      ).catch(super.showConsoleError);
                    }
                  ).catch(super.showConsoleError);
              }
          );
        }
      );
    }

    openSearchPotentialsModal() {
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
              this.refreshServer(data.keyword);
            }
          }
        ]
      });
      alert.present();
    }

    callPerson(dto: PotentialDto) {
      // console.log('make call ', dto.contact_id);

      if(!this.callNumber.isCallSupported()) {
        super.showUIError('Không thể thực hiện cuộc gọi. Có thể do quyền truy cập chưa đủ.');
        return;
      }

      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          this.contactService.getContactDetail(userSessionDto, dto.contact_id)
            .subscribe(
              contactDto => {
                const phoneNo = contactDto && (contactDto.phoneNumber || contactDto.homePhone);
                if(phoneNo) {
                  this.callNumber.callNumber(phoneNo, true)
                    .then(res => console.log('Launched dialer!', res))
                    .catch(err => console.log('Error launching dialer', err));
                }
              },
              super.showUIError
            );
        }
      );
    }

}
