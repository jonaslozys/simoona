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
        vm.unQueueEvent = unQueueEvent;
        vm.closeModal = closeModal;


        ////////

        function queueEvent(eventId) {
            console.log(vm.event.participatingStatus);
            if (vm.enableAction) {
                vm.enableAction = false;

                eventRepository.getEventOptions(eventId).then(function (responseEvent) {
                    vm.event.maxChoices = responseEvent.maxOptions;
                    vm.event.availableOptions = responseEvent.options;

                    if (!vm.event.availableOptions.length && !vm.isAddColleague) {
                        var selectedOptions = [];

                        eventRepository.queueEvent(eventId, selectedOptions).then(function () {
                            handleEventQueue();
                            notifySrv.success('events.queuedEvent');
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

        function unQueueEvent(eventId) {
            if (vm.enableAction) {
                eventRepository.updateAttendStatus(attendStatus.Idle, ' ', eventId).then(function () {
                    handleEventQueue();
                    notifySrv.success('events.unQueuedEvent');
                }, function (error) {
                    vm.enableAction = true;
                    errorHandler.handleErrorMessage(error);
                });
            }
        }

        function handleEventQueue() {
                eventRepository.getEventDetails(vm.event.id).then(function (response) {
                    angular.copy(response, vm.event);

                    vm.event.options = response.options;
                    vm.event.participants = response.participants;
                    vm.event.participantsCount = recalculateJoinedParticipants();
                });

            vm.enableAction = true;
        }

        function recalculateJoinedParticipants() {
            var participantsCount = 0;
            vm.event.participants.forEach(function (participant) {
                if (participant.attendStatus == attendStatus.Attending) {
                    participantsCount++;
                }
            });
            return participantsCount;
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
                    },
                    isQueue: function() {
                        return true;
                    }
                }
            });
        }

        function hasDatePassed(date) {
            return moment.utc(date).local().isAfter();
        }
    }
})();
