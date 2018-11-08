import {Observable} from 'rxjs';
import 'rxjs/Rx';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';

import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, STORAGE_KEYS, MODULE_NAMES } from './configuration-service';
import { SearchContactCommand } from '../model/search-commands';
import { KeywordSearchCommand } from '../model/search-commands';
// import { UserDetailDto } from '../model/user-detail-dto';
import { ContactDto, ContactDetailDto } from '../model/contact-dto';
import { UserLoginSessionDto } from '../model/login-dto';

@Injectable()
export class ContactService {

    constructor(
        public http:Http,
        public storage: Storage) {
    }

    // access offline data store
    public getContactTotalCountFromStorage() : Observable<any> {
        let countPros = this.storage.get(STORAGE_KEYS.contactModuleSyncData).then(
            storedData => storedData ? storedData.length : 0
        );
        return Observable.fromPromise(countPros);
    }

    // return array of ContactDto -> listing page
    public loadContactListFromStorage(): Promise<Array<ContactDto>> {
        return this.storage.get(STORAGE_KEYS.contactModuleSyncData).then(
            storedData => this.extractContactList(storedData)
        );
    }

    public searchContactsFromStorage(command: KeywordSearchCommand): Promise<Array<ContactDto>> {
        return this.loadContactListFromStorage().then(
            list => {
                return !command ? list :
                    list.filter(item => item && item.fullName &&
                        item.fullName.toLowerCase().indexOf(command.keyword.toLowerCase()) > -1);
            }
        );
    }

    public extractContactList(jsonArrData: any): Array<ContactDto> {
        if(!jsonArrData)
            return new Array<ContactDto>();

        return jsonArrData.map(
            el => this.transformFormElementToContactDto(el)
        ).filter(
            el => el.firstName != '????' && el.lastName != '????'
        );
    }

    private transformFormElementToContactDto(elForm: any): ContactDto {
        let formBlock = elForm.blocks[0];
        let fields = formBlock.fields;
        let dto = new ContactDto();

        dto.id = elForm.id;
        dto.salutationType = this.getFieldValue(fields, 'salutationtype');
        dto.firstName = this.getFieldValue(fields, 'firstname');
        dto.lastName = this.getFieldValue(fields, 'lastname');

        dto.name = dto.firstName + ' ' + dto.lastName;
        dto.fullName = dto.name;

        dto.email = this.getFieldValue(fields, 'email');
        dto.phoneNumber = this.getFieldValue(fields, 'mobile');
        dto.address = this.getFieldValue(fields, 'mailingstreet');
        dto.createdDate = this.getFieldValueAsDate(fields, 'createdtime');
        dto.modifiedDate = this.getFieldValueAsDate(fields, 'modifiedtime');
        dto.avatarUrl = "";
        dto.nameInitial = this.getNameInitial(dto.firstName, dto.fullName);

        return dto;
    }

    private getFieldValue(fields: Array<any>, fieldName: string): string {
        let field = fields.find(
            f => f.name === fieldName
        );
        return field ? field.value : '';
    }

    private getFieldValueAsDate(fields: Array<any>, fieldName: string) : Date {
        let fVal = this.getFieldValue(fields, fieldName);
        return (fVal && fVal != '') ? new Date(fVal) : null;
    }

    // access offline data store
    // return detail dto with groups for contact
    public loadContactDetailFromStorage(id: string): Promise<any> {
        return this.loadContactListFromStorage().then(
            list => {
                let dto = list.find(el => el.id === id);
                return dto ? dto : null;
            }
        );
    }

