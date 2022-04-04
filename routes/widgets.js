const { StatusCodes } = require("http-status-codes");
const express = require("express");
const widgetsRouter = express.Router();
const { pool, TUSERS, TWIDGETS, dbGetSeePublicWidgets, TSCREENSWIDGETS } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");


widgetsRouter.use(express.json()); // => req.body

// '/widgets' Routes ------

const WIDGET_COLUMNS = `${TWIDGETS}.id, 
                        ${TWIDGETS}.name, 
                        ${TWIDGETS}.description, 
                        ${TWIDGETS}.size_x, 
                        ${TWIDGETS}.size_y, 
                        ${TWIDGETS}.thumbnail, 
                        ${TWIDGETS}.public, 
                        to_char(${TWIDGETS}.created, ${DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(${TWIDGETS}.last_saved, ${DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        ${TWIDGETS}.user_id`;

widgetsRouter.route('')
    // get widgets:
    // - of specified user 
    // - and of all public ones if < users.seePublicWidgets === true > additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {

        if (req.query.userId) {
            tryCatch(req, res, async(req, res) => {
                const userId = req.query.userId;
                const seePublic = await dbGetSeePublicWidgets(userId);
                const querySeePublic = seePublic ? ` OR ${TUSERS}.see_public_widgets = true` : '';
                const queryStr =
                    `SELECT ${WIDGET_COLUMNS}, ${TUSERS}.user_name, ${TUSERS}.first_name, ${TUSERS}.last_name
                     FROM ${TWIDGETS}
                     JOIN ${TUSERS}
                       ON user_id = ${TUSERS}.id
                     WHERE user_id = ${userId}${querySeePublic};`;
                console.log({ userId, seePublic, queryStr });
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all widgets or only all public ones is <?public=true> is passed as query param
    // TODO: private widgets should only be visible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryOnlyPublic = req.query.public === 'true' ? ` WHERE ${TUSERS}.see_public_widgets = true` : '';
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, ${TUSERS}.user_name, ${TUSERS}.first_name, ${TUSERS}.last_name
                 FROM ${TWIDGETS}
                 JOIN ${TUSERS}
                   ON user_id = ${TUSERS}.id
                   ${queryOnlyPublic};`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // create widget
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `INSERT INTO ${TWIDGETS}
                   (user_id, name, description, size_x, size_y, thumbnail, content, public, created, last_saved)
                 VALUES
                   ('${user_id}', 
                    '${name}', 
                    '${description}', 
                    '${size_x}', 
                    '${size_y}', 
                    '${thumbnail}', 
                    '${content}', 
                    '${public}', 
                    to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}),     
                    to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT})
                   )
                   RETURNING id;`;
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

widgetsRouter.route('/:widgetId')
    // get single widget
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { widgetId } = req.params;
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, ${TUSERS}.user_name, ${TUSERS}.first_name, ${TUSERS}.last_name
                 FROM ${TWIDGETS}
                 JOIN ${TUSERS}
                   ON user_id = ${TUSERS}.id
                 WHERE ${TWIDGETS}.id = ${widgetId};`;
            console.log({ widgetId, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // update widget
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { widgetId } = req.params;
            const { name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `UPDATE ${TWIDGETS} SET ` +
                getParamQuery('name', name, isFirst = true) +
                getParamQuery('description', description) +
                getParamQuery('size_x', size_x) +
                getParamQuery('size_y', size_y) +
                getParamQuery('thumbnail', thumbnail) +
                getParamQuery('content', content) +
                getParamQuery('public', public) +
                getParamQuery('last_saved', `to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT})`, false, false) +
                ` WHERE id = ${widgetId};`
            console.log({ widgetId, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
        })
    })
    // delete widget
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { widgetId } = req.params;

            // delete widget from all screens it is used on
            let queryStr =
                `DELETE FROM ${TSCREENSWIDGETS} 
                 WHERE widget_id = ${widgetId};`;
            console.log({ widgetId, queryStr });
            await pool.query(queryStr);

            // delete widget itself
            queryStr =
                `DELETE FROM ${TWIDGETS} 
                 WHERE id = ${widgetId};`;
            console.log({ widgetId, queryStr });
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    });

module.exports = { widgetsRouter };