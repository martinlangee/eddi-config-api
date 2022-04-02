-- > widgets that are used on a screen
SELECT screen_id, widget_id, x_pos, y_pos, screens_widgets.size_x, screens_widgets.size_y, widgets.user_id, widgets.name, widgets.thumbnail, widgets.public
FROM screens_widgets
JOIN widgets
  ON widget_id = widgets.id
WHERE screen_id = screenId;

-- > screens that a widget is used on
SELECT *
FROM widgets
JOIN screens_widgets
	ON widgets.id = widget_id
JOIN screens
	ON screens.id = screen_id
 WHERE widgets.id = widgetId;

-- additional queries needed:

-- > widgets of user_id and all other widgets that are public
SELECT *
FROM widgets
WHERE user_id = 17
	OR public;

-- > screens of user_id and all other screens that are public
SELECT *
FROM screens
WHERE user_id = 17
	OR public;


-- > all public widgets
SELECT *
FROM widgets
WHERE public;

-- > all public screens
SELECT *
FROM screens
WHERE public;

