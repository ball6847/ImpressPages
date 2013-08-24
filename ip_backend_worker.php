<?php
/**
 *
 * ImpressPages CMS admin zone worker file
 *
 * This file handles AJAX and POST (GET) requests.
 *
 * @package ImpressPages
 *
 *
 */

if (!defined('CMS')) {
    define('CMS', true); // make sure other files are accessed through this file.
}
if (!defined('BACKEND')) {
    define('BACKEND', true); // make sure other files are accessed through this file.
}
if (!defined('WORKER')) {
    define('WORKER', true); //worker don't show errors. Even if it is set to show them in config.php
}

error_reporting(E_ALL|E_STRICT);
ini_set('display_errors', '1');

if(is_file(__DIR__.'/ip_config.php')) {
    require (__DIR__.'/ip_config.php');
} else {
    require (__DIR__.'/../ip_config.php');
}

require (BASE_DIR.INCLUDE_DIR.'parameters.php');
require (BASE_DIR.INCLUDE_DIR.'db.php');

require (BASE_DIR.MODULE_DIR.'administrator/log/module.php');
require (BASE_DIR.INCLUDE_DIR.'error_handler.php');
require (BASE_DIR.INCLUDE_DIR.'autoloader.php');
require (BASE_DIR.BACKEND_DIR.'cms.php');
require (BASE_DIR.BACKEND_DIR.'db.php');

require (FRONTEND_DIR.'site.php');

$dispatcher = new \Ip\Dispatcher();

$parametersMod = new parametersMod();



if(\Db::connect()){
    $log = new \Modules\administrator\log\Module();

    try {
        $site = new \Site(); /*to generate links to site and get other data about frontend*/
        $site->init();
        $dispatcher->notify(new \Ip\Event($site, 'site.afterInit', null));

        $cms = new \Backend\Cms();
        $cms->worker();
    } catch (\Exception $e) {
        $log->log('System', 'Fatal error', $e->getMessage().' in '.$e->getFile().':'.$e->getLine());
        throw $e;
    }



    \Db::disconnect();
}else   trigger_error('Database access');




?>
