if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}
console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = ('mongodb://127.0.0.1:27017/Homehive');
const dbUrl = process.env.ATLASDB_URL;

main()
.then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);//ejsmate
app.use(express.static(path.join(__dirname,"/public")));

const session = require("express-session");
const { MongoStore } = require('connect-mongo');
const flash = require("connect-flash");

const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto : {
        secret : process.env.SECRET,
    },
    touchAfter : 24 * 3600,
});

store.on("error",(err) => {
    console.log("error occur in mongo session store",err);
})

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
};

// app.get("/",(req,res) => {
//     res.send("root is working");
// })

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
})

// app.get("/fakeUser", async(req,res) => {
//     const fakeUser = new User({
//         email : "abc@gmail.com",
//         username : "abc",
//     })
//     let registerUser =  await User.register(fakeUser,"helloWOrld");
//     res.send(registerUser);
// })

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


//get image
// app.get("/testListing",async(req,res) => {
//     let sampleListing = new Listing({
//         title:"My new house",
//         description : "Around the river",
//         price : 12000,
//         location : "tokyo",
//         country : "japan",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("testing is successful");
// })

app.all('*',(req,res,next) => {
    next( new ExpressError(404,"Page Not Found!"));
})

app.use((err,req,res,next) => {
    const {statusCode=500,message="something,went wrong!"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("listings/error.ejs",{message});
})

app.listen(8080,()=>{
    console.log("app is listening on port 8080");
})