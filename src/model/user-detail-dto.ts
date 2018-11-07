export class UserDetailDto {
    userId: string;
    userName: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    status: string;
    roleId: string;
    moduleFilters: Map<string, number>;
}