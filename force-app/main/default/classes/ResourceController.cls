public with sharing class ResourceController {

    @AuraEnabled(cacheable=true)
    public static List<Resource__c> getResources() {
        return [
            SELECT Id, Name, Skill__c, Availability_Percentage__c
            FROM Resource__c
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Project__c> getProjects() {
        return [
            SELECT Id, Name, Required_Skill__c, Status__c
            FROM Project__c
        ];
    }

    @AuraEnabled
    public static void createAllocation(Id resourceId, Id projectId, Decimal percentage) {

        Allocation__c alloc = new Allocation__c(
            Resource__c = resourceId,
            Project__c = projectId,
            Allocation_Percentage__c = percentage
        );

        insert alloc;
    }

    @AuraEnabled(cacheable=true)
public static List<Allocation__c> getAllocations() {
    return [
        SELECT Id,
               Name,
               Allocation_Percentage__c,
               Resource__r.Name,
               Project__r.Name,
               Project__r.Status__c
        FROM Allocation__c
        ORDER BY CreatedDate DESC
    ];
}


    @AuraEnabled
    public static void deleteAllocation(Id allocationId) {
        delete [SELECT Id FROM Allocation__c WHERE Id = :allocationId];
    }

    @AuraEnabled
    public static void updateAllocation(Id allocationId, Decimal percentage) {

        Allocation__c alloc = [
            SELECT Id, Allocation_Percentage__c
            FROM Allocation__c
            WHERE Id = :allocationId
        ];

        alloc.Allocation_Percentage__c = percentage;
        update alloc;
    }
}
