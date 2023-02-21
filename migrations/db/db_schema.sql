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
-- Name: builder; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA builder;


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
-- Name: buildings; Type: TABLE; Schema: builder; Owner: -
--

CREATE TABLE builder.buildings (
    id uuid NOT NULL,
    building_name character varying(120) NOT NULL,
    asignee uuid,
    started_at integer,
    created_at integer NOT NULL,
    created_by uuid NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: migrations; Owner: -
--

CREATE TABLE migrations.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: buildings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buildings (
    id uuid NOT NULL,
    building_name character varying(120) NOT NULL,
    asignee uuid,
    started_at numeric,
    created_at numeric NOT NULL,
    created_by uuid NOT NULL
);


--
-- Name: cars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cars (
    id uuid NOT NULL,
    fleet_id uuid NOT NULL,
    brand character varying(120) NOT NULL,
    model character varying(100) NOT NULL,
    year integer NOT NULL,
    on_the_road boolean NOT NULL,
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: cars_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cars_seq
    START WITH 100
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fx_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_agents (
    id uuid NOT NULL,
    person_id uuid NOT NULL,
    role_id integer NOT NULL,
    created_by uuid NOT NULL,
    created_at integer NOT NULL,
    modified_by uuid,
    modified_at integer
);


--
-- Name: fx_building_amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_building_amenities (
    building_id uuid NOT NULL,
    amenity_id integer NOT NULL
);


--
-- Name: fx_buildings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_buildings (
    id uuid NOT NULL,
    address_street character varying(60) NOT NULL,
    address_number integer NOT NULL,
    address_code character varying(12),
    floors integer,
    elevators integer,
    building_age integer,
    category_id integer NOT NULL,
    primary_neighborhood_id integer NOT NULL,
    secondary_neighborhood_id integer NOT NULL,
    created_by uuid NOT NULL,
    created_at integer NOT NULL,
    modified_by uuid,
    modified_at integer
);


--
-- Name: fx_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_customers (
    id uuid NOT NULL,
    person_id uuid NOT NULL,
    status_id integer NOT NULL,
    customer_role integer NOT NULL,
    transaction_type_id integer NOT NULL,
    motivation_id integer NOT NULL,
    sells_to_buy boolean,
    created_by uuid NOT NULL,
    created_at integer NOT NULL,
    modified_by uuid,
    modified_at integer
);


--
-- Name: fx_lookups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_lookups (
    id integer NOT NULL,
    context character varying(24) NOT NULL,
    lookup_value character varying(64) NOT NULL
);


--
-- Name: fx_lookups2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_lookups2 (
    id integer,
    context character varying(24),
    lookup_value character varying(64)
);


--
-- Name: fx_lookups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fx_lookups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fx_lookups_id_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fx_neighborhoods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_neighborhoods (
    id integer NOT NULL,
    code character varying(16) NOT NULL,
    category character varying(12) NOT NULL,
    neighborhood_name character varying(120) NOT NULL,
    avg_m2_price integer
);


--
-- Name: fx_persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_persons (
    id uuid NOT NULL,
    legal_id character varying(12),
    first_name character varying(120) NOT NULL,
    last_name character varying(120),
    cell_phone_no character varying(120),
    email character varying(120),
    address_street character varying(60) NOT NULL,
    address_number integer NOT NULL,
    address_code character varying(12),
    address_floor integer,
    address_unit character varying(4),
    website character varying(120),
    linkedin character varying(120),
    instagram character varying(120),
    twiter character varying(120),
    facebook character varying(120)
);


--
-- Name: fx_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_properties (
    id uuid NOT NULL,
    building_id integer,
    tipology_id integer NOT NULL,
    trunk_room boolean,
    garages integer,
    condition_id integer NOT NULL,
    floors_id integer,
    disposition_id integer,
    orientation_id integer,
    professional boolean,
    is_occupied boolean,
    rent_period_end date,
    balcony_type_id integer,
    fit_for_credit boolean,
    created_by uuid NOT NULL,
    created_at integer NOT NULL,
    modified_by uuid,
    modified_at integer
);


--
-- Name: fx_property_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_property_devices (
    property_id uuid NOT NULL,
    device_id integer NOT NULL,
    quantity integer NOT NULL
);


--
-- Name: fx_property_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_property_expenses (
    property_id uuid NOT NULL,
    expense_id integer NOT NULL,
    expense_value double precision NOT NULL,
    period_id integer NOT NULL
);


--
-- Name: fx_property_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_property_prices (
    id integer NOT NULL,
    property_id uuid NOT NULL,
    price integer NOT NULL,
    created_by uuid NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: fx_property_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fx_property_prices ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fx_property_prices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fx_property_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_property_rooms (
    property_id uuid NOT NULL,
    room_id uuid NOT NULL
);


--
-- Name: fx_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_rooms (
    id uuid NOT NULL,
    room_type_id integer NOT NULL,
    size_m2 double precision
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid NOT NULL,
    group_name character varying(120) NOT NULL,
    description character varying(2000),
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: groups_to_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups_to_modules (
    id uuid NOT NULL,
    group_id uuid NOT NULL,
    module_name character varying(200) NOT NULL,
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: groups_to_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups_to_users (
    id uuid NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_ts integer NOT NULL
);


--
-- Name: mobile_errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mobile_errors (
    id bigint NOT NULL,
    message character varying(1024) NOT NULL,
    stack text,
    device_info jsonb,
    created_ts bigint NOT NULL
);


--
-- Name: mobile_errors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mobile_errors ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mobile_errors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mobile_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mobile_events (
    id bigint NOT NULL,
    event_type character varying(64) NOT NULL,
    payload text,
    device_id character varying(1024) NOT NULL,
    created_ts bigint NOT NULL
);


--
-- Name: mobile_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mobile_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mobile_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: t; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t (
    a integer,
    b character varying(100)
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(120) NOT NULL,
    fullname character varying(100) NOT NULL,
    email character varying(120) NOT NULL,
    password character varying(60) NOT NULL,
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
-- Name: zombi_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.zombi_seq
    START WITH 100
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: zombi_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.zombi_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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
-- Name: buildings buildings_pk; Type: CONSTRAINT; Schema: builder; Owner: -
--

ALTER TABLE ONLY builder.buildings
    ADD CONSTRAINT buildings_pk PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: migrations; Owner: -
--

ALTER TABLE ONLY migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buildings buildings_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pk PRIMARY KEY (id);


--
-- Name: fx_agents fx_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_agents
    ADD CONSTRAINT fx_agents_pkey PRIMARY KEY (id);


--
-- Name: fx_buildings fx_buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_buildings
    ADD CONSTRAINT fx_buildings_pkey PRIMARY KEY (id);


--
-- Name: fx_customers fx_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_customers
    ADD CONSTRAINT fx_customers_pkey PRIMARY KEY (id);


--
-- Name: fx_lookups fx_lookups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_lookups
    ADD CONSTRAINT fx_lookups_pkey PRIMARY KEY (id);


--
-- Name: fx_neighborhoods fx_neighborhoods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_neighborhoods
    ADD CONSTRAINT fx_neighborhoods_pkey PRIMARY KEY (id);


--
-- Name: fx_persons fx_persons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_persons
    ADD CONSTRAINT fx_persons_pkey PRIMARY KEY (id);


--
-- Name: fx_properties fx_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_properties
    ADD CONSTRAINT fx_properties_pkey PRIMARY KEY (id);


--
-- Name: fx_property_prices fx_property_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_property_prices
    ADD CONSTRAINT fx_property_prices_pkey PRIMARY KEY (id);


--
-- Name: fx_rooms fx_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_rooms
    ADD CONSTRAINT fx_rooms_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pk PRIMARY KEY (id);


--
-- Name: groups_to_modules groups_to_modules_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups_to_modules
    ADD CONSTRAINT groups_to_modules_pk PRIMARY KEY (id);


--
-- Name: groups_to_users groups_to_users_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups_to_users
    ADD CONSTRAINT groups_to_users_pk PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_fullname_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_fullname_key UNIQUE (fullname);


--
-- Name: users users_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


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
