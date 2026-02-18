import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import deleteAllocation from '@salesforce/apex/ResourceController.deleteAllocation';
import getResources from '@salesforce/apex/ResourceController.getResources';
import getProjects from '@salesforce/apex/ResourceController.getProjects';
import getAllocations from '@salesforce/apex/ResourceController.getAllocations';
import createAllocation from '@salesforce/apex/ResourceController.createAllocation';
import updateAllocation from '@salesforce/apex/ResourceController.updateAllocation';

export default class ResourcePlanner extends LightningElement {

    selectedResource;
    selectedProject;
    percentage;
filteredAllocations = [];
currentFilter = 'All';

    resourceOptions = [];
    projectOptions = [];
    allocations = [];
draftValues = [];

    wiredAllocationsResult;

    columns = [
    { label: 'Resource', fieldName: 'resourceName' },
    { label: 'Project', fieldName: 'projectName' },
    { label: 'Allocation %', fieldName: 'Allocation_Percentage__c', type: 'number', editable: true },
    { label: 'Remaining %', fieldName: 'remainingPercentage', type: 'number' },
    {
        type: 'button',
        typeAttributes: {
            label: 'Delete',
            name: 'delete',
            variant: 'destructive'
        }
    }
];

handleSave(event) {

    const updatedFields = event.detail.draftValues;

    const promises = updatedFields.map(draft => {
        return updateAllocation({
            allocationId: draft.Id,
            percentage: draft.Allocation_Percentage__c
        });
    });

    Promise.all(promises)
    .then(() => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Updated',
                message: 'Allocation updated',
                variant: 'success'
            })
        );

        this.draftValues = [];

        return refreshApex(this.wiredAllocationsResult);
    });

}

handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;

    if (actionName === 'delete') {
        deleteAllocation({ allocationId: row.Id })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Deleted',
                        message: 'Allocation deleted',
                        variant: 'success'
                    })
                );
                return refreshApex(this.wiredAllocationsResult);
            });
    }
}


    // 🔥 Allocations Wire (Stored for refresh)
   @wire(getAllocations)
wiredAllocations(result) {
    this.wiredAllocationsResult = result;

    if (result.data) {

        this.allocations = result.data.map(row => ({
            ...row,
            resourceName: row.Resource__r?.Name,
            projectName: row.Project__r?.Name,
            projectStatus: row.Project__r?.Status__c,
            remainingPercentage: 100 - row.Allocation_Percentage__c
        }));

        this.applyFilter();
    } else if (result.error) {
        console.error(result.error);
    }
}

    // 🔹 Resources
    @wire(getResources)
    wiredResources({ data, error }) {
        if (data) {
            this.resourceOptions = data.map(res => ({
                label: res.Name,
                value: res.Id
            }));
        } else if (error) {
            console.error(error);
        }
    }

    // 🔹 Projects
    @wire(getProjects)
    wiredProjects({ data, error }) {
        if (data) {
            this.projectOptions = data.map(proj => ({
                label: proj.Name,
                value: proj.Id
            }));
        } else if (error) {
            console.error(error);
        }
    }
showAll() {
    this.currentFilter = 'All';
    this.applyFilter();
}

showInProgress() {
    this.currentFilter = 'In Progress';
    this.applyFilter();
}

showCompleted() {
    this.currentFilter = 'Completed';
    this.applyFilter();
}

applyFilter() {
    if (this.currentFilter === 'All') {
        this.filteredAllocations = [...this.allocations];
    } else {
        this.filteredAllocations = this.allocations.filter(
            row => row.projectStatus === this.currentFilter
        );
    }
}

    handleResourceChange(event) {
        this.selectedResource = event.detail.value;
    }

    handleProjectChange(event) {
        this.selectedProject = event.detail.value;
    }

    handlePercentageChange(event) {
        this.percentage = event.detail.value;
    }

    // 🔥 Create Allocation
    handleAllocate() {

        if (!this.selectedResource || !this.selectedProject || !this.percentage) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill all fields',
                    variant: 'error'
                })
            );
            return;
        }

        createAllocation({
            resourceId: this.selectedResource,
            projectId: this.selectedProject,
            percentage: this.percentage
        })
        .then(() => {

            // ✅ Success Toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Allocation created successfully!',
                    variant: 'success'
                })
            );

            // Reset fields
            this.selectedResource = null;
            this.selectedProject = null;
            this.percentage = null;

            // 🔥 Refresh datatable automatically
            return refreshApex(this.wiredAllocationsResult);
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || 'Unknown error occurred',
                    variant: 'error'
                })
            );
        });
    }
}
