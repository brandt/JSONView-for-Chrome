var path;
var value;

function init() {
	chrome.runtime.onConnect.addListener(function(port) {
		port.onMessage.addListener(function(msg) {
			var workerFormatter;
			var workerJSONLint;
			var json = msg.json;

			function onWorkerJSONLintMessage() {
				var message = JSON.parse(event.data);
				workerJSONLint.removeEventListener("message", onWorkerJSONLintMessage, false);
				workerJSONLint.terminate();
				port.postMessage({
					ongetError: true,
					error: message.error,
					loc: message.loc,
					offset: msg.offset
				});
			}

			function onWorkerFormatterMessage(event) {
				var message = event.data;
				workerFormatter.removeEventListener("message", onWorkerFormatterMessage, false);
				workerFormatter.terminate();

				if (message.html) {
					port.postMessage({
						onjsonToHTML: true,
						html: message.html
					});
				}

				if (message.error) {
					workerJSONLint = new Worker("workerJSONLint.js");
					workerJSONLint.addEventListener("message", onWorkerJSONLintMessage, false);
					workerJSONLint.postMessage(json);
				}
			}

			if (msg.init) {
				port.postMessage({
					oninit: true,
					options: localStorage.options ? JSON.parse(localStorage.options) : {}
				});
			}

			if (msg.copyPropertyPath) {
				path = msg.path;
				value = msg.value;
			}

			if (msg.jsonToHTML) {
				workerFormatter = new Worker("workerFormatter.js");
				workerFormatter.addEventListener("message", onWorkerFormatterMessage, false);
				workerFormatter.postMessage({
					json: json,
					fnName: msg.fnName
				});
			}
		});
	});
}

var options = {};
if (localStorage.options) {
	options = JSON.parse(localStorage.options);
}

init();
