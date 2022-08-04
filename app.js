const aedes = require('aedes')();
const axios = require('axios');
const { constants } = require('buffer');
const server = require('net').createServer(aedes.handle);
const collect = require('collect.js');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

//file path 
let filePath = path.join(__dirname, 'data', 'foobar.json');

//audio interface channels
let audioChannels = [
  { id: 3, occupied: false },
  { id: 4, occupied: false },
  { id: 5, occupied: false },
  { id: 6, occupied: false },
  { id: 7, occupied: false },
  { id: 8, occupied: false },
];

//sip line status
let sipLineStatus = [
  { id: 3, Status: false },
  { id: 4, Status: false },
  { id: 5, Status: false },
  { id: 6, Status: false },
  { id: 7, Status: false },
  { id: 8, Status: false },
]

//max wait time
let maxWaitTime = 30000;

//mqtt configuration  
MQTT_Port = 1883
server.listen(MQTT_Port, function () {
  console.log('Aedes MQTT server started and listening on port ', MQTT_Port)
})

// emitted when a client connects to the broker
aedes.on('client', function (client) {
  console.log(`CLIENT_CONNECTED : MQTT Client ${(client ? client.id : client)} connected to aedes broker ${aedes.id}`)
})
// emitted when a client disconnects from the broker
aedes.on('clientDisconnect', function (client) {
  console.log(`CLIENT_DISCONNECTED : MQTT Client ${(client ? client.id : client)} disconnected from the aedes broker ${aedes.id}`)
})
// emitted when a client subscribes to a message topic
aedes.on('subscribe', function (subscriptions, client) {
  console.log(`TOPIC_SUBSCRIBED : MQTT Client ${(client ? client.id : client)} subscribed to topic: ${subscriptions.map(s => s.topic).join(',')} on aedes broker ${aedes.id}`)
})
// emitted when a client unsubscribes from a message topic
aedes.on('unsubscribe', function (subscriptions, client) {
  console.log(`TOPIC_UNSUBSCRIBED : MQTT Client ${(client ? client.id : client)} unsubscribed to topic: ${subscriptions.join(',')} from aedes broker ${aedes.id}`)
})
// emitted when a client publishes a message packet on the topic
aedes.on('publish', async function (packet, client) {
  if (client) {
    console.log(`MESSAGE_PUBLISHED : MQTT Client ${(client ? client.id : 'AEDES BROKER_' + aedes.id)} has published message "${packet.payload}" on ${packet.topic} to aedes broker ${aedes.id}`)
    if (packet.topic == "status" && packet.payload == "get") {
      console.log("generate sythetic dataset:");
      getData();
    } else if (packet.topic == "status" && packet.payload == "start") {
      console.log("load data and start:");
      startCall();
      waitAndCheck();
    } else if (packet.topic.includes('sip/')) {
      //sip client actions
      console.log(`${packet.topic} : ${packet.payload}`);
      let msg = bufferToJson(packet.payload).msg
      let number = bufferToJson(packet.payload).number
      console.log(packet.topic);
      await mqttAction(msg, number, packet.topic);
      console.log('something else');
    } else {
      //do something else
    }
  }
})



//get and generativeate json dataset of fake profiles
async function getData() {
  await axios
    .get('http://127.0.0.1:5000/')
    .then(res => {
      console.log(`statusCode: ${res.status}`);
      let data = res.data;
      console.log(data);
      try {
        fs.writeFileSync(filePath, JSON.stringify(data))
      } catch (err) {
        console.error(err)
      }
    })
    .catch(error => {
      console.error(error);
    });
}


