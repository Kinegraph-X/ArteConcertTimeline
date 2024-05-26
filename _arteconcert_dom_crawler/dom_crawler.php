<?php
require 'vendor/autoload.php';

use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\CssSelector\CssSelectorConverter;
date_default_timezone_set('Europe/Paris');
$current_timestamp = (new DateTime())->getTimestamp();
$cache_file_name = 'cached_events.json';

if (($cache_contents = @file_get_contents($cache_file_name))) {
    $cache_contents = json_decode($cache_contents, true);
    if (($cache_contents['timestamp']  + 60 * 60) > $current_timestamp && $cache_contents['events']) {
        serve_result($cache_contents['events']);
        exit;
    }
}

// create curl resource $ch = curl_handle
$ch = curl_init();
curl_setopt ($ch, CURLOPT_CAINFO, dirname(__FILE__)."/cacert.pem");

//return the transfer as a string
curl_setopt($ch, CURLOPT_REFERER, "https://www.google.com/search?channel=crow2&client=firefox-b-d&q=arte+les+prochains+live");
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:48.0) Gecko/20100101 Firefox/48.0');
curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLINFO_HEADER_OUT, true);

// Navigate to the Arte Concert Agenda page
curl_setopt($ch, CURLOPT_URL, "https://www.arte.tv/fr/arte-concert/agenda/");
$output = curl_exec($ch);

preg_match('#status=fail#', $output, $fail);
if (!empty($fail)){
    $message = curl_error($ch);
    send_response(array('error' => array('type' => 'curl_error', 'message' => 'Error getting Arte Concert Agenda : '.$message)));
}

$months = [
    'janvier' => 'January',
    'février' => 'February',
    'mars' => 'March',
    'avril' => 'April',
    'mai' => 'May',
    'juin' => 'June',
    'juillet' => 'July',
    'août' => 'August',
    'septembre' => 'September',
    'octobre' => 'October',
    'novembre' => 'November',
    'décembre' => 'December'
];
$current_day = intval((new DateTime())->format('d'));
$current_month = array_keys($months)[intval((new DateTime())->format('m')) - 1];
$offset_hour = 13;
$offseted_hours = [
    0 => $offset_hour,
    1 => $offset_hour,
    2 => $offset_hour
];
$crawler = new Crawler($output);
$events = [];
$crawler->filter('li[data-testid="tsguide-itm"]')->each(function (Crawler $node) use (&$events) {
    if ($node->filter('div[data-testid="sticker-livestream"]')->count() > 0) {
//         echo '<pre>'.$node->text().'</pre>';
        setEvent($node);
    }
    else if ($node->filter('div[data-testid="ts-tsItem"]')->count() > 0 && count($events) <= 12) {
//         echo '<pre>'.$node->text().'</pre>';
        setEvent($node, true);
    }
});

