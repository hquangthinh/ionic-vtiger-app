import {Observable} from 'rxjs';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';

import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, STORAGE_KEYS } from './configuration-service';
import { UserDetailDto } from '../model/user-detail-dto';
import { UserLoginSessionDto } from '../model/login-dto';

@Injectable()
export class UserService {

    constructor(
        public http:Http,
        public storage: Storage
    ) {
    }

    // methods
    public getUserDetail(sessionDto: UserLoginSessionDto, userId: string): Observable<UserDetailDto> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=fetchRecord&_session=${sessionId}&record=${userId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractUserDetailDto(res));

        return $obs;
    }

    private extractUserDetailDto(res: Response): UserDetailDto {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        let userDetailDto = new UserDetailDto();
        if(data && !data.success)
            return userDetailDto;

        if(!data.result.record)
            return userDetailDto;

        userDetailDto.userId = data.result.record.id;
        userDetailDto.userName = data.result.record.user_name;
        userDetailDto.firstName = data.result.record.first_name;
        userDetailDto.lastName = data.result.record.last_name;
        userDetailDto.fullName = userDetailDto.firstName + userDetailDto.lastName;
        userDetailDto.email = data.result.record.email;
        userDetailDto.status = data.result.record.status;
        userDetailDto.roleId = data.result.record.roleid;

        return userDetailDto;
    }

    public getCurrentUserSessionId(): Promise<UserLoginSessionDto> {
        return this.storage.get(STORAGE_KEYS.userSessionId);
    }

    // get all users from system
    public getAllSystemUsersFromStorage(): Observable<any> {
        return Observable.fromPromise(this.storage.get(STORAGE_KEYS.allSystemUsers));
    }

    // get all users from system
    // listModuleRecords
    public getAllSystemUsers(sessionDto: UserLoginSessionDto): Observable<any> {
        let sessionId = sessionDto.session;
        let reqParams = `_operation=listModuleRecords&_session=${sessionId}&module=Users`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = sessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractUserDto(res));

        return $obs;
    }

    private extractUserDto(res: Response): Array<UserDetailDto> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(data && !data.success)
            return new Array<UserDetailDto>();

        return data.result.records.map(
            item => {
                let userDto = new UserDetailDto();
                userDto.userId = item.id;
                userDto.fullName = item.label;
                return userDto;
            }
        );
    }
}
