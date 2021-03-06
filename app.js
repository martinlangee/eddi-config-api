const { StatusCodes } = require("http-status-codes");
const express = require("express");
const bodyParser = require("body-parser");
var cors = require('cors');
const Db = require("./db");

if (process.env.NODE_ENV !== Db.ENV_DEV) {
    console.log("Disabling all logs in production mode");
    for (let func in console) {
        console[func] = function() {};
    }
}

const app = express();

const { checkUser } = require("./middleware/authMiddleware");
const { usersRouter } = require("./routes/users");
const { widgetsRouter } = require("./routes/widgets");
const { screensRouter } = require("./routes/screens");
const { screenWidgetsRouter } = require("./routes/screenWidgets");
const { getLocalIpAddresses } = require("./utils");

const baseRoute = '/api';

app.use(cors());

app.use(function(req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

// set limits for body data size to 2 MB (for image upload)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: false }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// log every request
app.use((req, res, next) => {
    console.log(req.body);
    console.log(req.method, req.originalUrl);
    next();
});

// Routes ------
//app.get('*', checkUser);  // TODO: complete user check
app.use(`${baseRoute}/user`, usersRouter);
app.use(`${baseRoute}/widget`, widgetsRouter);
app.use(`${baseRoute}/screen`, screensRouter);
app.use(`${baseRoute}/screenwidgets`, screenWidgetsRouter);


// Error handling -----
app.use('*', function(req, res, next) {
    error = {
        statusCode: StatusCodes.MOVED_PERMANENTLY,
        message: `${req.ip} failed to ${req.method} '${req.originalUrl}'`
    };
    next(error);
});

app.use((error, req, res, next) => {
    if (!error.statusCode)
        error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    // TODO: implement '404' redirect page
    // if (error.statusCode === StatusCodes.MOVED_PERMANENTLY) {
    //     return res.status(StatusCodes.MOVED_PERMANENTLY).redirect('/not-found');
    // }

    return res.status(error.statusCode).json(error);
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
    console.log('local ip:', getLocalIpAddresses());
})