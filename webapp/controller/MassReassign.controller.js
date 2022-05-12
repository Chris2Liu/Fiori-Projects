sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.MassReassign", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZEFORM.PettyCash.view.MassReassign
		 */
		onInit: function () {
			this.getRouter().getRoute("MassReassign").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function () {
			this.resetBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("PC: Mass Reassignment of Preparers");
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

		onBeforeExport: function (oEvt) {
			var mExcelSettings = oEvt.getParameter("exportSettings");
			if (mExcelSettings.url) {
				return;
			}
			mExcelSettings.fileName = "Mass Reassignment of Preparers(PC)";
		},

		openPrepareDialog: function () {
			var indices = this.byId("table").getSelectedIndices();
			if (indices.length === 0) {
				sap.m.MessageBox.alert("Please select at least 1 record.", {
					title: "Message"
				});
				return;
			}
			this.byId("prepareDialog").open();

		},

		cancelPrepare: function () {
			this.getView().byId("prepareDialog").close();
		},

		prepare: function () {
			var indices = this.byId("table").getSelectedIndices();
			var that = this;
			that.updateAll = indices.length;
			that.updateComplete = 0;
			that.updateSuccess = 0;
			that.getModel().setUseBatch(false);
			for (var i = 0; i < indices.length; i++) {
				var property = this.byId("table").getContextByIndex(indices[i]).getObject();
				var oEntry = {
					Claimno: property.Claimno,
					PreparedBy: that.byId("newPrepare").getSelectedKey(),
					Parameter: "prepare",
					IsWorklist: "X",
					PCHEADTODOC: []
				};
				that.getView().getModel().create("/PCHEADSet", oEntry, {
					method: "POST",
					success: function (oData, response) {

						that.updateComplete = that.updateComplete + 1;

						if (response.headers["sap-message"]) {
							var dataJson = JSON.parse(response.headers["sap-message"]);
							if (dataJson.severity === "error") {
								sap.m.MessageBox.alert(dataJson.message, {
									title: "Message"
								});
								return;
							}
						}
						that.updateSuccess = that.updateSuccess + 1;
					},
					error: function (oError) {
						that.updateComplete = that.updateComplete + 1;
						sap.m.MessageBox.alert("line:" + i.toString() + ",message:" + oError.message, {
							title: "Message"
						});
					}
				});

			}
			var interval = setInterval(function () {

				if (that.updateComplete !== that.updateAll) {
					return;
				}

				clearInterval(interval);

				if (that.updateSuccess === that.updateAll) {
					sap.m.MessageBox.alert("Preparer has been updated.", {
						title: "Message"
					});
				}

				that.byId("table").clearSelection();
				that.getModel().setUseBatch(true);
				that.getModel().refresh();
			}, 200);
			this.byId("prepareDialog").close();
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZEFORM.PettyCash.view.MassReassign
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZEFORM.PettyCash.view.MassReassign
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZEFORM.PettyCash.view.MassReassign
		 */
		//	onExit: function() {
		//
		//	}

	});

});