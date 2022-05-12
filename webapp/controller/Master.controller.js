sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Master", {
		onInit: function () {
			this.getRouter().getRoute("Master").attachPatternMatched(this._onMatched, this);
			//this.getRouter().navTo("E-workflow");

		},

		_onMatched: function (oEvent) {
			var action = this.getAction();
			if (action === "Order") {
				this.toPC();
				return;
			}
			this.getRouter().navTo(action);

		},

		getAction: function () {
			var action = "";
			var href = window.location.href;
			if (href.indexOf("ZEFORM_PC-Worklist_Preparer") > -1) {
				action = "Worklist_Preparer";
			} else if (href.indexOf("ZEFORM_PC-Worklist_Admin") > -1) {
				action = "Worklist_Admin";
			} else if (href.indexOf("ZEFORM_PC-Worklist_ITU") > -1) {
				action = "Worklist_ITU";
			} else if (href.indexOf("ZEFORM_PC-Worklist_General") > -1) {
				action = "Worklist_General";
			} else if (href.indexOf("ZEFORM_PC-MassReassign") > -1) {
				action = "MassReassign";
			} else if (href.indexOf("ZEFORM_PC-Float_Maintenance") > -1) {
				action = "Float_Maintenance";
			} else if (href.indexOf("ZEFORM_PC-PC_Confirm") > -1) {
				action = "PC_Confirm";
			} else if (href.indexOf("ZEFORM_PC-Quick_Guide") > -1) {
				action = "Quick_Guide";
			} else if (href.indexOf("ZEFORM_PC-Role_Assign") > -1) {
				action = "Role_Assign";
			} else if (href.indexOf("ZEFORM_PC-Float_Detail") > -1) {
				action = "Float_Detail";
			}

			if (!action) {
				action = "Order";
			}
			return action;
		},

		toPC: function () {
			var componentData = this.getOwnerComponent().getComponentData();
			var Pcno = "";
			var action = "create_pc";
			var role = "1";

			if (componentData && componentData.startupParameters && componentData.startupParameters.action && componentData.startupParameters.action
				.length > 0) {
				action = componentData.startupParameters.action[0];
			}

			if (componentData && componentData.startupParameters && componentData.startupParameters.objectId) {
				Pcno = componentData.startupParameters.objectId[0];
			}

			if (componentData && componentData.startupParameters && componentData.startupParameters.from) {
				var from = componentData.startupParameters.from[0];
				if (from === "admin") {
					role = "2";
				} else if (from === "preparer") {
					role = "1";
				} else if (from === "itu") {
					role = "3";
				}
			}

			if (Pcno) {
				this.getRouter().navTo("Order_Action", {
					Pcno: Pcno,
					Role: role,
					Action: action
				});
			} else {
				this.getRouter().navTo("Order", {
					Action: action
				});
			}

		},

		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		}
	});
});