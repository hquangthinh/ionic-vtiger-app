export class LoginDto {
    crmUrl: string;
    userName: string;
    password: string;
}

export class UserLoginSessionDto {
    createdAt: Date; // datetime when this session dto is created
    userid: string;
    userIdWithModuleId: string;
    userName: string;
    crm_tz: string;
    user_tz: string;
    user_currency: string;
    session: string;
    vtiger_version: string;
    date_format: string;
    mobile_module_version: string;
    appBaseUrl: string;
    isOfflineMode: boolean;
}