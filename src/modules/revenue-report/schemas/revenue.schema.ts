import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';

@Schema({ collection: 'daily_revenue_reports' }) // set name for the collection
export class DailyRevenueReport extends BaseSchema {
  @Prop({ type: String, ref: 'Hotel', required: true })
  hotel!: Hotel;

  @Prop({ required: true })
  date!: Date; // Ngày của báo cáo, chỉ lưu ngày, tháng, năm (giờ, phút, giây = 0)

  @Prop({ required: true })
  totalRevenue!: number;

  @Prop({ required: true })
  totalBookings!: number;
}

export const DailyRevenueReportSchema = SchemaFactory.createForClass(DailyRevenueReport);

DailyRevenueReportSchema.index({ hotel: 1, date: 1 }, { unique: true });

// populate
DailyRevenueReportSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['hotel']);
  next();
});

export type RevenueDocument = HydratedDocument<DailyRevenueReport>;
