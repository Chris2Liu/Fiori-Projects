sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"ZEFORM/Invoice/model/formatter",
	"sap/ui/core/Core",
	"sap/ui/core/library"
], function (BaseController, JSONModel, Filter, formatter, Core, CoreLibrary) {
	"use strict";

	var ValueState = CoreLibrary.ValueState;

	return BaseController.extend("ZEFORM.Invoice.controller.CustomerInvoice", {

		formatter: formatter,

		onInit: function () {
			this.getRouter().getRoute("CustomerInvoice").attachPatternMatched(this._onMatched, this);
			this.getRouter().getRoute("CustomerInvoice_Action").attachPatternMatched(this._onMatched, this);
			this.role = "1";
			this.resetModel();
			this.initCss();
			this.initEvent();
			Core.attachParseError(
				function (oEvent) {
					var oElement = oEvent.getParameter("element");

					if (oElement.setValueState) {
						oElement.setValueState(ValueState.Error);
					}
				});

			Core.attachValidationSuccess(
				function (oEvent) {
					var oElement = oEvent.getParameter("element");

					if (oElement.setValueState) {
						oElement.setValueState(ValueState.None);
					}
				});
			// 			var invdatePicker = this.getView().byId("InvoiceDatePicker");
			// 			invdatePicker.addEventDelegate({
			// 				onAfterRendering: function (oEvent) {
			// 					document.getElementById(oEvent.srcControl.sId).getElementsByTagName("INPUT")[0].disabled = true;
			// 				}
			// 			}, invdatePicker);

			// 			var paymentDueDatePicker = this.getView().byId("PaymentDueDatePicker");
			// 			paymentDueDatePicker.addEventDelegate({
			// 				onAfterRendering: function (oEvent) {
			// 					document.getElementById(oEvent.srcControl.sId).getElementsByTagName("INPUT")[0].disabled = true;
			// 				}
			// 			}, paymentDueDatePicker);

		},

		_onMatched: function (oEvent) {
			this.resetFormBackBtn();
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("Customer Invoice");
			}
			var that = this;
			if (!that.getModel()) {
				return;
			}
			this.getUserId();
			var parameter = oEvent.getParameter("arguments");
			var cino = parameter.Cino;
			var role = parameter.Role;
			var action = parameter.Action;
			this.Action = action;
			if (cino) {
				this.role = role;
				this.readCI(cino);
			} else {
				this.role = "1";
				this.getAdmin();
			}
			this.getInd();
			this.getGdlgrp();
			this.initFields();
		},

		resetModel: function () {
			var jsonData = {
				CIHEADTOITEM: [],
				CIHEADTOPATH: [],
				CIHEADTOPATHTemp: [],
				CIHEADTOAPP: [],
				CIHEADTODOC: [],
				CIHEADTODOCTemp: [],
				STAFFSet: [],
				AUFNRSet: [],
				CIITEMTOACC: [],
				PRODUCT_TYPESet: [],
				PROJECT_IDSet: [],
				BUDGETCODESet: [],
				SECTIONSet: [],
				GLSet: [],
				REF: {},
				ITEMREF: {},
				Status: "0",
				accCiitem: "",
				approveEndorserSpath: "",
				accSpath: "",
				Lastchange: ""
			};
			var oModel = new JSONModel(jsonData);
			this.setModel(oModel, "CI");
			this.initButtons();
			this.initFields();
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

		getGdlgrp: function () {
			var that = this;
			var parameters = {
				Input: ""
			};
			this.callFunction("GET_ADMIN", parameters, function (data, response) {
				that.gdlgrp = data.Field;
			});
		},

		getInd: function () {
			var that = this;
			this.getModel().callFunction("/GET_IND", {
				method: "GET",
				success: function (oData, response) {
					that.getModel("CI").setProperty("/HeaderInd", oData.HeaderInd);
					that.getModel("CI").setProperty("/ItemAccInd", oData.ItemAccInd);
					that.getModel("CI").setProperty("/ProductTypeInd", oData.ProductTypeInd);
					that.getModel("CI").setProperty("/BudgCodeInd", oData.BudgCodeInd);
					that.getModel("CI").setProperty("/PrjIdInd", oData.PrjIdInd);
					that.initFields();
				},
				error: function (oError) {}
			});
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

		getTargetAction: function () {
			if (!this.getModel("CI").getProperty("/Cino") && !this.isNoPermission) {
				return {
					semanticObject: "#",
					action: ""
				};
			}

			if (this.Action === "display") {
				return {
					semanticObject: "ZEFORM_CI",
					action: "Worklist_General"
				};
			}

			if (this.role === "1") {
				return {
					semanticObject: "ZEFORM_CI",
					action: "Worklist_Preparer"
				};
			}
			if (this.role === "2") {
				return {
					semanticObject: "ZEFORM_CI",
					action: "Worklist_Endorser"
				};
			}
			if (this.role === "3") {
				return {
					semanticObject: "ZEFORM_CI",
					action: "Worklist_Admin"
				};
			}
			return null;
		},

		readCI: function (cino) {
			this.byId("itemTable").removeSelections(true);
			this.byId("accTable").removeSelections(true);
			var that = this;
			that.byId("loadingDialog").open();
			this.getModel().read("/CIHEADSet('" + cino + "')", {
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
					var jsonData = that.getModel("CI").getData();
					for (var key in oData) {
						if (key === "__metadata") {
							continue;
						}
						jsonData[key] = oData[key];
					}
					jsonData.CIHEADTOITEM = [];
					jsonData.AUFNRSet = [];
					jsonData.CIHEADTOAPP = [];
					jsonData.PRODUCT_TYPESet = [];
					jsonData.SECTIONSet = [];
					jsonData.PROJECT_IDSet = [];
					jsonData.BUDGETCODESet = [];
					jsonData.GLSet = [];
					that.getModel("CI").setData(jsonData);
					that.initButtons();
					that.initFields();
					that.readItem(cino);
					that.readAufnrSet();
					that.readPath(cino);
					that.readApp(cino);
					// 	that.readDoc(cino);
					that.readProductTypeSet();
					that.readSectionSet();
					that.readBudgetCodeSet();
					that.readProjectIdSet();
					setTimeout(function () {
						that.byId("loadingDialog").close();
					}, 3000);
				},
				error: function (oError) {

				}
			});
		},

		readProjectIdSet: function () {
			var that = this;
			var jsonData = that.getModel("CI").getData();
			jsonData.PROJECT_IDSet = [];
			var filters = [
				new sap.ui.model.Filter("DeptCode",
					sap.ui.model.FilterOperator.EQ,
					jsonData.DeptCode)
			];
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
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readBudgetCodeSet: function () {
			var that = this;
			var jsonData = that.getModel("CI").getData();
			jsonData.BUDGETCODESet = [];
			var filters = [
				new sap.ui.model.Filter("DeptCode",
					sap.ui.model.FilterOperator.EQ,
					jsonData.DeptCode)
			];
			that.getModel().read("/BUDGETCODESet", {
				filters: filters,
				success: function (oData, oResponse) {;
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
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readSectionSet: function () {
			var that = this;
			var jsonData = that.getModel("CI").getData();
			jsonData.SECTIONSet = [];
			var filters = [
				new sap.ui.model.Filter("DeptCode",
					sap.ui.model.FilterOperator.EQ,
					jsonData.DeptCode)
			];
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
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readProductTypeSet: function () {
			var that = this;
			var jsonData = that.getModel("CI").getData();
			jsonData.PRODUCT_TYPESet = [];
			var filters = [
				new sap.ui.model.Filter("DeptCode",
					sap.ui.model.FilterOperator.EQ,
					jsonData.DeptCode)
			];

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
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readPath: function (cino) {
			var that = this;
			this.getModel().read("/CIHEADSet('" + cino + "')/CIHEADTOPATH", {
				success: function (oData, oResponse) {
					var jsonData = that.getModel("CI").getData();
					jsonData.CIHEADTOPATH = [];
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}
						itemData.CIHEADTOPATH = [];
						jsonData.CIHEADTOPATH.push(itemData);
					}

					that.getModel("CI").setData(jsonData);
					that.initButtons();
				},
				error: function (oError) {

				}
			});
		},

		readItem: function (cino) {
			var that = this;
			this.getModel().read("/CIHEADSet('" + cino + "')/CIHEADTOITEM", {
				success: function (oData, oResponse) {
					var jsonData = that.getModel("CI").getData();
					jsonData.CIHEADTOITEM = [];
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}
						itemData.CIITEMTOACC = [];
						itemData.CiitemEnabled = false;
						// 		itemData.Description_Temp = itemData.Description.split("\n")[0];
						itemData.Description_Temp = itemData.Description.substring(0, 50);
						jsonData.CIHEADTOITEM.push(itemData);

					}
					that.getModel("CI").setData(jsonData);
					that.initFields();
					that.readAcc(cino);
				},
				error: function (oError) {

				}
			});
		},

		readAcc: function (cino) {
			var that = this;
			var filters = [
				new sap.ui.model.Filter("Cino",
					sap.ui.model.FilterOperator.EQ,
					cino)
			];
			this.getModel().read("/CIACCSet", {
				filters: filters,
				success: function (oData, oResponse) {
					var jsonData = that.getModel("CI").getData();
					var items = jsonData.CIHEADTOITEM;
					for (var i = 0; i < items.length; i++) {
						var item = items[i];
						item.CIITEMTOACC = [];
					}
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}
						itemData.ZekknEnabled = false;
						for (var j = 0; j < items.length; j++) {
							var item = items[j];
							if (item.Ciitem === itemData.Ciitem) {
								item.CIITEMTOACC.push(itemData);
								break;
							}
						}
					}
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readDoc: function (cino) {
			var that = this;
			this.getModel().read("/CIHEADSet('" + cino + "')/CIHEADTODOC", {
				success: function (oData, oResponse) {
					var jsonData = that.getModel("CI").getData();
					jsonData.CIHEADTODOC = [];
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.CIHEADTODOC.push(itemData);
					}
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
		},

		readApp: function (cino) {
			var that = this;
			this.getModel().read("/CIHEADSet('" + cino + "')/CIHEADTOAPP", {
				success: function (oData, oResponse) {
					var jsonData = that.getModel("CI").getData();
					jsonData.CIHEADTOAPP = [];
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}
						jsonData.CIHEADTOAPP.push(itemData);
					}
					that.getModel("CI").setData(jsonData);
					that.initFields();
				},
				error: function (oError) {

				}
			});
		},

		initFields: function () {
			this.initFieldEnabled();
			this.initFieldVisible();
		},

		initFieldVisible: function () {

			var oData = this.getModel("CI").getData();

			if (oData.ItemAccInd === "X") {
				oData.BudgCodeVisible = true;
				oData.PrjIdVisible = true;
			} else {
				oData.BudgCodeVisible = false;
				oData.PrjIdVisible = false;
			}

			this.getModel("CI").setData(oData);
		},

		initFieldEnabled: function () {
			var saveEnabled = this.byId("saveBtn").getEnabled();
			this.initFieldBySaveBtnEnabled(saveEnabled);
			if (!saveEnabled) {
				return;
			}

			var status = this.getModel("CI").getProperty("/Status");

			var oData = this.getModel("CI").getData();

			var role = this.role;

			if (!oData.ProductTypeInd && oData.ITEMREF) {
				oData.ITEMREF.ProductTypeEnabled = false;
			}

			// 			if (oData.Method === "1" && (($.inArray(status, ["01", "03", "07", "08"]) > -1 && role === "1") || ($.inArray(status, ["03", "07",
			// 					"08"
			// 				]) > -1 && role === "3"))) {
			// 				this.byId("printBtn").setEnabled(true);
			// 				this.byId("emailBtn").setEnabled(false);
			// 			}

			// 			if (oData.Method === "2" && (($.inArray(status, ["01", "03", "07", "08"]) > -1 && role === "1") || ($.inArray(status, ["03", "07",
			// 					"08"
			// 				]) > -1 && role === "3"))) {
			// 				this.byId("printBtn").setEnabled(false);
			// 				this.byId("emailBtn").setEnabled(true);
			// 			}

			this.getModel("CI").setData(oData);

			if (($.inArray(status, ["03", "07", "08", "10", "11"]) > -1 && role === "1") || ($.inArray(status, ["03", "07", "08", "10", "11"]) >
					-1 && role === "3")) {
				this.initFieldBySaveBtnEnabled(false);
				oData = this.getModel("CI").getData();
				for (var key in oData) {
					if (key.indexOf("Reference") > -1 && key.indexOf("Enabled") > -1) {
						oData[key] = true;
						continue;
					}
					if (key === "CIHEADTOITEM") {
						for (var i = 0; i < oData[key].length; i++) {
							for (var key1 in oData[key][i]) {
								if (key1.indexOf("Reference") > -1 && key1.indexOf("Enabled") > -1) {
									oData[key][i][key1] = true;
								}

							}
						}
					}
				}
				if (oData.ProductTypeInd) {
					oData.ITEMREF.ProductTypeEnabled = true;
				}
				this.getModel("CI").setData(oData);
				return;
			}
		},

		initFieldBySaveBtnEnabled: function (saveEnabled) {
			var oData = this.getModel("CI").getData();
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
					if (key === "CIHEADTOITEM" || key === "CIITEMTOACC" || key === "CIHEADTOAPP" || key === "CIHEADTOPATHTemp") {
						for (var i = 0; i < oData[key].length; i++) {
							for (var key2 in oData[key][i]) {

								if (key === "CIHEADTOITEM" && (key2 === "CiitemEnabled" || key2 === "Ciitem")) {
									continue;
								}

								if (key === "CIITEMTOACC" && (key2 === "ZekknEnabled" || key2 === "Zekkn")) {
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
					if (key === "REF" || key === "ITEMREF") {
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
			this.getModel("CI").setData(oData);
		},

		initButtons: function () {

			var objectIdArray = ["createBtn", "copyBtn", "openBtn", "editBtn", "deleteBtn", "saveBtn", "uploadBtn",
				"pathBtn", "previewBtn", "printBtn", "emailBtn", "staBtn", "steBtn", "returnBtn", "approveBtn", "closeBtn", "switchBtn",
				"logBtn"
			];

			for (var key in objectIdArray) {
				var objectId = objectIdArray[key];
				var enabled = this.getButtonEnabled(objectId);
				var visible = this.getButtonVisible(objectId);
				if (this.Action === "display") {
					visible = ($.inArray(objectId, ["previewBtn", "uploadBtn", "logBtn"]) > -1);
					enabled = ($.inArray(objectId, ["previewBtn", "uploadBtn", "logBtn"]) > -1);
				}
				if (this.byId(objectId)) {
					this.byId(objectId).setVisible(visible).setEnabled(enabled);
				}
			}

			var otherBtnEnabled = true;
			var saveEnabled = this.byId("saveBtn").getEnabled();
			var status = this.getModel("CI").getProperty("/Status");
			if (saveEnabled === false || ($.inArray(status, ["03", "08", "07", "10", "11"]) > -1 && this.role === "1") || ($.inArray(status, [
					"03",
					"07", "08", "10", "11"
				]) > -1 && this.role === "3")) {
				otherBtnEnabled = false;
			}
			var buttonIdArray = [
				"itemAddRowBtn",
				"itemRemoveRowBtn",
				"itemCopyRowBtn",
				"addAccBtn",
				"removeAccBtn",
				"copyAccBtn"
			];
			for (var buttonKey in buttonIdArray) {
				var buttonId = buttonIdArray[buttonKey];
				if (this.byId(buttonId)) {
					this.byId(buttonId).setEnabled(otherBtnEnabled);
				}
			}
		},

		getButtonVisible: function (objectId) {
			if ($.inArray(this.role, ["1", "2", "3", "4", "5"]) < 0) {
				return false;
			}

			var result = false;
			var role = this.role;
			switch (role) {
			case "1": //Preparer
				if ($.inArray(objectId, [
						"createBtn",
						"copyBtn",
						"editBtn",
						"saveBtn",
						"pathBtn",
						"uploadBtn",
						"previewBtn",
						"printBtn",
						"emailBtn",
						"staBtn",
						"steBtn",
						"logBtn",
						"deleteBtn"
					]) > -1) {
					result = true;
				}
				break;
			case "2": //Endorser
				if ($.inArray(objectId, [
						"returnBtn",
						"approveBtn",
						"previewBtn",
						"uploadBtn",
						"pathBtn",
						"logBtn"
					]) > -1) {
					result = true;
				}
				break;
			case "3": //Administrator
				if ($.inArray(objectId, [
						"pathBtn",
						"returnBtn",
						"approveBtn",
						"closeBtn",
						"saveBtn",
						"printBtn",
						"emailBtn",
						"previewBtn",
						"switchBtn",
						"uploadBtn",
						"logBtn",
						"deleteBtn"
					]) > -1) {
					result = true;
				}
				break;
			}

			return result;
		},

		getButtonEnabled: function (objectId) {
			if ($.inArray(this.role, ["1", "2", "3", "4", "5"]) < 0) {
				return false;
			}

			var result = false;
			var role = this.role;
			var oData = this.getModel("CI").getData();
			var status = oData.Status;
			if (!status) {
				status = "0";
			}
			switch (objectId) {
			case "createBtn":
				result = true;
				break;
			case "copyBtn":
				if (status >= "01" && role === "1") {
					result = true;
				}
				break;
			case "deleteBtn":
				if (($.inArray(status, ["01", "04", "06"]) > -1 && role === "1") || ($.inArray(status, ["02", "03", "08"]) > -1 && role === "3") ||
					(oData.AdminApproved !== "X" && $.inArray(status, ["05", "07"]) > -1 && role === "1") || (oData.AdminApproved === "X" && $.inArray(
						status, ["05", "07"]) > -1 && role === "3")) {
					result = true;
				}
				break;
			case "saveBtn":
				if (($.inArray(status, ["0", "01", "04", "06", "07", "03", "08", "10", "11"]) > -1 && role === "1") || (status === "02" && role ===
						"3") ||
					($.inArray(status, ["03", "07", "08", "10", "11"]) > -1 && role === "3")) {
					result = true;
				}
				break;
			case "uploadBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			case "pathBtn":
				if (($.inArray(status, ["01", "04", "06"]) > -1 && role === "1") || ($.inArray(status, ["05"]) > -1 && role === "2") || ($.inArray(
						status, ["02", "05"]) > -1 && role === "3") ||
					(oData.AdminApproved !== "X" && $.inArray(status, ["05"]) > -1 && role === "1")) {
					result = true;
				}
				break;
			case "previewBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			case "printBtn":
				if (($.inArray(status, ["01", "03", "07", "08"]) > -1 && role === "1") || ($.inArray(status, ["03", "07", "08"]) > -1 && role ===
						"3")) {
					result = true;
				}
				break;
			case "emailBtn":
				if (($.inArray(status, ["01", "03", "07", "08"]) > -1 && role === "1") || ($.inArray(status, ["03", "07", "08"]) > -1 && role ===
						"3")) {
					result = true;
				}
				break;
			case "staBtn":
				if ($.inArray(status, ["01", "04", "06"]) > -1) {
					result = true;
				}
				break;
			case "steBtn":
				if ($.inArray(status, ["01", "04", "06"]) > -1 && oData.CIHEADTOPATH.length > 0) {
					result = true;
				}
				break;
			case "returnBtn":
				if ((status === "02" && role === "3") || (status === "05" && role === "2" && this.UserId === oData.Endorser)) {
					result = true;
				}
				break;
			case "approveBtn":
				if ((status === "02" && role === "3") || (status === "05" && role === "2" && this.UserId === oData.Endorser)) {
					result = true;
				}
				break;
			case "closeBtn":
				if ((status === "08" && role === "3")) {
					result = true;
				}
				break;
			case "switchBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			case "logBtn":
				if (status >= "01") {
					result = true;
				}
				break;
			}
			return result;
		},

		checkData: function () {

			var errorMessageArray = [];
			var result = true;
			var oData = this.getModel("CI").getData();

			var reg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;

			if (!this.byId("Department").getValue()) {
				errorMessageArray.push("Department cannot be blank.");
				result = false;
			}

			if (!this.byId("ContractPerson").getValue()) {
				errorMessageArray.push("Department Contact Person cannot be blank.");
				result = false;
			}

			if (!this.byId("ContractPersonEmailAddress").getValue()) {
				errorMessageArray.push("Department Contact Person Email Address cannot be blank.");
				result = false;
			}

			if (!this.byId("ContractPersonPhoneNo").getValue()) {
				errorMessageArray.push("Department Contact Person Phone No. cannot be blank.");
				result = false;
			}

			if (!this.byId("InvoiceDatePicker").getDateValue()) {
				errorMessageArray.push("Invoice Date cannot be blank.");
				result = false;
			}

			if (!this.byId("InvoiceAdminParty").getValue()) {
				errorMessageArray.push("Invoice Admin Party cannot be blank.");
				result = false;
			}

			if (!this.byId("DCA1").getValue()) {
				errorMessageArray.push("Department Correspondence Address Line 1 cannot be blank.");
				result = false;
			}

			if (!this.byId("DCA2").getValue()) {
				errorMessageArray.push("Department Correspondence Address Line 2 cannot be blank.");
				result = false;
			}

			if (!this.byId("CustomerName").getValue()) {
				errorMessageArray.push("Customer Name cannot be blank.");
				result = false;
			}

			// 			if (!this.byId("CustomerEmailAddress").getValue()) {
			// 				errorMessageArray.push("Customer Email Address cannot be blank.");
			// 				result = false;
			// 			}

			if (!this.byId("CPA1").getValue()) {
				errorMessageArray.push("Customer Postal Address Line 1 cannot be blank.");
				result = false;
			}

			if (!oData.Waers) {
				errorMessageArray.push("Currency cannot be blank.");
				result = false;
			}

			if (!oData.Bankaccountno) {
				errorMessageArray.push("Bank Account No. cannot be blank.");
				result = false;
			}

			if (oData.Deptcorraddrl1 && this.byteLength(oData.Deptcorraddrl1) > 45) {
				errorMessageArray.push("Department Correspondence Address Line 1 should be no more than 45 characters long.");
				result = false;
			}

			if (oData.Deptcorraddrl2 && this.byteLength(oData.Deptcorraddrl2) > 45) {
				errorMessageArray.push("Department Correspondence Address Line 2 should be no more than 45 characters long.");
				result = false;
			}

			if (oData.Deptcorraddrl3 && this.byteLength(oData.Deptcorraddrl3) > 45) {
				errorMessageArray.push("Department Correspondence Address Line 3 should be no more than 45 characters long.");
				result = false;
			}

			if (oData.Deptcorraddrl4 && this.byteLength(oData.Deptcorraddrl4) > 45) {
				errorMessageArray.push("Department Correspondence Address Line 4 should be no more than 45 characters long.");
				result = false;
			}

			if (oData.Custpadddrl1 && this.byteLength(oData.Custpadddrl1) > 50) {
				errorMessageArray.push("Customer Postal Address Line 1 should be no more than 50 characters long.");
				result = false;
			}

			if (oData.Custpadddrl2 && this.byteLength(oData.Custpadddrl2) > 50) {
				errorMessageArray.push("Customer Postal Address Line 2 should be no more than 50 characters long.");
				result = false;
			}

			if (oData.Custpadddrl3 && this.byteLength(oData.Custpadddrl3) > 50) {
				errorMessageArray.push("Customer Postal Address Line 3 should be no more than 50 characters long.");
				result = false;
			}

			if (oData.Custpadddrl4 && this.byteLength(oData.Custpadddrl4) > 50) {
				errorMessageArray.push("Customer Postal Address Line 4 should be no more than 50 characters long.");
				result = false;
			}

			if (!this.byId("PaymentDueDatePicker").getDateValue()) {
				errorMessageArray.push("Payment Due Date cannot be blank.");
				result = false;
			}

			var str1 = ",";

			if (this.byId("ContractPersonEmailAddress").getValue()) {
				var str2 = this.byId("ContractPersonEmailAddress").getValue().search(str1);
				if (str2 > -1) {
					errorMessageArray.push(
						"Department Contact Person Email Address: Multiple customer email addresses must be separated by semicolon “;” .");
					result = false;
				} else {
					var emailArray1 = this.byId("ContractPersonEmailAddress").getValue().split(";");
					for (var q = 0; q < emailArray1.length; q++) {
						if (!reg.test(emailArray1[q].trim()) && emailArray1[q].trim() !== "") {
							errorMessageArray.push("Department Contact Person Email Address is invalid.");
							result = false;
						}
					}
				}
			}

			if (this.byId("CustomerEmailAddress").getValue()) {
				var str3 = this.byId("CustomerEmailAddress").getValue().search(str1);
				if (str3 > -1) {
					errorMessageArray.push("Customer Email Address: Multiple customer email addresses must be separated by semicolon “;” .");
					result = false;
				} else {
					var emailArray2 = this.byId("CustomerEmailAddress").getValue().split(";");
					for (var w = 0; w < emailArray2.length; w++) {
						if (!reg.test(emailArray2[w].trim()) && emailArray2[w].trim() !== "") {
							errorMessageArray.push("Customer Email Address is invalid.");
							result = false;
						}
					}
				}
			}

			for (var i = 0; i < oData.CIHEADTOITEM.length; i++) {
				var item = oData.CIHEADTOITEM[i];

				if (!item.Ciitem) {
					this.alert("Line Item Information: Item No. cannot be blank.");
					return false;
				}

				if (!item.Description_Temp) {
					this.alert("Item No." + item.Ciitem + ": Item Description cannot be blank.");
					return false;
				}

				// if (item.Amount === "0.00") {
				// 	this.alert("Item No." + item.Ciitem + ": Amount cannot be 0.00.");
				// 	return false;
				// }

				var totalAmount = 0;
				for (var j = 0; j < item.CIITEMTOACC.length; j++) {
					var acc = item.CIITEMTOACC[j];
					if (acc.Amount === undefined) {
						this.alert("Amount cannot be blank.");
						return false;
					}
					totalAmount = totalAmount + parseFloat(acc.Amount);
				}

				if (totalAmount.toFixed(2) !== parseFloat(item.Amount).toFixed(2) && item.CIITEMTOACC.length > 0) {
					this.alert("Item No." + item.Ciitem +
						":  The total amount of all account assignments must be equal to the amount of the line item."
					);
					return false;
				}
			}

			if (!result) {
				this.alert(errorMessageArray.join("\n"));
				return false;
			}

			return true;
		},

		byteLength: function (str) {
			var intLength = 0;
			for (var i = 0; i < str.length; i++) {
				if ((str.charCodeAt(i) < 0) || (str.charCodeAt(i) > 255))
					intLength = intLength + 2;
				else
					intLength = intLength + 1;
			}
			return intLength;
		},

		onSave: function () {
			var that = this;
			if (that.checkData() === false) {
				return;
			}
			var oEntry = this.getSaveEntry();
			oEntry.Invdate.setHours(8);
			oEntry.Paymentduedate.setHours(8);
			that.byId("loadingDialog").open();
			var oData = that.getModel("CI").getData();
			var oHeaders = {
				"MyETag": oData.Lastchange.trim()
			};
			this.getModel().create("/CIHEADSet", oEntry, {
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
									onClose: function (sButton) {
										if (sButton === sap.m.MessageBox.Action.OK) {} else {

										}
									}
								});
							} else {
								that.alert(dataJson.message);
							}
							return;
						}

						if (that.isCopy === "X" || that.isCreate === "X") {
							var url = location.href;
							var oArray = url.split("/1/create_ci");
							var str = oArray[0].substring(oArray[0].length - 10);
							url = url.replace(parseInt(str), parseInt(oData.Cino));
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
								if (details[i].severity === "warning") {
									warningMessageArray.push(details[i].message);
									continue;
								}
							}

							if (warningMessageArray.length > 0) {
								that.alert(warningMessageArray.join("\n"));
							} else {
								that.alert(dataJson.message);
							}

							that.readCI(oData.Cino);
						}

						if (dataJson.severity === "warning") {
							that.alert(dataJson.message);
							that.readCI(oData.Cino);
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
			oEntry.Invdate.setHours(8);
			oEntry.Paymentduedate.setHours(8);
			that.SaveStatus = 0;
			that.byId("loadingDialog").open();
			var oData = that.getModel("CI").getData();
			var oHeaders = {
				"MyETag": oData.Lastchange.trim()
			};
			this.getModel().create("/CIHEADSet", oEntry, {
				method: "POST",
				headers: oHeaders,
				success: function (oData, response) {
					that.byId("loadingDialog").close();
					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);
						if (dataJson.severity === "error") {
							that.SaveStatus = -1;
							if (dataJson.message.search("is processing by") > -1 || dataJson.message.search(
									"has just been updated by another user. Please reload this e-form and make your changes again.") > -1) {
								sap.m.MessageBox.warning(dataJson.message, {
									title: "Warning",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {
										if (sButton === sap.m.MessageBox.Action.OK) {} else {

										}
									}
								});
							} else {
								that.alert(dataJson.message);
							}
							return;
						}

						that.readCI(oData.Cino);
						setTimeout(function () {
							that.SaveStatus = 1;
						}, 3000);

					}
				},
				error: function (oError) {
					that.alert(oError.message);
				}
			});
		},

		onCopy: function () {

			var oData = this.getModel("CI").getData();
			oData.ChgBy = "";
			oData.CrtBy = "";
			oData.ChgDate = undefined;
			oData.ChgTime = undefined;
			oData.CrtDate = undefined;
			oData.CrtTime = undefined;
			oData.PreparerName = "";
			oData.Cino = "";
			oData.Method = "";
			oData.Statustext = "";
			oData.Status = "";
			oData.ReturnReason = "";
			oData.CloseReason = "";
			oData.DeleteReason = "";
			oData.AdminApproved = "";
			oData.Administrator = "";
			oData.CIHEADTOPATH = [];
			oData.CIHEADTOAPP = [];
			this.isCopy = "X";
			this.getModel("CI").setData(oData);
			this.initButtons();
			this.initFields();
		},

		onCreate: function () {
			this.isCreate = "X";
			this.resetModel();
			this.getAdmin();
			this.getInd();
			this.initButtons();
		},

		getSaveEntry: function () {
			var oData = this.getModel("CI").getData();
			var oEntry = {
				CIHEADTOITEM: [],
				CIHEADTOPATH: [],
				CIHEADTOAPP: []
					// CIHEADTODOC: []
			};
			for (var key in oData) {
				if ($.inArray(key, ["__metadata", "REF", "CIITEMTOACC", "accCiitem", "approveEndorserSpath", "accSpath", "PRODUCT_TYPESet",
						"SECTIONSet", "AUFNRSet", "CIHEADTODOCTemp", "STAFFSet", "CIHEADTOPATHTemp", "CIHEADTOPATH", "CIHEADTOAPP", "ITEMREF",
						"Description", "PROJECT_IDSet", "BUDGETCODESet", "GLSet"
					]) >
					-1) {
					continue;
				}

				if (key.indexOf("Enabled") > -1 || key.indexOf("Visible") > -1) {
					continue;
				}

				if (key === "CIHEADTOITEM") {
					for (var i = 0; i < oData.CIHEADTOITEM.length; i++) {
						var item = oData.CIHEADTOITEM[i];
						var itemData = {
							CIITEMTOACC: []
						};
						for (var itemKey in item) {
							if (itemKey.indexOf("Enabled") > -1 || itemKey.indexOf("Visible") > -1 || itemKey.indexOf("Description_Temp") > -1) {
								continue;
							}
							if (itemKey === "CIITEMTOACC") {
								for (var j = 0; j < item.CIITEMTOACC.length; j++) {
									var acc = item.CIITEMTOACC[j];
									var accData = {};
									for (var accKey in acc) {
										if (accKey.indexOf("Enabled") > -1 || accKey.indexOf("Visible") > -1) {
											continue;
										}
										if (typeof (acc[accKey]) === "number") {
											accData[accKey] = acc[accKey].toString();
										} else {
											accData[accKey] = acc[accKey];
										}
									}
									itemData.CIITEMTOACC.push(accData);
								}
								continue;
							}
							if (typeof (item[itemKey]) === "number") {
								itemData[itemKey] = item[itemKey].toString();
							} else {
								itemData[itemKey] = item[itemKey];
							}
						}

						oEntry.CIHEADTOITEM.push(itemData);
					}
					continue;
				}

				if (key === "CIHEADTOAPP") {
					for (var i = 0; i < oData.CIHEADTOAPP.length; i++) {
						var item = oData.CIHEADTOAPP[i];
						var itemData = {};
						for (var appKey in item) {
							if (appKey.indexOf("Enabled") > -1 || appKey.indexOf("Visible") > -1) {
								continue;
							}
							if (typeof (item[appKey]) === "number") {
								itemData[appKey] = item[appKey].toString();
							} else {
								itemData[appKey] = item[appKey];
							}
						}
						oEntry.CIHEADTOAPP.push(itemData);
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

		openDeleteDialog: function () {
			var oData = this.getModel("CI").getData();
			oData.DeleteReason = "";
			if (oData.Status === "08" && this.role === "3") {
				this.byId("deleteDialog").open();
			} else {
				var that = this;
				sap.m.MessageBox.confirm("Are you sure to delete Invoice No. " + oData.Cino + " ?", {
					onClose: function (sButton) {
						if (sButton === sap.m.MessageBox.Action.OK) {
							var oEntry = {
								Cino: oData.Cino,
								Parameter: "delete",
								CIHEADTOITEM: [],
								DeleteReason: ""
							};
							that.updateStatus(oEntry);
						}
					}
				});
			}
		},

		closeDeleteDialog: function () {
			this.byId("deleteDialog").close();
		},

		onDelete: function () {
			var that = this;
			var oData = this.getModel("CI").getData();
			sap.m.MessageBox.confirm("Are you sure to delete Invoice No. " + oData.Cino + " ?", {
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.OK) {
						var deleteReason = oData.DeleteReason;
						var oEntry = {
							Cino: oData.Cino,
							Parameter: "delete",
							CIHEADTOITEM: [],
							DeleteReason: deleteReason
						};
						that.updateStatus(oEntry);
						that.byId("deleteDialog").close();
					}
				}
			});
		},

		openReturnDialog: function () {
			var oData = this.getModel("CI").getData();
			oData.ReturnReason = "";
			this.byId("returnDialog").open();
		},

		closeReturnDialog: function () {
			this.byId("returnDialog").close();
		},

		onReturn: function () {
			var oData = this.getModel("CI").getData();
			var returnReason = oData.ReturnReason;
			if (returnReason === "") {
				this.alert("Reason for Return must be input.");
				return;
			}
			var oEntry = {
				Cino: oData.Cino,
				Parameter: "return",
				ReturnReason: returnReason,
				CIHEADTOITEM: []
			};
			this.updateStatusA(oEntry);
			this.byId("returnDialog").close();
		},

		onEmail: function () {
			var that = this;
			var oData = this.getModel("CI").getData();

			if (oData.Asigned) {
				this.alert(
					" “Authorized Signature” should only be printed if you choose to print out the invoice. Please uncheck the “Authorized Signature” box if you choose to email the invoice to customer. "
				);
				return;
			}

			if (!oData.CustEmail) {
				this.alert("Please input Customer Email Address in order to email invoice to customer.");
				return;
			}
			var adminInd = this.getModel("CI").getProperty("/AdminInd");
			if (adminInd === "X") {
				this.alert("The e-form must be submitted to administrator first according to your department’s setting.");
				return;
			}

			var endorseInd = this.getModel("CI").getProperty("/EndorseInd");
			if (endorseInd === "X") {
				this.alert("Endorser Approval path must be defined according to your department’s setting.");
				return;
			}

			this.onAutoSave();
			var interval = setInterval(function () {
				if (that.SaveStatus === 0) {
					return;
				}
				clearInterval(interval);
				if (that.SaveStatus === 1) {
					sap.m.MessageBox.confirm("Are you sure to send out the email of Invoice No. " + oData.Cino + " to customer ? ", {
						onClose: function (sButton) {
							if (sButton === sap.m.MessageBox.Action.OK) {
								if (sButton === sap.m.MessageBox.Action.OK) {
									var oEntry = {
										Cino: oData.Cino,
										Parameter: "email",
										CIHEADTOITEM: []
									};
									that.updateStatus(oEntry);
								}
							}
						}
					});
				}
			}, 100);

		},

		openCloseDialog: function () {
			this.byId("closeDialog").open();
		},

		closeCloseDialog: function () {
			this.byId("closeDialog").close();
		},

		onClose: function () {
			var that = this;
			var oData = this.getModel("CI").getData();
			var closeReason = oData.CloseReason;
			if (closeReason === "") {
				this.alert("Reason for Close must be input.");
				return;
			}
			sap.m.MessageBox.confirm("Are you sure to close Invoice No. " + oData.Cino + " ? ", {
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.OK) {
						var oEntry = {
							Cino: oData.Cino,
							Parameter: "close",
							CloseReason: closeReason,
							CIHEADTOITEM: []
						};
						that.updateStatus(oEntry);
						that.byId("closeDialog").close();
					}
				}
			});
		},

		onAccept: function () {
			var that = this;
			var oData = this.getModel("CI").getData();
			this.onAutoSave();
			var interval = setInterval(function () {
				if (that.SaveStatus === 0) {
					return;
				}
				clearInterval(interval);
				if (that.SaveStatus === 1) {
					sap.m.MessageBox.confirm("Are you sure to approve Invoice No. " + oData.Cino + " ? ", {
						onClose: function (sButton) {
							if (sButton === sap.m.MessageBox.Action.OK) {
								var oEntry = {
									Cino: oData.Cino,
									Parameter: "approve_head",
									CIHEADTOITEM: []
								};
								that.updateStatusA(oEntry);
							}
						}
					});
				}
			}, 100);

		},

		onPrint: function () {
			var that = this;
			var oData = that.getModel("CI").getData();
			var adminInd = this.getModel("CI").getProperty("/AdminInd");
			if (adminInd === "X") {
				this.alert("The e-form must be submitted to administrator first according to your department’s setting.");
				return;
			}

			var endorseInd = this.getModel("CI").getProperty("/EndorseInd");
			if (endorseInd === "X") {
				this.alert("Endorser Approval path must be defined according to your department’s setting.");
				return;
			}

			this.onAutoSave();
			var interval = setInterval(function () {
					if (that.SaveStatus === 0) {
						return;
					}
					clearInterval(interval);
					if (that.SaveStatus === 1) {
						sap.m.MessageBox.confirm("Are you sure to print Invoice No. " + oData.Cino + " for sending hardcopy invoice to customer? \n" +
							"Please note that once printed, the invoice e-form will no longer be editable.You may preview to verify the invoice contents first if needed.	", {
								onClose: function (sButton) {
									if (sButton === sap.m.MessageBox.Action.OK) {
										if (sButton === sap.m.MessageBox.Action.OK) {
											var oEntry = {
												Cino: oData.Cino,
												Parameter: "print",
												CIHEADTOITEM: []
											};
											that.updateStatus(oEntry, true, function () {
												var url = window.location.protocol + "//" + window.location.host + that.getModel().sServiceUrl + "/PDFSet(No='" +
													oData.Cino +
													"',Preview='',Version='CI')/$value";
												var filename = "Print-" + oData.Cino + ".pdf";
												that.download(url, filename);
											});
										}
									}
								}
							});
					}
				},
				100);

		},

		onPreview: function () {
			var oData = this.getModel("CI").getData();
			var url = window.location.protocol + "//" + window.location.host + this.getModel().sServiceUrl + "/PDFSet(No='" + oData.Cino +
				"',Preview='X',Version='CI')/$value";
			var filename = "Preview-" + oData.Cino + ".pdf";
			var str = sap.ui.Device.browser.name;
			if ($.inArray(str, ["ff", "cr"]) > -1) {
				this.openPDF(url);
			} else {
				this.download(url, filename);
			}
		},

		itemAddRow: function () {

			var oData = this.getModel("CI").getData();
			if (!oData.Waers) {
				this.alert("Currency cannot be blank.");
				return;
			}
			var itemData = {
				Ciitem: this.getItemId(),
				Amount: 0.00,
				CiitemEnabled: true,
				CIITEMTOACC: []
			};
			var index = this.byId("itemTable").getItems().indexOf(this.byId("itemTable").getSelectedItem());
			if (index > -1) {
				oData.CIHEADTOITEM.splice(index, 0, itemData);
			} else {
				oData.CIHEADTOITEM.push(itemData);
			}
			this.getModel("CI").setData(oData);
			var itemTable = this.byId("itemTable");
			var focusIndex = index;
			if (focusIndex === -1) {
				focusIndex = itemTable.getItems().length - 1;
			}
			itemTable.rerender();
			itemTable.getItems()[focusIndex].getCells()[1].focus();
			this.initFields();
		},

		itemRemoveRow: function () {
			var oData = this.getModel("CI").getData();
			var items = this.byId("itemTable").getSelectedItems();
			if (items.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			var that = this;
			// 			sap.m.MessageBox.confirm("Are you sure to delete selected item(s) ?", {
			// 				onClose: function (sButton) {
			// 					if (sButton === sap.m.MessageBox.Action.OK) {
			for (var i = items.length - 1; i >= 0; i--) {
				var property = items[i].getBindingContext("CI").getProperty();
				for (var j = 0; j < oData.CIHEADTOITEM.length; j++) {
					if (oData.CIHEADTOITEM[j].Ciitem === property.Ciitem) {
						oData.CIHEADTOITEM.splice(j, 1);
						break;
					}
				}
			}
			that.getModel("CI").setData(oData);
			that.refreshTotal();
			that.byId("itemTable").removeSelections(true);
			// 	}
			// }
			// 			});
		},

		itemCopyRow: function () {
			var oData = this.getModel("CI").getData();
			var items = this.byId("itemTable").getSelectedItems();
			if (items.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			for (var i = 0; i < items.length; i++) {
				var property = items[i].getBindingContext("CI").getProperty();
				var itemData = {
					CIITEMTOACC: []
				};
				var ciitem = this.getItemId();
				for (var key in property) {
					if (key === "CIITEMTOACC") {
						var accArray = property[key];
						for (var j = 0; j < accArray.length; j++) {
							var acc = accArray[j];
							var accData = {};
							for (var accKey in acc) {
								accData[accKey] = acc[accKey];
							}
							accData.Ciitem = ciitem;
							itemData.CIITEMTOACC.push(accData);
						}
						continue;
					}
					itemData[key] = property[key];
				}
				itemData.Ciitem = ciitem;
				itemData.CiitemEnabled = true;
				oData.CIHEADTOITEM.push(itemData);
			}
			this.getModel("CI").setData(oData);
			this.refreshTotal();
		},

		changeCurrency: function (oEvent) {
			var oValidatedComboBox = oEvent.getSource(),
				sSelectedKey = oValidatedComboBox.getSelectedKey(),
				sValue = oValidatedComboBox.getValue();

			// 			if (sValue.length > 3) {
			// 				this.alert("Invalid Currency Code");
			// 				this.getModel("CI").setProperty("/Waers", "");
			// 				this.getModel("CI").setProperty("/Bankaccountno", "");
			// 				return;
			// 			}
			var url = this.getModel().sServiceUrl + "/CURRENCYSet?$filter=substringof(%27" + sValue + "%27,Waers)";
			var that = this;
			jQuery.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				dataType: "json",
				success: function (oData) {
					var result = oData.d.results;
					var flg = false;
					for (var i = 0; i < result.length; i++) {
						if (result[i].Waers === sValue) {
							flg = true;
							break;
						}
					}
					if (flg === false) {
						that.alert("Invalid Currency Code");
						that.getModel("CI").setProperty("/Waers", "");
						that.getModel("CI").setProperty("/Bankaccountno", "");
					} else {
						if (sSelectedKey === "USD") {
							that.getModel("CI").setProperty("/Bankaccountno", "024-293-005005-201");
						}
						if (sSelectedKey === "GBP") {
							that.getModel("CI").setProperty("/Bankaccountno", "024-293-005005-205");
						}
						if (sSelectedKey === "RMB") {
							that.getModel("CI").setProperty("/Bankaccountno", "024-293-005005-280");
						}
						if (sSelectedKey === "") {
							that.getModel("CI").setProperty("/Bankaccountno", "");
						}
						if (sSelectedKey !== "USD" && sSelectedKey !== "GBP" && sSelectedKey !== "RMB" && sValue !== "") {
							that.getModel("CI").setProperty("/Bankaccountno", "024-293-005005-001");
						}

						var oData = that.getModel("CI").getData();
						for (var i = 0; i < oData.CIHEADTOITEM.length; i++) {
							var items = oData.CIHEADTOITEM[i];
							for (var j = 0; j < items.CIITEMTOACC.length; j++) {
								oData.CIHEADTOITEM[i].CIITEMTOACC[j].Waers = oData.Waers;
							}
						}
						that.getModel("CI").setData(oData);
					}
				},
				error: function () {}
			});

		},

		refreshTotal: function () {
			var oData = this.getModel("CI").getData();
			var totalAmount = 0;
			for (var j = 0; j < oData.CIHEADTOITEM.length; j++) {
				if (oData.CIHEADTOITEM[j].Amount) {
					totalAmount = totalAmount + parseFloat(oData.CIHEADTOITEM[j].Amount);
				}
			}
			this.getModel("CI").setProperty("/Tolamt", totalAmount.toFixed(2));
		},

		getItemId: function () {
			var items = this.getModel("CI").getData().CIHEADTOITEM;
			var maxCiitem = 0;
			for (var i = 0; i < items.length; i++) {
				var Ciitem = parseInt(items[i].Ciitem, 10);
				if (Ciitem > maxCiitem) {
					maxCiitem = Ciitem;
				}
			}
			return (parseInt(maxCiitem / 10, 10) * 10 + 10).toString();
		},

		getAccId: function () {
			var items = this.getModel("CI").getData().CIITEMTOACC;
			var maxZekkn = 0;
			for (var i = 0; i < items.length; i++) {
				var zekkn = parseInt(items[i].Zekkn, 10);
				if (zekkn > maxZekkn) {
					maxZekkn = zekkn;
				}
			}
			return (maxZekkn + 1).toString();
		},

		changeAmount: function (oEvent) {
			var oData = this.getModel("CI").getData();
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			var value = oEvent.getSource().getValue();
			value = parseFloat(this.moneyToNumber(value));
			if (isNaN(value)) {
				oEvent.getSource().setValue(0.00.toFixed(2));
				this.getModel("CI").setProperty(sPath + "/Amount", 0.00.toFixed(2));
			}
			this.refreshTotal();
			var items = oData.CIHEADTOITEM;
			for (var i = 0; i < items.length; i++) {
				oData.CIITEMTOACC = [];
				var item = items[i];
				if (item.Ciitem === property.Ciitem & item.CIITEMTOACC.length === 1) {
					item.CIITEMTOACC[0].Amount = parseFloat(property.Amount);
				}
			}
			this.getModel("CI").setData(oData);
		},

		calculateAmount: function (oEntry) {
			var that = this;
			if (!oEntry.Parameter) {
				oEntry.Parameter = "change_amount";
			}
			that.byId("loadingDialog").open();
			that.getModel().create("/CIHEADSet", oEntry, {
				method: "POST",
				success: function (data, response) {

					that.byId("loadingDialog").close();
					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);
						that.alert(dataJson.message);
						if (dataJson.severity === "error") {
							return;
						}
					}

					var oData = that.getModel("CI").getData();

					if (data.CIHEADTOITEM) {
						for (var i = 0; i < data.CIHEADTOITEM.results.length; i++) {
							var Item = data.CIHEADTOITEM.results[i];

							var oDataItem;

							for (var k = 0; k < oData.CIHEADTOITEM.length; k++) {
								if (parseInt(Item.Ciitem) === parseInt(oData.CIHEADTOITEM[k].Ciitem)) {
									oDataItem = oData.CIHEADTOITEM[k];
									break;
								}
							}
							oDataItem.Amount = Item.Amount;

							if (Item.CIITEMTOACC) {
								for (var j = 0; j < Item.CIITEMTOACC.results.length; j++) {
									var Acc = Item.CIITEMTOACC.results[j];
									var oDataAcc;
									for (var g = 0; g < oDataItem.CIITEMTOACC.length; g++) {
										if (parseInt(Acc.Zekkn) === parseInt(oDataItem.CIITEMTOACC[g].Zekkn)) {
											oDataAcc = oDataItem.CIITEMTOACC[g];
											break;
										}
									}
									oDataAcc.Amount = Acc.Amount;
								}
							}
						}
					}

					that.getModel("CI").setData(oData);
					that.refreshTotal();
				},
				error: function (oError) {
					// 	that.alert(oError.message);
					that.byId("loadingDialog").close();
				}
			});
		},

		changeAccAmount: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var value = oEvent.getSource().getValue();
			value = parseFloat(this.moneyToNumber(value));
			if (isNaN(value)) {
				oEvent.getSource().setValue(0.00.toFixed(2));
				this.getModel("CI").setProperty(sPath + "/Amount", 0.00.toFixed(2));
			}
		},

		openPathDialog: function () {
			var oData = this.getModel("CI").getData();
			oData.CIHEADTOPATHTemp = [];
			for (var i = 0; i < oData.CIHEADTOPATH.length; i++) {
				var item = oData.CIHEADTOPATH[i];
				var itemData = {};
				for (var key in item) {
					itemData[key] = item[key];
				}
				oData.CIHEADTOPATHTemp.push(itemData);
			}
			this.getModel("CI").setData(oData);
			this.initPathEnabled();
			this.byId("pathDialog").open();
		},

		pathAddRow: function () {

			var oData = this.getModel("CI").getData();
			var item = this.byId("pathTable").getSelectedItem();
			if (!item) {
				oData.CIHEADTOPATHTemp.push({});
				this.getModel("CI").setData(oData);
				this.initPathEnabled();
				return;
			}
			var property = item.getBindingContext("CI").getProperty();
			if (!property.UnameEnabled) {
				this.alert("The same endorser should not be selected more than once.");
				return;
			}
			oData.CIHEADTOPATHTemp.splice(this.byId("pathTable").getItems().indexOf(item), 0, {});
			this.getModel("CI").setData(oData);
			this.initPathEnabled();
		},

		initPathEnabled: function () {
			var oData = this.getModel("CI").getData();
			for (var i = 0; i < oData.CIHEADTOPATHTemp.length; i++) {
				var item = oData.CIHEADTOPATHTemp[i];
				item.UnameEnabled = !item.Updat && item.Uname !== this.UserId;
			}
			this.getModel("CI").setData(oData);
		},

		pathRemoveRow: function () {
			var oData = this.getModel("CI").getData();
			var selectedItems = this.byId("pathTable").getSelectedItems();
			var items = this.byId("pathTable").getItems();
			if (selectedItems.length === 0) {
				this.alert("Please select at least one endorser.");
				return;
			}
			for (var j = selectedItems.length - 1; j >= 0; j--) {
				var property = selectedItems[j].getBindingContext("CI").getProperty();
				if (!property.UnameEnabled) {
					continue;
				}
				for (var i = 0; i < items.length; i++) {
					if (selectedItems[j] === items[i]) {
						oData.CIHEADTOPATHTemp.splice(i, 1);
						break;
					}
				}
			}
			this.getModel("CI").setData(oData);
			this.byId("pathTable").removeSelections(true);
		},

		path: function () {
			var that = this;
			var oData = that.getModel("CI").getData();
			var unameArray = new Array();
			var pathArray = new Array();
			for (var i = 0; i < oData.CIHEADTOPATHTemp.length; i++) {
				var item = oData.CIHEADTOPATHTemp[i];
				if (!item.Uname) {
					that.alert("Please select an endorser.");
					return;
				}
				if ($.inArray(item.Uname, unameArray) >= 0) {
					that.alert("The same endorser should not be selected more than once.");
					return;
				}
				var rowData = {
					Cino: oData.Cino,
					Uname: item.Uname
				};
				unameArray.push(item.Uname);
				pathArray.push(rowData);
			}
			var oEntry = {
				Cino: oData.Cino,
				CIHEADTOPATH: pathArray,
				Parameter: "path"
			};

			this.onAutoSave();
			var interval = setInterval(function () {
				if (that.SaveStatus === 0) {
					return;
				}
				clearInterval(interval);
				if (that.SaveStatus === 1) {
					that.updateStatus(oEntry);
					that.byId("pathDialog").close();
				}
			}, 100);

		},

		closePathDialog: function () {
			this.byId("pathDialog").close();
		},

		requestedByValueHelpE: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			this.getModel("CI").setProperty("/approveEndorserSpath", sPath);
			this.byId("requestedByFilterBarE").getControlByKey("RptDept").setValue(this.gdlgrp);
			this.byId("requestedByFilterBarE").search();
			this.byId("requestedBySelectDialogE").open();
		},

		selectRequestedByE: function (oEvent) {
			var data = oEvent.getParameters().rowBindingContext.getObject();
			var sPath = this.getModel("CI").getProperty("/approveEndorserSpath");
			// this.getModel("CI").setProperty(sPath + "/Uname", data.Staffid);
			this.getModel("CI").setProperty(sPath + "/Uname", data.Staffac);
			this.getModel("CI").setProperty(sPath + "/Endorsedname", data.Staffname);
			this.byId("requestedBySelectDialogE").close();
		},

		closeRequestedByValueHelpE: function () {
			this.byId("requestedBySelectDialogE").close();
		},

		openHeadReferenceDialog: function () {
			var oData = this.getModel("CI").getData();
			oData.REF = [];
			for (var key in oData) {
				oData.REF[key] = oData[key];
			}
			oData.REF.Reference6Visible = (oData.HeaderInd === "X");
			oData.REF.Reference7Visible = (oData.HeaderInd === "X");
			oData.REF.Reference8Visible = (oData.HeaderInd === "X");
			oData.REF.Reference9Visible = (oData.HeaderInd === "X");
			oData.REF.Reference10Visible = (oData.HeaderInd === "X");
			this.getModel("CI").setData(oData);
			this.byId("refDialog").open();
		},

		onRef: function () {
			var oData = this.getModel("CI").getData();
			for (var key in oData.REF) {
				oData[key] = oData.REF[key];
			}
			this.getModel("CI").setData(oData);
			this.byId("refDialog").close();
		},

		closeHeadReferenceDialog: function () {
			this.byId("refDialog").close();
		},

		openAccDialog: function (oEvent) {
			var oData = this.getModel("CI").getData();
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			oData.accCiitem = property.Ciitem;
			oData.CIITEMTOACC = [];
			var items = oData.CIHEADTOITEM;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item.Ciitem === property.Ciitem) {
					for (var j = 0; j < item.CIITEMTOACC.length; j++) {
						var data = item.CIITEMTOACC[j];
						var itemData = {};
						for (var key in data) {
							itemData[key] = data[key];
						}
						oData.CIITEMTOACC.push(itemData);
					}
					break;
				}
			}
			oData.ITEMREF = [];
			for (var key1 in property) {
				oData.ITEMREF[key1] = property[key1];
			}
			oData.ITEMREF.Ciitem = property.Ciitem;
			this.byId("itemReferenceTitle").setText("Line Item " + property.Ciitem + " References");
			this.byId("itemReferenceDetail").setText(property.Description);
			this.getModel("CI").setData(oData);
			this.initFields();
			this.byId("accDialog").open();
			if (property.CIITEMTOACC.length === 0 && ($.inArray(oData.Status, ["0", "01", "04", "06"]) > -1 && this.role === "1")) {
				this.accAddRow();
			}
			if (property.CIITEMTOACC.length === 0 && (oData.Status === "02" && this.role === "3")) {
				this.accAddRow();
			}

		},

		quickOpenAccDialog: function (oEvent) {

			var oseltable = this.getView().byId("itemTable").getSelectedContexts();
			if (oseltable.length !== 1) {
				this.alert("Please select one item.");
				return;
			}
			var items = oseltable.map(function (c) {
				return c.getObject();
			});

			var oData = this.getModel("CI").getData();
			oData.accCiitem = items[0].Ciitem;
			oData.CIITEMTOACC = [];

			var alist = oData.CIHEADTOITEM;
			for (var i = 0; i < alist.length; i++) {
				var item = alist[i];
				if (item.Ciitem === items[0].Ciitem) {

					for (var j = 0; j < item.CIITEMTOACC.length; j++) {
						var data = item.CIITEMTOACC[j];
						var itemData = {};
						for (var key in data) {
							itemData[key] = data[key];
						}

						oData.CIITEMTOACC.push(itemData);
					}

					break;
				}
			}

			var list = items[0];
			oData.ITEMREF = [];
			for (var key1 in list) {
				oData.ITEMREF[key1] = list[key1];
			}

			oData.ITEMREF.Ciitem = items[0].Ciitem;

			this.byId("itemReferenceTitle").setText("Line Item " + items[0].Ciitem + " References");
			this.byId("itemReferenceDetail").setText(items[0].Txz01);
			this.getModel("CI").setData(oData);
			this.initFields();
			this.byId("accDialog").open();
			if (list.CIITEMTOACC.length === 0 && ($.inArray(oData.Status, ["0", "01", "04", "06"]) > -1 && this.role === "1")) {
				this.accAddRow();
			}
			if (list.CIITEMTOACC.length === 0 && (oData.Status === "02" && this.role === "3")) {
				this.accAddRow();
			}
		},

		accAddRow: function () {
			var oData = this.getModel("CI").getData();
			var itemData = {
				Ciitem: oData.accCiitem,
				Zekkn: this.getAccId(),
				Waers: oData.Waers,
				ZekknEnabled: true,
				Amount: 0
			};

			var items = oData.CIHEADTOITEM;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item.Ciitem === oData.accCiitem) {
					if (oData.CIITEMTOACC.length === 0) {
						itemData.Amount = item.Amount;
					}
					break;
				}
			}

			var index = this.byId("accTable").getItems().indexOf(this.byId("accTable").getSelectedItem());
			if (index > -1) {
				oData.CIITEMTOACC.splice(index, 0, itemData);
			} else {
				oData.CIITEMTOACC.push(itemData);
			}

			this.getModel("CI").setData(oData);
			this.initFields();
		},

		accRemoveRow: function (oEvent) {

			var oData = this.getModel("CI").getData();
			var items = this.byId("accTable").getSelectedItems();
			if (items.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			for (var i = items.length - 1; i >= 0; i--) {
				var property = items[i].getBindingContext("CI").getProperty();
				for (var j = 0; j < oData.CIITEMTOACC.length; j++) {
					if (oData.CIITEMTOACC[j].Zekkn === property.Zekkn) {
						oData.CIITEMTOACC.splice(j, 1);
						break;
					}
				}
			}
			this.getModel("CI").setData(oData);
			this.byId("accTable").removeSelections(true);

		},

		accCopyRow: function () {
			var oData = this.getModel("CI").getData();
			var items = this.byId("accTable").getSelectedItems();
			if (items.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			for (var i = 0; i < items.length; i++) {
				var property = items[i].getBindingContext("CI").getProperty();
				var itemData = {};
				for (var key in property) {
					itemData[key] = property[key];
				}
				itemData.Zekkn = this.getAccId();
				itemData.ZekknEnabled = true;
				// itemData.ChgBy = "";
				// itemData.CrtBy = "";
				itemData.ChgDate = undefined;
				itemData.ChgTime = undefined;
				itemData.CrtDate = undefined;
				itemData.CrtTime = undefined;
				oData.CIITEMTOACC.push(itemData);
			}
			this.getModel("CI").setData(oData);
			this.initFields();
		},

		changeItemNo: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var repeatCount = 0;
			var oData = this.getModel("CI").getData();
			for (var i = 0; i < oData.CIHEADTOITEM.length; i++) {
				var item = oData.CIHEADTOITEM[i];
				if (parseInt(item.Ciitem) === parseInt(property.Ciitem)) {
					repeatCount = repeatCount + 1;
				}
			}

			if (repeatCount > 1) {
				this.getModel("CI").setProperty(sPath + "/Ciitem", "");
				this.alert("Item No. must be different for each item.");
				return;
			}

			for (var i = 0; i < oData.CIHEADTOITEM.length; i++) {
				var item = oData.CIHEADTOITEM[i];
				if (item.Ciitem === property.Ciitem) {
					for (var j = 0; j < item.CIITEMTOACC.length; j++) {
						var acc = item.CIITEMTOACC[j];
						acc.Ciitem = property.Ciitem;
					}
				}
			}

			this.getModel("CI").setData(oData);
		},

		changeZekkn: function (oEvent) {

			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var repeatCount = 0;
			var oData = this.getModel("CI").getData();
			for (var i = 0; i < oData.CIITEMTOACC.length; i++) {
				var item = oData.CIITEMTOACC[i];
				if (parseInt(item.Zekkn) === parseInt(property.Zekkn)) {
					repeatCount = repeatCount + 1;
				}
			}

			if (repeatCount > 1) {
				this.getModel("CI").setProperty(sPath + "/Zekkn", "");
				this.alert("Acct. Ass. No. must be different for each account assignment.");
				return;
			}
		},

		checkAcctAss: function () {
			var that = this;
			that.acctAssCheckSuccessCount = 0;
			that.acctAssCheckComplete = 0;
			that.acctAssCheckAllCount = 0;
			var oData = that.getModel("CI").getData();
			var items = oData.CIITEMTOACC;

			if (items.length === 0) {
				return;
			}

			that.acctAssCheckAllCount = items.length;
			var staff = oData.PreparedBy;
			if (!staff) {
				staff = that.UserId;
			}

			var knttp = 1;
			var budat = "1999-12-31";
			var productType = oData.ITEMREF.ProductType;

			for (var j = 0; j < items.length; j++) {
				var acc = items[j];
				if (!acc.Zekkn) {
					that.alert("Acc. Ass. No. cannot be blank.");
					return;
				}
				if (parseInt(acc.Zekkn, 10) <= 0) {
					that.alert("Acc. Ass. No. must be greater than 0.");
					return;
				}
				// if (acc.Amount === "0.00") {
				// 	that.alert("Acc. Ass. No. " + acc.Zekkn + ": Amount cannot be zero.");
				// 	return;
				// }
				// if (!acc.Gsber) {
				// 	that.alert("Acc. Ass. No. " + acc.Zekkn + ": Business Area cannot be blank.");
				// 	return;
				// }
				// if (!acc.Sakto) {
				// 	that.alert("Acc. Ass. No. " + acc.Zekkn + ": A/C Code cannot be blank.");
				// 	return;
				// }
				// if (acc.Kostl && acc.Projn) {
				// 	that.alert("Cost centre and project cannot be input at the same time.");
				// 	return;
				// }
			}

			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var parameters = {
					I_AAS: knttp ? knttp : "",
					I_COMP_CODE: item.Bukrs ? item.Bukrs : "",
					I_BUS_AREA: item.Gsber ? item.Gsber : "",
					I_COST_CTR: item.Kostl ? item.Kostl : "",
					I_WBS: item.Projn ? item.Projn : "",
					I_INT_ORD: item.Aufnr ? item.Aufnr : "",
					I_GL_AC: item.Sakto ? item.Sakto : "",
					I_STAFFAC: staff,
					I_CUR_USR_ROLE: this.role,
					I_BUDG_CODE: item.BudgCode ? item.BudgCode : "",
					I_DEPT_CODE: oData.DeptCode ? oData.DeptCode : "",
					I_PRJ_ID: item.PrjId ? item.PrjId : "",
					I_PRD_TYPE: productType ? productType : "",
					I_BUDAT: budat ? budat : "1999-12-31"
				};

				if (parameters.I_COMP_CODE === "" && parameters.I_BUS_AREA === "" && parameters.I_COST_CTR === "" && parameters.I_WBS === "" &&
					parameters.I_INT_ORD === "" && parameters.I_GL_AC === "") {
					that.acctAssCheckComplete = that.acctAssCheckComplete + 1;
					that.acctAssCheckSuccessCount = that.acctAssCheckSuccessCount + 1;
					continue;
				}
				that.byId("loadingDialog").open();
				that.callFunction("EFORM_AAS_VALID", parameters, function (data, response) {
					that.byId("loadingDialog").close();
					that.acctAssCheckComplete = that.acctAssCheckComplete + 1;
					if (data.ReturnType === "N") {
						that.alert(data.ReturnMsg);
						return;
					}
					if (data.ReturnType === "W") {
						that.alert(data.ReturnMsg);
					}
					that.acctAssCheckSuccessCount = that.acctAssCheckSuccessCount + 1;
				});
			}
		},

		saveAcc: function () {
			var that = this;
			that.checkAcctAss();
			var interval = setInterval(function () {
				if (that.acctAssCheckComplete === that.acctAssCheckAllCount) {
					clearInterval(interval);
				}
				if (that.acctAssCheckSuccessCount != that.acctAssCheckAllCount) {
					return;
				}
				var oData = that.getModel("CI").getData();
				var items = oData.CIHEADTOITEM;
				for (var k = 0; k < items.length; k++) {
					var itemData = items[k];
					if (itemData.Ciitem === oData.ITEMREF.Ciitem) {
						for (var key in oData.ITEMREF) {
							itemData[key] = oData.ITEMREF[key];
						}
						break;
					}
				}
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if (item.Ciitem === oData.accCiitem) {
						item.CIITEMTOACC = oData.CIITEMTOACC;
					}
				}

				that.byId("accDialog").close();
				that.byId("accTable").removeSelections(true);
			}, 100);

		},

		closeAccDialog: function () {
			this.byId("accDialog").close();
			this.byId("accTable").removeSelections(true);
		},

		changeDueDate: function (oEvent) {
			var oDP = this.byId("InvoiceDatePicker");
			if (oDP._bValid === false) {
				this.alert("Invoice Date is invalid.");
				this.byId("InvoiceDatePicker").setDateValue(undefined);
			}
			this.byId("PaymentDueDatePicker").setDateValue(this.byId("InvoiceDatePicker").getDateValue());
		},

		changeDueDate1: function (oEvent) {
			var oDP = this.byId("PaymentDueDatePicker");
			if (oDP._bValid === false) {
				this.alert("Payment Due Date is invalid.");
				this.byId("PaymentDueDatePicker").setDateValue(undefined);
			}
		},

		initDocEnabled: function () {
			var oData = this.getModel("CI").getData();
			for (var i = 0; i < oData.CIHEADTODOCTemp.length; i++) {
				var item = oData.CIHEADTODOCTemp[i];
				if (this.role === "5") {
					item.EmailEnabled = false;
				} else {
					if (item.Fno === "X") {
						item.EmailEnabled = false;
					} else {
						item.EmailEnabled = true;
					}
				}
			}
			this.getModel("CI").setData(oData);
		},

		openDocDialog: function () {
			var that = this;
			that.byId("docFile").setValue("");
			var oData = this.getModel("CI").getData();
			oData.CIHEADTODOCTemp = [];
			that.byId("loadingDialog").open();
			this.getModel().read("/CIHEADSet('" + oData.Cino + "')/CIHEADTODOC", {
				success: function (sdata, response) {
					that.byId("loadingDialog").close();
					var jsonData = that.getModel("CI").getData();
					jsonData.CIHEADTODOC = [];
					for (var i = 0; i < sdata.results.length; i++) {
						var data = sdata.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.CIHEADTODOC.push(itemData);
					}
					for (var j = 0; j < oData.CIHEADTODOC.length; j++) {
						var item = oData.CIHEADTODOC[j];
						var docData = {};
						for (var key1 in item) {
							docData[key1] = item[key1];
						}
						oData.CIHEADTODOCTemp.push(docData);
					}

					that.getModel("CI").setData(jsonData);
					that.initDocEnabled();
					that.byId("docDialog").open();
				},
				error: function (oError) {

				}
			});
		},

		docAddRow: function () {

			var oFileUploader = this.byId("docFile");
			if (!oFileUploader.getValue()) {
				this.alert("Choose a file first");
				return;
			}

			var oData = this.getModel("CI").getData();
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

				oData.CIHEADTODOCTemp.push({
					Content: base64,
					Fname: fileName,
					Doctype: fileType
				});
				that.getModel("CI").setData(oData);
				that.initDocEnabled();
			};
		},

		docRemoveRow: function () {
			var oData = this.getModel("CI").getData();
			var selectedItems = this.byId("docTable").getSelectedItems();
			if (selectedItems.length === 0) {
				this.alert("Please select at least one item.");
				return;
			}
			var items = this.byId("docTable").getItems();
			for (var j = selectedItems.length - 1; j >= 0; j--) {
				for (var i = 0; i < items.length; i++) {
					if (selectedItems[j] === items[i]) {

						if (oData.CIHEADTODOCTemp[i].Fno === "X" && this.role !== "5") {
							this.alert("Department user can only delete department files. Deletion of FNO files is not allowed.");
							return;
						} else if (oData.CIHEADTODOCTemp[i].Dept === "X" && this.role === "5") {
							this.alert("FNO user can only delete FNO files. Deletion of department files is not allowed.");
							return;
						} else {
							oData.CIHEADTODOCTemp.splice(i, 1);
							break;
						}

					}
				}
			}
			this.getModel("CI").setData(oData);
			this.byId("docTable").removeSelections(true);
		},

		downloadDoc: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
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
			var oData = this.getModel("CI").getData();
			var oDoc = [];
			for (var i = 0; i < oData.CIHEADTODOCTemp.length; i++) {
				var data = oData.CIHEADTODOCTemp[i];
				var itemData = {};
				for (var key in data) {
					if (key !== "EmailEnabled") {
						itemData[key] = data[key];
					}
				}
				oDoc.push(itemData);
			}
			var oEntry = {
				Cino: oData.Cino,
				CIHEADTODOC: oDoc,
				Parameter: "doc"
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
			this.byId("docDialog").close();
		},

		openLogDialog: function () {
			var that = this;
			that.byId("logDialog").open();
			var oData = this.getModel("CI").getData();
			var jsonData = {};
			jsonData.LOGSet = [];
			that.byId("loadingDialog").open();
			this.getModel().read("/CIHEADSet('" + oData.Cino + "')/CIHEADTOLOG", {
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

		openPrepareDialog: function () {
			var that = this;
			var filters = [
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Role", sap.ui.model.FilterOperator.EQ, "1"),
						new sap.ui.model.Filter("Role", sap.ui.model.FilterOperator.EQ, "2")
					],
					and: false
				})
			];
			var jsonData = that.getModel("CI").getData();
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
					that.getModel("CI").setData(jsonData);
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
			var oData = this.getModel("CI").getData();
			var oEntry = {
				Cino: oData.Cino,
				PreparedBy: this.byId("newPrepare").getSelectedKey(),
				Parameter: "prepare",
				CIHEADTOITEM: []
			};
			this.updateStatus(oEntry);
			this.getView().byId("prepareDialog").close();
		},

		openSubmitToAdminDialog: function () {

			var that = this;
			var endorseInd = this.getModel("CI").getProperty("/EndorseInd");
			if (endorseInd === "X") {
				that.alert("Approval path must be defined according to your department’s setting.");
				return;
			} else {
				this.onAutoSave();

				var interval = setInterval(function () {

					if (that.SaveStatus === 0) {
						return;
					}
					clearInterval(interval);
					if (that.SaveStatus === 1) {
						var oData = that.getModel("CI").getData();
						var filters = [
							new sap.ui.model.Filter("Cino",
								sap.ui.model.FilterOperator.EQ,
								oData.Cino
							)
						];
						that.byId("loadingDialog").open();
						that.byId("administrator").destroyItems();
						that.getModel().read("/ADMINSet", {
							filters: filters,
							success: function (data, oResponse) {
								that.byId("loadingDialog").close();
								if (oResponse.headers["sap-message"]) {
									var dataJson = JSON.parse(oResponse.headers["sap-message"]);
									if (dataJson.severity === "error") {
										that.alert(dataJson.message);
									} else if (dataJson.severity === "info") {
										var oEntry = {
											Cino: oData.Cino,
											Parameter: "submit_admin",
											CIHEADTOITEM: []
										};
										that.updateStatus(oEntry);
									}
								} else {
									that.byId("submitToAdminDialog").open();
									for (var i = 0; i < data.results.length; i++) {
										that.byId("administrator").addItem(new sap.ui.core.ListItem({
											key: data.results[i].Staffac,
											text: data.results[i].DisName,
											additionalText: data.results[i].Staffname
										}));
									}
								}
							},
							error: function (oError) {
								that.byId("loadingDialog").close();
								that.alert(oError.message);
							}
						});
					}
				}, 100);

			}

		},

		submitToAdmin: function () {
			var administrator = this.byId("administrator").getSelectedKey();
			if (!administrator) {
				return;
			}
			var oData = this.getModel("CI").getData();
			var oEntry = {
				Cino: oData.Cino,
				Parameter: "submit_admin",
				Administrator: administrator,
				CIHEADTOITEM: []
			};
			this.updateStatus(oEntry);
			this.byId("submitToAdminDialog").close();
		},

		cancelSubmitToAdmin: function () {
			this.byId("submitToAdminDialog").close();
		},

		submitToEndorser: function () {
			var adminInd = this.getModel("CI").getProperty("/AdminInd");
			if (adminInd === "X") {
				this.alert("The e-form must be submitted to administrator first according to your department’s setting.");
				return;
			}
			var oData = this.getModel("CI").getData();
			var oEntry = {
				Cino: oData.Cino,
				Parameter: "submit_endor",
				CIHEADTOITEM: []
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

		getAdmin: function () {
			var that = this;
			var oData = this.getModel("CI").getData();
			var parameters = {
				Input: ""
			};
			this.callFunction("GET_ADMIN", parameters, function (data, response) {
				that.getModel("CI").setProperty("/Admin", data.Field);
				that.getModel("CI").setProperty("/DeptCode", oData.Admin);
				that.getModel("CI").setProperty("/CtDept", data.Value1);
				that.getModel("CI").setProperty("/Invdate", new Date());
				that.getModel("CI").setProperty("/Paymentduedate", new Date());
				if (!oData.Deptcorraddrl3) {
					oData.Deptcorraddrl3 = "The Chinese University of Hong Kong,";
				}
				if (!oData.Deptcorraddrl4) {
					oData.Deptcorraddrl4 = "Shatin, N.T., Hong Kong";
				}
				that.readAufnrSet();
				that.readProductTypeSet();
				that.readSectionSet();
				that.readProjectIdSet();
				that.readBudgetCodeSet();
			}, function (data, response) {
				that.getModel("CI").setProperty("/Admin", "");
			});
		},

		readAufnrSet: function () {
			var that = this;
			var jsonData = that.getModel("CI").getData();
			jsonData.AUFNRSet = [];
			var filters = [
				new sap.ui.model.Filter("DeptCode",
					sap.ui.model.FilterOperator.EQ,
					jsonData.DeptCode)
			];
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
					that.getModel("CI").setData(jsonData);
				},
				error: function (oError) {

				}
			});
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
				that.getModel("CI").setProperty("/Admin", data.Field);
				// that.getModel("CI").setProperty("/CtDept", data.Value1);
			}, function (data, response) {
				that.getModel("CI").setProperty("/Admin", "");
			});
		},

		getBudgetHolder: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			this.callBudgetHolder(property, sPath);
		},

		callBudgetHolder: function (property, sPath) {

			var deptCode = this.getModel("CI").getProperty("/DeptCode");
			var preparedBy = this.getModel("CI").getProperty("/PreparedBy");
			if (!preparedBy) {
				preparedBy = this.UserId;
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
					I_CUR_USR_ROLE: this.role,
					I_GL_AC: property.Sakto ? property.Sakto : ""
				},
				success: function (data, response) {
					that.getModel("CI").setProperty(sPath + "/Bukrs", data.Bukrs);
					that.getModel("CI").setProperty(sPath + "/Gsber", data.Gsber);
					that.getModel("CI").setProperty(sPath + "/Kostl", data.Kostl);
					that.getModel("CI").setProperty(sPath + "/Projn", data.Projn);
					that.getModel("CI").setProperty(sPath + "/Aufnr", data.Aufnr);
					that.getModel("CI").setProperty(sPath + "/Name1", data.Name1);
					that.getModel("CI").setProperty(sPath + "/Budhd", data.Budhd);
					that.getModel("CI").setProperty(sPath + "/FnoResp1Name", data.FnoResp1Name);
					that.getModel("CI").setProperty(sPath + "/BudgCode", data.BudgCode);
					that.getModel("CI").setProperty(sPath + "/FnoResp1", data.FnoResp1);
					that.byId("loadingDialog").close();
				},
				error: function (oError) {}
			});
		},

		acCodeValueHelp: function (oEvent) {
			this.sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var property = this.getModel("CI").getProperty(this.sPath);
			var that = this;
			var jsonData = that.getModel("CI").getData();
			jsonData.GLSet = [];
			var oCode;
			if (property.BudgCode !== undefined) {
				oCode = property.BudgCode;
			} else {
				oCode = "";
			}
			var filters = [
				new sap.ui.model.Filter("BudgCode",
					sap.ui.model.FilterOperator.EQ,
					oCode)
			];
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
					that.getModel("CI").setData(jsonData);
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

				}
			});
		},

		navToWorklist: function () {
			if (this.role === "2") {
				this.getRouter().navTo("CI_Worklist_Endorser");
			}
		},

		acCodeValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			// var aFilter = [
			// 	new Filter(
			// 		"GlAcc",
			// 		sap.ui.model.FilterOperator.Contains,
			// 		sValue
			// 	), new Filter(
			// 		"ShortDesc",
			// 		sap.ui.model.FilterOperator.Contains, sValue
			// 	),
			// 	new Filter(
			// 		"LongDesc",
			// 		sap.ui.model.FilterOperator.Contains, sValue
			// 	)
			// ];
			var aFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("GlAcc", sap.ui.model.FilterOperator.Contains, sValue),
					new sap.ui.model.Filter("ShortDesc", sap.ui.model.FilterOperator.Contains, sValue),
					new sap.ui.model.Filter("LongDesc", sap.ui.model.FilterOperator.Contains, sValue)
				],
				and: false
			});
			evt.getSource().getBinding("items").filter(aFilter);
		},

		acCodeValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				this.getModel("CI").setProperty(this.sPath + "/Sakto", data.GlAcc);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		aufnrValueHelp: function (oEvent) {
			this.sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var sInputValue = oEvent.getSource().getValue();
			var aufnrSelectDialog = this.byId("aufnrTableSelectDialog");
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
				this.getModel("CI").setProperty(this.sPath + "/Aufnr", data.Aufnr);
				var property = this.getModel("CI").getProperty(this.sPath);
				this.callBudgetHolder(property, this.sPath);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		companyValueHelp: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			this.getModel("CI").setProperty("/accSpath", sPath);
			var sInputValue = oEvent.getSource().getValue();
			var companySelectDialog = this.byId("companyTableSelectDialog");
			companySelectDialog.getBinding("items").filter([new Filter(
				"Bukrs",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			companySelectDialog.open(sInputValue);
		},

		companyValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"Bukrs",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);

		},

		companyValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				var sPath = this.getModel("CI").getProperty("/accSpath") + "/Bukrs";
				this.getModel("CI").setProperty(sPath, data.Bukrs);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		projectIdValueHelp: function (oEvent) {

			this.sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var sInputValue = oEvent.getSource().getValue();
			var projectIdSelectDialog = this.byId("projectIdTableSelectDialog");
			projectIdSelectDialog.getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("PrjId", sap.ui.model.FilterOperator.Contains, sInputValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue)
					],
					and: false
				})
			]);
			projectIdSelectDialog.open(sInputValue);
		},

		projectIdValueHelpSearch: function (evt) {

			var sValue = evt.getParameter("value");
			evt.getSource().getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("PrjId", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				})
			]);
		},

		projectIdValueHelpClose: function (oEvent) {

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {

				var data = aContexts[0].getObject();
				this.getModel("CI").setProperty(this.sPath + "/PrjId", data.PrjId);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		budgCodeValueHelp: function (oEvent) {

			this.sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			var sInputValue = oEvent.getSource().getValue();
			var budgCodeSelectDialog = this.byId("budgCodeTableSelectDialog");
			budgCodeSelectDialog.getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("BudgCode", sap.ui.model.FilterOperator.Contains, sInputValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue)
					],
					and: false
				})
			]);
			budgCodeSelectDialog.open(sInputValue);
		},

		budgCodeValueHelpSearch: function (evt) {

			var sValue = evt.getParameter("value");
			evt.getSource().getBinding("items").filter([
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("BudgCode", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				})
			]);
		},

		budgCodeValueHelpClose: function (oEvent) {

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {

				var data = aContexts[0].getObject();
				this.getModel("CI").setProperty(this.sPath + "/BudgCode", data.BudgCode);
				var property = this.getModel("CI").getProperty(this.sPath);
				this.callBudgetHolder(property, this.sPath);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},
		businessAreaValueHelp: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			this.getModel("CI").setProperty("/accSpath", sPath);
			var sInputValue = oEvent.getSource().getValue();
			var businessAreaSelectDialog = this.byId("businessAreaTableSelectDialog");
			businessAreaSelectDialog.getBinding("items").filter([new Filter(
				"Gtext",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			businessAreaSelectDialog.open(sInputValue);
		},

		businessAreaValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			// 			if (sValue !== "") {
			var oFilter = new Filter(
				"Gtext",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
			// 			}
		},

		businessAreaValueHelpClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var data = aContexts[0].getObject();
				var sPath = this.getModel("CI").getProperty("/accSpath") + "/Gsber";
				this.getModel("CI").setProperty(sPath, data.Gsber);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		updateStatus: function (oEntry, isRefresh, successFn) {
			if (!isRefresh) {
				isRefresh = true;
			}
			var that = this;
			that.byId("loadingDialog").open();
			var oData = that.getModel("CI").getData();
			var oHeaders = {
				"MyETag": oData.Lastchange.trim()
			};
			this.getModel().create("/CIHEADSet", oEntry, {
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
									onClose: function (sButton) {
										if (sButton === sap.m.MessageBox.Action.OK) {} else {

										}
									}
								});
							} else {
								that.alert(dataJson.message);
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

							that.readCI(oEntry.Cino);
						}
						if (dataJson.severity === "warning") {
							that.alert(dataJson.message);
							return;
						}

						if (isRefresh) {
							that.readCI(oEntry.Cino);
						}
						if (successFn) {
							successFn();
						}
						return;
					}
					if (isRefresh) {
						that.readCI(oEntry.Cino);
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
		},

		callFunction: function (functionName, parameters, successFunction, errorFunction) {
			var that = this;
			// 			that.byId("loadingDialog").open();
			that.getModel().callFunction("/" + functionName, {
				method: "GET",
				urlParameters: parameters,
				success: function (data, response) {

					// 	that.byId("loadingDialog").close();
					if (data.ReturnType === "E") {
						that.alert(data.ReturnMsg);
						if (errorFunction) {
							errorFunction(data, response);
						}
						return;
					}
					if (successFunction) {
						successFunction(data, response);
					}
				},
				error: function (oError) {
					that.byId("loadingDialog").close();
					that.alert(oError.message);
				}
			});
		},

		updateStatusA: function (oEntry, isRefresh, successFn) {
			if (!isRefresh) {
				isRefresh = true;
			}
			var that = this;
			that.byId("loadingDialog").open();
			var oData = that.getModel("CI").getData();
			var oHeaders = {
				"MyETag": oData.Lastchange.trim()
			};
			this.getModel().create("/CIHEADSet", oEntry, {
				method: "POST",
				headers: oHeaders,
				success: function (oData, response) {
					that.byId("loadingDialog").close();
					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);

						if (dataJson.severity === "error") {
							that.SaveStatus = -1;
							if (dataJson.message.search("is processing by") > -1 || dataJson.message.search(
									"has just been updated by another user. Please reload this e-form and make your changes again.") > -1) {
								sap.m.MessageBox.warning(dataJson.message, {
									title: "Warning",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {
										if (sButton === sap.m.MessageBox.Action.OK) {} else {

										}
									}
								});
							} else {
								that.alert(dataJson.message);
							}
							return;
						}

						if (that.role === "2") {
							sap.m.MessageBox.alert(dataJson.message, {
								title: "Message",
								onClose: function (sButton) {
									if (sButton === sap.m.MessageBox.Action.OK) {
										that.navToWorklist();
									}
								}
							});
						} else {
							that.alert(dataJson.message);
						}

						if (dataJson.severity === "error") {
							return;
						}
						if (isRefresh) {
							that.readCI(oEntry.Cino);
						}
						if (successFn) {
							successFn();
						}
						return;
					}
					if (isRefresh) {
						that.readCI(oEntry.Cino);
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
				this.getModel("CI").setProperty(this.sPath, data.PrdType);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		descriptionValueHelp: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			this.sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			this.getModel("CI").setProperty("/Description", property.Description);
			this.byId("dialogDescription").open();
		},

		onDialogDescriptionSavePress: function (oEvent) {
			// 			var that = this;
			// 			that.byId("loadingDialog").open();
			// 			this.getModel().callFunction("/CHECK_LINES_NO", {
			// 				method: "GET",
			// 				urlParameters: {
			// 					"STR": this.getModel("CI").getProperty("/Description")
			// 				},
			// 				success: function (oData, response) {

			// 					that.byId("loadingDialog").close();
			// 					if (oData.LINES > 17) {
			// 						that.alert("Description CANNOT be more than 17 lines.");
			// 					}
			// 					var array = oData.CONTENS.split("\n");
			// 					array.splice(17);
			// 					// 	that.getModel("CI").setProperty(that.sPath + "/Description", array.join("\n"));
			// 					that.getModel("CI").setProperty(that.sPath + "/Description", oData.CONTENS);
			// 					that.getModel("CI").setProperty(that.sPath + "/Description_Temp", array[0]);
			// 					if (that.byId("dialogDescription").isOpen()) {
			// 						that.byId("dialogDescription").close();
			// 					}
			// 				},
			// 				error: function (oError) {}
			// 			});
			var oDescription = this.getModel("CI").getProperty("/Description");
			this.getModel("CI").setProperty(this.sPath + "/Description", oDescription);
			this.getModel("CI").setProperty(this.sPath + "/Description_Temp", oDescription.substring(0, 50));
			this.byId("dialogDescription").close();
		},

		onDialogDescriptionCancelPress: function () {
			this.byId("dialogDescription").close();
		},

		changeDescription: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("CI").getProperty();
			this.sPath = oEvent.getSource().getParent().getBindingContext("CI").sPath;
			this.getModel("CI").setProperty("/Description", property.Description_Temp);
			this.onDialogDescriptionSavePress();
		}

	});

});