
export class DataFormatUtil {
    public static getFieldType(uitype: any): string {      
        let uiTypeNumber = parseInt(uitype);      
        if(uiTypeNumber === 10 || uiTypeNumber === 15 || uiTypeNumber === 16 || uiTypeNumber === 52 
            || uiTypeNumber === 53 || uiTypeNumber === 55)
            return 'dropdown';
        
        if(uiTypeNumber === 56)
            return 'boolean';     
        
        if(uiTypeNumber === 5 || uiTypeNumber === 6 || uiTypeNumber === 23 || uiTypeNumber === 70)
            return 'datetime';     

        return  'text';
  }

  public static getDateValue(sValue: string): Date {
    if(sValue && sValue != '')
        return new Date(sValue);
    return null;
  }  

  // format value as string used for field text, dropdown, boolean
  // do not use for datetime
  public static formatFieldValueAsString(value: any, uitype: any): string {
    let dataType = DataFormatUtil.getFieldType(uitype);
    if('boolean' === dataType)
        return value === '1' ? 'Yes' : 'No';

    if(typeof value === 'object')
        return value.label && value.label !== '' ? value.label : '---';
    
    return value && value !== '' ? value : '---';    
  }

  // format value as datetime
  public static formatFieldValueAsDateTime(value: any, uitype: any): Date {
    let dataType = DataFormatUtil.getFieldType(uitype);
    if('datetime' !== dataType)
        return null;        
    return new Date(value);
  }

}