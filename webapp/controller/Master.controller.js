sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.Master", {
		onInit: function () {
			this.getRouter().getRoute("Master").attachPatternMatched(this._onMatched, this);
		},

		_onMatched: function (oEvent) {
			var action = this.getAction();
			if (action === "CustomerInvoice") {
				this.toCI();
				return;
			}
			this.getRouter().navTo(action);
		},

		toCI: function () {
			var componentData = this.getOwnerComponent().getComponentData();
			var cino = "";
			var action = "create_ci";
			var role = "1";

			if (componentData && componentData.startupParameters && componentData.startupParameters.action && componentData.startupParameters.action
				.length > 0) {
				action = componentData.startupParameters.action[0];
			}

			if (componentData && componentData.startupParameters && componentData.startupParameters.objectId) {
				cino = componentData.startupParameters.objectId[0];
			}

			if (componentData && componentData.startupParameters && componentData.startupParameters.from) {
				var from = componentData.startupParameters.from[0];
				if (from === "admin") {
					role = "3";
				} else if (from === "endorser") {
					role = "2";
				} else if (from === "fno") {
					role = "5";
				} else if (from === "preparer") {
					role = "1";
				} else if (from === "itu") {
					role = "4";
				}
			}

			if (cino) {
				this.getRouter().navTo("CustomerInvoice_Action", {
					Cino: cino,
					Role: role,
					Action: action
				});
			} else {
				this.getRouter().navTo("CustomerInvoice", {
					Action: action
				});
			}
		},

		getAction: function () {
			var action = "";
			var href = window.location.href;
			if (href.indexOf("ZEFORM_CI-Worklist_Preparer") > -1) {
				action = "CI_Worklist_Preparer";
			} else if (href.indexOf("ZEFORM_CI-Worklist_Admin") > -1) {
				action = "CI_Worklist_Admin";
			} else if (href.indexOf("ZEFORM_CI-Worklist_Endorser") > -1) {
				action = "CI_Worklist_Endorser";
			} else if (href.indexOf("ZEFORM_CI-Worklist_General") > -1) {
				action = "CI_Worklist_General";
			} else if (href.indexOf("ZEFORM_CI-MassReassign") > -1) {
				action = "MassReassignCI";
			} else if (href.indexOf("ZEFORM_CI-overdue") > -1) {
				action = "OverDue";
			} else if (href.indexOf("ZEFORM_CI-os") > -1) {
				action = "Outstanding";
			} else if (href.indexOf("ZEFORM_CI-close") > -1) {
				action = "Close";
			} else if (href.indexOf("ZEFORM_CI-QuickGuide") > -1) {
				action = "QuickGuide";
			}

			if (!action) {
				action = "CustomerInvoice";
			}
			return action;
		}
	});
});