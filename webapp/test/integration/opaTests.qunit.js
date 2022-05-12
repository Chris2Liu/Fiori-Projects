/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"dynasys/com/hk/demo/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});