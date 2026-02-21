/*
  Warnings:

  - You are about to drop the column `documentId` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `licensePlate` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `tareWeight` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `weighingticket` table. All the data in the column will be lost.
  - You are about to drop the column `grossWeight` on the `weighingticket` table. All the data in the column will be lost.
  - You are about to drop the column `netWeight` on the `weighingticket` table. All the data in the column will be lost.
  - You are about to drop the column `tareWeight` on the `weighingticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `weighingticket` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `weighingticket` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(2))`.
  - You are about to drop the `client` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[dniDocumento]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigoSku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[patenteChasis]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dniDocumento` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreCompleto` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoSku` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patenteChasis` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `WeighingTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weightIn` to the `WeighingTicket` table without a default value. This is not possible if the table is not empty.
  - Made the column `driverId` on table `weighingticket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `Driver_documentId_key` ON `driver`;

-- DropIndex
DROP INDEX `Vehicle_licensePlate_key` ON `vehicle`;

-- DropIndex
DROP INDEX `WeighingTicket_clientId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_driverId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_productId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_ticketNumber_key` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_userId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_vehicleId_fkey` ON `weighingticket`;

-- AlterTable
ALTER TABLE `driver` DROP COLUMN `documentId`,
    DROP COLUMN `name`,
    ADD COLUMN `dniDocumento` VARCHAR(191) NOT NULL,
    ADD COLUMN `nombreCompleto` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `name`,
    DROP COLUMN `type`,
    ADD COLUMN `codigoSku` VARCHAR(191) NOT NULL,
    ADD COLUMN `descripcion` VARCHAR(191) NOT NULL,
    ADD COLUMN `precioUnitario` DECIMAL(65, 30) NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `password`,
    ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('ADMIN', 'OPERATOR', 'AUDITOR') NOT NULL DEFAULT 'OPERATOR';

-- AlterTable
ALTER TABLE `vehicle` DROP COLUMN `licensePlate`,
    DROP COLUMN `tareWeight`,
    ADD COLUMN `companyId` INTEGER NOT NULL,
    ADD COLUMN `patenteAcoplado` VARCHAR(191) NULL,
    ADD COLUMN `patenteChasis` VARCHAR(191) NOT NULL,
    ADD COLUMN `taraRegistrada` DECIMAL(65, 30) NULL;

-- AlterTable
ALTER TABLE `weighingticket` DROP COLUMN `clientId`,
    DROP COLUMN `grossWeight`,
    DROP COLUMN `netWeight`,
    DROP COLUMN `tareWeight`,
    DROP COLUMN `ticketNumber`,
    ADD COLUMN `companyId` INTEGER NOT NULL,
    ADD COLUMN `destino` VARCHAR(191) NULL,
    ADD COLUMN `isManual` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `movementType` ENUM('PURCHASE', 'SALE', 'INTERNAL') NOT NULL DEFAULT 'INTERNAL',
    ADD COLUMN `observations` TEXT NULL,
    ADD COLUMN `origen` VARCHAR(191) NULL,
    ADD COLUMN `referenciaGuia` VARCHAR(191) NULL,
    ADD COLUMN `weightIn` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `weightNet` DECIMAL(65, 30) NULL,
    ADD COLUMN `weightOut` DECIMAL(65, 30) NULL,
    MODIFY `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    MODIFY `driverId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `client`;

-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `razonSocial` VARCHAR(191) NOT NULL,
    `cuitRut` VARCHAR(191) NOT NULL,
    `tipo` ENUM('CLIENT', 'PROVIDER', 'BOTH') NOT NULL DEFAULT 'CLIENT',
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Company_cuitRut_key`(`cuitRut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `contextData` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `companyName` VARCHAR(191) NOT NULL DEFAULT 'BASCULA CASILDA',
    `companyAddress` VARCHAR(191) NULL,
    `companyPhone` VARCHAR(191) NULL,
    `companyEmail` VARCHAR(191) NULL,
    `companyLogo` LONGTEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Driver_dniDocumento_key` ON `Driver`(`dniDocumento`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_codigoSku_key` ON `Product`(`codigoSku`);

-- CreateIndex
CREATE UNIQUE INDEX `Vehicle_patenteChasis_key` ON `Vehicle`(`patenteChasis`);

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeighingTicket` ADD CONSTRAINT `WeighingTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeighingTicket` ADD CONSTRAINT `WeighingTicket_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeighingTicket` ADD CONSTRAINT `WeighingTicket_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeighingTicket` ADD CONSTRAINT `WeighingTicket_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeighingTicket` ADD CONSTRAINT `WeighingTicket_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `Driver`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
