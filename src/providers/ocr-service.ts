// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import { Http, Headers } from '@angular/http'
import { Injectable } from '@angular/core';

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
    let url = `${API_URLS.MsOcrApi}?language=en&detectOrientation=true`;
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
        // console.log(data);

        if (!data) {
          // error response
          return {
            success: false,
            message: 'unable to process request'
          };
        }

        if (data.code && data.message) {
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

    if (!data.regions || !Array.isArray(data.regions)) {
      return new Array<string>();
    }

    let textLines =
      data.regions.map(
        r => r.lines.map(l => l.words.map(w => w.text).join(" "))
      );

    return [].concat.apply([], textLines);
  }

  public regconizeTextWithGoogleVision(imageBase64Encode): Promise<any> {
    let url = `${API_URLS.GoogleVisionOcrApi}?key=${API_KEYS.googleVisionApiKey}`;
    let header = new Headers();
    header.append('Content-Type', 'application/json');
    // header.append('Authorization', `Bearer ${API_KEYS.googleVisionApiKey}`);
    let postData = {
      requests: [
        {
          'image': {
            'content': imageBase64Encode
          },
          'features': [
            {
              'type': 'TEXT_DETECTION'
            }
          ]
        }
      ]
    };

    let $obs = this.http.post(url, postData, {
      headers: header
    })
    .timeout(APP_CONSTANTS.API_REQ_TIMEOUT_MS)
    .map(
      res => res.json()
    );

    return $obs.toPromise().then(
      data => {
        // console.log(data);

        if (!data) {
          // error response
          return {
            success: false,
            message: 'unable to process request'
          };
        }

        if (data.code && data.message) {
          // error response
          return {
            success: false,
            message: data.message
          };
        }

        // success response
        return {
          success: true,
          lines: this.extractTextLinesFromGoogleVisionApi(data)
        };
      }
    );
  }

  private extractTextLinesFromGoogleVisionApi(data) : Array<string> {
    var lines = new Array<string>();

    if(data && data.responses && data.responses.length > 0) {
      let textInfo = data.responses[0];
      let rawLines = textInfo.fullTextAnnotation.text;
      console.log(rawLines.split('\n'));
      return rawLines.split('\n');
    }

    return lines;
  }
}
