/**
 * Perform data sync with server for offline access
 */
import {Observable} from 'rxjs';
import {Http, Headers} from '@angular/http'
import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, MODULE_NAMES, API_OPERATIONS, STORAGE_KEYS } from './configuration-service';
import { UserService } from './user-service';
import { ModuleService } from './module-service';
// import { BaseQueryCommand, FetchModuleQueryForAlertCommand } from '../model/search-commands';
import { UserLoginSessionDto } from '../model/login-dto';

@Injectable()
export class DataSyncService {
    constructor(
        public http: Http,
        public storage: Storage,
        public userService: UserService,
        public moduleService: ModuleService
    ){}

    // load current user detail from server and store in local web storage
    public syncUserDetail(sessionDto: UserLoginSessionDto, storage: Storage, userService: UserService): Promise<any> {
      return new Promise(
        function(resolve, rejected) {
          //console.log('start syncUserDetail');
          userService.getUserDetail(sessionDto, '19x' + sessionDto.userid).subscribe(
            data => {
              //console.log(data);
              storage.set(STORAGE_KEYS.userDetailDtoKey, data);
              //console.log('resolve syncUserDetail');
              resolve(data);
            },
            err => {
              //console.log(err);
              rejected(err);
            }
          );
        }
      );
    }

    // sync all users from system store to local storage
    public syncAllUsers(sessionDto: UserLoginSessionDto, storage: Storage, userService: UserService): Promise<any> {
        return new Promise(
            function(resolve, rejected) {
                //console.log('start syncAllUsers');
                userService.getAllSystemUsers(sessionDto).subscribe(
                    data => {
                        storage.set(STORAGE_KEYS.allSystemUsers, data);
                        //console.log('resolve syncAllUsers');
                        resolve(data);
                    },
                    err => rejected(err)
                );
            }
        );
    }

    // sync metadata for Calendar module
    public syncCalendarModulePickList(sessionDto: UserLoginSessionDto, storage: Storage, moduleService: ModuleService): Promise<any> {
      return new Promise(
        function(resolve, rejected) {
          storage.remove(STORAGE_KEYS.calendarModulePickList).then(
            () => {
              //console.log('start sync calendarModulePickList');
              moduleService.getCalendarModuleMetadata(sessionDto).subscribe(
                data => {
                  storage.set(STORAGE_KEYS.calendarModulePickList, data);
                  //console.log('resolve -> calendarModulePickList');
                  resolve(data);
                },
                err => {
                  //console.log('rejected -> calendarModulePickList');
                  rejected(err);
                }
              );
            }
          );
        }
      );
    }

    // sync form schema metadata for contact, account, potential
    public syncFormSchemaMetadata(sessionDto: UserLoginSessionDto, storage: Storage, moduleService: ModuleService) : Promise<any> {
        return new Promise(
            function(resolve, rejected) {
                let removeContactPs = storage.remove(STORAGE_KEYS.contactModuleFormSchema);
                let removeAccountPs = storage.remove(STORAGE_KEYS.accountModuleFormSchema);
                let removePotentialPs = storage.remove(STORAGE_KEYS.potentialModuleFormSchema);
                Promise.all([removeContactPs, removeAccountPs, removePotentialPs]).then(
                    () => {
                        let syncContactMetaOb = moduleService.getContactModuleFormSchema(sessionDto);
                        let syncAccountMetaOb = moduleService.getAccountModuleFormSchema(sessionDto);
                        let syncPotentialMetaOb = moduleService.getPotentialModuleMetadata(sessionDto);
                        Observable.zip(syncContactMetaOb, syncAccountMetaOb, syncPotentialMetaOb)
                            .subscribe(metadataList => {
                                let ps1 = storage.set(STORAGE_KEYS.contactModuleFormSchema, metadataList[0]);
                                let ps2 = storage.set(STORAGE_KEYS.accountModuleFormSchema, metadataList[1]);
                                let ps3 = storage.set(STORAGE_KEYS.potentialModuleFormSchema, metadataList[2]);
                                Promise.all([ps1, ps2, ps3])
                                    .then(() => resolve(metadataList))
                                    .catch(err => rejected(err));
                            },
                            err => rejected(err));
                    }
                );
            }
        );
    }


