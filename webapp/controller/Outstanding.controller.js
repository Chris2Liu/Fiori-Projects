sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController",
	"ZEFORM/Invoice/model/formatter"
], function (BaseController, formatter) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.Outstanding", {

		formatter: formatter,
		onInit: function () {
			this.getRouter().getRoute("Outstanding").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function (oEvent) {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI: Outstanding Invoices Report");
			}
			this.changeBackBtnEventToHome();
		},

		onBeforeExport: function (oEvt) {
			var mExcelSettings = oEvt.getParameter("exportSettings");
			if (mExcelSettings.url) {
				return;
			}
			// 			mExcelSettings.fileName = "List of Closed Invoices &amp; Reasons";
			if (mExcelSettings.workbook && mExcelSettings.workbook.columns) {
				mExcelSettings.workbook.columns.some(function (oColumnConfiguration) {
					if ($.inArray(oColumnConfiguration.property, ["Invdate", "Lastupdate","Duedate"]) > -1) {
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