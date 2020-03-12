(function () {
    'use strict';

    angular
        .module('simoonaApp.Events')
        .component('aceEventQueue', {
            bindings: {
                event: '=',
                isDetails: '=',
            },
            templateUrl: 'app/events/queue/queue.html',
            controller: eventQueueController,
            controllerAs: 'vm'
        });

    eventQueueController.$inject = [
        '$uibModal',
        'eventRepository',
        'notifySrv',
        'errorHandler',
        'authService',
        'Analytics',
        'attendStatus'
    ];

    function eventQueueController($uibModal, eventRepository, notifySrv, errorHandler,
        authService, Analytics, attendStatus) {
        /* jshint validthis: true */
        var vm = this;

        vm.attendStatus = attendStatus;
        vm.enableAction = true;

        vm.queueEvent = queueEvent;
        vm.closeModal = closeModal;

        ////////

        function queueEvent(eventId) {
            if (vm.enableActions) {
                vm.enableAction = false;

                eventRepository.getEventOptions(eventId).then(function (responseEvent) {
                    vm.event.maxChoices = responseEvent.maxOptions;
                    vm.event.availableOptions = responseEvent.options;
                    if (!vm.event.availableOptions.length && !vm.isAddColleague) {
                        var selectedOptions = [];

                        eventRepository.queueEvent(selectedOptions, eventId).then(function () {
                            handleEventJoin();
                            notifySrv.success('events.joinedEvent');
                        }, function (error) {
                            vm.enableAction = true;
                            errorHandler.handleErrorMessage(error);
                        });
                    } else {
                        openOptionsModal();
                    }
                });
            }
        }

        function closeModal() {
            $uibModalInstance.close();
        }

        function openOptionsModal() {
            vm.enableAction = true;

            $uibModal.open({
                templateUrl: 'app/events/join/join-options/join-options.html',
                controller: 'eventJoinOptionsController',
                controllerAs: 'vm',
                resolve: {
                    event: function () {
                        return vm.event;
                    },
                    isDetails: function () {
                        return vm.isDetails;
                    },
                    isAddColleague: function () {
                        return vm.isAddColleague;
                    },
                    isChangeOptions: function () {
                        return false;
                    }
                }
            });
        }

        function hasDatePassed(date) {
            return moment.utc(date).local().isAfter();
        }
    }
})();
