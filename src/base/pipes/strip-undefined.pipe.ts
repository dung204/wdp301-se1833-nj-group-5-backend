import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class StripUndefinedPipe implements PipeTransform {
  transform(value: any, _: ArgumentMetadata) {
    return instanceToPlain(value, { exposeUnsetFields: false });
  }
}
