import template from './entity-list.html.twig';
const { Mixin } = Shopware;
const { Criteria } = Shopware.Data;
const utils = Shopware.Utils;

export default {
    template,
    props: {
        entity: String,
        labels: Object,
        links: Object,
        columns: Array,
        associations: Array,
        entityFilters: Array,
        context: Object
    },
    inject: [
        'repositoryFactory',
        'acl',
        'filterFactory',
        'feature',
    ],

    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('salutation'),
        Mixin.getByName('listing'),
    ],
    data() {
        return {
            entities: null,
            sortBy: '',
            naturalSorting: true,
            sortDirection: 'DESC',
            isLoading: false,
            showDeleteModal: false,
            filterLoading: false,
            filterCriteria: [],
            defaultFilters: [
                /*
                'customer-number-filter',
                'affiliate-code-filter',
                'campaign-code-filter',
                'customer-group-request-filter',
                'salutation-filter',
                'account-status-filter',
                'default-payment-method-filter',
                'group-filter',
                'billing-address-country-filter',
                'shipping-address-country-filter',
                'tags-filter',
                 */
            ],
            activeFilterNumber: 0,
            searchConfigEntity: 'customer',
            showBulkEditModal: false,
        };
    },
    metaInfo() {
        return {
            title: this.$createTitle(),
        };
    },

    computed: {
        entityRepository() {
            return this.repositoryFactory.create(this.entity);
        },

        entityColumns() {
            return this.getEntityColumns();
        },

        storeKey() {
            return 'aggro-plugin-core.filter.'+this.entity;
        },

        defaultCriteria() {
            const defaultCriteria = new Criteria(this.page, this.limit);
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            //this.naturalSorting = this.sortBy === 'customerNumber';

            defaultCriteria.setTerm(this.term);

            this.sortBy.split(',').filter(f => f).forEach((sortBy) => {
                defaultCriteria.addSorting(Criteria.sort(sortBy, this.sortDirection, this.naturalSorting));
            });

            if (this.associations) {
                this.associations.forEach((association) => {
                    defaultCriteria.addAssociation(association);
                });
            }

            if (this.entityFilters) {
                this.entityFilters.forEach((filter) => {
                    defaultCriteria.addFilter(filter);
                });
            }

            /*
            defaultCriteria
                .addAssociation('defaultBillingAddress')
                .addAssociation('group')
                .addAssociation('requestedGroup')
                .addAssociation('boundSalesChannel');
            */

            this.filterCriteria.forEach((filter) => {
                defaultCriteria.addFilter(filter);
            });

            return defaultCriteria;
        },

        filterSelectCriteria() {
            const criteria = new Criteria(1, 1);
            /*
            criteria.addFilter(
                Criteria.not('AND', [
                    Criteria.equals('affiliateCode', null),
                    Criteria.equals('campaignCode', null),
                ]),
            );
            criteria.addAggregation(Criteria.terms('affiliateCodes', 'affiliateCode', null, null, null));
            criteria.addAggregation(Criteria.terms('campaignCodes', 'campaignCode', null, null, null));
            */
            return criteria;
        },

        listFilterOptions() {

            return {};

            const options = {
                'customer-number-filter': {
                    property: 'customerNumber',
                    type: 'string-filter',
                    label: this.$tc('sw-customer.filter.customerNumber.label'),
                    placeholder: this.$tc('sw-customer.filter.customerNumber.placeholder'),
                    valueProperty: 'key',
                    labelProperty: 'key',
                    criteriaFilterType: 'equals',
                },
                'affiliate-code-filter': {
                    property: 'affiliateCode',
                    type: 'multi-select-filter',
                    label: this.$tc('sw-customer.filter.affiliateCode.label'),
                    placeholder: this.$tc('sw-customer.filter.affiliateCode.placeholder'),
                    valueProperty: 'key',
                    labelProperty: 'key',
                    options: this.availableAffiliateCodes,
                },
                'campaign-code-filter': {
                    property: 'campaignCode',
                    type: 'multi-select-filter',
                    label: this.$tc('sw-customer.filter.campaignCode.label'),
                    placeholder: this.$tc('sw-customer.filter.campaignCode.placeholder'),
                    valueProperty: 'key',
                    labelProperty: 'key',
                    options: this.availableCampaignCodes,
                },
                'customer-group-request-filter': {
                    property: 'requestedGroupId',
                    type: 'existence-filter',
                    label: this.$tc('sw-customer.filter.customerGroupRequest.label'),
                    placeholder: this.$tc('sw-customer.filter.customerGroupRequest.placeholder'),
                    optionHasCriteria: this.$tc('sw-customer.filter.customerGroupRequest.textHasCriteria'),
                    optionNoCriteria: this.$tc('sw-customer.filter.customerGroupRequest.textNoCriteria'),
                },
                'salutation-filter': {
                    property: 'salutation',
                    label: this.$tc('sw-customer.filter.salutation.label'),
                    placeholder: this.$tc('sw-customer.filter.salutation.placeholder'),
                    labelProperty: 'displayName',
                },
                'account-status-filter': {
                    property: 'active',
                    label: this.$tc('sw-customer.filter.status.label'),
                    placeholder: this.$tc('sw-customer.filter.status.placeholder'),
                },
                'group-filter': {
                    property: 'group',
                    label: this.$tc('sw-customer.filter.customerGroup.label'),
                    placeholder: this.$tc('sw-customer.filter.customerGroup.placeholder'),
                },
                'billing-address-country-filter': {
                    property: 'defaultBillingAddress.country',
                    label: this.$tc('sw-customer.filter.billingCountry.label'),
                    placeholder: this.$tc('sw-customer.filter.billingCountry.placeholder'),
                },
                'shipping-address-country-filter': {
                    property: 'defaultShippingAddress.country',
                    label: this.$tc('sw-customer.filter.shippingCountry.label'),
                    placeholder: this.$tc('sw-customer.filter.shippingCountry.placeholder'),
                },
                'tags-filter': {
                    property: 'tags',
                    label: this.$tc('sw-customer.filter.tags.label'),
                    placeholder: this.$tc('sw-customer.filter.tags.placeholder'),
                },
            };


            return options;
        },

        listFilters() {
            return this.filterFactory.create(this.entity, this.listFilterOptions);
        },

        assetFilter() {
            return Shopware.Filter.getByName('asset');
        }
    },

    watch: {
        defaultCriteria: {
            handler() {
                this.getList();
            },
            deep: true,
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            return this.loadFilterValues();
        },

        onInlineEditSave(promise, entity) {
            promise
                .then(() => {
                    this.createNotificationSuccess({
                        message: this.$tc('aggro-plugin-core.detail.messageSaveSuccess', 0, { name: 'foobar' }),
                    });
                })
                .catch(() => {
                    this.getList();
                    this.createNotificationError({
                        message: this.$tc('aggro-plugin-core.detail.messageSaveError'),
                    });
                });
        },

        async getList() {
            this.isLoading = true;

            const criteria = await Shopware.Service('filterService').mergeWithStoredFilters(
                this.storeKey,
                this.defaultCriteria,
            );

            const newCriteria = await this.addQueryScores(this.term, criteria);

            this.activeFilterNumber = criteria.filters?.length || 0;

            if (!this.entitySearchable) {
                this.isLoading = false;
                this.total = 0;

                return;
            }

            if (this.freshSearchTerm) {
                newCriteria.resetSorting();
            }

            try {

                const items = await this.entityRepository.search(newCriteria, this.context || Shopware.Context.api);

                this.total = items.total;
                this.entities = items;
                this.isLoading = false;
                this.selection = {};
            } catch {
                this.isLoading = false;
            }
        },

        onDelete(id) {
            this.showDeleteModal = id;
        },

        onCloseDeleteModal() {
            this.showDeleteModal = false;
        },

        onConfirmDelete(id) {
            this.showDeleteModal = false;

            return this.entityRepository.delete(id).then(() => {
                this.getList();
            });
        },

        async onChangeLanguage() {
            await this.createdComponent();
            await this.getList();
        },

        getEntityColumns() {
            return this.columns;
        },

        loadFilterValues() {
            this.filterLoading = true;

            return this.entityRepository
                .search(this.filterSelectCriteria)
                .then(({ aggregations }) => {
                    this.filterLoading = false;

                    return aggregations;
                })
                .catch(() => {
                    this.filterLoading = false;
                });
        },

        updateCriteria(criteria) {
            this.page = 1;
            this.filterCriteria = criteria;
        },

        async onBulkEditItems() {
            await this.$nextTick();
            this.$router.push({ name: 'aggro.bulk.edit.entity' });
        },

        onBulkEditModalOpen() {
            this.showBulkEditModal = true;
        },

        onBulkEditModalClose() {
            this.showBulkEditModal = false;
        },
    },
}