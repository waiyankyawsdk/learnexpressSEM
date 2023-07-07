const express = require("express")
const {
    body,
    param,
    validationResult
} = require("express-validator");
const mongojs = require('mongojs');
const router = express.Router();
const cors = require("cors");
const db = require("./db");
const auth = require("./auth");
const jwt = require("jsonwebtoken");

//need to under middleware and declare auth value first
router.post("/login", function (req, res) {
    const { username, password } = req.body;

    const user = auth.users_data.find(function (u) {
        return u.username === username && u.password === password;
    });

    const is_auth = true;
    if (is_auth) {
        jwt.sign(user, auth.secret_key, {
            expiresIn: "1h"
        }, function (err, token) {
            return res.status(200).json({ token });
        });
    } else {
        return res.sendStatus(401);
    }
});

router.get("/people", function (req, res) {
    const data = [
        { name: "Bobo", age: 22 },
        { name: "Nini", age: 23 },
    ];
    return res.status(200).json(data);
});

router.get("/people/:id", function (req, res) {
    const id = req.params.id;
    return res.status(200).json({ id });
});

//get all records
router.get("/records", auth.authenticate,function (req, res) {
    const options = req.query;

    const sort = options.sort || {};
    const filter = options.filter || {};
    const limit = 10;
    const page = parseInt(options.page) || 1;
    const skip = (page - 1) * limit;

    for (i in sort) {
        sort[i] = parseInt(sort[i]);
    }

    db.records.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit, function (err, data) {
            if (err) {
                console.error('Failed to fetch records:', err);
                return res.sendStatus(500);
            } else {
                return res.status(200).json({
                    meta: {
                        skip,
                        limit,
                        sort,
                        filter,
                        page,
                        total: data.length
                    },
                    data,
                    links: {
                        self: req.originalUrl,
                    }
                });
            }
        });
        // res.append("Access-Control-Allow-Origin", "*");
        // res.append("Access-Control-Allow-Methods", "*");
        // res.append("Access-Control-Allow-Headers", "*");
});

router.get("/record/:id", auth.authenticate, function(req, res){
    const id = req.params.id;
    db.records.find({ _id : mongojs.ObjectID(id)}, function(err, data){
        if (err) {
            console.error('Failed to fetch records:', err);
            return res.sendStatus(500);
        } else {
            return res.status(200).json({
                meta: {
                    total: data.length
                },
                data,
                links: {
                    self: req.originalUrl,
                }
            });
        }
    });
});
//create route
router.post("/records", [
    body("name").not().isEmpty(),
    body("from").not().isEmpty(),
    body("to").not().isEmpty(),
], function (req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.records.insert(req.body, function (err, data) {
        if (err) {
            return res.status(500);
        }

        const _id = data._id
        res.append("Location", "/testapi/records/" + _id);
        return res.status(201).json({ meta: { _id }, data });
    });
});

//update route(put)
router.put("/records/:id", [
    param("id").isMongoId(),
], function (req, res) {
    const _id = req.params.id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.records.count({ _id: mongojs.ObjectID(_id) }, function (err, count) {
        if (count) {
            const record = {
                _id: mongojs.ObjectID(_id),
                ...req.body
            };

            db.records.save(record, function (err, data) {
                return res.status(200).json({
                    meta: { _id },
                    data
                });
            });
        } else {
            db.records.save(req.body, function (err, data) {
                return res.status(201).json({
                    meta: { _id: data._id },
                    data
                });
            });
        }
    });
});

//update route(patch)
router.patch("/records/:id", [
    param("id").isMongoId(),
], function (req, res) {
    const _id = req.params.id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.records.count({ _id: mongojs.ObjectId(_id) }, function (err, count) {
        if (count) {
            db.records.update(
                { _id: mongojs.ObjectId(_id) },
                { $set: req.body },
                { multi: false },
                function (err, data) {
                    db.records.find({
                        _id: mongojs.ObjectId(_id)
                    }, function (err, data) {
                        return res.status(200).json({
                            meta: { _id }, data
                        });
                    });
                }
            )
        } else {
            return res.sendStatus(404);
        }
    });
});

//unlink route
router.delete("/records/:id", auth.authenticate, auth.validateAdmin, function (req, res) {
    const _id = req.params.id;
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            db.records.remove({
                _id: mongojs.ObjectId(_id)
            }, function (err, data) {
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(404);
        }
    });
});

// router.use(function(req, res, next){
//     res.append("Access-Control-Allow-Origin", "*");
//     res.append("Access-Control-Allow-Methods", "*");
//     res.append("Access-Control-Allow-Headers", "*");
//     next();
// });
router.use(cors());
module.exports = router;