(function () {
    'use strict';

    angular
        .module('simoonaApp.Events')
        .constant('inputTypes', {
            checkbox: 'checkbox',
            radio: 'radio'
        })
        .controller('eventJoinOptionsController', eventJoinOptionsController);

    eventJoinOptionsController.$inject = [
        '$state',
        '$uibModalInstance',
        'inputTypes',
        'authService',
        'errorHandler',
        'eventRepository',
        '$translate',
        'notifySrv',
        'event',
        'isDetails',
        'isAddColleague',
        'isQueue',
        'isChangeOptions',
        'localeSrv',
        'lodash',
        'attendStatus',
        'optionRules'
    ];

    function eventJoinOptionsController($state, $uibModalInstance, inputTypes, authService, errorHandler,
        eventRepository, $translate, notifySrv, event, isDetails, isAddColleague, isQueue, isChangeOptions, localeSrv, lodash, attendStatus, optionRules) {
        /* jshint validthis: true */
        var vm = this;

        vm.options = event.availableOptions;
        vm.inputType = null;
        vm.isAddColleague = isAddColleague;
        vm.isQueue = isQueue;
        vm.isChangeOptions = isChangeOptions;
        vm.participants = [];
        vm.selectedOptions = [];
        vm.messageMaximumOptions = localeSrv.formatTranslation('events.eventMaximumOptions', {
            one: event.maxChoices
        });
        vm.isActionDisabled = false;

        vm.joinEvent = joinEvent;
        vm.updateOptions = updateOptions;
        vm.closeModal = closeModal;
        vm.selectOption = selectOption;
        vm.isOptionsJoinAvailable = isOptionsJoinAvailable;
        vm.getUserForAutoComplete = getUserForAutoComplete;
        vm.isTooManyOptionsSelected = isTooManyOptionsSelected;
        vm.isOptionSelected = isOptionSelected;

        init();

        //////

        function init() {
            if (event.maxChoices > 1) {
                vm.inputType = inputTypes.checkbox;
            } else {
                vm.inputType = inputTypes.radio;
            }

            eventRepository.getUserForAutoComplete(authService.identity.userName, event.id).then(function (response) {
                for (var i = 0; response.length > i; i++) {
                    if (response[i].id === authService.identity.userId) {
                        vm.participants.push(response[i]);
                    }
                }
            });
        }

        function getUserForAutoComplete(search) {
            return eventRepository.getUserForAutoComplete(search, event.id);
        }

        function isOptionSelected(optionId) {
            return vm.selectedOptions.findIndex(op => op.id === optionId) > -1;
        }

        function selectOption(option) {
            if (vm.inputType === inputTypes.checkbox) {
                var index = vm.selectedOptions.findIndex(op => op.id === option.id);
                if (index > -1) {
                    vm.selectedOptions.splice(index, 1);
                } else {
                    handleSelectedOption(option);
                }
            } else {
                vm.selectedOptions = [option];
            }
        }

        function handleSelectedOption(option) {
            if (option.rule === optionRules.ignoreSingleJoin) {
                vm.selectedOptions.length = 0;
            } else {
                vm.selectedOptions = vm.selectedOptions.filter(op => op.rule != optionRules.ignoreSingleJoin);
            }
            vm.selectedOptions.push(option);
        }

        function joinEvent() {
            vm.isActionDisabled = true;
            if (vm.isQueue) {
                var selectedOptionsId = lodash.map(vm.selectedOptions, 'id');
                eventRepository.queueEvent(event.id, selectedOptionsId)
                .then(handleQueueSuccessPromise, handleErrorPromise);
            }
            else {
                if (vm.selectedOptions.length > event.maxChoices) {
                    handleErrorMessage($translate.instant('events.maxOptionsError') + ' ' + event.maxChoices);
                } else if (!vm.selectedOptions.length && event.options.length) {
                    handleErrorMessage('errorCodeMessages.messageNotEnoughOptions');
                } else if (vm.isAddColleague && !vm.participants.length) {
                    handleErrorMessage('events.noParticipantsError');
                } else if (vm.isAddColleague && vm.participants.length + event.participants.length > event.maxParticipants) {
                    var participants = event.maxParticipants - event.participants.length;
                    handleErrorMessage($translate.instant('events.maxParticipantsError') + ' ' + participants);
                } else if (!hasDatePassed(event.startDate)) {
                    handleErrorMessage('', 'errorCodeMessages.messageEventJoinStartedOrFinished');
                    $uibModalInstance.close();
                } else if (!hasDatePassed(event.registrationDeadlineDate)) {
                    handleErrorMessage('', 'events.eventJoinRegistrationDeadlinePassed');
                    $uibModalInstance.close();
                } else {
                    var selectedOptionsId = lodash.map(vm.selectedOptions, 'id');
                    if (vm.isAddColleague) {
                        var participantIds = lodash.map(vm.participants, 'id');
                        eventRepository.addColleagues(event.id, selectedOptionsId, participantIds)
                            .then(handleSuccessPromise, handleErrorPromise);
                    } else {
                        eventRepository.joinEvent(event.id, selectedOptionsId)
                            .then(handleSuccessPromise, handleErrorPromise);
                    }
                }
            }
        }

        function updateOptions() {
            vm.isActionDisabled = true;

            var selectedOptionsId = lodash.map(vm.selectedOptions, 'id');

            eventRepository.updateEventOptions(event.id, selectedOptionsId)
                .then(handleSuccessPromise, handleErrorPromise);
        }

        function handleSuccessPromise() {
            if (isDetails || vm.isAddColleague || isChangeOptions) {
                eventRepository.getEventDetails(event.id).then(function (response) {
                    angular.copy(response, event);

                    event.options = response.options;
                    event.participants = response.participants;
                });
            } else {
                event.participantsCount++;
            }

            vm.isActionDisabled = false;
            event.participatingStatus = attendStatus.Attending;
            $uibModalInstance.close();

            notifySuccess();
        }

        function handleQueueSuccessPromise() {
            if (isDetails || vm.isAddColleague || isChangeOptions) {
                eventRepository.getEventDetails(event.id).then(function (response) {
                    event.options = response.options;
                    event.participants = response.participants;
                });
            }

            vm.isActionDisabled = false;
            event.participatingStatus = attendStatus.Queued;
            $uibModalInstance.close();

            notifyQueueSuccess();
        }

        function notifySuccess() {
            var message = isChangeOptions ? 'events.changedEventOptions' : 'events.joinedEvent';
            notifySrv.success(message);
        }

        function notifyQueueSuccess() {
            var message = isChangeOptions ? 'events.changedEventOptions' : 'events.queuedEvent';
            notifySrv.success(message);
        }

        function handleErrorPromise(error) {
            vm.isActionDisabled = false;
            errorHandler.handleErrorMessage(error);
        }

        function handleErrorMessage(message) {
            notifySrv.error(message);
            vm.isActionDisabled = false;
        }

        function closeModal() {
            $uibModalInstance.close();
        }

        function isOptionsJoinAvailable() {
            var selectedOptionsCount = vm.selectedOptions.length;

            return !!event.maxChoices && (!selectedOptionsCount || selectedOptionsCount > event.maxChoices);
        }

        function isTooManyOptionsSelected() {
            return vm.selectedOptions.length > event.maxChoices;
        }

        function hasDatePassed(date) {
            return moment.utc(date).local().isAfter();
        }
    }
})();
