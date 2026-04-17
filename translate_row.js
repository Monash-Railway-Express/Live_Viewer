/**
 * @file translate_row.js
 * @brief Provides a translator for CAN MREx messages.
 * 
 * @details
 * Implementation depends on the CAN MREx specification as of 17/02/2026
 * https://github.com/Monash-Railway-Express/CAN_MREx
 * First implemented in Python for the MREx Dashboard.
 * Exposes a translator function.
 * TODO: update against sheet and add test cases.
 * 
 * @author Nhan Nguyen
 * 
 * @date 04/04/2026
 * 
 * @version 1.0.0
 * 
 * @organisation MREX
 * 
 * @see https://github.com/Monash-Railway-Express/MREx_Dashboard/blob/main/utils/translator.py
 */

import sheet from "./sheet.json" with { type: "json" };
import spec from "./spec.json" with { type: "json" };
import { decode_bytes } from "./decode_bytes.js";

const {
	emcy_message,
	object_dictionary,
	pdo_entries,
	node_name
} = sheet;

const {
	nmt_state,
	emcy_priority,
	emcy_type
} = spec;

/**
 * @brief Translate a CAN MREx message represented as a log row to plain English.
 * 
 * @param timestamp	Timestamp
 * @param id		COB-ID
 * @param dlc_int	Data length code as a number
 * @param data		Array of data bytes
 * 
 * @return An object with keys Timestamp, Function, Node ID, Node and Data.
 */
function translate_row(timestamp, id, dlc_int, data) {
	const translated = {
		"Timestamp": timestamp
	};

	const id_int = parseInt(id);

	data = data.slice(0, dlc_int);
	const data_int = data.map((datum) => {
		return parseInt(datum);
	});

	if (id_int === 0x000) {
		const nodeID = data_int[1];
		translated["Function"] = "NMT";
        translated["Node"] = `${node_name[nodeID]} (${nodeID})`;
		translated["Data"] = `${nmt_state[data_int[0]]} (${hexify(data[0])})`;
	} else if (0x080 <= id_int && id_int <= 0x0FF) {
		const nodeID = id_int - 0x080;
		const code_int = decode_bytes(data, [2, 3, 4, 5], false, "little");
		const meaning = emcy_message[code_int];
		const priority = emcy_priority[data_int[0]];
		const type = emcy_type[data_int[5]];
		const location = node_name[parseInt(data_int[1])];
		translated["Function"] = "EMCY";
        translated["Node"] = `${node_name[nodeID]} (${nodeID})`;
		translated["Data"] = `${priority} (${data_int[0]}) ${type} (${data_int[5]}) at ${location} (${data_int[1]}): ${meaning} (${hexify(code_int)})`;
	} else if (0x180 <= id_int && id_int <= 0x57F) {
		const nodeID = id_int % 0x80;
		translated["Function"] = "PDO";
        translated["Node"] = `${node_name[nodeID]} (${nodeID})`;
        // Assuming object data boundaries are on byte boundaries - reflects a CAN MREX implementation assumption
		translated["Data"] = "|";
		let current_byte = 0;
		if (id_int in pdo_entries) {
			for (
				const [
					index,
					subindex,
					bits
				] of pdo_entries[id_int]
			) {
				const { alias, interpretation } = getOD(object_dictionary, index, subindex);
				const upper_byte = current_byte + Math.floor(bits / 8);
				const cols = [];
				for (let i = current_byte; i < upper_byte; i++) {
					cols.push(i);
				}
				const meaning = interpret(data, cols, interpretation);
				const raw = interpret(data, cols, "hex");
				translated["Data"] += ` ${alias} (${hexify(index)}, ${hexify(subindex)}): ${meaning} (${raw}) |`;
				current_byte = upper_byte;
			}
		} else {
			translated["Data"] = `Unmapped PDO COB-ID ${id} data ${data}`;
		}
	} else if (0x580 <= id_int && id_int <= 0x5FF) {
		const nodeID = id_int - 0x580;
		const command = data_int[0];
		const index = decode_bytes(data, [1, 2], false, "little");
		const subindex = data_int[3];
		const { alias, interpretation } = getOD(object_dictionary, index, subindex);
		translated["Function"] = "SDO Tx";
        translated["Node"] = `${node_name[nodeID]} (${nodeID})`;
		translated["Data"] = `${alias} (${hexify(index)}, ${hexify(subindex)}): `;

		if (command == 0x60) {
            translated["Data"] += `Write confirmation (${hexify(command)})`;
		} else if ([0x4F, 0x4B, 0x43].includes(command)) {
			const cols = [4, 5, 6, 7];
			const meaning = interpret(data, cols, interpretation);
			const raw = interpret(data, cols, "hex");
            translated["Data"] += `Read response (${hexify(command)}) ${meaning} (${raw})`; // assuming little-endian
		} else {
            translated["Data"] += `undefined (${hexify(command)})`;
		}
	} else if (0x600 <= id_int && id_int <= 0x67F) {
		const nodeID = id_int - 0x600;
		const command = data_int[0];
		const index = decode_bytes(data, [1, 2], false, "little");
		const subindex = data_int[3];
		const { alias, interpretation } = getOD(object_dictionary, index, subindex);
        translated["Function"] = "SDO Rx";
        translated["Node"] = `${node_name[nodeID]} (${nodeID})`;
		translated["Data"] = `${alias} (${hexify(index)}, ${hexify(subindex)}): `;

		if ([0x2F, 0x2B, 0x23].includes(command)) {
			const cols = [4, 5, 6, 7];
			const meaning = interpret(data, cols, interpretation);
			const raw = interpret(data, cols, "hex");
            translated["Data"] += `Write (${hexify(command)}) ${meaning} (${raw})`; // assuming little-endian
		} else if (command == 0x40) {
			translated["Data"] += `Read request (${hexify(command)})`;
		} else {
			translated["Data"] += `undefined (${hexify(command)})`;
		}
	} else if (0x700 <= id_int && id_int <= 0x77F) {
		const nodeID = id_int - 0x700;
        translated["Function"] = "Heartbeat";
        translated["Node"] = `${node_name[nodeID]} (${nodeID})`;
		translated["Data"] = `${nmt_state[data_int[0]]} (${hexify(data[0])})`;
	} else {
		translated["Function"] = "undefined";
	}

	translated["Function"] += ` (${hexify(id)})`;

	return translated;
}

function hexify(number) {
	return `0x${parseInt(number).toString(16)}`
}

function interpret(data, cols, interpretation) {
	if (interpretation === "unsigned") {
		return decode_bytes(data, cols, false, "little");
	} else if (interpretation === "signed") {
		return decode_bytes(data, cols, true, "little");
	} else if (interpretation === "hex") {
		return hexify(decode_bytes(data, cols, false, "little"));
	} else {
		return interpretation[decode_bytes(data, cols, false, "little")];
	}
}

function getOD(object_dictionary, index, subindex) {
	if (index in object_dictionary && subindex in object_dictionary[index]) {
		return object_dictionary[index][subindex];
	} else {
		return {
			"alias": undefined,
			"interpretation": "hex"
		}
	}
}

export { translate_row };