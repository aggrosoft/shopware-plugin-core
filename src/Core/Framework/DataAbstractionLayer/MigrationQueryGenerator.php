<?php

namespace AggroPluginCore\Core\Framework\DataAbstractionLayer;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Schema\Comparator;
use Doctrine\DBAL\Schema\Table;
use Shopware\Core\Framework\DataAbstractionLayer\AttributeMappingDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\AttributeTranslationDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\DataAbstractionLayerException;
use Shopware\Core\Framework\DataAbstractionLayer\Dbal\SchemaBuilder;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;

class MigrationQueryGenerator
{
    public function __construct(
        private readonly Connection $connection,
        private readonly SchemaBuilder $schemaBuilder
    )
    {
    }

    public function generateQueries(EntityDefinition $entityDefinition): array
    {
        $tableExists = $this->connection->createSchemaManager()->tablesExist([$entityDefinition->getEntityName()]);

        if ($tableExists) {
            return $this->getAlterTableQueries($entityDefinition);
        }

        return $this->getCreateTableQueries($entityDefinition);
    }

    /**
     * @return string[]
     */
    private function getAlterTableQueries(EntityDefinition $definition): array
    {
        $originalTableSchema = $this->connection->createSchemaManager()->introspectTable($definition->getEntityName());

        // Indexes are not supported, so we remove them from both tables
        //$this->dropIndexes($originalTableSchema);

        $tableSchema = $this->schemaBuilder->buildSchemaOfDefinition($definition);

        $cascadeDelete = $definition instanceof AttributeTranslationDefinition || $definition instanceof AttributeMappingDefinition;

        //$this->dropIndexes($tableSchema);
        $this->repairForeignKeys($tableSchema, $cascadeDelete);



        return $this->getPlatform()->getAlterTableSQL((new Comparator())->compareTables($originalTableSchema, $tableSchema));
    }

    /**
     * @return string[]
     */
    private function getCreateTableQueries(EntityDefinition $definition): array
    {
        $tableSchema = $this->schemaBuilder->buildSchemaOfDefinition($definition);
        $cascadeDelete = $definition instanceof AttributeTranslationDefinition || $definition instanceof AttributeMappingDefinition;


        //$this->dropIndexes($tableSchema);
        $this->repairForeignKeys($tableSchema, $cascadeDelete);

        return $this->getPlatform()->getCreateTableSQL($tableSchema, AbstractPlatform::CREATE_INDEXES | AbstractPlatform::CREATE_FOREIGNKEYS);
    }

    private function getPlatform(): AbstractPlatform
    {
        $platform = $this->connection->getDatabasePlatform();

        if (!$platform instanceof AbstractPlatform) {
            throw DataAbstractionLayerException::databasePlatformInvalid();
        }

        return $platform;
    }

    private function dropIndexes(Table $table): void
    {
        foreach ($table->getIndexes() as $index) {
            if ($index->isPrimary()) {
                continue;
            }

            $table->dropIndex($index->getName());
        }
    }

    /**
     * For some reason the name generator will use dots which will not be quoted in the generated
     * sql, so we will just use underscores instead. Also, translation entities must cascade delete
     * when one of their foreign keys is deleted as they can not be null
     * @param Table $table
     * @return void
     */
    private function repairForeignKeys(Table $table, bool $cascadeDelete): void
    {
        foreach($table->getForeignKeys() as $foreignKey) {
            $table->removeForeignKey($foreignKey->getName());

            $options = $foreignKey->getOptions();
            if ($cascadeDelete) {
                $options['onDelete'] = 'CASCADE';
            }

            $table->addForeignKeyConstraint(
                $foreignKey->getForeignTableName(),
                $foreignKey->getLocalColumns(),
                $foreignKey->getForeignColumns(),
                $options,
                str_replace('.', '_', $foreignKey->getName())
            );
        }
    }
}