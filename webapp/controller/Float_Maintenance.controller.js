sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Float_Maintenance", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZEFORM.PettyCash.view.Float_Maintenance
		 */
		onInit: function () {
				this.getRouter().getRoute("Float_Maintenance").attachPatternMatched(this._onMatched, this);
				this.initEvent();
				this.initCss();
		},
		
		_onMatched: function () {
			this.resetBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("PC: Float Maintenance");
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
		},
		onInitSmartFilterBar: function (oEvent) {

			oEvent.getSource().getBasicSearchControl().setPlaceholder("Search Preparer ID or Preparer Name");
		},
		
			openCreateFloatDialog: function () {
			/*var indices = this.byId("table").getSelectedIndices();
			if (indices.length === 0) {
				sap.m.MessageBox.alert("Please select at least 1 record.", {
					title: "Message"
				});
				return;
			}*/
			this.byId("CreateFloatDialog").open();

		},

		cancelPrepare: function () {
			this.getView().byId("CreateFloatDialog").close();
		},
		
		toDetail: function (FAP) {
			this.getRouter().navTo("Float_Detail", {
				Ibtno: FAP,
				Role: "3",
				Action: "Float_Detail"
			});
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZEFORM.PettyCash.view.Float_Maintenance
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZEFORM.PettyCash.view.Float_Maintenance
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZEFORM.PettyCash.view.Float_Maintenance
		 */
		//	onExit: function() {
		//
		//	}

	});

});