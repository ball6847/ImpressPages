<?php
/**
 * @package ImpressPages

 *
 */
namespace Ip\Module\System;


class System{

    public function __construct() {
    }

    public function init(){
        global $site;

        if ($site->managementState()) {
            ipAddJavascript(\Ip\Config::coreModuleUrl('System/public/system.js'), 0);
        }

        $dispatcher = \Ip\ServiceLocator::getDispatcher();
        $dispatcher->bind(\Ip\Event\UrlChanged::URL_CHANGED, __NAMESPACE__ .'\System::urlChanged');
    }
    
    public static function urlChanged (\Ip\Event\UrlChanged $event)
    {
        \Ip\DbSystem::replaceUrls($event->getOldUrl(), $event->getNewUrl());
    }
    




}

