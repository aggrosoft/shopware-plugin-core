import template from './entity-list.html.twig';
const { Mixin } = Shopware;
const { Criteria } = Shopware.Data;
const utils = Shopware.Utils;

export default {
    template,
    props: {
        entity: String,
        labels: Object,
        links: {
            type: Object,
            default: () => ({}),
        },
        columns: Array,
        filters: Object,
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
            groupBy: [],
            activeFilterNumber: 0,
            searchConfigEntity: null,
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
            return this.filters || {};
        },

        listFilters() {
            const filters = this.filterFactory.create(this.entity, this.listFilterOptions);
            for (const filter of filters) {
                filter.label = filter.label ? this.$tc(filter.label) : null;
                filter.placeholder = filter.placeholder ? this.$tc(filter.placeholder) : null;
                if (filter.options) {
                    filter.options = filter.options.map(option => ({
                        ...option,
                        label: this.$tc(option.label)
                    }));
                }
            }
            return filters;
        },

        defaultFilters() {
            return this.listFilters ? this.listFilters.map(filter => filter.name) : [];
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
            this.searchConfigEntity = this.entity;
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


            this.activeFilterNumber = criteria.filters?.length - this.entityFilters?.length || 0;

            if (!this.entitySearchable) {
                this.isLoading = false;
                this.total = 0;

                return;
            }

            if (this.freshSearchTerm) {
                newCriteria.resetSorting();
            }

            if(this.groupBy?.length) {
                this.addGrouping(newCriteria);
            }

            /*newCriteria.addGrouping('customerId');
            newCriteria.addAggregation(
                Criteria.terms('customers', 'customerId', null, null, Criteria.sum('quantity','quantity'))
            );*/

            try {

                const items = await this.entityRepository.search(newCriteria, this.context || Shopware.Context.api);

                this.total = items.total;
                this.entities = items;
                this.isLoading = false;
                this.selection = {};
                console.log(items);
            } catch {
                this.isLoading = false;
            }
        },

        addGrouping(criteria) {
            const groupingColumns = this.columns.filter(column => column.grouping);
            this.groupBy.forEach(group => {
                criteria.addGrouping(group);
                groupingColumns.forEach(column => {
                    criteria.addAggregation(Criteria.terms(group+'-'+column.property, group, null, null, column.grouping));
                })
            });
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

        onUpdateGroupBy(event) {
            this.groupBy = event;
            this.getList();
        },

        async onItemExpand(item, column) {
            const criteria = await Shopware.Service('filterService').mergeWithStoredFilters(
                this.storeKey,
                this.defaultCriteria,
            );

            const newCriteria = await this.addQueryScores(this.term, criteria);
            newCriteria.page = 1;
            newCriteria.limit = 500;

            const property = column.property;
            const value = item[property];
            newCriteria.addFilter(Criteria.equals(property, value));


            const items = await this.entityRepository.search(newCriteria, this.context || Shopware.Context.api);
            // append items after the current item
            const parentIndex = this.entities.indexOf(item);
            if (parentIndex !== -1) {
                this.entities.splice(parentIndex + 1, 0, ...items);
                console.log(this.entities);
            }

        }
    },
}