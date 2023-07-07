const jwt = require("jsonwebtoken")
const secret = "Fr0nt!!r"

const users = [
    { username: "Alice", password: "password", role: "admin" },
    { username: "Bob", password: "password", role: "user" },
];

function auth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if(!authHeader) return res.sendStatus(401);
    const [ type, token ] = authHeader.split(" ");
    if(type !== "Bearer") return res.sendStatus(401);
    jwt.verify(token, secret, function(err, data) {
    if(err) return res.sendStatus(401);
    else next();
    });
}

function onlyAdmin(req, res, next){

    const [type , token] = req.headers["authorization"].split(" ");

    jwt.verify(token, secret, function(err, user){
        if(user.role == "admin") next();
        else return res.sendStatus(403);
    });
}
module.exports = {users_data : users, secret_key : secret,
    authenticate: auth, validateAdmin : onlyAdmin};

