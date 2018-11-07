import {Observable} from 'rxjs';
import {Http, Headers } from '@angular/http'
import {Injectable} from '@angular/core';

import { Storage } from '@ionic/storage';

import { APP_CONSTANTS } from './configuration-service';

@Injectable()
export class AuthenticationService {

    constructor(public http:Http, public storage: Storage) {

    }

    // methods
    public signin(crmUrl: string, username: string, password: string): Observable<any> {
        let creds = `_operation=login&username=${username}` +
            `&password=${password}`;
        let header = new Headers();
        header.append('Content-Type', 'application/x-www-form-urlencoded');
        if(!crmUrl.toLocaleLowerCase().startsWith('http')){
            crmUrl = 'http://' + crmUrl.toLocaleLowerCase();
        }
        let url = crmUrl + APP_CONSTANTS.mobileApiPath;
        var $obs = this.http.post(url, creds, {
                headers: header
            })
            .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS);

        return $obs;
    }
}
