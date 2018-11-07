import {Observable} from 'rxjs';
import 'rxjs/Rx';
import {Http, Headers } from '@angular/http'
import {Injectable} from '@angular/core';

import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, STORAGE_KEYS, MODULE_NAMES } from './configuration-service';
import { UserLoginSessionDto } from '../model/login-dto';

export class PickListDto {
    label: string;
    value: string;
}

export class PickListMap {
    key: string;
    values: Array<PickListDto>;
}

// pick list metadata for Calendar module
export class CalendarModulePickList {
    taskStatusList: Array<PickListDto>;
    eventStatusList: Array<PickListDto>;
    taskPriorityList: Array<PickListDto>;
    activityTypeList: Array<PickListDto>;
    visibilityList: Array<PickListDto>;
}

// pick list metadata for Contact module
export class ContactModulePickList {

    salutationTypeList: Array<PickListDto>;
    leadSourceList: Array<PickListDto>;
    mailingCityList: Array<PickListDto>;
    carList: Array<PickListDto>;
    carManufacturerList: Array<PickListDto>;

    constructor() {
        this.salutationTypeList = [
            {label: "Ông", value: "Ông"},
            {label: "Bà", value: "Bà"},
            {label: "Anh", value: "Anh"},
            {label: "Chị", value: "Chị"}
        ];
        this.leadSourceList = new Array<PickListDto>();
        this.mailingCityList = new Array<PickListDto>();
        this.carList = new Array<PickListDto>();
        this.carManufacturerList = new Array<PickListDto>();
    }
}

// pick list metadata for Account module
export class AccountModulePickList {
    mailingCityList: Array<PickListDto>;
}

export class PotentialModulePickList {
    potentialNameList: Array<PickListDto>;
    opportunityTypeList: Array<PickListDto>;
    leadSourceList: Array<PickListDto>;
    salesStageList: Array<PickListDto>;
}

// service for dealing with modules metadata
@Injectable()
export class ModuleService {

    constructor(
        public http: Http,
        public storage: Storage) {
    }

