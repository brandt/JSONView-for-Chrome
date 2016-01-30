var port = chrome.runtime.connect();
var collapsers;
var options;
var jsonObject;

function displayError(error, loc, offset) {
	var link = document.createElement("link");
	var pre = document.body.firstChild.firstChild;
	var text = pre.textContent.substring(offset);
	var start = 0;
	var ranges = [];
	var idx = 0;
	var end;
	var range = document.createRange();
	var imgError = document.createElement("img");
	var content = document.createElement("div");
	var errorPosition = document.createElement("span");
	var container = document.createElement("div");
	var closeButton = document.createElement("div");

	link.rel = "stylesheet";
	link.type = "text/css";
	link.href = chrome.runtime.getURL("content_error.css");
	document.head.appendChild(link);

	while (idx != -1) {
		idx = text.indexOf("\n", start);
		ranges.push(start);
		start = idx + 1;
	}

	start = ranges[loc.first_line - 1] + loc.first_column + offset;
	end = ranges[loc.last_line - 1] + loc.last_column + offset;
	range.setStart(pre, start);

	if (start == end - 1) {
		range.setEnd(pre, start);
	} else {
		range.setEnd(pre, end);
	}

	errorPosition.className = "error-position";
	errorPosition.id = "error-position";
	range.surroundContents(errorPosition);
	imgError.src = chrome.runtime.getURL("error.gif");
	errorPosition.insertBefore(imgError, errorPosition.firstChild);

	content.className = "content";

	closeButton.className = "close-error";
	closeButton.onclick = function() {
		content.parentElement.removeChild(content);
	};

	content.textContent = error;
	content.appendChild(closeButton);

	container.className = "container";
	container.appendChild(content);

	errorPosition.parentNode.insertBefore(container, errorPosition.nextSibling);
	location.hash = "error-position";
	history.replaceState({}, "", "#");
}

function displayUI(theme, html) {
	var statusElement;
	var toolboxElement;
	var expandElement;
	var reduceElement;
	var viewSourceElement;
	var optionsElement;
	var content = "";

	content += '<link rel="stylesheet" type="text/css" href="' + chrome.runtime.getURL("jsonview-core.css") + '">';
	content += "<style>" + theme + "</style>";
	content += html;
	document.body.innerHTML = content;

	collapsers = document.querySelectorAll("#json .collapsible .collapsible");
	statusElement = document.createElement("div");
	statusElement.className = "status";

	copyPathElement = document.createElement("div");
	copyPathElement.className = "copy-path";

	statusElement.appendChild(copyPathElement);
	document.body.appendChild(statusElement);

	toolboxElement = document.createElement("div");
	toolboxElement.className = "toolbox";

	expandElement = document.createElement("span");
	expandElement.title = "expand all";
	expandElement.innerText = "+";

	reduceElement = document.createElement("span");
	reduceElement.title = "reduce all";
	reduceElement.innerText = "-";

	viewSourceElement = document.createElement("a");
	viewSourceElement.innerText = "View source";
	viewSourceElement.target = "_blank";
	viewSourceElement.href = "view-source:" + location.href;

	optionsElement = document.createElement("img");
	optionsElement.title = "options";
	optionsElement.src = chrome.runtime.getURL("options.png");

	toolboxElement.appendChild(expandElement);
	toolboxElement.appendChild(reduceElement);
	toolboxElement.appendChild(viewSourceElement);
	toolboxElement.appendChild(optionsElement);

	document.body.appendChild(toolboxElement);
	document.body.addEventListener('click', ontoggle, false);
	document.body.addEventListener('mouseover', onmouseMove, false);
	document.body.addEventListener('click', onmouseClick, false);
	expandElement.addEventListener('click', onexpand, false);
	reduceElement.addEventListener('click', onreduce, false);
	optionsElement.addEventListener("click", function() {
		window.open(chrome.runtime.getURL("options.html"));
	}, false);
	copyPathElement.addEventListener("click", function() {
		port.postMessage({
			copyPropertyPath: true,
			path: statusElement.innerText
		});
	}, false);
}

