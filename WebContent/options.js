function initOptions() {
	var bgPage = chrome.extension.getBackgroundPage(), options = localStorage.options ? JSON.parse(localStorage.options) : {};
	var safeMethodInput = document.getElementById("safeMethodInput"), injectInFrameInput = document.getElementById("injectInFrameInput");
	safeMethodInput.checked = options.safeMethod;
	injectInFrameInput.checked = options.injectInFrame;
	safeMethodInput.addEventListener("change", function() {
		options.safeMethod = safeMethodInput.checked;
		localStorage.options = JSON.stringify(options);
	});
	injectInFrameInput.addEventListener("change", function() {
		options.injectInFrame = injectInFrameInput.checked;
		localStorage.options = JSON.stringify(options);
	});
	document.getElementById("open-editor").addEventListener("click", function() {
		location.href = "csseditor.html";
	}, false);
}

addEventListener("load", initOptions, false);
