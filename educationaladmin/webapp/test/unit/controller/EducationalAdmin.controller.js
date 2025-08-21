/*global QUnit*/

sap.ui.define([
	"com/lt/educationaladmin/controller/EducationalAdmin.controller"
], function (Controller) {
	"use strict";

	QUnit.module("EducationalAdmin Controller");

	QUnit.test("I should test the EducationalAdmin controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
