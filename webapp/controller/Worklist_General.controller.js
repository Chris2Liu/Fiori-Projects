sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ZEFORM/PettyCash/model/formatter",
	"sap/ui/export/library"
], function (BaseController, JSONModel, formatter, exportLibrary) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Worklist_General", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_General
		 */
		onInit: function () {
			this.getRouter().getRoute("Worklist_General").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function () {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("PC: General Enquiry");
			}
			this.changeBackBtnEventToHome();
			if (this.byId("smartFilterBar")._bIsInitialized === true) {
				this.byId("smartFilterBar").search();
			}
		},

		onInitSmartFilterBar: function (oEvent) {
			this.byId("smartFilterBar")._oVariantManagement.setShowShare(false);
			oEvent.getSource().getBasicSearchControl().setPlaceholder("Search by Claimant name or Category");
			var sDefaultVariantKey = this.byId("smartFilterBar").getVariantManagement().getDefaultVariantKey();
			if (sDefaultVariantKey === "*standard*") {
				this.byId("smartFilterBar").getVariantManagement().bExecuteOnSelectForStandardViaXML = true;
				this.byId("smartFilterBar").getVariantManagement().bExecuteOnSelectForStandardByUser = true;
			}
			this.byId("smartFilterBar").search();
		},

		onBeforeRebindTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.parameters.select = oBindingParams.parameters.select + ",Role,Status";
		},

		onInitSmartTable: function (oEvent) {
			this.byId("smarttable")._oVariantManagement.setShowShare(false);
		},

		onPressClaimno: function (oEvent) {
			var property = oEvent.getSource().getBindingContext().getObject();
			this.toDetail(property.Claimno, property.Role);
		},

		toDetail: function (claimno, role) {
			this.getRouter().navTo("Order_Action", {
				Pcno: claimno,
				Role: role,
				Action: "create_pc"
			});
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
			this.Claimno = property.Claimno;
			this.getModel().read("/PCHEADSet('" + property.Claimno + "')/PCHEADTODOC", {
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
					that.byId("docDialog").open();
				},
				error: function (oError) {}
			});
		},

		downloadDoc: function (oEvent) {
			var items = this.byId("docTable").getItems();
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item === oEvent.getSource().getParent()) {
					var b64Data = item.getCells()[6].getText().replace(",", "");
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
			var base64Marker = ";base64";
			var fileType = file.type;
			var fileName = this.byId("docFile").getValue();
			reader.readAsDataURL(file);
			reader.onload = function (e) {
				var base64Index = this.result.indexOf(base64Marker) + base64Marker.length;
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
			var oEntry = {
				Claimno: this.Claimno,
				PCHEADTODOC: oData.DOCSet,
				IsWorklist: "X",
				Role: "2",
				Parameter: "doc"
			};
			that.updateStatus(oEntry);
			that.byId("docDialog").close();
		},

		updateStatus: function (oEntry) {
			var that = this;
			that.byId("loadingDialog").open();
			that.getModel().setUseBatch(false);
			that.getView().getModel().create("/PCHEADSet", oEntry, {
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
								warningMessageArray.push(details[i].message);
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
		}

	});

});