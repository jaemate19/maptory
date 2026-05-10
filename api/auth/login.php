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
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($email) || empty($password)) 
{
    echo json_encode(['success' => false, 'error' => 'Email and password required']);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, password_hash FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) 
{
    if (password_verify($password, $row['password_hash'])) 
    {
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['username'] = $row['username'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $row['id'],
                'username' => $row['username']
            ]
        ]);
    } 
    else 
    {
        echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
    }
} 
else 
{
    echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
}

$stmt->close();
$conn->close();
?>