    // sync metadata for Contact module
    public syncContactModulePickList(sessionDto: UserLoginSessionDto, storage: Storage, moduleService: ModuleService): Promise<any> {
      return new Promise(
        function(resolve, rejected) {
          storage.remove(STORAGE_KEYS.contactModulePickList).then(
            () => {
              //console.log('start sync contactModulePickList');
              moduleService.getContactModuleMetadata(sessionDto).subscribe(
                data => {
                  storage.set(STORAGE_KEYS.contactModulePickList, data);
                  //console.log('resolve -> contactModulePickList');
                  resolve(data);
                },
                err => {
                  //console.log('rejected -> contactModulePickList');
                  rejected(err);
                }
              );
            }
          );
        }
      );
    }

    // sync metadata for Potential module
    public syncPotentialModulePickList(sessionDto: UserLoginSessionDto, storage: Storage, moduleService: ModuleService): Promise<any> {
      return new Promise(
        function(resolve, rejected) {
          storage.remove(STORAGE_KEYS.potentialModulePickList).then(
            () => {
              //console.log('start sync potentialModulePickList');
              moduleService.getPotentialModuleMetadata(sessionDto).subscribe(
                data => {
                  storage.set(STORAGE_KEYS.potentialModulePickList, data);
                  //console.log('resolve -> potentialModulePickList');
                  resolve(data);
                },
                err => {
                  //console.log('rejected -> potentialModulePickList');
                  rejected(err);
                }
              );
            }
          );
        }
      );
    }

    // sync contact module data
    public syncContactModuleData(sessionDto: UserLoginSessionDto, storage: Storage) : Promise<any> {
        return new Promise(
            (resolved, rejected) => {
                let sessionId = sessionDto.session;
                let reqParams = `_operation=${API_OPERATIONS.syncModuleRecords}&_session=${sessionId}&module=${MODULE_NAMES.Contacts}`
                    + `&mode=PUBLIC`;
                let header = new Headers();
                header.append('Content-Type', 'application/x-www-form-urlencoded');
                let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

                this.http.post(url, reqParams, {
                    headers: header
                })
                .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
                .subscribe(
                    res => {
                        // let data = res.json();
                        let data = JSON.parse(res.text().trim());
                        this.storeModuleData(data, storage, STORAGE_KEYS.contactModuleSyncData).then( () => resolved(data) );
                    },
                    err => {
                        console.log(err);
                        rejected(err);
                    }
                );
            }
        );
    }

    // sync potential module data
    public syncPotentialModuleData(sessionDto: UserLoginSessionDto, storage: Storage) : Promise<any> {
        return new Promise(
            (resolved, rejected) => {
                let sessionId = sessionDto.session;
                let reqParams = `_operation=${API_OPERATIONS.syncModuleRecords}&_session=${sessionId}&module=${MODULE_NAMES.Potentials}`
                    + `&mode=PUBLIC`;
                let header = new Headers();
                header.append('Content-Type', 'application/x-www-form-urlencoded');
                let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

                this.http.post(url, reqParams, {
                    headers: header
                })
                .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
                .subscribe(
                    res => {
                        // let data = res.json();
                        let data = JSON.parse(res.text().trim());
                        this.storeModuleData(data, storage, STORAGE_KEYS.potentialModuleSyncData).then( () => resolved(data) );
                    },
                    err => {
                        //console.log(err);
                        rejected(err);
                    }
                );
            }
        );
    }

    // sync calendar module data
    public syncCalendarModuleData(sessionDto: UserLoginSessionDto, storage: Storage) : Promise<any> {
        return new Promise(
            (resolved, rejected) => {
                let sessionId = sessionDto.session;
                let reqParams = `_operation=${API_OPERATIONS.syncModuleRecords}&_session=${sessionId}&module=${MODULE_NAMES.Calendar}`
                    + `&mode=PUBLIC`;
                let header = new Headers();
                header.append('Content-Type', 'application/x-www-form-urlencoded');
                let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

                this.http.post(url, reqParams, {
                    headers: header
                })
                .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
                .subscribe(
                    res => {
                        // let data = res.json();
                        let data = JSON.parse(res.text().trim());
                        this.storeModuleData(data, storage, STORAGE_KEYS.calendarModuleSyncData).then( () => resolved(data) );
                    },
                    err => {
                        //console.log(err);
                        rejected(err);
                    }
                );
            }
        );
    }

