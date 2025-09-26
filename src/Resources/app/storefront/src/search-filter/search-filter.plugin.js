
import FilterBasePlugin from 'src/plugin/listing/filter-base.plugin';
import deepmerge from 'deepmerge';

export default class SearchFilterPlugin extends FilterBasePlugin {

    static options = deepmerge(FilterBasePlugin.options, {

    });

    init() {
        this.parameterName = this.el.name;
        this.options[this.parameterName] = this.el.value;
        this._registerEvents();
    }

    /**
     * @private
     */
    _registerEvents() {
        this.el.addEventListener('input', this.onChangeSearch.bind(this));
    }

    onChangeSearch(event) {
        // debounce the input to avoid too many requests
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.options[this.parameterName] = event.target.value;
            this.listing.changeListing();
        }, 300);
    }

    /**
     * @public
     */
    reset() {
    }

    /**
     * @public
     */
    resetAll() {
    }

    /**
     * @return {Object}
     * @public
     */
    getValues() {
        if (this.options[this.parameterName] === null) {
            return {};
        }

        const result = {};
        result[this.parameterName] = this.options[this.parameterName];
        return result;
    }

    afterContentChange() {
        this.listing.deregisterFilter(this);
    }

    /**
     * @return {Array}
     * @public
     */
    getLabels() {
        return [];
    }
}