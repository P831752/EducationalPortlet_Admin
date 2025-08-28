sap.ui.define([], function () {
    "use strict";
    return {
        getSubSectionTitle: function (oData, certiTitle, i18nTitle) {
            return (oData && oData.length > 1) ? certiTitle : i18nTitle
        },

        isModified: function (modifiedFields, fieldValue) {
            if (!modifiedFields || !fieldValue) return "";
            if (!Array.isArray(modifiedFields)) {
                modifiedFields = String(modifiedFields).split(',').map(s => s.trim());
            }

            // Check if the field name is in the modified list
            return modifiedFields.includes(fieldValue) ? "highlightLabel" : "";
        }
    };
});
