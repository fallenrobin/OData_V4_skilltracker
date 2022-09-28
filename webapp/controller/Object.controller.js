sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (BaseController, JSONModel, History, formatter) {
    "use strict";

    return BaseController.extend("com.mindset.juliette.v4skilltracker.controller.Object", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
                });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched : function (oEvent) {
            var sObjectId =  oEvent.getParameter("arguments").objectId;
            this._bindView("/Employees" + sObjectId);
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView : function (sObjectPath) {
            var oViewModel = this.getModel("objectView");

            this.getView().bindElement({
                path: sObjectPath,
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

        _onBindingChange : function () {
            var oView = this.getView(),
                oViewModel = this.getModel("objectView"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            var oResourceBundle = this.getResourceBundle(),
                oObject = oView.getBindingContext().getObject(),
                sObjectId = oObject.Emp_Id,
                sObjectName = oObject.Employees;

                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/shareSendEmailSubject",
                    oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
                oViewModel.setProperty("/shareSendEmailMessage",
                    oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },
        // Opens Skill dialog
        onAddSkill: function (oEvent) {
            var oDialog = oEvent.getSource();
            var oView = this.getView();

            if (!this._skillForm) {
                this._skillForm = sap.ui.xmlfragment(
                    "com.mindset.juliette.v4skilltracker.fragment.skillForm",
                    this
                );
                this.getView().addDependent(this._skillForm)
            }
            this._skillForm.open(oDialog)
        },
        // POST new Employee Skill (to 'EmployeeSkills')
        saveSkill: function (oEvent) {
            var oList = this.byId("skillMenu")
            var oBinding = oList.getBinding('items')
            // FIXME: How to getProperty for all fields but bind to EmpSkills2 path?
            var oContext = oBinding.create({
                "SkillId": sap.ui.getCore().byId("SkillId").getProperty("value"),
                "Proficiency": sap.ui.getCore().byId("proficiency").getProperty("value"),
                "Emp_Id": "00000000-0000-0000-0000-000000000000"
                    // FIXME: how to get Emp_Id?? 
                    // This concept, or other means? 'var oViewModel = this.getModel("objectView")

                // TODO: "Last-changed-at": sap.ui.getCore().byId().getProperty(),
            })

            MessageToast.show("Skill added!");

        },

        // FIXME: delete dialog
        onOpenDeleteDialog: function (oEvent) {
            // alert('clicked delete')
            var oDialog = oEvent.getSource();
            var oView = this.getView();

            if (!this._deleteDialog) {
                this._deleteDialog = sap.ui.xmlfragment(
                    "com.mindset.juliette.v4skilltracker.fragment.deleteDialog",
                    this
                );
                this.getView().addDependent(this._deleteDialog)
            }
            this._deleteDialog.open(oDialog)
        },

        onDeleteEmployee: function (oEvent) {

            //From Curtis' project, for reference:
            // var oRouter = this.getRouter();
            // var employeeContext = this.getView("objectView").byId("page").getBindingContext();

            // employeeContext.delete("$auto").then(function (oEvent) {
            //     oRouter.navTo("worklist", {});
            //     this.byId("deleteDialog").close();
            // })

            // MessageToast.show("Employee deleted!");
        },

        onCloseDeleteDialog: function (oEvent) {
            var oDialog = oEvent.getSource();
            this.getView().addDependent(this._deleteDialog);
            this._deleteDialog.close(oDialog);
        },


        closeSkillDialog: function (oEvent) {
            var oDialog = oEvent.getSource();
            this.getView().addDependent(this._skillForm);
            this._skillForm.close(oDialog);
        }


    });

});
