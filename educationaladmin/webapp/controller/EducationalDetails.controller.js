sap.ui.define([
	"com/lt/educationaladmin/controller/BaseController",
	"com/lt/educationaladmin/model/Formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], (BaseController, Formatter, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) => {
	"use strict";

	return BaseController.extend("com.lt.educationaladmin.controller.EducationalDetails", {
		formatter: Formatter,
		onInit() {
			this._initializeModel();

			var oRouter = this.getRouter();
			oRouter.getRoute("educationalDetail").attachMatched(this._onRouteMatched, this);

		},

		_onRouteMatched: function (oEvent) {
			const oPSID = oEvent.getParameter("arguments").psid
			var oData = { selectedPSID: oPSID }

			var psidModel = new JSONModel(oData);
			this.getView().setModel(psidModel, "psidModel");

			//Global letiables
			this.uploadData = []

			this._getEducationDetails(oPSID)
				.then((aData) => this._onEducationDataFetched(aData));

			this._getDMSFiles(oPSID);
		},

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().getBindingContext()) {
				this.getRouter().getTargets().display("notFound");
			}
		},

		_initializeModel() {
			let displayModel = new JSONModel({
				sscData: [],
				hscData: [],
				tradCData: [],
				diplData: [],
				gradData: [],
				masterData: [],
				pGradData: [],
				doctData: []
			})
			this.getView().setModel(displayModel, "displayModel")
		},

		_getEducationDetails: function (psid) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("educational")
				let oBinding = oModel.bindList("/Educational_Details")
				let filters = [new Filter("psid", FilterOperator.EQ, psid)]

				oBinding.requestContexts().then((aContexts) => {
					let aData = aContexts.map((oContext) => oContext.getObject())
					resolve(aData)
				}).catch((error) => {
					console.error("Error fetching PSID data:", error)
					reject(error)
				})
			})
		},

		_onEducationDataFetched(data) {
			let oDisplayModel = this.getView().getModel("displayModel")

			let qualificationMap = [{
				type: 'Q01',
				path: "/sscData"
			},
			{
				type: 'Q02',
				path: "/hscData"
			},
			{
				type: 'Q03',
				path: "/tradCData"
			},
			{
				type: 'Q05',
				path: "/diplData"
			},
			{
				type: 'Q06',
				path: "/gradData"
			},
			{
				type: 'Q07',
				path: "/masterData"
			},
			{
				type: 'Q08',
				path: "/pgradData"
			},
			{
				type: 'Q09',
				path: "/doctData"
			}
			]

			let processPromises = qualificationMap.map(
				({ type, path }) => {
					let dataSet = data.filter(item => item.cust_Qualification_Type === type)

					// Convert string to array if needed
					dataSet.forEach(item => {
						if (typeof item.modifiedfields === "string") {
							item.modifiedfields = item.modifiedfields.split(',').map(s => s.trim());
						}
					});

					oDisplayModel.setProperty(path, dataSet)
				})

			// var oLabel = this.getView().byId("shLabel6");
			// oLabel.addStyleClass("highlightLabel");
			Promise.all(processPromises).then(() => {
				this.uploadData.forEach(function (item) {
					let section = item.fileName.split("_")[1].toLowerCase()
					let subSection = item.fileName.split("_")[2]
					let propName = "/" + section + "Data"
					let sProperty = oDisplayModel.getProperty(propName)
					sProperty.forEach(function (prop, index) {
						if (subSection === prop.cust_Education_Certificate) {
							let filePath = `${propName}/${index}/oFiles`

							oDisplayModel.setProperty(filePath, [{
								fileName: item.fileName,
								url: item.url
							}])
						}
						oDisplayModel.updateBindings()
					}.bind(this))
				}.bind(this))
			})
		},

		async onApprove(oEvent) {
			this.getView().setBusy(true)
			let psid = this.getView().getModel("psidModel").oData.selectedPSID
			let oReadDisplayModelData = this.getView().getModel("displayModel").oData
			let errors = [], processed = 0;

			try {
				for (let section in oReadDisplayModelData) {
					let records = oReadDisplayModelData[section]
					if (records.length > 0) {
						for (let record of records) {
							try {
								// Step 1: Update in SuccessFactors
                        		let updateStatus = await this._updateInSF(psid, record);
								if (updateStatus.d[0].status === "ERROR") {
									errors.push(`SF Error for record ${record.externalCode}: ${updateStatus.d[0].message}`);
                            		continue; // Skip HANA update for this record
								}
								// Step 2: Update in HANA
                        		await this._updateInHana(psid, record, "A");

								processed++;
							} catch (error) {
								errors.push(`General error for record ${record.externalCode}: ${err.message || err}`);
							}
						}
					}
				}

				if (errors.length > 0) {
					MessageBox.error(`Process completed with errors.\n\nSuccessful updates: ${processed}\nErrors:\n${errors.join("\n")}`);
				} else {
					MessageBox.success(`All ${processed} record(s) successfully approved.`);
				}
			} catch (globalErr) {
				MessageBox.error(`Unexpected error: ${globalErr.message || globalErr}`);
    		} finally {
        		this.getView().setBusy(false);
    		}
		},

		_updateInHana: function (psid, oDetails, status) {
			return new Promise((resolve, reject) => {
				let eduDetails = {
					psid,
					course: oDetails.course,
					status: status,
					dmsfoldername: oDetails.isDmsFolderExist,
					ismodified: "Y",
					cust_Qualification_Type: oDetails.cust_Qualification_Type,
					Qualification_Type_Desc: oDetails.cust_Qualification_TypeNew,
					cust_Duration_Of_The_Course: oDetails.cust_Duration_Of_The_Course,
					cust_Institute: oDetails.cust_Institute,
					cust_Institute_Desc: oDetails.cust_InstituteNew,
					cust_Percentage: oDetails.cust_Percentage,
					cust_University: oDetails.cust_University,
					University_Desc: oDetails.cust_UniversityNew,
					cust_CGPA: oDetails.cust_CGPA,
					cust_Year_of_Passing: oDetails.cust_Year_of_Passing,
					cust_Division: oDetails.cust_Division,
					Division_Desc: oDetails.cust_DivisionNew,
					cust_Type_Of_The_Course: oDetails.cust_Type_Of_The_Course,
					Type_Of_The_Course_Desc: oDetails.cust_Type_Of_The_CourseNew,
					cust_Grade: oDetails.cust_Grade,
					Grade_Desc: oDetails.cust_GradeNew,
					cust_Qualification_Sub_Type: oDetails.cust_Qualification_Sub_Type,
					Qualification_Sub_Desc: oDetails.cust_Qualification_Sub_TypeNew,
					cust_Education_Certificate: oDetails.cust_Education_Certificate,
					Education_Certificate_Desc: oDetails.cust_Education_CertificateNew,
					cust_Branch_1: oDetails.cust_Branch_1,
					Branch_1_Desc: oDetails.cust_Branch_1New,
					cust_Branch_2: oDetails.cust_Branch_2,
					Branch_2_Desc: oDetails.cust_Branch_2New,
					cust_Academic_End_Date: oDetails.cust_Academic_End_Date,
					cust_Academic_Start_Date: oDetails.cust_Academic_Start_Date,
				}

				let entity = "Educational_Details"
				let oModelUrl = this.getOwnerComponent().getModel("educational").sServiceUrl
				let oUrl = `${oModelUrl}${entity}('${oDetails.ID}')`

				console.log("Updating to:", oUrl)

				$.ajax({
					url: oUrl,
					type: "PUT",
					async: true,
					data: JSON.stringify(eduDetails),
					contentType: "application/json",
					success: (response) => {
						MessageToast.show("Updated in HANA successfully!");
						//console.log("Response:", response)
						resolve(response)
					},
					error: (err) => {
						let errorMsg = err?.responseText||"Unknown error"
						reject(new Error(errorMsg));
					}
				})
			})
		},

		_updateInSF: function (psid, oDetails) {
			return new Promise((resolve, reject) => {

				let eduDetails = {
					__metadata: {
					"uri": `cust_EducationChild1` +
						`(cust_EducationParentLegacy_effectiveStartDate=datetime'${oDetails.ParentLegacy_effectiveStartDate}',` +
						`cust_EducationParentLegacy_externalCode='${psid}',` +
						`externalCode=${oDetails.externalCode}L)`
					},
					//for error display, `externalCode='${oDetails.externalCode}L')`
					cust_Education_Certificate:oDetails.cust_Education_Certificate,
					cust_Institute:oDetails.cust_Institute,
					cust_University:oDetails.cust_University,
					cust_Year_of_Passing:oDetails.cust_Year_of_Passing,
					cust_Type_Of_The_Course:oDetails.cust_Type_Of_The_Course,
					cust_Duration_Of_The_Course:oDetails.cust_Duration_Of_The_Course,
					cust_Percentage:oDetails.cust_Percentage,
					cust_CGPA:oDetails.cust_CGPA,
					cust_Division: oDetails.cust_Division === "" ? null : oDetails.cust_Division,
					cust_Grade:oDetails.cust_Grade,				
					cust_Qualification_Sub_Type:oDetails.cust_Qualification_Sub_Type,
					cust_Branch_1:oDetails.cust_Branch_1,
					cust_Branch_2:oDetails.cust_Branch_2
				}
				//console.log("eduDetails:", eduDetails)
				let sBaseUrl = this.getOwnerComponent().getModel("SF").sServiceUrl
				//var posturl = sBaseUrl + "/upsert";
				let posturl = `${sBaseUrl}/upsert`;

				console.log("posturl:", posturl)

				$.ajax({
					url: posturl,
					type: "POST",
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json"
					},
					data: JSON.stringify(eduDetails),
					success: (response) => resolve(response),
					error: (error) => reject(error)
				});
			});
		},

		async _getDMSFiles(psid) {
			let docserviceBaseurl = this.getOwnerComponent().getManifestObject().resolveUri('DMS_Dest') //<Repo ID>/root,
			let eduFolder = "/Educational_Certificates"
			let sUrl = docserviceBaseurl + eduFolder + "/" + psid
			let that = this

			jQuery.ajax({
				url: sUrl,
				type: "GET",
				async: false,
				success: function (successData) {
					successData.objects.map(item => {
						let properties = item.object.properties
						that.uploadData.push({
							fileName: properties["cmis:name"].value,
							url: docserviceBaseurl + "?objectId=" + properties["cmis:objectId"].value + "&cmisSelector=content"
						})
					})
				},
				error: function (errorData) {
					console.log("error : " + errorData)
				}
			})
		},
		onReject() {
			var oDialog = this.byId("commentDialog");
			oDialog.open();
		},
		onDialogOkPress: function () {
			var sComment = this.byId("commentTextArea").getValue();
			MessageToast.show("Comment submitted: " + sComment);
			this.byId("commentDialog").close();
		},

		onDialogCancelPress: function () {
			this.byId("commentDialog").close();
		},

		_getJSONDateFormat: function (date) {
			const milliseconds = new Date(date).getTime();
			//const sapFormattedDate = `/Date(${milliseconds})/`;
			//console.log(sapFormattedDate);
			return `/Date(${milliseconds})/`
		}
	});
});