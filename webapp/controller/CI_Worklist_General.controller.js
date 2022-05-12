sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController",
	"ZEFORM/Invoice/model/formatter",
	"sap/ui/model/json/JSONModel"
], function (BaseController, formatter, JSONModel) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.CI_Worklist_General", {

		formatter: formatter,
		onInit: function () {
			this.getRouter().getRoute("CI_Worklist_General").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function (oEvent) {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI: General Enquiry");
			}
			this.changeBackBtnEventToHome();
			// 			this.getRole();
		},

		onBeforeExport: function (oEvt) {
			var mExcelSettings = oEvt.getParameter("exportSettings");
			if (mExcelSettings.url) {
				return;
			}
			mExcelSettings.fileName = "Worklist for General";
			if (mExcelSettings.workbook && mExcelSettings.workbook.columns) {
				mExcelSettings.workbook.columns.some(function (oColumnConfiguration) {
					if ($.inArray(oColumnConfiguration.property, ["Invdate", "ChgDate", "CrtDate", "Duedate"]) > -1) {
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
			// 			oEvent.getSource().search();
		},

		onBeforeRebindTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			if (oBindingParams.sorter.length === 0) {
				oBindingParams.sorter = new sap.ui.model.Sorter("Cino", true);
			}
			oBindingParams.parameters.select = oBindingParams.parameters.select + ",Role";
		},

		onPressCino: function (oEvent) {
			// 			var cino = oEvent.oSource.getText();
			var property = oEvent.getSource().getBindingContext().getObject();
			this.toDetail(property.Cino, property.Role);
		},

		toDetail: function (cino, role) {
			this.getRouter().navTo("CustomerInvoice_Action", {
				Cino: cino,
				Role: role,
				Action: "display"
			});
		},

		getRole: function (fn) {
			var that = this;
			this.callFunction("GET_ROLE", {}, function (data, response) {
				that.role = data.Role;
				if (fn) {
					fn();
				}
			});
		},

		initDocEnabled: function () {
			var indices = this.byId("table").getSelectedIndices();
			var property = this.byId("table").getContextByIndex(indices[0]).getObject();
			var oData = this.getModel("Doc").getData();
			for (var i = 0; i < oData.DOCSet.length; i++) {
				var item = oData.DOCSet[i];
				if (property.Role === "5") {
					item.EmailEnabled = false;
				} else {
					if (item.Fno === "X") {
						item.EmailEnabled = false;
					} else {
						item.EmailEnabled = true;
					}
				}
			}
			this.getModel("Doc").setData(oData);
		},

		openDocDialog: function (oEvent) {
			var that = this;
			var indices = this.byId("table").getSelectedIndices();
			if (indices.length !== 1) {
				that.alert("Please select one item.");
				return;
			}

			that.byId("loadingDialog").open();
			var property = this.byId("table").getContextByIndex(indices[0]).getObject();

			this.Cino = property.Cino;

			this.getModel().read("/CIHEADSet('" + property.Cino + "')/CIHEADTODOC", {
				success: function (oData, oResponse) {

					that.byId("loadingDialog").close();

					var jsonData = {
						DOCSet: []
					};
					for (var i = 0; i < oData.results.length; i++) {
						var data = oData.results[i];
						var itemData = {};
						for (var key in data) {
							if (key === "__metadata") {
								continue;
							}
							itemData[key] = data[key];
						}

						jsonData.DOCSet.push(itemData);
					}
					var oModel = new JSONModel(jsonData);
					that.setModel(oModel, "Doc");
					that.initDocEnabled();
					that.byId("docDialog").open();
				},
				error: function (oError) {

				}
			});
		},

		downloadDoc: function (oEvent) {
			var items = this.byId("docTable").getItems();
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item === oEvent.getSource().getParent()) {
					var b64Data = item.getCells()[7].getText().replace(",", "");
					var fileType = item.getCells()[5].getText();
					var fileName = item.getCells()[0].getText();

					var arr = fileName.split(".");
					var suffix = ["PDF", "TXT"];
					if (arr[1].toUpperCase() === "PDF") {
						fileType = "application/pdf";
					} else if (arr[1].toUpperCase() === "TXT") {
						fileType = "text/plain";
					}

					var blob = this.b64toBlob(b64Data, fileType);
					var downloadLink = document.getElementById("downloadLink");
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
				}
			}
		},

		closeDocDialog: function () {
			this.byId("docDialog").close();
		},

		docAddRow: function () {
			var that = this;
			var oData = this.getModel("Doc").getData();
			var reader = new FileReader();
			var file = this.byId("docFile").getFocusDomRef().files[0];
			var base64_marker = ";base64";
			var fileType = file.type;
			var fileName = this.byId("docFile").getValue();
			reader.readAsDataURL(file);
			reader.onload = function (e) {
				var base64Index = this.result.indexOf(base64_marker) + base64_marker.length;
				var base64 = this.result.substring(base64Index);

				var b64Data = base64.replace(",", "");
				var blob = that.b64toBlob(b64Data, fileType);

				if (blob.size > 10485760) {
					that.alert("Unable to upload as the file size of " + fileName + " is over 10MB.");
					return;
				}

				oData.DOCSet.push({
					Content: base64,
					Fname: fileName,
					Doctype: fileType
				});
				that.getModel("Doc").setData(oData);
				that.initDocEnabled();
			};
		},

		docRemoveRow: function () {
			var oData = this.getModel("Doc").getData();
			var selectedItems = this.byId("docTable").getSelectedItems();
			var items = this.byId("docTable").getItems();
			for (var j = selectedItems.length - 1; j >= 0; j--) {
				for (var i = 0; i < items.length; i++) {
					if (selectedItems[j] === items[i]) {
						oData.DOCSet.splice(i, 1);
						break;
					}
				}
			}
			this.getModel("Doc").setData(oData);
		},

		doc: function () {
			var that = this;
			that.byId("docFile").setValue("");

			var oData = that.getModel("Doc").getData();

			var oDoc = [];
			for (var i = 0; i < oData.DOCSet.length; i++) {
				var data = oData.DOCSet[i];
				var itemData = {};
				for (var key in data) {
					if (key !== "EmailEnabled") {
						itemData[key] = data[key];
					}
				}
				oDoc.push(itemData);
			}

			var oEntry = {
				Cino: this.Cino,
				CIHEADTODOC: oDoc,
				IsWorklist: "X",
				Parameter: "doc"
			};

			that.updateStatus(oEntry);
			that.byId("docDialog").close();
		},

		printGen: function () {
			var cinoArray = [];
			var indices = this.byId("table").getSelectedIndices();
			if (indices.length === 0) {
				this.alert("Please select at least 1 record.");
				return;
			}
			for (var i = 0; i < indices.length; i++) {
				var itemData = this.byId("table").getContextByIndex(indices[i]).getObject();
				cinoArray.push(itemData.Cino);
			}

			var str = cinoArray.join(",");
			var oEntry = {
				Cino: itemData.Cino,
				Cinos: str,
				Parameter: "excel",
				IsWorklist: "X",
				CIHEADTOITEM: []
			};
			var that = this;
			that.byId("loadingDialog").open();
			this.getModel().create("/CIHEADSet", oEntry, {
				method: "POST",
				success: function (oData, response) {
					var url = window.location.protocol + "//" + window.location.host + that.getView().getModel().sServiceUrl +
						"/PDFSet(No='111',Preview='CIEXCEL',Version='')/$value";
					var filename = "Mega Report.xlsx";
					that.download(url, filename);
					// 	that.byId("loadingDialog").close();
				},
				error: function (oError) {}
			});
		},

		download: function (url, filename) {
			var that = this;
			that.getBlob(url).then(function (blob) {
				that.saveAs(blob, filename);
				that.byId("loadingDialog").close();
			});
		},

		getBlob: function (url) {
			return new Promise(function (resolve) {
				var xhr = new XMLHttpRequest();

				xhr.open("GET", url, true);
				xhr.responseType = "blob";
				xhr.onload = function () {
					if (xhr.status === 200) {
						resolve(xhr.response);
					}
				};

				xhr.send();
			});
		},

		saveAs: function (blob, filename) {

			if (window.navigator.msSaveOrOpenBlob) {
				navigator.msSaveBlob(blob, filename);
				this.status = 1;
			} else {
				var link = document.createElement("a");
				var body = document.querySelector("body");

				link.href = window.URL.createObjectURL(blob);
				link.download = filename;

				// fix Firefox
				link.style.display = "none";
				body.appendChild(link);

				link.click();
				body.removeChild(link);

				window.URL.revokeObjectURL(link.href);

			}
		},

		callFunction: function (functionName, parameters, successFunction, errorFunction) {
			var that = this;
			that.byId("loadingDialog").open();
			that.getModel().callFunction("/" + functionName, {
				method: "GET",
				urlParameters: parameters,
				success: function (data, response) {

					that.byId("loadingDialog").close();
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

		updateStatus: function (oEntry) {
			var that = this;
			that.byId("loadingDialog").open();
			that.getModel().setUseBatch(false);
			that.getView().getModel().create("/CIHEADSet", oEntry, {
				method: "POST",
				success: function (oData, response) {

					that.byId("loadingDialog").close();

					if (response.headers["sap-message"]) {
						var dataJson = JSON.parse(response.headers["sap-message"]);
						that.alert(dataJson.message);
						// 		if (dataJson.details && dataJson.details.length > 0) {
						// 			for (var i = 0; i < dataJson.details.length; i++) {
						// 				that.alert(dataJson.details[i].message);
						// 			}
						// 		}
					}
					that.getModel().setUseBatch(true);
					that.getModel().refresh();
				},
				error: function (oError) {
					that.byId("loadingDialog").close();
					that.alert(oError.message);
				}
			});
		}

	});
});