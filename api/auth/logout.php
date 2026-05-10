<?php
require_once __DIR__ . '/../session.php';
session_start();
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>