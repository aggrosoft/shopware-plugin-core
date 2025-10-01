import template from './aggro-entity-listing.html.twig';

export default {
    template,
    props: {
        groupBy: {
            type: Array,
            required: false
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
    },
    methods: {
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

                return this.$super('renderColumn', item, column);
            }
        }
    }
}