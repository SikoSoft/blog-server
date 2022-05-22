#
# SQL Export
# Created by Querious (302003)
# Created: 1 May 2022 at 19:46:20 CEST
# Encoding: Unicode (UTF-8)
#


SET @ORIG_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

SET @ORIG_UNIQUE_CHECKS = @@UNIQUE_CHECKS;
SET UNIQUE_CHECKS = 0;

SET @ORIG_TIME_ZONE = @@TIME_ZONE;
SET TIME_ZONE = '+00:00';

SET @ORIG_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';



CREATE TABLE `banners` (
  `id` int(6) NOT NULL AUTO_INCREMENT,
  `image` longtext DEFAULT NULL,
  `heading` longtext DEFAULT NULL,
  `caption` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;


CREATE TABLE `comments` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `entry_id` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `message` longtext NOT NULL,
  `time` int(10) DEFAULT 0,
  `public` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=1820;


CREATE TABLE `comments_scores` (
  `comment_id` int(10) NOT NULL DEFAULT 0,
  `score` float DEFAULT 0,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=780;


CREATE TABLE `entries` (
  `id` varchar(255) CHARACTER SET utf8mb3 NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb3 NOT NULL,
  `body` longtext CHARACTER SET utf8mb3 DEFAULT NULL,
  `created` int(11) DEFAULT 0,
  `last_edited` int(11) DEFAULT 0,
  `listed` int(1) DEFAULT 1,
  `public` tinyint(1) DEFAULT 0,
  `publish_at` int(11) DEFAULT 0,
  `published_at` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;


CREATE TABLE `entries_tags` (
  `entry_id` varchar(255) NOT NULL DEFAULT '0',
  `tag` varchar(64) NOT NULL DEFAULT '0',
  UNIQUE KEY `entry_tag` (`entry_id`,`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `filters` (
  `id` varchar(64) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `order` int(3) DEFAULT 0,
  `enabled` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `filters_rules` (
  `filter_id` varchar(64) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `operator` varchar(16) DEFAULT NULL,
  UNIQUE KEY `filter_key` (`filter_id`,`type`,`value`,`operator`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `image_sizes` (
  `width` int(6) NOT NULL DEFAULT 0,
  `height` int(6) NOT NULL DEFAULT 0,
  PRIMARY KEY (`width`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `token` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;


CREATE TABLE `roles_rights` (
  `role` int(6) DEFAULT NULL,
  `action` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=2048;


CREATE TABLE `settings` (
  `id` varchar(255) NOT NULL,
  `int` int(10) DEFAULT 0,
  `float` float DEFAULT 0,
  `varchar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `tags` (
  `tag` varchar(64) NOT NULL,
  `weight` float NOT NULL DEFAULT 0,
  PRIMARY KEY (`tag`),
  UNIQUE KEY `tag_UNIQUE` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `tags_rights` (
  `tag` varchar(64) DEFAULT NULL,
  `role` int(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `tokens` (
  `code` varchar(64) CHARACTER SET utf8mb3 NOT NULL,
  `one_time` tinyint(1) DEFAULT 0,
  `consumed` int(6) DEFAULT 0,
  `role` int(3) DEFAULT 0,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;


CREATE TABLE `tokens_consumed` (
  `code` varchar(64) NOT NULL,
  `ip` varchar(15) NOT NULL,
  `time` int(10) DEFAULT 0,
  `session` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `tokens_invalid_attempts` (
  `code` varchar(64) NOT NULL,
  `ip` varchar(15) NOT NULL,
  `time` int(10) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;





SET FOREIGN_KEY_CHECKS = @ORIG_FOREIGN_KEY_CHECKS;

SET UNIQUE_CHECKS = @ORIG_UNIQUE_CHECKS;

SET @ORIG_TIME_ZONE = @@TIME_ZONE;
SET TIME_ZONE = @ORIG_TIME_ZONE;

SET SQL_MODE = @ORIG_SQL_MODE;



# Export Finished: 1 May 2022 at 19:46:20 CEST

