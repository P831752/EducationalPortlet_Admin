sap.ui.define([
  "com/lt/educationaladmin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
], (BaseController, JSONModel, Filter, FilterOperator) => {
  "use strict";

  return BaseController.extend("com.lt.educationaladmin.controller.EducationalAdmin", {
    onInit: function () {

      // Model for counts
      var oCountModel = new JSONModel({
        Counts: { PA: 0, A: 0, R: 0, D: 0 }
      });
      this.getView().setModel(oCountModel);

      // Load all status counts initially
      this._loadAllStatusCounts();

      this._loadData("PA"); // Load default tab data

    },

    _loadAllStatusCounts: function () {
      var that = this;
      const oView = that.getView();
      var oCountModel = oView.getModel();
      let oModel = that.getOwnerComponent().getModel("educational");

      const statusKeys = ["PA", "A", "R", "D"];
      let oCounts = oCountModel.getProperty("/Counts");

      statusKeys.forEach(function (sStatus) {
        const aFilters = [
            new Filter("status", FilterOperator.EQ, sStatus),
            new Filter("cust_Qualification_Type", FilterOperator.Contains, "Q01")
        ];
        let oBinding = oModel.bindList("/Educational_Details", undefined, undefined, aFilters);

        oBinding.requestContexts().then((aContexts) => {
          oCounts[sStatus] = aContexts.length;
          oCountModel.setProperty("/Counts", oCounts);
        }).catch((error) => {
          console.error("Error fetching count for status " + sStatus + ":", error);
        });
      });
    },

    onFilterSelect: function (e) {
      const key = e.getParameter("key");
      this._loadData(key);
    },

    _loadData: function (sStatus) {
      var that = this
      const oView = that.getView();
      var oCountModel = oView.getModel();
      var oTable = this.byId("idTable");

      let oModel = that.getOwnerComponent().getModel("educational")//"educational"
      const aFilters = [
            new Filter("status", FilterOperator.EQ, sStatus),
            new Filter("cust_Qualification_Type", FilterOperator.Contains, "Q01")
        ];
      let oBinding = oModel.bindList("/Educational_Details", undefined, undefined, aFilters)
      // Build filter based on tab key

      oBinding.requestContexts().then((aContexts) => {
        let aData = aContexts.map((oContext) => oContext.getObject())

        var oCounts = oCountModel.getProperty("/Counts");
        oCounts[sStatus] = aData.length;
        oCountModel.setProperty("/Counts", oCounts);

        // Bind data to table                    
        var oJsonModel = new JSONModel();
        oJsonModel.setData(aData);
        that.getView().setModel(oJsonModel, "psidModel");

      }).catch((error) => {
        console.error("Error Fetching HanaDBPendingList data:", error)
      })
    },

    onListItemPress: function (oEvent) {

      var oSource = oEvent.getSource(),
        oContext = oSource.getBindingContext("psidModel"),
        oSelectedID = oContext.getObject().psid;

      //this.getRouter().navTo("educationalDetail");
      this.getRouter().navTo("educationalDetail", { psid: oSelectedID });
    },

    onDisplayNotFound: function () {
      // display the "notFound" target without changing the hash
      this.getRouter().getTargets().display("notFound", {
        fromTarget: "home"
      });
    },
  });
});
