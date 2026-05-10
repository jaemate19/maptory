<?php
// Include this at the top of every PHP file that needs sessions
if (session_status() === PHP_SESSION_NONE) 
{
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}
?>