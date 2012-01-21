/*
SQLyog Community Edition- MySQL GUI v6.15
MySQL - 5.0.51a-community-nt : Database - cmstest
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

/* Procedure structure for procedure `auth_create_group` */

/*!50003 DROP PROCEDURE IF EXISTS  `auth_create_group` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `auth_create_group`(GNAME VARCHAR(50))
BEGIN
DECLARE GCNT INT;
SELECT count(`group_name`) INTO GCNT FROM `auth_groups` WHERE `group_name`=GNAME;
IF GCNT=0 THEN
INSERT INTO `auth_groups` (`group_name`) VALUES (GNAME);
END IF;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `auth_grant` */

/*!50003 DROP PROCEDURE IF EXISTS  `auth_grant` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `auth_grant`(UNAME VARCHAR(50), GNAME VARCHAR(50))
BEGIN
DECLARE GID INT;
DECLARE UID INT;
DECLARE PERMC INT;
DECLARE GCNT INT;
SELECT count(`id`) INTO GCNT FROM `auth_groups` WHERE `group_name`=GNAME;
IF GCNT=0 THEN
CALL auth_create_group(GNAME);
END IF;
SELECT `id` INTO GID FROM `auth_groups` WHERE `group_name`=GNAME LIMIT 1;
SELECT `id` INTO UID FROM `auth_users` WHERE `username`=UNAME LIMIT 1;
SELECT count(id) INTO PERMC FROM `auth_permissions` WHERE `group_id`=GID AND `user_id`=UID;
IF PERMC=0 THEN
INSERT INTO `auth_permissions` (`group_id`, `user_id`) VALUES (GID, UID);
END IF;
END */$$
DELIMITER ;

/* Procedure structure for procedure `cms_get_menu` */

/*!50003 DROP PROCEDURE IF EXISTS  `cms_get_menu` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `cms_get_menu`()
BEGIN
SELECT max(c.version) as v, c.title, c.page_id, m.parent, m.order from cms_content c left join cms_menu m on m.page_id=c.page_id where c.version=(select max(version) from cms_content where page_id=c.page_id) group by c.page_id  order by m.parent, m.order;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `cms_get_new_version` */

/*!50003 DROP PROCEDURE IF EXISTS  `cms_get_new_version` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `cms_get_new_version`(PID VARCHAR(50))
BEGIN
SELECT `version` FROM `cms_content` WHERE `page_id`=PID ORDER BY `version` DESC LIMIT 1;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `cms_get_page` */

/*!50003 DROP PROCEDURE IF EXISTS  `cms_get_page` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `cms_get_page`(PID VARCHAR(50))
BEGIN
SELECT c.*, a.name as `name`, a.username as `username` FROM `cms_content` c LEFT JOIN `auth_users` a ON a.id=c.user_id WHERE c.page_id=PID ORDER BY c.version DESC LIMIT 1;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `cms_get_version_page` */

/*!50003 DROP PROCEDURE IF EXISTS  `cms_get_version_page` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `cms_get_version_page`(PID VARCHAR(50), VER INT)
BEGIN
SELECT c.*, a.name as `name`, a.username as `username` FROM `cms_content` c LEFT JOIN `auth_users` a ON a.id=c.user_id WHERE c.page_id=PID AND c.version=VER;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `config_update` */

/*!50003 DROP PROCEDURE IF EXISTS  `config_update` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `config_update`(CCLASS varchar(50),CKEY varchar(50), CVALUE varchar(50))
BEGIN
DECLARE CCNT INT;
SELECT count(`id`) INTO CCNT FROM `config_values` WHERE `class`=CCLASS AND `key`=CKEY;
IF CCNT=0 THEN
INSERT INTO `config_values` (`class`,`key`,`value`) VALUES (CCLASS,CKEY,CVALUE);
ELSE
UPDATE `config_values` SET `value`=CVALUE WHERE `class`=CCLASS AND `key`=CKEY;
END IF;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `form_get_fields` */

/*!50003 DROP PROCEDURE IF EXISTS  `form_get_fields` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `form_get_fields`(FNAME VARCHAR(20))
BEGIN
DECLARE FID INT;
SELECT id INTO FID FROM `form_forms` WHERE `form_name`=FNAME LIMIT 1;
SELECT * FROM `form_fields` WHERE `formid`=FID;
    END */$$
DELIMITER ;

/* Procedure structure for procedure `form_get_form` */

/*!50003 DROP PROCEDURE IF EXISTS  `form_get_form` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `form_get_form`(FNAME VARCHAR(20))
BEGIN
SELECT * FROM `form_forms` WHERE `form_name`=FNAME;
    END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
