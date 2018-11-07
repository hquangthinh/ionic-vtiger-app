export class DataSyncInfoDto {
    lastSyncDateTime: Date;
    nextSyncToken: number;
}

export class BaseDto {
    id: string;
    nameInitial: string;
    createdtime: Date;
    modifiedtime: Date;
    createdByUserId: any;
}

export const CALENDAR_EVENT_TYPES = {
    event: 'event',
    task: 'task'
}

export class CalendarDto extends BaseDto {
    subject: string;
    eventType: string; // calendar event, task or others
    date_start: Date;
    time_start: Date; // time start contains date start info
    date_time_start: Date; // combination of date_start & time_start
    taskstatus: string; // Completed, Not Started, ...
    assigned_user_id: any;
    activityType: string;
}

export class CalendarGroupDto {
    groupKey: string;
    values: Array<CalendarDto>;
}

export class CalendarDetailDto extends CalendarDto {

}

export class AccountDto extends BaseDto {
    accountname: string;
    account_no: string;
    website: string;
    phone: string;
    email: string;
}

export class AccountDetailDto extends AccountDto {

}

export class PotentialDto extends BaseDto {
    potential_no: string;
    potentialname: string;
    sales_stage: string;
    contact_id: string; // refer to id & name of contact
    contact_name: string;
    contact_phone: string;
}

export class PotentialDetailDto extends PotentialDto {

}

export class CampaignDto extends BaseDto {
    campaign_no: string;
    campaignname: string;
    campaignstatus: string;
}
