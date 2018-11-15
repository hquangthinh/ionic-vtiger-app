import {Observable} from 'rxjs';
import 'rxjs/Rx';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';

import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, MODULE_NAMES } from './configuration-service';
import { UserService } from './user-service';
import { AccountService } from './account-service';
import { CalendarService } from './calendar-service';
import { ContactService } from './contact-service';
import { PotentialService } from './potential-service';

import { RecentActivityDto } from '../model/user-dashboard-dto';
// import { UserDetailDto } from '../model/user-detail-dto';
import { UserLoginSessionDto } from '../model/login-dto';

@Injectable()
export class DashboardService {

    constructor(
        public http:Http,
        public storage: Storage,
        public userService: UserService,
        public accountService: AccountService,
        public calendarService: CalendarService,
        public potentialService: PotentialService,
        public contactService: ContactService
        ) {
    }

    public getStatisticCountForDashboard(userSessionDto: UserLoginSessionDto) : Observable<any> {
      let curDate = new Date();
      curDate.setMonth(curDate.getMonth() + 1);
      let dateFilter = `${curDate.getFullYear()}-${curDate.getMonth()}-1`;
      // console.log('dashboard ', dateFilter);

      // let contactCountOb = this.contactService.getContactTotalCountFromStorage();
      // let accountCountOb = this.accountService.getAccountTotalCountFromStorage();
      //let potentialCountOb = this.potentialService.getPotentialTotalCountFromStorage();
      // let calendarCountOb = this.calendarService.getCalendarTotalCountFromStorage(userSessionDto);
      let contactCountOb = this.getContactTotalCountByUser(userSessionDto, dateFilter);
      let accountCountOb = this.getAccountTotalCountByUser(userSessionDto, dateFilter);
      let potentialCountOb = this.getPotentialsToContractTotalCountByUser(userSessionDto, dateFilter);
      let calendarCountOb = this.getTestDriveTotalCountByUser(userSessionDto, dateFilter);
      return Observable.zip(contactCountOb, accountCountOb, potentialCountOb, calendarCountOb);
    }

    /**
     *
     * Get total count for contact by user in current month by created date
     */
    public getContactTotalCountByUser(sessionDto: UserLoginSessionDto, dateFilter: String): Observable<any> {
      const sessionId = sessionDto.session;
      const curUserId = sessionDto.userIdWithModuleId;
      let countQuery = `SELECT count(*) FROM Contacts WHERE createdtime >= '${dateFilter}' `;
      if(sessionDto.userName !== 'admin'){
          countQuery += ` and assigned_user_id = '${curUserId}'`;
      }
      countQuery += ` ;`;

      let countReqParams = `_operation=query&_session=${sessionId}&module=${MODULE_NAMES.Potentials}` +
          `&page=0&query=${countQuery}`;

      let header = new Headers();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

      return this.http.post(url, countReqParams, {
              headers: header
          })
          .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
          .map(res => this.extractTotalCountForModule(res));
    }

    /**
     *
     * Get total count for account by user in current month by created date
     */
    public getAccountTotalCountByUser(sessionDto: UserLoginSessionDto, dateFilter: String): Observable<any> {
      const sessionId = sessionDto.session;
      const curUserId = sessionDto.userIdWithModuleId;
      let countQuery = `SELECT count(*) FROM Accounts WHERE createdtime >= '${dateFilter}' `;
      if(sessionDto.userName !== 'admin'){
          countQuery += ` and assigned_user_id = '${curUserId}'`;
      }
      countQuery += ` ;`;

      let countReqParams = `_operation=query&_session=${sessionId}&module=${MODULE_NAMES.Potentials}` +
          `&page=0&query=${countQuery}`;

      let header = new Headers();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

      return this.http.post(url, countReqParams, {
              headers: header
          })
          .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
          .map(res => this.extractTotalCountForModule(res));
    }

    /**
     *
     * Get total count for test drive by user in current month by created date
     */
    public getTestDriveTotalCountByUser(sessionDto: UserLoginSessionDto, dateFilter: String): Observable<any> {
      const sessionId = sessionDto.session;
      const curUserId = sessionDto.userIdWithModuleId;
      let countQuery = `SELECT count(*) FROM Events WHERE activitytype = 'Lái thử' And eventstatus = 'Held' And createdtime >= '${dateFilter}' `;
      if(sessionDto.userName !== 'admin'){
          countQuery += ` and assigned_user_id = '${curUserId}'`;
      }
      countQuery += ` ;`;

      let countReqParams = `_operation=query&_session=${sessionId}&module=${MODULE_NAMES.Potentials}` +
          `&page=0&query=${countQuery}`;

      let header = new Headers();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

      return this.http.post(url, countReqParams, {
              headers: header
          })
          .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
          .map(res => this.extractTotalCountForModule(res));
    }

