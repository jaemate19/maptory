<?php
require_once __DIR__ . '/../session.php';
session_start();
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) 
{
    echo json_encode([
        'success' => true,
        'logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username']
        ]
    ]);
} 
else 
{
    echo json_encode([
        'success' => true,
        'logged_in' => false
    ]);
}
?>