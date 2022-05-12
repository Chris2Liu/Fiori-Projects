sap.ui.define([
	"ZEFORM/Invoice/controller/BaseController",
	"ZEFORM/Invoice/model/formatter",
	"sap/ui/model/json/JSONModel"
], function (BaseController, formatter, JSONModel) {
	"use strict";

	return BaseController.extend("ZEFORM.Invoice.controller.CI_Worklist_Endorser", {

		formatter: formatter,
		onInit: function () {
			this.getRouter().getRoute("CI_Worklist_Endorser").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function (oEvent) {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("CI: Worklist for Endorser");
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
			mExcelSettings.fileName = "Worklist for Endorser";
			if (mExcelSettings.workbook && mExcelSettings.workbook.columns) {
				mExcelSettings.workbook.columns.some(function (oColumnConfiguration) {
					if ($.inArray(oColumnConfiguration.property, ["Invdate", "ChgDate", "Duedate"]) > -1) {
						oColumnConfiguration.style = "medium";
						oColumnConfiguration.format = "dd.mm.yyyy";
					}
				});
			}
		},

		onBeforeRebindTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.parameters.select = oBindingParams.parameters.select +
				",Status";
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
				Role: "2",
				Action: "create_ci"
			});
		},

		onReturn: function () {
			var oEntryArray = new Array();
			var indices = this.byId("table").getSelectedIndices();
			for (var i = 0; i < indices.length; i++) {
				var itemData = this.byId("table").getContextByIndex(indices[i]).getObject();
				var oEntry;
				oEntry = {
					Cino: itemData.Cino,
					Parameter: "return",
					CIHEADTOITEM: []
				};
				oEntryArray.push(oEntry);
			}
			this.updateStatusBatch(oEntryArray, "Are you sure to reject the selected Invoice(s)?",
				"The selected Invoice(s) has been returned to preparer for correction.");
		},

		onAccept: function () {
			var oEntryArray = [];
			var indices = this.byId("table").getSelectedIndices();
			for (var i = 0; i < indices.length; i++) {
				var itemData = this.byId("table").getContextByIndex(indices[i]).getObject();
				if (itemData.Status !== "05") {
					sap.m.MessageBox.alert('The status of Invoice "' + itemData.Cino + '" cannot be approved.');
					return;
				}
				var oEntry;
				oEntry = {
					Cino: itemData.Cino,
					IsWorklist: "X",
					Parameter: "approve_head",
					CIHEADTOITEM: []
				};
				oEntryArray.push(oEntry);
			}
			this.updateStatusBatch(oEntryArray, "Are you sure to approve the selected Invoice(s)?",
				"The selected Invoice(s) has been approved.");
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

		checkData: function (oEntryArray) {
			var that = this;

			var indices = that.byId("table").getSelectedIndices();

			if (indices.length === 0) {
				that.alert("Please select at least one record.");
				return false;
			}

			var parameter = oEntryArray[0].Parameter;

			for (var i = 0; i < indices.length; i++) {
				var itemData = that.byId("table").getContextByIndex(indices[i]).getObject();

				if (parameter === "approve_head" && (itemData.Status === "05" && that.UserId === itemData.Endorser) === false) {
					sap.m.MessageBox.alert('The status of invoice "' + itemData.Cino + '" cannot be approved');
					return false;
				}

				if (parameter === "return" && (itemData.Status === "05" && that.UserId === itemData.Endorser) === false) {
					sap.m.MessageBox.alert('The status of invoice "' + itemData.Cino + '" cannot be returned');
					return false;
				}
			}

			return true;
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

						if (dataJson.severity === "error") {
							that.alert(dataJson.message);
							return;
						}

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

						}

						if (dataJson.severity === "warning") {
							that.alert(dataJson.message);
						}
					}
					that.getModel().setUseBatch(true);
					that.getModel().refresh();
				},
				error: function (oError) {
					that.byId("loadingDialog").close();
					that.alert(oError.message);
				}
			});
		},

		updateStatusBatch: function (oEntryArray, confirmMsg, successMsg) {
			if (this.checkData(oEntryArray) === false) {
				return;
			}
			var that = this;
			that.updateAll = oEntryArray.length;
			that.updateComplete = 0;
			that.updateSuccess = 0;
			this.getModel().setUseBatch(false);
			sap.m.MessageBox.confirm(confirmMsg, {
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.OK) {
						that.byId("loadingDialog").open();
						for (var i = 0; i < oEntryArray.length; i++) {
							var oEntry = oEntryArray[i];
							if (!oEntry.CIHEADTOITEM) {
								oEntry.CIHEADTOITEM = [];
							}
							that.getModel().create("/CIHEADSet", oEntry, {
								method: "POST",
								success: function (oData, response) {
									that.updateComplete = that.updateComplete + 1;
									if (response.headers["sap-message"]) {
										var dataJson = JSON.parse(response.headers["sap-message"]);
										if (dataJson.severity === "error") {
											that.alert(dataJson.message);
											return;
										}
									}
									that.updateSuccess = that.updateSuccess + 1;
								},
								error: function (oError) {
									that.updateComplete = that.updateComplete + 1;
									that.alert(oError.message);
								}
							});
						}

						var interval = setInterval(function () {
							if (that.updateComplete !== that.updateAll) {
								return;
							}
							clearInterval(interval);
							that.byId("loadingDialog").close();

							if (that.updateSuccess === that.updateAll) {
								that.alert(successMsg);
							}
							that.byId("table").clearSelection();
							that.getModel().setUseBatch(true);
							that.getModel().refresh();
						}, 200);
					}
				}
			});

		}
	});
});