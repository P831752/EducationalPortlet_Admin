sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("com.lt.educationaladmin.controller.EducationalDetails", {
        onInit() {
            //this._getHanaDBPendingList();
        },

        _getHanaDBPendingList: function () {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("educational")//"educational"
                let filters = [new Filter("status", FilterOperator.EQ, "PA")]
				//let oBinding = oModel.bindList("/Educational_Details")
                let oBinding = oModel.bindList("/Educational_History", undefined, undefined, filters)
								
				oBinding.requestContexts().then((aContexts) => {
					//let aData = aContexts.map((oContext) => oContext.getObject())	
                    let model = new JSONModel({count:aContexts.length})
                    this.getView().setModel(model, "pendingListCount")	
    
                    let aData = aContexts.map((oContext) => oContext.getObject());
                    let model1 = new JSONModel(aData)

                    this.getView().setModel(model1, "pendingListModel")
						resolve()
				}).catch((error) => {
					console.error("Error Fetching HanaDBPendingList data:", error)
					reject(error)
				})
			})
		},
        onFilterSelect: function (oEvent) {
            var oBinding = this.byId("psidTable").getBinding("items"),
				sKey = oEvent.getParameter("key");
            
                if (sKey === "pending") { 
                    this._getHanaDBPendingData();
                }
        
		},

        _getHanaDBPendingData: function () {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel()//"educational"
                let filters = [new Filter("status", FilterOperator.EQ, "PA")]
				//let oBinding = oModel.bindList("/Educational_Details")
                let oBinding = oModel.bindList("/Educational_History", undefined, undefined, filters)
								
				oBinding.requestContexts().then((aContexts) => {
					//let aData = aContexts.map((oContext) => oContext.getObject())		
                    
                    let model1 = new JSONModel(aContexts)
                    this.getView().setModel(model1, "pendingListModel")
						resolve()
				}).catch((error) => {
					console.error("Error Fetching HanaDBPendingList data:", error)
					reject(error)
				})
			})
		},

    });
});