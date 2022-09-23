const express = require("express");
const bodyParser = require("body-parser");
const {
  default: mongoose
} = require("mongoose");
const _ = require("lodash");

const secrets = require('./secrets.js');
const username = secrets.username;
const password = secrets.password;
const dbName = secrets.DBname;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const uri = 'mongodb+srv://' + username + ':' + password + '@0selflearningnodejs.fyag25c.mongodb.net/' + dbName + '?retryWrites=true&w=majority'
mongoose.connect(uri);

const itemsSchema = mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Learning nodeJS"
});

const item2 = new Item({
  name: "Learning search Algorithms and Data Structure"
});

const item3 = new Item({
  name: "Doing last semester project with TH"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) { // if foundItems is empty then insert default items
        Item.insertMany(defaultItems, (err) => { // and redirect back to "/"
          if (err) {
            console.log(err);
          } else {
            res.redirect("/");
          }
        })
      } else { // else if foundItems is not empty then render "/" or list.ejs
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
      }
    }
  });



});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList)=> {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName)
    });
  }


});

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.id;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},                                 // which list?
      {$pull: {items: {_id: checkedItemID}}},           // what array from list? -> items. Pull what id from that array? -> checkedItemID. pull aka remove
      (err, foundList)=>{
        if(!err){
          res.redirect("/" + listName);
        }
      }
    );
  }

});

app.get("/:customListName", function(req, res, next) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (foundList) {
      // show exsiting list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    } else if (customListName == "Favicon.ico") {
      // skip favicon auto request
    } else {
      // create a new list
      const list = new List({
        name: customListName,
        items: []
      });
      list.save();
      res.redirect("/" + customListName);
    }
  });
});

// app.get("/about", function(req, res){
//   res.render("about");
// });
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};

app.listen(process.env.PORT || 3000, function() {
  console.log("Server has started successfully");
});
