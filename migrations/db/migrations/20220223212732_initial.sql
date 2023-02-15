-- migrate:up

CREATE SCHEMA app_sys;

CREATE TABLE app_sys.users (
	id uuid NOT NULL,
	username varchar(120) NOT NULL,
	fullname varchar(100) NOT NULL,
	email varchar(120) NOT NULL,
	"password" varchar(512) NOT NULL,
	auth_token varchar(512),
	timezone varchar(120) NULL,
	country varchar(2) NULL,
	"language" varchar(2) NULL,
	enabled varchar(1) NOT NULL DEFAULT 'Y'::character varying,
	created_by uuid NOT NULL,
	created_ts int4 NOT NULL,
	password_recovery_token varchar(256) NULL DEFAULT NULL::character varying,
	password_recovery_ts int4 NULL,
	CONSTRAINT users_email_check CHECK (((email)::text <> ''::text)),
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_fullname_check CHECK (((fullname)::text <> ''::text)),
	CONSTRAINT users_fullname_key UNIQUE (fullname),
	CONSTRAINT users_password_check CHECK (((password)::text <> ''::text)),
	CONSTRAINT users_pk PRIMARY KEY (id),
	CONSTRAINT users_username_check CHECK (((username)::text <> ''::text)),
	CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE app_sys."groups" (
	id uuid NOT NULL,
	group_name varchar(120) NOT NULL,
	description varchar(2000) NULL,
	created_by uuid NOT NULL,
	created_ts int4 NOT NULL,
	CONSTRAINT groups_pk PRIMARY KEY (id)
);

CREATE TABLE app_sys.groups_to_users (
	id uuid NOT NULL,
	group_id uuid NOT NULL,
	user_id uuid NOT NULL,
	created_by uuid NOT NULL,
	created_ts int4 NOT NULL,
	CONSTRAINT groups_to_users_pk PRIMARY KEY (id)
);

CREATE TABLE app_sys.groups_to_modules (
	id uuid NOT NULL,
	group_id uuid NOT NULL,
	module_name varchar(200) NOT NULL,
	created_by uuid NOT NULL,
	created_ts int4 NOT NULL,
	CONSTRAINT groups_to_modules_pk PRIMARY KEY (id)
);

CREATE SEQUENCE app_sys.zombi_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 100
	CACHE 1
	NO CYCLE;

INSERT INTO app_sys.groups (
	id,
	group_name, 
	description, 
	created_by, 
	created_ts
) VALUES (
	'5a228dec-7689-47c8-bfb7-cab1400cad7b'::uuid, 
	'ADMIN', 
	'Default Administrators group', 
	'3f0a91b2-7d9d-4ced-bac7-608d278620cd'::uuid,
	round(extract(epoch from now()))
);

INSERT INTO app_sys.groups_to_users (
	id, 
	group_id, 
	user_id, 
	created_by, 
	created_ts
) VALUES (
	'a5dd0027-0c1d-4262-9562-fd808c68fed6'::uuid,
	'5a228dec-7689-47c8-bfb7-cab1400cad7b'::uuid, 
	'3f0a91b2-7d9d-4ced-bac7-608d278620cd'::uuid,
	'3f0a91b2-7d9d-4ced-bac7-608d278620cd'::uuid,
	round(extract(epoch from now()))
);

INSERT INTO app_sys.users (
	id, 
	username, 
	fullname, 
	email, 
	password, 
	timezone, 
	country, 
	language, 
	enabled, 
	created_by, 
	created_ts
) VALUES (
	'3f0a91b2-7d9d-4ced-bac7-608d278620cd'::uuid,
	'system', 
	'SYSTEM', 
	'zombidevelopment@gmail.com', 
	'9f6f30d2c21995ae704c70f6e7d59623e8c18d36973b1ee8c9171d39be0fdccc162ab81c302e697f63c28e2388d24e514c8cd8146eb21ea711d4ff06011b8a20.e368d27ec66b212a2f53752b887a67c3', 
	'America/Argentina/Buenos_Aires',
	'AR',
	'es',
	'Y',
	'3f0a91b2-7d9d-4ced-bac7-608d278620cd'::uuid,
	round(extract(epoch from now()))
),
(
	'd784f826-f7f5-466e-a205-948a8ba66cfc'::uuid, 
	'test', 
	'Test User', 
	'none@mail.com', 
	'9f6f30d2c21995ae704c70f6e7d59623e8c18d36973b1ee8c9171d39be0fdccc162ab81c302e697f63c28e2388d24e514c8cd8146eb21ea711d4ff06011b8a20.e368d27ec66b212a2f53752b887a67c3', 
	'America/Argentina/Buenos_Aires',
	'AR',
	'es',
	'Y',
	'3f0a91b2-7d9d-4ced-bac7-608d278620cd'::uuid,
	round(extract(epoch from now()))
);

-- migrate:down
DROP TABLE app_sys.users;
DROP TABLE app_sys."groups";
DROP TABLE app_sys.groups_to_users;
DROP TABLE app_sys.groups_to_modules;
DROP SEQUENCE app_sys.zombi_seq;
DROP SCHEMA app_sys;