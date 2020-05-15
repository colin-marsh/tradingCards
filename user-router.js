const express = require('express');
const path = require('path');
const fs = require("fs");
const mongoose = require("mongoose");
const User = require("./UserModel");
const ObjectId= require('mongoose').Types.ObjectId
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/a5',
    collection: 'sessiondata'
});


let router = express.Router();
router.get("/",loadUsers) //Load all users

router.get("/:userID",getUserWithID) 

function getUserWithID(req,res,next){ //Find specific user page
    console.log(req.params.userID)
    User.findById(req.params.userID).exec(function(err,result){ //Find user by id from the params
        if (err)throw(err)
        if(req.session.loggedin == true && req.session.username == result.username){ //If this is the logged in user they can edit their privacy
            console.log("This user is logged in")
            console.log(result.cards)
            res.render("pages/userpage",{user:result,loggedIn:req.session.loggedin})
        }else{
            console.log("This user is not logged in") //If this is logged out user they cannot
            res.render("pages/userpage",{user:result,loggedIn:false})

        }
    })
}


function loadUsers(req,res,next){
    res.status(500).send("Works")
}

module.exports = router;
