sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.MassReassignCI", {

		onInit: function () {
			this.getRouter().getRoute("MassReassignCI").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function (oEvent) {
			this.resetBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI: Mass Reassignment of Preparers");
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

		onBeforeExport: function (oEvt) {
			var mExcelSettings = oEvt.getParameter("exportSettings");
			if (mExcelSettings.url) {
				return;
			}
			mExcelSettings.fileName = "Mass Reassignment of Preparers";
		},

		onInitSmartFilterBar: function (oEvent) {

			oEvent.getSource().getBasicSearchControl().setPlaceholder("Search Preparer ID or Preparer Name");
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
					Cino: property.Cino,
					PreparedBy: that.byId("newPrepare").getSelectedKey(),
					Parameter: "prepare",

					CIHEADTOITEM: []
				};
				that.getView().getModel().create("/CIHEADSet", oEntry, {
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

	});

});