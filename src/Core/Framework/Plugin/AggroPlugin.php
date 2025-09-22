<?php

namespace AggroPluginCore\Core\Framework\Plugin;

use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;

class AggroPlugin extends Plugin
{
    protected function getAutoMigrationEntities() :array{
        return [];
    }

    protected function getCustomFieldSets(): array
    {
        return [];
    }

    public function activate(ActivateContext $activateContext): void
    {
        $this->runEntityMigrations();
        $this->updateCustomFieldSets($activateContext);
    }

    public function update(UpdateContext $updateContext): void
    {
        $this->runEntityMigrations();
        $this->updateCustomFieldSets($updateContext);
    }

    private function runEntityMigrations(): void
    {
        $migrator = $this->container->get('AggroPluginCore\Core\Framework\DataAbstractionLayer\EntityMigrator');
        $migrator->migrate($this->getAutoMigrationEntities());
    }

    private function updateCustomFieldSets(InstallContext $context): void
    {
        $updater = $this->container->get('AggroPluginCore\Core\Framework\CustomField\CustomFieldUpdater');
        $updater->updateCustomFieldSets($this->getCustomFieldSets(), $context);
    }
}