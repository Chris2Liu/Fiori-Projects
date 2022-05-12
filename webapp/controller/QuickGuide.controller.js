sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.QuickGuide", {

		onInit: function () {
			this.getRouter().getRoute("QuickGuide").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function () {
			this.resetBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI&RVI: Quick Guide and Video Demo for System Users");
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