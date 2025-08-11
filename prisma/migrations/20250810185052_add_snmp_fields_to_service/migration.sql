-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "lastResponseMs" INTEGER,
ADD COLUMN     "sysDescr" TEXT,
ADD COLUMN     "sysName" TEXT;
