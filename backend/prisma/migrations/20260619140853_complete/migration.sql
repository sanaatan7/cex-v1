/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Sides" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "OrderTypes" AS ENUM ('LIMIT', 'MARKET');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('FILLED', 'P_FILLED', 'NOT_FILLED');

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stocks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "symbol" TEXT,

    CONSTRAINT "Stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" SERIAL NOT NULL,
    "side" "Sides" NOT NULL,
    "type" "OrderTypes" NOT NULL,
    "price" INTEGER,
    "qty" INTEGER NOT NULL,
    "filledQty" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stocksId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fills" (
    "id" SERIAL NOT NULL,
    "qty" INTEGER NOT NULL,
    "side" "Sides" NOT NULL,
    "type" "OrderTypes" NOT NULL,
    "userId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "asset" TEXT NOT NULL,
    "originalOrderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Stocks_title_key" ON "Stocks"("title");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_stocksId_fkey" FOREIGN KEY ("stocksId") REFERENCES "Stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Stocks"("title") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_originalOrderId_fkey" FOREIGN KEY ("originalOrderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
