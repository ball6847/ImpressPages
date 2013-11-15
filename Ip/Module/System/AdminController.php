<?php
/**
 * @package ImpressPages

 *
 */
namespace Ip\Module\System;



class AdminController extends \Ip\Controller{


    public function index()
    {
        $site = \Ip\ServiceLocator::getSite();

        $notes = array();

        if (isset($_SESSION['modules']['administrator']['system']['notes']) && is_array($_SESSION['modules']['administrator']['system']['notes'])) {
            $notes = $_SESSION['modules']['administrator']['system']['notes'];
        }

        unset($_SESSION['modules']['administrator']['system']['notes']);


        $enableUpdate = !defined('MULTISITE_WEBSITES_DIR'); //disable update in MultiSite installation

        $data = array(
            'notes' => $notes,
            'version' => \Ip\DbSystem::getSystemVariable('version')
        );

        $content = \Ip\View::create('view/index.php', $data)->render();

        ipAddJavascript(\Ip\Config::libraryUrl('js/default.js'));
        ipAddJavascript(\Ip\Config::coreModuleUrl('Assets/assets/js/jquery.js'));
        ipAddJavascript(\Ip\Config::libraryUrl('js/default.js'));
        ipAddJavascript(\Ip\Config::coreModuleUrl('Assets/assets/js/jquery.js'));

        ipAddCss(\Ip\Config::coreModuleUrl('Admin/assets/backend/ip_admin.css'));

        if ($enableUpdate){
            ipAddJavascript(\Ip\Config::coreModuleUrl('System/public/update.js'));
        }
        ipAddJavascript(\Ip\Config::coreModuleUrl('System/public/clearCache.js'));

        return $content;
    }

    public function clearCache()
    {
        $log = \Ip\ServiceLocator::getLog();
        $parametersMod = \Ip\ServiceLocator::getParametersMod();

        if (!\Ip\Request::isPost()) {
            $this->redirect($this->indexUrl());
            return;
        }

        $log->log('administrator/system', 'Cache was cleared');
        $module = new Module;
        $cachedUrl = \Ip\DbSystem::getSystemVariable('cached_base_url'); // get system variable
        $module->clearCache($cachedUrl);
        $success = $module->updateRobotsTxt($cachedUrl);

        if (!$success) {
            $_SESSION['modules']['administrator']['system']['notes'][] = __('robots.txt file needs to be updated manually.', 'ipAdmin');
        }

        $_SESSION['modules']['administrator']['system']['notes'][] = __('Cache was cleared.', 'ipAdmin');

        $answer = array(
            'jsonrpc' => '2.0',
            'result' => array(
                'redirectUrl' => $this->indexUrl()
            ),
            'id' => null,
        );

        return new \Ip\Response\Json($answer);
    }

    protected function indexUrl()
    {
        $site = \Ip\ServiceLocator::getSite();
        return str_replace('&amp;', '&', $site->generateUrl(null, null, null, array('aa' => 'System.index')));
    }

    public function startUpdate() {
        $updateModel = new UpdateModel();

        try {
            $updateModel->prepareForUpdate();
        } catch (UpdateException $e) {
            $data = array (
                'status' => 'error',
                'error' => $e->getMessage()
            );
            return new \Ip\Response\Json($data);
        }


        $data = array (
            'status' => 'success',
            'redirectUrl' => \Ip\Config::baseUrl('update')
        );
        return new \Ip\Response\Json($data);
    }


    public function getSystemInfo()
    {
        $site = \Ip\ServiceLocator::getSite();

        $module = new Module();
        $systemInfo = $module->getSystemInfo();


        if(isset($_REQUEST['afterLogin'])) { // request after login.
            if($systemInfo == '') {
                $_SESSION['modules']['administrator']['system']['show_system_message'] = false; //don't display system alert at the top.
                return;
            } else {
                $md5 = \Ip\DbSystem::getSystemVariable('last_system_message_shown');
                if($systemInfo && (!$md5 || $md5 != md5($systemInfo)) ) { //we have a new message
                    $newMessage = false;

                    foreach(json_decode($systemInfo) as $infoValue) {
                        if($infoValue->type != 'status') {
                            $newMessage = true;
                        }
                    }

                    $_SESSION['modules']['administrator']['system']['show_system_message'] = $newMessage; //display system alert
                } else { //this message was already seen.
                    $_SESSION['modules']['administrator']['system']['show_system_message'] = false; //don't display system alert at the top.
                    return;
                }

            }
        } else { //administrator/system tab.
            \Ip\DbSystem::setSystemVariable('last_system_message_shown', md5($systemInfo));
            $_SESSION['modules']['administrator']['system']['show_system_message'] = false; //don't display system alert at the top.
        }


        $site->setOutput($systemInfo);
    }

}