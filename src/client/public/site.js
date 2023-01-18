//Function to create item that displays the pilot information that violates the NDZ.
function createItem(intruder) {
  //Create item.
  const item = document.createElement("div");
  item.id = intruder.serialNumber;
  item.className = "Intruder";

  //Create the fields and fill the info.
  item.innerHTML = `
        <!--Serial Number-->
		<h3 class="Intruder__Serial">Serial Number: ${intruder.serialNumber}</h3>

        <!--Closest Distance-->
		<p>Closest Distance: ${intruder.distance} meters</p>

        <!--Name-->
		<p><strong>Name: ${intruder.firstName} ${intruder.lastName}</strong></p>

        <!--Phone Number-->
		<p>Phone: ${intruder.phoneNumber}</p>

        <!--Email-->
		<p>Email: ${intruder.email}</p>

        <!--Last update-->
		<p>Last updated at: ${intruder.lastUpdate}</p>
	`;
  return item;
}

//Function to refresh the list of pilot info without refreshing the view.
async function refreshList() {
  try {
    //Get data from db.
    const intruders = await fetch("/api/intruders").then((res) => res.json());

    //Load and clear list.
    const list = document.querySelector("#list");
    console.log(list);

    //Check response.
    if (!intruders.length) {
      list.innerHTML = "No data";
    } else {
      //Clear and repopulate list.
      list.innerHTML = "";

      intruders.forEach(async (intruder) => {
        list.prepend(createItem(intruder));
      });
    }
  } catch (error) {
    console.warn("site.js:", error);
  }
}

//Refresh the list in intervals.
window.onload = async () => {
  await refreshList();

  setInterval(async () => {
    await refreshList();
  }, 2000);
};
