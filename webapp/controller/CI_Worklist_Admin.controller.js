sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController",
	"ZEFORM/Invoice/model/formatter"
], function (BaseController, formatter) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.CI_Worklist_Admin", {

		formatter: formatter,
		onInit: function () {
			this.getRouter().getRoute("CI_Worklist_Admin").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function (oEvent) {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI: Worklist for Administrator");
			}
			this.changeBackBtnEventToHome();
			if (this.byId("smartFilterBar")._bIsInitialized === true) {
				this.byId("smartFilterBar").search();
			}
		},

		onBeforeExport: function (oEvt) {
			var mExcelSettings = oEvt.getParameter("exportSettings");
			if (mExcelSettings.url) {
				return;
			}
			mExcelSettings.fileName = "Worklist for Admin";
			if (mExcelSettings.workbook && mExcelSettings.workbook.columns) {
				mExcelSettings.workbook.columns.some(function (oColumnConfiguration) {
					if ($.inArray(oColumnConfiguration.property, ["Invdate", "ChgDate","Duedate"]) > -1) {
						oColumnConfiguration.style = "medium";
						oColumnConfiguration.format = "dd.mm.yyyy";
					}
				});
			}
		},

		onInitSmartTable: function (oEvent) {
			this.byId("smarttable")._oVariantManagement.setShowShare(false);
		},

		onInitSmartFilterBar: function (oEvent) {
			this.byId("smartFilterBar")._oVariantManagement.setShowShare(false);
			oEvent.getSource().getBasicSearchControl().setPlaceholder("Search By Customer Name or Item Description");
			var sDefaultVariantKey = this.byId("smartFilterBar").getVariantManagement().getDefaultVariantKey();
			if (sDefaultVariantKey === "*standard*") {
				this.byId("smartFilterBar").getVariantManagement().bExecuteOnSelectForStandardViaXML = true;
				this.byId("smartFilterBar").getVariantManagement().bExecuteOnSelectForStandardByUser = true;
			}
			this.byId("smartFilterBar").search();
		},

		onPressCino: function (oEvent) {
			var cino = oEvent.oSource.getText();
			this.toDetail(cino);
		},

		toDetail: function (cino) {
			this.getRouter().navTo("CustomerInvoice_Action", {
				Cino: cino,
				Role: "3",
				Action: "create_ci"
			});
		}
	});
});