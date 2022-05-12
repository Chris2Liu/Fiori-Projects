sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"ZEFORM/Invoice/model/models",
	"sap/ui/core/ValueState"
], function (UIComponent, Device, models, ValueState) {
	"use strict";

	return UIComponent.extend("ZEFORM.Invoice.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			this.initBatchRequesteComplete();
		},

		initBatchRequesteComplete: function () {
			this.getModel().attachBatchRequestCompleted(function (oEvent) {
				if (oEvent.getParameters().requests && oEvent.getParameters().requests.length > 0 && oEvent.getParameters().requests[0].response &&
					oEvent.getParameters().requests[0].response.headers) {
					for (var i = 0; i < oEvent.getParameters().requests.length; i++) {
						var url = oEvent.getParameters().requests[i].url;
						if (url.indexOf("$count") > -1) {
							continue;
						}
						var message = oEvent.getParameters().requests[i].response.headers["sap-message"];
						if (message) {
							var oMessage = JSON.parse(message);
							if (oMessage.severity === "error" && oMessage.code === "O1/000") {
								sap.m.MessageBox.alert(oMessage.message, {
									title: "Message"
								});
								break;
							}
						}
					}
				}
			});
		}

	});
});