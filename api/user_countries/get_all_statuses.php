<?php
require_once __DIR__ . '/../session.php';
session_start();
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user_id'])) 
{
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT country_code, status FROM user_countries WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$countries = [];
while ($row = $result->fetch_assoc()) 
{
    $countries[] = [
        'country_code' => $row['country_code'],
        'status' => $row['status']
    ];
}

echo json_encode([
    'success' => true,
    'countries' => $countries
]);

$stmt->close();
$conn->close();
?>