<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($conn) || !$conn->ping()) 
{
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') 
{
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$country_code = isset($input['country_code']) ? strtoupper(trim($input['country_code'])) : '';
$history_html = isset($input['history_html']) ? $input['history_html'] : '';

if (empty($country_code) || empty($history_html)) 
{
    echo json_encode(['success' => false, 'error' => 'Country code and history required']);
    exit;
}

// Clean HTML if needed
$history_html = preg_replace('/^```html\\n?/', '', $history_html);
$history_html = preg_replace('/\\n?```$/', '', $history_html);

$stmt = $conn->prepare("UPDATE countries SET history_html = ?, history_last_updated = NOW() WHERE country_code = ?");
$stmt->bind_param("ss", $history_html, $country_code);

if ($stmt->execute()) 
{
    if ($stmt->affected_rows > 0) 
    {
        echo json_encode(['success' => true, 'message' => 'History saved successfully']);
    } 
    else 
    {
        // Country code might not exist, try INSERT
        $insertStmt = $conn->prepare("INSERT INTO countries (country_code, history_html, history_last_updated) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE history_html = VALUES(history_html), history_last_updated = NOW()");
        $insertStmt->bind_param("ss", $country_code, $history_html);
        
        if ($insertStmt->execute()) 
        {
            echo json_encode(['success' => true, 'message' => 'History created successfully']);
        } 
        else 
        {
            echo json_encode(['success' => false, 'error' => 'Failed to save history']);
        }
        
        $insertStmt->close();
    }
} 
else 
{
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>