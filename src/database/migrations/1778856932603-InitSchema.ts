import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778856932603 implements MigrationInterface {
    name = 'InitSchema1778856932603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_4c2ab4e556520045a2285916d45"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_44191d25fbfcb4f760233f25715"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efb1aea2faf7d0c2f69bf12537"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "author"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "isbn"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "available"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "dueDate"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "fine"`);
        await queryRunner.query(`ALTER TABLE "items" ADD "code" character varying(32) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."items_type_enum" AS ENUM('book', 'magazine', 'equipment')`);
        await queryRunner.query(`ALTER TABLE "items" ADD "type" "public"."items_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "items" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "loans" ADD "loanedAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loans" ADD "dueAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loans" ADD "fineAmount" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'librarian', 'member')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."loans_status_enum" RENAME TO "loans_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."loans_status_enum" AS ENUM('active', 'returned', 'overdue', 'lost')`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "status" TYPE "public"."loans_status_enum" USING "status"::"text"::"public"."loans_status_enum"`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."loans_status_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1b0a705ce0dc5430c020a0ec31" ON "items" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_fc93811078d7fd7a36d773175a" ON "loans" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_0840bf4a3052204ad0097cea97" ON "loans" ("itemId", "status") `);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "CHK_bc0a8a70e0bcd6a7cf2e1bf1c3" CHECK ("dueAt" > "loanedAt")`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_4c2ab4e556520045a2285916d45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_44191d25fbfcb4f760233f25715" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_44191d25fbfcb4f760233f25715"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_4c2ab4e556520045a2285916d45"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "CHK_bc0a8a70e0bcd6a7cf2e1bf1c3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0840bf4a3052204ad0097cea97"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc93811078d7fd7a36d773175a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b0a705ce0dc5430c020a0ec31"`);
        await queryRunner.query(`CREATE TYPE "public"."loans_status_enum_old" AS ENUM('active', 'returned')`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "status" TYPE "public"."loans_status_enum_old" USING "status"::"text"::"public"."loans_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."loans_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."loans_status_enum_old" RENAME TO "loans_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'other')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "fineAmount"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "dueAt"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "loanedAt"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."items_type_enum"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "loans" ADD "fine" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "loans" ADD "dueDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "items" ADD "available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "items" ADD "isbn" character varying(32) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "items" ADD "author" character varying(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_efb1aea2faf7d0c2f69bf12537" ON "items" ("isbn") `);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_44191d25fbfcb4f760233f25715" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_4c2ab4e556520045a2285916d45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
