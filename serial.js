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
 * @date 12/05/2026
 * 
 * @version 2.3.0
 * 
 * @organisation MREX
 * 
 * @see serial.html
 * @see sw.js
 */

import sheet from "./sheet.json" with { type: "json" };

const { node_name } = sheet;

window.onload = function () {
	if (window.EventSource) {
		for (const nodeID in node_name) {
			function appendLog(item) {
				const doScroll = log.scrollTop === log.scrollHeight - log.clientHeight;
				log.appendChild(item);

				while (log.childElementCount > 1000) {
					log.removeChild(log.firstElementChild);
				}

				if (doScroll) {
					log.scrollTop = log.scrollHeight - log.clientHeight;
				}
			}
			
			const connectionContainer = document.createElement("fieldset");
			document.getElementById("connections").appendChild(connectionContainer);
			
			const connectionStatus = document.createElement("legend");
			connectionStatus.textContent = `${node_name[nodeID]} 💀`;
			connectionContainer.appendChild(connectionStatus);

			const header = document.createElement("div");
			connectionContainer.appendChild(header);

			let conn;

			const connectButton = document.createElement("input");
			connectButton.type = "button";
			connectButton.value = "Connect";
			connectButton.onclick = function (evt) {
				if (conn) {
					conn.close();
				}
				
				connectionStatus.textContent = `${node_name[nodeID]} ✨`;
				conn = new EventSource(sseURL.value);

				conn.onopen = function (evt) {
					connectionStatus.textContent = `${node_name[nodeID]} ⚡`;
				};
				conn.onerror = function (evt) {
					if (evt.target.readyState != EventSource.OPEN) {
						connectionStatus.textContent = `${node_name[nodeID]} 💀`;
					}
				};
				conn.onmessage = function (evt) {
					const messages = evt.data.split('\n');
					for (let i = 0; i < messages.length; i++) {
						const item = document.createElement("pre");
						item.innerText = messages[i];
						appendLog(item);
					}
				};
			};
			header.appendChild(connectButton);

			const disconnectButton = document.createElement("input");
			disconnectButton.type = "button";
			disconnectButton.value = "Disconnect";
			disconnectButton.onclick = function (evt) {
				if (conn) {
					conn.close();
				}
				connectionStatus.textContent = `${node_name[nodeID]} 💀`;
			};
			header.appendChild(disconnectButton);

			const sseURL = document.createElement("input");
			sseURL.type = "text";
			sseURL.value = `http://10.0.0.${nodeID}/serial`;
			header.appendChild(sseURL);

			const jumpButton = document.createElement("input");
			jumpButton.type = "button";
			jumpButton.value = "Jump";
			jumpButton.onclick = function (evt) {
				log.scrollTop = log.scrollHeight - log.clientHeight;
			};
			header.appendChild(jumpButton);

			const clearButton = document.createElement("input");
			clearButton.type = "button";
			clearButton.value = "Clear";
			clearButton.onclick = function (evt) {
				log.innerText = "";
			};
			header.appendChild(clearButton);

			const log = document.createElement("div");
			log.className = "log";
			connectionContainer.appendChild(log);
		}
	} else {
		document.getElementById("connections").innerHTML = "<b>Your browser does not support Server-Sent Events.</b>";
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