/**
 * ChiefSlider by Itchief v2.0.0 (https://github.com/itchief/ui-components/tree/master/simple-adaptive-slider)
 * Copyright 2020 - 2021 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/ui-components/blob/master/LICENSE)
 */

(function() {
  if (typeof window.CustomEvent === 'function' ) return false;
  function CustomEvent(event, params) {
    params = params || {bubbles: false, cancelable: false, detail: null};
    var e = document.createEvent('CustomEvent');
    e.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return e;
  }
  window.CustomEvent = CustomEvent;
})();

var WRAPPER_SELECTOR = '.slider__wrapper';
var ITEMS_SELECTOR = '.slider__items';
var ITEM_SELECTOR = '.slider__item';
var CONTROL_CLASS = 'slider__control';

/* var ITEM_CLASS_ACTIVE = 'slider__item_active';
var CONTROL_SELECTOR = '.slider__control';
var CONTROL_CLASS_SHOW = 'slider__control_show';
// индикаторы
var INDICATOR_WRAPPER_ELEMENT = 'ol';
var INDICATOR_WRAPPER_CLASS = 'slider__indicators';
var INDICATOR_ITEM_ELEMENT = 'li';
var INDICATOR_ITEM_CLASS = 'slider__indicator';
var INDICATOR_ITEM_CLASS_ACTIVE = 'slider__indicator_active';
// порог для переключения слайда (40%)
var POS_THRESHOLD = 40;
// класс для отключения transition
var TRANSITION_NONE = 'transition-none';*/

var SELECTOR_PREV = '.slider__control[data-slide="prev"]';
var SELECTOR_NEXT = '.slider__control[data-slide="next"]';
var SELECTOR_INDICATOR = '.slider__indicators>li';
var SLIDER_TRANSITION_OFF = 'slider_disable-transition';
var CLASS_CONTROL_HIDE = 'slider__control_hide';
var CLASS_ITEM_ACTIVE = 'slider__item_active';
var CLASS_INDICATOR_ACTIVE = 'active';

function ChiefSlider(selector, config) {
  // элементы слайдера
  var $root = typeof selector === 'string' ?
    document.querySelector(selector) : selector;
  this._$root = $root;
  this._$wrapper = $root.querySelector(WRAPPER_SELECTOR);
  this._$items = $root.querySelector(ITEMS_SELECTOR);
  this._$itemList = $root.querySelectorAll(ITEM_SELECTOR);
  this._$controlPrev = $root.querySelector(SELECTOR_PREV);
  this._$controlNext = $root.querySelector(SELECTOR_NEXT);
  this._$indicatorList = $root.querySelectorAll(SELECTOR_INDICATOR);
  // экстремальные значения слайдов
  this._minOrder = 0;
  this._maxOrder = 0;
  this._$itemWithMinOrder = null;
  this._$itemWithMaxOrder = null;
  this._minTranslate = 0;
  this._maxTranslate = 0;
  // направление смены слайдов (по умолчанию)
  this._direction = 'next';
  // determines whether the position of item needs to be determined
  this._balancingItemsFlag = false;
  this._activeItems = [];
  // текущее значение трансформации
  this._transform = 0;
  // swipe параметры
  this._hasSwipeState = false;
  this.__swipeStartPos = 0;
  // slider properties
  this._transform = 0; // текущее значение трансформации
  this._intervalId = null;
  // configuration of the slider
  this._config = {
    loop: true,
    autoplay: false,
    interval: 5000,
    refresh: true,
    swipe: true,
  };
  for (var key in config) {
    if (this._config.hasOwnProperty(key)) {
      this._config[key] = config[key];
    }
  }
  // create some constants
  var $itemList = this._$itemList;
  var widthItem = $itemList[0].offsetWidth;
  var widthWrapper = this._$wrapper.offsetWidth;
  var itemsInVisibleArea = Math.round(widthWrapper / widthItem);
  // initial setting properties
  this._widthItem = widthItem;
  this._widthWrapper = widthWrapper;
  this._itemsInVisibleArea = itemsInVisibleArea;
  this._transformStep = 100 / itemsInVisibleArea;
  // initial setting order and translate items
  for (var i = 0, length = $itemList.length; i < length; i++) {
    $itemList[i].dataset.index = i;
    $itemList[i].dataset.order = i;
    $itemList[i].dataset.translate = 0;
    if (i < itemsInVisibleArea) {
      this._activeItems.push(i);
    }
  }
  if (this._config.loop) {
    // перемещаем последний слайд перед первым
    var count = $itemList.length - 1;
    var translate = -$itemList.length * 100;
    $itemList[count].dataset.order = -1;
    $itemList[count].dataset.translate = -$itemList.length * 100;
    $itemList[count].style.transform = 'translateX(' + translate + '%)';
    this.__refreshExtremeValues();
  } else {
    if (this._$controlPrev) {
      this._$controlPrev.classList.add(CLASS_CONTROL_HIDE);
    }
  }
  this._setActiveClass();
  this._addEventListener();
  this._updateIndicators();
  this._autoplay();
}

