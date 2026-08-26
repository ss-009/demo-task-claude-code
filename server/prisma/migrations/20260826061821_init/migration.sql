-- CreateTable
CREATE TABLE `ai_analysis_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_path` VARCHAR(255) NULL,
    `success` BOOLEAN NOT NULL,
    `message` VARCHAR(255) NULL,
    `class` INTEGER NULL,
    `confidence` DECIMAL(5, 4) NULL,
    `request_timestamp` DATETIME(6) NULL,
    `response_timestamp` DATETIME(6) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
