sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/MessageToast"

], function (BaseController, JSONModel, History, formatter, MessageToast) {
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
                    editMode: false,
                    busy : true,
                    delay: 0,
                    deleteMode: "None",
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

        onEdit: function () {
            //sets edit mode for applicable fields
            var oViewModel = this.getModel("objectView")
            oViewModel.setProperty("/editMode", true);
            oViewModel.setProperty("/deleteMode", "Delete");
            //opens footer
            var oObjectPage = this.getView().byId("employeeDetailPage"),
                bCurrentShowFooterState = oObjectPage.getShowFooter();
            oObjectPage.setShowFooter(!bCurrentShowFooterState);
        },

        onSaveEdit: function () {
            var oView = this.getView()
            var oModel = this.getView().getModel();
            var aBindings = oModel.getAllBindings();
            var empSkillsBinding = oModel.bindList('/EmpSkills2')
            var employeesBinding = oModel.bindList('/Employees')
            var oEmployee = oView.getBindingContext().getObject()
            var sEmployeeId = oEmployee.Emp_Id
            var oContext = empSkillsBinding.update({

                "SkillId": sap.ui.getCore().byId("skillData").getProperty(),
                "Proficiency": sap.ui.getCore().byId("proficiency").getValue().toString(),
                "Empid": sEmployeeId
            })

            this.closeFooter();
        },

        closeFooter: function () {
            var oViewModel = this.getModel("objectView")
            oViewModel.setProperty("/deleteMode", "None");
            var oObjectPage = this.getView().byId("employeeDetailPage"),
                bCurrentShowFooterState = oObjectPage.getShowFooter();
            oObjectPage.setShowFooter(!bCurrentShowFooterState);
        },

        // Opens Skill dialog
        onAddSkill: function (oEvent) {
            if (!this._skillForm) {
                this._skillForm = sap.ui.xmlfragment(
                    "com.mindset.juliette.v4skilltracker.fragment.skillForm",
                    this
                );
                this.getView().addDependent(this._skillForm)
            }
            this._skillForm.open()
        },
        // POST new Employee Skill (to 'EmployeeSkills')
        saveSkill: function (oEvent) {
            var oView = this.getView()
            var oModel = this.getView().getModel();
            var aBindings = oModel.getAllBindings();
            var empSkillsBinding = oModel.bindList('/EmpSkills2')
            var oEmployee = oView.getBindingContext().getObject()
            var sEmployeeId = oEmployee.Emp_Id
            var oContext = empSkillsBinding.create({

                "SkillId": sap.ui.getCore().byId("skillMenu").getSelectedItem().mProperties.key,
                "Proficiency": sap.ui.getCore().byId("proficiency").getValue().toString(),
                "Empid": sEmployeeId
                // TODO: "Last-changed-at": sap.ui.getCore().byId().getProperty(),
            })

            MessageToast.show("Skill added!");
            // oTable = sap.ui.getCore().byId("empSkillTable");
            this.closeSkillDialog();
        },

        
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
        // FIXME: how to update Worklist View after delete??
        onDeleteEmployee: function (oEvent) {
            var oRouter = this.getRouter();
            var employeeContext = this.getView("objectView").byId("page").getBindingContext();

            employeeContext.delete("$auto").then(function (oEvent) {
                oRouter.navTo("worklist", {});
                this.byId("deleteDialog").close();
            })
            MessageToast.show("Employee deleted!");
            this._skillForm.close(oDialog);

        },

        onCloseDeleteDialog: function (oEvent) {
            var oDialog = oEvent.getSource();
            this.getView().addDependent(this._deleteDialog);
            this._deleteDialog.close(oDialog);
        },


        closeSkillDialog: function () {
            // var oDialog = oEvent.getSource();
            this.getView().addDependent(this._skillForm);
            // this.refreshSkills();
            this._skillForm.close();
        }, 

        onDeleteSkill: function (oEvent) {
            // alert('clicked delete skill!')
            // var oSelected = this.byId("empSkillTable").getSelectedItem();
            var oSelectedItem = oEvent.getParameter("listItem");


            if (oSelectedItem) {
                oSelectedItem.getBindingContext().delete("$auto").then(function () {
                    MessageToast.show("Skill deleted!");
                }.bind(this), function (oError) {
                    MessageBox.error(oError.message);
                });
            }
        },

        refreshSkills: function () {
            alert("refresh")
            var oSkillTable = sap.ui.getCore().byId("empSkillTable")
            var oModel = this.getView().getModel();
            oSkillTable.bindRows('/EmpSkills2');
        }


    });

});
