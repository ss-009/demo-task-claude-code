#!/bin/bash
set -e

# MYSQL_DATABASE (.env の設定値) は起動時に自動作成されるが、
# 動作確認・自動テスト用のDBと、Prisma Migrate のシャドウDB作成権限を追加する。
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
  CREATE DATABASE IF NOT EXISTS demo_task_test;
  GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'%';
  FLUSH PRIVILEGES;
EOSQL
