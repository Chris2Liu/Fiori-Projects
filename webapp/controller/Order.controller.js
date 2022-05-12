sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"ZEFORM/PettyCash/model/formatter",
	"sap/ui/core/Core",
	"sap/ui/core/library"
], function (BaseController, JSONModel, Filter, formatter, Core, CoreLibrary) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Order", {

		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * @memberOf ZEFORM.PettyCash.view.Order
		 */
		onInit: function () {
			this.getRouter().getRoute("Order").attachPatternMatched(this._onMatched, this);
			this.getRouter().getRoute("Order_Action").attachPatternMatched(this._onMatched, this);
			this.role = "1";
			this.initCss();
			this.initEvent();
		},

		_onMatched: function (oEvent) {
                        // git test
			this.resetFormBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("Petty Cash Claim");
			}
			var that = this;
			if (!that.getModel()) {
				return;
			}
			this.getUserId();
			this.resetModel();
			var parameter = oEvent.getParameter("arguments");
			var claimno = parameter.Pcno;
			var role = parameter.Role;
			var action = parameter.Action;
			this.Action = action;
			if (claimno) {
				this.role = role;
				this.readPC(claimno);
			} else {
				this.role = "1";
				this.getAdmin();
				this.getInd();
			}
			this.getCurrDept();
			this.checkAdmin();
			this.initFields();
		},

		resetFormBackBtn: function () {

			var backBtn = sap.ui.getCore().byId("backBtn");
			if (!backBtn) {
				return;
			}
			var that = this;
			backBtn.detachAllEventHandlers("press");
			backBtn.attachPress(function () {
				var data = that.getTargetAction();
				that.toExternal(data);
			});
		},

		getTargetAction: function () {
			if (!this.getModel("PC").getProperty("/Claimno") && !this.isNoPermission) {
				return {
					semanticObject: "#",
					action: ""
				};
			}

			if (this.Action === "display") {
				return {
					semanticObject: "ZEFORM_PC",
					action: "Worklist_General"
				};
			}

			if (this.role === "1") {
				return {
					semanticObject: "ZEFORM_PC",
					action: "Worklist_Preparer"
				};
			}
			if (this.role === "2") {
				return {
					semanticObject: "ZEFORM_PC",
					action: "Worklist_Admin"
				};
			}
			if (this.role === "3") {
				return {
					semanticObject: "ZEFORM_PC",
					action: "Worklist_ITU"
				};
			}

			return null;
		},

		toExternal: function (data) {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (!data) {
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
				return;
			}

			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: data.semanticObject,
					action: data.action
				},
				params: {}
			})) || "";
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});
		},

		getUserId: function (fn) {
			var that = this;
			this.callFunction("GET_USERID", {}, function (data, response) {
				that.UserId = data.USRID;
				if (fn) {
					fn();
				}
			});
		},

		getInd: function () {
			var that = this;
			var parameters = {
				Input: ""
			};
			this.callFunction("GET_IND", parameters, function (oData, response) {
				that.getModel("PC").setProperty("/HeaderInd", oData.HeaderInd);
				that.getModel("PC").setProperty("/ItemAccInd", oData.ItemAccInd);
				that.getModel("PC").setProperty("/ProductTypeInd", oData.ProductTypeInd);
				that.getModel("PC").setProperty("/BudgCodeInd", oData.BudgCodeInd);
				that.getModel("PC").setProperty("/PrjIdInd", oData.PrjIdInd);
				that.initFields();
			}, function (oData, response) {

			});
		},

		getAdmin: function () {
			var that = this;
			var parameters = {
				Input: "DeptCode"
			};
			this.callFunction("GET_ADMIN", parameters, function (data, response) {
				that.getModel("PC").setProperty("/Admin", data.Field);
				that.getModel("PC").setProperty("/DeptCode", data.Field);
				that.initFields();
			}, function (data, response) {
				that.getModel("PC").setProperty("/Admin", "");
			});
		},

		checkAdmin: function () {
			var that = this;
			var parameters = {
				Input: ""
			};
			this.callFunction("CHECK_ADMIN", parameters, function (data, response) {
				that.isChecker = data.Field;
			}, function (data, response) {
				that.isChecker = "";
			});
		},

		getCurrDept: function () {
			var that = this;
			var parameters = {
				Input: ""
			};
			this.callFunction("GET_ADMIN", parameters, function (data, response) {
				that.currentDept = data.Field;
				that.gdlgrp = data.Field;
				that.getModel("PC").setProperty("/DeptCode", data.Field);
				that.readSectionSet();
				that.readProductTypeSet();
				that.readProjectIdSet();
				that.readBudgetCodeSet();
				that.initFields();
			}, function (data, response) {
				that.currentDept = "";
			});
		},

		openHeadReferenceDialog: function () {
			var oData = this.getModel("PC").getData();
			oData.REF = [];
			for (var key in oData) {
				oData.REF[key] = oData[key];
			}
			oData.REF.Reference6Visible = (oData.HeaderInd === "X");
			oData.REF.Reference7Visible = (oData.HeaderInd === "X");
			oData.REF.Reference8Visible = (oData.HeaderInd === "X");
			oData.REF.Reference9Visible = (oData.HeaderInd === "X");
			oData.REF.Reference10Visible = (oData.HeaderInd === "X");
			this.getModel("PC").setData(oData);
			this.byId("refDialog").open();

		},

		onRef: function () {
			var oData = this.getModel("PC").getData();
			for (var key in oData.REF) {
				oData[key] = oData.REF[key];
			}
			this.getModel("PC").setData(oData);
			this.byId("refDialog").close();
		},

		closeHeadReferenceDialog: function () {
			this.byId("refDialog").close();
		},

		openAccRefDialog: function (oEvent) {
			var oData = this.getModel("PC").getData();
			var property = oEvent.getSource().getParent().getBindingContext("PC").getProperty();
			oData.accREF = [];
			for (var key1 in property) {
				oData.accREF[key1] = property[key1];
			}
			this.byId("accReferenceTitle").setText("Item " + property.Claimitm + " References");
			this.getModel("PC").setData(oData);
			this.initFields();
			this.byId("accRefDialog").open();
			if (oData.PRODUCT_TYPESet.length === 0 || !oData.ProductTypeInd) {
				oData.accREF.ProductTypeEnabled = false;
			}
			this.getModel("PC").setData(oData);
		},

		saveaccRef: function () {
			var that = this;
			var oData = that.getModel("PC").getData();
			var items = oData.PCHEADTOITEM;
			for (var k = 0; k < items.length; k++) {
				var itemData = items[k];
				if (itemData.Claimitm === oData.accREF.Claimitm) {
					for (var key in oData.accREF) {
						itemData[key] = oData.accREF[key];
					}
					break;
				}
			}
			this.getModel("PC").setData(oData);
			this.byId("accRefDialog").close();
		},

		closeaccRefDialog: function () {
			this.byId("accRefDialog").close();
		},

		changeItemId: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("PC").getProperty();
			var sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			var repeatCount = 0;
			var oData = this.getModel("PC").getData();
			for (var i = 0; i < oData.PCHEADTOITEM.length; i++) {
				var item = oData.PCHEADTOITEM[i];
				if (parseInt(item.Claimitm) === parseInt(property.Claimitm)) {
					repeatCount = repeatCount + 1;
				}
				if (isNaN(item.Claimitm) || item.Claimitm <= 0) {
					this.getModel("PC").setProperty(sPath + "/Claimitm", "");
					this.alert("Item No. must be positive.");
					return;
				}
			}

			if (repeatCount > 1) {
				this.getModel("PC").setProperty(sPath + "/Claimitm", "");
				this.alert("Item No. must be different for each debit item.");
				return;
			}
		},

		itemAddRow: function () {
			var oData = this.getModel("PC").getData();
			var itemData = {
				Claimitm: this.getItemId(),
				Waers: "HKD",
				Amount: 0.00
			};
			var index = this.byId("itemTable1").getItems().indexOf(this.byId("itemTable1").getSelectedItem());
			if (index > -1) {
				oData.PCHEADTOITEM.splice(index, 0, itemData);
			} else {
				oData.PCHEADTOITEM.push(itemData);
			}
			this.getModel("PC").setData(oData);
			var itemTable = this.byId("itemTable1");
			var focusIndex = index;
			if (focusIndex === -1) {
				focusIndex = itemTable.getItems().length - 1;
			}
			itemTable.rerender();
			itemTable.getItems()[focusIndex].getCells()[1].focus();
			this.byId("itemTable1").removeSelections(true);
		},

		itemRemoveRow: function () {
			var oData = this.getModel("PC").getData();
			var items = this.byId("itemTable1").getSelectedItems();
			if (items.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			for (var i = items.length - 1; i >= 0; i--) {
				var property = items[i].getBindingContext("PC").getProperty();
				for (var j = 0; j < oData.PCHEADTOITEM.length; j++) {
					if (oData.PCHEADTOITEM[j].Claimitm === property.Claimitm) {
						oData.PCHEADTOITEM.splice(j, 1);
						break;
					}
				}
			}
			this.getModel("PC").setData(oData);
			this.byId("itemTable1").removeSelections(true);
		},

		itemCopyRow: function () {
			var oData = this.getModel("PC").getData();
			var items = this.byId("itemTable1").getSelectedItems();
			if (items.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			for (var i = 0; i < items.length; i++) {
				var property = items[i].getBindingContext("PC").getProperty();
				var itemData = {};
				for (var key in property) {
					itemData[key] = property[key];
				}
				itemData.Claimitm = this.getItemId();
				itemData.ClaimitmEnabled = true;
				itemData.Approved = false;
				itemData.Mapped = false;
				itemData.ZapprovedBy = "";
				itemData.ZapprovedByName = "";
				// itemData.ForwardedBy = "";
				// itemData.ForwardedByName = "";
				// itemData.ForwardedTo = "";
				// itemData.ForwardedToName = "";
				itemData.ChgBy = "";
				itemData.CrtBy = "";
				itemData.ChgDate = undefined;
				itemData.ChgTime = undefined;
				itemData.CrtDate = undefined;
				itemData.CrtTime = undefined;
				oData.PCHEADTOITEM.push(itemData);
			}
			this.getModel("PC").setData(oData);
			this.initFields();
		},

		initFields: function () {
			this.initFieldEnabled();
			this.initFieldVisible();
		},

		initFieldEnabled: function () {

			var saveEnabled = this.byId("saveBtn").getEnabled();
			this.initFieldBySaveBtnEnabled(saveEnabled);
			if (!saveEnabled) {
				return;
			}

			var status = this.getModel("PC").getProperty("/Status");

			var oData = this.getModel("PC").getData();

			var role = this.role;

			oData.MessageEnabled = (role === "3" && $.inArray(status, ["07", "08", "09"]) > -1) ? true : false;
			oData.RdpiuEnabled = ($.inArray(role, ["1", "2"]) > -1) ? true : false;

			if (!oData.BudgCodeInd) {
				for (var i = 0; i < oData.PCHEADTOITEM.length; i++) {
					var bcItem = oData.PCHEADTOITEM[i];
					bcItem.BudgCodeEnabled = false;
				}
			}

			if (!oData.PrjIdInd) {
				for (var j = 0; j < oData.PCHEADTOITEM.length; j++) {
					var prjItem = oData.PCHEADTOITEM[j];
					prjItem.PrjIdEnabled = false;
				}
			}

			this.getModel("PC").setData(oData);

			if ($.inArray(role, ["1", "2"]) > -1 && $.inArray(status, ["06", "08", "09"]) > -1) {
				this.initFieldBySaveBtnEnabled(false);
				oData = this.getModel("PC").getData();
				for (var key in oData) {
					if (key.indexOf("Reference") > -1 && key.indexOf("Enabled") > -1) {
						oData[key] = true;
						continue;
					}
					if (key === "PCHEADTOITEM") {
						for (var k = 0; k < oData[key].length; k++) {
							for (var key1 in oData[key][k]) {
								if (key1.indexOf("Reference") > -1 && key1.indexOf("Enabled") > -1) {
									oData[key][k][key1] = true;
								}
							}
						}
					}
				}
				this.getModel("PC").setData(oData);
			}

		},

		initFieldBySaveBtnEnabled: function (saveEnabled) {
			var oData = this.getModel("PC").getData();
			for (var key in oData) {
				if (!oData[key] || typeof (oData[key]) !== "object") {
					if (key.indexOf("Enabled") > -1) {
						oData[key] = saveEnabled;
					} else {
						oData[key + "Enabled"] = saveEnabled;
					}
					continue;
				}

				//日期类型typeof (oData[key])也会等于object
				if (oData[key].getDate) {
					if (key.indexOf("Enabled") > -1) {
						oData[key] = saveEnabled;
					} else {
						oData[key + "Enabled"] = saveEnabled;
					}
				}

				if (Array.isArray(oData[key])) {
					if (key === "PCHEADTOITEM") {
						for (var i = 0; i < oData[key].length; i++) {
							for (var key2 in oData[key][i]) {

								if (key === "PCHEADTOITEM" && (key2 === "ClaimitmEnabled" || key2 === "Claimitm")) {
									continue;
								}

								if (key === "PCHEADTOCREDIT" && (key2 === "ClaimitmEnabled" || key2 === "Claimitm")) {
									continue;
								}

								if (key2.indexOf("Enabled") > -1) {
									oData[key][i][key2] = saveEnabled;
								} else {
									oData[key][i][key2 + "Enabled"] = saveEnabled;
								}
							}
						}
					}
				} else {
					if (key === "REF" || key === "accREF") {
						for (var key1 in oData[key]) {
							if (key1.indexOf("Enabled") > -1) {
								oData[key][key1] = saveEnabled;
							} else {
								oData[key][key1 + "Enabled"] = saveEnabled;
							}
						}
					}
				}

			}
			this.getModel("PC").setData(oData);
		},

		initFieldVisible: function () {
			// var status = this.getModel("PC").getProperty("/Status");

			var oData = this.getModel("PC").getData();

			var role = this.role;

			oData.AssignmentVisible = role === "3" ? true : false;
			oData.RemarkFoVisible = role === "3" ? true : false;

			this.getModel("PC").setData(oData);

		},

		resetModel: function () {
			var jsonData = {
				PCHEADTOITEM: [],
				PCHEADTODOC: [],
				PCHEADTOLOG: [],
				SELECTIONSET: [],
				AUFNRSet: [],
				PRODUCT_TYPESet: [],
				PROJECT_IDSet: [],
				BUDGETCODESet: [],
				SECTIONSet: [],
				STAFFSet: [],
				FOHOLDREASON: {},
				FUNDCHECKSet: [],
				GLSet: [],
				REF: {},
				Status: "0",
				approveEndorserSpath: "",
				accSpath: "",
				Lastchange: ""
			};
			var oModel = new JSONModel(jsonData);
			this.setModel(oModel, "PC");
			this.initButtons();
			this.initFields();
		},

		getItemId: function () {
			var items = this.getModel("PC").getData().PCHEADTOITEM;
			var maxClaimitm = 0;
			for (var i = 0; i < items.length; i++) {
				var Claimitm = parseInt(items[i].Claimitm, 10);
				if (Claimitm > maxClaimitm) {
					maxClaimitm = Claimitm;
				}
			}
			return (parseInt(maxClaimitm / 10, 10) * 10 + 10).toString();
		},

		initButtons: function () {
			var objectIdArray = ["createBtn", "copyBtn", "saveBtn", "uploadBtn", "previewBtn", "printBtn", "changeLogBtn", "deleteBtn",
				"reimburseBtn", "reassignBtn"
			];

			for (var key in objectIdArray) {
				var objectId = objectIdArray[key];
				var enabled = this.getButtonEnabled(objectId);
				var visible = this.getButtonVisible(objectId);
				if (this.Action === "display") {
					visible = ($.inArray(objectId, ["uploadBtn", "changeLogBtn", "previewBtn"]) > -1);
					enabled = ($.inArray(objectId, ["uploadBtn", "changeLogBtn", "previewBtn"]) > -1);
				}
				if (this.byId(objectId)) {
					this.byId(objectId).setVisible(visible).setEnabled(enabled);
				}
			}

			var otherBtnEnabled = true;
			var saveEnabled = this.byId("saveBtn").getEnabled();
			var status = this.getModel("PC").getProperty("/Status");
			if (saveEnabled === false || ($.inArray(this.role, ["1", "2"]) > -1 && $.inArray(status, ["06", "08", "09"]) > -1) || ($.inArray(
					this.role, ["3"]) > -1 && $.inArray(status, ["07", "08", "09"]) > -1)) {
				otherBtnEnabled = false;
			}
			var buttonIdArray = [
				"itemAddRowBtn",
				"itemRemoveRowBtn",
				"itemCopyRowBtn"
			];
			for (var buttonKey in buttonIdArray) {
				var buttonId = buttonIdArray[buttonKey];
				if (this.byId(buttonId)) {
					this.byId(buttonId).setEnabled(otherBtnEnabled);
				}
			}

		},

		getButtonEnabled: function (objectId) {

			if ($.inArray(this.role, ["1", "2", "3"]) < 0) {
				return false;
			}

			var result = false;
			var role = this.role;
			var oData = this.getModel("PC").getData();
			var status = oData.Status;
			if (!status) {
				status = "0";
			}
			switch (objectId) {
			case "createBtn":
				if (role === "1") {
					result = true;
				}
				break;
			case "copyBtn":
				if (status >= "01" && role === "1") {
					result = true;
				}
				break;
			case "saveBtn":
				if (($.inArray(status, ["0", "01", "06", "08", "09"]) > -1 && role === "1") ||
					($.inArray(status, ["03", "04", "05", "06", "08", "09"]) > -1 && role === "2") ||
					($.inArray(status, ["06", "07", "08", "09"]) > -1 && role === "3")) {
					result = true;
				}
				break;
			case "uploadBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			case "previewBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			case "printBtn":
				if ((status !== "0" && status !== "02" && role === "2") || ($.inArray(status, ["06", "07", "08", "09"]) > -1 && role === "3")) {
					result = true;
				}
				break;
			case "changeLogBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			case "deleteBtn":
				if ((status === "01" && role === "1") || (status === "03" && role === "2")) {
					result = true;
				}
				break;
			case "reimburseBtn":
				if (status === "01" && role === "2") {
					result = true;
				}
				break;
			case "reassignBtn":
				if (role === "2") {
					result = true;
				}
				break;
			case "emailBtn":
				result = true;
				break;
			}
			return result;

		},

		getButtonVisible: function (objectId) {

			if ($.inArray(this.role, ["1", "2", "3"]) < 0) {
				return false;
			}
			var result = false;
			var role = this.role;
			switch (role) {
			case "1": //Preparer
				if ($.inArray(objectId, ["createBtn", "copyBtn", "saveBtn", "uploadBtn", "previewBtn", "changeLogBtn", "deleteBtn"]) > -1) {
					result = true;
				}
				break;
			case "2": //Administrator
				if ($.inArray(objectId, ["saveBtn", "uploadBtn", "previewBtn", "printBtn", "changeLogBtn", "deleteBtn", "reimburseBtn",
						"reassignBtn"
					]) > -1) {
					result = true;
				}
				break;
			case "3": //ITU
				if ($.inArray(objectId, ["saveBtn", "uploadBtn", "previewBtn", "printBtn", "changeLogBtn"]) > -1) {
					result = true;
				}
				break;
			}
			return result;

		},

		refreshTotal: function () {
			var oData = this.getModel("PC").getData();
			var Tolamt = 0;
			for (var j = 0; j < oData.PCHEADTOITEM.length; j++) {
				if (oData.PCHEADTOITEM[j].Amount) {
					Tolamt = Tolamt + parseFloat(oData.PCHEADTOITEM[j].Amount);
				}
			}
			this.getModel("PC").setProperty("/Tolamt", Tolamt.toFixed(2));
			this.initFields();
		},

		changeAmount: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			var value = oEvent.getSource().getValue();
			if (!value) {
				this.getModel("PC").setProperty(sPath + "/Amount", undefined);
				return;
			}
			value = parseFloat(this.moneyToNumber(value));
			if (isNaN(value)) {
				oEvent.getSource().setValue("");
				this.getModel("PC").setProperty(sPath + "/Amount", undefined);
			} else {
				this.getModel("PC").setProperty(sPath + "/Amount", parseFloat(value));
			}
			this.refreshTotal();
		},

		changeClaimDatfr: function () {
			var oDP = this.byId("claimDatfrDatePicker");
			if (oDP._bValid === false) {
				this.alert("Claims Date Range From is invalid.");
				this.byId("claimDatfrDatePicker").setDateValue(undefined);
				return;
			}
		},

		changeClaimDatto: function () {
			var oDP = this.byId("claimDattoDatePicker");
			if (oDP._bValid === false) {
				this.alert("Claims Date Range To is invalid.");
				this.byId("claimDattoDatePicker").setDateValue(undefined);
				return;
			}

			if (this.byId("claimDattoDatePicker").getDateValue() - this.byId("claimDatfrDatePicker").getDateValue() < 0) {
				this.alert("Claims Date Range To must be greater than or equal to Claims Date Range From.");
				this.byId("claimDattoDatePicker").setDateValue(undefined);
				return;
			}
		},

		openDocDialog: function () {
			var that = this;
			that.byId("docFile").setValue("");
			var oData = this.getModel("PC").getData();
			oData.PCHEADTODOCTemp = [];
			that.byId("loadingDialog").open();
			this.getModel().read("/PCHEADSet('" + oData.Claimno + "')/PCHEADTODOC", {
				success: function (sdata, response) {
					var jsonData = that.getModel("PC").getData();
					jsonData.PCHEADTODOC = [];
					for (var i = 0; i < sdata.results.length; i++) {
						var data = sdata.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.PCHEADTODOC.push(itemData);
					}
					for (var j = 0; j < oData.PCHEADTODOC.length; j++) {
						var item = oData.PCHEADTODOC[j];
						var docData = {};
						for (var key1 in item) {
							docData[key1] = item[key1];
						}
						oData.PCHEADTODOCTemp.push(docData);
					}
					that.getModel("PC").setData(jsonData);
					that.byId("loadingDialog").close();
					that.byId("docDialog").open();
				},
				error: function (oError) {
					that.byId("loadingDialog").close();
				}
			});
		},

		docAddRow: function () {
			var oFileUploader = this.byId("docFile");
			if (!oFileUploader.getValue()) {
				this.alert("Choose a file first");
				return;
			}
			var oData = this.getModel("PC").getData();
			var reader = new FileReader();
			var file = this.byId("docFile").getFocusDomRef().files[0];
			var base64Marker = ";base64";
			var fileType = file.type;
			var fileName = this.byId("docFile").getValue();
			reader.readAsDataURL(file);
			var that = this;
			reader.onload = function (e) {
				var base64Index = this.result.indexOf(base64Marker) + base64Marker.length;
				var base64 = this.result.substring(base64Index);

				var b64Data = base64.replace(",", "");
				var blob = that.b64toBlob(b64Data, fileType);

				if (blob.size > 10485760) {
					that.alert("Unable to upload as the file size of " + fileName + " is over 10MB.");
					return;
				}

				oData.PCHEADTODOCTemp.push({
					Content: base64,
					Fname: fileName,
					Doctype: fileType
				});
				that.getModel("PC").setData(oData);
			};
		},

		docRemoveRow: function () {
			var oData = this.getModel("PC").getData();
			var selectedItems = this.byId("docTable").getSelectedItems();
			if (selectedItems.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			var items = this.byId("docTable").getItems();
			for (var j = selectedItems.length - 1; j >= 0; j--) {
				for (var i = 0; i < items.length; i++) {
					if (selectedItems[j] === items[i]) {
						oData.PCHEADTODOCTemp.splice(i, 1);
						break;
					}
				}
			}
			this.getModel("PC").setData(oData);
			this.byId("docTable").removeSelections(true);
		},

		downloadDoc: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("PC").getProperty();
			var b64Data = property.Content.replace(",", "");

			var fileType = property.Doctype;
			var fileName = property.Fname;
			var arr = fileName.split(".");
			var suffix = ["PDF", "TXT"];
			if (arr[1].toUpperCase() === "PDF") {
				fileType = "application/pdf";
			} else if (arr[1].toUpperCase() === "TXT") {
				fileType = "text/plain";
			}
			var downloadLink = document.getElementById("downloadLink");
			var blob = this.b64toBlob(b64Data, fileType);
			if (!downloadLink) {
				downloadLink = document.createElement("a");
				downloadLink.id = "downloadLink";
				document.body.append(downloadLink);
			}
			downloadLink.download = fileName;
			downloadLink.href = URL.createObjectURL(blob);

			var str = sap.ui.Device.browser.name;
			if ($.inArray(arr[1].toUpperCase(), suffix) > -1 && blob.size < 20971520 && $.inArray(str, ["ff", "cr", "sf"]) > -1) {
				window.open(downloadLink.href);
			} else {
				downloadLink.click();
			}
		},

		saveDocument: function () {
			var oData = this.getModel("PC").getData();
			var oEntry = {
				Claimno: oData.Claimno,
				PCHEADTODOC: oData.PCHEADTODOCTemp,
				Parameter: "doc",
				Role: this.role
			};
			this.onAutoSave();
			var that = this;
			var interval = setInterval(function () {
				if (that.SaveStatus === 0) {
					return;
				}
				clearInterval(interval);
				if (that.SaveStatus === 1) {
					that.byId("docFile").setValue("");
					that.updateStatus(oEntry);
					that.byId("docDialog").close();
				}
			}, 100);
		},

		closeDocDialog: function () {
			this.byId("docTable").removeSelections(true);
			this.byId("docDialog").close();
		},

		onReimburse: function () {
			var oData = this.getModel("PC").getData();
			var oEntry = {
				Claimno: oData.Claimno,
				PCHEADTODOC: [],
				Parameter: "reimburse",
				Role: this.role
			};
			this.onAutoSave();
			var that = this;
			var interval = setInterval(function () {
				if (that.SaveStatus === 0) {
					return;
				}
				clearInterval(interval);
				if (that.SaveStatus === 1) {
					that.updateStatus(oEntry);
				}
			}, 100);
		},

		openPrepareDialog: function () {
			var that = this;
			var filters = [
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Role", sap.ui.model.FilterOperator.EQ, "1")
					],
					and: false
				})
			];
			var jsonData = that.getModel("PC").getData();
			jsonData.STAFFSet = [];
			that.byId("loadingDialog").open();
			this.getModel().read("/STAFFSet", {
				filters: filters,
				success: function (oData, oResponse) {
					that.byId("loadingDialog").close();
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}
						jsonData.STAFFSet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
					that.byId("prepareDialog").open();
				},
				error: function (oError) {

				}
			});

		},

		closePrepareDialog: function () {
			this.byId("prepareDialog").close();
		},

		prepare: function () {
			var oData = this.getModel("PC").getData();
			var oEntry = {
				Claimno: oData.Claimno,
				PreparedBy: this.byId("newPrepare").getSelectedKey(),
				Parameter: "prepare",
				PCHEADTODOC: []
			};
			this.updateStatus(oEntry);
			this.getView().byId("prepareDialog").close();
		},

		getBudgetHolder: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("PC").getProperty();
			var sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			this.callBudgetHolder(property, sPath);
		},

		callBudgetHolder: function (property, sPath) {
			var preparedBy;
			var deptCode = this.getModel("PC").getProperty("/DeptCode");
			preparedBy = this.getModel("PC").getProperty("/PreparedBy");

			if (!preparedBy) {
				preparedBy = this.UserId;
			}

			var oRole = this.role;

			if (oRole === "2") {
				oRole = "3";
			}

			if (oRole === "3") {
				oRole = "7";
			}

			var that = this;

			that.byId("loadingDialog").open();
			this.getModel().callFunction("/GET_BUDGET_HOLDER", {
				method: "GET",
				urlParameters: {
					Aufnr: property.Aufnr ? property.Aufnr : "",
					Gsber: property.Gsber ? property.Gsber : "",
					Kostl: property.Kostl ? property.Kostl : "",
					Projn: property.Projn ? property.Projn : "",
					RequestedBy: preparedBy ? preparedBy : "",
					I_BUDG_CODE: property.BudgCode ? property.BudgCode : "",
					I_DEPT_CODE: deptCode ? deptCode : "",
					I_CUR_USR_ROLE: oRole,
					I_GL_AC: property.Sakto ? property.Sakto : ""
				},
				success: function (data, response) {
					that.getModel("PC").setProperty(sPath + "/Bukrs", data.Bukrs);
					that.getModel("PC").setProperty(sPath + "/Gsber", data.Gsber);
					that.getModel("PC").setProperty(sPath + "/Kostl", data.Kostl);
					that.getModel("PC").setProperty(sPath + "/Projn", data.Projn);
					that.getModel("PC").setProperty(sPath + "/Aufnr", data.Aufnr);
					that.getModel("PC").setProperty(sPath + "/Name1", data.Name1);
					that.getModel("PC").setProperty(sPath + "/Budhd", data.Budhd);
					that.getModel("PC").setProperty(sPath + "/BudgCode", data.BudgCode);
					that.getModel("PC").setProperty(sPath + "/StaffRptDept", data.StaffRptDept);
					that.byId("loadingDialog").close();
				},
				error: function (oError) {}
			});
		},

		businessAreaValueHelp: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			this.sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			this.getModel("PC").setProperty("/accSpath", sPath);
			var sInputValue = oEvent.getSource().getValue();
			var businessAreaSelectDialog = this.byId("businessAreaTableSelectDialog");
			businessAreaSelectDialog.getBinding("items").filter([new Filter("Gtext", sap.ui.model.FilterOperator.Contains, sInputValue)]);
			businessAreaSelectDialog.open(sInputValue);
		},

		businessAreaValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter("Gtext", sap.ui.model.FilterOperator.Contains, sValue);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		businessAreaValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				var sPath = this.getModel("PC").getProperty("/accSpath") + "/Gsber";
				this.getModel("PC").setProperty(sPath, data.Gsber);
				var property = this.getModel("PC").getProperty(this.sPath);
				this.callBudgetHolder(property, this.sPath);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		productTypeValueHelp: function (oEvent) {
			this.sPath = oEvent.getSource().mBindingInfos.value.binding.sPath;
			var sInputValue = oEvent.getSource().getValue();
			var productTypeSelectDialog = this.byId("productTypeTableSelectDialog");
			productTypeSelectDialog.getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("PrdType", sap.ui.model.FilterOperator.Contains, sInputValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue)
					],
					and: false
				})
			]);
			productTypeSelectDialog.open(sInputValue);
		},

		productTypeValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			evt.getSource().getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("PrdType", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				})
			]);
		},

		productTypeValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				this.getModel("PC").setProperty(this.sPath, data.PrdType);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		aufnrValueHelp: function (oEvent) {
			this.sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			var sInputValue = oEvent.getSource().getValue();
			var that = this;
			var jsonData = that.getModel("PC").getData();
			if (this.currentDept === undefined) {
				this.currentDept = "";
			}

			jsonData.AUFNRSet = [];
			var filters;
			filters = [new sap.ui.model.Filter("DeptCode", sap.ui.model.FilterOperator.EQ, this.currentDept)];
			that.getModel().read("/AUFNRSet", {
				filters: filters,
				success: function (oData, oResponse) {
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.AUFNRSet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
					var aufnrSelectDialog = that.byId("aufnrTableSelectDialog");
					aufnrSelectDialog.getBinding("items").filter([
						new sap.ui.model.Filter({
							filters: [
								new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, sInputValue),
								new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue)
							],
							and: false
						})
					]);
					aufnrSelectDialog.open(sInputValue);
				},
				error: function (oError) {

				}
			});
		},

		aufnrValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			evt.getSource().getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				})
			]);
		},

		aufnrValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				this.getModel("PC").setProperty(this.sPath + "/Aufnr", data.Aufnr);
				var property = this.getModel("PC").getProperty(this.sPath);
				this.callBudgetHolder(property, this.sPath);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		changeCategory: function (oEvent) {
			if (oEvent) {
				var sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
				// var property = oEvent.getSource().getParent().getBindingContext("PC").getProperty();
				this.getModel("PC").setProperty(sPath + "/Category", "");
			}
		},

		acCodeValueHelp: function (oEvent) {
			this.sPath = oEvent.getSource().getParent().getBindingContext("PC").sPath;
			var property = this.getModel("PC").getProperty(this.sPath);
			var that = this;
			var jsonData = that.getModel("PC").getData();
			jsonData.GLSet = [];
			var oCode;
			if (property.BudgCode !== undefined) {
				oCode = property.BudgCode;
			} else {
				oCode = "";
			}
			var filters = [new sap.ui.model.Filter("BudgCode", sap.ui.model.FilterOperator.EQ, oCode)];
			var sInputValue = oEvent.getSource().getValue();
			that.getModel().read("/GLSet", {
				filters: filters,
				success: function (oData, oResponse) {
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.GLSet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
					var acCodeSelectDialog = that.byId("acCodeTableSelectDialog");
					var aFilter = new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter("GlAcc", sap.ui.model.FilterOperator.Contains, sInputValue),
							new sap.ui.model.Filter("ShortDesc", sap.ui.model.FilterOperator.Contains, sInputValue),
							new sap.ui.model.Filter("LongDesc", sap.ui.model.FilterOperator.Contains, sInputValue)
						],
						and: false
					});
					acCodeSelectDialog.getBinding("items").filter(aFilter);
					acCodeSelectDialog.open(sInputValue);
				},
				error: function (oError) {
					var acCodeSelectDialog = that.byId("acCodeTableSelectDialog");
					acCodeSelectDialog.open(oError);
				}
			});
		},

		acCodeValueHelpSearch: function (evt) {
			var acCodeSelectDialog = this.byId("acCodeTableSelectDialog");
			var sValue = evt.getParameter("value");
			var aFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("GlAcc", sap.ui.model.FilterOperator.Contains, sValue),
					new sap.ui.model.Filter("ShortDesc", sap.ui.model.FilterOperator.Contains, sValue),
					new sap.ui.model.Filter("LongDesc", sap.ui.model.FilterOperator.Contains, sValue)
				],
				and: false
			});
			acCodeSelectDialog.getBinding("items").filter(aFilter);
		},

		acCodeValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				this.getModel("PC").setProperty(this.sPath + "/Sakto", data.GlAcc);
				this.getModel("PC").setProperty(this.sPath + "/Category", data.LongDesc);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		// Input Help

		readSectionSet: function () {
			var that = this;
			var jsonData = that.getModel("PC").getData();
			jsonData.SECTIONSet = [];
			var oCode;
			if (jsonData.DeptCode !== undefined) {
				oCode = jsonData.DeptCode;
			} else {
				oCode = "";
			}

			var filters = [new sap.ui.model.Filter("DeptCode", sap.ui.model.FilterOperator.EQ, oCode)]; //jsonData.DeptCode
			that.getModel().read("/SECTIONSet", {
				filters: filters,
				success: function (oData, oResponse) {
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.SECTIONSet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readProductTypeSet: function () {
			var that = this;
			var jsonData = that.getModel("PC").getData();
			jsonData.PRODUCT_TYPESet = [];
			var filters = [new sap.ui.model.Filter("DeptCode", sap.ui.model.FilterOperator.EQ, this.currentDept)];
			that.getModel().read("/PRODUCT_TYPESet", {
				filters: filters,
				success: function (oData, oResponse) {
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.PRODUCT_TYPESet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readProjectIdSet: function () {
			var that = this;
			var jsonData = that.getModel("PC").getData();
			jsonData.PROJECT_IDSet = [];
			var filters = [new sap.ui.model.Filter("DeptCode", sap.ui.model.FilterOperator.EQ, this.gdlgrp)];
			that.getModel().read("/PROJECT_IDSet", {
				filters: filters,
				success: function (oData, oResponse) {
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.PROJECT_IDSet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readBudgetCodeSet: function () {
			var that = this;
			var jsonData = that.getModel("PC").getData();
			jsonData.BUDGETCODESet = [];
			var filters = [new sap.ui.model.Filter("DeptCode", sap.ui.model.FilterOperator.EQ, this.gdlgrp)];
			that.getModel().read("/BUDGETCODESet", {
				filters: filters,
				success: function (oData, oResponse) {
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.BUDGETCODESet.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		//Save Claim FM
		onSave: function () {
			var that = this;
			if (that.checkData() === false) {
				return;
			}
			var oEntry = this.getSaveEntry();

			oEntry.Role = this.role;

			// if (oRole === "2") {
			// 	oEntry.Role = "3";
			// }

			// if (oRole === "3") {
			// 	oEntry.Role = "7";
			// }

			if (oEntry.ClaimDatfr) {
				oEntry.ClaimDatfr.setHours(8);
			}
			if (oEntry.ClaimDatto) {
				oEntry.ClaimDatto.setHours(8);
			}

			this.byId("loadingDialog").open();
			var oHeaders = {
				"MyETag": oEntry.Lastchange.trim()
			};
			this.getModel().create("/PCHEADSet", oEntry, {
				method: "POST",
				headers: oHeaders,
				success: function (oData, response) {
					that.byId("loadingDialog").close();
					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);

						if (dataJson.severity === "error") {
							if (dataJson.message.search("is processing by") > -1 || dataJson.message.search(
									"has just been updated by another user. Please reload this e-form and make your changes again.") > -1) {
								sap.m.MessageBox.warning(dataJson.message, {
									title: "Warning",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {}
								});
							} else {
								that.alert(dataJson.message);
							}
							return;
						}

						if (that.isCopy === "X" || that.isCreate === "X") {
							var url = location.href;
							var oArray = url.split("/1/create_pc");
							var str = oArray[0].substring(oArray[0].length - 10);
							url = url.replace(str, oData.Claimno);
							window.location.href = url;
						}
						that.isCopy = "";
						that.isCreate = "";

						if (dataJson.severity === "info") {
							var details = dataJson.details;
							if (dataJson.message) {
								details.push(dataJson);
							}

							var warningMessageArray = [];
							for (var i = 0; i < details.length; i++) {
								if (details[i].severity === "warning" || details[i].severity === "info") {
									warningMessageArray.push(details[i].message);
									continue;
								}
							}

							if (warningMessageArray.length > 0) {
								that.alert(warningMessageArray.join("\n"));
							} else {
								that.alert(dataJson.message);
							}

							that.readPC(oData.Claimno);
						}

						if (dataJson.severity === "warning") {
							that.alert(dataJson.message);
							that.readPC(oData.Claimno);
						}
					}
				},
				error: function (oError) {
					that.alert(oError.message);
					that.byId("loadingDialog").close();
				}
			});
		},

		onAutoSave: function () {
			var that = this;
			if (that.checkData() === false) {
				that.SaveStatus = -1;
				return;
			}
			var oEntry = this.getSaveEntry();
			if (oEntry.ClaimDatfr) {
				oEntry.ClaimDatfr.setHours(8);
			}
			if (oEntry.ClaimDatto) {
				oEntry.ClaimDatto.setHours(8);
			}
			oEntry.Role = this.role;
			that.SaveStatus = 0;
			that.byId("loadingDialog").open();
			var oHeaders = {
				"MyETag": oEntry.Lastchange.trim()
			};
			this.getModel().create("/PCHEADSet", oEntry, {
				method: "POST",
				headers: oHeaders,
				success: function (oData, response) {
					that.byId("loadingDialog").close();
					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);
						if (dataJson.severity === "error") {
							that.SaveStatus = 0;
							if (dataJson.message.search("is processing by") > -1 || dataJson.message.search(
									"has just been updated by another user. Please reload this e-form and make your changes again.") > -1) {
								sap.m.MessageBox.warning(dataJson.message, {
									title: "Warning",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {}
								});
							} else {
								that.alert(dataJson.message);
							}
							return;
						}
						that.SaveStatus = 1;
						that.readPC(oData.Claimno);
					}
				},
				error: function (oError) {
					that.alert(oError.message);
					that.byId("loadingDialog").close();
				}
			});
		},

		onCopy: function () {

			var oData = this.getModel("PC").getData();
			oData.CrtDate = undefined;
			oData.PreparerName = "";
			oData.Cusapbelnr = "";
			oData.Cusapbudat = undefined;
			oData.Claimno = "";
			oData.Batchno = "";
			oData.Statustext = "";
			oData.Status = "";
			oData.ReturnReason = "";
			oData.RejectReason = "";
			oData.CancelReason = "";
			oData.AdminApproved = "";
			oData.Administrator = "";
			oData.Rdpiu = "";
			oData.Remarkinfofo = "";
			oData.RemarkFo = "";
			oData.Message = "";
			oData.Lastchange = "";
			oData.Adminto = "";
			this.isCopy = "X";
			this.getModel("PC").setData(oData);
			this.initButtons();
			this.initFields();
		},

		onCreate: function () {
			this.resetModel();
			this.getAdmin();
			this.getInd();
			this.getCurrDept();
			this.initButtons();
			this.isCreate = "X";
		},

		onPreview: function () {
			this.alert("Preview clicked.");
			// var oData = this.getModel("PC").getData();
			// var url = window.location.protocol + "//" + window.location.host + this.getModel().sServiceUrl + "/PDFSet(No='" + oData.Claimno +
			// 	"',Preview='',Version='')/$value";
			// var filename = "Preview-" + oData.Claimno + ".pdf";
			// var str = sap.ui.Device.browser.name;
			// if ($.inArray(str, ["ff", "cr"]) > -1) {
			// 	this.openPDF(url);
			// } else {
			// 	this.download(url, filename);
			// }
		},

		onPrint: function () {
			this.alert("Print clicked.");
			// var that = this;
			// var oEntry = {
			// 	Claimno: oData.Claimno,
			// 	Parameter: "print",
			// 	RVHEADTOITEM: []
			// };
			// this.updateStatus(oEntry, true, function () {
			// 	var url = window.location.protocol + "//" + window.location.host + that.getModel().sServiceUrl + "/PDFSet(No='" + oData.Claimno +
			// 		"',Preview='',Version='')/$value";
			// 	var filename = "Print Petty Cash Claim -" + oData.Claimno + ".pdf";
			// 	that.download(url, filename);
			// });
		},

		openLogDialog: function () {
			var that = this;
			var oData = this.getModel("PC").getData();
			this.byId("changeLogFilter").setValue();
			var jsonData = {};
			jsonData.LOGSet = [];
			that.byId("loadingDialog").open();
			this.getModel().read("/PCHEADSet('" + oData.Claimno + "')/PCHEADTOLOG", {
				success: function (data, response) {
					that.byId("loadingDialog").close();
					for (var i = 0; i < data.results.length; i++) {
						var sdata = data.results[i];
						var itemData = {};
						for (var key in sdata) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = sdata[key];
						}

						jsonData.LOGSet.push(itemData);
					}
					var oModel = new JSONModel(jsonData);
					that.setModel(oModel, "Log");
					that.byId("logDialog").open();
				},
				error: function (oError) {

				}
			});
		},

		closeLogDialog: function () {
			this.byId("logDialog").close();
		},

		filterChangeLog: function () {
			var filter = new Filter([
				new Filter("Ddtext", sap.ui.model.FilterOperator.Contains, this.byId("changeLogFilter").getValue())
			], false);
			this.byId("logTable").getBinding("rows").filter(filter, "Application");
		},

		getSaveEntry: function () {
			var oData = this.getModel("PC").getData();
			var oEntry = {
				PCHEADTOITEM: [],
				PCHEADTODOC: [],
				PCHEADTOLOG: []
			};
			for (var key in oData) {
				if ($.inArray(key, ["__metadata", "REF", "accREF", "approveEndorserSpath", "accSpath", "FUNDCHECKSet",
						"PRODUCT_TYPESet", "SECTIONSet", "AUFNRSet", "PCHEADTODOCTemp", "STAFFSet", "PROJECT_IDSet", "BUDGETCODESet", "GLSet",
						"FORWPERSSet", "FOHOLDREASON", "SELECTIONSET"
					]) > -1) {
					continue;
				}

				if (key.indexOf("Enabled") > -1 || key.indexOf("Visible") > -1) {
					continue;
				}

				if (key === "PCHEADTOITEM") {
					for (var k = 0; k < oData.PCHEADTOITEM.length; k++) {
						var item = oData.PCHEADTOITEM[k];
						var itemData = {};
						for (var itemKey in item) {
							if (itemKey.indexOf("Enabled") > -1 || itemKey.indexOf("Visible") > -1 || itemKey.indexOf("Description_Temp") > -1) {
								continue;
							}
							if (typeof (item[itemKey]) === "number") {
								itemData[itemKey] = item[itemKey].toString();
							} else {
								itemData[itemKey] = item[itemKey];
							}
						}
						oEntry.PCHEADTOITEM.push(itemData);
					}
					continue;
				}

				if (typeof (oData[key]) === "number") {
					oEntry[key] = oData[key].toString();
				} else {
					oEntry[key] = oData[key];
				}
			}
			return oEntry;
		},

		checkData: function () {

			var errorMessageArray = [];
			var result = true;
			var oData = this.getModel("PC").getData();

			if (!oData.Admin) {
				errorMessageArray.push("Float Admin Party cannot be blank.");
				result = false;
			}

			if (!oData.PcDept || oData.PcDept.trim() === "") {
				errorMessageArray.push("Department cannot be blank.");
				result = false;
			}

			if (!oData.ClaimName || oData.ClaimName.trim() === "") {
				errorMessageArray.push("Claimant Name cannot be blank.");
				result = false;
			}

			if (oData.Tolamt <= "0.00") {
				errorMessageArray.push("The total amounts must be greater than zero.");
				result = false;
			}

			if (oData.PCHEADTOITEM.length === 0) {
				errorMessageArray.push("At least 1 item must be input.");
				result = false;
			}

			var oTotalAmt = 0;

			for (var i = 0; i < oData.PCHEADTOITEM.length; i++) {
				var oItem = oData.PCHEADTOITEM[i];
				if (!oItem.Claimitm) {
					this.alert("Claim Item No. cannot be blank.");
					return false;
				}
				if (oItem.Amount === undefined) {
					errorMessageArray.push("Claim Item No. " + parseInt(oItem.Claimitm, 10) + " : Amount cannot be blank. ");
					result = false;
				}

				if (oItem.Amount < 0) {
					errorMessageArray.push("Claim Item No. " + parseInt(oItem.Claimitm, 10) + " : Amount cannot be negative. ");
					result = false;
				}

				if ((!oItem.Gsber) && (!oItem.Kostl) && (!oItem.Projn) && (!oItem.Aufnr) && (!oItem.Sakto)) {
					errorMessageArray.push("Credit Item No. " + parseInt(oItem.Claimitm, 10) +
						": Please complete the input of funding source for its account assignment.");
					result = false;
				}

				oTotalAmt = oTotalAmt + oItem.Amount;

			}

			if ((parseFloat(oTotalAmt).toFixed(2) !== parseFloat(this.totalAmt).toFixed(2)) && $.inArray(oData.Status, ["03", "04", "05"]) > -1) {
				this.alert(
					"Claim’s total amount cannot be changed once it has been reimbursed. \n" +
					"Please delete this claim and create a new claim.\n" +
					"If batch has been generated for this claim, please cancel the batch first in order to delete this claim."
				);
				return false;
			}

			if (!result) {
				this.alert(errorMessageArray.join("\n"));
				return false;
			}

			return true;

		},

		checkAdminParty: function (oEvent) {
			var admin = oEvent.getSource().getValue();
			if (!admin) {
				return;
			}
			var parameters = {
				Input: admin
			};
			var that = this;
			this.callFunction("CHECK_ADMIN_PARTY", parameters, function (data, response) {
				that.getModel("PC").setProperty("/Admin", data.Field);
			}, function (data, response) {
				that.getModel("PC").setProperty("/Admin", "");
			});
		},

		readPC: function (claimno) {
			var that = this;
			that.byId("loadingDialog").open();
			this.getModel().read("/PCHEADSet('" + claimno + "')", {
				urlParameters: {
					action: this.Action,
					role: this.role
				},
				success: function (oData, oResponse) {
					if (oResponse.headers["sap-message"]) {
						var dataJson = JSON.parse(oResponse.headers["sap-message"]);
						if (dataJson.severity === "error") {
							that.isNoPermission = true;
							that.alert(dataJson.message, function () {
								window.location.replace(location.href.split("#")[0] + "#Shell-home");
							});
							return;
						}
					}
					that.isNoPermission = false;
					var jsonData = that.getModel("PC").getData();
					for (var key in oData) {
						if (key === "__metadata") {
							continue;
						}
						jsonData[key] = oData[key];
					}
					jsonData.PCHEADTOITEM = [];
					jsonData.PCHEADTODOC = [];
					jsonData.PCHEADTOLOG = [];
					jsonData.PRODUCT_TYPESet = [];
					jsonData.PROJECT_IDSet = [];
					jsonData.AUFNRSet = [];
					jsonData.SECTIONSet = [];
					jsonData.BUDGETCODESet = [];
					jsonData.GLSet = [];
					that.totalAmt = oData.Tolamt;
					that.getModel("PC").setData(jsonData);
					that.initButtons();
					that.initFields();
					that.readItem(claimno);
					setTimeout(function () {
						that.byId("loadingDialog").close();
					}, 3000);
				},
				error: function (oError) {

				}
			});
		},

		readItem: function (claimno) {
			var that = this;
			this.getModel().read("/PCHEADSet('" + claimno + "')/PCHEADTOITEM", {
				success: function (oData, oResponse) {
					var jsonData = that.getModel("PC").getData();
					jsonData.PCHEADTOITEM = [];
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}
						itemData.ClaimitmEnabled = false;
						jsonData.PCHEADTOITEM.push(itemData);
					}
					that.getModel("PC").setData(jsonData);
					that.initFields();
				},
				error: function (oError) {

				}
			});
		},

		onDelete: function () {
			var that = this;
			var oData = this.getModel("PC").getData();
			if (this.role === "1") {
				sap.m.MessageBox.confirm("Are you sure to delete the Claim No. " + oData.Claimno + " ?", {
					onClose: function (sButton) {
						if (sButton === sap.m.MessageBox.Action.OK) {
							var oEntry = {
								Claimno: oData.Claimno,
								Parameter: "delete",
								PCHEADTOITEM: []
							};
							that.updateStatus(oEntry);
						}
					}
				});
			} else {
				if (this.UserId === oData.Adminto) {
					this.alert("A reimbursed claim can only be deleted by another administrator who didn’t reimburse this claim.");
					return;
				}
				sap.m.MessageBox.confirm("Are you sure to delete the Claim No. " + oData.Claimno +
					"?\nPlease make sure that this reimbursed claim has been refunded if you are to delete it.", {
						onClose: function (sButton) {
							if (sButton === sap.m.MessageBox.Action.OK) {
								var oEntry = {
									Claimno: oData.Claimno,
									Parameter: "delete",
									PCHEADTOITEM: []
								};
								that.updateStatus(oEntry);
							}
						}
					});
			}

		},

		updateStatus: function (oEntry, isRefresh, successFn) {
			if (!isRefresh) {
				isRefresh = true;
			}
			var that = this;
			that.byId("loadingDialog").open();
			var oData = that.getModel("PC").getData();
			var oHeaders = {
				"MyETag": oData.Lastchange.trim()
			};
			this.getModel().create("/PCHEADSet", oEntry, {
				method: "POST",
				headers: oHeaders,
				success: function (sData, response) {
					that.byId("loadingDialog").close();

					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);

						if (dataJson.severity === "error") {
							if (dataJson.message.search("is processing by") > -1 || dataJson.message.search(
									"has just been updated by another user. Please reload this e-form and make your changes again.") > -1) {
								sap.m.MessageBox.warning(dataJson.message, {
									title: "Warning",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {}
								});
							} else {
								that.alert(dataJson.message);
								that.readPC(oEntry.Claimno);
							}
							return;
						}
						if (dataJson.severity === "info") {
							var details = dataJson.details;
							if (dataJson.message) {
								details.push(dataJson);
							}

							var warningMessageArray = [];
							for (var i = 0; i < details.length; i++) {
								if (details[i].severity === "warning" || details[i].severity === "info") {
									warningMessageArray.push(details[i].message);
									continue;
								}
							}

							if (warningMessageArray.length > 0) {
								that.alert(warningMessageArray.join("\n"));
							} else {
								that.alert(dataJson.message);
							}
							that.Parameter = oEntry.Parameter;
							that.readPC(oEntry.Claimno);

						}
						if (dataJson.severity === "warning") {
							that.alert(dataJson.message);
							return;
						}
						if (isRefresh) {
							// 			that.readPC(oEntry.Claimno);
						}
						if (successFn) {
							successFn();
						}
						return;
					}
					if (isRefresh) {
						that.readPC(oEntry.Claimno);
					}
					if (successFn) {
						successFn();
					}
				},
				error: function (oError) {
					that.byId("loadingDialog").close();
					that.alert(oError.message);
				}
			});
		}

	});

});
