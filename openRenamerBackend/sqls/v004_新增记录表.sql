-- 记录已处理过的路径
CREATE TABLE dealed_file_path (
	key_str TEXT(32) NOT NULL,
	"path" TEXT(200) NOT NULL,
	CONSTRAINT dealed_file_path_PK PRIMARY KEY (key_str)
);

CREATE TABLE auto_deal_history (
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	createTime INTEGER NOT NULL,
	oldName TEXT(200) NOT NULL,
	newName TEXT(200) NOT NULL,
	-- 说明
	comment TEXT(200) NOT NULL,
	-- 1:文件重命名，2：剧集下无季文件夹，自动创建;3:操作失败
	"type" INTEGER NOT NULL,
	CONSTRAINT auto_deal_history_PK PRIMARY KEY (id)
);
CREATE INDEX auto_deal_history_createTime_IDX ON auto_deal_history (createTime);
