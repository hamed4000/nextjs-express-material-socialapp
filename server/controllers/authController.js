const mongoose = require("mongoose");
const User = mongoose.model("User");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

exports.userValidationRules = () => {
  return [
    // Name is non-null and is 4 to 10 characters
    body("name", "Enter a name").notEmpty(),
    body("name", "Name must be between 4 and 10 characters").isLength({
      min: 4,
      max: 10
    }),
    // Email is non-null, valid, and normalized
    body("email", "Enter a valid email")
      .isEmail()
      .normalizeEmail(),
    // Password must be non-null, between 4 and 10 characters
    body("password", "Enter a password").notEmpty(),
    body("password", "Password must be between 4 and 10 characters").isLength({
      min: 6
    })
  ];
};

exports.validate = (req, res, next) => {
  const myValidationResult = validationResult.withDefaults({
    formatter: error => {
      return {
        message: error.msg
      };
    }
  });

  const errors = myValidationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(422).json(...errors.array({ onlyFirstError: true }));
};

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await new User({ name, email, password });
  await User.register(user, password, (err, user) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(user.name);
  });
};

exports.signin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json(err.message);
    }
    if (!user) {
      return res.status(400).json(info.message);
    }

    req.logIn(user, err => {
      if (err) {
        return res.status(500).json(err.message);
      }

      res.json(user);
    });
  })(req, res, next);
};

exports.signout = (req, res) => {
  res.clearCookie("next-cookie.sid");
  req.logout();
  res.json({ message: "You are now signed out!" });
};

exports.checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/signin");
};
