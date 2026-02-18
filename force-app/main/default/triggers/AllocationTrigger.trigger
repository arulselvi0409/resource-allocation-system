trigger AllocationTrigger on Allocation__c (before insert, before update) {

    Set<Id> resourceIds = new Set<Id>();

    for (Allocation__c alloc : Trigger.new) {
        if (alloc.Resource__c != null) {
            resourceIds.add(alloc.Resource__c);
        }
    }

    Map<Id, Decimal> totalMap = new Map<Id, Decimal>();

    for (AggregateResult ar : [
        SELECT Resource__c resId, SUM(Allocation_Percentage__c) total
        FROM Allocation__c
        WHERE Resource__c IN :resourceIds
        GROUP BY Resource__c
    ]) {
        totalMap.put(
            (Id) ar.get('resId'),
            (Decimal) ar.get('total')
        );
    }

    for (Allocation__c alloc : Trigger.new) {

        Decimal existingTotal = totalMap.containsKey(alloc.Resource__c)
            ? totalMap.get(alloc.Resource__c)
            : 0;

        Decimal newTotal = existingTotal + alloc.Allocation_Percentage__c;

        if (newTotal > 100) {
            alloc.addError('Total allocation cannot exceed 100%.');
        }
    }
}
