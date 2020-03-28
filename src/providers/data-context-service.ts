/**
 * centralize data access service
 */
// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import 'rxjs/Rx';
import {Http } from '@angular/http'
import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';

// import { APP_CONSTANTS, API_URLS, STORAGE_KEYS, MODULE_NAMES  } from './configuration-service';
// import { UserLoginSessionDto } from '../model/login-dto';

@Injectable()
export class DataContextService {

    constructor(
        public http: Http,
        public storage: Storage
    ){}


}
