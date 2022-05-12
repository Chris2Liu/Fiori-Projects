sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Worklist_Preparer", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Preparer
		 */
		onInit: function () {
			this.getRouter().getRoute("Worklist_Preparer").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function () {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("PC: Worklist for Preparer");
			}
			this.changeBackBtnEventToHome();
			if (this.byId("smartFilterBar")._bIsInitialized === true) {
				this.byId("smartFilterBar").search();
			}

		},

		onInitSmartFilterBar: function (oEvent) {
			this.byId("smartFilterBar")._oVariantManagement.setShowShare(false);
			oEvent.getSource().getBasicSearchControl().setPlaceholder("Search by Claimant name or Category");
			var sDefaultVariantKey = this.byId("smartFilterBar").getVariantManagement().getDefaultVariantKey();
			if (sDefaultVariantKey === "*standard*") {
				this.byId("smartFilterBar").getVariantManagement().bExecuteOnSelectForStandardViaXML = true;
				this.byId("smartFilterBar").getVariantManagement().bExecuteOnSelectForStandardByUser = true;
			}
			this.byId("smartFilterBar").search();
		},

		onInitSmartTable: function (oEvent) {
			this.byId("smarttable")._oVariantManagement.setShowShare(false);
		},

		onPressClaimno: function (oEvent) {
			var claimno = oEvent.oSource.getText();
			this.toDetail(claimno);
		},

		toDetail: function (claimno) {
			this.getRouter().navTo("Order_Action", {
				Pcno: claimno,
				Role: "1",
				Action: "create_rv"
			});
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Preparer
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Preparer
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Preparer
		 */
		//	onExit: function() {
		//
		//	}

	});

});