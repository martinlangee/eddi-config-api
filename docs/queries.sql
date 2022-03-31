FROM Projects
CROSS JOIN Project_Widgets
	ON Projects.id = project_id
JOIN Widgets
	ON widget_id = Widgets.id;

-- possibly needed:
-- > users that use a vidget
-- > vidgets that are public
