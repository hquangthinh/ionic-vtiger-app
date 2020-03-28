export class BaseQueryCommand {
    sessionId: string;
    appBaseUrl: string;
}

export class SearchContactCommand extends BaseQueryCommand {
    pageNumber: number; // start from page 1
    keyword: string;
    sortedField: string;
}

export class KeywordSearchCommand extends BaseQueryCommand {
    pageNumber: number; // start from page 1
    keyword: string;
    sortedField: string;
}

export class FetchModuleQueryForAlertCommand extends BaseQueryCommand {
    alertId: string;
    module: string;
}