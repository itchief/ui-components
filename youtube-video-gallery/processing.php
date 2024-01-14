<?php

const PATH = 'videos.json';

class YouTubeVideo {
  private static $apiKey = 'AIzaSyDUS5oxD4fEDC9LQ5WuEQmCwTxRnVutemk';
  private static function getId(string $url) {
    if (filter_var($url, FILTER_VALIDATE_URL)) {
      $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=|live/)|youtu\.be/)([^"&?/ ]{11})%i';
      preg_match($pattern, $url, $match);
      return count($match) > 0 ? $match[1] : '';
    }
    return '';
  }
  private static function createUrl(string $id) {
    return 'https://www.googleapis.com/youtube/v3/videos?' .
      'id=' . $id .
      '&key=' . self::$apiKey .
      '&part=snippet';
  }
  public static function getSnippet(string $url) {
    $id = self::getId($url);
    $url = self::createUrl($id);
    $curlSession = curl_init();
    curl_setopt($curlSession, CURLOPT_URL, $url);
    curl_setopt($curlSession, CURLOPT_RETURNTRANSFER, true);
    $result = json_decode(curl_exec($curlSession), true);
    curl_close($curlSession);
    return $result;
  }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $data = '[]';
  if (file_exists(PATH)) {
    $data = file_get_contents(PATH);
  }
  $data = json_decode($data, true);
  echo json_encode($data);
  exit();
}

if ($method === 'POST') {
  $data = '[]';
  if (file_exists(PATH)) {
    $data = file_get_contents(PATH);
  }
  $data = json_decode($data, true);
  $result = YouTubeVideo::getSnippet($_POST['url']);
  $result = $result['items'][0];
  $key = array_key_last($result['snippet']['thumbnails']);
  $data[$result['id']] = [
    'title' => $result['snippet']['title'],
    'publishedAt' => $result['snippet']['publishedAt'],
    'image' => $result['snippet']['thumbnails'][$key]['url'],
  ];
  file_put_contents(PATH, json_encode($data));
  echo json_encode([$result['id'] => $data[$result['id']]]);
  exit();
}
