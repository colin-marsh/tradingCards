const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
	username: {type: String,required:true,minlength:1},
    password: {type: String,required:true},
    privacy:{type: Boolean,required:true,default:false},
    friends:[{type:String}],
    outTradeReq:[{type:Object}],    
    inTradeReq:[{type:Object}],
    outFriendReqs:[{type:String}],
    inFriendReqs:[{type:String}],
    cards:[{type:Object}]
});


module.exports = mongoose.model("User", userSchema);