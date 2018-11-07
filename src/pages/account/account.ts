import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';

import { STORAGE_KEYS, SORTED_FIELDS  } from '../../providers/configuration-service';
import { UserLoginSessionDto } from '../../model/login-dto';
import { AccountDto } from '../../model/shared-dto';
import { KeywordSearchCommand } from '../../model/search-commands';
import { UserService } from '../../providers/user-service';
import { AccountService } from '../../providers/account-service';
import { DataSyncService } from '../../providers/data-sync-service';

import { BasePage } from '../base-page';
import { ViewAccountDetailPage } from './view-account-detail';
import { EditAccountDetailPage } from './edit-account-detail';

@Component({
  selector: 'page-account',
  templateUrl: 'account.html'
})
export class AccountPage extends BasePage {

    private accounts: Array<AccountDto> = new Array<AccountDto>();
    bSortByAccountName: boolean = false;
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
      public accountService: AccountService,
      public dataSyncService: DataSyncService
    ) {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    }

    ionViewDidEnter() {
      let loader = super.createLoading();
      loader.present().then(
        () => {
          this.loadAccounts('', '').then(
            (data) => {
              loader.dismissAll();
              if(data && data.length === 0) {
                this.refreshServer('');
              }
            }
          );
        }
      );
    }

    loadAccounts(keyword: string, sortedField: string): Promise<any>{
      if(!keyword || keyword == ''){
        return this.accountService.loadAccountListFromStorage().then(
          data => {
            this.accounts = this.sortData(data, sortedField);
            return this.accounts;
          }
        );
      }

      return this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          this.dataSyncService.syncAccountModuleData(userSessionDto, this.storage).then(
                syncData => {
                  this.searchAccountsFromStorage(keyword);
                }
              ).catch(super.showConsoleError);
          }
      );
    }

    private sortData(dataList: AccountDto[], sortedField: string): AccountDto[] {

      if(!sortedField || sortedField == '')
        return dataList;

      return dataList.sort((a,b) => {
        if(sortedField === SORTED_FIELDS.AccountName){
          return this.sortByAccountNameComparer(a,b);
        }else if(sortedField === SORTED_FIELDS.AccountCreatedTime){
          return this.sortByCreatedTimeComparer(a,b);
        }
        return this.sortByModifiedTimeComparer(a,b);
      });
    }

    private sortByAccountNameComparer(a: AccountDto, b: AccountDto): number {
      if(a && b && a.accountname && b.accountname)
        return a.accountname.localeCompare(b.accountname);
      return 0;
    }

    private sortByCreatedTimeComparer(a: AccountDto, b: AccountDto): number {
      if(a && b && a.createdtime && b.createdtime){
        let createdTime1 = new Date(a.createdtime);
        let createdTime2 = new Date(b.createdtime);
        return createdTime1 < createdTime2 ? -1 :
          createdTime1 > createdTime2 ? 1 : 0;
      }
    }

    private sortByModifiedTimeComparer(a: AccountDto, b: AccountDto): number {
      if(a && b && a.modifiedtime && b.modifiedtime){
        let modifiedTime1 = new Date(a.modifiedtime);
        let modifiedTime2 = new Date(b.modifiedtime);
        return modifiedTime1 < modifiedTime2 ? -1 :
          modifiedTime1 > modifiedTime2 ? 1 : 0;
      }
    }

    // search offline data trigger by search bar
    searchAccounts(ev) {
      this.searchAccountsFromStorage(ev.target.value || '');
    }

    private searchAccountsFromStorage(keyword: string) {
      let searchCommand = new KeywordSearchCommand();
      searchCommand.keyword = keyword;
      this.accountService.searchAccountsFromStorage(searchCommand).then(
        searchRes => this.accounts = searchRes
      ).catch(super.showConsoleError);
    }

    // cancel search on search bar
    cancelSearch(ev) {
      super.showConsoleError(ev);
    }

    viewAccountDetail(dto: AccountDto) {
      this.navCtrl.push(ViewAccountDetailPage, { accountId: dto.id });
    }

    // go to edit page, only avaliable for online mode
    editAccountDetail(dto: AccountDto) {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Cannot edit record when app in offline mode');
            return;
          }else{
            this.navCtrl.push(EditAccountDetailPage, { accountId: dto.id });
          }
        }
      );
    }

    // request delete from server and local store
    deleteAccount(dto: AccountDto) {
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

    private performDeleteRecord(userSessionDto: UserLoginSessionDto, dto: AccountDto) {
      let loader = super.createLoading();
      loader.present().then(
        () => {
            // delete from local storage
            let res1 = this.storage.get(STORAGE_KEYS.accountModuleSyncData).then(
              storedData => {
                let deletedIndex = storedData.findIndex(
                  item => item.id === dto.id
                );
                if(deletedIndex > -1) {
                  storedData.splice(deletedIndex, 1);
                  return this.storage.set(STORAGE_KEYS.accountModuleSyncData, storedData);
                }
                return storedData;
              }
            );

            // delete from server
            let res2 = this.accountService.deleteAccount(userSessionDto, dto.id);
            Promise.all([res1, res2]).then(
              () => {
                // reload data list
                this.loadAccounts('', '').then(
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

    // go to add new page
    addAccount() {
      this.userService.getCurrentUserSessionId().then(
        userSessionDto => {
          if(userSessionDto.isOfflineMode){
            super.showUIMessage('Không thể tạo mới dữ liệu khi app đang ở chể độ offline.');
            return;
          }else{
            this.navCtrl.push(EditAccountDetailPage, { accountId: "0"});
          };
        }
      );
    }

    resetSearch() {
      this.ionViewDidEnter();
      this.localSearchKeyword = "";
    }

    // sort offline data and reload the list
    openSortOptionsModal() {
      let alert = this.alertCtrl.create();
      alert.setTitle('Sort By');

      alert.addInput({
        type: 'radio',
        label: 'Account Name',
        value: 'accountname',
        checked: this.bSortByAccountName
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
          this.bSortByAccountName = "accountname" === data;
          this.bSortByCreatedDate = "createdtime" === data;
          this.bSortByModifedDate = "modifiedtime" === data;

          if(this.bSortByCreatedDate) {
            this.loadAccounts('', SORTED_FIELDS.AccountCreatedTime);
          }

          if(this.bSortByModifedDate){
            this.loadAccounts('', SORTED_FIELDS.AccountModifiedTime);
          }

          if(this.bSortByAccountName){
            this.loadAccounts('', SORTED_FIELDS.AccountName);
          }

        }
      });
      alert.present();
    }

    refreshServer(searchKeyword: string) {
      let sortedField = SORTED_FIELDS.AccountModifiedTime;
      if(this.bSortByCreatedDate)
        sortedField = SORTED_FIELDS.AccountCreatedTime;
      else if(this.bSortByAccountName)
        sortedField = SORTED_FIELDS.AccountName;

      let loader = super.createLoading();
      loader.present().then(
        () => {
          return this.userService.getCurrentUserSessionId().then(
            userSessionDto => {
              this.dataSyncService.syncAccountModuleData(userSessionDto, this.storage).then(
                    syncData => {
                      this.loadAccounts('','').then(
                        () => loader.dismissAll()
                      ).catch(super.showConsoleError);
                    }
                  ).catch(super.showConsoleError);
              }
          );
        }
      );
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
              let sortedField = SORTED_FIELDS.AccountModifiedTime;
              if(this.bSortByCreatedDate)
                sortedField = SORTED_FIELDS.AccountCreatedTime;
              else if(this.bSortByAccountName)
                sortedField = SORTED_FIELDS.AccountName;

              let loader = super.createLoading();

              loader.present().then(
                () => {
                  this.loadAccounts(data.keyword, sortedField).then(
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
