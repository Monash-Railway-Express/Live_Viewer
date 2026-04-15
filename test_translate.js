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
import testCases from "./test_translate.json" with { type: "json" };

const casesContainer = document.querySelector("#cases");
for (const testCase of testCases) {
	const translationFields = ["Timestamp", "Function", "Node ID", "Node", "Data"];
	const [timestamp, id, dlc, ...data] = testCase.input.split(",");
	const translated = translate_row(timestamp, id, parseInt(dlc), data);
	let pass = true;
	for (const field of translationFields) {
		pass = pass && (translated[field] == testCase[field]);
	}
	
	const result = document.createElement("p");
	if (pass) {
		result.textContent = `Test case "${testCase.description}" PASSED.`;
	} else {
		result.style.border = "solid red";
		result.textContent = `Test case "${testCase.description}" FAILED.
		Test case: ${JSON.stringify(testCase)}
		Result: ${JSON.stringify(translated)}`;
	}
	casesContainer.appendChild(result);
}

document.querySelector("#row").addEventListener("input", (event) => {
	document.querySelector("#translation").textContent = "";
	for (const row of event.target.value.split("\n")) {
		const [timestamp, id, dlc, ...data] = row.split(",");
		document.querySelector("#translation").textContent += JSON.stringify(translate_row(timestamp, id, parseInt(dlc), data)) + "\n";
	}
});