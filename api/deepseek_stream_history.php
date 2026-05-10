<?php
set_time_limit(500);
ini_set('max_execution_time', 500);
ini_set('memory_limit', '512M');
error_reporting(0);
ini_set('display_errors', 0);

// Your DeepSeek API key
$DEEPSEEK_API_KEY = '';

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$country_name = isset($input['country_name']) ? trim($input['country_name']) : '';
$country_code = isset($input['country_code']) ? strtoupper(trim($input['country_code'])) : '';

if (empty($country_name)) 
{
    echo "data: " . json_encode(['error' => 'Country name required']) . "\n\n";
    exit;
}

$prompt = "Create a comprehensive, beautifully formatted HTML document about the history of $country_name.
The HTML should be self-contained with CSS styling included.
Include the following sections:
1. Early History / Pre-colonial era
2. Colonial period (if applicable)
3. Path to independence / Modern formation
4. Key historical events and dates
5. Important historical figures
6. Modern era / Current situation

Format the HTML with:
- A header with country name and flag emoji
- Each section with a heading
- Key dates bolded
- Bullet points for events
- A footer with source note
- Use professional, clean styling with soft colors

Make it educational, accurate, and visually appealing.
Return ONLY the HTML code, no markdown formatting, no explanations.";

try 
{
    $ch = curl_init('https://api.deepseek.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 260);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $DEEPSEEK_API_KEY
    ]);
    
    $requestBody = json_encode([
        'model' => 'deepseek-chat',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are a historian and web designer. Create a concise but well-formatted HTML document about country histories.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'temperature' => 0.7,
        'max_tokens' => 5000,
        'stream' => true
    ]);
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
    
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) 
    {
        $lines = explode("\n", $data);
        
        foreach ($lines as $line) 
        {
            $line = trim($line);
            if (empty($line)) continue;
            
            if (strpos($line, 'data: ') === 0) 
            {
                $json = substr($line, 6);
                
                if ($json === '[DONE]') 
                {
                    echo "data: [DONE]\n\n";
                    ob_flush();
                    flush();
                    continue;
                }
                
                $chunk = json_decode($json, true);
                if (isset($chunk['choices'][0]['delta']['content'])) 
                {
                    $content = $chunk['choices'][0]['delta']['content'];
                    echo "data: " . json_encode(['content' => $content]) . "\n\n";
                    ob_flush();
                    flush();
                }
            }
        }
        
        return strlen($data);
    });
    
    curl_exec($ch);
    
    if (curl_errno($ch)) 
    {
        echo "data: " . json_encode(['error' => curl_error($ch)]) . "\n\n";
    }
    
    curl_close($ch);
} 
catch (Exception $e) 
{
    echo "data: " . json_encode(['error' => $e->getMessage()]) . "\n\n";
}
?>