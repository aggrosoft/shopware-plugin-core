<?php

namespace AggroPluginCore\Core\Framework\CustomField;

use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;

class CustomFieldUpdater
{
    public function __construct(
        private readonly EntityRepository $customFieldSetRepository,
        private readonly EntityRepository $customFieldRepository,
        private readonly EntityRepository $customFieldSetRelationRepository
    )
    {
    }

    public function updateCustomFieldSets(array $customFieldSets, InstallContext $context): void
    {
        $customFieldSets = $this->addPluginToConfig($customFieldSets, $context);
        $this->deleteOrphanCustomFieldSets($customFieldSets, $context);
        if (!empty($customFieldSets)) {
            $this->customFieldSetRepository->upsert($customFieldSets, $context->getContext());
        }
    }

    private function deleteOrphanCustomFieldSets(array $customFieldSets, InstallContext $context): void
    {
        $pluginName = $context->getPlugin()->getName();
        $contextObj = $context->getContext();

        $currentSetNames = array_column($customFieldSets, 'name');
        $currentFieldNames = $this->collectCurrentFieldNames($customFieldSets);
        $currentRelations = $this->collectCurrentRelations($customFieldSets, $pluginName);

        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('config.aggro_plugin_name', $pluginName));
        $criteria->addAssociation('relations');
        $criteria->addAssociation('customFields');
        $existingSets = $this->customFieldSetRepository->search($criteria, $contextObj);

        $deleteSetIds = $this->getDeleteSetIds($existingSets, $currentSetNames, $pluginName, $currentFieldNames);
        $deleteRelationIds = $this->getDeleteRelationIds($existingSets, $currentRelations);
        $deleteFieldIds = $this->getDeleteFieldIds($existingSets, $currentFieldNames, $pluginName);

        if (!empty($deleteRelationIds)) {
            $this->customFieldSetRelationRepository->delete($deleteRelationIds, $contextObj);
        }
        if (!empty($deleteSetIds)) {
            $this->customFieldSetRepository->delete($deleteSetIds, $contextObj);
        }
        if (!empty($deleteFieldIds)) {
            $this->customFieldRepository->delete($deleteFieldIds, $contextObj);
        }
    }

    private function ensureSetId(array $customFieldSet, string $pluginName): string
    {
        if (!empty($customFieldSet['id'])) {
            return $customFieldSet['id'];
        }
        return !empty($customFieldSet['name']) ? md5($pluginName . $customFieldSet['name']) : '';
    }

    private function ensureFieldId(array $customField, array $customFieldSet, string $pluginName): string
    {
        if (!empty($customField['id'])) {
            return $customField['id'];
        }
        return (!empty($customField['name']) && !empty($customFieldSet['name']))
            ? md5($pluginName . $customFieldSet['name'] . $customField['name'])
            : '';
    }

    private function ensureRelationId(array $relation, array $customFieldSet, string $pluginName): string
    {
        if (!empty($relation['id'])) {
            return $relation['id'];
        }
        return (!empty($customFieldSet['name']) && !empty($relation['entityName']))
            ? md5($pluginName . $customFieldSet['name'] . $relation['entityName'])
            : '';
    }

    private function addPluginToConfig(array $customFieldSets, InstallContext $context): array
    {
        $pluginName = $context->getPlugin()->getName();
        foreach ($customFieldSets as &$customFieldSet) {
            $customFieldSet['id'] = $this->ensureSetId($customFieldSet, $pluginName);
            $customFieldSet['config']['aggro_plugin_name'] = $pluginName;
            $customFieldSet['customFields'] = $this->addPluginToCustomFields($customFieldSet, $pluginName);
            $customFieldSet['relations'] = $this->addPluginToRelations($customFieldSet, $pluginName);
        }
        return $customFieldSets;
    }

    private function addPluginToCustomFields(array $customFieldSet, string $pluginName): array
    {
        $fields = $customFieldSet['customFields'] ?? [];
        foreach ($fields as &$customField) {
            $customField['id'] = $this->ensureFieldId($customField, $customFieldSet, $pluginName);
            $customField['config']['aggro_plugin_name'] = $pluginName;
        }
        return $fields;
    }

    private function addPluginToRelations(array $customFieldSet, string $pluginName): array
    {
        $relations = $customFieldSet['relations'] ?? [];
        foreach ($relations as &$relation) {
            $relation['id'] = $this->ensureRelationId($relation, $customFieldSet, $pluginName);
        }
        return $relations;
    }

    private function collectCurrentFieldNames(array $customFieldSets): array
    {
        $names = [];
        foreach ($customFieldSets as $set) {
            if (!empty($set['customFields'])) {
                $names = array_merge($names, array_column($set['customFields'], 'name'));
            }
        }
        return $names;
    }

    private function collectCurrentRelations(array $customFieldSets, string $pluginName): array
    {
        $relations = [];
        foreach ($customFieldSets as $set) {
            if (!empty($set['relations'])) {
                $setId = !empty($set['id']) ? $set['id'] : md5($pluginName . $set['name']);
                foreach ($set['relations'] as $relation) {
                    $relations[$setId . ':' . $relation['entityName']] = true;
                }
            }
        }
        return $relations;
    }

    private function getDeleteSetIds($existingSets, array $currentSetNames, string $pluginName, array $currentFieldNames): array
    {
        $deleteSetIds = [];
        foreach ($existingSets as $set) {
            $pluginFields = [];
            foreach ($set->get('customFields') as $field) {
                $fieldConfig = $field->get('config');
                if (isset($fieldConfig['aggro_plugin_name']) && $fieldConfig['aggro_plugin_name'] === $pluginName) {
                    $pluginFields[] = $field;
                }
            }
            if (!in_array($set->get('name'), $currentSetNames, true) && count($pluginFields) === 0) {
                $deleteSetIds[] = ['id' => $set->getId()];
            }
        }
        return $deleteSetIds;
    }

    private function getDeleteRelationIds($existingSets, array $currentRelations): array
    {
        $deleteRelationIds = [];
        foreach ($existingSets as $set) {
            $setId = $set->getId();
            foreach ($set->get('relations') as $relation) {
                $relationKey = $setId . ':' . $relation->getEntityName();
                if (!isset($currentRelations[$relationKey])) {
                    $deleteRelationIds[] = ['id' => $relation->getId()];
                }
            }
        }
        return $deleteRelationIds;
    }

    private function getDeleteFieldIds($existingSets, array $currentFieldNames, string $pluginName): array
    {
        $deleteFieldIds = [];
        foreach ($existingSets as $set) {
            foreach ($set->get('customFields') as $field) {
                $fieldConfig = $field->get('config');
                if (
                    isset($fieldConfig['aggro_plugin_name']) &&
                    $fieldConfig['aggro_plugin_name'] === $pluginName &&
                    !in_array($field->get('name'), $currentFieldNames, true)
                ) {
                    $deleteFieldIds[] = ['id' => $field->getId()];
                }
            }
        }
        return $deleteFieldIds;
    }

}
