sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController",
	"ZEFORM/Invoice/model/formatter"
], function (BaseController, formatter) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.Close", {

		formatter: formatter,
		onInit: function () {
			this.getRouter().getRoute("Close").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function (oEvent) {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI:List of Closed Invoices & Reasons");
			}
			this.changeBackBtnEventToHome();
		},

		onBeforeExport: function (oEvt) {
			var mExcelSettings = oEvt.getParameter("exportSettings");
			if (mExcelSettings.url) {
				return;
			}
			mExcelSettings.fileName = "List of Closed Invoices & Reasons";
			// 			mExcelSettings.workbook.context.sheetName = "List of Closed Invoices & Reasons";
			if (mExcelSettings.workbook && mExcelSettings.workbook.columns) {
				mExcelSettings.workbook.columns.some(function (oColumnConfiguration) {
					if ($.inArray(oColumnConfiguration.property, ["Invdate", "Cldate", "Lastupdate", "Duedate"]) > -1) {
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
			oEvent.getSource().getBasicSearchControl().setPlaceholder("Search By Invoice Number or Description");
			// 			oEvent.getSource().search();
		}
	});
});