<?php

namespace AggroPluginCore\Core\Framework\DataAbstractionLayer;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;

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

            if ($this->registry->has($entity . '_translation')){
                $translationDefinition = $this->registry->getByEntityName($entity . '_translation');
                $queries = array_merge($queries, $this->queryGenerator->generateQueries($translationDefinition));
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
}