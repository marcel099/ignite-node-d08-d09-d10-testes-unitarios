import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class alterStatementsTableAlterTypeColumnAddSenderIdColumn1657235817364 implements MigrationInterface {
    name = 'alterStatementsTableAlterTypeColumnAddSenderIdColumn1657235817364'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
          "statements",
          new TableColumn({
            name: "sender_id",
            type: "uuid",
            isNullable: true,
          })
        );

        await queryRunner.createForeignKey(
          "statements",
          new TableForeignKey({
            name: "fk_sender_id",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["sender_id"],
            onDelete: "SET NULL",
            onUpdate: "SET NULL",
          })
        );

        // await queryRunner.query(`ALTER TABLE "statements" DROP CONSTRAINT "statements"`);
        // await queryRunner.query(`ALTER TABLE "statements" ADD "sender_id" uuid NOT NULL`);
        // await queryRunner.query(`COMMENT ON COLUMN "users"."id" IS NULL`);
        // await queryRunner.query(`COMMENT ON COLUMN "users"."email" IS NULL`);
        // await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        // await queryRunner.query(`COMMENT ON COLUMN "statements"."id" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."statements_type_enum" RENAME TO "statements_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "statements_type_enum" AS ENUM('deposit', 'withdraw', 'transfer')`);
        await queryRunner.query(`ALTER TABLE "statements" ALTER COLUMN "type" TYPE "statements_type_enum" USING "type"::"text"::"statements_type_enum"`);
        await queryRunner.query(`DROP TYPE "statements_type_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "statements"."type" IS NULL`);
        // await queryRunner.query(`ALTER TABLE "statements" ADD CONSTRAINT "FK_da838838004c4ff8990e7b4de9a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "statements" ADD CONSTRAINT "FK_7a240dd7143667e071ee9972ef9" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
          "statements",
          "fk_sender_id"
        );
        await queryRunner.dropColumn("statements", "sender_id");

        // await queryRunner.query(`ALTER TABLE "statements" DROP CONSTRAINT "FK_7a240dd7143667e071ee9972ef9"`);
        // await queryRunner.query(`ALTER TABLE "statements" DROP CONSTRAINT "FK_da838838004c4ff8990e7b4de9a"`);
        await queryRunner.query(`COMMENT ON COLUMN "statements"."type" IS NULL`);
        await queryRunner.query(`CREATE TYPE "statements_type_enum_old" AS ENUM('deposit', 'withdraw')`);
        await queryRunner.query(`ALTER TABLE "statements" ALTER COLUMN "type" TYPE "statements_type_enum_old" USING "type"::"text"::"statements_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "statements_type_enum"`);
        await queryRunner.query(`ALTER TYPE "statements_type_enum_old" RENAME TO  "statements_type_enum"`);
        // await queryRunner.query(`COMMENT ON COLUMN "statements"."id" IS NULL`);
        // await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        // await queryRunner.query(`COMMENT ON COLUMN "users"."email" IS NULL`);
        // await queryRunner.query(`COMMENT ON COLUMN "users"."id" IS NULL`);
        // await queryRunner.query(`ALTER TABLE "statements" DROP COLUMN "sender_id"`);
        // await queryRunner.query(`ALTER TABLE "statements" ADD CONSTRAINT "statements" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
