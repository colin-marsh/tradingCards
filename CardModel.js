const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let cardSchema = Schema({
	artist: {type: String,required:true,minlength:1},
    attack: {type: Number,required:true},
    cardClass:{type: String,required:true},
    health:{type:Number,required:true},
    name:{type:String,required:true},
    rarity:{type:String,required:true}
});


module.exports = mongoose.model("Card", cardSchema);