    /**
     *
     * Get total count for calendar events by user in current month by created date
     */
    public getCalendarTotalCountByUser(sessionDto: UserLoginSessionDto, dateFilter: String): Observable<any> {
      const sessionId = sessionDto.session;
      const curUserId = sessionDto.userIdWithModuleId;
      let countQuery = `SELECT count(*) FROM Calendar WHERE createdtime >= '${dateFilter}' `;
      if(sessionDto.userName !== 'admin'){
          countQuery += ` and assigned_user_id = '${curUserId}'`;
      }
      countQuery += ` ;`;

      let countReqParams = `_operation=query&_session=${sessionId}&module=${MODULE_NAMES.Potentials}` +
          `&page=0&query=${countQuery}`;

      let header = new Headers();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

      return this.http.post(url, countReqParams, {
              headers: header
          })
          .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
          .map(res => this.extractTotalCountForModule(res));
    }

    public getModuleTotalCount(sessionDto: UserLoginSessionDto, moduleName: string): Observable<any> {
        let sessionId = sessionDto.session;
        let countQuery = `SELECT COUNT(*) FROM ${moduleName};`;
        let countReqParams = `_operation=query&_session=${sessionId}&module=${moduleName}` +
            `&page=0&query=${countQuery}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

        return this.http.post(url, countReqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractTotalCountForModule(res));
    }

    /**
     * Total potential in current month with status [Chốt HĐ]
     * @param sessionDto
     * @param dateFilter
     */
    public getPotentialsToContractTotalCountByUser(sessionDto: UserLoginSessionDto, dateFilter: String): Observable<any> {
      let sessionId = sessionDto.session;
      let curUserId = sessionDto.userIdWithModuleId;
      let countQuery = `SELECT count(*) FROM Potentials WHERE sales_stage in ('Chốt HĐ') `
          + `and  createdtime >= '${dateFilter}' `;
      if(sessionDto.userName !== 'admin'){
          countQuery += ` and assigned_user_id = '${curUserId}'`;
      }
      countQuery += ` ;`;

      let countReqParams = `_operation=query&_session=${sessionId}&module=${MODULE_NAMES.Potentials}` +
          `&page=0&query=${countQuery}`;

      //console.log('countQuery for Potentials: ', countQuery);

      let header = new Headers();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

      return this.http.post(url, countReqParams, {
              headers: header
          })
          .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
          .map(res => this.extractTotalCountForModule(res));
  }

    public getPotentialsTotalCountByUser(sessionDto: UserLoginSessionDto, dateFilter: String): Observable<any> {
        let sessionId = sessionDto.session;
        let curUserId = sessionDto.userIdWithModuleId;
        let countQuery = `SELECT count(*) FROM Potentials WHERE sales_stage in ('Gặp gỡ', 'Đánh giá', 'Giới thiệu', 'Thử xe', 'Báo giá', 'Đàm phán') `
            + `and  createdtime >= '${dateFilter}' `;
        if(sessionDto.userName !== 'admin'){
            countQuery += ` and assigned_user_id = '${curUserId}'`;
        }
        countQuery += ` ;`;

        let countReqParams = `_operation=query&_session=${sessionId}&module=${MODULE_NAMES.Potentials}` +
            `&page=0&query=${countQuery}`;

        //console.log('countQuery for Potentials: ', countQuery);

        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

        return this.http.post(url, countReqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractTotalCountForModule(res));
    }

    public getModuleTotalCountForFilter(sessionDto: UserLoginSessionDto, filterId: number): Observable<any> {

        let sessionId = sessionDto.session;
        let countReqParams = `_operation=filterDetailsWithCount&_session=${sessionId}` +
            `&filterid=${filterId}`;
        let header = new Headers();

        header.append('Content-Type', 'application/x-www-form-urlencoded');

        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

        return this.http.post(url, countReqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS);
    }

    private extractTotalCountForModule(res: Response): any {
      // console.log('************* res=', res.text());
        // let data = res.json();
      let data = JSON.parse(res.text().trim());
      // error: 1501 -> Login required : session token may expired
      if(data && !data.success && data.error && data.error.code === 1501)
          return Observable.throw(new Error(data.error.message));

      if(!data.result.records || data.result.records.length === 0)
          return 0;

      return data.result.records[0].count;
    }

    public getRecentActivities(sessionDto: UserLoginSessionDto): Observable<any> {

        let sessionId = sessionDto.session;
        let reqParams = `_operation=history&_session=${sessionId}&module=Home&mode=All`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;

        return this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractRecentActivityDto(res));
    }

    private extractRecentActivityDto(res: Response): any {
        let result = new Array<RecentActivityDto>();
        let data = res.json();

        if(data && !data.success && data.error && data.error.code === 1501)
            return Observable.throw(new Error(data.error.message));

        if(data && !data.success)
            return result;

        return data.result.history
            .filter((item, idx) => idx < 10)
            .map(item => {
                let dto = new RecentActivityDto();
                dto.id = item.id;
                dto.modifiedUser = item.modifieduser;
                dto.label = item.label;
                dto.modifiedTime = new Date(item.modifiedtime + ' UTC').toISOString();
                dto.status = item.status;
                dto.statusLabel = item.statuslabel;
                return dto;
            });
    }
}

