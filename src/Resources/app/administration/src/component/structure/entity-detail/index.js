import template from './entity-detail.html.twig';
import './entity-detail.scss';

const {
    Mixin,
    State,
    Data: { Criteria },
} = Shopware;

const { mapPropertyErrors } = Shopware.Component.getComponentHelper();

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
export default {
    template,

    inject: [
        'repositoryFactory',
        'acl',
    ],

    mixins: [
        Mixin.getByName('placeholder'),
        Mixin.getByName('notification'),
        Mixin.getByName('discard-detail-page-changes')('entity'),
    ],

    shortcuts: {
        'SYSTEMKEY+S': 'onSave',
        ESCAPE: 'onCancel',
    },

    props: {
        entityId: {
            type: String,
            required: false,
            default: null,
        },
        entity: String,
        labels: Object,
        links: Object,
        forms: Object
    },

    data() {
        return {
            editEntity: null,
            customFieldSets: [],
            isLoading: false,
            isSaveSuccessful: false,
            gridSelection: {},
            gridSortDirection: {},
            gridSortBy: {},
            gridSearchTerm: {},
            gridLoading: {},
            gridEditEntity: null,
            editedGrid: null,
            gridRefs: {},
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(this.identifier),
        };
    },

    computed: {
        isSystemLanguage() {
            return State.get('context').api.systemLanguageId === this.currentLanguage;
        },

        currentLanguage() {
            return State.get('context').api.languageId;
        },
        identifier() {
            return this.placeholder(this.editEntity, 'name');
        },

        entityIsLoading() {
            return this.isLoading || this.editEntity == null;
        },

        entityRepository() {
            return this.repositoryFactory.create(this.entity);
        },

        entityCriteria() {
            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('id', this.entityId));
            for(const association of this.associationFormFields){
                criteria.addAssociation(association);
            }
            return criteria;
        },

        associationFormFields() {
            const definition = Shopware.EntityDefinition.get(this.entity);
            const associations = [];
            for(const form of this.forms) {
                for(const card of form.cards) {
                    if(card.grid) {
                        associations.push(card.grid.ref);
                    }else{
                        for(const field of card.fields){
                            const prop = definition.properties[field.ref];
                            if (prop && prop.type === 'association' && prop.relation === 'many_to_many'){
                                associations.push(field.ref);
                                if (field.associations) {
                                    for(const fieldAssociation of field.associations){
                                        associations.push(field.ref + '.' + fieldAssociation);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return associations;
        },

        mediaRepository() {
            return this.repositoryFactory.create('media');
        },

        customFieldSetRepository() {
            return this.repositoryFactory.create('custom_field_set');
        },

        customFieldSetCriteria() {
            const criteria = new Criteria(1, null);
            criteria.addFilter(Criteria.equals('relations.entityName', this.entity));

            return criteria;
        },

        mediaUploadTag() {
            return `aggro-entity-detail--${this.editEntity.id}`;
        },

        tooltipSave() {
            if (this.acl.can(this.entity+'.editor')) {
                const systemKey = this.$device.getSystemKey();

                return {
                    message: `${systemKey} + S`,
                    appearance: 'light',
                };
            }

            return {
                showDelay: 300,
                message: this.$tc('sw-privileges.tooltip.warning'),
                disabled: this.acl.can(this.entity+'.editor'),
                showOnDisabledElements: true,
            };
        },

        tooltipCancel() {
            return {
                message: 'ESC',
                appearance: 'light',
            };
        },
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        }
    },

    watch: {
        entityId() {
            this.createdComponent();
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            if (this.entityId) {
                this.loadEntityData();
                return;
            }

            Shopware.State.commit('context/resetLanguageToDefault');
            this.editEntity = this.entityRepository.create();
        },

        async loadEntityData() {
            this.isLoading = true;

            const [
                entityResponse,
                customFieldResponse,
            ] = await Promise.allSettled([
                this.entityRepository.search(this.entityCriteria, { ...Shopware.Context.api, inheritance: true }),
                this.customFieldSetRepository.search(this.customFieldSetCriteria),
            ]);

            if (entityResponse.status === 'fulfilled') {
                this.editEntity = entityResponse.value.first();
            }

            if (customFieldResponse.status === 'fulfilled') {
                this.customFieldSets = customFieldResponse.value;
            }

            if (entityResponse.status === 'rejected' || customFieldResponse.status === 'rejected') {
                this.createNotificationError({
                    message: this.$tc('global.notification.notificationLoadingDataErrorMessage'),
                });
            }

            this.isLoading = false;
        },

        abortOnLanguageChange() {
            return this.entityRepository.hasChanges(this.editEntity);
        },

        saveOnLanguageChange() {
            return this.onSave();
        },

        onChangeLanguage() {
            this.loadEntityData();
        },

        setMediaItem({ targetId }) {
            this.editEntity.mediaId = targetId;
        },

        setMediaFromSidebar(media) {
            this.editEntity.mediaId = media.id;
        },

        onUnlinkLogo() {
            this.editEntity.mediaId = null;
        },

        openMediaSidebar() {
            this.$refs.mediaSidebarItem.openContent();
        },

        onDropMedia(dragData) {
            this.setMediaItem({ targetId: dragData.id });
        },

        onSave() {
            if (!this.acl.can(this.entity+'.editor')) {
                return;
            }

            this.isLoading = true;

            this.entityRepository
                .save(this.editEntity)
                .then(() => {
                    this.isLoading = false;
                    this.isSaveSuccessful = true;
                    if (this.entityId === null) {
                        this.$router.push({
                            name: this.links.detail,
                            params: { id: this.editEntity.id },
                        });
                        return;
                    }

                    this.loadEntityData();
                })
                .catch((exception) => {
                    this.isLoading = false;
                    this.createNotificationError({
                        message: this.$tc('global.notification.notificationSaveErrorMessageRequiredFieldsInvalid'),
                    });
                    throw exception;
                });
        },

        onCancel() {
            this.$router.push({ name: this.links.list });
        },

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

        gridPropertyDefinition(grid) {
            const definition = Shopware.EntityDefinition.get(this.entity);
            return definition.properties[grid.ref];
        },

        gridEntity(grid) {
            const prop = this.gridPropertyDefinition(grid);
            return prop?.entity;
        },

        gridRepository(grid) {
            return this.repositoryFactory.create(this.gridEntity(grid));
        },

        getGridSortBy(grid) {
            return this.gridSortBy[grid.ref] || 'name';
        },

        getGridSortDirection(grid) {
            return this.gridSortDirection[grid.ref] || 'ASC';
        },

        onGridSearch(grid) {
            this.editEntity[grid.ref].criteria.setTerm(this.gridSearchTerm[grid.ref]);
            this.refreshGrid(grid);
        },

        onGridSelectionChanged(grid, selection) {
            this.gridSelection[grid.ref] = selection && Object.values(selection).length ? selection : null;
        },

        onAddGridEntity(grid){
            if (!this.isSystemLanguage) {
                return false;
            }


            this.gridEditEntity = this.gridRepository(grid).create();

            const prop = this.gridPropertyDefinition(grid);
            this.gridEditEntity[prop.referenceField] = this.editEntity.id;

            this.editedGrid = grid;

            return true;
        },

        async onDeleteGridEntity(grid){

            const selection = this.gridSelection[grid.ref];
            const entities = Object.values(selection);

            if (this.editEntity.isNew()) {
                for(const entity of entities){
                    this.editEntity[grid.ref].remove(entity.id);
                }
            }else{
                for(const entity of entities){
                    await this.gridRepository(grid).delete(entity.id);
                }
            }

            this.refreshGrid(grid);
        },

        async onDeleteSingleGridEntity(grid, id){
            await this.gridRepository(grid).delete(id);
            this.refreshGrid(grid);
        },

        onEditGridEntity(grid,entity){
            this.gridEditEntity = entity;
            this.editedGrid = grid;
        },

        onCancelEditGridEntity(){
            this.gridEditEntity = this.editedGrid = null;
        },

        onSaveGridEntity(){
            const property = this.editedGrid.ref;
            if (this.editEntity.isNew()) {
                console.log('local new', this.gridEditEntity)
                if (!this.editEntity[property].has(this.gridEditEntity.id)) {
                    this.editEntity[property].add(this.gridEditEntity);
                }
                this.gridEditEntity = this.editedGrid = null;
            }else{
                this.gridRepository(this.editedGrid).save(this.gridEditEntity).then(() => {
                    this.refreshGrid(this.editedGrid);
                    this.gridEditEntity = this.editedGrid = null;
                });
            }

        },

        refreshGrid(grid) {

            this.gridLoading[grid.ref] = true;
            this.gridRefs[grid.ref].resetSelection();
            this.gridRefs[grid.ref].load().then(() => {
                this.gridLoading[grid.ref] = false;
            });
            /*
            //this.isLoading = true;

            this.$refs[grid.ref].load().then(() => {
                this.isLoading = false;
            });
             */
        }
    },
};