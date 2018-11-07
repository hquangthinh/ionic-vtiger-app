/**
 * {
        "alertid": "1",
        "name": "Idle Ticket Alert",
        "category": "HelpDesk",
        "refreshRate": 3600,
        "description": "Alert sent when ticket has not been updated in 24 hours",
        "recordsLinked": true
    }
 */
export class AlertDto {
    alertid: string;
    name: string;
    category: string;
    refreshRate: number;
    description: string;
    recordsLinked: boolean;
    iconName: string;
    totalAlertCount: number;
}
