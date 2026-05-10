<?php
require_once __DIR__ . '/../init_session.php';
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Read the input FIRST
$input = json_decode(file_get_contents('php://input'), true);

// Try session first, then fallback to POST parameter
$user_id = null;
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
} elseif (isset($input['user_id']) && is_numeric($input['user_id'])) {
    $user_id = (int)$input['user_id'];
}

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$country_code = isset($input['country_code']) ? strtoupper(trim($input['country_code'])) : '';
$status = isset($input['status']) ? $input['status'] : '';
$action = isset($input['action']) ? $input['action'] : 'add';

if (empty($country_code) || empty($status)) {
    echo json_encode(['success' => false, 'error' => 'Country code and status required']);
    exit;
}

if (!in_array($status, ['visited', 'want_to_visit'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid status']);
    exit;
}

if ($action === 'add') {
    $stmt = $conn->prepare("INSERT IGNORE INTO user_countries (user_id, country_code, status) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $country_code, $status);
} else {
    $stmt = $conn->prepare("DELETE FROM user_countries WHERE user_id = ? AND country_code = ? AND status = ?");
    $stmt->bind_param("iss", $user_id, $country_code, $status);
}

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => $action === 'add' ? 'Status added' : 'Status removed',
        'country_code' => $country_code,
        'status' => $status,
        'action' => $action
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}

$stmt->close();
$conn->close();
?>