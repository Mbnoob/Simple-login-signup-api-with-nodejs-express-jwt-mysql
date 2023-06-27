const exoress = require("express");
const router = exoress.Router();
const schema = require("../validation/userValidation");
const log_schema = require("../validation/login_Validation");
const myconnections = require("../config/db_config");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const { sign, verify } = require("jsonwebtoken");
const { upload } = require("../multer/uploads");

let result;
let admin;

// '''''''''''''''''''''''''''''''''''''''🎃🎑Only For Users🙄😋''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
// User Registard Routers.................
router.get("/reg", sessionChecker, (req, res) => {
  res.render("index");
});

router.post("/reg", sessionChecker, (req, res) => {
  let salt = genSaltSync(10);
  const { value, error } = schema.validate(req.body, { abortEarly: false });
  let first_name = value.First_name;
  let last_name = value.Last_name;

  // Extract Date From Date & Time
  let dateTime = value.dob;
  let dob;
  dob = dateTime.toLocaleDateString("es-CL");

  let email_id = value.email_id;
  let password = hashSync(value.conforn_passwords, salt);
  let username = value.First_name + " " + value.Last_name;

  if (error) {
    return res.render("index", { error });
  } else {
    if (!req.session.user) {
      myconnections.query(
        "INSERT INTO `registard_users`(`first_name`, `last_name`, `dob`, `email_id`, `passwords`) VALUES (?, ?, ?, ?, ?)",
        [first_name, last_name, dob, email_id, password],
        (err, results) => {
          let user_id = results.insertId;
          // console.log(user_id, 'reg user_id')
          if (err) {
            return res.render("index", { err });
          } else {
            (req.session.user = email_id),
              (req.session.name = username),
              (req.session.userId = user_id);
            let result = {
              user_id: user_id,
              email_id: email_id,
              username: username,
            };
            let jsonwebtoken = sign(
              { result: result },
              process.env.JWT_SECRET,
              {
                expiresIn: process.env.JWT_EXPAIRED,
              }
            );
            res.cookie("token", jsonwebtoken, {
              httpOnly: true,
              secure: true,
            });
            return res.redirect("/dashboard");
          }
        }
      );
    }
  }
});
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------
// User Login Routers..............
router.get("/login", sessionChecker, (req, res) => {
  res.render("login");
});

router.post("/login", sessionChecker, (req, res) => {
  const { value, error } = log_schema.validate(req.body, { abortEarly: true });
  let email = value.log_email;
  if (error) {
    error.details.forEach((e) => {
      req.flash('errors', `${e.message}`);
      req.flash('titles', 'Vlidation Errors !');
    });
    return res.status(406).redirect("/login");
  } else {
    myconnections.query(
      "SELECT registard_users.*,roles.* FROM registard_users JOIN roles ON registard_users.id = roles.user_id WHERE registard_users.email_id =?",
      [email],
      (err, result) => {
        if (err) {
          req.flash('errors', `${err.sqlMessage}`);
          req.flash('titles', 'Mysql Errors !');
          return res.status(400).redirect("/login");
        }
        if (!result[0]) {
          req.flash('errors', 'Login falied ! Email Id Is Not Registard');
          req.flash('titles', 'Oops Something Worng !');
          return res.redirect("/login");
        } else {
          if (result[0].role === "Admin") { // Check Admin Or Not
            req.flash('errors', 'You are Admin, Go to Admin Login Page');
            req.flash('titles', 'Oops Something Worng !');
            return res.status(500).redirect('/login')
          } else {
            let validUser = compareSync(value.log_passwords,result[0].passwords);
            if (validUser) {
              let username = result[0].first_name + " " + result[0].last_name;
              (req.session.user = email), (req.session.name = username);
              req.session.userId = result[0].user_id;
              let jsonwebtoken = sign({ result: result[0] },process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPAIRED,});
              res.cookie("token", jsonwebtoken, {
                httpOnly: true,
                secure: true,
              });
              req.flash('sucess', 'Welcome Back To Dashboard');
              return res.redirect("/dashboard");
            } else {
              req.flash('errors', 'Invalid Username or Passwords');
              req.flash('titles', 'Oops Something Worng !');
              return res.redirect("/login");
            }
          }
        }
      }
    );
  }
});