    // access online data
    // return result for contacts listing page
    public searchContacts(command: SearchContactCommand): Observable<any> {
        let pageSize = APP_CONSTANTS.listingPageSize;
        let offset = (command.pageNumber - 1) * pageSize;
        let searchQuery = '';
        if(command.sortedField === null || command.sortedField === undefined
            || command.sortedField === ''){
                command.sortedField = 'modifiedtime desc';
        }
        if(command.keyword === null || command.keyword === undefined
            || command.keyword === ''){
                searchQuery = `SELECT id, salutationtype, firstname, lastname, mobile, phone, email `
                    + ` FROM Contacts `
                    + ` WHERE firstname!='????' AND lastname!='????' `
                    + ` ORDER BY ${command.sortedField} LIMIT ${offset},${pageSize};`;
        }
        else{
            searchQuery = `SELECT id, salutationtype, firstname, lastname, mobile, phone, email `
            + ` FROM Contacts `
            + ` WHERE firstname like '%25${command.keyword}%25' OR lastname like '%25${command.keyword}%25' `
            + ` ORDER BY ${command.sortedField} LIMIT ${offset},${pageSize};`;
        }

        let reqParams = `_operation=query&_session=${command.sessionId}&module=${MODULE_NAMES.Contacts}&query=${searchQuery}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = command.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractContactDtoFromSearchResult(res));

        return $obs;
    }

    private extractContactDtoFromSearchResult(res: Response): Array<ContactDto> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());

        if(data && !data.success)
            return new Array<ContactDto>();

        return data.result.records.map(
            dbRecord => {
                let dto = new ContactDto();

                dto.id = dbRecord.id;
                dto.salutationType = dbRecord.salutationtype;
                dto.firstName = dbRecord.firstname;
                dto.lastName = dbRecord.lastname;

                dto.name = dto.firstName + ' ' + dto.lastName;
                dto.fullName = dto.name;

                dto.phoneNumber = dbRecord.mobile;
                dto.email = dbRecord.email;
                dto.createdDate = dbRecord.created_date;

                dto.avatarUrl = "";
                dto.nameInitial = this.getNameInitial(dto.firstName, dto.fullName);

                return dto;
            }
        );
    }

    private getNameInitial(firstname: string, fullName: string): string {
        return fullName.length > 0 ? fullName.substring(0,1)
                 : firstname.length > 0 ? firstname.substring(0,1) : "";
    }

    // methods -> getContactDetail -> detail page
    // ex:
    // _operation -> fetchRecord
    // record -> 12x2638
    public getContactDetail(sessionDto: UserLoginSessionDto, id: string): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecord&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractContactDetailDto(res));

        return $obs;
    }

    // methods -> getContactDetailWithGrouping -> detail page
    // ex:
    // _operation -> fetchRecordWithGrouping
    // module -> Contacts
    // record -> 12x2638
    public getContactDetailWithGrouping(sessionDto: UserLoginSessionDto, id: string): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecordWithGrouping&_session=${sessionId}&module=Contacts&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractContactDetailDtoWithGrouping(res));

        return $obs;
    }

    private extractContactDetailDto(res: Response): ContactDetailDto {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(data && !data.success)
            return new ContactDetailDto();

        return data.result.record;
    }

    private extractContactDetailDtoWithGrouping(res: Response): any {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(data && !data.success)
            return new ContactDetailDto();

        return data.result.record;
    }

    // methods -> save contact: add new or update
    public saveChanges(sessionDto: UserLoginSessionDto, contactDto: any): Observable<any> {
        let sessionId = sessionDto.session;
        let recordId = contactDto.id || "12x0";
        let recordValues = JSON.stringify(contactDto);
        let reqParams = `_operation=saveRecord&_session=${sessionId}&module=${MODULE_NAMES.Contacts}&record=${recordId}&values=${recordValues}`;
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
                return data;
            });

        return $obs;
    }

    public deleteContact(sessionDto: UserLoginSessionDto, id: string) {
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
        return $obs;
    }

    // get related potentials to contact
    // no result response ->
    /**
     * {
            "success": false,
            "error": {
                "code": 0,
                "message": "Unexpected input at line1: '"
            }
        }
     */
    // ok result response -> array of detail potential record with grouping
    public getRelatedPotentials(sessionDto: UserLoginSessionDto, recordId: string): Promise<any>{
        let sessionId = sessionDto.session;
        let reqParams = `_operation=relatedRecordsWithGrouping&_session=${sessionId}&relatedmodule=${MODULE_NAMES.Potentials}&record=${recordId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');

        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
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

    public getRelatedTestDrives(sessionDto: UserLoginSessionDto, recordId: string): Promise<any> {
      let sessionId = sessionDto.session;
        let reqParams = `_operation=relatedRecordsWithGrouping&_session=${sessionId}&relatedmodule=${MODULE_NAMES.Event}&record=${recordId}`;
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
