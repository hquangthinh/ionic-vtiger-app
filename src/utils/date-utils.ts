export class DateUtils {

    public static getHourDurationFromDate(date1: any, date2: any): number {
        let dateStart = typeof(date1) === 'string' ? new Date(date1) : date1;
        let endDate = typeof(date1) === 'string' ? new Date(date2) : date2;
        let durationInMs = Math.abs(endDate - dateStart);        
        return durationInMs / (1000 * 60 * 60);
    }

    public static getHourDurationFromTime(time1: string, time2: string): number {
        // time is in format hh:MM:ss
        let timeParts1 = time1.split(':');
        let timeParts2 = time2.split(':');
        if(timeParts1.length === 0 || timeParts2.length === 0)
            return 0;
        let t1 = parseInt(timeParts1[0]);
        let t2 = parseInt(timeParts2[0]);
        return Math.abs(t1-t2);
    }

    public static getMinuteDurationFromTime(time1: string, time2: string): number {
        // time is in format hh:MM:ss
        let timeParts1 = time1.split(':');
        let timeParts2 = time2.split(':');
        if(timeParts1.length === 0 || timeParts2.length === 0)
            return 0;
        let t1 = parseInt(timeParts1[1]);
        let t2 = parseInt(timeParts2[1]);
        return Math.abs(t1-t2);
    }
}