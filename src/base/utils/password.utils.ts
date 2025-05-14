import * as bcrypt from 'bcrypt';

export class PasswordUtils {
  private static saltOrRounds = 10;

  public static hashPassword(password: string) {
    return bcrypt.hashSync(password, this.saltOrRounds);
  }

  public static isMatchPassword(password: string, hashedPassword: string) {
    return bcrypt.compareSync(password, hashedPassword);
  }
}
