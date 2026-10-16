CREATE DATABASE IF NOT EXISTS jonescare_webapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'hms_user'@'localhost'
  IDENTIFIED BY 'hms_password';

GRANT ALL PRIVILEGES ON jonescare_webapp.* TO 'hms_user'@'localhost';

FLUSH PRIVILEGES;