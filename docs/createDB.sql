-- for PostgreSQL

-- DROP DATABASE IF EXISTS eddi_db;
-- CREATE DATABASE eddi_db;

-- /c enter database

DROP TABLE IF EXISTS screen_widgets;
DROP TABLE IF EXISTS screens;
DROP TABLE IF EXISTS widgets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_name varchar NOT NULL,
  first_name varchar,
  last_name varchar,
  email varchar UNIQUE NOT NULL,
  pwd_hash varchar NOT NULL,
  created TIMESTAMP,
  status varchar(10),
  level INT
);

CREATE TABLE widgets (
  id SERIAL PRIMARY KEY,
  user_id INT,
  name varchar NOT NULL,
  description varchar,
  size_x INT NOT NULL,
  size_y INT NOT NULL,
  thumbnail BYTEA,
  content varchar,
  public BOOLEAN,
  created TIMESTAMP,
  last_saved TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
	    REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE screens (
  id SERIAL PRIMARY KEY,
  user_id INT,
  name varchar NOT NULL,
  description varchar,
  size_x INT NOT NULL,
  size_y INT NOT NULL,
  thumbnail BYTEA,
  public BOOLEAN,
  created TIMESTAMP,
  last_saved TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
	    REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE screen_widgets (
  screen_id INT,
  widget_id INT,
  x_pos INT,
  y_pos INT,
  size_x INT NOT NULL,
  size_y INT NOT NULL,
  CONSTRAINT fk_screens
    FOREIGN KEY(screen_id) 
	    REFERENCES screens(id)
        ON DELETE CASCADE,
  CONSTRAINT fk_widgets
    FOREIGN KEY(widget_id) 
	    REFERENCES widgets(id)
        ON DELETE CASCADE
);
