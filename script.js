/**
 * @file script.js
 * @brief Provides interactivity and WebSocket connection.
 * 
 * @details
 * Connect to the WebSocket server to display live CAN messages and toggle translation layer.
 * WebSocket client webpage originally based on
 * https://arubanetworking.hpe.com/techdocs/AOS-CX/10.14/HTML/rest_v10-0x/Content/Chp_RT_not/ex-bro-bas-not-sub5.htm
 * Service worker registration code from
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 * 
 * @author Nhan Nguyen
 * 
 * @date 22/04/2026
 * 
 * @version 2.0.0
 * 
 * @organisation MREX
 * 
 * @see index.html
 * @see sw.js
 */

import { translate_row } from "./translate_row.js";
import sheet from "./sheet.json" with { type: "json" };

const { node_name } = sheet;

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

	setInterval(function () {
		for (const nodeID in node_name) {
			if (Date.now() - lastSeen[`${node_name[nodeID]} (${nodeID})`] > 2000) {
				heartbeatStati[nodeID].textContent = `${node_name[nodeID]} 💀`;
			} else {
				heartbeatStati[nodeID].textContent = `${node_name[nodeID]} ⚡`;
			}
		}
	}, 2000);

	function appendLog(item, translatedItem) {
		const doScroll = log.scrollTop === log.scrollHeight - log.clientHeight;
		rawLog.appendChild(item);
		translatedLog.appendChild(translatedItem);
		if (doScroll) {
			log.scrollTop = log.scrollHeight - log.clientHeight;
		}
	}

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
		let conn;
		document.getElementById("connect").onclick = function (evt) {
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
							if (value === undefined) {
								return "undefined";
							} else {
								return value;
							}
						}
					);
					appendLog(item, translatedItem);
					if (translated["Function"].includes("Heartbeat")) {
						lastSeen[translated["Node"]] = Date.now();
					}
				}
			};
		};
	} else {
		const item = document.createElement("pre");
		item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
		appendLog(item);
		document.getElementById("connect").disabled = true;
	}
};

/*
Register service worker for caching to allow using the Live Viewer while not connected to the Internet (such as when connected to the CAN logger Wi-Fi).
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