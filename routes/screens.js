const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screensRouter = express.Router();
const { pool, TUSERS, TSCREENS, dbGetSeePublicScreens } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");
const { deleteScreenWidgets } = require("./screenWidgets");

screensRouter.use(express.json()); // => req.body

// '/screens' Routes ------

const SCREEN_COLUMNS = `${TSCREENS}.id, 
                        ${TSCREENS}.name, 
                        ${TSCREENS}.description, 
                        ${TSCREENS}.size_x, 
                        ${TSCREENS}.size_y, 
                        ${TSCREENS}.thumbnail, 
                        ${TSCREENS}.public, 
                        to_char(${TSCREENS}.created,  ${DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(${TSCREENS}.last_saved,  ${DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        ${TSCREENS}.user_id`;

screensRouter.route('')
    // get screens:
    // - of specified user 
    // - and of all public ones if ?public=true is passed additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {
        if (req.query.userId) {
            tryCatch(req, res, async(req, res) => {
                const userId = req.query.userId;
                const seePublic = await dbGetSeePublicScreens(userId);
                const querySeePublic = seePublic ? ` OR ${TUSERS}.see_public_screens = true` : '';
                const queryStr =
                    `SELECT ${SCREEN_COLUMNS}, ${TUSERS}.user_name, ${TUSERS}.first_name, ${TUSERS}.last_name
                     FROM ${TSCREENS}
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
    // get all screens a specified widget is used on
    .get((req, res, next) => {
        if (req.query.widgetId) {
            widgetId = req.query.widgetId;
            tryCatch(req, res, async(req, res) => {
                const queryStr =
                    `SELECT ${TSCREENS}.id as screen_id, ${TSCREENS}.user_id, ${TSCREENS}.name, ${TSCREENS}.description, ${TSCREENS}.public
                     FROM widgets
                     JOIN screens_widgets
                       ON widgets.id = widget_id
                     JOIN ${TSCREENS}
                       ON ${TSCREENS}.id = screen_id
                     WHERE widgets.id = ${widgetId}`;
                console.log({ widgetId, queryStr });
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all screens 
    // TODO: this should only be possible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT ${SCREEN_COLUMNS}, ${TUSERS}.user_name, ${TUSERS}.first_name, ${TUSERS}.last_name
                 FROM ${TSCREENS}
                 JOIN ${TUSERS}
                   ON user_id = ${TUSERS}.id;`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // create screen
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `INSERT INTO ${TSCREENS}
                    (user_id, name, description, size_x, size_y, thumbnail, public, created, last_saved)
                 VALUES
                    ('${user_id}', 
                     '${name}', 
                     '${description}', 
                     '${size_x}', 
                     '${size_y}', 
                     '${thumbnail}', 
                     '${public}',
                     to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}),     
                     to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT})
                    )
                 RETURNING id;`;
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });


screensRouter.route('/:screenId')
    // get single screen
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT ${SCREEN_COLUMNS}, ${TUSERS}.user_name, ${TUSERS}.first_name, ${TUSERS}.last_name
                 FROM ${TSCREENS}
                 JOIN ${TUSERS}
                   ON user_id = ${TUSERS}.id
                 WHERE ${TSCREENS}.id = ${screenId};`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // update screen
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const { name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `UPDATE ${TSCREENS} SET ` +
                getParamQuery('name', name, isFirst = true) +
                getParamQuery('description', description) +
                getParamQuery('size_x', size_x) +
                getParamQuery('size_y', size_y) +
                getParamQuery('thumbnail', thumbnail) +
                getParamQuery('content', content) +
                getParamQuery('public', public) +
                getParamQuery('last_saved', `to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT})`, false, false) +
                ` WHERE id = ${screenId};`
            console.log({ screenId, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
        })
    })
    // delete screen
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            // first delete all screen-widgets of this screen
            await deleteScreenWidgets(screenId);

            // delete screen itself
            const queryStr =
                `DELETE FROM ${TSCREENS} 
                 WHERE id = ${screenId};`
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    });

module.exports = { screensRouter };