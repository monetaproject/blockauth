<?php

class blockauth 
{
    private static $id = 'BCAUTH';
    private static $salts = Array();
    private static $cookie_value = false;
    private static $addresses = Array();
    public static $vars = Array();
    
    public function debug($obj)
    {
        echo '<pre>';
        print_r($obj);
        echo '</pre>';
    }
    
    private function get($key = false, $default = false)
    {
        if(isset($_GET) && $key && isset($_GET[$key]))
        {
            return $_GET[$key];
        }
        else
        {
            return $default;
        }
    }
    
    private function get_addresses()
    {
        if(file_exists(dirname(dirname(dirname(__FILE__))).'/config.ini'))
        {
            $config = parse_ini_file(dirname(dirname(dirname(__FILE__))).'/config.ini', true);
            if(isset($config['addresses'])) return $config['addresses'];
            else return false;
        }
        else
        {
            return false;
        }
    }
    
    private function get_app()
    {
        if(file_exists(dirname(dirname(dirname(__FILE__))).'/config.ini'))
        {
            $config = parse_ini_file(dirname(dirname(dirname(__FILE__))).'/config.ini', true);
            if(isset($config['app'])) return $config['app'];
            else return false;
        }
        else
        {
            return false;
        }
    }
    
    private function get_auth($name)
    {
        if(isset($_COOKIE[$name])) return $_COOKIE[$name];
        else return false;
    }
    
    private function get_salts()
    {
        if(file_exists(dirname(dirname(dirname(__FILE__))).'/config.ini'))
        {
            $config = parse_ini_file(dirname(dirname(dirname(__FILE__))).'/config.ini', true);
            if(isset($config['salts'])) return $config['salts'];
            else return false;
        }
        else
        {
            return false;
        }
    }
    
    private function set_auth($name, $value, $life_span)
    {         
        if(!isset($life_span)) $life_span = time() + (86400 * 1); // One day by default
        else $life_span = time() + $life_span;
        setcookie($name, $value, $life_span);
    }
    
    function __construct()
    {
        $this::$salts = $this->get_salts();
        $this::$addresses = $this->get_addresses();
        $this::$cookie_value = hash('sha256', $this::$salts['cookie'].$this::$id);
        $this::$vars['cookie'] = $this::$cookie_value;
        $app = $this->get_app();
        if(isset($app['id'])) $this::$id = $app['id'];
        $name = $this->get('name', false);
        $username = $this->get('username', false);
        $pw = $this->get('password', false);
        $password = $this->get('password-repeat', false);
        $chain = $this->get('chain', false);
        if($name && $username && $pw && $password && $chain)
        {
            if($pw == $password)
            {
                if($name != $username)
                {
                    $uid = hash('sha256', $this::$salts['username'].$username);
                    $pw = hash('sha256', $uid.$password);
                    $this::$vars['name'] = $name;
                    $this::$vars['uid'] = $uid;
                    $this::$vars['pw'] = $pw;
                    $this::$vars['chain'] = $chain;
                    $this::$vars['return_address'] = $this::$addresses[$chain];
                    $this::$vars['hashes'] = Array(
                        'address' => hash('sha256', $this::$salts['address'].$uid)
                    );
                }
                else
                {
                    // USERNAME CANNOT BE SAME AS NAME
                }
            }
            else
            {
                // PASSWORD MIS-MATCH
            }
        }
    }
    
    public function is_logged_in()
    {
        $cookie_name = $this::$id;
        $correct_cookie_value = $this::$cookie_value;
        $current_cookie_value = $this->get_auth($cookie_name);
        if(
            $current_cookie_value 
            && $current_cookie_value == $correct_cookie_value
        ){
            return true;
        }
        else
        {
            return false;
        }
    }
    
    public function user()
    {
        $user = Array();
        $user['logged_in'] = $this->is_logged_in();
        if(isset($_COOKIE['BCAUTH_NAME']))
        {
            $user['name'] = $_COOKIE['BCAUTH_NAME'];
        }
        return $user;
    }
}