const PluginManager = window.PluginManager;

PluginManager.register('AggroPluginCoreSearchFilterPlugin', () => import('./search-filter/search-filter.plugin'), '[data-agpc-search-filter-plugin]');
