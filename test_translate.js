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
	const [timestamp, id, dlc, ...data] = event.target.value.split(",");
	document.querySelector("#translation").textContent = JSON.stringify(translate_row(timestamp, id, parseInt(dlc), data));
});