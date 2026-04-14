/**
 * @file test_translate.js
 * @brief Script to display translation of CAN log row entered in input.
 * 
 * @author Nhan Nguyen
 * 
 * @date 04/04/2026
 * 
 * @version 1.0.0
 * 
 * @organisation MREX
 * 
 * @see test_translate.html
 */

import { translate_row } from "./translate_row.js";

// translate_row("");
document.querySelector("#row").addEventListener("input", (event) => {
	document.querySelector("#translation").textContent = "";
	for (const row of event.target.value.split("\n")) {
		const [timestamp, id, dlc, ...data] = row.split(",");
		document.querySelector("#translation").textContent += JSON.stringify(translate_row(timestamp, id, parseInt(dlc), data)) + "\n";
	}
});