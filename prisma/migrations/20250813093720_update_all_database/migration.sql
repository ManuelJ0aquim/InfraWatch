/*
  Warnings:

  - The values [UNKNOWN] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `checkEveryS` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `lastResponseMs` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `sysDescr` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `sysName` on the `Service` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Status_new" AS ENUM ('UP', 'DOWN');
ALTER TABLE "public"."Service" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "public"."Status" RENAME TO "Status_old";
ALTER TYPE "public"."Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "checkEveryS",
DROP COLUMN "lastResponseMs",
DROP COLUMN "status",
DROP COLUMN "sysDescr",
DROP COLUMN "sysName";
