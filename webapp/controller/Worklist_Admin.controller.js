sap.ui.define([
	"ZEFORM/PettyCash/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("ZEFORM.PettyCash.controller.Worklist_Admin", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Admin
		 */
		onInit: function () {
			this.getRouter().getRoute("Worklist_Admin").attachPatternMatched(this._onMatched, this);
			this.initEvent();
		},

		_onMatched: function () {
			if (sap.ui.getCore().byId("shellAppTitle")) {
				sap.ui.getCore().byId("shellAppTitle").setText("PC: Worklist for Administrator");
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
			oBindingParams.parameters.select = oBindingParams.parameters.select +
				",Status";
		},

		onInitSmartTable: function (oEvent) {
			this.byId("smarttable")._oVariantManagement.setShowShare(false);
		},

		onPressClaimno: function (oEvent) {
			var claimno = oEvent.oSource.getText();
			this.toDetail(claimno);
		},

		toDetail: function (claimno) {
			this.getRouter().navTo("Order_Action", {
				Pcno: claimno,
				Role: "2",
				Action: "create_pc"
			});
		},

		onReimburse: function () {

			var that = this;

			var oSelectedIndices = that.byId("table").getSelectedIndices();
			if (oSelectedIndices.length === 0) {
				this.alert("Please select at least one record.");
				return;
			}

			var oModel = this.getView().getModel();
			oModel.setDeferredGroups(["group1"]);

			for (var i = 0; i < oSelectedIndices.length; i++) {
				var oSelectedData = that.byId("table").getContextByIndex(oSelectedIndices[i]).getObject();
				if ($.inArray(oSelectedData.Status, ["01"]) > -1) {
					var oEntry = {
						Claimno: oSelectedData.Claimno,
						Parameter: "reimburse"
					};
					var params = "Claimno=" + "'" + oSelectedData.Claimno + "'";
					oModel.update("/WORKLIST_ADMINSet(" + params + ")", oEntry, {
						method: "PUT",
						success: function (oData, response) {},
						error: function (oError) {},
						groupId: "group1"
					});
				} else {
					this.alert('The status of Claim No. "' + oSelectedData.Claimno + '" cannot be reimbursed.');
					return;
				}
			}

			this.byId("loadingDialog").open();

			oModel.submitChanges({
				success: function (oData, response) {
					that.byId("loadingDialog").close();
					var msgArr = response.data;
					var dataJson = JSON.parse(msgArr.__batchResponses[0].__changeResponses[0].headers["sap-message"]);
					if (dataJson) {
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
							for (var j = 0; j < details.length; j++) {
								if (details[j].severity === "warning" || details[j].severity === "info") {
									warningMessageArray.push(details[j].message);
									continue;
								}
							}
							if (warningMessageArray.length > 0) {
								that.alert(warningMessageArray.join("\n"));
							} else {
								that.alert(dataJson.message);
							}
						}

					}
					that.byId("table").clearSelection();
					that.getModel().refresh();
				},
				error: function (e) {
					that.alert(e.message);
					that.byId("loadingDialog").close();
				},
				groupId: "group1"
			});

		},

		onGenerateBatch: function () {

			var that = this;

			var oSelectedIndices = that.byId("table").getSelectedIndices();
			if (oSelectedIndices.length === 0) {
				this.alert("Please select at least one record.");
				return;
			}

			var oModel = this.getView().getModel();
			oModel.setDeferredGroups(["group1"]);

			var adminArray = [];

			for (var i = 0; i < oSelectedIndices.length; i++) {
				var oSelectedData = that.byId("table").getContextByIndex(oSelectedIndices[i]).getObject();
				if ($.inArray(oSelectedData.Status, ["03"]) > -1) {
					adminArray.push(oSelectedData.Admin);
					var oEntry = {
						Claimno: oSelectedData.Claimno,
						Parameter: "gen_batch"
					};
					var params = "Claimno=" + "'" + oSelectedData.Claimno + "'";
					oModel.update("/WORKLIST_ADMINSet(" + params + ")", oEntry, {
						method: "PUT",
						success: function (oData, response) {},
						error: function (oError) {},
						groupId: "group1"
					});
				} else {
					this.alert('Claim No. "' + oSelectedData.Claimno + '" must be at the status “Claim reimbursed” in order to generate batch.');
					return;
				}
			}

			for (var k = 0; k < adminArray.length; k++) {
				if (adminArray[0] !== adminArray[k]) {
					this.alert("All selected claims must have the same Float Admin Party in order to generate batch.");
					return;
				}
			}

			sap.m.MessageBox.confirm("Are you sure to generate batch for the selected claim(s)?", {
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.OK) {
						that.byId("loadingDialog").open();
						oModel.submitChanges({
							success: function (oData, response) {
								that.byId("loadingDialog").close();
								var msgArr = response.data;
								var dataJson = JSON.parse(msgArr.__batchResponses[0].__changeResponses[0].headers["sap-message"]);
								if (dataJson) {
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
										for (var j = 0; j < details.length; j++) {
											if (details[j].severity === "warning" || details[j].severity === "info") {
												warningMessageArray.push(details[j].message);
												continue;
											}
										}
										if (warningMessageArray.length > 0) {
											that.alert(warningMessageArray.join("\n"));
										} else {
											that.alert(dataJson.message);
										}
									}

								}
								that.byId("table").clearSelection();
								that.getModel().refresh();
							},
							error: function (e) {
								that.alert(e.message);
								that.byId("loadingDialog").close();
							},
							groupId: "group1"
						});
					}
				}
			});

		},

		previewBatch: function () {
			var oSelectedIndices = this.byId("table").getSelectedIndices();
			if (oSelectedIndices.length === 0) {
				this.alert("Please select at least one record.");
				return;
			}

			var batchArray = [];
			var oBatchno;
			for (var i = 0; i < oSelectedIndices.length; i++) {
				var oSelectedData = this.byId("table").getContextByIndex(oSelectedIndices[i]).getObject();
				oBatchno = oSelectedData.Batchno;
				if (oSelectedData.Status >= "04") {
					batchArray.push(oSelectedData.Batchno);
				} else {
					this.alert('Claim No. "' + oSelectedData.Claimno +
						'" must be at/after the status “Batch Created” in order to preview Petty Cash Replenishment Request.');
					return;
				}
			}

			for (var k = 0; k < batchArray.length; k++) {
				if (batchArray[0] !== batchArray[k]) {
					this.alert("Please select one Batch No. for previewing Petty Cash Replenishment Request.");
					return;
				}
			}
			this.alert("Preview Cilcked");
		},

		printBatch: function () {

			// var that = this;

			var oSelectedIndices = this.byId("table").getSelectedIndices();
			if (oSelectedIndices.length === 0) {
				this.alert("Please select at least one record.");
				return;
			}

			var batchArray = [];
			var oBatchno;
			for (var i = 0; i < oSelectedIndices.length; i++) {
				var oSelectedData = this.byId("table").getContextByIndex(oSelectedIndices[i]).getObject();
				oBatchno = oSelectedData.Batchno;
				if ($.inArray(oSelectedData.Status, ["04"]) > -1) {
					batchArray.push(oSelectedData.Batchno);
				} else {
					this.alert('Claim No. "' + oSelectedData.Claimno +
						'" must be at the status “Batch Created” in order to print Petty Cash Replenishment Request.');
					return;
				}
			}

			for (var k = 0; k < batchArray.length; k++) {
				if (batchArray[0] !== batchArray[k]) {
					this.alert("Please select one Batch No. for printing Petty Cash Replenishment Request.");
					return;
				}
			}

			var oEntry = {
				Batchno: oBatchno,
				Parameter: "print_batch",
				PCHEADTODOC: []
			};
			this.updateStatus(oEntry);
			// need to download Forms
			// var url = window.location.protocol + "//" + window.location.host + this.getModel().sServiceUrl + "/PDFSet(No='" + oBatchno +
			// 	"',Preview='',Version='')/$value";
			// var filename = "Print Receipt Voucher-" + oData.Claimno + ".pdf";
			// this.download(url, filename);
		},

		onSTF: function () {

			var that = this;

			var oSelectedIndices = that.byId("table").getSelectedIndices();
			if (oSelectedIndices.length === 0) {
				this.alert("Please select at least one record.");
				return;
			}

			var batchArray = [];
			var oBatchno;
			for (var i = 0; i < oSelectedIndices.length; i++) {
				var oSelectedData = that.byId("table").getContextByIndex(oSelectedIndices[i]).getObject();
				oBatchno = oSelectedData.Batchno;
				if ($.inArray(oSelectedData.Status, ["05"]) > -1) {
					batchArray.push(oSelectedData.Batchno);
				} else {
					this.alert('Claim No. "' + oSelectedData.Claimno +
						'" must be at the status “Batched printed for approval” in order to submit to Finance Office.');
					return;
				}
			}

			for (var k = 0; k < batchArray.length; k++) {
				if (batchArray[0] !== batchArray[k]) {
					this.alert("Please select one Batch No. for submission to the Finance Office.");
					return;
				}
			}

			sap.m.MessageBox.confirm("Are you sure to submit Batch No. " + oBatchno +
				" and its underlying claims to the Finance Office for petty cash replenishment? \nPlease make sure that all documents have been fully checked and endorsed.", {
					onClose: function (sButton) {
						if (sButton === sap.m.MessageBox.Action.OK) {
							var oEntry = {
								Batchno: oBatchno,
								Parameter: "submit_fo",
								PCHEADTODOC: []
							};
							that.updateStatus(oEntry);
						}
					}
				});

		},

		onCancelBatch: function () {

			var that = this;

			var oSelectedIndices = that.byId("table").getSelectedIndices();
			if (oSelectedIndices.length === 0) {
				this.alert("Please select at least one record.");
				return;
			}

			var batchArray = [];
			var oBatchno;
			for (var i = 0; i < oSelectedIndices.length; i++) {
				var oSelectedData = that.byId("table").getContextByIndex(oSelectedIndices[i]).getObject();
				oBatchno = oSelectedData.Batchno;
				if ($.inArray(oSelectedData.Status, ["03", "04", "06", "07"]) > -1) {
					batchArray.push(oSelectedData.Batchno);
				} else {
					this.alert('The current status of Batch No. "' + oSelectedData.Claimno +
						'" does not allow batch cancellation.');
					return;
				}
			}

			for (var k = 0; k < batchArray.length; k++) {
				if (batchArray[0] !== batchArray[k]) {
					this.alert("Please select one Batch No. for submission to the Finance Office.");
					return;
				}
			}

			sap.m.MessageBox.confirm("Are you sure to cancel Batch No. " + oBatchno + "?", {
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.OK) {
						var oEntry = {
							Batchno: oBatchno,
							Parameter: "cancel_batch",
							PCHEADTODOC: []
						};
						that.updateStatus(oEntry);
					}
				}
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

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Admin
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Admin
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZEFORM.PettyCash.view.Worklist_Admin
		 */
		//	onExit: function() {
		//
		//	}

	});

});