sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.CI_Guide", {

		onInit: function () {
			this.getRouter().getRoute("CI_GUIDE").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function () {
			this.resetBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("Invoice: Guide");
			}
		},

		resetBackBtn: function () {
			var backBtn = sap.ui.getCore().byId("backBtn");
			if (!backBtn) {
				return;
			}
			backBtn.detachAllEventHandlers("press");
			backBtn.attachPress(function () {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
			});
		}
	});
});