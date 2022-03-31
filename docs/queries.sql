-- > widgets that are used on a screen
SELECT *, widgets.size_x as orig_size_x, widgets.size_y as orig_size_y
FROM screens
JOIN screens_widgets
	ON screens.id = screen_id
JOIN widgets
	ON widget_id = widgets.id
WHERE screens.id = screenId;

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

