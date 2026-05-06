/**
 * @file script.js
 * @brief Provides interactivity and SSE connection.
 * 
 * @details
 * Connect to the Server-Sent Event Source server to display live serial messages.
 * WebSocket client webpage originally based on
 * https://arubanetworking.hpe.com/techdocs/AOS-CX/10.14/HTML/rest_v10-0x/Content/Chp_RT_not/ex-bro-bas-not-sub5.htm
 * Service worker registration code from
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 * 
 * @author Nhan Nguyen
 * 
 * @date 06/05/2026
 * 
 * @version 2.2.0
 * 
 * @organisation MREX
 * 
 * @see serial.html
 * @see sw.js
 */

import sheet from "./sheet.json" with { type: "json" };

const { node_name } = sheet;

window.onload = function () {
	const log = document.getElementById("log");
	function resetLog() {
		for (const { item, nodeID } of allLogs) {
			if (displayLog[nodeID].checked) {
				log.appendChild(item);
				if (log.childElementCount > 1000) {
					log.removeChild(log.firstElementChild);
				}
			}
		}
	}

	const sseURL = {};
	const displayLog = {};
	const connectionStati = {};
	for (const nodeID in node_name) {
		const connectionContainer = document.createElement("div");
		document.getElementById("connections").appendChild(connectionContainer);

		sseURL[nodeID] = document.createElement("input");
		sseURL[nodeID].type = "text";
		sseURL[nodeID].value = `http://10.0.0.${nodeID}/serial`;
		connectionContainer.appendChild(sseURL[nodeID]);

		displayLog[nodeID] = document.createElement("input");
		displayLog[nodeID].type = "checkbox";
		displayLog[nodeID].onchange = function (evt) {
			log.innerText = "";
			resetLog();
		};
		connectionContainer.appendChild(displayLog[nodeID]);

		connectionStati[nodeID] = document.createTextNode("");
		connectionContainer.appendChild(connectionStati[nodeID]);
	}

	const allLogs = [];
	function appendLog(item, nodeID) {
		const doScroll = log.scrollTop === log.scrollHeight - log.clientHeight;

		allLogs.push({ item, nodeID });
		if (allLogs.length > 10000) {
			allLogs.shift();
		}

		if (displayLog[nodeID].checked) {
			log.appendChild(item);
			if (log.childElementCount > 1000) {
				log.removeChild(log.firstElementChild);
			}
		}

		if (doScroll) {
			log.scrollTop = log.scrollHeight - log.clientHeight;
		}
	}

	document.getElementById("autoscroll").onclick = function (evt) {
		log.scrollTop = log.scrollHeight - log.clientHeight;
	};

	document.getElementById("clear").onclick = function (evt) {
		allLogs.length = 0;
		log.innerText = "";
	};

	if (window.EventSource) {		
		document.getElementById("connect").disabled = false;

		const conn = {};
		function connect() {
			for (const nodeID in node_name) {
				if (conn[nodeID]) {
					conn[nodeID].close();
				}

				connectionStati[nodeID].textContent = `${node_name[nodeID]} ✨`;
				conn[nodeID] = new EventSource(sseURL[nodeID].value);

				conn[nodeID].onopen = function (evt) {
					connectionStati[nodeID].textContent = `${node_name[nodeID]} ⚡`;
				};

				conn[nodeID].onerror = function (evt) {
					if (evt.target.readyState != EventSource.OPEN) {
						connectionStati[nodeID].textContent = `${node_name[nodeID]} 💀`;
					}
				};

				conn[nodeID].onmessage = function (evt) {
					const messages = evt.data.split('\n');
					for (let i = 0; i < messages.length; i++) {
						const item = document.createElement("pre");
						item.innerText = messages[i];
						appendLog(item, nodeID);
					}
				};
			}
		}

		connect();

		document.getElementById("connect").onclick = connect;
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