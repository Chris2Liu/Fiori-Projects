sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"ZEFORM/Invoice/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType"
], function (Controller, JSONModel, MessageBox, formatter, Filter, Message, MessageType) {
	"use strict";

	return Controller.extend("ZZEFORM.Invoice.controller.BaseController", {
		formatter: formatter,

		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		initEvent: function () {
			sap.ui.base.EventProvider.prototype.detachAllEventHandlers = function (sEventId) {
				var aEventListeners = this.mEventRegistry[sEventId];
				if (!Array.isArray(aEventListeners)) {
					return this;
				}
				for (var i = 0; i < aEventListeners.length; i++) {
					this.detachEvent(sEventId, aEventListeners[i].fFunction, aEventListeners[i].oListener);
				}
			};
		},

		changeBackBtnEventToHome: function () {
			var backBtn = sap.ui.getCore().byId("backBtn");
			if (!backBtn) {
				return;
			}
			backBtn.detachAllEventHandlers("press");
			backBtn.attachPress(function () {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
			});
		},

		initCommonModel: function () {
			var oModel = new JSONModel(this.getCommonJson());
			this.setModel(oModel, "common");
		},

		initCss: function () {
			window.AppKey = "Invoice";
			var interval = setInterval(function () {
				if (window.AppKey !== "Invoice") {
					clearInterval(interval);
				}
				$(".sapMLabel").css({
					"display": "inline",
					"text-align": "left",
					"white-space": "pre-line"
				});

				$(".sapMSelectListLastCell").css({
					"text-align": "left"
				});

				$(".sapMCb").css({
					"display": "inline-table"
				});

				$(".sapMObjectAttributeText").css({
					"max-width": "100%"
				});

				$(".sapMObjectAttributeDiv").css({
					"white-space": "normal"
				});

				$("input:disabled").css({
					"background-color": "#dddddd",
					"color": "#000000",
					"font-weight": "bold"
				});

				$("textarea:disabled").css({
					"background-color": "#dddddd",
					"color": "#000000",
					"font-weight": "bold"
				});

				$(".datepicker").css({
					"background-color": "white",
					"color": "white",
					"font-weight": "bold"
				});

				$("input:disabled[type='checkbox']").parent().css({
					"background-color": "#dddddd",
					"color": "#000000",
					"font-weight": "bold"
				});

				$(".sapMSltDisabled").css({
					"background-color": "#dddddd",
					"color": "#000000",
					"font-weight": "bold"
				});

				$(".labelC").css({
					"margin-top": "12px"
				});

				$(".phone").attr("x-ms-format-detection", "none");

			}, 200);
		},

		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		alert: function (message, closeFn) {
			sap.m.MessageBox.alert(message, {
				onClose: closeFn,
				title: "Message"
			});
		},

		initMessageManager: function () {
			if (!this.messagePopover) {
				this.messagePopover = sap.ui.xmlfragment(this.oView.getId(), "ZEFORM.Invoice.view.fragment.MessagePopover", this);
				this.getView().addDependent(this.messagePopover);
			}

			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(this.getView(), true);
			this.setModel(oMessageManager.getMessageModel(), "message");
		},

		addMessage: function (message, type) {
			if (!type) {
				type = "Error";
			}
			var oMessage = new Message({
				message: message,
				type: type
			});
			sap.ui.getCore().getMessageManager().addMessages(oMessage);
		},

		onMessagePopoverPress: function (oEvent) {
			this.byId("messagePopover").openBy(oEvent.getSource());
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * 获取 blob
		 * @param  {String} url 目标文件地址
		 * @return {Promise} 
		 */
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

		/**
		 * 保存
		 * @param  {Blob} blob     
		 * @param  {String} filename 想要保存的文件名称
		 */
		saveAs: function (blob, filename) {
			if (window.navigator.msSaveOrOpenBlob) {
				navigator.msSaveBlob(blob, filename);
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

		openPDF: function (url) {
			var that = this;
			that.getBlob(url).then(function (blob) {
				if (window.navigator.msSaveOrOpenBlob) {
					navigator.msSaveBlob(blob);
				} else {
					var link = document.createElement("a");
					link.href = window.URL.createObjectURL(blob);
					window.open(link.href);
				}
			});
		},

		/**
		 * 下载
		 * @param  {String} url 目标文件地址
		 * @param  {String} filename 想要保存的文件名称
		 */
		download: function (url, filename) {

			var that = this;
			that.getBlob(url).then(function (blob) {
				that.saveAs(blob, filename);
			});
		},
		/**
		 * base64转Blob
		 * @param {string} b64Data
		 * @param {string} contentType
		 * @param {number} sliceSize
		 */
		b64toBlob: function (b64Data, contentType, sliceSize) {
			contentType = contentType || "";
			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}

			var blob = new Blob(byteArrays, {
				type: contentType
			});

			return blob;
		},

		replaceAll: function (str, s1, s2) {
			return str.replace(new RegExp(s1, "gm"), s2);
		},

		moneyToNumber: function (money) {
			return this.replaceAll(money, ",", "");
		}
	});

});