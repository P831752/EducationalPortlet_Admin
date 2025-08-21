sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], (Controller, JSONModel, Filter, FilterOperator) => {
	"use strict";

	return Controller.extend("com.lt.educationaladmin.controller.EducationalAdmin", {
		onInit: function () {
			const oView = this.getView();

			// Sample data for each tab
			const pendingData = { data: [{ psid: "1001", status: "Pending", modifiedat: "2025-08-01" }] };
			const approvedData = { data: [{ psid: "1002", status: "Approved", modifiedat: "2025-08-02" }] };
			const rejectedData = { data: [{ psid: "1003", status: "Rejected", modifiedat: "2025-08-03" }] };

			// Set models
			oView.setModel(new sap.ui.model.json.JSONModel(pendingData), "pendingModel");
			oView.setModel(new sap.ui.model.json.JSONModel(approvedData), "approvedModel");
			oView.setModel(new sap.ui.model.json.JSONModel(rejectedData), "rejectedModel");

			// Set default active model
			oView.setModel(oView.getModel("pendingModel"), "activeModel");
		},

		onFilterSelect: function (oEvent) {
			const sKey = oEvent.getParameter("key");
			const oView = this.getView();

			switch (sKey) {
				case "pending":
					oView.setModel(oView.getModel("pendingModel"), "activeModel");
					break;
				case "approved":
					oView.setModel(oView.getModel("approvedModel"), "activeModel");
					break;
				case "rejected":
					oView.setModel(oView.getModel("rejectedModel"), "activeModel");
					break;
			}
		}

	});
});