import template from './aggro-form-field-renderer.html.twig';

export default {
    template,

    props: {
        field: {
            type: Object,
            required: true
        },
        editEntity: {
            type: Object,
            required: true
        },
        gridEditEntity: {
            type: Object,
            required: false,
            default: null
        }
    },

    computed: {
        modelValue: {
            get() {
                return this.field.ref.split('.').reduce((a, b) => a[b], this.gridEditEntity || this.editEntity);
            },
            set(newVal) {
                const path = this.field.ref.split('.');
                let obj = this.gridEditEntity || this.editEntity;
                path.slice(0, -1).forEach(key => obj = obj[key] = obj[key] ?? {});
                obj[path.at(-1)] = newVal;
            }
        }
    },

    methods: {
        translatedConfig(config) {
            if (!config) {
                return null;
            }
            return Object.assign({}, config, {
                label: config.label ? this.$tc(config.label) : null,
                placeholder: config.placeholder ? this.$tc(config.placeholder) : null,
                helpText: config.helpText ? this.$tc(config.helpText) : null,
                options: config.options ? config.options.map(option => {
                    return {
                        ...option,
                        label: this.$tc(option.label),
                    }
                }) : null,
            })
        },
    }
}