/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ZEFORM/Invoice/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});