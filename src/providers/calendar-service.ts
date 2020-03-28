/**
 * data access for calendar module
 */
import {Observable} from 'rxjs';
import 'rxjs/Rx';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, STORAGE_KEYS, MODULE_NAMES  } from './configuration-service';
import { KeywordSearchCommand } from '../model/search-commands';
import { UserLoginSessionDto } from '../model/login-dto';
import { CalendarDto, CalendarGroupDto, CalendarDetailDto, CALENDAR_EVENT_TYPES } from '../model/shared-dto';
// import { UserService } from './user-service';
import { DateUtils } from '../utils/date-utils';
import { groupBy } from 'lodash';

@Injectable()
export class CalendarService {

    constructor(
        public http: Http,
        public storage: Storage
    ){}

    public getCalendarTotalCountFromStorage(userSessionDto: UserLoginSessionDto) : Observable<any> {
        let byOwnerFn = function(dto: CalendarDto) {
            return dto && ((dto.createdByUserId && dto.createdByUserId.value === userSessionDto.userIdWithModuleId)
                    || (dto.assigned_user_id && dto.assigned_user_id.value === userSessionDto.userIdWithModuleId));
        };
        let countPros = this.storage.get(STORAGE_KEYS.calendarModuleSyncData).then(
            storedData => {
                let filteredCal = this.extractCalendarList(storedData).filter(byOwnerFn);
                return filteredCal ? filteredCal.length : 0;
            }
        );
        return Observable.fromPromise(countPros);
    }

    private sortCalendarByDateStart = function(a: CalendarDto, b: CalendarDto) {
        if(a.date_start < b.date_start)
            return 1;
        else if(a.date_start == b.date_start)
            return 0;
        return -1;
    }

    // return array of CalendarGroupDto
    public loadCalendarListFromStorage(userSessionDto: UserLoginSessionDto): Promise<Array<CalendarGroupDto>> {
        const byOwnerFn = function(dto: CalendarDto) {
            return dto && ((dto.createdByUserId && dto.createdByUserId.value === userSessionDto.userIdWithModuleId)
                    || (dto.assigned_user_id && dto.assigned_user_id.value === userSessionDto.userIdWithModuleId));
        };
        const onlyTestDrive = function(dto: CalendarDto) {
          return dto && dto.activityType == 'Lái thử';
        };
        return this.storage.get(STORAGE_KEYS.calendarModuleSyncData).then(
            storedData => {
                let sortedCalendarList = this.extractCalendarList(storedData)
                        .filter(byOwnerFn)
                        .filter(onlyTestDrive)
                        .sort(this.sortCalendarByDateStart);

                return this.transformToCalendarGroup(sortedCalendarList);
            }
        );
    }

    public extractCalendarList(jsonArrData: any): Array<CalendarDto> {
        if(!jsonArrData)
            return new Array<CalendarDto>();

        return jsonArrData.map(
            el => this.transformFormElementToCalendarDto(el)
        );
    }

    // search calendar from storage
    public searchCalendarsFromStorage(command: KeywordSearchCommand, userSessionDto: UserLoginSessionDto): Promise<Array<CalendarGroupDto>> {

        if(!command || !command.keyword)
            return this.loadCalendarListFromStorage(userSessionDto);

        let calendarMatch = function(dto: CalendarDto) {
            return dto.subject
                && dto.subject.toLocaleLowerCase().indexOf(command.keyword.toLocaleLowerCase()) > -1;
        };

        return this.storage.get(STORAGE_KEYS.calendarModuleSyncData).then(
            storedData => {
                let filterCalendarList = this.extractCalendarList(storedData)
                    .filter(calendarMatch)
                    .sort(this.sortCalendarByDateStart);

                return this.transformToCalendarGroup(filterCalendarList);
            }
        );
    }

