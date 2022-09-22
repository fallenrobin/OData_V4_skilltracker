/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/mindset/juliette/v4skilltracker/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
