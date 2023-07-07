const mongojs = require("mongojs");
const db = mongojs('mongodb://root:password@localhost:27017/travel?authSource=admin', ["records"]);

db.on('error', function (err) {
    console.log('database error', err)
})
 
db.on('connect', function () {
    console.log('database connected')
})

module.exports = db