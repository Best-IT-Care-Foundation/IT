const express = require("express");
const app = express();
const http = require("http");
const port = 3000 || process.env.PORT;
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
var loginid;
var isAdmin = false;
var SuccessOrder = 0;
var PendingOrder = 0;
var EjectOrder = 0;
var loginname;
var arrayofname = [];
var arrayofID = [];
io.on("connection", (socket) => {
  console.log("New WebSocket Connection");
  socket.emit("message", "welcome to message box");
  socket.broadcast.emit("message", "A new user joined");
  socket.on("disconnect", () => {
    io.emit("message", "Person left the chat");
  });
  socket.on("chat", (data) => {
    io.sockets.emit("chat", data);
  });
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });
});
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/BIC", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const registerScema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const order = mongoose.Schema({
  pending: {
    type: String,
  },
  id_Number: {
    type: String,
  },
  Eject: {
    type: String,
  },
  complete: {
    type: String,
  },
  order_name: {
    type: String,
  },
});
const usr = mongoose.model("data", registerScema);
const odr = mongoose.model("order", order);
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Public/index.html");
});
app.get("/admin0", (req, res) => {
  res.render('form');
});
app.post("/admin0",(req,res)=>{
if (
  req.body.email === "bestitcareint@gmail.com" ||
  req.body.password === "Bangladesh1"
) {
  isAdmin = true;
  arrayofname = [];
      arrayofID = [];
      odr.find({ pending: "true" }, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          for (var i = 0; i < data.length; i++) {
            arrayofname.push(data[i].order_name);
            arrayofID.push(data[i].id);
          }
        }
      });
      res.redirect("/admin");
}
})
app.get("/admin", (req, res) => {
  if(isAdmin === false){
    res.redirect('/admin0')
  }
  else{
    res.render("admin", { test: arrayofID, test2: arrayofname });
  }
});
app.post("/admin", (req, res) => {
  res.redirect("/admin0");
  if (req.body.service == "Completed") {
    odr.updateOne(
      { _id: req.body.id },
      { pending: false, complete: true },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully updated data");
        }
      }
    );
  }
  if (req.body.service == "Pending") {
    odr.updateOne(
      { _id: req.body.id },
      { pending: true, complete: false },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully updated data");
        }
      }
    );
  }
  if (req.body.service == "Eject") {
    odr.updateOne(
      { _id: req.body.id },
      { pending: false, complete: false, Eject: true },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully updated data");
        }
      }
    );
  }
});

app.get("/profile/:id", (req, res) => {
  if (loginid == undefined) {
    res.redirect("/Form/Form.html");
  } else {
    res.render("index", { test: loginname });
  }
});
app.get("/index.ejs", (req, res) => {
  if (loginid == undefined) {
    res.redirect("/Form/Form.html");
  } else {
    res.render("index", { test: loginname });
  }
});
app.get("/order.ejs", (req, res) => {
  if (loginid == undefined) {
    res.redirect("/Form/Form.html");
  } else {
    res.render("order", {
      test: loginname,
      test0: SuccessOrder,
      test1: PendingOrder,
      test2: EjectOrder,
    });
  }
});
app.post("/order.ejs", (req, res) => {
  const add_ordr = new odr({
    pending: "true",
    complete: "false",
    id_Number: loginid,
    Eject: "false",
    order_name: req.body.service,
  });
  add_ordr.save();
  res.redirect("/order.ejs");
});
app.get("/Message.ejs", (req, res) => {
  if (loginid == undefined) {
    res.redirect("/Form/Form.html");
  } else {
    res.render("Message", { test: loginname });
  }
});
app.get("/setting.ejs", (req, res) => {
  if (loginid == undefined) {
    res.redirect("/Form/Form.html");
  } else {
    res.render("Setting", { test: loginname });
  }
});
app.post("/setting.ejs", (req, res) => {
  const changeName = req.body.CN;
  const changeEmail = req.body.CE;
  const changePassword = req.body.CP;
  if (req.body.CE !== undefined) {
    usr.updateOne({ _id: loginid }, { email: changeEmail }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully updated data");
      }
    });
  }
  if (req.body.CN !== undefined) {
    usr.updateOne({ _id: loginid }, { name: changeName }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully updated data");
      }
    });
  }
  if (req.body.CP !== undefined) {
    usr.updateOne({ _id: loginid }, { password: changePassword }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully updated data");
      }
    });
  }
  res.send("setting.ejs");
});
app.post("/Form/Form.html", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;
  usr.findOne(
    {
      email: email,
      password: pass,
    },
    (err, data) => {
      if (err) {
        return res.sendFile(__dirname + "/Public/Form/error.html");
      }
      if (!data) {
        return res.sendFile(__dirname + "/Public/Form/error.html");
      } else {
        res.redirect(`/profile/${data.id}`);
        loginid = data.id;
        loginname = data.name;

        odr.find({ id_Number: loginid, pending: true }, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            for (var i = 0; i < data.length; i++) {
              PendingOrder = data.length;
            }
          }
        });
        odr.find({ id_Number: loginid, complete: true }, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            for (var i = 0; i < data.length; i++) {
              SuccessOrder = data.length;
            }
          }
        });
        odr.find({ id_Number: loginid, Eject: true }, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            for (var i = 0; i < data.length; i++) {
              EjectOrder = data.length;
            }
          }
        });
      }
    }
  );
});
app.post("/Form/SignUP.html", (req, res) => {
  const email = req.body.email;
  const pass = req.body.pass;
  const name = req.body.name;
  const password = req.body.password;
  if (pass === password) {
    const data = new usr({
      name: name,
      email: email,
      password: pass,
    });
    data.save();
  }
  res.redirect("/Form/Form.html");
});
app.post("/Form/forgetpassword.html", (req, res) => {});
server.listen(port);