    // calendar module metadata
    public getCalendarModuleMetadataFromCache(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.calendarModulePickList));
    }

    public getCalendarModuleMetadata(sessionDto: UserLoginSessionDto): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=describe&_session=${sessionId}&module=${MODULE_NAMES.Calendar}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {

                // let data = res.json();
                let data = JSON.parse(res.text().trim());

                let calendarModulePickList = new CalendarModulePickList();

                if(!data || (data && !data.success))
                    return calendarModulePickList;

                let pickListValues = data.result.describe.fields
                        .filter(item =>
                            item.name == 'taskstatus' ||
                            item.name == 'eventstatus' ||
                            item.name == 'taskpriority' ||
                            item.name == 'activitytype' ||
                            item.name == 'visibility'
                        )
                        .map(item => {
                            let pkMap = new PickListMap();
                            pkMap.key = item.name;
                            pkMap.values = item.type.picklistValues;
                            return pkMap;
                        });

                calendarModulePickList.taskStatusList = pickListValues.find(
                    item => item.key == 'taskstatus'
                ).values;

                calendarModulePickList.eventStatusList = pickListValues.find(
                    item => item.key == 'eventstatus'
                ).values;

                calendarModulePickList.taskPriorityList = pickListValues.find(
                    item => item.key == 'taskpriority'
                ).values;

                calendarModulePickList.activityTypeList = pickListValues.find(
                    item => item.key == 'activitytype'
                ).values;

                calendarModulePickList.visibilityList = pickListValues.find(
                    item => item.key == 'visibility'
                ).values;

                return calendarModulePickList;
        });

        return $obs;
    }


    // contact module metadata
    public getContactModuleFormSchemaFromCache(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.contactModuleFormSchema));
    }

    public getContactModuleFormSchema(sessionDto: UserLoginSessionDto): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=describe&_session=${sessionId}&module=${MODULE_NAMES.Contacts}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {
                // let data = res.json();
                let data = JSON.parse(res.text().trim());
                if(!data || (data && !data.success))
                    return null;
                return data.result.describe;
            });

        return $obs;
    }

    public getContactModuleMetadataFromCache(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.contactModulePickList));
    }

    public getContactModuleMetadata(sessionDto: UserLoginSessionDto): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=describe&_session=${sessionId}&module=${MODULE_NAMES.Contacts}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {

                // let data = res.json();
                let data = JSON.parse(res.text().trim());

                let contactModulePickList = new ContactModulePickList();

                if(!data || (data && !data.success))
                    return contactModulePickList;

                // cf_771 -> xe quan tam
                // cf_775 -> hang xe
                let pickListValues = data.result.describe.fields
                        .filter(item =>
                            item.name == 'leadsource' ||
                            item.name == 'mailingcity' ||
                            item.name == 'cf_771' ||
                            item.name == 'cf_775'
                        )
                        .map(item => {
                            let pkMap = new PickListMap();
                            pkMap.key = item.name;
                            pkMap.values = item.type.picklistValues;
                            return pkMap;
                        });

                contactModulePickList.leadSourceList = pickListValues.find(
                    item => item.key == 'leadsource'
                ).values;

                contactModulePickList.mailingCityList = pickListValues.find(
                    item => item.key == 'mailingcity'
                ).values;

                contactModulePickList.carList = pickListValues.find(
                    item => item.key == 'cf_771'
                ).values;

                contactModulePickList.carManufacturerList = pickListValues.find(
                    item => item.key == 'cf_775'
                ).values;

                return contactModulePickList;
        });

        return $obs;
    }

    // account module metadata
    public getAccountModuleFormSchemaFromCache(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.accountModuleFormSchema));
    }

    public getAccountModuleFormSchema(sessionDto: UserLoginSessionDto): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=describe&_session=${sessionId}&module=${MODULE_NAMES.Accounts}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {
                // let data = res.json();
                let data = JSON.parse(res.text().trim());
                if(!data || (data && !data.success))
                    return null;
                return data.result.describe;
            });

        return $obs;
    }

    // potential module metadata
    public getPotentialModuleFormSchemaFromCache(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.potentialModuleFormSchema));
    }

    public getPotentialsModuleFormSchema(sessionDto: UserLoginSessionDto): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=describe&_session=${sessionId}&module=${MODULE_NAMES.Potentials}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {
                // let data = res.json();
                let data = JSON.parse(res.text().trim());
                if(!data || (data && !data.success))
                    return null;
                return data.result.describe;
            });

        return $obs;
    }

    public getPotentialModuleMetadataFromCache(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.potentialModulePickList));
    }

    public getPotentialModuleMetadata(sessionDto: UserLoginSessionDto): Observable<any> {

        let sessionId = sessionDto.session;
        let reqParams = `_operation=describe&_session=${sessionId}&module=${MODULE_NAMES.Potentials}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {

                // let data = res.json();
                let data = JSON.parse(res.text().trim());

                let potentialModulePickList = new PotentialModulePickList();

                if(!data || (data && !data.success))
                    return potentialModulePickList;

                let pickListValues = data.result.describe.fields
                        .filter(item =>
                            item.name == 'leadsource' ||
                            item.name == 'potentialname' ||
                            item.name == 'opportunity_type' ||
                            item.name == 'sales_stage'
                        )
                        .map(item => {
                            let pkMap = new PickListMap();
                            pkMap.key = item.name;
                            pkMap.values = item.type.picklistValues;
                            return pkMap;
                        });

                potentialModulePickList.leadSourceList = pickListValues.find(
                    item => item.key == 'leadsource'
                ).values;

                potentialModulePickList.potentialNameList = pickListValues.find(
                    item => item.key == 'potentialname'
                ).values;

                potentialModulePickList.opportunityTypeList = pickListValues.find(
                    item => item.key == 'opportunity_type'
                ).values;

                potentialModulePickList.salesStageList = pickListValues.find(
                    item => item.key == 'sales_stage'
                ).values;

                return potentialModulePickList;
        });

        return $obs;
    }
}
