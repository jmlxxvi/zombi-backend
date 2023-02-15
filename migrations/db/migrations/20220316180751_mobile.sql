-- migrate:up
CREATE SCHEMA app_mob;

CREATE TABLE app_mob.mobile_errors (
	id int8 NOT NULL GENERATED ALWAYS AS IDENTITY,
	message varchar(1024) NOT NULL,
	stack text NULL,
	device_info jsonb NULL,
	created_ts int8 NOT NULL
);

CREATE TABLE app_mob.mobile_events (
	id int8 NOT NULL GENERATED ALWAYS AS IDENTITY,
	event_type varchar(64) NOT NULL,
	payload text NULL,
	device_id varchar(1024) NOT NULL,
	created_ts int8 NOT NULL
);

-- migrate:down
DROP TABLE app_mob.mobile_errors;
DROP TABLE app_mob.mobile_events;

DROP SCHEMA app_mob;


