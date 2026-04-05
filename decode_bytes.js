/**
 * @file decode_bytes.js
 * @brief Provides a generic decoder for data bytes.
 * 
 * @details
 * Translated from original Python code written by Chiara Gillam for the MREx Dashboard.
 * Exposes a decoder function.
 * 
 * @author Chiara Gillam
 * @author Nhan Nguyen
 * 
 * @date 04/04/2026
 * 
 * @version 1.0.0
 * 
 * @organisation MREX
 * 
 * @see https://github.com/Monash-Railway-Express/MREx_Dashboard/blob/main/utils/byte_decoder.py
 */

/**
 * @brief Decode a sequence of data bytes to the number represented.
 * 
 * @param row       Array or object of data bytes as strings or numbers.
 * @param cols      List of column names, e.g. ["Data4", "Data5", "Data6", "Data7"].
 * @param signed    true for 2's complement.
 * @param endian    "little" or "big".
 * 
 * @return The raw integer represented as a number type.
 */
function decode_bytes(row, cols, signed, endian) {
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