//mqtt sip client actions
async function mqttAction(msg, number, topic) {
  let ch = topic.split('/')[1];
  if (msg == "bye") {
    console.log(`${topic} : end call ${ch} ${number}`);
    await mapChannels(ch, false);
    console.log(getAviableChannel());
    await publishChannelStatus();
  }
  if (msg == "answercall") {
    console.log(`${topic} : call answered ${number}`);
    mapChannels(ch, true);
    console.log(getAviableChannel());
    await publishChannelStatus();
  }
  if (msg == "endcall") {
    console.log(`${topic} : end call ${ch} ${number}`);
    mapChannels(ch, false);
    console.log(getAviableChannel());
    await publishChannelStatus();
  }
}

//publish to max
async function publishChannelStatus() {
  console.log(`publish channel status: ${getAviableChannel().true}`);
  aedes.publish({ topic: "status", payload: `${getAviableChannel().true}` });
}


//map channles to audio interfaces
function mapChannels(ch, status) {
  console.log(`map channel ${ch} to ${status}`);
  let id = ch - 3;
  sipLineStatus[id].Status = status;
  audioChannels[id].occupied = status;
  console.log(sipLineStatus);
  console.log(audioChannels);
}

//get aviable channels
function getAviableChannel() {
  let collection = collect(audioChannels);
  let groups = collection.mapToGroups((item, key) => [item.occupied, item.id]);
  return (groups.items);
}

//get aviable sip status
function getAviableSip() {
  let collection = collect(sipLineStatus);
  let groups = collection.mapToGroups((item, key) => [item.Status, item.id]);
  return (groups.items.false);
}

//wait and no answer then end call
function waitAndCheck() {
  let withoutAnswer = getAviableSip();
  //console.log(withoutAnswer);
  setTimeout(function () {
    let aviableSip = getAviableSip();
    if (aviableSip) {
      aviableSip.forEach((item, index) => {
        console.log(`end call ${item} `);
        let ch = `${item}`;
        endCall(item);
      });
    }
  }, maxWaitTime);
}

//buffer to json object
function bufferToJson(buffer) {
  let bufferPayload = Buffer.from(`${buffer} `);
  let jsonPayload = JSON.parse(bufferPayload);
  return jsonPayload;
}


//make call and check status code
function makeCall(ch, mobi) {
  let topic = `sip/${ch}`;
  let payload = {
    "msg": "call",
    "number": mobi
  }
  aedes.publish({ topic: topic, payload: JSON.stringify(payload) })
}

//end call and check status code
function endCall(ch) {
  let topic = `sip/${ch}`;
  let payload = `{ "msg": "bye","number":${ch} }`;
  aedes.publish({ topic: topic, payload: payload })
}


//get json dataset as js object
async function getDataObj() {
  try {
    const data = await fsPromises.readFile(filePath);
    const obj = JSON.parse(data);
    //console.log(obj)
    return obj;
  } catch (err) {
    console.log(err);
  }
}



//getAviableDataset dataset
function getAviableDataset(dataset) {
  let collection = collect(dataset);
  let groups = collection.mapToGroups((item, key) => [item.used, item.id]);
  return (groups.items.false);
}

//update dataset
function updateDataset(index, dataset) {
  dataset[index].used = true;
  try {
    fs.writeFileSync(filePath, JSON.stringify(dataset))
  } catch (err) {
    console.error(err)
  }
}


//start phone call action

async function startCall() {
  let dataset = await getDataObj();
  //console.log(dataset);
  aviableIndex = getAviableDataset(dataset);
  console.log(`avaliable sythetic data profiles index: ${aviableIndex} `);
  let aviableSip = getAviableSip();
  console.log(`avaliable sip lines: ${aviableSip} `);
  if (aviableIndex) {
    if (aviableSip) {
      aviableSip.forEach((item, index) => {
        let ch = item;
        let number = dataset[aviableIndex[index]].phone;
        updateDataset(aviableIndex[index], dataset);
        makeCall(ch, number);
        console.log(`make call ${ch} ${number} `);
      })
    } else {
      console.log(`no aviable sip lines, so do nothing`);
    }
  } else {
    console.log('no aviable dataset');
    await getData();
    startCall();
  }
}
