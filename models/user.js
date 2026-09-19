const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const  passportLocalMongooseModule  = require("passport-local-mongoose");

// 2. Resolve the function safely (only declaring 'passportLocalMongoose' ONCE here)
const passportLocalMongoose = typeof passportLocalMongooseModule === 'function'
    ? passportLocalMongooseModule
    : (passportLocalMongooseModule.default || passportLocalMongooseModule.passportLocalMongoose);


const userSchema = new Schema({//local-mongoose auttomatically add username and password fields.
    email : {
        type : String,
        required : true,
    }
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);