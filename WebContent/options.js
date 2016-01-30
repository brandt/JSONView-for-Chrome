function initOptions() {
	var bgPage = chrome.extension.getBackgroundPage();
	var options = localStorage.options ? JSON.parse(localStorage.options) : {};

	var injectInFrameInput = document.getElementById("injectInFrameInput");
	injectInFrameInput.checked = options.injectInFrame;
	injectInFrameInput.addEventListener("change", function() {
		options.injectInFrame = injectInFrameInput.checked;
		localStorage.options = JSON.stringify(options);
	});

	document.getElementById("open-editor").addEventListener("click", function() {
		location.href = "csseditor.html";
	}, false);
}

addEventListener("load", initOptions, false);
