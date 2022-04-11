const { StatusCodes } = require("http-status-codes");
const express = require("express");
const widgetsRouter = express.Router();
const Db = require("../db");
const { tryCatch } = require("../utils");


widgetsRouter.use(express.json()); // => req.body

// '/widgets' Routes ------

const WIDGET_COLUMNS = `${Db.TWIDGETS}.id, 
                        ${Db.TWIDGETS}.name, 
                        ${Db.TWIDGETS}.description, 
                        ${Db.TWIDGETS}.size_x, 
                        ${Db.TWIDGETS}.size_y, 
                        ${Db.TWIDGETS}.thumbnail, 
                        ${Db.TWIDGETS}.public, 
                        to_char(${Db.TWIDGETS}.created, ${Db.DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(${Db.TWIDGETS}.last_saved, ${Db.DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        ${Db.TWIDGETS}.user_id`;

widgetsRouter.route('')
    // get widgets:
    // - of specified user 
    // - and of all public ones if < users.seePublicWidgets === true > additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {

        if (req.query.userId) {
            tryCatch(req, res, async(req, res) => {
                const userId = req.query.userId;
                const seePublic = await Db.getSeePublicWidgets(userId);
                const querySeePublic = seePublic ? ` OR ${Db.TUSERS}.see_public_widgets = true` : '';
                const queryStr =
                    `SELECT ${WIDGET_COLUMNS}, ${Db.TUSERS}.user_name, ${Db.TUSERS}.first_name, ${Db.TUSERS}.last_name
                     FROM ${Db.TWIDGETS}
                     JOIN ${Db.TUSERS}
                       ON user_id = ${Db.TUSERS}.id
                     WHERE user_id = ${userId}${querySeePublic};`;
                console.log({ userId, seePublic, queryStr });
                const result = await Db.pool().query(queryStr);
                res.status(StatusCodes.OK).json(result.rows);
            })
        } else {
            next();
        }
    })
    // get all widgets or only all public ones is <?public=true> is passed as query param
    // TODO: private widgets should only be visible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryOnlyPublic = req.query.public === 'true' ? ` WHERE ${Db.TUSERS}.see_public_widgets = true` : '';
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, ${Db.TUSERS}.user_name, ${Db.TUSERS}.first_name, ${Db.TUSERS}.last_name
                 FROM ${Db.TWIDGETS}
                 JOIN ${Db.TUSERS}
                   ON user_id = ${Db.TUSERS}.id
                   ${queryOnlyPublic};`;
            console.log({ queryStr });
            const result = await Db.pool().query(queryStr);
            res.status(StatusCodes.OK).json(result.rows);
        })
    })
    // create widget
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `INSERT INTO ${Db.TWIDGETS}
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
                    to_timestamp('${Db.formatDateTime(Date.now())}', ${Db.DATETIME_DISPLAY_FORMAT}),     
                    to_timestamp('${Db.formatDateTime(Date.now())}', ${Db.DATETIME_DISPLAY_FORMAT})
                   )
                   RETURNING id;`;
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await Db.pool().query(queryStr));
        })
    });

widgetsRouter.route('/:widgetId')
    // get single widget
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { widgetId } = req.params;
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, ${Db.TUSERS}.user_name, ${Db.TUSERS}.first_name, ${Db.TUSERS}.last_name
                 FROM ${Db.TWIDGETS}
                 JOIN ${Db.TUSERS}
                   ON user_id = ${Db.TUSERS}.id
                 WHERE ${Db.TWIDGETS}.id = ${widgetId};`;
            console.log({ widgetId, queryStr });
            res.status(StatusCodes.OK).json((await Db.pool().query(queryStr)).rows);
        })
    })
    // update widget
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { widgetId } = req.params;
            const { name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `UPDATE ${Db.TWIDGETS} SET ` +
                Db.getParamQuery('name', name, isFirst = true) +
                Db.getParamQuery('description', description) +
                Db.getParamQuery('size_x', size_x) +
                Db.getParamQuery('size_y', size_y) +
                Db.getParamQuery('thumbnail', thumbnail) +
                Db.getParamQuery('content', content) +
                Db.getParamQuery('public', public) +
                Db.getParamQuery('last_saved', `to_timestamp('${Db.formatDateTime(Date.now())}', ${Db.DATETIME_DISPLAY_FORMAT})`, false, false) +
                ` WHERE id = ${widgetId};`
            console.log({ widgetId, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await Db.pool().query(queryStr));
        })
    })
    // delete widget
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { widgetId } = req.params;

            // delete widget from all screens it is used on
            let queryStr =
                `DELETE FROM ${Db.TSCREENSWIDGETS} 
                 WHERE widget_id = ${widgetId};`;
            console.log({ widgetId, queryStr });
            await Db.pool().query(queryStr);

            // delete widget itself
            queryStr =
                `DELETE FROM ${Db.TWIDGETS} 
                 WHERE id = ${widgetId};`;
            console.log({ widgetId, queryStr });
            res.status(StatusCodes.OK).json(await Db.pool().query(queryStr));
        })
    });

module.exports = { widgetsRouter };