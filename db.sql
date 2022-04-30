#
# SQL Export
# Created by Querious (302003)
# Created: 30 April 2022 at 20:43:52 CEST
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
CREATE DATABASE IF NOT EXISTS `blog` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
USE `blog`;
CREATE TABLE `comments` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `entry_id` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `message` longtext NOT NULL,
  `time` int(10) DEFAULT 0,
  `public` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 53 DEFAULT CHARSET = utf8 AVG_ROW_LENGTH = 1820;
CREATE TABLE `comments_scores` (
  `comment_id` int(10) NOT NULL DEFAULT 0,
  `score` float DEFAULT 0,
  PRIMARY KEY (`comment_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 AVG_ROW_LENGTH = 780;
CREATE TABLE `entries` (
  `id` varchar(255) CHARACTER SET utf8 NOT NULL,
  `title` varchar(255) CHARACTER SET utf8 NOT NULL,
  `body` longtext CHARACTER SET utf8 DEFAULT NULL,
  `created` int(11) DEFAULT 0,
  `last_edited` int(11) DEFAULT 0,
  `public` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;
CREATE TABLE `entries_tags` (
  `entry_id` varchar(255) NOT NULL DEFAULT '0',
  `tag` varchar(64) NOT NULL DEFAULT '0',
  UNIQUE KEY `entry_tag` (`entry_id`, `tag`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE `filters` (
  `id` varchar(64),
  `label` varchar(255),
  `image` varchar(255),
  `order` int(3) DEFAULT 0,
  `enabled` tinyint(1) DEFAULT 1
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE `filters_rules` (
  `filter_id` varchar(64),
  `type` varchar(32),
  `value` varchar(255),
  `operator` varchar(16)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `c` tinyint(1) DEFAULT 0,
  `r` tinyint(1) DEFAULT 0,
  `u` tinyint(1) DEFAULT 0,
  `d` tinyint(1) DEFAULT 0,
  `token` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8;
CREATE TABLE `roles_rights` (
  `role` int(6) DEFAULT NULL,
  `action` varchar(64) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 AVG_ROW_LENGTH = 2048;
CREATE TABLE `settings` (
  `role_admin` int(6) DEFAULT 0,
  `role_guest` int(6) DEFAULT 0,
  `toast_life` int(10) DEFAULT 0,
  `enable_comments` tinyint(1) DEFAULT 0,
  `use_captcha` tinyint(1) DEFAULT 0,
  `min_score_auto_publish` float DEFAULT 1,
  `max_failed_token_attempts` int(11) DEFAULT 0,
  `failed_token_lockout_duration` int(11) DEFAULT 0,
  `github_feed` varchar(255) NOT NULL,
  `show_sidebar` tinyint(1) DEFAULT 0,
  `per_load` tinyint(3) DEFAULT 0,
  `teaser_mode` tinyint(1) DEFAULT 0,
  `auto_entry_url` tinyint(1) DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8 AVG_ROW_LENGTH = 16384;
CREATE TABLE `tags` (
  `tag` varchar(64) NOT NULL,
  `weight` float NOT NULL DEFAULT 0,
  PRIMARY KEY (`tag`),
  UNIQUE KEY `tag_UNIQUE` (`tag`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE `tags_rights` (
  `tag` varchar(64) DEFAULT NULL,
  `role` int(6) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE `tokens` (
  `token` varchar(64) CHARACTER SET utf8 NOT NULL,
  `one_time` tinyint(1) DEFAULT 0,
  `consumed` int(6) DEFAULT 0,
  `role` int(3) DEFAULT 0,
  PRIMARY KEY (`token`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;
CREATE TABLE `tokens_consumed` (
  `token` varchar(64) NOT NULL,
  `ip` varchar(15) NOT NULL,
  `time` int(10) DEFAULT 0,
  `session` varchar(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE `tokens_invalid_attempts` (
  `token` varchar(64) NOT NULL,
  `ip` varchar(15) NOT NULL,
  `time` int(10) DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
SET FOREIGN_KEY_CHECKS = @ORIG_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @ORIG_UNIQUE_CHECKS;
SET @ORIG_TIME_ZONE = @@TIME_ZONE;
SET TIME_ZONE = @ORIG_TIME_ZONE;
SET SQL_MODE = @ORIG_SQL_MODE;
# Export Finished: 30 April 2022 at 20:43:52 CEST