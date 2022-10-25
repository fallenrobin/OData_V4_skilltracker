sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/Button"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Button, Dialog) {
    "use strict";

    return BaseController.extend("com.mindset.juliette.v4skilltracker.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },

        onSearch: function (oEvent) {

            var sQuery = oEvent.getSource().getValue();

            var oFilter = new Filter({

                filters: [

                    new Filter("FirstName", FilterOperator.Contains, sQuery),
                    new Filter("LastName", FilterOperator.Contains, sQuery),
                    new Filter("Role", FilterOperator.Contains, sQuery),


                ]

            });

            var oBinding = this.byId("employeeTable").getBinding("items");

            oBinding.filter(oFilter);

        },


        // Opens dialog with Employee Form
        onAddEmployee : function (oEvent) {
            var oDialog = oEvent.getSource();
            var oView = this.getView();

            if (!this._employeeForm) {
                this._employeeForm = sap.ui.xmlfragment(
                    "com.mindset.juliette.v4skilltracker.fragment.EmployeeForm",
                    this
                );
                this.getView().addDependent(this._employeeForm)
            }
            this._employeeForm.open(oDialog)
        },

        // POST new employee to service
        saveEmployee: function (oEvent) {
            var oList = this.byId("employeeTable")
            var oBinding = oList.getBinding('items')
            var oContext = oBinding.create({
                "FirstName": sap.ui.getCore().byId("firstname").getProperty("value"),
                "LastName": sap.ui.getCore().byId("lastname").getProperty("value"),
                "Phone": sap.ui.getCore().byId("phone").getProperty("value"),
                "Email": sap.ui.getCore().byId("email").getProperty("value"),
                "Role": sap.ui.getCore().byId("role").getProperty("selectedKey")
            })
        },

        closeEmployeeDialog: function (oEvent) {
            var oDialog = oEvent.getSource();
            this.getView().addDependent(this._employeeForm);
            this._employeeForm.close(oDialog);
        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/Employees".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        }

    });
});
