import sheet from "./sheet.json" with { type: "json" };
import spec from "./spec.json" with { type: "json" };
import { decode_bytes } from "./decode_bytes.js";

const {
	emcy_message,
	object_dictionary,
	object_meaning,
	pdo_entries,
	node_name
} = sheet;

const {
	nmt_state,
	emcy_priority,
	emcy_type
} = spec;

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
		translated["Function"] = "NMT";
        translated["Node ID"] = data_int[1];
        translated["Node"] = node_name[translated["Node ID"]];
		translated["Data"] = nmt_state[data_int[0]];
	} else if (0x080 <= id_int && id_int <= 0x0FF) {
		translated["Function"] = "EMCY";
		translated["Node ID"] = id_int - 0x080;
        translated["Node"] = node_name[translated["Node ID"]];
		translated["Data"] = `${emcy_priority[data_int[0]]} (${data_int[0]}) at node ${data_int[1]}: ${emcy_message[concatify(data_int.slice(2, 6).toReversed())]} (${data_int.slice(2, 6)})`;
	} else if (0x180 <= id_int && id_int <= 0x57F) {
		translated["Function"] = "PDO";
        translated["Node ID"] = id_int % 0x80;
        translated["Node"] = node_name[translated["Node ID"]];
        // Assuming object data boundaries are on byte boundaries - reflects a CAN MREX implementation assumption
		translated["Data"] = "| ";
		let current_byte = 0;
		if (id_int in pdo_entries) {
			for (
				const [
					index,
					subindex,
					bits,
					signed
				] in pdo_entries[id_int].toReversed()
			) {
				const upper_byte = current_byte + Math.floor(bits / 8);
				const cols = [];
				for (let i = current_byte; i < upper_byte; i++) {
					cols.push(i);
				}
				const raw = decode_bytes(data, cols, signed);
				translated["Data"] += `${object_dictionary[index][subindex]} (${index}, ${subindex}): ${raw} | `;
				current_byte = upper_byte;
			}
		} else {
			translated["Data"] = `Unmapped PDO COB-ID ${id} data ${data}`;
		}
	} else if (0x580 <= id_int && id_int <= 0x5FF) {
		const index = concatify([data_int[2], data_int[1]]);
		const subindex = data_int[3];
		translated["Function"] = "SDO Tx";
        translated["Node ID"] = id_int - 0x580;
        translated["Node"] = node_name[translated["Node ID"]];
		translated["Data"] = `${object_dictionary[index][subindex]} (${index}, ${subindex}): `;

		if (data_int[0] == 0x60) {
            translated["Data"] += "Write confirmation";
		} else if ([0x4F, 0x4B, 0x43].includes(data_int[0])) {
            translated["Data"] += hexify(concatify(data_int.slice(4, 8).toReversed())); // assuming little-endian
		} else {
            translated["Data"] += `Unknown command ${data[0]} data ${data.slice(4, 8)}`;
		}
	} else if (0x600 <= id_int && id_int <= 0x67F) {
		const index = concatify([data_int[2], data_int[1]]);
		const subindex = data_int[3];
        translated["Function"] = "SDO Rx";
        translated["Node ID"] = id_int - 0x600;
        translated["Node"] = node_name[translated["Node ID"]];
		translated["Data"] = `${object_dictionary[index][subindex]} (${index}, ${subindex}): `;

		if ([0x2F, 0x2B, 0x23].includes(data_int[0])) {
			translated["Data"] += hexify(concatify(data_int.slice(4, 8).toReversed())) // assuming little-endian
		} else if (data_int[0] == 0x40) {
			translated["Data"] += "Read request";
		} else {
			translated["Data"] += `Unknown command ${data[0]} data ${data.slice(4, 8)}`;
		}
	} else if (0x700 <= id_int && id_int <= 0x77F) {
        translated["Function"] = "Hearbeat"
        translated["Node ID"] = id_int - 0x700
        translated["Node"] = node_name[translated["Node ID"]]
		translated["Data"] = nmt_state[data_int[0]]
	}

	return translated;
}

function concatify(data_int) {
	let result = 0;
	for (const [i, datum_int] of data_int.toReversed().entries()) {
		result += datum_int * (16 ** (i*2));
	}
	return result;
}

function hexify(number) {
	return `0x${number.toString(16)}`
}

export { translate_row };