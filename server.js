const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require('path')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/a5',
    collection: 'sessiondata'
});
const logger = (req,res,next) =>{ //Prints out all get/post requests in concole
    let url = req.url
    let method = req.method
    console.log(`${method} : ${url}`)
    //console.log("Logged in: "+amLoggedIn)
    next();
}
const User = require("./UserModel");
const Card = require("./CardModel");
let userRouter = require("./user-router")

app.use(express.static("public"))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(logger)  
app.use(session({ secret: 'some secret here', store: store }))
app.set("view engine","pug")
app.set("views","./views")

app.use("/users",userRouter) //Loads router for individual user page

app.get("/",loadHome)
app.get("/login",loadLoginPage) //Loads login html page
app.get("/register",loadNewAccPage) //Loads new account html page
app.get("/client.js",loadClient)  
app.get("/currentUser",getCurrentUser) //gets the current user logged into the session
app.get("/card/:cardID",loadCard) //Loads a specific card page
app.post("/login",login) //user attempted to log into an account
app.post("/register",createAcc) //user attempted to dreate a new account
app.post("/client.js",searchFriend) //user types into the inputbox to search for a friend to add
app.post("/addFriend",addFriend) //user pressed the add friend button on a seatched user
app.post("/declineFriend",declineFriend) //User declined a friend request
app.post("/acceptFriend",acceptFriend) //user accepted a friend request
app.post("/trade",trade) //user selected a user to trade with
app.post("/sendTrade",sendTrade) //user sent a trade request
app.post("/respondTrade",respondTrade) //user accepted or declined a trade request

app.get("/logout", function(req, res, next){ //Logs user out of the session
    req.session.loggedin = false;
    req.session.user = {}
    req.session.username = ""
    res.redirect("/");
})

let currUser

function loadHome(req,res,next){
    res.render("pages/index",{loggedIn:req.session.loggedin,user:req.session.user})
}

function loadLoginPage(req,res,next){
    res.sendFile(path.join(__dirname+'/public/login.html')) 
}
  
function loadNewAccPage(req,res,next){
    res.sendFile(path.join(__dirname+'/public/register.html'))
}
function loadClient(req,res,next){
    res.sendFile(path.join(__dirname+"/client.js"))
}

function loadCard(req,res,next){
    console.log(req.params.cardID)
    Card.findById(req.params.cardID).exec(function(err,result){
        if(err)throw (err)
        console.log(result)
        res.render("pages/card",{loggedIn:req.session.loggedin,card:result,user:req.session.user})
    })
}

function getCurrentUser(req,res,next){
    console.log("In get current user")
    User.findOne({username:req.session.username}).exec(function(err,result){
        console.log(result)
        currUser = result  
        res.send(JSON.stringify(result))

    })
    
}

function trade(req,res,next){
    console.log(req.body)
    let trade = {}
    trade.yourCards = req.session.user.cards
    let theirCards = []
    User.findOne({username:req.body.user}).exec(function(err,result){ //Finds all the available cards a user can trade to you
        trade.theirCards = result.cards
        res.send(JSON.stringify(trade))
    })
}

function respondTrade(req,res,next){
    let trade = req.body
    console.log(trade)
    cardsYouGive= [] //Cards person who recieved the trade gets
    cardsYouRecieve= [] //Cards person who sent the trde Gets

    for(i in trade.youGive){
        Card.findOne({name:trade.youGive[i]}).exec(function(err,card){ //Card person who recieved the trade Gets
            cardsYouGive.push(card)
        })
    }
    for(i in trade.youRecieve){
        Card.findOne({name:trade.youRecieve[i]}).exec(function(err,card){ //Card person who sent trade gets
            cardsYouRecieve.push(card)
        })

    }
    
    User.findOne({username:req.body.tradeFrom}).exec(function(err,user){ ////USer that sent the trade inititally
        console.log(user)
        if(trade.theyAccept == true){
            console.log("Trade was accepted, "+user.username+" gets cards:")
            for(i in cardsYouRecieve){
                console.log(cardsYouRecieve[i])
                user.cards.push(cardsYouRecieve[i])
            }

        }else{
            console.log("Trade was declined "+user.username+" gets her cards back:")
            for (i in cardsYouGive){
                console.log(cardsYouGive[i])
                user.cards.push(cardsYouGive[i])
            }
        }
        for(i in user.outTradeReq){
            if(user.outTradeReq[i].tradeWith == trade.tradeWith){
                user.outTradeReq.splice(i,1)
            }
        }
        user.save();
    })

    User.findOne({username:req.body.tradeWith}).exec(function(err,user){  //User accepting the trade
        console.log("User:")
        console.log(user)
        if(trade.theyAccept == true){
            for(i in cardsYouGive){
                user.cards.push(cardsYouGive[i]) //Card you recieve
            }
            for(i in cardsYouRecieve){
                for(j in user.cards){
                        if(user.cards[j]== cardsYouRecieve[i]){ //Removes card you traded from your cards
                            user.cards.splice(j,1)
                        }
                }
            }
        }else{
            console.log("they accept false")
        }
        for(i in user.inTradeReq){
            if(user.inTradeReq[i].tradeFrom == trade.tradeFrom){
                user.inTradeReq.splice(i,1)
            }
        }
        user.save()
    })
    res.end()
}

