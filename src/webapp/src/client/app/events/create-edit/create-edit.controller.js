(function() {
    'use strict';

    angular
        .module('simoonaApp.Events')
        .constant('eventSettings', {
            nameLength: 35,
            locationLength: 50,
            participantsLength: 1000,
            descriptionLength: 5000,
            thumbHeight: 165,
            thumbWidth: 291,
            endDateHoursAddition: 2
        })
        .constant('recurringTypesResources', {
            0: 'none',
            1: 'everyDay',
            2: 'everyWeek',
            3: 'everyTwoWeeks',
            4: 'everyMonth'
        })
        .controller('addNewEventController', addNewEventController);

    addNewEventController.$inject = [
        '$rootScope',
        '$scope',
        '$stateParams',
        '$state',
        '$timeout',
        'dataHandler',
        'authService',
        'eventRepository',
        'pictureRepository',
        'eventSettings',
        'recurringTypesResources',
        '$translate',
        'notifySrv',
        'localeSrv',
        'lodash',
        'errorHandler'
    ];

    function addNewEventController($rootScope, $scope, $stateParams, $state, $timeout, dataHandler,
        authService, eventRepository, pictureRepository, eventSettings,
        recurringTypesResources, $translate, notifySrv, localeSrv, lodash, errorHandler) {
        /* jshint validthis: true */
        var vm = this;

        vm.states = {
            isAdd: $state.includes('Root.WithOrg.Client.Events.AddEvents'),
            isEdit: $state.includes('Root.WithOrg.Client.Events.EditEvent')
        };

        vm.resetParticipantList = false;
        vm.isRegistrationDeadlineEnabled = false;
        vm.isSaveButtonEnabled = true;
        vm.eventSettings = eventSettings;
        vm.eventImageSize = {
            w: eventSettings.thumbWidth,
            h: eventSettings.thumbHeight
        };
        vm.endDateHoursAddition = eventSettings.endDateHoursAddition;
        vm.recurringTypesResources = recurringTypesResources;

        $rootScope.pageTitle = vm.states.isAdd ? 'events.addTitle' : 'events.editTitle';

        vm.event = {};
        vm.event.options = [];
        vm.eventImage = '';
        vm.eventCroppedImage = '';
        vm.minStartDate = moment().local().startOf('minute').toDate();

        vm.searchUsers = searchUsers;
        vm.addOption = addOption;
        vm.deleteOption = deleteOption;
        vm.isValidOption = isValidOption;
        vm.isOptionsUnique = isOptionsUnique;
        vm.saveEvent = saveEvent;
        vm.deleteEvent = deleteEvent;
        vm.createEvent = createEvent;
        vm.updateEvent = updateEvent;
        vm.openDatePicker = openDatePicker;
        vm.showRegistrationDeadline = showRegistrationDeadline;
        vm.getResponsiblePerson = getResponsiblePerson;
        vm.setEvent = setEvent;
        vm.closeAllDatePickers = closeAllDatePickers;
        vm.isStartDateValid = isStartDateValid;
        vm.isEndDateValid = isEndDateValid;
        vm.isDeadlineDateValid = isDeadlineDateValid;

        init();

        ///////

        function init() {
            vm.isOptions = false;

            vm.datePickers = {
                isOpenEventStartDatePicker: false,
                isOpenEventFinishDatePicker: false,
                isOpenEventDeadlineDatePicker: false
            };

            eventRepository.getEventOffices().then(function(response) {
                vm.eventOffices = response;
            });

            eventRepository.getEventTypes().then(function(response) {
                vm.eventTypes = response;
            });

            eventRepository.getEventRecurringTypes().then(function(response) {
                vm.recurringTypes = response;
            });

            if ($stateParams.id) {
                eventRepository.getEventUpdate($stateParams.id).then(function(event) {
                        vm.event = event;
                        vm.responsibleUser = {
                            id: vm.event.hostUserId,
                            fullName: vm.event.hostUserFullName
                        };

                        vm.minParticipants = vm.event.maxParticipants;

                        if (vm.event.startDate !== vm.event.registrationDeadlineDate) {
                            vm.isRegistrationDeadlineEnabled = true;
                        }

                        vm.event.registrationDeadlineDate = moment.utc(vm.event.registrationDeadlineDate).local().startOf('minute').toDate();
                        vm.event.startDate = moment.utc(vm.event.startDate).local().startOf('minute').toDate();
                        vm.event.endDate = moment.utc(vm.event.endDate).local().startOf('minute').toDate();

                        if (!!vm.event.options.length) {
                            vm.isOptions = true;
                        } else {
                            vm.event.maxOptions = 1;
                            addOption();
                            addOption();
                        }
                    },
                    function(error) {
                        errorHandler.handleErrorMessage(error);

                        $state.go('Root.WithOrg.Client.Events.List.Type', {
                            type: 'all'
                        });
                    });
            } else {
                getResponsiblePerson(authService.identity.userId);

                vm.event = {
                    name: '',
                    typeId: null,
                    officeId: null,
                    startDate: moment().add(1, 'hours').local().startOf('minute').toDate(),
                    endDate: moment().add(3, 'hours').local().startOf('minute').toDate(),
                    recurrence: 0,
                    location: '',
                    description: '',
                    imageName: '',
                    maxOptions: 1,
                    options: [],
                    registrationDeadlineDate: null
                };

                eventRepository.getMaxEventParticipants().query(function(response)
                {
                    vm.event.maxParticipants = response.value;
                });

                addOption();
                addOption();
            }

            $scope.$watch('vm.responsibleUser', function(newVal) {
                if (newVal && !newVal.id) {
                    vm.isResponsibleUserError = true;
                } else {
                    vm.isResponsibleUserError = null;
                }
            }, true);
        }

        function searchUsers(search) {
            return eventRepository.getUserForAutoCompleteResponsiblePerson(search);
        }

        function getResponsiblePerson(userId) {
            eventRepository.getUserResponsiblePersonById(userId).then(function(data) {
                vm.responsibleUser = data;
            });
        }

        function isValidOption(options, option) {
            for (var i = 0; options.length > i; i++) {
                if (options.indexOf(option) !== i &&
                    option.option && options[i].option &&
                    option.option === options[i].option) {
                    return false;
                }
            }

            return true;
        }

        function isOptionsUnique() {
            if (!!vm.isOptions) {
                var tempArray = angular.copy(vm.event.options);
                var uniqueOptions = lodash.uniq(tempArray, 'option');
                return lodash.isEqual(tempArray.sort(), uniqueOptions.sort());
            } else {
                return true;
            }
        }

        function addOption() {
            vm.event.options.push({
                option: ''
            });
        }

        function deleteOption(index) {
            vm.event.options.splice(index, 1);

            if (vm.event.options.length === 1) {
                vm.isOptions = false;
                addOption();
            }
        }

        function saveEvent(method, isImageChanged) {
            if (isImageChanged) {
                var eventImageBlob = dataHandler.dataURItoBlob(vm.eventCroppedImage[0], vm.eventImage[0].type);

                eventImageBlob.lastModifiedDate = new Date();
                eventImageBlob.name = vm.eventImage[0].name;
                var eventImage = eventImageBlob;

                pictureRepository.upload([eventImageBlob]).then(function(result) {
                    method(result.data);
                });
            } else {
                method();
            }
        }
        
        function deleteEvent(id) {
            eventRepository.deleteEvent(id).then(function(result) {
                notifySrv.success('events.successDelete');

                $state.go('Root.WithOrg.Client.Events.List.Type', {type: 'all'});
            }, errorHandler.handleErrorMessage);
        }

        function createEvent(image) {
            if (vm.isSaveButtonEnabled) {
                vm.isSaveButtonEnabled = false;

                setEvent();

                if (image) {
                    vm.event.imageName = image;
                }

                eventRepository.createEvent(vm.event).then(function(result) {
                        notifySrv.success('common.successfullySaved');

                        $state.go('Root.WithOrg.Client.Events.List.Type', {
                            type: 'all'
                        });
                    },
                    function(error) {
                        vm.isSaveButtonEnabled = true;
                        errorHandler.handleErrorMessage(error);
                    });
            }
        }

        function updateEvent(image) {
            if (vm.isSaveButtonEnabled) {
                vm.isSaveButtonEnabled = false;

                setEvent();

                if (image) {
                    vm.event.imageName = image;
                }

                eventRepository.updateEvent(vm.event).then(function(result) {
                        notifySrv.success('common.successfullySaved');

                        $state.go('Root.WithOrg.Client.Events.List.Type', {
                            type: 'all'
                        });
                    },
                    function(error) {
                        vm.isSaveButtonEnabled = true;
                        errorHandler.handleErrorMessage(error);
                    });
            }
        }

        function setEvent() {
            if (vm.states.isEdit && vm.resetParticipantList) {
                vm.event.resetParticipantList = vm.event.maxParticipants < vm.minParticipants;
            }

            if (!vm.isRegistrationDeadlineEnabled) {
                vm.event.registrationDeadlineDate = vm.event.startDate;
            }

            if (vm.isOptions) {

                var tempArray = [];
                vm.event.editedOptions = [];
                vm.event.newOptions = [];

                tempArray = lodash.filter(vm.event.options, function(element) {
                    return !element.id;
                });

                vm.event.newOptions = lodash.map(tempArray,'option');

                vm.event.editedOptions = lodash.filter(vm.event.options, function(element) {
                    return !!element.id;
                });

            } else {
                vm.event.options = [];
                vm.event.editedOptions = [];
                vm.event.newOptions = [];

                vm.event.maxOptions = 0;
            }

            vm.event.responsibleUserId = vm.responsibleUser.id;
            vm.event.endDate = moment(vm.event.endDate).local().startOf('minute').toDate();
        }

        function showRegistrationDeadline() {
            if (vm.isRegistrationDeadlineEnabled) {
                vm.event.registrationDeadlineDate = vm.event.startDate;
            }
        }

        function openDatePicker($event, datePicker) {
            $event.preventDefault();
            $event.stopPropagation();

            vm.closeAllDatePickers(datePicker);

            $timeout(function() {
                $event.target.focus();
            }, 100);
        }

        function closeAllDatePickers(datePicker) {
            vm.datePickers.isOpenEventStartDatePicker = false;
            vm.datePickers.isOpenEventDeadlineDatePicker = false;
            vm.datePickers.isOpenEventFinishDatePicker = false;

            vm.datePickers[datePicker] = true;
        }

        function isStartDateValid() {
            if (vm.states.isAdd) {
                if (vm.event.startDate) {
                    return vm.minStartDate < vm.event.startDate;
                }
            }

            return true;
        }

        function isEndDateValid() {
            if (vm.event.endDate) {
                return vm.event.endDate > vm.event.startDate;
            }

            return true;
        }

        function isDeadlineDateValid() {
            if (vm.states.isAdd) {
                return vm.isRegistrationDeadlineEnabled &&
                    (vm.event.registrationDeadlineDate > vm.event.startDate ||
                        vm.event.registrationDeadlineDate < vm.minStartDate);
            } else {
                return vm.isRegistrationDeadlineEnabled &&
                    (vm.event.registrationDeadlineDate > vm.event.startDate ||
                        !vm.event.registrationDeadlineDate);
            }
        }
    }
})();
