import pymysql

# Trick Django into thinking PyMySQL is the required mysqlclient version
pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.install_as_MySQLdb()