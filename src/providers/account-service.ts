/**
 * data access for account module
 */
import {Observable} from 'rxjs';
import 'rxjs/Rx';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, STORAGE_KEYS, MODULE_NAMES  } from './configuration-service';
import { KeywordSearchCommand } from '../model/search-commands';
import { UserLoginSessionDto } from '../model/login-dto';
import { AccountDto, AccountDetailDto } from '../model/shared-dto';
// import { UserService } from './user-service';

@Injectable()
export class AccountService {

    constructor(
        public http: Http,
        public storage: Storage
    ){ }

    // access offline data store
    public getAccountTotalCountFromStorage() : Observable<any> {
        let countPros = this.storage.get(STORAGE_KEYS.accountModuleSyncData).then(
            storedData => storedData ? storedData.length : 0
        );
        return Observable.fromPromise(countPros);
    }

    // return array of AccountDto -> listing page
    public loadAccountListFromStorage(): Promise<Array<AccountDto>> {
        return this.storage.get(STORAGE_KEYS.accountModuleSyncData).then(
            storedData => this.extractAccountList(storedData)
        );
    }

    public searchAccountsFromStorage(command: KeywordSearchCommand): Promise<Array<AccountDto>> {
        return this.loadAccountListFromStorage().then(
            list => {
                return !command ? list :
                    list.filter(item => item && item.accountname &&
                        item.accountname.toLowerCase().indexOf(command.keyword.toLowerCase()) > -1);
            }
        );
    }

    private extractAccountList(jsonArrData: any): Array<AccountDto> {
        if(!jsonArrData)
            return new Array<AccountDto>();

        return jsonArrData.map(
            el => this.transformFormElementToAccountDto(el)
        );
    }

    private transformFormElementToAccountDto(elForm: any): AccountDto {
        let formBlock = elForm.blocks[0];
        let fields = formBlock.fields;
        let dto = new AccountDto();

        dto.id = elForm.id;
        dto.accountname = this.getFieldValue(fields, 'accountname');
        dto.nameInitial = dto.accountname ? dto.accountname.substring(0, 1) : '';
        dto.account_no = this.getFieldValue(fields, 'account_no');
        dto.website = this.getFieldValue(fields, 'website');
        dto.phone = this.getFieldValue(fields, 'phone');
        dto.email = this.getFieldValue(fields, 'email');

        return dto;
    }

    private getFieldValue(fields: Array<any>, fieldName: string): string {
        let field = fields.find(
            f => f.name === fieldName
        );
        return field ? field.value : '';
    }

    // access offline data store
    // return detail dto with groups for account
    public loadAccountDetailFromStorage(id: string): Promise<any> {
        return this.storage.get(STORAGE_KEYS.accountModuleSyncData).then(
            storedData => this.extractAccountDto(storedData, id)
        );
    }

    private extractAccountDto(dataList: any[], id: string): any {
        return dataList.find(item => item.id === id);
    }

