const express = require("express");
const app = express();
const cors = require("cors")
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken")
const auth = require("./auth")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

const routes = require("./routes");
app.use("/testapi", routes);

//test route
app.get("/test", function (req, res) {
    return res.json(req.query);
});

app.listen(8001, function () {
    console.log("Server running at port 8000...");
});