<?php

/*

AUTHENTICATING VIA THE BLOCKCHAINS
Using - http://blockstrap.com

*/

error_reporting(-1);
$php_base = dirname(dirname(__FILE__));
$template = file_get_contents($php_base.'/web/html/auth.html');
$options = json_decode(file_get_contents($php_base.'/web/json/auth.json'), true);

include_once($php_base.'/web/php/auth.php');
include_once($php_base.'/web/php/mustache.php');

$auth = new bs_auth();
$options['auth'] = $auth->user();
$options['vars'] = $auth::$vars;

$mustache = new MustachePHP();
$html = $mustache->render($template, $options);
    
echo $html;