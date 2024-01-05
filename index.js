import express from 'express'
import path from "path"
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
// import { name } from 'ejs';

mongoose.connect("mongodb://localhost:27017", {
  dbName: "backend",
}).then(() => {
  console.log("Database connected")
}).catch(e => {
  console.log(e)
})

//create schema
const userSchema = new mongoose.Schema({
  name: String, 
  email: String,
  password: String
})

const User = mongoose.model("users", userSchema)

const app = express();
const port = 5000;

//USING MIDDLEWARES
//express static
app.use(express.static(path.join(path.resolve() , "./public")))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Setting up view engine 
app.set("view engine", "ejs")

// app.get("/", (req, res) => {
//   //if we are using type module it package.json inplace of commonjs, then we have to use path.resolve() in place of __dirname
// //   res.sendFile(path.join(__dirname + "/index.html"));
//   res.render("index", name = "Shubhi")
// });

const isAuthenticated = async(req, res, next) => {
  const {token} = req.cookies;
    if(token) {
      const decoded = jwt.verify(token, "djsgddgddvchdbcj")
      req.user = await User.findById(decoded._id)
      next()
    }
    else
      res.redirect("/login")
}

app.get("/", isAuthenticated, async (req, res) => {
  res.render("logout", {name : req.user.name})
})

app.get("/login",  (req, res)=>{
  res.render("login")
})

app.get("/register",  (req, res)=>{
  res.render("register")
})

app.post("/login", async (req, res) => {
  const {email, password} = req.body;

  let user = await User.findOne({email});
  if(!user){
    return res.redirect("/register")
  }
  const isMatch = bcrypt.compare(user.password, password)
  if(!isMatch) return res.render("login", {email: email, message: "Incorrect password"})

  const token_id = jwt.sign({_id: user._id}, "djsgddgddvchdbcj")

  res.cookie("token", token_id, {
    httpOnly:true, expires: new Date(Date.now() + 60*1000)
  })
  res.redirect("/");
});

app.get("/users", (req, res) => {
  console .log(User.find({email}))
})

app.post("/register", async (req, res) => {
  
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user instance
    user = new User({ 
      name, 
      email, 
      password: hashedPassword 
    });

    // Save the user to the database
    await user.save();

    // Generate a token for the user
    const token_id = jwt.sign({ _id: user._id }, "djsgddgddvchdbcj");

    // Set the token as a cookie
    res.cookie("token", token_id, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000),
    });

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly:true, expires: new Date(Date.now())
  })
  res.redirect("/");
});

// app.post("/", (req, res) => {
//   // Check if the user already exists
//   if (users.find((item) => item.username === req.body.name && item.email === req.body.email)) {
//     res.send("User already exists");
//   } else {
//     // User doesn't exist, add to the array
//     users.push({ username: req.body.name, email: req.body.email });
//     // Redirect to success page
//     res.redirect("/success");
//   }
//   console.log({ users });
// });


app.listen(port, () => {
  console.log(`Server is woring on port: ${port}`);
}); 