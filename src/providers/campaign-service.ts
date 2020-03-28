// import {Observable, BehaviorSubject, Subject} from 'rxjs';
import {Http } from '@angular/http'
import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';

import { STORAGE_KEYS } from './configuration-service';
import { CampaignDto } from '../model/shared-dto';
// import { BaseQueryCommand } from '../model/search-commands';

@Injectable()
export class CampaignService {

    constructor(
        public http: Http,
        public storage: Storage
    ) {
    }

    // access offline data store
    // return array of raw campaign dto
    public loadCampaignListFromStorage(): Promise<Array<CampaignDto>> {
        return this.storage.get(STORAGE_KEYS.campaignModuleSyncData).then(
            storedData => this.extractCampaignList(storedData)
        );
    }

    public extractCampaignList(jsonArrData): Array<CampaignDto> {
        if(!jsonArrData)
            return new Array<CampaignDto>();

        return jsonArrData.map(
            el => this.transformFormElementToCampaignDto(el)
        );
    }

    private transformFormElementToCampaignDto(elForm: any): CampaignDto {
        let formBlock = elForm.blocks[0];
        let fields = formBlock.fields;
        let dto = new CampaignDto();

        dto.id = elForm.id;
        dto.campaignname = this.getFieldValue(fields, 'campaignname');
        dto.campaign_no = this.getFieldValue(fields, 'campaign_no');
        dto.campaignstatus = this.getFieldValue(fields, 'campaignstatus');
        return dto;
    }

    private getFieldValue(fields: Array<any>, fieldName: string): string {
        let field = fields.find(
            f => f.name === fieldName
        );
        return field ? field.value : '';
    }
}
