CREATE TABLE global_config (
	code TEXT(40),
	val TEXT(200),
	description TEXT(100) DEFAULT (''),
	CONSTRAINT global_config_PK PRIMARY KEY (code)
);