const express = require('express');
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'application.env') })  
const app = express();
const portNumber = process.argv[2] || 3000;
const bodyParser = require("body-parser");
const uri = `mongodb+srv://ama626:cmsc335Nelson@cluster0.zgryrpu.mongodb.net/`;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');


app.set("views", path.resolve(__dirname, "templates"));

app.set("view engine", "ejs");



app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + '/templates'));


async function newApplication(information){
  const newApplication = {name: information.name, temp: information.temperature, time: information.time};
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  try {
      await client.connect();
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApplication);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function clearCollection(){
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  try {
      await client.connect();
      const result = await client.db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .deleteMany({});
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function getTable(){
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  try {
      let information = "<h2> TABLE </h2> <table border='1'><tr><th>Name</th><th>Temperature</th><th>Time</th></tr>";
      await client.connect();
      const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
      if (cursor) {
          const result = await cursor.toArray();
          result.forEach((elem) => information+=`<tr><td>${elem.name}</td><td>${elem.temp}</td><td>${elem.time}</td></tr>`);
      }
      if (information === "<h2> TABLE </h2> <table border='1'><tr><th>Name</th><th>Temperature</th><th>Time</th></tr>"){
        return "";
      }
      return information + "</table>";
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function displayPreviousQueries(){
  document.querySelector("#displayTable").innerHTML = await getTable();
}

app.get("/", async (request, response) => { 
  table = await getTable();
  const variables = { table: table};
  response.render("main", variables);
});

app.get("/clear", async (request, response) => { 
  table = await clearCollection();
  const variables = { table: table };
  response.render("main", variables);
});

app.get("/input", async (request, response) => {
  response.render("input");
});

app.post("/input", async (request, response) => {
    const newApp = {city: request.body.name};
    const url = `http://api.weatherapi.com/v1/current.json?key=4dab0ce0c768448caf4141819240205&q=${newApp.city}`;
    const response2 = await fetch(url);
    const result = await response2.json();
    const name = result.location.name;
    const temp = result.current.temp_f;
    const time = result.location.localtime;
    const information = {name: name, temperature: temp, time: time};
    await newApplication(information);
    console.log(result);
    response.render("input");
});





app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
process.stdout.write("Stop to shutdown the server: ")
process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
	const dataInput = process.stdin.read();
	if (dataInput !== null) {
		const command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        } else {
			console.log(`Invalid command: ${command}`);
            process.stdout.write("Stop to shutdown the server: ")
            process.stdin.resume();
		}
    }
});