//=================================================================================================================================================================
// User Dashboard Routers.............
router.get("/dashboard", authanticateUser, tokenAuthenticate, (req, res) => {
  let sql = "SELECT registard_users.first_name, registard_users.last_name, GROUP_CONCAT(user_transection_details.descriptions)AS descriptions,transections_done.total_amount, GROUP_CONCAT(user_transection_details.amounts)AS amounts, transections_done.payments_date, transections_done.created_at, current_status.statuses FROM registard_users JOIN transections_done ON registard_users.id = transections_done.user_id JOIN user_transection_details ON user_transection_details.transection_id = transections_done.id JOIN current_status ON transections_done.current_status_id = current_status.id WHERE registard_users.id =? GROUP BY transections_done.created_at";
    myconnections.query(sql,[req.session.userId],(err,result5)=>{
      console.log(result5)
      result5.forEach((e)=>{
        console.log(e.created_at)
      })
      if (err) {
        console.log(err);
        throw err;
      }else{
        res.render("dashboard", {
          username: req.session.name,
          userId: req.session.userId,
          result5
        });
      }
    })
});
//=================================================================================================================================================================
// Users Profile Update section .................
router.get("/profile_update/:id",authanticateUser,tokenAuthenticate,(req, res) => {
  myconnections.query(
    "SELECT registard_users.*, profile_images.*, roles.role FROM registard_users LEFT JOIN profile_images ON registard_users.id = profile_images.user_id LEFT JOIN roles ON registard_users.id = roles.user_id WHERE registard_users.id =?",
    [req.params.id],
    (err, results) => {
      if (err) {
        req.flash('errors', `${err.sqlMessage}`);
        req.flash('titles', 'Mysql Errors !');
        return res.status(406).redirect("/dashboard");
      } else {
        result = results;
        // console.log(result, '2')
        return res.render("profilePic", {
          result,
          userId: req.session.userId,
          username: req.session.name,
        });
      }
    }
  );
}
);

// User Profile Update Sections.....................
router.post("/profile_update/:id",authanticateUser, tokenAuthenticate, upload.single("file"), async (req, res) => {
  //Req.body Part
  let userid = req.params.id;
  let first_name = req.body.First_name;
  let Last_name = req.body.Last_name;
  let dob = req.body.dob;
  let email_id = req.body.email_id;

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
      myconnections.query(
        "SELECT * FROM `profile_images` WHERE user_id =?",
        [req.params.id],
        (err, results) => {
          if (err) {
            req.flash('errors', `${err.sqlMessage}`);
            req.flash('titles', 'Mysql Errors !');
            return res.status(400).redirect("/dashboard");
          }
          if (!results[0]) {
            myconnections.query(
              "INSERT INTO `profile_images`(`user_id`, `file_name`, `file_type`, `file_size`, `file_locations`, `file_path`) VALUES (?, ?, ?, ?, ?, ?)",
              [userid, file_name, file_type, file, file_locations, file_path],
              (err, response) => {
                if (err) {
                  req.flash('errors', `${err.sqlMessage}`);
                  req.flash('titles', 'Mysql Errors !');
                  return res.status(406).redirect("/dashboard");
                } else {
                  if (response) {
                    myconnections.query(
                      "UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?",
                      [first_name, Last_name, dob, email_id, userid],
                      (err, response) => {
                        if (err) {
                          console.log(err)
                        } else {
                          req.flash('sucess', 'Profile Updated Sucessfully');
                          req.flash('titles', 'Hurry !');
                          req.session.name = req.body.First_name + " " + req.body.Last_name;
                          return res.redirect("/dashboard");
                        }
                      }
                    );
                  }
                }
              }
            );
          } else {
            myconnections.query(
              "UPDATE `profile_images` SET `file_name`=?,`file_type`=?,`file_size`=?,`file_locations`=?,`file_path`=?,`updated_at`=CURRENT_TIMESTAMP WHERE user_id =?",
              [file_name, file_type, file, file_locations, file_path, userid],
              (err, results) => {
                if (err) {
                  console.log(err);
                  throw err;
                } else {
                  if (results) {
                    myconnections.query(
                      "UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?",
                      [first_name, Last_name, dob, email_id, userid],
                      (err, response) => {
                        if (err) {
                          console.log(err);
                        } else {
                          req.session.name = req.body.First_name + " " + req.body.Last_name;
                          req.flash('sucess', 'Profile Updated Sucessfully');
                          req.flash('titles', 'Hurry !');
                          return res.redirect("/dashboard");
                        }
                      }
                    );
                  }
                }
              }
            );
          }
        }
      );
    } catch (error) {
      console.log(error);
      req.flash('errors', 'Request Not Complete');
      req.flash('titles', 'Something Worng !');
      return res.status(406).redirect("/dashboard");
    }
    // Check If User Pass Images And User Details At a Time
  } else {
    try {
      // console.log('update')
      myconnections.query(
        "UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?",
        [first_name, Last_name, dob, email_id, userid],
        (err, response) => {
          if (err) {
            console.log(err);
            throw err;
          } else {
            req.flash('sucess', 'Profile Updated Sucessfully');
            req.flash('titles', 'Hurry !');
            req.session.name = req.body.First_name + " " + req.body.Last_name;
            return res.redirect("/dashboard");
          }
        }
      );
    } catch (error) {
      console.log(error);
      req.flash('errors', 'Request Not Complete');
      req.flash('titles', 'Something Worng !');
      return res.status(406).redirect("/dashboard");
    }
  }
}
);
//=================================================================================================================================================================

