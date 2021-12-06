-- 初始化建表
-- 应用规则表
CREATE TABLE application_rule (
	-- 创建时间
	createdDate INTEGER NOT NULL,
	-- 更新时间
	updatedDate INTEGER NOT NULL,
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	-- 注释
	comment TEXT NOT NULL DEFAULT '',
	-- 规则内容，json序列化后保存
	content TEXT NOT NULL DEFAULT ''
);