function setEvent(&$node, $is_fictive = false) {
    global $months;
    global $events;
    global $current_day;
    global $current_month;
    global $offseted_hours;
    $base_url = 'http://arte.tv';
    $public_link = trim($node->filter('[data-testid="ts-tsItemLink"]')->attr('href'));
    
    $EM_number = preg_match('#\/([-\dA]+)#', $public_link, $result);
    $EM_number = $result[1];
    
    $day = str_pad(substr(trim($node->filter('p:first-child')->text()), 4), 2, '0', STR_PAD_LEFT);
    $month = trim($node->filter('p:nth-child(2)')->text());
    $hour = trim($node->filter('p:last-child')->text());
    $title = trim($node->filter('h3[data-testid="ts-tsTitle"]')->text());
    try {
        $subtitle = trim($node->filter('h4[data-testid="ts-tsSubtitle"]')->text());
    }
    catch (Exception $error) {
        $subtitle = '';
    }
    $thumbnail = trim($node->filter('img[data-testid="ts-tsImg"]')->attr('src'));
    $thubnail_url = str_replace('170x96', '380x214', $thumbnail);
    
    // randomize hour for fictive streams
    if ($is_fictive) {
        $offset_in_days = rand(0, 2);
//         echo $current_day + $offset_in_days.'<br/>';
//         echo $offseted_hours[$offset_in_days].'<br/>';
        $day = str_pad(strval(min($current_day + $offset_in_days, 30)), 2, '0', STR_PAD_LEFT);
        $month = $current_month;
        $hour = strval(min($offseted_hours[$offset_in_days], 23)).substr($hour, 2);
        $offseted_hours[$offset_in_days] += 2;
    }
//     echo $hour.'<br/>';
    
    /// anticipate on a result in the next year
    if (strpos(' ', $month) !== false)
        $dateStr = "$month $day $hour";
    else
        $dateStr = "$month $day ".date('Y')." $hour";
    
//     echo $dateStr.' '.convertToTimestamp($dateStr).'<br/>';
    $timestamp = convertToTimestamp($dateStr);

    $event = [
        'date' => $timestamp,
        'HR_date' => "$day $month $hour",
        'title' => $title,
        'subtitle' => $subtitle,
        'thumbnail' => $thubnail_url,
        'public_page' => $base_url.$public_link,
        'EM_number' => $EM_number,
        'is_fictive' => $is_fictive
    ];
//     echo '<pre>'.print_r($event, true).'</pre>';
    
    $events[] = $event;
}

$base_URL = 'https://api.arte.tv/api/player/v2/config/fr/'; // from $events[n]['data']['attributes']['metadata']['config'][url']
foreach($events as $key => $event) {
    $stream_config_URL = $base_URL.$event['EM_number'];
    $events[$key]['stream_config_URL'] = $stream_config_URL;
    // Navigate to the confifg page of the stream
    curl_setopt($ch, CURLOPT_URL, $stream_config_URL);
    $output = curl_exec($ch);
    
    preg_match('#status=fail#', $output, $fail);
    if (!empty($fail)){
        $message = curl_error($ch);
        send_response(array('error' => array('type' => 'curl_error', 'message' => 'Error getting the descriptor of the livestream : '.$message)));
    }
    else if (!$result = @json_decode($output, true)) {
        send_response(array('error' => array('type' => 'curl_error', 'message' => 'Error getting the descriptor of the livestream : seems badly formatted JSON')));
    }
    
    $events[$key]['duration'] = $result['data']['attributes']['metadata']['duration']['seconds'] * 60;
    
    if (!empty($result['data']['attributes']['streams'])) {
        // non-live events have a stream-url containing the m3u8 pointing to the replay, let's include it
        $events[$key]['stream_m3u_URL'] = $result['data']['attributes']['streams'][0]['url'];
        preg_match('#channel(\d+)#', $events[$key]['stream_m3u_URL'], $stream_channel);
        // and they don't have the word "channel" in the url, so prevent an errpr
        if ($stream_channel)
            $events[$key]['stream_channel'] = intval($stream_channel[1]);
        else
            $events[$key]['stream_channel'] = rand(1, 3);
    }
    else
        $events[$key]['stream_channel'] = 0;
}
// echo '<br/>'.date('Z').'<br/>';

$cached_content = [
    'timestamp' => $current_timestamp,
    'events' => $events
];
save_file($cached_content, $cache_file_name);
serve_result($events);

function convertToTimestamp($dateStr) {
    global $months;
    
    // Replace French month with English equivalent
    $dateStr = str_ireplace(array_keys($months), array_values($months), $dateStr);
    
    if ($date = strtotime($dateStr)) {
        return $date;
    }
    
    return null; // Return null if date conversion fails
}



function send_response($message) {
    header('Content-Type: application/json');
    echo json_encode($message);
    exit;
}

function save_file($content,$filename) {
    $fp = fopen($filename, "w+");
    fwrite($fp,json_encode($content, JSON_PRETTY_PRINT));
//     fwrite($fp,$content);
    fclose($fp);
}

function serve_result($contents) {
    // Set the MIME type for the JSON
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json');
    echo json_encode($contents, JSON_PRETTY_PRINT);
}
?>