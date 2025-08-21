sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], (Controller, JSONModel, Filter, FilterOperator) => {
	"use strict";

	return Controller.extend("com.lt.educationaladmin.controller.EducationalAdmin", {
		onInit: function () {
			this.oODataModel = this.getOwnerComponent().getModel("educational"); // OData model
			this.getView().setModel(new sap.ui.model.json.JSONModel(), "activeModel"); // Active model for table
			this._loadData("PA"); // Load default tab data
			
			const statusList = ["A", "D", "R"];
			for (const status of statusList) {
				this._getStatusCount(status);
			}
		},

		onFilterSelect: function (oEvent) {
			const sKey = oEvent.getParameter("key");
			this._loadData(sKey);
		},

		_loadData: function (statusKey) {
			const oView = this.getView();
			//const oModel = this.getOwnerComponent().getModel();//this.oODataModel;
			let oModel = this.getOwnerComponent().getModel("educational")//"educational"
			const filters = [new sap.ui.model.Filter("status", FilterOperator.EQ, statusKey)];
			let oBinding = oModel.bindList("/Educational_History", undefined, undefined, filters)
			// Build filter based on tab key

			// Read from OData service
		/*	oModel.read("/Educational_History", {
				filters: aFilters,
				success: function (oData) {
					const oJSONModel = new sap.ui.model.json.JSONModel(oData);
					oView.setModel(oJSONModel, "active");
				},
				error: function (oError) {
					console.error("OData read failed", oError);
				}
			}); */
				oBinding.requestContexts().then((aContexts) => {
					let aData = aContexts.map((oContext) => oContext.getObject())	
                    
					let model = new JSONModel({count:aContexts.length})
                    this.getView().setModel(model, "pendingList")

                    const oJSONModel = new sap.ui.model.json.JSONModel(aData);
					oView.setModel(oJSONModel, "activeModel");

				}).catch((error) => {
					console.error("Error Fetching HanaDBPendingList data:", error)
				})
		},

		_getStatusCount: function (statusKey) {
			const oView = this.getView();
			const oModel = this.oODataModel;
			const filters = [new sap.ui.model.Filter("status", FilterOperator.EQ, statusKey)];
			let oBinding = oModel.bindList("/Educational_History", undefined, undefined, filters)

				oBinding.requestContexts().then((aContexts) => {
					let aData = aContexts.map((oContext) => oContext.getObject())	
                    
					if (statusKey === "A"){
						let aModel = new JSONModel({count:aContexts.length})
						this.getView().setModel(aModel, "approvedList")
					} else if (statusKey === "D"){
						let dModel = new JSONModel({count:aContexts.length})
						this.getView().setModel(dModel, "draftList")
					} else {
						let rModel = new JSONModel({count:aContexts.length})
						this.getView().setModel(rModel, "rejectedList")
					}

				}).catch((error) => {
					console.error("Error Fetching HanaDBPendingList data:", error)
				})
		},

        onListItemPress: function (oEvent) {

            var oSource = oEvent.getSource(),
            oContext = oSource.getBindingContext("activeModel"),
            oSelectedID = oContext.getObject().psid;

            //var oSelectedID = "123456";

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("educationalDetail", {psid: oSelectedID});
		}
	});
});