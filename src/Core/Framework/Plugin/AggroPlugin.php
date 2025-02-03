<?php

namespace AggroPluginCore\Core\Framework\Plugin;

use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;

class AggroPlugin extends Plugin
{
    protected function getAutoMigrationEntities() :array{
        return [];
    }

    public function activate(ActivateContext $activateContext): void
    {
        $this->runEntityMigrations();
    }

    public function update(UpdateContext $updateContext): void
    {
        $this->runEntityMigrations();
    }

    private function runEntityMigrations(): void
    {
        $migrator = $this->container->get('AggroPluginCore\Core\Framework\DataAbstractionLayer\EntityMigrator');
        $migrator->migrate($this->getAutoMigrationEntities());
    }
}