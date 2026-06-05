-- DropIndex
DROP INDEX `AuditLog_userId_fkey` ON `auditlog`;

-- DropIndex
DROP INDEX `ProductionRecord_plantId_fkey` ON `productionrecord`;

-- DropIndex
DROP INDEX `ProductionRecord_productId_fkey` ON `productionrecord`;

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
ALTER TABLE `weighingticket` ADD COLUMN `packagingQty` INTEGER NULL,
    ADD COLUMN `packagingType` VARCHAR(191) NULL;

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
