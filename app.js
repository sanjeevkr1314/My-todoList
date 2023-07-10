// jshint eversion6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// connect to mongodb database
mongoose
  .connect("mongodb+srv://sanjeevkr1314:test123@cluster0.3pxgnsr.mongodb.net/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`CONNECTED TO MONGO!`);
  })
  .catch((err) => {
    console.log(`OH NO! MONGO CONNECTION ERROR!`);
    console.log(err);
  });

// creating items schema
const itemSchema = new mongoose.Schema({
    name: String
});

// creating model
const Item = mongoose.model("Item", itemSchema);

// creating documents
const item1 = new Item({
    name: "Welcome to your todolist"
});
const item2 = new Item({
    name: "Hit the + button to add new item."
});
const item3 = new Item({
    name: "<--Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

// creating list schema
const listSchema = {
    name: String,
    items: [itemSchema]
};

// creating model
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    // find
    Item.find({}).then((foundItems) => {
        
        if(foundItems.length === 0){
            // Insert items into database
            Item.insertMany(defaultItems)
            .then(
                (success) => {
                    console.log("Successfully saved default items to DB");
                },
                (err) => {
                    console.log(err);
                }
            );
            res.redirect("/");
        }
        else{
            const day = date.getDate();
            res.render("list", {listTitle: day, newListItems: foundItems});
        }
    });
});

app.get("/:customListName", function(req, res){

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then(
        (value) =>{

            if(value!=null){
                // Show an existing list
                res.render("list", {listTitle: value.name, newListItems: value.items});
            }
            else{
                // Create a new list and save
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
        }
    );
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    const day = date.getDate();
    if(listName === day){
        item.save();
        console.log(item);
        res.redirect("/");
    }
    else{
        List.findOne({name: listName})
        .then(
            (value) =>{
                if(value!=null){
                    value.items.push(item);
                    value.save();
                    res.redirect("/" + listName);
                }
            }    
        )
    }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === date.getDate()){

        Item.findByIdAndRemove(checkedItemId)
        .then(
            (res) => {
                console.log("Deleted one item.");
            },
            (err) => {
                console.log(err);
            }
        );
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
        .then(
            (res) => {
                console.log("Deleted one item.");
            },
            (err) => {
                console.log(err);
            }
        );
        res.redirect("/" + listName);
    }
});


app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started at port 3000");
});