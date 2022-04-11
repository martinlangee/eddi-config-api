const jwt = require('jsonwebtoken');
const Db = require('../db');

/*  currently not needed
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // check json web token exists & is verified
    if (token) {
        jwt.verify(token, Db.SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login');
            } else {
                console.log(decodedToken);
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
};
*/
// check current user
const checkUser = (req, res, next) => {
    console.log('checkUser');
    const token = req.cookies.jwt;
    if (token) {
        console.log('checkUser - token:', token);
        jwt.verify(token, Db.SECRET, async(err, decodedToken) => {
            console.log('checkUser - err:', err);
            if (err) {
                res.locals.user = null;
                next();
            } else {
                let user = await Db.findUserById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        });
    } else {
        console.log('checkUser - reset user');
        res.locals.user = null;
        next();
    }
};


module.exports = { checkUser };