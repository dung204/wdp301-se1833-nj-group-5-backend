import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDb1747021554187 implements MigrationInterface {
  name = 'InitDb1747021554187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."Role" AS ENUM('USER', 'ADMIN')
        `);
    await queryRunner.query(`
            CREATE TABLE "accounts" (
                "create_timestamp" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
                "update_timestamp" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
                "delete_timestamp" TIMESTAMP(3) WITH TIME ZONE,
                "create_user_id" uuid NOT NULL,
                "update_user_id" uuid,
                "delete_user_id" uuid,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(256) NOT NULL,
                "password" text NOT NULL,
                "role" "public"."Role" NOT NULL DEFAULT 'USER',
                CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email"),
                CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."Gender" AS ENUM('MALE', 'FEMALE', 'OTHER')
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "create_timestamp" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
                "update_timestamp" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(),
                "delete_timestamp" TIMESTAMP(3) WITH TIME ZONE,
                "create_user_id" uuid NOT NULL,
                "update_user_id" uuid,
                "delete_user_id" uuid,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying(128),
                "gender" "public"."Gender",
                "account_id" uuid,
                CONSTRAINT "REL_17a709b8b6146c491e6615c29d" UNIQUE ("account_id"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_17a709b8b6146c491e6615c29d7" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_17a709b8b6146c491e6615c29d7"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."Gender"
        `);
    await queryRunner.query(`
            DROP TABLE "accounts"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."Role"
        `);
  }
}
