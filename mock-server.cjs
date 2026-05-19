const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('jsonwebtoken');

// Configuration
const port = 3000;
const app = express();

const generateToken = (user) => {
  return jwt.sign(user, 'secret');
}

// Middleware
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username == "admin" && password == "password") {
    const user = {
      username: "admin",
      role: "admin",
      first_name: "User",
      last_name: "Example"
    }

    res.json({
      token: generateToken(user),
      user: user
    });
  } else {
    res.status(422).json({
      username: ["invalid"],
      password: ["invalid"]
    });
  }
});

// Run the server application
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