// подключения обработчиков событий для слайдера
ChiefSlider.prototype._addEventListener = function() {
  var $root = this._$root;
  var $items = this._$items;
  var config = this._config;
  function onClick(e) {
    var $target = e.target;
    this._autoplay('stop');
    if ($target.classList.contains(CONTROL_CLASS)) {
      e.preventDefault();
      this._direction = $target.dataset.slide;
      this._move();
    } else if ($target.dataset.slideTo) {
      var index = parseInt($target.dataset.slideTo);
      this._moveTo(index);
    }
    if (this._config.loop) {
      this._autoplay();
    }
  }
  function onMouseEnter(e) {
    this._autoplay('stop');
  }
  function onMouseLeave(e) {
    this._autoplay();
  }
  function onTransitionStart() {
    if (this._balancingItemsFlag) {
      return;
    }
    this._balancingItemsFlag = true;
    window.requestAnimationFrame(this._balancingItems.bind(this));
  }
  function onTransitionEnd() {
    this._balancingItemsFlag = false;
  }
  function onResize() {
    window.requestAnimationFrame(this._refresh.bind(this));
  }
  function onSwipeStart(e) {
    this._autoplay('stop');
    var event = e.type.search('touch') === 0 ? e.touches[0] : e;
    this._swipeStartPos = event.clientX;
    this._hasSwipeState = true;
  }
  function onSwipeEnd(e) {
    if (!this._hasSwipeState) {
      return;
    }
    var event = e.type.search('touch') === 0 ? e.changedTouches[0] : e;
    var diffPos = this._swipeStartPos - event.clientX;
    if (diffPos > 50) {
      this._direction = 'next';
      this._move();
    } else if (diffPos < -50) {
      this._direction = 'prev';
      this._move();
    }
    this._hasSwipeState = false;
    if (this._config.loop) {
      this._autoplay();
    }
  }
  function onDragStart(e) {
    e.preventDefault();
  }
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this._autoplay('stop');
    } else if (document.visibilityState === 'visible') {
      if (this._config.loop) {
        this._autoplay();
      }
    }
  }

  $root.addEventListener('click', onClick.bind(this));
  $root.addEventListener('mouseenter', onMouseEnter.bind(this));
  $root.addEventListener('mouseleave', onMouseLeave.bind(this));
  // on resize
  if (config.refresh) {
    window.addEventListener('resize', onResize.bind(this));
  }
  // on transitionstart and transitionend
  if (config.loop) {
    $items.addEventListener('transition-start', onTransitionStart.bind(this));
    $items.addEventListener('transitionend', onTransitionEnd.bind(this));
  }
  // on touchstart and touchend
  if (config.swipe) {
    $root.addEventListener('touchstart', onSwipeStart.bind(this));
    $root.addEventListener('mousedown', onSwipeStart.bind(this));
    document.addEventListener('touchend', onSwipeEnd.bind(this));
    document.addEventListener('mouseup', onSwipeEnd.bind(this));
  }
  $root.addEventListener('dragstart', onDragStart.bind(this));
  // при изменении активности вкладки
  document.addEventListener('visibilitychange', onVisibilityChange.bind(this));
};

// update values of extreme properties
ChiefSlider.prototype.__refreshExtremeValues = function() {
  var $itemList = this._$itemList;
  this._minOrder = +$itemList[0].dataset.order;
  this._maxOrder = this._minOrder;
  this._$itemByMinOrder = $itemList[0];
  this._$itemByMaxOrder = $itemList[0];
  this._minTranslate = +$itemList[0].dataset.translate;
  this._maxTranslate = this._minTranslate;
  for (var i = 0, length = $itemList.length; i < length; i++) {
    var $item = $itemList[i];
    var order = +$item.dataset.order;
    if (order < this._minOrder) {
      this._minOrder = order;
      this._$itemByMinOrder = $item;
      this._minTranslate = +$item.dataset.translate;
    } else if (order > this._maxOrder) {
      this._maxOrder = order;
      this._$itemByMaxOrder = $item;
      this._maxTranslate = +$item.dataset.translate;
    }
  }
};

