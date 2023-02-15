SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_mob; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_mob;


--
-- Name: app_sys; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_sys;


--
-- Name: migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA migrations;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: mobile_errors; Type: TABLE; Schema: app_mob; Owner: -
--

CREATE TABLE app_mob.mobile_errors (
    id bigint NOT NULL,
    message character varying(1024) NOT NULL,
    stack text,
    device_info jsonb,
    created_ts bigint NOT NULL
);


--
-- Name: mobile_errors_id_seq; Type: SEQUENCE; Schema: app_mob; Owner: -
--

ALTER TABLE app_mob.mobile_errors ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME app_mob.mobile_errors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mobile_events; Type: TABLE; Schema: app_mob; Owner: -
--

CREATE TABLE app_mob.mobile_events (
    id bigint NOT NULL,
    event_type character varying(64) NOT NULL,
    payload text,
    device_id character varying(1024) NOT NULL,
    created_ts bigint NOT NULL
);


--
-- Name: mobile_events_id_seq; Type: SEQUENCE; Schema: app_mob; Owner: -
--

ALTER TABLE app_mob.mobile_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME app_mob.mobile_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: groups; Type: TABLE; Schema: app_sys; Owner: -
--

CREATE TABLE app_sys.groups (
    id uuid NOT NULL,
    group_name character varying(120) NOT NULL,
    description character varying(2000),
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: groups_to_modules; Type: TABLE; Schema: app_sys; Owner: -
--

CREATE TABLE app_sys.groups_to_modules (
    id uuid NOT NULL,
    group_id uuid NOT NULL,
    module_name character varying(200) NOT NULL,
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: groups_to_users; Type: TABLE; Schema: app_sys; Owner: -
--

CREATE TABLE app_sys.groups_to_users (
    id uuid NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: app_sys; Owner: -
--

CREATE TABLE app_sys.users (
    id uuid NOT NULL,
    username character varying(120) NOT NULL,
    fullname character varying(100) NOT NULL,
    email character varying(120) NOT NULL,
    password character varying(512) NOT NULL,
    auth_token character varying(512),
    timezone character varying(120),
    country character varying(2),
    language character varying(2),
    enabled character varying(1) DEFAULT 'Y'::character varying NOT NULL,
    created_by uuid NOT NULL,
    created_ts integer NOT NULL,
    password_recovery_token character varying(256) DEFAULT NULL::character varying,
    password_recovery_ts integer,
    CONSTRAINT users_email_check CHECK (((email)::text <> ''::text)),
    CONSTRAINT users_fullname_check CHECK (((fullname)::text <> ''::text)),
    CONSTRAINT users_password_check CHECK (((password)::text <> ''::text)),
    CONSTRAINT users_username_check CHECK (((username)::text <> ''::text))
);


--
-- Name: zombi_seq; Type: SEQUENCE; Schema: app_sys; Owner: -
--

CREATE SEQUENCE app_sys.zombi_seq
    START WITH 100
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations; Type: TABLE; Schema: migrations; Owner: -
--

CREATE TABLE migrations.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: groups groups_pk; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.groups
    ADD CONSTRAINT groups_pk PRIMARY KEY (id);


--
-- Name: groups_to_modules groups_to_modules_pk; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.groups_to_modules
    ADD CONSTRAINT groups_to_modules_pk PRIMARY KEY (id);


--
-- Name: groups_to_users groups_to_users_pk; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.groups_to_users
    ADD CONSTRAINT groups_to_users_pk PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_fullname_key; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.users
    ADD CONSTRAINT users_fullname_key UNIQUE (fullname);


--
-- Name: users users_pk; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.users
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: app_sys; Owner: -
--

ALTER TABLE ONLY app_sys.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: migrations; Owner: -
--

ALTER TABLE ONLY migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO migrations.schema_migrations (version) VALUES
    ('20220223212732'),
    ('20220316180751'),
    ('20221231153251');
