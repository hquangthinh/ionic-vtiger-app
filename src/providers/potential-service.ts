/**
 * data access for potential module
 */
import {Observable} from 'rxjs';
import 'rxjs/Rx';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, STORAGE_KEYS, MODULE_NAMES  } from './configuration-service';
import { KeywordSearchCommand } from '../model/search-commands';
import { UserLoginSessionDto } from '../model/login-dto';
import { PotentialDto, PotentialDetailDto } from '../model/shared-dto';
// import { UserService } from './user-service';


@Injectable()
export class PotentialService {

    constructor(
        public http: Http,
        public storage: Storage
    ){}

    // access offline data store
    public getPotentialTotalCountFromStorage() : Observable<any> {
        let countPros = this.storage.get(STORAGE_KEYS.potentialModuleSyncData).then(
            storedData => storedData ? storedData.length : 0
        );
        return Observable.fromPromise(countPros);
    }

    // return array of PotentialDto -> listing page
    public loadPotentialListFromStorage(): Promise<Array<PotentialDto>> {
        return this.storage.get(STORAGE_KEYS.potentialModuleSyncData).then(
            storedData => this.extractPotentialList(storedData)
        );
    }

    public searchPotentialsFromStorage(command: KeywordSearchCommand): Promise<Array<PotentialDto>> {
        return this.loadPotentialListFromStorage().then(
            list => {
                return !command ? list :
                    list.filter(item => item && item.potentialname &&
                        item.potentialname.toLowerCase().indexOf(command.keyword.toLowerCase()) > -1);
            }
        );
    }

    public extractPotentialList(jsonArrData): Array<PotentialDto> {
        if(!jsonArrData)
            return new Array<PotentialDto>();

        return jsonArrData.map(
            el => this.transformFormElementToPotentialDto(el)
        );
    }

    private transformFormElementToPotentialDto(elForm: any): PotentialDto {
        let formBlock = elForm.blocks[0];
        let fields = formBlock.fields;
        let dto = new PotentialDto();

        dto.id = elForm.id;
        dto.potentialname = this.getFieldValue(fields, 'potentialname');
        dto.potential_no = this.getFieldValue(fields, 'potential_no');
        let contactDto = this.getFieldObject(fields, 'contact_id');
        if(contactDto) {
            dto.contact_id = contactDto.value;
            dto.contact_name = contactDto.label;
        }
        dto.sales_stage = this.getFieldValue(fields, 'sales_stage');

        return dto;
    }

    private getFieldValue(fields: Array<any>, fieldName: string): string {
        let field = fields.find(
            f => f.name === fieldName
        );
        return field ? field.value : '';
    }

    private getFieldObject(fields: Array<any>, fieldName: string): any {
        let field = fields.find(
            f => f.name === fieldName
        );
        return field ? field.value : '';
    }

    // access offline data store
    // return detail dto with groups for potential
    public loadPotentialDetailFromStorage(id: string): Promise<any> {
        return this.storage.get(STORAGE_KEYS.potentialModuleSyncData).then(
            storedData => this.extractPotentialDto(storedData, id)
        );
    }

    private extractPotentialDto(dataList: any[], id: string): any {
        return dataList.find(item => item.id === id);
    }

    // return result for potential listing page
    public searchPotentials(command: KeywordSearchCommand): Observable<Array<PotentialDto>> {
        let pageSize = APP_CONSTANTS.listingPageSize;
        let offset = (command.pageNumber - 1) * pageSize;
        let searchQuery = '';
        if(command.sortedField === null || command.sortedField === undefined
            || command.sortedField === ''){
                command.sortedField = 'modifiedtime desc';
        }
        if(command.keyword === null || command.keyword === undefined
            || command.keyword === ''){
                searchQuery = `SELECT id, potentialname, potential_no, contact_id, sales_stage, createdtime, modifiedtime  `
                    + ` FROM Potentials `
                    + ` WHERE potentialname!='????' `
                    + ` ORDER BY ${command.sortedField} LIMIT ${offset},${pageSize};`;
        }
        else{
            searchQuery = `SELECT id, potentialname, potential_no, contact_id, sales_stage, createdtime, modifiedtime `
            + ` FROM Potentials `
            + ` WHERE potentialname like '%25${command.keyword}%25' `
            + ` ORDER BY ${command.sortedField} LIMIT ${offset},${pageSize};`;
        }

        let reqParams = `_operation=query&_session=${command.sessionId}&module=${MODULE_NAMES.Potentials}&query=${searchQuery}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = command.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractPotentialDtoFromSearchResult(res));

        return $obs;
    }

    private extractPotentialDtoFromSearchResult(res: Response): Array<PotentialDto> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());

        if(data && !data.success)
            return new Array<PotentialDto>();

        return data.result.records.map(
            dbRecord => {
                let dto = new PotentialDto();

                dto.id = dbRecord.id;
                dto.potentialname = dbRecord.accountname;
                dto.potential_no = dbRecord.account_no;
                dto.contact_id = dbRecord.website;

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

    // return potential detail dto for detail page
    public getPotentialDetail(sessionDto: UserLoginSessionDto, id: string): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecord&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractPotentialDetailDto(res));

        return $obs;
    }

    public getPotentialDetailWithGrouping(sessionDto: UserLoginSessionDto, id: string): Promise<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecordWithGrouping&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractPotentialDetailDto(res));

        return $obs.toPromise();
    }

    private extractPotentialDetailDto(res: Response): any {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(data && !data.success)
            return new PotentialDetailDto();

        return data.result.record;
    }

    // methods -> save potential: add new or update
    public saveChanges(sessionDto: UserLoginSessionDto, dto: any): Observable<any> {
        let sessionId = sessionDto.session;
        let recordId = dto.id || "13x0";
        let recordValues = JSON.stringify(dto);
        let reqParams = `_operation=saveRecord&_session=${sessionId}&module=${MODULE_NAMES.Potentials}&record=${recordId}&values=${recordValues}`;
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
                // console.log(data);
                return data;
            });

        return $obs;
    }

    // delete potential from server
    public deletePotential(sessionDto: UserLoginSessionDto, id: string): Promise<any> {
        console.log(`delete potential id -> ${id}`);
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
