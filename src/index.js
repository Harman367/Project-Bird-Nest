//Imports
import "dotenv/config";
import express from "express";
import { getIntruders } from "./api.js";

//Initialize App
const app = express();

//Set Port
app.set("port", 3000);

//Set up static folder.
app.use(express.static("src/client/public"));

//Setup views folder.
app.set("views", "src/client/views");

//Set up view engine.
app.set("view engine", "ejs");

//Root route.
app.get("/", async (_, res) => {
  res.render("index");
});

//API route.
app.get("/api/intruders", async (_, res) => {
  try {
    //Get data from db.
    const data = await getIntruders();
    res.json(data);
  } catch (error) {
    console.log("index.js:" + error);
    res.json(error);
  }
});

//Listen on port.
app.listen(app.get("port"), () => console.log(`Listening...`));