function sendTrade(req,res,next){
    console.log(req.body)
    User.findOne({username:req.body.tradeWith}).exec(function(err,user){
        user.inTradeReq = req.body
        user.save()
    })
    
    User.findOne({username:req.session.username}).exec(function(err,user){ //User sending trade must have the cards they offered removed so they cant offer to trade to someone else
        user.outTradeReq = req.body
        user.cards = user.cards.filter(function(card){
            for(i in req.body.youGive){
                if(card.name == req.body.youGive[i]){
                    return false
                }else{
                    return true
                }
            }
        })
        user.save()
        res.end()
    })
    //res.end()
}


function searchFriend(req,res,next){
    User.find({username:{$regex:".*"+req.body.search+".*"}}).exec(function(err,results){
        results = results.filter(function(user){
            //Only users who arent already your friend or havent sent or recieved a friend request from you can be added
            //You also cannot add yourself
            if(user.username ==req.session.username||req.session.user.outFriendReqs.includes(user.username) == true ||req.session.user.inFriendReqs.includes(user.username)==true||req.session.user.friends.includes(user.username)==true){ //User should not be able to add themself as a friend
                return false;
            }
            else if(user.username != req.session.username){ 
                return true;
            }
        })
        res.send(JSON.stringify(results))
    })
}

function addFriend(req,res,next){

    let foundUser;
    User.findOne({username:req.body.addUser}).exec(function(err,result){
        result.inFriendReqs.push(req.session.username) //Someone added this user so they recieve a friend request
        foundUser = result
        result.save();
    })
    User.findOne({username:req.session.username}).exec(function(err,result){ //You added another user so they are added to your outgoing friend requests
        result.outFriendReqs.push(foundUser.username)
        result.save()
    })
    res.end() 
}

function acceptFriend(req,res,next){

    let foundUser
    let currUser

    User.findOne({username:req.body.accept}).exec(function(err,result){
        console.log("User Being Added")
        result.outFriendReqs = result.outFriendReqs.filter(function(user){
            if(user == req.session.username){ //User accepted your friend request so they no longer have a request from you
                return false
            }
        })
        result.friends.push(req.session.username)
        foundUser = result
        result.save();
    })

    User.findOne({username:req.session.username}).exec(function(err,result){
        result.inFriendReqs = result.inFriendReqs.filter(function(user){
            if(user == req.body.accept){ //Friend request was accepted so outgoing friend request is removed and user is added to friends
                return false
            }
        })
        result.friends.push(foundUser.username)
        req.session.user = result
        result.save()
        console.log(result)
    })
    res.end()
}

function declineFriend(req,res,next){
    let currUser
    User.findOne({username:req.body.decline}).exec(function(err,result){
        result.outFriendReqs = result.outFriendReqs.filter(function(user){
            if(user == req.session.username){//Removing from friend requests
                return false
            }
        })
        result.save();
    })

    User.findOne({username:req.session.username}).exec(function(err,result){
        result.inFriendReqs = result.inFriendReqs.filter(function(user){
            if(user == req.body.decline){ //Friend request was decliend so outgoing friend request is removed
                return false
            }
        })
        currUser = result
        req.session.user = currUser
        result.save()
    })
    res.end()
}

function login(req,res,next){

    let username = req.body.username //Reads username and password from the form
    let password = req.body.password
    User.findOne({username:username}).exec(function(err,result){  //Check if username is already in the database
      if(err)throw err;
      console.log(result)
      if(result){
        if(result.password === password){
            req.session.loggedin = true;
            req.session.user = result
            req.session.username = username;
            res.redirect("/users/"+result._id) //redirect to the profile logged into
        }else{
          console.log("password is incorrect")
            }
        }else{
        console.log("Username is incorrect")
            return;
        }
    })
  
}

function createAcc(req,res,next){
    let username = req.body.username //Reads username from the html form
    let password = req.body.password
    User.findOne({username:username}).exec(function(err,result){ //Checks if the username already exists in the database
        if(err)throw err;
        console.log(result)
        if(result){ //Username exists
        console.log("This Username is already taken")  
        }else{ //New account
            console.log("You have created an account")
            let u = new User(); //Setting new user information
            u.username= username
            u.password=password
            req.session.user = u  //New user is logged in
            req.session.username = username
            req.session.loggedin = true
            u.save(function(err, result){ //User is saved to the database
            if(err){
                console.log(err);
                res.status(500).send("Error creating user.");
                return;
            }
            res.redirect("/users/"+u._id)		//Redirects to the new user page
            })
        }
    })
}
  

mongoose.connect('mongodb://localhost/a5', {useUnifiedTopology:true,useNewUrlParser: true});
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(){
  mongoose.connection.db.collection('users')
  app.listen(3000);
  console.log("Listening on port 3000")
})