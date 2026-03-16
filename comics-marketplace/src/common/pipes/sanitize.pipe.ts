import sanitizeHtml from 'sanitize-html';
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      // delete html tags and attributes to prevent XSS attacks
      return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    }
    if (typeof value === 'object' && value !== null) {
      // sanitize all dtos recursively
      for (const key of Object.keys(value)) {
        value[key] = this.transform(value[key]);
      }
    }
    return value;
  }
}