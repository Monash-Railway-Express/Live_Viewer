// Translated from original Python code written by Chiara Gillam for the MREx Dashboard

/**
 * Generic decoder for CAN data bytes.
 * @param {*} row data bytes as an array or object
 * @param {*} cols list of column names, e.g. ["Data4", "Data5", "Data6", "Data7"]
 * @param {*} signed true for 2's complement
 * @param {*} endian "little" or "big"
 */
function decode_bytes(row, cols, signed=false, endian="little") {
	let raw;

	// Clean and convert each byte
    const bytes_list = [];
    for (const col of cols) {
        const val = row[col].toString().replace("0x", "").trim();
        bytes_list.push(parseInt(val));
	}

    // Combine into integer
    if (endian == "little") {
        raw = 0;
        for (const [i, b] of bytes_list.entries()) {
            raw |= b << (8 * i);
		}
	} else {
        raw = 0;
        for (const b of bytes_list) {
            raw = (raw << 8) | b;
		}
	}

    // Convert to signed if needed
    if (signed) {
        const bit_len = 8 * len(cols);
        const sign_bit = 1 << (bit_len - 1);
        const full_range = 1 << bit_len;

        if (raw & sign_bit) {
            raw -= full_range;
		}
	}

    return raw;
}

export { decode_bytes };