// Add Request By User........................
router.get('/add_request',authanticateUser,tokenAuthenticate,(req,res)=>{
  res.render('addRequest',{
    username: req.session.name,
    userId: req.session.userId,
  });
})

router.post('/add_request',authanticateUser,tokenAuthenticate,(req,res)=>{
  let options = req.body.options;
  let descriptions = req.body.descriptions;
  let amounts = req.body.amounts;
  let Payments_date = req.body.Payment_date;

if (Array.isArray(options)) {
  const data = [];

  for (let i = 0; i < descriptions.length; i++) {
    const item = {
      descriptions: descriptions[i],
      amount: amounts[i],
      Payment_date: Payments_date[i],
      options: options[i]
    };
    data.push(item);
  }
  const totals = amounts.reduce((total, amount) => total + parseInt(amount), 0);
  let pay_date = data[0].Payment_date;
  let types = data[0].options

//   console.log(payment_date, types)
// return false;
  let sql1 = "INSERT INTO `current_status`(`user_id`, `statuses`) VALUES (?, ?)";
  myconnections.query(sql1,[req.session.userId, "pending"],(err,result1)=>{
    let current_status_id = result1.insertId;
    if (err) {
      req.flash('errors', `${err.sqlMessage}`);
      req.flash('titles', 'Mysql Errors !');
      return res.status(400).redirect('/add_request');
    } else {
      if (data.length > 0) {
      let sql2 = "INSERT INTO `transections_done`(`user_id`, `total_amount`, `types`, `payments_date`, `current_status_id`) VALUES (?, ?, ?, ?, ?)"; 
      myconnections.query(sql2,[req.session.userId, totals, types, pay_date, current_status_id],(err,result2)=>{
        let transection_id = result2.insertId;
        console.log(result2, 'transection_done')
        if (err) {
          console.log(err)
          throw err;
        } else {
          if (data.length > 0) {
            let sql3 = "INSERT INTO `user_transection_details`(`user_id`, `transection_id`, `descriptions`, `amounts`) VALUES ?";
            let dataArry = []
            data.forEach(function(e,i){
            dataArry[i]= [req.session.userId, transection_id, e.descriptions, e.amount]})
            myconnections.query(sql3,[dataArry],(err,result)=>{
              if (err) {
                console.log(err);
                throw err;
              } else {
                req.flash('sucess', 'Your request has been Submitted Successfully');
                req.flash('titles', 'Hurry !');
                return res.status(200).redirect('/add_request');
              }
            })
          } 
        }
      })
      }  
    }
  });
  

 
} else {
  return false;
  let sql1 = "INSERT INTO `current_status`(`user_id`, `statuses`) VALUES (?, ?)";
  myconnections.query(sql1,[req.session.userId, "pending"],(err,result1)=>{
    let current_status_id = result1.insertId;
    if (err) {
      req.flash('errors', `${err.sqlMessage}`);
      req.flash('titles', 'Mysql Errors !');
      return res.status(400).redirect('/add_request');
    } else {
      if (result1) {
      let sql2 = "INSERT INTO `transections_done`(`user_id`, `total_amount`, `types`, `payments_date`, `current_status_id`) VALUES (?, ?, ?, ?, ?)"; 
      myconnections.query(sql2,[req.session.userId, amounts, options, Payment_date, current_status_id],(err,result2)=>{
        let transection_id = result2.insertId;
        if (err) {
          console.log(err)
          throw err;
        } else {
          if (result2) {
            let sql3 = "INSERT INTO `user_transection_details`(`user_id`, `transection_id`, `descriptions`, `amounts`) VALUES (?, ?, ?, ?)";
            myconnections.query(sql3,[req.session.userId, transection_id, descriptions, amounts ],(err,result)=>{
              if (err) {
                console.log(err);
                throw err;
              } else {
                req.flash('sucess', 'Your request has been Submitted Successfully');
                req.flash('titles', 'Hurry !');
                return res.status(200).redirect('/add_request');
              }
            })
          } 
        }
      })
      }  
    }
  });
};
  
});


