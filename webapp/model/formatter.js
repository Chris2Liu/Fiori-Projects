sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/resource/ResourceModel"
], function (DateFormat, ResourceModel) {
	"use strict";

	return {

		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		formatPrice: function (price) {
			if (price === null || $.isNumeric(price) === false) {
				return 0.00.toFixed(2);
			}
			return parseFloat(price).toFixed(2);
		},

		formatDate1: function (date) {
			if (date === null || date === undefined || date === "") {
				return "";
			} else {
				//Cover time to timestrmp

				var myDate = new Date(date);
				var month = (myDate.getMonth() + 1);
				month = month < 10 ? "0" + month.toString() : month.toString();
				var day = myDate.getDate();
				day = day < 10 ? "0" + day.toString() : day.toString();
				return myDate.getFullYear() + "-" + month + "-" + day;
			}
		},

		formatDate: function (date) {
			if (date === null || date === undefined || date === "") {
				return "";
			} else {
				//Cover time to timestrmp

				var myDate = new Date(date);
				var month = (myDate.getMonth() + 1);
				month = month < 10 ? "0" + month.toString() : month.toString();
				var day = myDate.getDate();
				day = day < 10 ? "0" + day.toString() : day.toString();
				return day + "." + month + "." + myDate.getFullYear();
			}
		},

		formatInt: function (number) {
			if (number === null || number === "") {
				return "";
			}
			return parseFloat(number).toString();
		},

		formatYN: function (status) {
			if (status === true) {
				return "Yes";
			}
			return "No";
		},

		formatX: function (value) {
			if (value === true) {
				return "X";
			}
			return "";
		},

		formatMethod: function (method) {
			if (method === "1") {
				return "Print";
			} else if (method === "2") {
				return "Email";
			} else {
				return "";
			}
		}

	};
});