import template from './aggro-product-single-select.html.twig'

export default {
    template,
    computed: {
        criteriaWithVariation() {
            const criteria = this.criteria || new Shopware.Data.Criteria(1, this.resultLimit || 25);
            criteria.addAssociation('options.group');
            return criteria;
        }
    }
}