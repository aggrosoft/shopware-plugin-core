<?php

namespace AggroPluginCore\Core\Framework\DataAbstractionLayer;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\TranslationsAssociationField;

class EntityMigrator
{
    public function __construct(
        private readonly Connection $connection,
        private readonly DefinitionInstanceRegistry $registry,
        private readonly MigrationQueryGenerator $queryGenerator
    ){}

    public function migrate(array $entities): void
    {
        foreach ($entities as $entity) {
            $entityDefinition = $this->registry->getByEntityName($entity);
            $queries = $this->queryGenerator->generateQueries($entityDefinition);

            $relatedDefinitions = $this->getRelatedDefinitions($entityDefinition);

            foreach ($relatedDefinitions as $relatedDefinition) {
                $queries = array_merge($queries, $this->queryGenerator->generateQueries($relatedDefinition));
            }

            if (!empty($queries)) {
                foreach($queries as $query){
                    try {
                        $this->connection->executeStatement($query);
                    }catch (\Exception $exception){
                        throw new \Exception('Failed to execute query: ' . $query);
                    }
                }
            }
        }
    }

    private function getRelatedDefinitions(EntityDefinition $entityDefinition): array
    {
        $relatedDefinitions = [];

        foreach ($entityDefinition->getFields() as $field) {
            if ($field instanceof ManyToManyAssociationField || $field instanceof TranslationsAssociationField) {
                $relatedDefinitions[] = $field->getReferenceDefinition();
            }
        }

        return $relatedDefinitions;
    }
}