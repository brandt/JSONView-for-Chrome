/**
 * Adapted the code in to order to run in a web worker. 
 * 
 * Original author: Benjamin Hollis
 */

function htmlEncode(value) {
	if (value === null) {
		return '';
	} else {
		return value.toString()
			.replace(/&/g, '&amp;')
			.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(value) {
				var hi = value.charCodeAt(0);
				var low = value.charCodeAt(1);
				return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
			})
			.replace(/([^\#-~| |!])/g, function(value) {
				return '&#' + value.charCodeAt(0) + ';';
			})
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
}

function decorateWithSpan(value, className) {
	return '<span class="' + className + '">' + htmlEncode(value) + '</span>';
}

function valueToHTML(value) {
	var valueType = typeof value;
	var output = "";

	if (value === null) {
		output += decorateWithSpan("null", "type-null");
	} else if (value && value.constructor == Array) {
		output += arrayToHTML(value);
	} else if (valueType == "object") {
		output += objectToHTML(value);
	} else if (valueType == "number") {
		output += decorateWithSpan(value, "type-number");
	} else if (valueType == "string") {
		if (/^(http|https):\/\/[^\s]+$/.test(value)) {
			var uri = encodeURI(value);
			output += decorateWithSpan('"', "type-string") + '<a href="' + uri + '">' + htmlEncode(uri) + '</a>' + decorateWithSpan('"', "type-string");
		} else {
			output += decorateWithSpan('"' + value + '"', "type-string");
		}
	} else if (valueType == "boolean") {
		output += decorateWithSpan(value, "type-boolean");
	}

	return output;
}

function arrayToHTML(json) {
	var i;
	var len;
	var output = '<div class="collapser"></div>[<span class="ellipsis"></span><ul class="array collapsible">';
	var hasContents = false;

	for (i = 0, len = json.length; i < len; i++) {
		hasContents = true;
		output += '<li><div class="hoverable">';
		output += valueToHTML(json[i]);
		if (i < len - 1) {
			output += ',';
		}
		output += '</div></li>';
	}

	output += '</ul>]';

	if (!hasContents) {
		output = "[ ]";
	}

	return output;
}

function objectToHTML(json) {
	var i;
	var key;
	var len;
	var keys = Object.keys(json);
	var output = '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">';
	var hasContents = false;

	for (i = 0, len = keys.length; i < len; i++) {
		key = keys[i];
		hasContents = true;
		output += '<li><div class="hoverable">';
		output += '<span class="property">' + htmlEncode(key) + '</span>: ';
		output += valueToHTML(json[key]);
		if (i < len - 1) {
			output += ',';
		}
		output += '</div></li>';
	}

	output += '</ul>}';

	if (!hasContents) {
		output = "{ }";
	}

	return output;
}

function jsonToHTML(json, fnName) {
	var output = '';

	if (fnName) {
		output += '<div class="callback-function">' + fnName + '(</div>';
	}

	output += '<div id="json">';
	output += valueToHTML(json);
	output += '</div>';

	if (fnName) {
		output += '<div class="callback-function">)</div>';
	}

	return output;
}

addEventListener("message", function(event) {
	var object;

	try {
		object = JSON.parse(event.data.json);
	} catch (e) {
		postMessage({ error: true });
		return;
	}

	postMessage({
		onjsonToHTML: true,
		html: jsonToHTML(object, event.data.fnName)
	});
}, false);
