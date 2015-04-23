<?php

$base = dirname(dirname(__FILE__)).'/';
$ini = parse_ini_file($base.'config.ini', true);
$salts = $ini['salts'];
$addresses = $ini['addresses'];

$name = false;
$username = false;
$chain = false;
$password = false;
$return_address = false;
$results = Array();

if(isset($_POST) && isset($_POST['name'])) $name = $_POST['name'];
if(isset($_POST) && isset($_POST['username'])) $username = $_POST['username'];
if(isset($_POST) && isset($_POST['chain'])) $chain = $_POST['chain'];
if(isset($_POST) && isset($_POST['password'])) $password = $_POST['password'];
if(isset($_POST) && isset($_POST['return_address'])) $return_address = $_POST['return_address'];

$uid = hash('sha256', $salts['username'].$username);
$pw = hash('sha256', $uid.$password);
$hash = hash('sha256', $salts['address'].$uid.$pw);

$results['hash'] = $hash;

if(isset($addresses[$chain]))
{
    $results['address'] = $addresses[$chain];
}

echo json_encode($results);
exit;