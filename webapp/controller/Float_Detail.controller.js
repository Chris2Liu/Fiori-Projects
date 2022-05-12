sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Float_Detail", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZEFORM.PettyCash.view.Float_Detail
		 */
		onInit: function () {
			this.initCss();
			var oData = this.getModel();
		},
		
		openFloatDialog: function () {
			this.byId("FloatDialog").open();      
		},
		
		cancelFloatDialog: function() {
			this.getView().byId("FloatDialog").close();       
		},
		
		cancelFloat: function() {
			var status = this.status ;
			var amt;
			
			
			
			
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZEFORM.PettyCash.view.Float_Detail
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZEFORM.PettyCash.view.Float_Detail
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZEFORM.PettyCash.view.Float_Detail
		 */
		//	onExit: function() {
		//
		//	}

	});

});