    // query calendar overdue activities
    // return array of CalendarDto
    public getOverdueActivitiesFlatList() {

        let overdueActivityFilter = (calDto: CalendarDto) => {
            return calDto.taskstatus !== 'Completed' && calDto.taskstatus !== 'Held';
        }

        return this.storage.get(STORAGE_KEYS.calendarModuleSyncData).then(
            storedData => {
                let sortedCalendarList = this.extractCalendarList(storedData)
                        .filter(overdueActivityFilter)
                        .sort(this.sortCalendarByDateStart);

                return sortedCalendarList;
            }
        );
    }

    // query calendar overdue activities
    // return array of CalendarGroupDto
    public getOverdueActivities(userSessionDto: UserLoginSessionDto) {
        let today = new Date();
        let overdueActivityFilter = (calDto: CalendarDto) => {
            return calDto && calDto.taskstatus !== 'Completed' && calDto.taskstatus !== 'Held' && calDto.time_start <= today
                && ((calDto.createdByUserId && calDto.createdByUserId.value === userSessionDto.userIdWithModuleId)
                    || (calDto.assigned_user_id && calDto.assigned_user_id.value === userSessionDto.userIdWithModuleId));
        }

        return this.storage.get(STORAGE_KEYS.calendarModuleSyncData).then(
            storedData => {
                let sortedCalendarList = this.extractCalendarList(storedData)
                        .filter(overdueActivityFilter)
                        .sort(this.sortCalendarByDateStart);
                //console.log('sortedCalendarList -> ', sortedCalendarList);

                return this.transformToCalendarGroup(sortedCalendarList);
            }
        );
    }

    // transform calendar list to calendar group list
    private transformToCalendarGroup(calendarListDto: Array<CalendarDto>): Array<CalendarGroupDto> {
        let groupCalendarList = new Array<CalendarGroupDto>();

        let grouped = groupBy(calendarListDto, (item) => {
            return item.date_start.toLocaleDateString();
        });

        for (var property in grouped) {
            if (grouped.hasOwnProperty(property)) {
                let groupEntry = new CalendarGroupDto();
                groupEntry.groupKey = property;
                groupEntry.values = grouped[property];
                groupCalendarList.push(groupEntry);
            }
        }

        return groupCalendarList;
    }

    // get calendar detail dto from local storage
    public loadCalendarDetailFromStorage(id: string): Promise<any> {
        return this.storage.get(STORAGE_KEYS.calendarModuleSyncData).then(
            storedData => this.findById(storedData, id)
        );
    }

    private findById(dataList: any[], id: string): any {
        let dtoWithGrouping = dataList.find(item => item.id === id);
        return dtoWithGrouping;
        //return this.sortFormFields(dtoWithGrouping);
    }

    // sort the fields order in each block of grouped detail dto
    // private sortFormFields(dtoWithGrouping: any): any {
    //     if(!dtoWithGrouping || !dtoWithGrouping.blocks || !Array.isArray(dtoWithGrouping.blocks))
    //         return dtoWithGrouping;
    //     return dtoWithGrouping.blocks.forEach(
    //         block => block.fields = this.sortFields(block.fields)
    //     );
    // }

    // private sortFields(fieldList: Array<any>): Array<any> {
    //     return fieldList.sort(
    //         (f1, f2) => {
    //             if(f1.order < f2.order)
    //                 return -1;
    //             return f1.order > f2.order ? 1 : 0;
    //         }
    //     );
    // }

