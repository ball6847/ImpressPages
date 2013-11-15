<?php

/**
 * @package ImpressPages
 *
 *
 */

namespace Ip\Backend;

class Template {

    public static function headerLogin() {
        $answer = '';
        $answer .= '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>ImpressPages</title>
                <link rel="stylesheet" href="' . \Ip\Config::coreModuleUrl('Admin/assets/backend/login/login.css') . '">
                <link rel="shortcut icon" href="' . \Ip\Config::baseUrl('favicon.ico') . '">
            </head>
            <body>
        ';
        return $answer;
    }

    public static function loginForm($error = null) {
        global $parametersMod;
        global $cms;

        if ($error) {
            $error = htmlspecialchars($error);
        }

        $answer = '';
        $answer .= '
            <a href="http://www.impresspages.org/" class="logo" target="_blank"><img src="' . \Ip\Config::coreModuleUrl('Admin/assets/backend/login/logo.png') . '"></a>
            <div class="verticalAlign"></div>
            <div class="login">
                <div class="loginTitle">
                    <h1>Login</h1>
                </div>
                <form action="' . $cms->generateActionUrl('login') . '" method="post">
                    <span class="loginError">' . $error . '</span>
                    <input type="hidden" name="action" value="login">
                    <label>
                        <span>' . htmlspecialchars(__('Name', 'ipAdmin')) . '</span>
                        <input class="loginInput" id="login_name" name="f_name" type="text">
                    </label>
                    <label>
                        <span>' . htmlspecialchars(__('Password', 'ipAdmin')) . '</span>
                        <input class="loginInput" type="password" name="f_pass">
                    </label>
                    <input class="loginSubmit" type="submit" value="' . htmlspecialchars(__('Login', 'ipAdmin')) . '">
                </form>
            </div>
            <div class="loginFooter">Copyright 2009-' . date("Y") . ' by <a href="http://www.impresspages.org/">ImpressPages UAB</a></div>
            <script>
            //<![CDATA[
              document.getElementById(\'login_name\').focus();
            //]]>
            </script>
        ';
        return $answer;
    }

    function footer() {
        $answer = '
            </body>
            </html>
        ';
        return $answer;
    }
}