// User Logout Section.....................................
router.post("/logout", authanticateUser, (req, res) => {
  if (req.session.user) {
    req.session.destroy();
    res.clearCookie();
    res.cookie("token", "", { maxAge: 1 });
    return res.redirect("/login");
  } else {
    res.render("dashboard");
  }
});

//=================================================================================================================================================================

//""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""ADMIN PANEL"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

// Admin Login Section ............................
router.get('/admin/login',sessionChecker,(req,res)=>{
  res.render('Admin/adminLogin');
})

router.post('/admin/login',sessionChecker,(req,res)=>{
  const { value, error } = log_schema.validate(req.body, { abortEarly: true });
  let email = value.log_email;
  if (error) {
    error.details.forEach((e) => {
      req.flash('errors', `${e.message}`);
      req.flash('titles', 'Vlidation Errors !');
    });
    return res.status(406).redirect("/admin/login");
  } else {
    myconnections.query(
      "SELECT registard_users.*,roles.* FROM registard_users JOIN roles ON registard_users.id = roles.user_id WHERE registard_users.email_id =?",
      [email],
      (err, result) => {
        if (err) {
          req.flash('errors', `${err.sqlMessage}`);
          req.flash('titles', 'Mysql Errors !');
          return res.status(400).redirect("/admin/login");
        }
        if (!result[0]) {
          req.flash('errors', 'Login falied ! Email Id Is Not Registard');
          req.flash('titles', 'Oops Something Worng !');
          return res.redirect("/admin/login");
        } else {
          if (result[0].role === "Admin") { // Check Admin Or Not
            let validadmin = compareSync(value.log_passwords, result[0].passwords);
            if (validadmin) {
              let username = result[0].first_name + " " + result[0].last_name;
              (req.session.admin = email), (req.session.name = username);
              req.session.userId = result[0].user_id;
              let jsonwebtoken = sign({ result: result[0] },process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPAIRED,});
              res.cookie("AdminToken", jsonwebtoken, {
                httpOnly: true,
                secure: true,
              });
              req.flash('sucess', `Welcome to Admin Panel`);
              return res.redirect("/admindashboard");
            } else {
              req.flash('errors', 'Invalid Passwords, Please Try Again');
              req.flash('titles', 'Oops Something Worng !');
              return res.redirect("/admin/login");
            }
          } else {
            req.flash('errors', 'You are Not Admin ! Go to User login Page');
            req.flash('titles', 'Oops Something Worng !');
            return res.redirect("/admin/login");
          }
        }
      }
    );
  }
})

// Admin Dashboard Router ....................
router.get("/admindashboard", authanticateAdmin, adminChecker, (req, res) => {
  myconnections.query(
    "SELECT registard_users.id,registard_users.first_name, registard_users.last_name, registard_users.dob, registard_users.email_id, roles.role FROM registard_users LEFT JOIN roles ON registard_users.id = roles.user_id",
    (err, response) => {
      if (err) throw err;
      // console.log(response)
      res.render("Admin/admindashboard", {
        username: req.session.name,
        userId: req.session.userId,
        response,
      });
    }
  );
});
//=================================================================================================================================================================

