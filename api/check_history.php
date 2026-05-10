<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once 'config.php';

$country_code = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';

if (empty($country_code)) 
{
    echo json_encode(['success' => false, 'error' => 'Country code required']);
    exit;
}

$stmt = $conn->prepare("SELECT history_html FROM countries WHERE country_code = ? AND history_html IS NOT NULL AND history_html != ''");
$stmt->bind_param("s", $country_code);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) 
{
    echo json_encode([
        'success' => true,
        'has_history' => true,
        'history_html' => $row['history_html']
    ]);
} 
else 
{
    echo json_encode([
        'success' => true,
        'has_history' => false
    ]);
}

$stmt->close();
$conn->close();
?>