// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import {Http, Headers } from '@angular/http'
import {Injectable} from '@angular/core';

// import { Storage } from '@ionic/storage';

import { APP_CONSTANTS, API_URLS, API_KEYS } from './configuration-service';
// import { UserLoginSessionDto } from '../model/login-dto';

@Injectable()
export class OcrService {

    constructor(
        public http: Http
    ) {
    }

    public recognizeText(imageBinData: any): Promise<any> {
        let url =  `${API_URLS.MsOcrApi}?language=en&detectOrientation=true`;
        let header = new Headers();
        header.append('Content-Type', 'application/octet-stream');
        header.append('Ocp-Apim-Subscription-Key', API_KEYS.msCvApiKey1);

        let $obs = this.http.post(url, imageBinData, {
            headers: header
        })
        .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
        .map(
            res => res.json()
        );

        return $obs.toPromise().then(
            data => {
                console.log(data);

                if(!data){
                    // error response
                    return {
                        success: false,
                        message: 'unable to process request'
                    };
                }

                if(data.code && data.message) {
                    // error response
                    return {
                        success: false,
                        message: data.message
                    };
                }

                // success response
                return {
                    success: true,
                    lines: this.extractTextLines(data)
                };
            }
        );
    }

    private extractTextLines(data: any): Array<string> {

        if(!data.regions || !Array.isArray(data.regions)){
            return new Array<string>();
        }

        let textLines =
                data.regions.map(
	                r => r.lines.map(l => l.words.map(w => w.text).join(" "))
                );

        return [].concat.apply([], textLines);
    }
}
