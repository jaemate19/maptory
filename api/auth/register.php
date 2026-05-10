<?php
require_once __DIR__ . '/../init_session.php';
error_reporting(0);
ini_set('display_errors', 0);
// Set session cookie parameters BEFORE starting session
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
session_start();
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') 
{
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$username = isset($input['username']) ? trim($input['username']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validation
if (empty($username) || strlen($username) < 3) 
{
    echo json_encode(['success' => false, 'error' => 'Username must be at least 3 characters']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) 
{
    echo json_encode(['success' => false, 'error' => 'Valid email required']);
    exit;
}

if (empty($password) || strlen($password) < 6) 
{
    echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
    exit;
}

// Check if username or email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) 
{
    echo json_encode(['success' => false, 'error' => 'Username or email already taken']);
    $stmt->close();
    exit;
}

$stmt->close();

// Hash password and insert user
$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $password_hash);

if ($stmt->execute()) 
{
    $_SESSION['user_id'] = $stmt->insert_id;
    $_SESSION['username'] = $username;
    
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user' => [
            'id' => $stmt->insert_id,
            'username' => $username,
            'email' => $email
        ]
    ]);
} 
else 
{
    echo json_encode(['success' => false, 'error' => 'Registration failed']);
}

$stmt->close();
$conn->close();
?>