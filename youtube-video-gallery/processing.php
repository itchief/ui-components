<?php

const PATH = 'videos.json';

const API_KEY = 'BKl3DxC4ohjYusw6FdxGk1LNMSRs35Jq0KRe9_U';

function getId(string $url) : string
{
  if (filter_var($url, FILTER_VALIDATE_URL)) {
    $pattern = '%(?:youtube(?:-nocookie)?.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=|live/)|youtu.be/)([^"&?/ ]{11})%i';
    preg_match($pattern, $url, $match);
    return count($match) > 0 ? $match[1] : '';
  }
  return '';
}

function getSnippet(string $url) : array
{
  $id = getId($url);
  $url = 'https://www.googleapis.com/youtube/v3/videos?id=' . $id . '&key=' . API_KEY . '&part=snippet';
  $curlSession = curl_init();
  curl_setopt($curlSession, CURLOPT_URL, $url);
  curl_setopt($curlSession, CURLOPT_RETURNTRANSFER, true);
  $result = json_decode(curl_exec($curlSession), true);
  curl_close($curlSession);
  return $result;
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
  $result = getSnippet($_POST['url']);
  if (!isset($result['items'][0])) {
    echo json_encode([
      'success' => false
    ]);
    exit();
  }
  $result = $result['items'][0];
  $key = array_key_last($result['snippet']['thumbnails']);
  $data[$result['id']] = [
    'title' => $result['snippet']['title'],
    'publishedAt' => $result['snippet']['publishedAt'],
    'image' => $result['snippet']['thumbnails'][$key]['url'],
  ];
  file_put_contents(PATH, json_encode($data));
  echo json_encode([
    'success' => true,
    'id' => $result['id'],
    'data' => $data[$result['id']]
  ]);
  exit();
}
