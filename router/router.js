const exoress = require("express");
const router = exoress.Router();
const schema = require("../validation/userValidation");
const log_schema = require("../validation/login_Validation");
const myconnections = require('../config/db_config');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const { sign, verify } = require('jsonwebtoken');
const { upload } = require('../multer/uploads');
// const { date } = require("joi");

let result;

// All Registard Routers.................
router.get("/reg",sessionChecker,(req, res) => {
  res.render("index");
});

router.post("/reg",sessionChecker,(req, res) => {
  let salt = genSaltSync(10)
  const { value, error } = schema.validate(req.body, { abortEarly: false });
  let first_name = value.First_name;
  let last_name = value.Last_name;

  // Extract Date From Date & Time 
  let dateTime = value.dob;
  let dob;
  dob = dateTime.toLocaleDateString("es-CL")

  let email_id = value.email_id;
  let password = hashSync(value.conforn_passwords, salt);
  let username = value.First_name + ' ' + value.Last_name;
 
  // return false;
  if (error) {
  return res.render("index", { error });
  } else {
    if (!req.session.user) {
      myconnections.query('INSERT INTO `registard_users`(`first_name`, `last_name`, `dob`, `email_id`, `passwords`) VALUES (?, ?, ?, ?, ?)',[first_name, last_name, dob, email_id, password], (err, results)=>{
        let user_id = results.insertId;
        // console.log(user_id, 'reg user_id')
        if (err) {
        return res.render('index', {err})
        } else {
          req.session.user = email_id,
          req.session.name = username,
          req.session.userId = user_id;
          let result = {
            id: user_id,
            email_id: email_id,
            username: username
          }
          // console.log(result, 'reg 2 userId')
          let jsonwebtoken = sign({ result: result }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPAIRED,
          });
          res.cookie('token', jsonwebtoken, {
          httpOnly: true,
          secure: true,
         })
        return  res.redirect('/dashboard')
        }
      })
    }
  }
});

// All Login Routers..............
router.get("/login", sessionChecker,(req, res) => {
  req.flash('message', 'Welcome to Blog');
  res.render("login");
});

router.post("/login", sessionChecker,(req, res) => {
  const { value, error } = log_schema.validate(req.body, { abortEarly: false });
  let email = value.log_email
  if (error) {
    return res.render("login", { error });
  } else {
    myconnections.query('SELECT * FROM `registard_users` WHERE email_id = ?', [email], (err, result)=>{
      // console.log(result)
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
          req.session.userId = result[0].id 
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
  // console.log(req.session.userId ,'indashboard')
return res.render("dashboard", { "username": req.session.name, "userId": req.session.userId});
});

router.post('/logout',authanticateUser,(req,res)=>{
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
router.get('/profile_update/:id',authanticateUser,tokenAuthenticate, (req,res)=>{ 
  myconnections.query('SELECT registard_users.*, profile_images.*, roles.role FROM registard_users LEFT JOIN profile_images ON registard_users.id = profile_images.user_id LEFT JOIN roles ON registard_users.id = roles.user_id WHERE registard_users.id =?',[req.params.id], (err, results)=> {
    if (err) {
      return res.status(406).redirect("/dashboard");
    } else {
      result = results
      // console.log(result, '2')
      return res.render("profilePic", { result, "userId": req.session.userId,"username": req.session.name, });
    }
  })
})

// Everything went fine.
router.post('/profile_update/:id',authanticateUser, tokenAuthenticate, upload.single("file"), async(req,res)=>{
    // console.log(req.body, 'get all body', req.file, 'get images only')
    // console.log(req.file,req.body, 'get images only')

    //Req.body Part
    let userid = req.params.id;
    let first_name = req.body.First_name;
    let Last_name = req.body.Last_name;
    let dob = req.body.dob;
    let email_id = req.body.email_id;

    // if (req.file) {
    //   console.log(req.file.fieldname, req.body.First_name,'Images Info')
    // } else {
    //   console.log(req.body, 'User Details Info')
    // }
// return false;
if (req.file) {
    let userid = req.params.id;
    let file_name = req.file.filename;
    let file_type = req.file.mimetype;

    let file_size = req.file.size;
    let fileinKB = (file_size / 1024).toFixed(2); // to KB
    let file;
    if (fileinKB < 1024) {
      file = fileinKB + " KB";
    } else {
      file = (file_size / (1024 * 1024)).toFixed(2) + " MB";
    }
    let file_locations = req.file.destination;
    let file_path = req.file.path;
    
    try {
      myconnections.query('SELECT * FROM `profile_images` WHERE user_id =?',[req.params.id],(err, results)=> {
        if (err) {
          console.log(err)
          return res.status(406).redirect("/dashboard");
        } 
       if (!results[0]){
          myconnections.query('INSERT INTO `profile_images`(`user_id`, `file_name`, `file_type`, `file_size`, `file_locations`, `file_path`) VALUES (?, ?, ?, ?, ?, ?)',[userid, file_name, file_type, file, file_locations, file_path], (err, response)=>{
            if (err) {
              console.log(err)
              return res.status(406).redirect("/dashboard"); 
            } else {
              if (response) {
                myconnections.query('UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?',[first_name, Last_name, dob, email_id, userid],(err,response)=>{
                  if(err){
                    console.log(err)
                  }else {
                    req.session.name = req.body.First_name + ' ' + req.body.Last_name
                    return res.redirect('/dashboard') 
                  };
                })
              }
            }
          })
      } else {
          // console.log('update')
          myconnections.query('UPDATE `profile_images` SET `file_name`=?,`file_type`=?,`file_size`=?,`file_locations`=?,`file_path`=?,`updated_at`=CURRENT_TIMESTAMP WHERE user_id =?',[file_name, file_type, file, file_locations, file_path, userid],(err,results)=>{
            if(err){
              console.log(err)
            } else {
              if (results) {
                myconnections.query('UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?',[first_name, Last_name, dob, email_id, userid],(err,response)=>{
                  if(err){
                    console.log(err)
                  }else {
                    req.session.name = req.body.First_name + ' ' + req.body.Last_name
                    return res.redirect('/dashboard'); 
                  };
                })
              }
            };
          })
        }
      }) 
    } catch (error) {
      console.log(error)
      return res.status(406).redirect("/dashboard");
    }
    // Check If User Pass Images And User Details At a Time
  } else {
    try {
          // console.log('update')
          myconnections.query('UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?',[first_name, Last_name, dob, email_id, userid],(err,response)=>{
                  if(err){
                    console.log(err)
                  } else {
                    req.session.name = req.body.First_name + ' ' + req.body.Last_name
                    return res.redirect('/dashboard') 
                  };
                })
    } catch (error) {
      console.log(error)
      return res.status(406).redirect("/dashboard");
    }
  }
})


// Change Password Sections ................
router.get('/changePassword', (req,res)=>{
  return res.render('changePassword')
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
        // console.log(decoded)
        req.session.name;
        req.session.userId = decoded.result.id
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
