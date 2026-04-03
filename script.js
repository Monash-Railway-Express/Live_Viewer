window.onload = function () {
	var conn;
	var log = document.getElementById("log");
	var msg = document.getElementById("msg");

	function appendLog(item) {
		var doScroll = log.scrollTop === log.scrollHeight - log.clientHeight;
		log.appendChild(item);
		if (doScroll) {
			log.scrollTop = log.scrollHeight - log.clientHeight;
		}
	}

	conn = new WebSocket("ws://10.0.0.1/ws");
	if (window["WebSocket"]) {
		if (conn) {
			conn.onopen = function (evt) {
				document.getElementById("sendMsg").disabled = false
				document.getElementById("status").innerHTML = "Connection opened"
			}
			conn.onclose = function (evt) {
				document.getElementById("status").innerHTML = "Connection closed"
			};
			conn.onmessage = function (evt) {
				var messages = evt.data.split('\n');
				for (var i = 0; i < messages.length; i++) {
					var item = document.createElement("pre");
					item.innerText = messages[i];
					appendLog(item);
				}
			}
		}
	} else {
		var item = document.createElement("pre");
		item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
		appendLog(item);
	}

	document.getElementById("form").onsubmit = function () {
		if (!conn) {
			return false;
		}
		if (!msg.value) {
			return false;
		}
		conn.send(msg.value);
		var item = document.createElement("pre");
		item.classList.add("subscribeMsg");
		item.innerHTML = msg.value;
		appendLog(item);
		return false;
	};
};