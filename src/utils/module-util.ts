export class ModuleUtil {

    // return record id part from 12x12345 -> 12345
    public static getRecordIdSuffixFromModuleRecordId(moduleRecordId: string) {
        if(!moduleRecordId || moduleRecordId === '')
            return '';
        let parts = moduleRecordId.split('x');
        return parts && parts.length === 2 ? parts[1] : '';
    }
}