//Imports
import fetch from "node-fetch";
import { formatInTimeZone } from "date-fns-tz";
import { XMLParser } from "fast-xml-parser";
import CyclicDb from "@cyclic.sh/dynamodb";

const db = CyclicDb(process.env.DYNAMODB_TABLE);

//Setup
const TEN_MINUTES = 1000 * 60 * 10;
const collection = db.collection("intruders");
const parser = new XMLParser();

//Function to calculate distance to No Drone Zone (NDZ) Nest.
function distanceToNest(x, y) {
  const CENTER_X = 250000;
  const CENTER_Y = 250000;

  return Math.sqrt((x - CENTER_X) ** 2 + (y - CENTER_Y) ** 2);
}

//Function to check if coordinates are in the NDZ.
function isInNDZ(x, y) {
  return distanceToNest(x, y) < 100000;
}

//Export function to get pilot info.
export async function getPilot(serial) {
  //Get pilot info.
  const url = `http://assignments.reaktor.com/birdnest/pilots/` + serial;
  const pilot = await fetch(url).then((res) => res.json());
  const { firstName, lastName, email, phoneNumber } = pilot;

  //Select only necessary properties.
  return { firstName, lastName, email, phoneNumber };
}

//Export function to get drone and pilot that went into NDZ.
export async function getIntruders() {
  //Get drone info.
  const url = "http://assignments.reaktor.com/birdnest/drones";
  const xml = await fetch(url).then((res) => res.text());
  const data = parser.parse(xml);
  const drones = data.report.capture.drone;

  //Check each drone position.
  drones.forEach(async (drone) => {
    const { serialNumber, positionX: x, positionY: y } = drone;

    //Check if drone is in NDZ.
    if (isInNDZ(x, y)) {
      const pilot = await getPilot(serialNumber);

      //Insert newest data.
      //const lastUpdate = Date.now() + 7200000; //Host timezone is 2 hours behind.
      const lastUpdate = formatInTimeZone(
        new Date(),
        "Europe/Helsinki",
        "HH:mm:ss"
      );
      const distance = Math.round(distanceToNest(x, y) / 1000);

      const updatedData = {
        serialNumber,
        distance,
        ...pilot,
        lastUpdate,
      };

      //Insert data into db.
      await collection.set(serialNumber, updatedData);
    }
  });

  //Remove entries older than 10 minutes.
  const intruders = await collection.list();

  intruders.results.forEach(async (intruder) => {
    //Get time when entry was last updated.
    const date = new Date(intruder.props.updated);
    const ms = date.getTime();

    if (Date.now() - ms >= TEN_MINUTES) {
      await collection.delete(intruder.key);
    }
  });

  //Function that returns db data.
  async function getProps(res) {
    const test = await collection.get(res.key);
    return test.props;
  }

  const unresolved = intruders.results.map(getProps);
  //Wait till all promises are resolved.
  const results = await Promise.all(unresolved);

  return results;
}