// update position of item
ChiefSlider.prototype._balancingItems = function() {
  if (!this._balancingItemsFlag) {
    return;
  }
  var $wrapper = this._$wrapper;
  var $wrapperClientRect = $wrapper.getBoundingClientRect();
  var widthHalfItem = $wrapperClientRect.width / this._itemsInVisibleArea / 2;
  var count = this._$itemList.length;
  var translate;
  var clientRect;
  if (this._direction === 'next') {
    var wrapperLeft = $wrapperClientRect.left;
    var $min = this._$itemByMinOrder;
    translate = this._minTranslate;
    clientRect = $min.getBoundingClientRect();
    if (clientRect.right < wrapperLeft - widthHalfItem) {
      $min.dataset.order = this._minOrder + count;
      translate += count * 100;
      $min.dataset.translate = translate;
      $min.style.transform = 'translateX('.concat(translate, '%)');
      // update values of extreme properties
      this.__refreshExtremeValues();
    }
  } else {
    var wrapperRight = $wrapperClientRect.right;
    var $max = this._$itemByMaxOrder;
    translate = this._maxTranslate;
    clientRect = $max.getBoundingClientRect();
    if (clientRect.left > wrapperRight + widthHalfItem) {
      $max.dataset.order = this._maxOrder - count;
      translate -= count * 100;
      $max.dataset.translate = translate;
      $max.style.transform = 'translateX('.concat(translate, '%)');
      // update values of extreme properties
      this.__refreshExtremeValues();
    }
  }
  // updating...
  requestAnimationFrame(this._balancingItems.bind(this));
};

// _setActiveClass
ChiefSlider.prototype._setActiveClass = function() {
  var activeItems = this._activeItems;
  var $itemList = this._$itemList;
  for (var i = 0, length = $itemList.length; i < length; i++) {
    var $item = $itemList[i];
    var index = +$item.dataset.index;
    if (activeItems.indexOf(index) > -1) {
      $item.classList.add(CLASS_ITEM_ACTIVE);
    } else {
      $item.classList.remove(CLASS_ITEM_ACTIVE);
    }
  }
};

// _updateIndicators
ChiefSlider.prototype._updateIndicators = function() {
  var $indicatorList = this._$indicatorList;
  var $itemList = this._$itemList;
  if (!$indicatorList.length) {
    return;
  }
  for (var index = 0, length = $itemList.length; index < length; index++) {
    var $item = $itemList[index];
    if ($item.classList.contains(CLASS_ITEM_ACTIVE)) {
      $indicatorList[index].classList.add(CLASS_INDICATOR_ACTIVE);
    } else {
      $indicatorList[index].classList.remove(CLASS_INDICATOR_ACTIVE);
    }
  }
};

// move slides
ChiefSlider.prototype._move = function() {
  var step = this._direction ===
   'next' ? -this._transformStep : this._transformStep;
  var transform = this._transform + step;
  if (!this._config.loop) {
    var endTransformValue =
      this._transformStep * (this._$itemList.length - this._itemsInVisibleArea);
    transform = Math.round(transform * 10) / 10;
    if (transform < -endTransformValue || transform > 0) {
      return;
    }
    this._$controlPrev.classList.remove(CLASS_CONTROL_HIDE);
    this._$controlNext.classList.remove(CLASS_CONTROL_HIDE);
    if (transform === -endTransformValue) {
      this._$controlNext.classList.add(CLASS_CONTROL_HIDE);
    } else if (transform === 0) {
      this._$controlPrev.classList.add(CLASS_CONTROL_HIDE);
    }
  }
  var activeIndex = [];
  var i = 0;
  var length;
  var index;
  var newIndex;
  if (this._direction === 'next') {
    for (i = 0, length = this._activeItems.length; i < length; i++) {
      index = this._activeItems[i];
      newIndex = ++index;
      if (newIndex > this._$itemList.length - 1) {
        newIndex -= this._$itemList.length;
      }
      activeIndex.push(newIndex);
    }
  } else {
    for (i = 0, length = this._activeItems.length; i < length; i++) {
      index = this._activeItems[i];
      newIndex = --index;
      if (newIndex < 0) {
        newIndex += this._$itemList.length;
      }
      activeIndex.push(newIndex);
    }
  }
  this._activeItems = activeIndex;
  this._setActiveClass();
  this._updateIndicators();
  this._transform = transform;
  this._$items.style.transform = 'translateX(' + transform + '%)';
  this._$items.dispatchEvent(new CustomEvent('transition-start', {bubbles: true}));
};

