import './aggro-entity-listing.scss'
import template from './aggro-entity-listing.html.twig';

export default {
    template,
    props: {
        groupBy: {
            type: Array,
            required: false
        },
        childItems: {
            type: Object,
            required: false,
            default: () => ({})
        }
    },
    data: function () {
        return {
            expandedItems: {}
        }
    },
    computed: {
        groupableColumns() {
            return this.columns.filter(column => column.groupable).map(column => Object.assign({}, column, {label: this.$tc(column.label)}));
        },
        currentGroupBy: {
            get() {
                if (!this.groupBy) {
                    return [];
                }

                return this.groupBy;
            },
            set(newValue) {
                this.$emit('update:groupBy', newValue);
            },
        },
        isGrouped() {
            return this.groupBy?.length > 0;
        }
    },
    methods: {
        applyResult(result) {
            this.$super('applyResult', result);
            this.expandedItems = {};
        },
        renderColumn: function (item, column) {
            if (this.groupBy?.length) {
                if (!column.grouping && !column.groupable) {
                    return '';
                }
                for (const group of this.groupBy) {
                    const aggregationKey = `${group}-${column.property}`;
                    const aggregation = this.items.aggregations[aggregationKey];
                    const bucket = aggregation?.buckets?.find(bucket => bucket.key == item[group]);
                    if (bucket) {
                        return bucket[column.grouping.name][column.grouping.type]
                    }
                }
            }
            return this.$super('renderColumn', item, column);
        },
        isGroupedColumn(column) {
            return this.groupBy?.some(group => group === column.property);
        },
        isSumColumn(column) {
            return this.isGrouped && column.grouping && column.grouping.type === 'sum';
        },
        isItemColumnExpanded(item, column) {
            return this.expandedItems[item.id] === column.property;
        },
        isItemExpanded(item) {
            return this.expandedItems[item.id]
        },
        toggleItemExpand(item, column) {
            if(this.expandedItems[item.id]) {
                this.$set(this.expandedItems, item.id, false);
                this.$emit('item-collapse', item, column);
            }else{
                this.$set(this.expandedItems, item.id, column.property);
                this.$emit('item-expand', item, column);
            }
        },
        getHeaderCellClasses(column, index) {
            const classes = this.$super('getHeaderCellClasses', column, index);
            if (this.isGroupedColumn(column)) {
                classes.push('sw-data-grid__cell--grouped');
            }else if(this.isGrouped && !column.grouping && !column.groupable) {
                classes.push('sw-data-grid__cell--disabled');
            }
            return classes;
        }
    }
}