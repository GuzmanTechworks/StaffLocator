-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(80) NOT NULL DEFAULT '',
    `lastName` VARCHAR(80) NOT NULL DEFAULT '',
    `nickname` VARCHAR(80) NOT NULL DEFAULT '',
    `username` VARCHAR(80) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Location_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Visit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `locationId` INTEGER NULL,
    `destination` VARCHAR(200) NOT NULL DEFAULT '',
    `purpose` VARCHAR(255) NOT NULL DEFAULT '',
    `timedOutAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `timedInAt` DATETIME(3) NULL,
    `groupId` VARCHAR(36) NULL,
    `remarks` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `Visit_timedInAt_idx`(`timedInAt`),
    INDEX `Visit_userId_timedInAt_idx`(`userId`, `timedInAt`),
    INDEX `Visit_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