function extractData(rawText) {
	var tokens;
	var text = rawText.trim();

	function test(text) {
		return ((text.charAt(0) == "[" && text.charAt(text.length - 1) == "]") || (text.charAt(0) == "{" && text.charAt(text.length - 1) == "}"));
	}

	if (test(text)) {
		return {
			text: rawText,
			offset: 0
		};
	}

	tokens = text.match(/^([^\s\(]*)\s*\(([\s\S]*)\)\s*;?$/);
	if (tokens && tokens[1] && tokens[2]) {
		if (test(tokens[2].trim())) {
			return {
				fnName: tokens[1],
				text: tokens[2],
				offset: rawText.indexOf(tokens[2])
			};
		}
	}
}

function processData(data) {
	var xhr;
	var jsonText;

	function formatToHTML(fnName, offset) {
		if (!jsonText) { return; }

		port.postMessage({
			jsonToHTML: true,
			json: jsonText,
			fnName: fnName,
			offset: offset
		});

		try {
			jsonObject = JSON.parse(jsonText);
		} catch (e) {
		}
	}

	if (window == top || options.injectInFrame) {
		if (data) {
			jsonText = data.text;
			formatToHTML(data.fnName, data.offset);
		}
	}
}

function ontoggle(event) {
	var collapsed;
	var target = event.target;

	if (event.target.className == 'collapser') {
		collapsed = target.parentNode.getElementsByClassName('collapsible')[0];
		if (collapsed.parentNode.classList.contains("collapsed")) {
			collapsed.parentNode.classList.remove("collapsed");
		} else {
			collapsed.parentNode.classList.add("collapsed");
		}
	}
}

function onexpand() {
	Array.prototype.forEach.call(collapsers, function(collapsed) {
		if (collapsed.parentNode.classList.contains("collapsed")) {
			collapsed.parentNode.classList.remove("collapsed");
		}
	});
}

function onreduce() {
	Array.prototype.forEach.call(collapsers, function(collapsed) {
		if (!collapsed.parentNode.classList.contains("collapsed")) {
			collapsed.parentNode.classList.add("collapsed");
		}
	});
}

function getParentLI(element) {
	if (element.tagName != "LI") {
		while (element && element.tagName != "LI") {
			element = element.parentNode;
		}
	}

	if (element && element.tagName == "LI") {
		return element;
	}
}

var onmouseMove = (function() {
	var hoveredLI;

	function onmouseOut() {
		var statusElement = document.querySelector(".status");
		if (hoveredLI) {
			hoveredLI.firstChild.classList.remove("hovered");
			hoveredLI = null;
			statusElement.innerText = "";
		}
	}

	return function(event) {
		var str = "";
		var statusElement = document.querySelector(".status");

		element = getParentLI(event.target);

		if (element) {
			if (hoveredLI) {
				hoveredLI.firstChild.classList.remove("hovered");
			}

			hoveredLI = element;

			element.firstChild.classList.add("hovered");

			do {
				if (element.parentNode.classList.contains("array")) {
					var index = [].indexOf.call(element.parentNode.children, element);
					str = "[" + index + "]" + str;
				}

				if (element.parentNode.classList.contains("obj")) {
					str = "." + element.firstChild.firstChild.innerText + str;
				}

				element = element.parentNode.parentNode.parentNode;
			} while (element.tagName == "LI");

			if (str.charAt(0) == '.') {
				str = str.substring(1);
			}

			statusElement.innerText = str;
			return;
		}

		onmouseOut();
	};
})();

var selectedLI;

function onmouseClick() {
	if (selectedLI) { selectedLI.firstChild.classList.remove("selected"); }
	selectedLI = getParentLI(event.target);
	if (selectedLI) { selectedLI.firstChild.classList.add("selected"); }
}

function init(data) {
	port.onMessage.addListener(function(msg) {
		if (msg.oninit) {
			options = msg.options;
			processData(data);
		}

		if (msg.onjsonToHTML) {
			if (msg.html) {
				displayUI(msg.theme, msg.html);
			} else if (msg.json) {
				port.postMessage({
					getError: true,
					json: json,
					fnName: fnName
				});
			}
		}

		if (msg.ongetError) {
			displayError(msg.error, msg.loc, msg.offset);
		}
	});

	port.postMessage({ init: true });
}

function load() {
	var child;
	var data;

	if (document.body && (document.body.childNodes[0] && document.body.childNodes[0].tagName == "PRE" || document.body.children.length === 0)) {
		child = document.body.children.length ? document.body.childNodes[0] : document.body;
		data = extractData(child.innerText);
		if (data) {
			init(data);
		}
	}
}

load();
