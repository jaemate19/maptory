<?php
require_once __DIR__ . '/../init_session.php';
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

// Try session first, then fallback to GET parameter
$user_id = null;
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
} elseif (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
}

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$country_code = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';

if (empty($country_code)) {
    echo json_encode(['success' => false, 'error' => 'Country code required']);
    exit;
}

$stmt = $conn->prepare("SELECT status FROM user_countries WHERE user_id = ? AND country_code = ?");
$stmt->bind_param("is", $user_id, $country_code);
$stmt->execute();
$result = $stmt->get_result();

$statuses = [];
while ($row = $result->fetch_assoc()) {
    $statuses[] = $row['status'];
}

echo json_encode([
    'success' => true,
    'country_code' => $country_code,
    'statuses' => $statuses
]);

$stmt->close();
$conn->close();
?>