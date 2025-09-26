<?php

namespace AggroPluginCore\Core\Content\SalesChannel\Listing\Processor;

use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

abstract class AbstractListingProcessor
{
    abstract public function prepare(Request $request, Criteria $criteria, SalesChannelContext $context): void;

    public function process(Request $request, EntitySearchResult $result, SalesChannelContext $context): void
    {
    }
}