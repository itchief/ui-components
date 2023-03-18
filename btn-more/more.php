<?php

$items = [
  [
    'title' => 'Кокосовое масло без запаха, 1000мл',
    'img' => 'images/odorless-coconut-oil-1000ml.jpg',
  ],
  [
    'title' => 'Семена чиа, 500г',
    'img' => 'images/chia-seeds-organic-500g.jpg',
  ],
  [
    'title' => 'Соль мелкая гималайская, 1кг',
    'img' => 'images/himalayan-salt-iodised-fine-1kg.jpg',
  ],
  [
    'title' => 'Миндаль, 1000г',
    'img' => 'images/almonds-1000g.jpg',
  ],
  [
    'title' => 'Семечки подсолнуха очищенные, 750г',
    'img' => 'images/hulled-sunflower-seeds-750g.jpg',
  ],
  [
    'title' => 'Органический рисовый сироп, 350г',
    'img' => 'images/rice-syrup-organic-350g.jpg',
  ],
  [
    'title' => 'Овсяные хлопья, 750г',
    'img' => 'images/fine-rolled-oatflakes-750g.jpg',
  ],
  [
    'title' => 'Финики без косточек, 1кг',
    'img' => 'images/pitted-dates-1kg.jpg',
  ]
];

const LIMIT = 2;

$total = count($items);
$page = (int)($_POST['page'] ?? 1);
$remain = $total - $page * LIMIT;
$data = array_slice($items, ($page - 1) * LIMIT, LIMIT);
$template = <<<HTML
<div class="card">
  <img class="card-img" src="{{img}}" alt="{{title}}" width="160" height="213" loading="lazy">
  <div class="card-title">{{title}}</div>
</div>
HTML;

header('Content-Type: application/json');

echo json_encode([
  'total' => $total,
  'page' => $page,
  'remain' => $remain,
  'template' => $template,
  'data' => $data,
]);
