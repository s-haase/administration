import template from './sw-flow-sequence-action.html.twig';
import './sw-flow-sequence-action.scss';
import { ACTION } from '../../constant/flow.constant';

const { Component, State } = Shopware;
const utils = Shopware.Utils;
const { ShopwareError } = Shopware.Classes;
const { mapState, mapGetters } = Component.getComponentHelper();

Component.register('sw-flow-sequence-action', {
    template,

    inject: ['repositoryFactory', 'flowBuilderService'],

    props: {
        sequence: {
            type: Object,
            required: true,
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false,
        },
    },

    data() {
        return {
            showAddButton: true,
            fieldError: null,
            actionModal: '',
            currentSequence: {},
        };
    },

    computed: {
        sequenceRepository() {
            return this.repositoryFactory.create('flow_sequence');
        },

        actionOptions() {
            return this.convertAction(this.availableActions);
        },

        sequenceData() {
            if (this.sequence.id) {
                return [
                    {
                        ...this.sequence,
                        ...this.getActionTitle(this.sequence.actionName),
                    },
                ];
            }

            return this.sortByPosition(Object.values(this.sequence).map(item => {
                return {
                    ...item,
                    ...this.getActionTitle(item.actionName),
                };
            }));
        },

        showAddAction() {
            return !(
                this.sequence.actionName === ACTION.STOP_FLOW ||
                this.sequenceData.some(sequence => sequence.actionName === ACTION.STOP_FLOW)
            );
        },

        actionClasses() {
            return {
                'is--stop-flow': !this.showAddAction,
            };
        },

        modalName() {
            return this.flowBuilderService.getActionModalName(this.actionModal);
        },

        ...mapState('swFlowState', ['invalidSequences', 'stateMachineState']),
        ...mapGetters('swFlowState', ['availableActions']),
    },

    watch: {
        sequence: {
            handler() {
                this.setFieldError();
            },
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.showAddButton = this.sequenceData.length > 1 || !!this.sequence?.actionName;
        },

        openDynamicModal(value) {
            if (value === ACTION.STOP_FLOW) {
                this.addAction({
                    name: ACTION.STOP_FLOW,
                    config: null,
                });
                return;
            }
            this.actionModal = value;
        },

        onSaveActionSuccess(sequence) {
            const { config, id } = sequence;
            const entity = config?.entity;
            let actionName = this.actionModal;

            if (this.actionModal === ACTION.ADD_TAG && entity) {
                actionName = `action.add.${entity}.tag`;
            }

            if (this.actionModal === ACTION.REMOVE_TAG && entity) {
                actionName = `action.remove.${entity}.tag`;
            }

            if (!id) {
                this.addAction({
                    name: actionName,
                    config: config,
                });
            } else {
                this.editAction({
                    name: actionName,
                    config: config,
                });
            }

            this.onCloseModal();
        },

        onCloseModal() {
            this.currentSequence = {};
            this.actionModal = '';
        },

        addAction(action) {
            if (!action.name) {
                return;
            }

            if (!this.sequence.actionName && this.sequence.id) {
                State.commit('swFlowState/updateSequence', {
                    id: this.sequence.id,
                    actionName: action.name,
                    config: action.config,
                });
            } else {
                const lastSequence = this.sequenceData[this.sequenceData.length - 1];

                let sequence = this.sequenceRepository.create();
                const newSequence = {
                    ...sequence,
                    parentId: lastSequence.parentId,
                    trueCase: lastSequence.trueCase,
                    displayGroup: lastSequence.displayGroup,
                    ruleId: null,
                    actionName: action.name,
                    position: lastSequence.position + 1,
                    config: action.config,
                    id: utils.createId(),
                };

                sequence = Object.assign(sequence, newSequence);
                State.commit('swFlowState/addSequence', sequence);
            }

            this.removeFieldError();
            this.toggleAddButton();
        },

        editAction(action) {
            if (!action.name) {
                return;
            }

            State.commit('swFlowState/updateSequence', {
                id: this.currentSequence.id,
                actionName: action.name,
                config: action.config,
            });
        },

        removeAction(id) {
            State.commit('swFlowState/removeSequences', [id]);
        },

        onEditAction(sequence) {
            if (!sequence?.actionName) {
                return;
            }

            this.currentSequence = sequence;
            this.actionModal = sequence.actionName;
        },

        removeActionContainer() {
            const removeSequences = this.sequence.id ? [this.sequence.id] : Object.keys(this.sequence);

            State.commit('swFlowState/removeSequences', removeSequences);
        },

        getActionTitle(actionName) {
            if (!actionName) {
                return null;
            }

            const actionTitle = this.flowBuilderService.getActionTitle(actionName);
            return {
                ...actionTitle,
                label: this.$tc(actionTitle.label),
            };
        },

        convertAction(actions) {
            return actions.map((action) => {
                return this.getActionTitle(action);
            });
        },

        toggleAddButton() {
            this.showAddButton = !this.showAddButton;
        },

        sortByPosition(sequences) {
            return sequences.sort((prev, current) => {
                return prev.position - current.position;
            });
        },

        stopFlowStyle(value) {
            return {
                'is--stop-flow': value === ACTION.STOP_FLOW,
            };
        },

        convertTagString(tagsString) {
            return tagsString.toString().replace(/,/g, ', ');
        },

        getActionDescription(sequence) {
            const { actionName, config } = sequence;

            if (!actionName) return '';

            if (actionName.includes('tag') &&
                (actionName.includes('add') || actionName.includes('remove'))) {
                return this.$tc('sw-flow.actions.tagDescription', 0, {
                    entity: config.entity,
                    tagNames: this.convertTagString(Object.values(config.tagIds)),
                });
            }

            switch (actionName) {
                case ACTION.STOP_FLOW:
                    return this.$tc('sw-flow.actions.textStopFlowDescription');
                case ACTION.SET_ORDER_STATE:
                    return this.showSetOrderStateDescription(config);
                default: {
                    return '';
                }
            }
        },

        setFieldError() {
            if (!this.invalidSequences?.includes(this.sequence.id)) {
                this.fieldError = null;
                return;
            }

            this.fieldError = new ShopwareError({
                code: 'c1051bb4-d103-4f74-8988-acbcafc7fdc3',
            });
        },

        removeFieldError() {
            if (!this.fieldError) {
                return;
            }

            this.fieldError = null;
            const invalidSequences = this.invalidSequences?.filter(id => this.sequence.id !== id);
            State.commit('swFlowState/setInvalidSequences', invalidSequences);
        },

        isNotStopFlow(item) {
            return item.actionName !== ACTION.STOP_FLOW;
        },

        onCreateActionSuccess(actionSequence) {
            this.addAction(actionSequence);
            this.onCloseModal();
        },

        showSetOrderStateDescription(config) {
            const description = [];
            if (config.order) {
                const orderStatus = this.stateMachineState.find(item => item.technicalName === config.order);
                const orderStatusName = orderStatus?.translated?.name || '';
                description.push(`${this.$tc('sw-flow.modals.status.labelOrderStatus')}: ${orderStatusName}`);
            }

            if (config.order_delivery) {
                const deliveryStatus = this.stateMachineState.find(item => item.technicalName === config.order_delivery);
                const deliveryStatusName = deliveryStatus?.translated?.name || '';
                description.push(`${this.$tc('sw-flow.modals.status.labelDeliveryStatus')}: ${deliveryStatusName}`);
            }

            if (config.order_transaction) {
                const paymentStatus = this.stateMachineState.find(item => item.technicalName === config.order_transaction);
                const paymentStatusName = paymentStatus?.translated?.name || '';
                description.push(`${this.$tc('sw-flow.modals.status.labelPaymentStatus')}: ${paymentStatusName}`);
            }

            return description.join('<br>');
        },
    },
});
