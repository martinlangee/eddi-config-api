const express = require("express");
const app = express();
const usersRouter = require("./routes/users");
const widgetsRouter = require("./routes/widgets");

// Routes ------
app.use('/users', usersRouter);
app.use('/widgets', vidgetsRouter);

app.listen(3000, () => {
    console.log(`server is listening on port 3000`);
})