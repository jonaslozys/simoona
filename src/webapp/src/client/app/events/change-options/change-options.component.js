(function () {
    'use strict';

    angular
        .module('simoonaApp.Events')
        .component('aceEventOptionsChange', {
            bindings: {
                event: '<'
            },
            templateUrl: 'app/events/change-options/change-options.html',
            controller: eventOptionsChangeController,
            controllerAs: 'vm'
        });

    eventOptionsChangeController.$inject = [
        'eventRepository',
        'attendStatus',
        '$uibModal'
    ];

    function eventOptionsChangeController(eventRepository, attendStatus, $uibModal) {
        var vm = this;

        vm.changeSelectedOptions = changeSelectedOptions;
        vm.isDeadline = isDeadline;
        vm.attendStatus = attendStatus;
        

        function changeSelectedOptions() {
            eventRepository.getEventOptions(vm.event.id).then(function (responseEvent) {
                vm.event.maxChoices = responseEvent.maxOptions;
                vm.event.availableOptions = responseEvent.options;
                openOptionsModal();
            });
        }

        function openOptionsModal() {
            $uibModal.open({
                templateUrl: 'app/events/join/join-options/join-options.html',
                controller: 'eventJoinOptionsController',
                controllerAs: 'vm',
                resolve: {
                    event: function () {
                        return vm.event;
                    },
                    isChangeOptions: function () {
                        return true;
                    },
                    isDetails: function () {
                        return false;
                    },
                    isAddColleague: function () {
                        return false;
                    },
                    isQueue: function() {
                        return vm.event.participatingStatus == vm.attendStatus.Queued;
                    }
                }
            });
        }

        function isDeadline() {
            return moment.utc(vm.registrationDeadlineDate).local().isAfter();
        }
    }
})();
