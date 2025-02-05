import template from './entity-detail.html.twig';

const {
    Mixin,
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
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(this.identifier),
        };
    },

    computed: {
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
                    for(const field of card.fields){
                        const prop = definition.properties[field.ref];
                        if (prop && prop.type === 'association' && prop.relation === 'many_to_many'){
                            associations.push(field.ref);
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
                this.entityRepository.search(this.entityCriteria),
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
    },
};