// _moveToNext
ChiefSlider.prototype._moveToNext = function() {
  this._direction = 'next';
  this._move();
};

// _moveToPrev
ChiefSlider.prototype._moveToPrev = function() {
  this._direction = 'prev';
  this._move();
};

// _moveTo
ChiefSlider.prototype._moveTo = function(index) {
  var $indicatorList = this._$indicatorList;
  var nearestIndex = null;
  var diff = null;
  var i;
  var length;
  for (i = 0, length = $indicatorList.length; i < length; i++) {
    var $indicator = $indicatorList[i];
    if ($indicator.classList.contains(CLASS_INDICATOR_ACTIVE)) {
      var slideTo = +$indicator.dataset.slideTo;
      if (diff === null) {
        nearestIndex = slideTo;
        diff = Math.abs(index - nearestIndex);
      } else {
        if (Math.abs(index - slideTo) < diff) {
          nearestIndex = slideTo;
          diff = Math.abs(index - nearestIndex);
        }
      }
    }
  }
  diff = index - nearestIndex;
  if (diff === 0) {
    return;
  }
  this._direction = diff > 0 ? 'next' : 'prev';
  for (i = 1; i <= Math.abs(diff); i++) {
    this._move();
  }
};

// _autoplay
ChiefSlider.prototype._autoplay = function(action) {
  if (!this._config.autoplay) {
    return;
  }
  if (action === 'stop') {
    clearInterval(this._intervalId);
    this._intervalId = null;
    return;
  }
  if (this._intervalId === null) {
    this._intervalId = setInterval(
        function() {
          this._direction = 'next';
          this._move();
        }.bind(this),
        this._config.interval
    );
  }
};

// _refresh
ChiefSlider.prototype._refresh = function() {
  // create some constants
  var $itemList = this._$itemList;
  var widthItem = $itemList[0].offsetWidth;
  var widthWrapper = this._$wrapper.offsetWidth;
  var itemsInVisibleArea = Math.round(widthWrapper / widthItem);

  if (itemsInVisibleArea === this._itemsInVisibleArea) {
    return;
  }

  this._autoplay('stop');

  this._$items.classList.add(SLIDER_TRANSITION_OFF);
  this._$items.style.transform = 'translateX(0)';

  // setting properties after reset
  this._widthItem = widthItem;
  this._widthWrapper = widthWrapper;
  this._itemsInVisibleArea = itemsInVisibleArea;
  this._transform = 0;
  this._transformStep = 100 / itemsInVisibleArea;
  this._balancingItemsFlag = false;
  this._activeItems = [];

  // setting order and translate items after reset
  for (var i = 0, length = $itemList.length; i < length; i++) {
    var $item = $itemList[i];
    var position = i;
    $item.dataset.index = position;
    $item.dataset.order = position;
    $item.dataset.translate = 0;
    $item.style.transform = 'translateX(0)';
    if (position < itemsInVisibleArea) {
      this._activeItems.push(position);
    }
  }

  this._setActiveClass();
  this._updateIndicators();
  window.requestAnimationFrame(
      function() {
        this._$items.classList.remove(SLIDER_TRANSITION_OFF);
      }.bind(this)
  );

  // hide prev arrow for non-infinite slider
  if (!this._config.loop) {
    if (this._$controlPrev) {
      this._$controlPrev.classList.add(CLASS_CONTROL_HIDE);
    }
    return;
  }

  // translate last item before first
  var count = $itemList.length - 1;
  var translate = -$itemList.length * 100;
  $itemList[count].dataset.order = -1;
  $itemList[count].dataset.translate = -$itemList.length * 100;
  $itemList[count].style.transform = 'translateX('.concat(translate, '%)');
  // update values of extreme properties
  this.__refreshExtremeValues();
  // calling _autoplay
  this._autoplay();
};

// public
ChiefSlider.prototype.next = function() {
  this._moveToNext();
};
ChiefSlider.prototype.prev = function() {
  this._moveToPrev();
};
ChiefSlider.prototype.moveTo = function(index) {
  this._moveTo(index);
};
ChiefSlider.prototype.refresh = function() {
  this._refresh();
};
