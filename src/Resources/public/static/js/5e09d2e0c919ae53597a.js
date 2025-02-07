"use strict";(window["webpackJsonpPluginaggro-plugin-core-plugin"]=window["webpackJsonpPluginaggro-plugin-core-plugin"]||[]).push([[947],{947:function(t,e,n){n.r(e),n.d(e,{default:function(){return l}});let{Mixin:i}=Shopware,{Criteria:a}=Shopware.Data;Shopware.Utils;var l={template:'{% block aggro_entity_list %}\n<sw-page class="aggro-entity-list">\n\n    {% block aggro_entity_list_search_bar %}\n        <template #search-bar>\n            <sw-search-bar\n                    :initial-search-type="entity"\n                    :initial-search="term"\n                    @search="onSearch"\n            />\n        </template>\n    {% endblock %}\n\n    {% block aggro_entity_list_smart_bar_header %}\n        <template #smart-bar-header>\n            {% block aggro_entity_list_smart_bar_header_title %}\n                <h2>\n                    {% block aggro_entity_list_smart_bar_header_title_text %}\n                        {{ $tc(labels.header) }}\n                    {% endblock %}\n\n                    {% block aggro_entity_list_smart_bar_header_amount %}\n                        <span\n                                v-if="!isLoading"\n                                class="sw-page__smart-bar-amount"\n                        >\n                ({{ total }})\n            </span>\n                    {% endblock %}\n                </h2>\n            {% endblock %}\n        </template>\n    {% endblock %}\n\n    {% block aggro_entity_list_smart_bar_actions %}\n        <template #smart-bar-actions>\n            {% block aggro_entity_list_smart_bar_actions_add %}\n                <sw-button\n                        v-tooltip="{\n                message: $tc(\'sw-privileges.tooltip.warning\'),\n                disabled: acl.can(entity+\'.creator\'),\n                showOnDisabledElements: true\n            }"\n                        class="aggro-entity-list__button-create"\n                        variant="primary"\n                        :disabled="!acl.can(entity+\'.creator\') || undefined"\n                        :router-link="{ name: links.create }"\n                >\n                    {{ $tc(labels.add) }}\n                </sw-button>\n            {% endblock %}\n        </template>\n    {% endblock %}\n\n    <template #language-switch>\n        <sw-language-switch @on-change="onChangeLanguage" />\n    </template>\n\n    <template #content>\n        {% block aggro_entity_list_content %}\n        <div class="aggro-entity-list__content">\n            {% block aggro_entity_list_grid %}\n            <sw-entity-listing\n                    v-if="isLoading || (entities && entitySearchable)"\n                    ref="aggroEntityGrid"\n                    class="aggro-entity-list-grid"\n                    identifier="aggro-entity-list"\n                    :items="entities"\n                    :columns="entityColumns"\n                    :repository="entityRepository"\n                    :sort-by="currentSortBy"\n                    :sort-direction="sortDirection"\n                    :detail-route="links.detail"\n                    :show-selection="acl.can(entity+\'.deleter\')"\n                    :allow-inline-edit="acl.can(entity+\'.editor\') || undefined"\n                    :allow-bulk-edit="acl.can(entity+\'.editor\')"\n                    :is-loading="isLoading"\n                    :disable-data-fetching="true"\n                    @selection-change="updateSelection"\n                    @inline-edit-save="onInlineEditSave"\n                    @page-change="onPageChange"\n                    @column-sort="onSortColumn"\n                    @bulk-edit-modal-open="onBulkEditModalOpen"\n            >\n\n\n                {% block aggro_entity_list_grid_columns_actions %}\n                    <template #actions="{ item }">\n                        {% block aggro_entity_list_grid_columns_actions_edit %}\n                            <sw-context-menu-item\n                                    class="aggro-entity-list__edit-action"\n                                    :disabled="!acl.can(entity+\'.editor\') || undefined"\n                                    :router-link="{ name: links.detail, params: { id: item.id }, query: { edit: true } }"\n                            >\n                                {{ $tc(\'aggro.entity-list.contextMenuEdit\') }}\n                            </sw-context-menu-item>\n                        {% endblock %}\n\n                        {% block aggro_entity_list_grid_columns_actions_delete %}\n                            <sw-context-menu-item\n                                    class="aggro-entity-list__delete-action"\n                                    variant="danger"\n                                    :disabled="!acl.can(entity+\'.deleter\') || undefined"\n                                    @click="onDelete(item.id)"\n                            >\n                                {{ $tc(\'aggro.entity-list.contextMenuDelete\') }}\n                            </sw-context-menu-item>\n                        {% endblock %}\n                    </template>\n                {% endblock %}\n\n                {% block aggro_entity_list_grid_action_modals %}\n                <template #action-modals="{ item }">\n\n                    {% block aggro_entity_list_delete_modal %}\n                    <sw-modal\n                            v-if="showDeleteModal === item.id"\n                            :title="$tc(\'global.default.warning\')"\n                            variant="small"\n                            @modal-close="onCloseDeleteModal"\n                    >\n\n                        {% block aggro_entity_list_delete_modal_confirm_delete_text %}\n                        <p class="aggro-entity-list__confirm-delete-text">\n                        {{ $tc(\'aggro.entity-list.textDeleteConfirm\') }}\n                    </p>\n                    {% endblock %}\n\n                    {% block aggro_entity_list_delete_modal_footer %}\n                        <template #modal-footer>\n\n                            {% block aggro_entity_list_delete_modal_cancel %}\n                            <sw-button\n                                    size="small"\n                                    @click="onCloseDeleteModal"\n                            >\n                                {{ $tc(\'global.default.cancel\') }}\n                                </sw-button>\n                                {% endblock %}\n\n                                {% block aggro_entity_list_delete_modal_confirm %}\n                                <sw-button\n                                variant="danger"\n                                size="small"\n                                @click="onConfirmDelete(item.id)"\n                                >\n                                {{ $tc(\'aggro.entity-list.buttonDelete\') }}\n                            </sw-button>\n                            {% endblock %}\n                        </template>\n                        {% endblock %}\n                    </sw-modal>\n                    {% endblock %}\n                </template>\n                {% endblock %}\n\n                <template #pagination>\n                    {% block sw_order_list_grid_pagination %}\n                        <sw-pagination\n                                :page="page"\n                                :limit="limit"\n                                :total="total"\n                                :total-visible="7"\n                                @page-change="onPageChange"\n                        />\n                    {% endblock %}\n                </template>\n\n                {% block aggro_entity_list_bulk_edit_modal %}\n                    <template\n                            #bulk-edit-modal="{ selection }"\n                    >\n                        <sw-bulk-edit-modal\n                                v-if="showBulkEditModal"\n                                ref="bulkEditModal"\n                                class="aggro-entity-list-bulk-edit-modal"\n                                :selection="selection"\n                                :bulk-grid-edit-columns="entityColumns"\n                                @edit-items="onBulkEditItems"\n                                @modal-close="onBulkEditModalClose"\n                        >\n\n                        </sw-bulk-edit-modal>\n                    </template>\n                {% endblock %}\n            </sw-entity-listing>\n            {% endblock %}\n\n            {% block aggro_entity_list_empty_state %}\n                <template v-if="!isLoading && !total">\n                    <sw-empty-state\n                            v-if="filterCriteria.length || isValidTerm(term)"\n                            :title="$tc(\'sw-empty-state.messageNoResultTitle\')"\n                    >\n                        <template #icon>\n                            <img\n                                    :src="assetFilter(\'/administration/static/img/empty-states/customer-empty-state.svg\')"\n                                    :alt="$tc(\'sw-empty-state.messageNoResultTitle\')"\n                            >\n                        </template>\n\n                        <template #default>\n                            {{ $tc(\'sw-empty-state.messageNoResultSublineBefore\') }}\n                            <router-link\n                                    class="sw-empty-state__description-link"\n                                    :to="{ name: \'sw.profile.index.searchPreferences\' }"\n                            >\n                                {{ $tc(\'sw-empty-state.messageNoResultSublineLink\') }}\n                            </router-link>\n                            {{ $tc(\'sw-empty-state.messageNoResultSublineAfter\') }}\n                        </template>\n                    </sw-empty-state>\n                    <sw-empty-state\n                            v-else\n                            :title="$tc(\'aggro.entity-list.messageEmpty\')"\n                    >\n                        <template #icon>\n                            <img\n                                    :src="assetFilter(\'/administration/static/img/empty-states/customer-empty-state.svg\')"\n                                    :alt="$tc(\'aggro.entity-list.messageEmpty\')"\n                            >\n                        </template>\n                    </sw-empty-state>\n                </template>\n            {% endblock %}\n        </div>\n        {% endblock %}\n    </template>\n\n    {% block aggro_entity_list_sidebar %}\n        <template #sidebar>\n            <sw-sidebar class="aggro-entity-list__sidebar">\n                {% block aggro_entity_list_sidebar_refresh %}\n                    <sw-sidebar-item\n                            icon="regular-undo"\n                            :title="$tc(\'aggro.entity-list.titleSidebarItemRefresh\')"\n                            @click="onRefresh"\n                    />\n                {% endblock %}\n\n                {% block aggro_entity_list_sidebar_filter %}\n                    <sw-sidebar-filter-panel\n                            :entity="entity"\n                            :store-key="storeKey"\n                            :filters="listFilters"\n                            :defaults="defaultFilters"\n                            :active-filter-number="activeFilterNumber"\n                            @criteria-changed="updateCriteria"\n                    />\n                {% endblock %}\n            </sw-sidebar>\n        </template>\n    {% endblock %}\n</sw-page>\n{% endblock %}',props:{entity:String,labels:Object,links:Object,columns:Array},inject:["repositoryFactory","acl","filterFactory","feature"],mixins:[i.getByName("notification"),i.getByName("salutation"),i.getByName("listing")],data(){return{entities:null,sortBy:"",naturalSorting:!0,sortDirection:"DESC",isLoading:!1,showDeleteModal:!1,filterLoading:!1,filterCriteria:[],defaultFilters:[],activeFilterNumber:0,searchConfigEntity:"customer",showBulkEditModal:!1}},metaInfo(){return{title:this.$createTitle()}},computed:{entityRepository(){return this.repositoryFactory.create(this.entity)},entityColumns(){return this.getEntityColumns()},storeKey(){return"aggro-plugin-core.filter."+this.entity},defaultCriteria(){let t=new a(this.page,this.limit);return t.setTerm(this.term),this.sortBy.split(",").filter(t=>t).forEach(e=>{t.addSorting(a.sort(e,this.sortDirection,this.naturalSorting))}),this.filterCriteria.forEach(e=>{t.addFilter(e)}),t},filterSelectCriteria(){return new a(1,1)},listFilterOptions(){return{}},listFilters(){return this.filterFactory.create(this.entity,this.listFilterOptions)},assetFilter(){return Shopware.Filter.getByName("asset")}},watch:{defaultCriteria:{handler(){this.getList()},deep:!0}},created(){this.createdComponent()},methods:{createdComponent(){return this.loadFilterValues()},onInlineEditSave(t,e){t.then(()=>{this.createNotificationSuccess({message:this.$tc("aggro-plugin-core.detail.messageSaveSuccess",0,{name:"foobar"})})}).catch(()=>{this.getList(),this.createNotificationError({message:this.$tc("aggro-plugin-core.detail.messageSaveError")})})},async getList(){this.isLoading=!0;let t=await Shopware.Service("filterService").mergeWithStoredFilters(this.storeKey,this.defaultCriteria),e=await this.addQueryScores(this.term,t);if(this.activeFilterNumber=t.filters?.length||0,!this.entitySearchable){this.isLoading=!1,this.total=0;return}this.freshSearchTerm&&e.resetSorting();try{let t=await this.entityRepository.search(e);this.total=t.total,this.entities=t,this.isLoading=!1,this.selection={}}catch{this.isLoading=!1}},onDelete(t){this.showDeleteModal=t},onCloseDeleteModal(){this.showDeleteModal=!1},onConfirmDelete(t){return this.showDeleteModal=!1,this.entityRepository.delete(t).then(()=>{this.getList()})},async onChangeLanguage(){await this.createdComponent(),await this.getList()},getEntityColumns(){return this.columns},loadFilterValues(){return this.filterLoading=!0,this.entityRepository.search(this.filterSelectCriteria).then(({aggregations:t})=>(this.filterLoading=!1,t)).catch(()=>{this.filterLoading=!1})},updateCriteria(t){this.page=1,this.filterCriteria=t},async onBulkEditItems(){await this.$nextTick(),this.$router.push({name:"aggro.bulk.edit.entity"})},onBulkEditModalOpen(){this.showBulkEditModal=!0},onBulkEditModalClose(){this.showBulkEditModal=!1}}}}}]);