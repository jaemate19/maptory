<?php
require_once 'config.php';

// Get country code from query parameter
$country_code = isset($_GET['code']) ? strtoupper($_GET['code']) : '';

if (empty($country_code)) 
{
    http_response_code(400);
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

try 
{
    $sql = "SELECT * FROM countries WHERE country_code = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $country_code);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) 
    {
        $country = $result->fetch_assoc();
        
        // Format numbers for display
        if ($country['population']) 
        {
            $country['population_formatted'] = number_format($country['population']);
        }
        if ($country['area_km2']) 
        {
            $country['area_formatted'] = number_format($country['area_km2'], 2);
        }
        if ($country['gdp_usd']) 
        {
            $country['gdp_formatted'] = '$' . number_format($country['gdp_usd'], 0);
        }
        
        echo json_encode($country);
    } 
    else 
    {
        http_response_code(404);
        echo json_encode(['error' => 'Country not found']);
    }
    
    $stmt->close();
    
} 
catch (Exception $e) 
{
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>