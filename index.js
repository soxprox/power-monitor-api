const { WebSocketServer } = require('ws');
var express = require('express')
var bodyParser = require('body-parser')
const { MongoClient } = require('mongodb');
require('dotenv').config()
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = process.env.MONGO_DB_URL;
const client = new MongoClient(url);

// Database Name
const dbName = process.env.MONGO_DB_URL;

var app = express()

// create application/json parser
var jsonParser = bodyParser.json()

let pricePerKWH = 19.57
let kwh = 0;
let lastTime = 0;
let currentTime = 0;
let secondsDifference = 0;
//WS Server
const wss = new WebSocketServer({ port: process.env.WS_PORT });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });
  setInterval(() => {
    ws.send(kwh)
  },500)

});

const recordTime = async (time) => {
  lastTime = currentTime
  currentTime = time
  secondsDifference = (new Date(currentTime) - new Date(lastTime)) / 1000
  console.log("seconds Difference", secondsDifference)
  kwh = ((60 * 60) / secondsDifference) / 1000
}

app.get('/', (req, res) => {
  res.send(new Date() + " - API is up")
})

app.post('/pulse', jsonParser, async function (req, res) {
  if(req.headers.key == process.env.API_KEY) {
    console.log(req.body)
    await client.connect();
    console.log("Connected to MongoDB")
    const db = client.db(dbName);
    const event = db.collection('events');
    await event.insertOne({"datetime":req.body.eventtime})
    recordTime(req.body.eventtime)
    res.send("OK")
  } else {
    res.status(403).send('Not Authorized')
  }
})

console.log("Listening")
app.listen(process.env.API_PORT, '0.0.0.0')
