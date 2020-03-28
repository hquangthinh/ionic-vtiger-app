/**
 * A pipe that format value for fields response from vtiger format
 */
import { Pipe, PipeTransform } from '@angular/core';
import { DataFormatUtil } from '../utils/data-format-util';

@Pipe({name: 'formatFieldValueAsString'})
export class FormatFieldValueAsStringPipe implements PipeTransform {
  transform(value: string, uitype: number): string {
    return DataFormatUtil.formatFieldValueAsString(value, uitype);
  }
}

@Pipe({name: 'formatFieldValueAsDateTime'})
export class FormatFieldValueAsDateTimePipe implements PipeTransform {
  transform(value: string, uitype: number): Date {
    return DataFormatUtil.formatFieldValueAsDateTime(value, uitype);
  }
}

@Pipe({name: 'formatSalutationType'})
export class FormatSalutationType implements PipeTransform {
  transform(value: string): string {
    let sVal = value ? value.toLowerCase() : '';
    switch(sVal){      
      case 'br.':
      case 'br':
        return 'Anh';

      case 'ss.':
      case 'ss':
        return 'Chị';

      case 'mr.':
      case 'mr':
        return 'Ông';

      case 'ms.':
      case 'ms':
        return 'Bà';      
    }
    return value;
  }
}