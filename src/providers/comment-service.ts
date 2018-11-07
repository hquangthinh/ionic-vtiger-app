// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';
// import { Storage } from '@ionic/storage';

import { APP_CONSTANTS} from './configuration-service';
import { UserLoginSessionDto } from '../model/login-dto';
import { ModuleUtil } from '../utils/module-util';

@Injectable()
export class CommentService {

    constructor(
        public http: Http
    ) {
    }

    public getModuleComments(userSessionDto: UserLoginSessionDto, moduleName: string, recordId: string): Promise<any[]> {
        let recordIdSuffix = ModuleUtil.getRecordIdSuffixFromModuleRecordId(recordId);
        let sessionId = userSessionDto.session;
        let reqParams = `_operation=history&_session=${sessionId}&module=${moduleName}&record=${recordId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = userSessionDto.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractModuleComment(res, recordIdSuffix));

        return $obs.toPromise();
    }

    private extractModuleComment(res: Response, recordId: string): any[] {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());
        if(!data || !data.success)
            return new Array();

        return data && data.success && data.result && data.result.history ?
            data.result.history.filter(
                el => el.values && el.values.related_to && el.values.related_to.current === recordId
            )
            : new Array();
    }
}