    // sync account module data
    public syncAccountModuleData(sessionDto: UserLoginSessionDto, storage: Storage) : Promise<any> {
        return new Promise(
            (resolved, rejected) => {
                let sessionId = sessionDto.session;
                let reqParams = `_operation=${API_OPERATIONS.syncModuleRecords}&_session=${sessionId}&module=${MODULE_NAMES.Accounts}`
                    + `&mode=PUBLIC`;
                let header = new Headers();
                header.append('Content-Type', 'application/x-www-form-urlencoded');
                let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

                this.http.post(url, reqParams, {
                    headers: header
                })
                .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
                .subscribe(
                    res => {
                        // let data = res.json();
                        let data = JSON.parse(res.text().trim());
                        this.storeModuleData(data, storage, STORAGE_KEYS.accountModuleSyncData).then( () => resolved(data) );
                    },
                    err => {
                        //console.log(err);
                        rejected(err);
                    }
                );
            }
        );
    }

    // sync campaign module data
    public syncCampaignModuleData(sessionDto: UserLoginSessionDto, storage: Storage) : Promise<any> {
        return new Promise(
            (resolved, rejected) => {
                let sessionId = sessionDto.session;
                let reqParams = `_operation=${API_OPERATIONS.syncModuleRecords}&_session=${sessionId}&module=${MODULE_NAMES.Campaigns}`
                    + `&mode=PUBLIC`;
                let header = new Headers();
                header.append('Content-Type', 'application/x-www-form-urlencoded');
                let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

                this.http.post(url, reqParams, {
                    headers: header
                })
                .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
                .subscribe(
                    res => {
                        // let data = res.json();
                        let data = JSON.parse(res.text().trim());
                        this.storeModuleData(data, storage, STORAGE_KEYS.campaignModuleSyncData).then( () => resolved(data) );
                    },
                    err => {
                        //console.log(err);
                        rejected(err);
                    }
                );
            }
        );
    }


    private storeModuleData(data: any, storage: Storage, storedKey: string): Promise<any>{
        if(!data || !data.success)
            return;
        //console.log(`store sync data for ${storedKey}`);
        //console.log(data.result.sync.updated);
        return storage.set(storedKey, data.result.sync.updated);
    }

    // add or update account model to local storage
    public addOrUpdateAccountModelToStorage(isNewMode: boolean, model: any): Promise<any> {
        return this.addOrUpdateModelToStorage(STORAGE_KEYS.accountModuleSyncData, isNewMode, model);
    }

    // add or update potential model to local storage
    public addOrUpdatePotentialModelToStorage(isNewMode: boolean, model: any): Promise<any> {
        return this.addOrUpdateModelToStorage(STORAGE_KEYS.potentialModuleSyncData, isNewMode, model);
    }

    // add or update contact model to local storage
    public addOrUpdateContactModelToStorage(isNewMode: boolean, model: any): Promise<any> {
        return this.addOrUpdateModelToStorage(STORAGE_KEYS.contactModuleSyncData, isNewMode, model);
    }

    // add or update calendar model to local storage
    public addOrUpdateCalendarModelToStorage(isNewMode: boolean, model: any): Promise<any> {
        return this.addOrUpdateModelToStorage(STORAGE_KEYS.calendarModuleSyncData, isNewMode, model);
    }

    private addOrUpdateModelToStorage(storageModuleKey: string, isNewMode: boolean, model: any): Promise<any> {
        return this.storage.get(storageModuleKey).then(
            dataList => {
                if(isNewMode){
                    //console.log(`new mode add ${storageModuleKey} model to storage`);
                    dataList.push(model);
                }else {
                    //console.log(`edit mode update ${storageModuleKey} model to storage`);
                    let updateIndex = dataList.findIndex(
                        item => item.id === model.id
                    );
                    if(updateIndex > -1) {
                        dataList.splice(updateIndex, 1, model);
                    }
                }
                this.storage.set(storageModuleKey, dataList);
                return dataList;
            }
        );
    }

}
