const exoress = require("express");
const router = exoress.Router();
const schema = require("../validation/userValidation");
const log_schema = require("../validation/login_Validation");
const myconnections = require('../config/db_config');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const { sign, verify } = require('jsonwebtoken');

// All Registard Routers.................
router.get("/reg",sessionChecker,(req, res) => {
  res.render("index");
});

router.post("/reg",sessionChecker,(req, res) => {
  let salt = genSaltSync(10)
  const { value, error } = schema.validate(req.body, { abortEarly: false });
  let first_name = value.First_name;
  let last_name = value.Last_name;
  let dob = value.dob;
  let email_id = value.email_id;
  let password = hashSync(value.conforn_passwords, salt);
  let username = value.First_name + ' ' + value.Last_name;

  if (error) {
  return res.render("index", { error });
  } else {
    if (!req.session.user) {
      myconnections.query('INSERT INTO `registard_users`(`first_name`, `last_name`, `dob`, `email_id`, `passwords`) VALUES (?, ?, ?, ?, ?)',[first_name, last_name, dob, email_id, password], (err, results)=>{
        if (err) {
        return res.render('index', {err})
        } else {
          req.session.user = email_id,
          req.session.name = username;
          let jsonwebtoken = sign({ result: results.insertId, email_id: email_id, username: username }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPAIRED,
          });
          res.cookie('token', jsonwebtoken, {
          httpOnly: true,
          secure: true,
         })
          res.redirect('/dashboard')
        }
      })
    }
  }
});

// All Login Routers..............
router.get("/login", sessionChecker,(req, res) => {
  res.render("login");
});

router.post("/login", sessionChecker,(req, res) => {
  const { value, error } = log_schema.validate(req.body, { abortEarly: false });
  let email = value.log_email
  if (error) {
    return res.render("login", { error });
  } else {
    myconnections.query('SELECT * FROM `registard_users` WHERE email_id = ?', [email], (err, result)=>{
      if (!result[0]) {
      console.log('Login falied')
      return res.render('login')
      }
      if (err) {
        return res.render('login')
      } else {
        let validUser = compareSync(value.log_passwords, result[0].passwords);
        if (validUser) {
          let username = result[0].first_name + ' ' + result[0].last_name;
          req.session.user = email,
          req.session.name = username
          let jsonwebtoken = sign({ result: result[0]  }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPAIRED,
          });
          res.cookie('token', jsonwebtoken, {
            httpOnly: true,
            secure: true,
          })
          console.log('sucess')
          return res.redirect('/dashboard')
        } else {
          console.log('Invalid Username or Passwords')
          return res.render('login')
        }
      }
    })
  }
});

// All Dashboard Routers.............

router.get("/dashboard",authanticateUser, tokenAuthenticate,(req, res) => {
return res.render("dashboard", {"username": req.session.name});
});

router.post('/logout',(req,res)=>{
  if (req.session.user) {
    req.session.destroy()
    res.clearCookie()
    res.cookie('token', '', {maxAge: 1})
    return res.redirect("/login");
  } else { 
   res.render('dashboard')
  }
})

// Profile Update section .................
router.get('/profile_update',authanticateUser,tokenAuthenticate,(req,res)=>{
  return res.render('profilepic', {"username": req.session.name})
})

//..............................0.................................


function sessionChecker(req,res,next) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }else{
    next()
  }
}

function authanticateUser(req,res,next) {
  if (!req.session.user) {
    return res.redirect('/login')
  } else {
    next()
  }
}

function tokenAuthenticate(req,res,next) {
  let token = req.cookies.token
  if (token) {
    verify(token, process.env.JWT_SECRET,(err,decoded)=>{
      if (decoded) {
        req.session.name;
        next()
      } else {
        return res.redirect('/login');
      }
    })
  } else {
    return res.redirect('/login')    
  }
}

module.exports = router;
