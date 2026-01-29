-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('API_FOOTBALL', 'FOTMOB', 'SOFASCORE');

-- CreateTable
CREATE TABLE "fixtures" (
    "id" TEXT NOT NULL,
    "status" "FixtureStatus" NOT NULL,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "competition" TEXT,
    "season" TEXT,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_fixture_maps" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "providerFixtureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_fixture_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixture_enrichments" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ttlSeconds" INTEGER NOT NULL,

    CONSTRAINT "fixture_enrichments_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add fixtureRefId to takes (nullable)
ALTER TABLE "takes" ADD COLUMN "fixtureRefId" TEXT;

-- CreateIndex
CREATE INDEX "fixtures_kickoffAt_idx" ON "fixtures"("kickoffAt");

-- CreateIndex
CREATE INDEX "fixtures_status_kickoffAt_idx" ON "fixtures"("status", "kickoffAt");

-- CreateIndex
CREATE UNIQUE INDEX "provider_fixture_maps_provider_providerFixtureId_key" ON "provider_fixture_maps"("provider", "providerFixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_fixture_maps_fixtureId_provider_key" ON "provider_fixture_maps"("fixtureId", "provider");

-- CreateIndex
CREATE INDEX "provider_fixture_maps_fixtureId_provider_idx" ON "provider_fixture_maps"("fixtureId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "fixture_enrichments_fixtureId_provider_kind_key" ON "fixture_enrichments"("fixtureId", "provider", "kind");

-- CreateIndex
CREATE INDEX "fixture_enrichments_fixtureId_provider_kind_idx" ON "fixture_enrichments"("fixtureId", "provider", "kind");

-- CreateIndex
CREATE INDEX "takes_fixtureRefId_idx" ON "takes"("fixtureRefId");

-- AddForeignKey (provider_fixture_maps -> fixtures)
ALTER TABLE "provider_fixture_maps" ADD CONSTRAINT "provider_fixture_maps_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (fixture_enrichments -> fixtures)
ALTER TABLE "fixture_enrichments" ADD CONSTRAINT "fixture_enrichments_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (takes -> fixtures, optional)
ALTER TABLE "takes" ADD CONSTRAINT "takes_fixtureRefId_fkey" FOREIGN KEY ("fixtureRefId") REFERENCES "fixtures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
