export class DateTimeUtils {
  static diffInDays(from: Date, to: Date) {
    return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 60));
  }
}