// Admin Profile Update Section...................
router.get("/adminProfile/:id",authanticateAdmin, adminChecker, (req, res) => {
  myconnections.query("SELECT registard_users.*, profile_images.*, roles.role FROM registard_users LEFT JOIN profile_images ON registard_users.id = profile_images.user_id LEFT JOIN roles ON registard_users.id = roles.user_id WHERE registard_users.id =?",[req.params.id],(err,results)=>{
    if (err) {
      req.flash('errors', `${err.sqlMessage}`);
      req.flash('titles', 'Mysql Errors !');
      return res.status(406).redirect("/admindashboard");
    } else {
      // console.log(result, '2')
      return res.render("Admin/adminProfile", {
        results,
        userId: req.session.userId,
        username: req.session.name,
      });
    }
  })
});

router.post('/adminProfile/update/:id',authanticateAdmin,adminChecker,upload.single("file"),async(req,res)=>{
  let userid = req.params.id;
    let first_name = req.body.First_name;
    let Last_name = req.body.Last_name;
    let dob = req.body.dob;
    let email_id = req.body.email_id;
// For Images 
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
        myconnections.query(
          "SELECT * FROM `profile_images` WHERE user_id =?",
          [req.params.id],
          (err, results) => {
            if (err) {
              req.flash('errors', `${err.sqlMessage}`);
              req.flash('titles', 'Mysql Errors !');
              return res.status(400).redirect("/admindashboard");
            }
            if (!results[0]) {
              myconnections.query(
                "INSERT INTO `profile_images`(`user_id`, `file_name`, `file_type`, `file_size`, `file_locations`, `file_path`) VALUES (?, ?, ?, ?, ?, ?)",
                [userid, file_name, file_type, file, file_locations, file_path],
                (err, response) => {
                  if (err) {
                    req.flash('errors', `${err.sqlMessage}`);
                    req.flash('titles', 'Mysql Errors !');
                    return res.status(406).redirect("/admindashboard");
                  } else {
                    if (response) {
                      myconnections.query(
                        "UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?",
                        [first_name, Last_name, dob, email_id, userid],
                        (err, response) => {
                          if (err) {
                            console.log(err)
                          } else {
                            req.flash('sucess', 'Profile Updated Sucessfully');
                            req.flash('titles', 'Hurry !');
                            req.session.name = req.body.First_name + " " + req.body.Last_name;
                            return res.redirect("/admindashboard");
                          }
                        }
                      );
                    }
                  }
                }
              );
            } else {
              myconnections.query(
                "UPDATE `profile_images` SET `file_name`=?,`file_type`=?,`file_size`=?,`file_locations`=?,`file_path`=?,`updated_at`=CURRENT_TIMESTAMP WHERE user_id =?",
                [file_name, file_type, file, file_locations, file_path, userid],
                (err, results) => {
                  if (err) {
                    console.log(err);
                    throw err;
                  } else {
                    if (results) {
                      myconnections.query(
                        "UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?",
                        [first_name, Last_name, dob, email_id, userid],
                        (err, response) => {
                          if (err) {
                            console.log(err);
                          } else {
                            req.session.name = req.body.First_name + " " + req.body.Last_name;
                            req.flash('sucess', 'Profile Updated Sucessfully');
                            req.flash('titles', 'Hurry !');
                            return res.redirect("/admindashboard");
                          }
                        }
                      );
                    }
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        console.log(error);
        req.flash('errors', 'Request Not Complete');
        req.flash('titles', 'Something Worng !');
        return res.status(406).redirect("/admindashboard");
      }
      // Check If User Pass Images And User Details At a Time
    } else {
      try {
        // Only For Req.body Update
        myconnections.query(
          "UPDATE `registard_users` SET `first_name`=?,`last_name`=?,`dob`=?,`email_id`=?, `updated_at`=CURRENT_TIMESTAMP WHERE id =?",
          [first_name, Last_name, dob, email_id, userid],
          (err, response) => {
            if (err) {
              console.log(err);
              throw err;
            } else {
              req.flash('sucess', 'Profile Updated Sucessfully');
              req.flash('titles', 'Hurry !');
              req.session.name = req.body.First_name + " " + req.body.Last_name;
              return res.redirect("/admindashboard");
            }
          }
        );
      } catch (error) {
        console.log(error);
        req.flash('errors', 'Request Not Complete');
        req.flash('titles', 'Something Worng !');
        return res.status(406).redirect("/admindashboard");
      }
    }
})
//=================================================================================================================================================================

//Admin get Will edit Role Of Any Existing User In database
router.get("/user/edit/:id", authanticateAdmin,adminChecker,(req, res) => {
  myconnections.query(
    "SELECT registard_users.*, profile_images.*, roles.role FROM registard_users LEFT JOIN profile_images ON registard_users.id = profile_images.user_id LEFT JOIN roles ON registard_users.id = roles.user_id WHERE registard_users.id =?",
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(406).redirect("/admindashboard");
      } else {
        admin = results;
        // console.log(admin, 'from Admin')
        return res.render("Admin/adminupdate_Userprofile", {
          admin,
          id : req.params.id,
          username: req.session.name,
        });
      }
    }
  );
});

router.post("/user/edit/:id", authanticateAdmin,adminChecker,(req, res) => {
  let role = req.body.role;
  let userid = req.params.id

  myconnections.query("SELECT * FROM `roles` WHERE user_id = ?", [req.params.id],(err,results)=>{
    if(err) throw err;
    if (!results[0]) {
      myconnections.query('INSERT INTO `roles`(`user_id`, `role`) VALUES (?, ?)', [userid, role],(err,result)=>{
        if(err) {
          return res.render('Admin/adminupdate_Userprofile', {err});
        }else{
          return res.status(200).redirect('/admindashboard');
        }
      })
    }else{
        myconnections.query('UPDATE `roles` SET `role`=?, `updated_at`=CURRENT_TIMESTAMP WHERE user_id = ?',[role, userid], (err,response)=>{
          if (err) {
            console.log(err)
            return res.redirect('/admindashboard')
          } else {
            return res.status(200).redirect('/admindashboard'); 
          }
        })
    }
  })
});

//=================================================================================================================================================================

//Admin Logout Section......................................
router.post("/admin/logout", authanticateAdmin, (req, res) => {
  if (req.session.admin) {
    req.session.destroy();
    res.clearCookie();
    res.cookie("AdminToken", "", { maxAge: 1 });
    return res.redirect("/admin/login");
  } else {
   return res.redirect("/admindashboard");
  }
});

//=================================================================================END===============================================================================

// Change Password Sections ................
router.get("/changePassword", (req, res) => {
  return res.render("changePassword");
});

//==========================================================================All Middlewars=========================================================================

function sessionChecker(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  } else if (req.session.admin){
    return res.redirect("/admindashboard");
  }else {
    next();
  }
};

function authanticateUser(req, res, next) {
  if (!req.session.user) {
    req.flash('errors', 'Your Session Has Expaired, Please Login Again');
    req.flash('titles', 'Session Timeout !');
    return res.redirect("/login");
  } else {
    next();
  }
};

function tokenAuthenticate(req, res, next) {
  let token = req.cookies.token;
  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (decoded) {
        // console.log(decoded)
        req.session.name;
        req.session.userId = decoded.result.user_id;
        next();
      } else {
        req.flash('errors', 'Please Cheack And Try Again');
        req.flash('titles', 'Unauthorized User !');
        return res.redirect("/login");
      }
    });
  } else {
    req.flash('errors', 'No Tokens Has Found');
    req.flash('titles', 'Authentication Error !');
    return res.redirect("/login");
  }
}

function authanticateAdmin(req, res, next) {
  if (!req.session.admin) {
    req.flash('errors', 'Your Session Has Expaired, Please Login Again');
    req.flash('titles', 'Session Timeout !');
    return res.redirect("/admin/login");
  } else {
    next();
  }
};

function adminChecker(req, res, next) {
  let token = req.cookies.AdminToken;
  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (decoded.result.role === "Admin") {
        // console.log(decoded)
        req.session.name;
        req.session.userId = decoded.result.user_id;
        next();
      } else {
        console.log("Unauthorized ! You Are Not Admin");
        req.flash('errors', 'You Are Not Admin to Access Admin Panel');
        req.flash('titles', 'Unauthorized !');
        return res.redirect("/login");
      }
    });
  } else {
    res.clearCookie();
    res.cookie("token", "", { maxAge: 1 });
    req.flash('errors', 'No Tokens Has Found');
    req.flash('titles', 'Authentication Error !');
    return res.redirect("/login");
  }
}

module.exports = router;
