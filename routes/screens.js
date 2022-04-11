const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screensRouter = express.Router();
const Db = require("../db");
const { tryCatch } = require("../utils");
const { deleteScreenWidgets } = require("./screenWidgets");

screensRouter.use(express.json()); // => req.body

// '/screens' Routes ------

const SCREEN_COLUMNS = `${Db.TSCREENS}.id, 
                        ${Db.TSCREENS}.name, 
                        ${Db.TSCREENS}.description, 
                        ${Db.TSCREENS}.size_x, 
                        ${Db.TSCREENS}.size_y, 
                        ${Db.TSCREENS}.thumbnail, 
                        ${Db.TSCREENS}.public, 
                        to_char(${Db.TSCREENS}.created,  ${Db.DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(${Db.TSCREENS}.last_saved,  ${Db.DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        ${Db.TSCREENS}.user_id`;

screensRouter.route('')
    // get screens:
    // - of specified user 
    // - and of all public ones if ?public=true is passed additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {
        if (req.query.userId) {
            tryCatch(req, res, async(req, res) => {
                const userId = req.query.userId;
                const seePublic = await Db.getSeePublicScreens(userId);
                const querySeePublic = seePublic ? ` OR ${Db.TUSERS}.see_public_screens = true` : '';
                const queryStr =
                    `SELECT ${SCREEN_COLUMNS}, ${Db.TUSERS}.user_name, ${Db.TUSERS}.first_name, ${Db.TUSERS}.last_name
                     FROM ${Db.TSCREENS}
                     JOIN ${Db.TUSERS}
                       ON user_id = ${Db.TUSERS}.id
                     WHERE user_id = ${userId}${querySeePublic};`;
                console.log({ userId, seePublic, queryStr });
                res.status(StatusCodes.OK).json((await Db.pgClient.query(queryStr)).rows);
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
                    `SELECT ${Db.TSCREENS}.id as screen_id, ${Db.TSCREENS}.user_id, ${Db.TSCREENS}.name, ${Db.TSCREENS}.description, ${Db.TSCREENS}.public
                     FROM widgets
                     JOIN screens_widgets
                       ON widgets.id = widget_id
                     JOIN ${Db.TSCREENS}
                       ON ${Db.TSCREENS}.id = screen_id
                     WHERE widgets.id = ${widgetId}`;
                console.log({ widgetId, queryStr });
                res.status(StatusCodes.OK).json((await Db.pgClient.query(queryStr)).rows);
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
                `SELECT ${SCREEN_COLUMNS}, ${Db.TUSERS}.user_name, ${Db.TUSERS}.first_name, ${Db.TUSERS}.last_name
                 FROM ${Db.TSCREENS}
                 JOIN ${Db.TUSERS}
                   ON user_id = ${Db.TUSERS}.id;`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await Db.pgClient.query(queryStr)).rows);
        })
    })
    // create screen
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `INSERT INTO ${Db.TSCREENS}
                    (user_id, name, description, size_x, size_y, thumbnail, public, created, last_saved)
                 VALUES
                    ('${user_id}', 
                     '${name}', 
                     '${description}', 
                     '${size_x}', 
                     '${size_y}', 
                     '${thumbnail}', 
                     '${public}',
                     to_timestamp('${Db.formatDateTime(Date.now())}', ${Db.DATETIME_DISPLAY_FORMAT}),     
                     to_timestamp('${Db.formatDateTime(Date.now())}', ${Db.DATETIME_DISPLAY_FORMAT})
                    )
                 RETURNING id;`;
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await Db.pgClient.query(queryStr));
        })
    });


screensRouter.route('/:screenId')
    // get single screen
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT ${SCREEN_COLUMNS}, ${Db.TUSERS}.user_name, ${Db.TUSERS}.first_name, ${Db.TUSERS}.last_name
                 FROM ${Db.TSCREENS}
                 JOIN ${Db.TUSERS}
                   ON user_id = ${Db.TUSERS}.id
                 WHERE ${Db.TSCREENS}.id = ${screenId};`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await Db.pgClient.query(queryStr)).rows);
        })
    })
    // update screen
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const { name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `UPDATE ${Db.TSCREENS} SET ` +
                Db.getParamQuery('name', name, isFirst = true) +
                Db.getParamQuery('description', description) +
                Db.getParamQuery('size_x', size_x) +
                Db.getParamQuery('size_y', size_y) +
                Db.getParamQuery('thumbnail', thumbnail) +
                Db.getParamQuery('content', content) +
                Db.getParamQuery('public', public) +
                Db.getParamQuery('last_saved', `to_timestamp('${Db.formatDateTime(Date.now())}', ${Db.DATETIME_DISPLAY_FORMAT})`, false, false) +
                ` WHERE id = ${screenId};`
            console.log({ screenId, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await Db.pgClient.query(queryStr));
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
                `DELETE FROM ${Db.TSCREENS} 
                 WHERE id = ${screenId};`
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json(await Db.pgClient.query(queryStr));
        })
    });

module.exports = { screensRouter };