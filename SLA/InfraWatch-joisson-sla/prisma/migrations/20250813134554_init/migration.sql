-- CreateEnum
CREATE TYPE "public"."SLAStatus" AS ENUM ('PENDING', 'MET', 'BREACHED');

-- CreateTable
CREATE TABLE "public"."Sla" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "targetSli" DOUBLE PRECISION NOT NULL,
    "achievedSli" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "public"."SLAStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sli" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "achieved" DOUBLE PRECISION NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sli_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Sla" ADD CONSTRAINT "Sla_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sli" ADD CONSTRAINT "Sli_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
