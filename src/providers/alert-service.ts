// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import {Http, Headers, Response } from '@angular/http'
import {Injectable} from '@angular/core';
// import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, MODULE_NAMES } from './configuration-service';

import { BaseQueryCommand, FetchModuleQueryForAlertCommand } from '../model/search-commands';
import { AlertDto } from '../model/alert-dto';

@Injectable()
export class AlertService {

    constructor(
        public http: Http
    ) {
    }

    public fetchAllAlerts(queryCommand: BaseQueryCommand) : Promise<Array<AlertDto>> {
        let sessionId = queryCommand.sessionId;
        let reqParams = `_operation=fetchAllAlerts&_session=${sessionId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = queryCommand.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractAlertDto(res));

        return new Promise(
            (resolved, rejected) => {
                $obs.subscribe(
                    data => resolved(data),
                    err => rejected(err)
                );
            }
        );
    }

    private extractAlertDto(res: Response): Array<AlertDto> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());

        if(data && !data.success)
            return new Array<AlertDto>();

        return data.result.alerts
            .filter(val => val && (val.category === MODULE_NAMES.Potentials
                || val.category === MODULE_NAMES.Calendar))
            .map(
                dbRecord => {
                    let dto = new AlertDto();

                    dto.alertid = dbRecord.alertid;
                    dto.name = dbRecord.name;
                    dto.category = dbRecord.category;
                    dto.refreshRate = dbRecord.refreshRate;
                    dto.description = dbRecord.description;
                    dto.recordsLinked = dbRecord.recordsLinked;
                    dto.totalAlertCount = 0;

                    if(dto.category === MODULE_NAMES.Potentials){
                        dto.iconName = "stats";
                    }else if(dto.category === MODULE_NAMES.Calendar){
                        dto.iconName = "calendar";
                    }

                    return dto;
                }
            );
    }

    // doListModuleRecords with alert id -> fetch all modules records with
    // specified alert id
    // return list of records, ex:
    // {
    //     "id": "13x2995",
    //     "label": "ACCENT 1.4AT"
    // }
    public fetchModuleRecordsWithAlertId(queryCommand: FetchModuleQueryForAlertCommand) : Promise<any> {
        let sessionId = queryCommand.sessionId;
        let reqParams = `_operation=listModuleRecords&_session=${sessionId}&module=${queryCommand.module}&alertid=${queryCommand.alertId}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        let url = queryCommand.appBaseUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, reqParams, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
            .map(res => this.extractModuleRecords(res));

        return new Promise(
            (resolved, rejected) => {
                $obs.subscribe(
                    data => resolved(data),
                    err => rejected(err)
                );
            }
        );
    }

    private extractModuleRecords(res: Response) : Array<any> {
        // let data = res.json();
        let data = JSON.parse(res.text().trim());

        if(data && !data.success)
            return new Array<any>();

        return data.result.records;
    }
}
