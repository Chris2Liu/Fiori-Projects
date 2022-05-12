sap.ui.define([
		'./BaseController',
		'sap/ui/model/json/JSONModel'
	],
	function (BaseController, JSONModel) {
		"use strict";

		return BaseController.extend("dynasys.com.hk.demo.controller.Master", {

			onInit: function () {
				this.getRouter().getRoute("Master").attachPatternMatched(this._onMatched, this);
			},

			_onMatched: function () {
				var action = this.getAction();
				if (action === "SalesOrder") {
					this.toSalesOrder();
					return;
				}
				this.getRouter().navTo(action);
			},

			getAction: function () {
				var action = "";
				var href = window.location.href;
				if (href.indexOf("SalesOrder") > -1) {
					action = "SalesOrder";
				}

				if (!action) {
					action = "SalesOrder";
				}
				return action;
			},

			toSalesOrder: function () {
				this.getRouter().navTo("SalesOrder", {

				});
			}

		});
	});