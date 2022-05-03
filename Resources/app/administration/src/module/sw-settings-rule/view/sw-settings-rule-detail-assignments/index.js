import RuleAssignmentConfigurationService from 'src/module/sw-settings-rule/service/rule-assignment-configuration.service';
import template from './sw-settings-rule-detail-assignments.html.twig';
import './sw-settings-rule-detail-assignments.scss';

const { Component, Mixin, Context, Utils } = Shopware;
const { Criteria } = Shopware.Data;

Component.register('sw-settings-rule-detail-assignments', {
    // eslint-disable-next-line max-len
    template,

    inject: [
        'repositoryFactory',
        'ruleConditionDataProviderService',
        'feature',
        'acl',
    ],

    mixins: [
        Mixin.getByName('notification'),
    ],

    props: {
        rule: {
            type: Object,
            required: true,
        },

        /* @internal (flag:FEATURE_NEXT_18215) */
        conditions: {
            type: Array,
            required: false,
            default: null,
        },

        /* @internal (flag:FEATURE_NEXT_18215) */
        detailPageLoading: {
            type: Boolean,
            required: false,
            default: false,
        },
    },

    data() {
        return {
            associationLimit: 5,
            isLoading: false,
            ruleAssociationsLoaded: false,
            products: null,
            shippingMethods: null,
            paymentMethods: null,
            promotions: null,
            eventActions: null,
            associationSteps: [5, 10],
            associationEntities: null,
            deleteModal: false,
            deleteEntity: null,
            deleteItem: null,
            addModal: false,
            addEntityContext: null,
            restrictedAssociations: null,
        };
    },

    computed: {
        getRuleAssignmentConfiguration() {
            return RuleAssignmentConfigurationService(this.rule.id, this.associationLimit).getConfiguration();
        },

        /* eslint-disable max-len */
        /**
         * Definition of the associated entities of the current rule.
         * The component will render a sw-entity-listing for each association entity,
         * if results are given.
         *
         * @type {[{id: String, notAssignedDataTotal: int, entityName: String, label: String, criteria: Function, api: Function, detailRoute: String, gridColumns: Array<Object>, deleteContext: Object, addContext: Object }]}
         * @returns {Array<Object>}
         */
        /* eslint-enable max-len */
        associationEntitiesConfig() {
            return Object.values(this.getRuleAssignmentConfiguration);
        },

        /* @internal (flag:FEATURE_NEXT_18215) */
        associationRestrictions() {
            if (!this.feature.isActive('FEATURE_NEXT_18215')) {
                return {};
            }

            if (!this.conditions || typeof this.ruleConditionDataProviderService.getRestrictedAssociations !== 'function') {
                return {};
            }

            return this.ruleConditionDataProviderService.getRestrictedAssociations(this.conditions);
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.prepareAssociationEntitiesList();
            this.loadAssociationData();
        },

        disableAdd(entity) {
            if (this.feature.isActive('FEATURE_NEXT_18215')) {
                const association = entity.associationName ?? null;
                if (this.associationRestrictions[association]?.isRestricted) {
                    return true;
                }
            }
            return entity.notAssignedDataTotal === 0;
        },

        /* @internal (flag:FEATURE_NEXT_18215) */
        getTooltipConfig(entity) {
            const association = entity.associationName ?? null;
            const restriction = this.associationRestrictions[association];

            let config = {};

            if (!restriction?.isRestricted) {
                config = { message: '', disabled: true };
            } else if (restriction.notEqualsViolations?.length > 0) {
                config = {
                    showOnDisabledElements: true,
                    disabled: false,
                    message: this.$tc(
                        'sw-restricted-rules.restrictedAssignment.notEqualsViolationTooltip',
                        {},
                        {
                            conditions: this.ruleConditionDataProviderService.getTranslatedConditionViolationList(
                                restriction.notEqualsViolations,
                                'sw-restricted-rules.and',
                            ),
                            entityLabel: this.$tc(restriction.assignmentSnippet, 2),
                        },
                    ),
                };
            } else {
                config = {
                    showOnDisabledElements: true,
                    disabled: false,
                    width: 400,
                    message: this.$tc(
                        'sw-restricted-rules.restrictedAssignment.equalsAnyViolationTooltip',
                        0,
                        {
                            conditions: this.ruleConditionDataProviderService.getTranslatedConditionViolationList(
                                restriction.notEqualsViolations,
                                'sw-restricted-rules.or',
                            ),
                            entityLabel: this.$tc(restriction.assignmentSnippet, 2),
                        },
                    ),
                };
            }

            return config;
        },

        allowDeletion(entity) {
            return !!entity.deleteContext;
        },

        prepareAssociationEntitiesList() {
            this.associationEntities = this.associationEntitiesConfig.map((item) => {
                return {
                    repository: this.repositoryFactory.create(item.entityName),
                    loadedData: null,
                    ...item,
                };
            });
        },

        onOpenDeleteModal(entity, item) {
            this.deleteModal = true;
            this.deleteEntity = entity;
            this.deleteItem = item;
        },

        onCloseDeleteModal() {
            this.deleteModal = false;
            this.deleteContext = null;
            this.deleteItem = null;
        },

        onOpenAddModal(entityContext) {
            this.addModal = true;
            this.addEntityContext = entityContext;
        },

        onCloseAddModal() {
            this.addModal = false;
            this.addEntityContext = null;
        },

        onEntitiesSaved() {
            this.addModal = false;

            return this.refreshAssignmentData(this.addEntityContext);
        },

        async onDeleteItems(entity, selection) {
            await Promise.all(Object.values(selection).map(async (item) => {
                this.deleteEntity = entity;
                this.deleteItem = item;

                await this.doDeleteItem();
            }));

            return this.refreshAssignmentData(entity).then(() => {
                this.onCloseDeleteModal();
            });
        },

        onDelete() {
            return this.doDeleteItem().then(() => {
                return this.refreshAssignmentData(this.deleteEntity).then(() => {
                    this.onCloseDeleteModal();
                });
            });
        },

        doDeleteItem() {
            const api = this.deleteEntity.api ? this.deleteEntity.api() : Context.api;
            const repository = this.repositoryFactory.create(this.deleteItem.getEntityName());

            if (this.deleteEntity.deleteContext.type === 'one-to-many') {
                Utils.object.set(this.deleteItem, this.deleteEntity.deleteContext.column, null);
            } else {
                Utils.object.get(this.deleteItem, this.deleteEntity.deleteContext.column).remove(this.rule.id);
            }

            this.isLoading = true;
            return repository.save(this.deleteItem, api).finally(() => {
                this.isLoading = false;
            });
        },

        async refreshAssignmentData(entity) {
            this.isLoading = true;
            const api = entity.api ? entity.api() : Context.api;
            const result = await entity.repository.search(entity.criteria(), api);
            const total = await this.loadNotAssignedDataTotals(entity, api);

            this.associationEntities.forEach((currentEntity) => {
                if (entity.id === currentEntity.id) {
                    currentEntity.loadedData = result;
                    currentEntity.notAssignedDataTotal = total;
                }
            });
            this.isLoading = false;
        },

        onFilterEntity(item, term) {
            const api = item.api ? item.api() : Context.api;
            const criteria = item.criteria();

            criteria.setPage(1);
            criteria.setTerm(term);

            this.isLoading = true;
            return item.repository.search(criteria, api).then((result) => {
                item.loadedData = result;
            }).finally(() => {
                this.isLoading = false;
            });
        },

        async loadNotAssignedDataTotals(item, api) {
            if (!item.deleteContext && !item.addContext) {
                return Promise.resolve(true);
            }

            const criteria = new Criteria();
            criteria.addFilter(Criteria.not('AND', item.criteria().filters));
            criteria.setLimit(1);

            this.isLoading = true;
            return item.repository.search(criteria, api).then((notAssignedDataResult) => {
                return Promise.resolve(notAssignedDataResult.total);
            }).finally(() => {
                this.isLoading = false;
            });
        },

        getRouterLink(entity, item) {
            return { name: entity.detailRoute, params: { id: item.id } };
        },

        loadAssociationData() {
            this.isLoading = true;

            return Promise
                .all(this.associationEntities.map((item) => {
                    const api = item.api ? item.api() : Context.api;

                    return item.repository.search(item.criteria(), api).then(async (result) => {
                        item.loadedData = result;

                        item.notAssignedDataTotal = await this.loadNotAssignedDataTotals(item, api);
                    });
                }))
                .catch(() => {
                    this.createNotificationError({
                        message: this.$tc('sw-settings-rule.detail.associationsLoadingError'),
                    });
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
    },
});