    // get calendar detail dto from server
    public getCalendarDetail(sessionDto: UserLoginSessionDto, id: string): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecord&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractCalendarDetailDto(res));

        return $obs;
    }

    public getCalendarDetailWithGrouping(sessionDto: UserLoginSessionDto, id: string): Promise<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecordWithGrouping&_session=${sessionId}&record=${id}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractCalendarDetailDto(res));

        return $obs.toPromise();
    }

    private extractCalendarDetailDto(res: Response): any {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(data && !data.success)
            return new CalendarDetailDto();

        return data.result.record;
    }

    private transformFormElementToCalendarDto(elForm: any): CalendarDto {
        let formBlock = elForm.blocks[0];
        let fields = formBlock.fields;
        let dto = new CalendarDto();

        dto.id = elForm.id;
        dto.subject = this.getFieldValue(fields, 'subject');
        dto.eventType = this.getFieldValue(fields, 'activitytype') === 'Task' ?
            CALENDAR_EVENT_TYPES.task : CALENDAR_EVENT_TYPES.event;
        dto.activityType = this.getFieldValue(fields, 'activitytype');
        dto.taskstatus = this.getFieldValue(fields, 'taskstatus');
        dto.date_start = this.getFieldValueAsDate(fields, 'date_start');
        dto.time_start = this.getFieldValueAsTime(fields, 'time_start');
        if(dto.date_start && dto.time_start) {
            dto.time_start.setFullYear(dto.date_start.getFullYear());
            dto.time_start.setMonth(dto.date_start.getMonth());
            dto.time_start.setDate(dto.date_start.getDate());
            dto.date_time_start = dto.time_start;
        }
        dto.createdByUserId = this.getFieldValue(fields, 'created_user_id');
        dto.assigned_user_id = this.getFieldValue(fields, "assigned_user_id");

        return dto;
    }

    private getField(fields: Array<any>, fieldName: string): any {
        return fields.find(
            f => f.name === fieldName
        );
    }

    private getFieldValue(fields: Array<any>, fieldName: string): string {
        let field = this.getField(fields, fieldName);
        return field ? field.value : '';
    }

    private getFieldValueAsDate(fields: Array<any>, fieldName: string): Date {
        let field = this.getField(fields, fieldName);
        return field ? new Date(field.value) : null;
    }

    private getFieldValueAsTime(fields: Array<any>, fieldName: string): Date {
        let field = this.getField(fields, fieldName);
        if(!field)
            return null;

        let timeParts = field.value.split(':');
        if(!timeParts)
            return null;
        let d = new Date();
        if(timeParts.length === 2){
            d.setHours(parseInt(timeParts[0])); //time zone offset
            d.setMinutes(parseInt(timeParts[1]));
            return d;
        }

        d.setHours(parseInt(timeParts[0])); //time zone offset
        d.setMinutes(parseInt(timeParts[1]));
        d.setSeconds(parseInt(timeParts[2]));
        return d;
    }

    // save changes to server
    public saveChanges(sessionDto: UserLoginSessionDto, dto: any): Observable<any> {
        let sessionId = sessionDto.session;
        let moduleId = '9';// dto.activitytype === 'Task' ? '9' : '18';
        let recordId = dto.id || `${moduleId}x0`;
        //console.log('save changes dto for : ', dto);
        // set values for calculated fields
        if(typeof(dto.date_start) === 'object'){
            dto.date_start = dto.date_start.year + '-' + dto.date_start.month + '-' + dto.date_start.day;
        }
        if(typeof(dto.due_date) === 'object'){
            dto.due_date = dto.due_date.year + '-' + dto.due_date.month + '-' + dto.due_date.day;
        }
        if(dto.date_start && dto.due_date){
            dto.duration_hours = Math.round(DateUtils.getHourDurationFromDate(dto.date_start, dto.due_date));
            dto.date_start = dto.date_start.substring(0, 10);
            dto.due_date = dto.due_date.substring(0, 10);
        }
        if(typeof(dto.time_start) === 'object'){
            dto.time_start = dto.time_start.hour + ':'
                + (dto.time_start.minute < 10 ? ('0' + dto.time_start.minute) : dto.time_start.minute);
        }
        if(typeof(dto.time_end) === 'object'){
            dto.time_end = dto.time_end.hour + ':'
                + (dto.time_end.minute < 10 ? ('0' + dto.time_end.minute) : dto.time_end.minute);
        }
        if(dto.time_start && dto.time_end){

            dto.duration_hours = dto.duration_hours
                + Math.round(DateUtils.getHourDurationFromTime(dto.time_start, dto.time_end));

            dto.duration_minutes = Math.round(DateUtils.getMinuteDurationFromTime(dto.time_start, dto.time_end));
        }

        let recordValues = JSON.stringify(dto);
        let reqParams = `_operation=saveRecord&_session=${sessionId}&module=${MODULE_NAMES.Calendar}&record=${recordId}&values=${recordValues}`;
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

}
