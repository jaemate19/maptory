<?php
require_once 'config.php';

$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query)) 
{
    http_response_code(400);
    echo json_encode(['error' => 'Search query required']);
    exit;
}

try 
{
    // Search by common name or official name
    $sql = "SELECT country_code, common_name, official_name, capital_city 
            FROM countries 
            WHERE common_name LIKE ? OR official_name LIKE ? 
            LIMIT 10";
    
    $stmt = $conn->prepare($sql);
    $search_term = "%{$query}%";
    $stmt->bind_param("ss", $search_term, $search_term);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $results = [];
    while ($row = $result->fetch_assoc()) {
        $results[] = $row;
    }
    
    echo json_encode($results);
    
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Search failed: ' . $e->getMessage()]);
}

$conn->close();
?>