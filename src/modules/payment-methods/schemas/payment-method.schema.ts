import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';

@Schema()
export class PaymentMethod extends BaseSchema {
  @Prop({
    type: String,
    length: 256,
    required: true,
  })
  name!: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

export type PaymentMethodDocument = HydratedDocument<PaymentMethod>;
