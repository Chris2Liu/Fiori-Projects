sap.ui.define([
		"./BaseController",
		"../model/formatter",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox"
	],
	function (BaseController, formatter, JSONModel, MessageBox) {
		"use strict";

		return BaseController.extend("dynasys.com.hk.demo.controller.SalesOrder", {

			formatter: formatter,

			onInit: function () {
				this.getRouter().getRoute("SalesOrder").attachPatternMatched(this._onMatched, this);
			},

			_onMatched: function () {
				this.resetModel();
			},

			resetModel: function () {

				var oData = {
					// HeaderSet: [],
					ItemSet: []
				};

				var oModel = new JSONModel(oData);
				this.setModel(oModel, "SO");
			},

			createSalesOrderInfo: function () {

				var oValue = this.byId("oVbeln").getValue();
				if (!oValue) {
					this.alert("Please input Sales Order No.", this.resetModel());
					return;
				}

				var oData = this.getModel("SO").getData();
				var oEntry = {
					Vbeln: oData.Vbeln
				};

				var that = this;
				var oModel = this.getView().getModel();
				this.byId("loadingDialog").open();
				oModel.create("/SalesOrderHeaderSet", oEntry, {
					success: function (sData, response) {
						that.byId("loadingDialog").close();
						that.alertMsg(response);
					},
					error: function (oError) {
						that.alert(oError.message);
						that.byId("loadingDialog").close();
					}
				});

			},

			getSalesOrderInfo: function () {

				var oValue = this.byId("oVbeln").getValue();
				if (!oValue) {
					this.alert("Please input Sales Order No.", this.resetModel());
					return;
				}

				var that = this;
				var oModel = this.getView().getModel();
				this.byId("loadingDialog").open();
				oModel.read("/SalesOrderHeaderSet('" + oValue + "')", {
					success: function (oData, response) {
						var jsonData = that.getModel("SO").getData();
						for (var key in oData) {
							if (key === "__metadata") {
								continue;
							}
							jsonData[key] = oData[key];
						}
						that.getModel("SO").setData(jsonData);
						that.readItem(oValue);
					},
					error: function (oError) {
						that.alert(oError.message);
						that.byId("loadingDialog").close();
					}
				});

			},

			readItem: function (oVbeln) {
				var that = this;
				this.getModel().read("/SalesOrderHeaderSet('" + oVbeln + "')/SalesOrder", {
					success: function (oData, oResponse) {
						var jsonData = that.getModel("SO").getData();
						jsonData.ItemSet = [];
						for (var i = 0; i < oData.results.length; i++) {
							var data = oData.results[i];
							var itemData = {};
							for (var key in data) {
								if (key === "__metadata") {
									continue;
								}
								itemData[key] = data[key];
							}
							jsonData.ItemSet.push(itemData);
						}
						that.getModel("SO").setData(jsonData);
						that.byId("loadingDialog").close();
					},
					error: function (oError) {

					}
				});
			},

			updateSalesOrderInfo: function () {
				var oValue = this.byId("oVbeln").getValue();
				if (!oValue) {
					this.alert("Please input Sales Order No.", this.resetModel());
					return;
				}

				var that = this;
				var oModel = this.getView().getModel();

				var oData = this.getModel("SO").getData();

				var oEntry = {
					Vbeln: oData.Vbeln,
					Waerk: oData.Waerk
				};

				this.byId("loadingDialog").open();
				oModel.update("/SalesOrderHeaderSet('" + oValue + "')", oEntry, {
					success: function (sData, response) {
						// that.alert("Update successfully");
						that.alertMsg(response);
						that.getSalesOrderInfo();
					},
					error: function (oError) {
						that.alert(oError.message);
						that.byId("loadingDialog").close();
					}
				});
			},

			deteleSalesOrder: function () {
				var oValue = this.byId("oVbeln").getValue();
				if (!oValue) {
					this.alert("Please input Sales Order No.", this.resetModel());
					return;
				}

				var that = this;
				var oModel = this.getView().getModel();

				this.byId("loadingDialog").open();
				oModel.remove("/SalesOrderHeaderSet('" + oValue + "')", {
					success: function (sData, response) {
						that.byId("loadingDialog").close();
						that.alertMsg(response);
					},
					error: function (oError) {
						that.alert(oError.message);
						that.byId("loadingDialog").close();
					}
				});
			},

			alertMsg: function (response) {

				if (response.headers["sap-message"]) {
					var dataJson = JSON.parse(response.headers["sap-message"]);

					if (dataJson.severity === "error") {
						this.alert(dataJson.message);
					} else if (dataJson.severity === "info") {
						var details = dataJson.details;
						if (dataJson.message) {
							details.push(dataJson);
						}

						var warningMessageArray = [];
						for (var i = 0; i < details.length; i++) {
							warningMessageArray.push(details[i].message);
						}

						if (warningMessageArray.length > 0) {
							this.alert(warningMessageArray.join("\n"));
						} else {
							this.alert(dataJson.message);
						}

					} else if (dataJson.severity === "warning") {
						this.alert(dataJson.message);
					} else {
						this.alert(dataJson.message);
					}

				}
			}

		});
	});