INSERT INTO 
    users (user_name, first_name, last_name, email, pwd_hash, created, status, level)
VALUES
    ('martin', 'Martin', 'Lange', 'ml@abcde.fr', 'XXXX', '2020-12-11', 'active', 9),
    ('alex', 'Alex', 'Schmidt', 'as@ddddd.der', 'XXXX', '2020-11-10', 'active', 0),
    ('claudia', 'Claudia', 'Taylor', 'ct@rrrfv.at', 'XXXX', '2020-10-09', 'active', 0),
    ('boriss', 'Boris', 'Gudunov', 'bg@jkuzzzze.se', 'XXXX', '2020-09-12', 'active', 0),
    ('annja', 'Anja', 'Horstmann', 'ah@ukkkw.dk', 'XXXX', '2020-09-11', 'active', 0),
    ('egun', 'Egon', 'Miller', 'em@abcde.co.uk', 'XXXX', '2020-11-11', 'active', 0);

INSERT INTO 
    widgets (user_id, name, description, size_x, size_y, thumbnail, content, public, created, last_saved)
VALUES
    (13, 'Temparature', 'Here the temperature is shown', 10, 20, 'ICON_A', '<HTML A>', true, '2020-12-11', '2020-12-11'),
    (16, 'Forecast', 'Here the current forecasr is shown', 30, 40, 'ICON_B', '<HTML B>', true, '2020-12-12', '2020-12-11'),
    (14, 'Pressure', 'Here the air pressure is shown', 50, 60, 'ICON_C', '<HTML C>', true, '2020-12-14', '2020-12-11'),
    (14, 'Time and date', 'Here current time and date are shown', 70, 80, 'ICON_D', '<HTML D>', true, '2020-12-15', '2020-12-11'),
    (15, 'Sun rise + set', 'Here time and date of sun rise + set is shown', 200, 150, 'ICON_E', '<HTML E>', true, '2020-12-17', '2020-12-11'),
    (17, 'Stellar time', 'Here current stellar time is shown', 200, 150, 'ICON_F', '<HTML F>', false, '2020-12-21', '2020-12-11'),
    (16, 'Moon phase', 'Here current moon phase is shown', 200, 150, 'ICON_G', '<HTML G>', false, '2020-12-22', '2020-12-11');

INSERT INTO
    screens (user_id, name, description, size_x, size_y, thumbnail, public, created, last_saved)
VALUES
    (15, 'Kitchen wall', 'Device on my kitchen wall', 800, 600, 'XXX', true, '2021-01-12', '2020-12-11'),
    (13, 'Garage', 'Device in my garage', 800, 600, 'XXX', true, '2021-01-15', '2020-12-11'),
    (14, 'Office Vidget', 'Vidget in my office', 800, 600, 'XXX', false, '2021-01-02', '2020-12-11'),
    (15, 'Car screen', 'Device in my car''s info screen', 800, 600, 'XXX', true, '2021-01-21', '2020-12-11');

INSERT INTO
    screens_widgets (screen_id, widget_id, x_pos, y_pos, size_x, size_y)
VALUES
    (5, 15, 10, 20, 30, 40),
    (5, 16, 50, 60, 70, 80),
    (5, 18, 90, 100, 110, 120),
    (6, 19, 130, 140, 150, 160),
    (6, 15, 170, 180, 190, 200);

