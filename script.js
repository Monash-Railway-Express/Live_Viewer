window.onload = function () {
	let conn;
	const log = document.getElementById("log");

	function appendLog(item) {
		const doScroll = log.scrollTop === log.scrollHeight - log.clientHeight;
		log.appendChild(item);
		if (doScroll) {
			log.scrollTop = log.scrollHeight - log.clientHeight;
		}
	}

	document.getElementById("clear").onclick = function (evt) {
		log.textContent = "";
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
					item.innerText = messages[i];
					appendLog(item);
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