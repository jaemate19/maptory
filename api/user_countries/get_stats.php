<?php
require_once __DIR__ . '/../init_session.php';
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

// Try session first, then fallback to GET parameter
$user_id = null;
if (isset($_SESSION['user_id'])) 
{
    $user_id = $_SESSION['user_id'];
} 
elseif (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) 
{
    $user_id = (int)$_GET['user_id'];
}

if (!$user_id) 
{
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

// Get visited countries
$stmt = $conn->prepare("
    SELECT uc.country_code, uc.status, c.common_name, c.flag_url 
    FROM user_countries uc 
    LEFT JOIN countries c ON uc.country_code = c.country_code 
    WHERE uc.user_id = ? 
    ORDER BY uc.status, c.common_name
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$visited = [];
$wantToVisit = [];

while ($row = $result->fetch_assoc()) 
{
    if ($row['status'] === 'visited') 
    {
        $visited[] = [
            'country_code' => $row['country_code'],
            'country_name' => $row['common_name'] ?? $row['country_code']
        ];
    } 
    else 
    {
        $wantToVisit[] = [
            'country_code' => $row['country_code'],
            'country_name' => $row['common_name'] ?? $row['country_code']
        ];
    }
}

echo json_encode([
    'success' => true,
    'stats' => [
        'visited_count' => count($visited),
        'want_to_visit_count' => count($wantToVisit),
        'total_count' => count($visited) + count($wantToVisit),
        'visited' => $visited,
        'want_to_visit' => $wantToVisit
    ]
]);

$stmt->close();
$conn->close();
?>