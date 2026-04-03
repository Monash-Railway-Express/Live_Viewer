import { translate_row } from "./translate_row.js";

// translate_row("");
document.querySelector("#row").addEventListener("input", (event) => {
	const [timestamp, id, dlc, ...data] = event.target.value.split(",");
	document.querySelector("#translation").textContent = JSON.stringify(translate_row(timestamp, id, parseInt(dlc), data));
});