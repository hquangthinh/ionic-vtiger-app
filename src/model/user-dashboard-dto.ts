export class UserDashboardViewModel {
    totalTask: number;
    totalAlert: number;
    totalContact: number;
    totalAccount: number;
    totalPotential: number;
}

export class RecentActivityDto {
    id: string;
    modifiedUser: any;
    modifiedTime: string;
    status: string;
    statusLabel: string;
    label: string;
}