/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ZEFORM/PettyCash/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});