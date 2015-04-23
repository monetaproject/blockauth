<?php

/*

AUTHENTICATING VIA THE BLOCKCHAINS
Using - http://blockstrap.com

*/

error_reporting(-1);

$php_base = dirname(__FILE__);
$docs = file_get_contents($php_base.'/README.md');
$details = file_get_contents($php_base.'/docs/blockauth-tx-details.md');
$template = file_get_contents($php_base.'/html/index.html');
$options = json_decode(file_get_contents($php_base.'/json/index.json'), true);

include_once($php_base.'/php/blockauth.php');
include_once($php_base.'/php/mustache.php');
include_once($php_base.'/php/parsedown.php');

$md = new Parsedown();
$auth = new blockauth();

$options['auth'] = $auth->user();
$options['vars'] = $auth::$vars;

$options['docs'] = $md->parse($docs);
$options['details'] = $md->parse($details);

$mustache = new MustachePHP();
$html = $mustache->render($template, $options);
    
echo $html;