-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('POSTED', 'HIDDEN', 'REMOVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "matchRating" INTEGER NOT NULL,
    "motmPlayerId" TEXT,
    "text" TEXT NOT NULL,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "takes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "takes_fixtureId_createdAt_id_idx" ON "takes"("fixtureId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "takes_userId_createdAt_id_idx" ON "takes"("userId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "takes_userId_clientId_key" ON "takes"("userId", "clientId");

-- AddForeignKey
ALTER TABLE "takes" ADD CONSTRAINT "takes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
