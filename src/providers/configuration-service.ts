export enum APP_EVENTS {
    SIGNIN,
    SIGNOUT,
    SIGNUP
};

export const MODULE_NAMES = {
    Contacts: 'Contacts',
    Accounts: 'Accounts',
    Potentials: 'Potentials',
    Calendar: 'Calendar',
    Users: 'Users',
    Home: 'Home',
    Campaigns: 'Campaigns',
    Vendors: 'Vendors',
    Faq: 'Faq',
    Quotes: 'Quotes',
    SalesOrder: 'SalesOrder',
    Invoice: 'Invoice',
    Products: 'Products',
    Documents: 'Documents',
    Emails: 'Emails',
    HelpDesk: 'HelpDesk',
    PBXManager: 'PBXManager',
    ServiceContracts: 'ServiceContracts',
    Services: 'Services',
    Assets: 'Assets',
    ModComments: 'ModComments',
    ProjectMilestone: 'ProjectMilestone',
    ProjectTask: 'ProjectTask',
    Project: 'Project',
    SMSNotifier: 'SMSNotifier',
    SQLReports: 'SQLReports'
}

export const API_OPERATIONS = {
    syncModuleRecords: 'syncModuleRecords'
}

export const API_KEYS = {
    msCvApiKey1: '641c0b564cc64f7ab5608abab0b3d4f7',
    msCvApiKey2: '213b23d54f854937811c0c0f487aab4f'
}

export const API_URLS = {
    MsOcrApi: 'https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr'    
}

export const APP_CONSTANTS = {
    appBaseUrl: 'http://amc.prisma.vn',
    mobileApiPath: '/modules/Mobile/api.php',
    listingPageSize: 10,
    API_REQ_TIMEOUT_MS: 30000
}

export const STORAGE_KEYS = {
    userLoginToken: 'userLoginToken',
    dataSyncInfo: 'dataSyncInfo',
    currentLanguage: 'currentLanguage',
    autoRunSyncAfterLogin: 'autoRunSyncAfterLogin',
    rememberPassword: 'rememberPassword',
    storedCrmUrl: 'storedCrmUrl',
    storedUserName: 'storedUserName',
    storedPassword: 'storedPassword',
    
    loginStateKey: 'loginStateKey',
    userSessionId: 'userSessionId',
    userDetailDtoKey: 'userDetailDtoKey',
    allSystemUsers: 'allSystemUsers',
    
    calendarModulePickList: 'calendarModulePickList',
    contactModulePickList: 'ContactModulePickList',
    accountModulePickList: 'AccountModulePickList',
    potentialModulePickList: 'PotentialModulePickList',

    accountModuleFormSchema: 'accountModuleFormSchema',
    contactModuleFormSchema: 'contactModuleFormSchema',
    potentialModuleFormSchema: 'potentialModuleFormSchema',

    calendarModuleSyncData: 'calendarModuleSyncData',
    contactModuleSyncData: 'contactModuleSyncData',
    accountModuleSyncData: 'accountModuleSyncData',
    potentialModuleSyncData: 'potentialModuleSyncData',
    campaignModuleSyncData: 'campaignModuleSyncData'
}

export const SORTED_FIELDS = {
    ContactCreatedDate: 'createdtime desc',
    ContactModifiedDate: 'modifiedtime desc',
    ContactFirstName: 'firstname asc',
    ContactLastName: 'lastname asc',

    AccountName: 'accountname',
    AccountCreatedTime: 'createdtime',
    AccountModifiedTime: 'modifiedtime',

    PotentialName: 'potentialname',
    PotentialCreatedTime: 'createdtime',
    PotentialModifiedTime: 'modifiedtime',
}