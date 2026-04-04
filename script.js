import { translate_row } from "./translate_row.js";

window.onload = function () {
	let conn;
	const log = document.getElementById("log");
	const rawLog = document.createElement("div");
	const translatedLog = document.createElement("div");

	log.replaceChildren(rawLog);

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

	if (window["WebSocket"]) {
		document.getElementById("connect").onclick = function (evt) {
			document.getElementById("connect").disabled = true;
			document.getElementById("status").innerHTML = "Connecting...";
			conn = new WebSocket("ws://10.0.0.1/ws");

			conn.onopen = function (evt) {
				document.getElementById("status").innerHTML = "Connection opened.";
			}
			conn.onclose = function (evt) {
				document.getElementById("connect").disabled = false;
				document.getElementById("status").innerHTML = "Connection closed or failed.";
			};
			conn.onmessage = function (evt) {
				const messages = evt.data.split('\n');
				for (let i = 0; i < messages.length; i++) {
					const item = document.createElement("pre");
					const translatedItem = document.createElement("pre");
					item.innerText = messages[i];
					const [timestamp, id, dlc, ...data] = messages[i].split(",");
					translatedItem.innerText = JSON.stringify(translate_row(timestamp, id, parseInt(dlc), data));
					appendLog(item, translatedItem);
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

// From https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
(async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
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