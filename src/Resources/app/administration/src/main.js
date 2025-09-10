Shopware.Component.register('aggro-entity-list', () => import('./component/structure/entity-list'));
Shopware.Component.register('aggro-entity-detail', () => import('./component/structure/entity-detail'));

Shopware.Component.register('aggro-form-field-renderer', () => import('./component/form/aggro-form-field-renderer'));
Shopware.Component.register('aggro-product-single-select', () => import('./component/form/aggro-product-single-select'));
Shopware.Component.register('aggro-product-multi-select', () => import('./component/form/aggro-product-multi-select'));
Shopware.Component.extend('aggro-entity-listing', 'sw-entity-listing', () => import('./component/form/aggro-entity-listing'));