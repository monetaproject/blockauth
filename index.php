<?php

/*

AUTHENTICATING VIA THE BLOCKCHAINS
Using - http://blockstrap.com

*/

error_reporting(-1);
$php_base = dirname(__FILE__);
$template = file_get_contents($php_base.'/html/index.html');
$options = json_decode(file_get_contents($php_base.'/json/index.json'), true);

include_once($php_base.'/php/blockauth.php');
include_once($php_base.'/php/mustache.php');
include_once($php_base.'/php/parsedown.php');

$auth = new blockauth();
$options['auth'] = $auth->user();
$options['vars'] = $auth::$vars;

$mustache = new MustachePHP();
$html = $mustache->render($template, $options);
    
echo $html;