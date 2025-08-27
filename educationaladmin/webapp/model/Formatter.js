sap.ui.define([], function () {
    "use strict";
    return {
        getSubSectionTitle: function (oData, certiTitle, i18nTitle) {
            return (oData && oData.length > 1) ? certiTitle : i18nTitle
        }
    };
});
