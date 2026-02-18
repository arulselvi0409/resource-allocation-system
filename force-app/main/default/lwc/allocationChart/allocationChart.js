import { LightningElement, wire } from 'lwc';
import getAllocations from '@salesforce/apex/ResourceController.getAllocations';

export default class AllocationChart extends LightningElement {

    summaryData = [];

    @wire(getAllocations)
    wiredAllocations({ data, error }) {
        if (data) {

            // Group by resource
            const resourceMap = {};

            data.forEach(row => {
                const resourceName = row.Resource__r?.Name || 'Unknown';
                const percentage = row.Allocation_Percentage__c || 0;

                if (!resourceMap[resourceName]) {
                    resourceMap[resourceName] = 0;
                }

                resourceMap[resourceName] += percentage;
            });

            // Convert to array for template
            this.summaryData = Object.keys(resourceMap).map(key => {
                return {
                    resource: key,
                    total: resourceMap[key]
                };
            });

        } else if (error) {
            console.error(error);
        }
    }
}