    // return result for account listing page
    public searchAccounts(command: KeywordSearchCommand): Observable<Array<AccountDto>> {
        let pageSize = APP_CONSTANTS.listingPageSize;
        let offset = (command.pageNumber - 1) * pageSize;
        let searchQuery = '';
        if(command.sortedField === null || command.sortedField === undefined
            || command.sortedField === ''){
                command.sortedField = 'modifiedtime desc';
        }
        if(command.keyword === null || command.keyword === undefined
            || command.keyword === ''){
                searchQuery = `SELECT id, accountname, account_no, website, phone, email, createdtime, modifiedtime `
                    + ` FROM Accounts `
                    + ` WHERE accountname!='????' `
                    + ` ORDER BY ${command.sortedField} LIMIT ${offset},${pageSize};`;
        }
        else{
            searchQuery = `SELECT id, accountname, account_no, website, phone, email, createdtime, modifiedtime `
            + ` FROM Accounts `
            + ` WHERE accountname like '%25${command.keyword}%25' `
            + ` ORDER BY ${command.sortedField} LIMIT ${offset},${pageSize};`;
        }

        let reqParams = `_operation=query&_session=${command.sessionId}&module=${MODULE_NAMES.Accounts}&query=${searchQuery}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = command.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractAccountDtoFromSearchResult(res));

        return $obs;
    }

    private extractAccountDtoFromSearchResult(res: Response): Array<AccountDto> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());

        if(data && !data.success)
            return new Array<AccountDto>();

        return data.result.records.map(
            dbRecord => {
                let dto = new AccountDto();

                dto.id = dbRecord.id;
                dto.accountname = dbRecord.accountname;
                dto.account_no = dbRecord.account_no;
                dto.website = dbRecord.website;
                dto.phone = dbRecord.phone;
                dto.email = dbRecord.email;

                if(dbRecord.createdtime){
                    dto.createdtime = new Date(dbRecord.createdtime);
                }

                if(dbRecord.modifiedtime){
                    dto.modifiedtime = new Date(dbRecord.modifiedtime);
                }

                return dto;
            }
        );
    }

    // return account detail dto for detail page
    public getAccountDetail(sessionDto: UserLoginSessionDto, id: string): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecord&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractAccountDetailDto(res));

        return $obs;
    }

    public getAccountDetailWithGrouping(sessionDto: UserLoginSessionDto, id: string): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecordWithGrouping&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractAccountDetailDto(res));

        return $obs;
    }

    private extractAccountDetailDto(res: Response): any {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(data && !data.success)
            return new AccountDetailDto();

        return data.result.record;
    }

    // methods -> save account: add new or update
    public saveChanges(sessionDto: UserLoginSessionDto, dto: any): Observable<any> {
        let sessionId = sessionDto.session;
        let recordId = dto.id || "11x0";
        let recordValues = JSON.stringify(dto);
        let reqParams = `_operation=saveRecord&_session=${sessionId}&module=${MODULE_NAMES.Accounts}&record=${recordId}&values=${recordValues}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');

        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        // save to server
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => {
                // let data = res.json();
                let data = JSON.parse(res.text().trim());
                return data;
            });
        return $obs;
    }

    public deleteAccount(sessionDto: UserLoginSessionDto, id: string): Promise<any> {
        console.log(`delete account id -> ${id}`);
        let sessionId = sessionDto.session;
        let reqParams = `_operation=deleteRecords&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(
                res => {
                    // let data = res.json();
                    let data = JSON.parse(res.text().trim());
                    return data;
                }
            );
        return $obs.toPromise();
    }

    // get related modules to account
    public getRelatedContacts(sessionDto: UserLoginSessionDto, recordId: string): Promise<any>{
        let sessionId = sessionDto.session;
        let reqParams = `_operation=relatedRecordsWithGrouping&_session=${sessionId}&relatedmodule=${MODULE_NAMES.Contacts}&record=${recordId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');

        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractRelatedDataList(res));

        return $obs.toPromise();
    }

    public getRelatedPotentials(sessionDto: UserLoginSessionDto, recordId: string): Promise<any>{
        let sessionId = sessionDto.session;
        let reqParams = `_operation=relatedRecordsWithGrouping&_session=${sessionId}&relatedmodule=${MODULE_NAMES.Potentials}&record=${recordId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');

        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractRelatedDataList(res));

        return $obs.toPromise();
    }

    public getRelatedCalendars(sessionDto: UserLoginSessionDto, recordId: string): Promise<any>{
        let sessionId = sessionDto.session;
        let reqParams = `_operation=relatedRecordsWithGrouping&_session=${sessionId}&relatedmodule=${MODULE_NAMES.Calendar}&record=${recordId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');

        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractRelatedDataList(res));

        return $obs.toPromise();
    }

    private extractRelatedDataList(res: Response): Array<any> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(!data || !data.success)
            return new Array();

        return data.result.records;
    }

}
