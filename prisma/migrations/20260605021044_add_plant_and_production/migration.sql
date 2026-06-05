-- DropIndex
DROP INDEX `AuditLog_userId_fkey` ON `auditlog`;

-- DropIndex
DROP INDEX `Vehicle_companyId_fkey` ON `vehicle`;

-- DropIndex
DROP INDEX `WeighingTicket_companyId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_driverId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_productId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_userId_fkey` ON `weighingticket`;

-- DropIndex
DROP INDEX `WeighingTicket_vehicleId_fkey` ON `weighingticket`;

-- AlterTable
ALTER TABLE `driver` ADD COLUMN `domicilio` VARCHAR(191) NULL,
    ADD COLUMN `foto` LONGTEXT NULL,
    ADD COLUMN `telefono` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Plant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Plant_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductionRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turno` VARCHAR(191) NOT NULL,
    `productId` INTEGER NOT NULL,
    `plantId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductionRecord` ADD CONSTRAINT `ProductionRecord_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionRecord` ADD CONSTRAINT `ProductionRecord_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
