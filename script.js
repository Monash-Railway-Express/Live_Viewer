/**
 * @file script.js
 * @brief Provides interactivity and SSE connection.
 * 
 * @details
 * Connect to the Server-Sent Event Source server to display live CAN messages and toggle translation layer.
 * WebSocket client webpage originally based on
 * https://arubanetworking.hpe.com/techdocs/AOS-CX/10.14/HTML/rest_v10-0x/Content/Chp_RT_not/ex-bro-bas-not-sub5.htm
 * Service worker registration code from
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 * 
 * @author Nhan Nguyen
 * 
 * @date 23/05/2026
 * 
 * @version 2.4.0
 * 
 * @organisation MREX
 * 
 * @see index.html
 * @see sw.js
 */

import { translate_row } from "./translate_row.js";
import sheet from "./sheet.json" with { type: "json" };

const { node_name } = sheet;

const highlightColour = {
	"NMT": "#9F5EB8",
	"EMCY": "red",
	"PDO": null,
	"SDO Tx": "lime",
	"SDO Rx": "yellow",
	"Heartbeat": "pink"
};

window.onload = function () {
	const log = document.getElementById("log");
	const rawLog = document.createElement("div");
	const translatedLog = document.createElement("div");

	log.replaceChildren(rawLog);

	const heartbeatStati = {};
	const lastSeen = {};
	for (const nodeID in node_name) {
		heartbeatStati[nodeID] = document.createElement("div");
		document.getElementById("heartbeats").appendChild(heartbeatStati[nodeID]);
		lastSeen[`${node_name[nodeID]} (${nodeID})`] = 0;
	}

	const canData = {};
	for (const alias of [
		"od_regen_brake",
		"od_service_brake_dc",
		"od_motor_command",
		"od_true_speed",
		"od_direction_mode",
		"od_challenge_mode",
		"od_horn_toggle",
		"od_temperature_front",
		"od_temperature_rear",
		"od_autostop_detection",
		"od_current",
		"od_voltage",
		"od_soc",
		"od_power",
		"od_recovered_energy"
	]) {
		const odContainer = document.createElement("div");
		odContainer.appendChild(document.createTextNode(`${alias}: `));
		canData[alias] = document.createTextNode("");
		odContainer.appendChild(canData[alias]);
		document.getElementById("can-data").appendChild(odContainer);
	}

	setInterval(function () {
		for (const nodeID in node_name) {
			if (Date.now() - lastSeen[`${node_name[nodeID]} (${nodeID})`] > 2000) {
				heartbeatStati[nodeID].textContent = `${node_name[nodeID]} 💀`;
			}
		}
	}, 2000);

	function appendLog(item, translatedItem) {
		const doScroll = log.scrollTop === log.scrollHeight - log.clientHeight;
		rawLog.appendChild(item);
		translatedLog.appendChild(translatedItem);

		while (rawLog.childElementCount > 1000) {
			rawLog.removeChild(rawLog.firstElementChild);
			translatedLog.removeChild(translatedLog.firstElementChild);
		}

		if (doScroll) {
			log.scrollTop = log.scrollHeight - log.clientHeight;
		}
	}

	document.getElementById("autoscroll").onclick = function (evt) {
		log.scrollTop = log.scrollHeight - log.clientHeight;
	};

	document.getElementById("translate").onclick = function (evt) {
		if (log.firstChild === rawLog) {
			log.replaceChildren(translatedLog);
		} else {
			log.replaceChildren(rawLog);
		}
	};

	document.getElementById("clear").onclick = function (evt) {
		rawLog.innerText = "";
		translatedLog.innerText = "";
	};

	if (window.EventSource) {
		document.getElementById("connect").disabled = false;
		
		let conn;

		document.getElementById("disconnect").onclick = function (evt) {
			if (conn) {
				conn.close();
			}
			document.getElementById("status").innerHTML = "Connection closed.";
		}

		document.getElementById("connect").onclick = function (evt) {
			if (conn) {
				conn.close();
			}
			
			document.getElementById("connect").disabled = true;
			document.getElementById("status").innerHTML = "Connecting...";
			conn = new EventSource(document.getElementById("sseURL").value);

			conn.onopen = function (evt) {
				document.getElementById("connect").disabled = false;
				document.getElementById("status").innerHTML = "Connection opened.";
			};
			conn.onerror = function (evt) {
				if (evt.target.readyState != EventSource.OPEN) {
					document.getElementById("connect").disabled = false;
					document.getElementById("status").innerHTML = "Connection closed or failed.";
				}
			};
			conn.onmessage = function (evt) {
				const messages = evt.data.split('\n');
				for (let i = 0; i < messages.length; i++) {
					const item = document.createElement("pre");
					const translatedItem = document.createElement("pre");
					item.innerText = messages[i];
					const [timestamp, id, dlc, ...data] = messages[i].split(",");
					const translated = translate_row(timestamp, id, parseInt(dlc), data);
					translatedItem.innerText = JSON.stringify(
						translated,
						(key, value) => {
							if (key === "Patch") {
								return undefined;
							}
							
							if (value === undefined) {
								return "undefined";
							}
							
							return value;
						}
					);
					
					if (translated["Function"].includes("Heartbeat")) {
						lastSeen[translated["Node"]] = Date.now();
						const nodeID = id - 0x700;
						switch (translated["Data"]) {
							case "Stopped (0x2)":
								heartbeatStati[nodeID].textContent = `${node_name[nodeID]} 😴`;
								break;
							case "Pre-operational (0x80)":
								heartbeatStati[nodeID].textContent = `${node_name[nodeID]} 💖`;
								break;
							case "Operational (0x1)":
								heartbeatStati[nodeID].textContent = `${node_name[nodeID]} ⚡`;
								break;
						}
					}

					for (const alias in translated["Patch"]) {
						if (alias in canData) {
							canData[alias].textContent = translated["Patch"][alias];
						}
					}

					item.style.backgroundColor = highlightColour[translated["Function"].split(" ")[0]];
					translatedItem.style.backgroundColor = highlightColour[translated["Function"].split(" ")[0]];

					appendLog(item, translatedItem);
				}
			};
		};
	} else {
		const item = document.createElement("pre");
		item.innerHTML = "<b>Your browser does not support Server-Sent Events.</b>";
		appendLog(item);
		document.getElementById("connect").disabled = true;
	}
};

/*
Register service worker for caching to allow loading the Live Viewer while not connected to the Internet (such as when connected to the CAN logger Wi-Fi).
From https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
*/
(async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: "./",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
})();