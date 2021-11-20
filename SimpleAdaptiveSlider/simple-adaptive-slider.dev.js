/**
 * SimpleAdaptiveSlider by Itchief v2.0.0 (https://github.com/itchief/ui-components/tree/master/simple-adaptive-slider)
 * Copyright 2020 - 2021 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/ui-components/blob/master/LICENSE)
 */

// базовые классы и селекторы
const CLASS_NAME_ITEM_ACTIVE = 'slider__item_active';
const CLASS_NAME_INDICATOR_ACTIVE = 'slider__indicator_active';
const CLASS_NAME_INDICATOR = 'slider__indicator';
const CLASS_NAME_INDICATORS= 'slider__indicators';
const CLASS_NAME_NEXT_PREV_SHOW = 'slider__control_show';

const SELECTOR_ITEM = '.slider__item';
const SELECTOR_ITEMS = '.slider__items';
const SELECTOR_WRAPPER = '.slider__wrapper';
const SELECTOR_NEXT_PREV = '.slider__control';


// индикаторы
const INDICATOR_WRAPPER_ELEMENT = 'ol';
const INDICATOR_ITEM_ELEMENT = 'li';


// порог для переключения слайда (40%)
const SWIPE_THRESHOLD = 20;
// класс для отключения transition
const TRANSITION_NONE = 'transition-none';

class SimpleAdaptiveSlider {
  constructor(selector, config) {
    // .slider
    this._$root = document.querySelector(selector);
    // .slider__wrapper
    this._$wrapper = this._$root.querySelector(SELECTOR_WRAPPER);
    // .slider__items
    this._$items = this._$root.querySelector(SELECTOR_ITEMS);
    // .slider__item
    this._$itemList = this._$root.querySelectorAll(SELECTOR_ITEM);
    // текущий индекс
    this._currentIndex = 0;
    // экстремальные значения слайдов
    this._minOrder = 0;
    this._maxOrder = 0;
    this._$itemWithMinOrder = null;
    this._$itemWithMaxOrder = null;
    this._minTranslate = 0;
    this._maxTranslate = 0;
    // направление смены слайдов (по умолчанию)
    this._direction = 'next';
    // флаг, который показывает, что идёт процесс уравновешивания слайдов
    this._balancingItemsFlag = false;
    // текущее значение трансформации
    this._transform = 0;

    this._width = this._$wrapper.getBoundingClientRect().width;

    this._supportResizeObserver = typeof window.ResizeObserver !== 'undefined';

    // swipe параметры
    this._hasSwipeState = false;
    this._swipeStartPosX = 0;
    // id таймера
    this._intervalId = null;
    // конфигурация слайдера (по умолчанию)
    this._config = {
      loop: true,
      autoplay: false,
      interval: 5000,
      swipe: true,
    };
    // изменяем конфигурацию слайдера в соответствии с переданными настройками
    for (var key in config) {
      if (this._config.hasOwnProperty(key)) {
        this._config[key] = config[key];
      }
    }
    this._$items.dataset.translate = 0;
    // добавляем к слайдам data-атрибуты
    for (var i = 0, length = this._$itemList.length; i < length; i++) {
      this._$itemList[i].dataset.order = i;
      this._$itemList[i].dataset.index = i;
      this._$itemList[i].dataset.translate = 0;
    }
    // перемещаем последний слайд перед первым
    if (this._config.loop) {
      var count = this._$itemList.length - 1;
      var translate = -this._$itemList.length;
      this._$itemList[count].dataset.order = -1;
      this._$itemList[count].dataset.translate = -this._$itemList.length;
      var translateX = translate * this._width;
      this._$itemList[count].style.transform = 'translateX(' + translateX + 'px)';
    }
    // добавляем индикаторы к слайдеру
    this._addIndicators();
    // обновляем экстремальные значения переменных
    this._refreshExtremeValues();
    // помечаем активные элементы
    this._setActiveClass();
    // назначаем обработчики
    this._addEventListener();
    // запускаем автоматическую смену слайдов
    this._autoplay();
  }

  _setActiveClass() {
    // slides
    var i;
    var length;
    var $item;
    var index;
    for (i = 0, length = this._$itemList.length; i < length; i++) {
      $item = this._$itemList[i];
      index = parseInt($item.dataset.index);
      if (this._currentIndex === index) {
        $item.classList.add(CLASS_NAME_ITEM_ACTIVE);
      } else {
        $item.classList.remove(CLASS_NAME_ITEM_ACTIVE);
      }
    }
    this._$root.dispatchEvent(new CustomEvent('slider.set.active',
        {bubbles: true}));
    // indicators
    var $indicators = this._$root.querySelectorAll('.' + CLASS_NAME_INDICATOR);
    if ($indicators.length) {
      for (i = 0, length = $indicators.length; i < length; i++) {
        $item = $indicators[i];
        index = parseInt($item.dataset.slideTo);
        if (this._currentIndex === index) {
          $item.classList.add(CLASS_NAME_INDICATOR_ACTIVE);
        } else {
          $item.classList.remove(CLASS_NAME_INDICATOR_ACTIVE);
        }
      }
    }
    // controls
    var $controls = this._$root.querySelectorAll(SELECTOR_NEXT_PREV);
    if (!$controls.length) {
      return;
    }
    if (this._config.loop) {
      for (i = 0, length = $controls.length; i < length; i++) {
        $controls[i].classList.add(CLASS_NAME_NEXT_PREV_SHOW);
      }
    } else {
      if (this._currentIndex === 0) {
        $controls[0].classList.remove(CLASS_NAME_NEXT_PREV_SHOW);
        $controls[1].classList.add(CLASS_NAME_NEXT_PREV_SHOW);
      } else if (this._currentIndex === this._$itemList.length - 1) {
        $controls[0].classList.add(CLASS_NAME_NEXT_PREV_SHOW);
        $controls[1].classList.remove(CLASS_NAME_NEXT_PREV_SHOW);
      } else {
        $controls[0].classList.add(CLASS_NAME_NEXT_PREV_SHOW);
        $controls[1].classList.add(CLASS_NAME_NEXT_PREV_SHOW);
      }
    }
  }

  // смена слайдов
  _move(useTransition) {
    var translateX;
    this._$items.classList.remove(TRANSITION_NONE);
    if (useTransition === false) {
      this._$items.classList.add(TRANSITION_NONE);
    }
    if (this._direction === 'none') {
      translateX = this._transform * this._width;
      this._$items.style.transform = 'translateX(' + translateX + 'px)';
      return;
    }
    if (!this._config.loop) {
      var condition = this._currentIndex + 1 >= this._$itemList.length;
      if (condition && this._direction === 'next') {
        this._autoplay('stop');
        return;
      }
      if (this._currentIndex <= 0 && this._direction === 'prev') {
        return;
      }
    }
    var step = this._direction === 'next' ? -1 : 1;
    var transform = this._transform + step;
    if (this._direction === 'next') {
      if (++this._currentIndex > this._$itemList.length - 1) {
        this._currentIndex -= this._$itemList.length;
      }
    } else {
      if (--this._currentIndex < 0) {
        this._currentIndex += this._$itemList.length;
      }
    }
    this._transform = transform;
    this._$items.dataset.translate = transform;
    translateX = transform * this._width;
    this._$items.style.transform = 'translateX(' + translateX + 'px)';
    this._$items.dispatchEvent(new CustomEvent('transition-start', {bubbles: true}));
    this._setActiveClass();
  }

  // функция для перемещения к слайду по индексу
  _moveTo(index, useTransition) {
    var currentIndex = this._currentIndex;
    this._direction = index > currentIndex ? 'next' : 'prev';
    for (var i = 0; i < Math.abs(index - currentIndex); i++) {
      this._move(useTransition);
    }
  }

  // метод для автоматической смены слайдов
  _autoplay = function(action) {
    if (!this._config.autoplay) {
      return;
    }
    if (action === 'stop') {
      clearInterval(this._intervalId);
      this._intervalId = null;
      return;
    }
    if (this._intervalId === null) {
      this._intervalId = setInterval(function() {
        this._direction = 'next';
        this._move();
      }.bind(this),
      this._config.interval
      );
    }
  }

  // добавление индикаторов
  _addIndicators() {
    if (!this._$root.querySelector('.' + CLASS_NAME_INDICATORS)) {
      let htmlString = `<ol class="${CLASS_NAME_INDICATORS}">`;
      for (let i = 0, length = this._$itemList.length; i < length; i++) {
        htmlString += `<li class="${CLASS_NAME_INDICATOR}" data-slide-to="${i}"></li>`
      }
      htmlString += '</ol>';
      this._$root.insertAdjacentHTML('beforeend', htmlString);
    }
  }

  // refresh extreme values
  _refreshExtremeValues() {
    var $itemList = this._$itemList;
    this._minOrder = parseInt($itemList[0].dataset.order);
    this._maxOrder = this._minOrder;
    this._$itemWithMinOrder = $itemList[0];
    this._$itemWithMaxOrder = this._$itemWithMinOrder;
    this._minTranslate = parseInt($itemList[0].dataset.translate);
    this._maxTranslate = this._minTranslate;
    for (var i = 0, length = $itemList.length; i < length; i++) {
      var $item = $itemList[i];
      var order = parseInt($item.dataset.order);
      if (order < this._minOrder) {
        this._minOrder = order;
        this._$itemWithMinOrder = $item;
        this._minTranslate = parseInt($item.dataset.translate);
      } else if (order > this._maxOrder) {
        this._maxOrder = order;
        this._$itemWithMaxOrder = $item;
        this._maxTranslate = parseInt($item.dataset.translate);
      }
    }
  }

  // balancing items
  _balancingItems() {
    if (!this._balancingItemsFlag) {
      return;
    }
    var $wrapper = this._$wrapper;
    var wrapperRect = $wrapper.getBoundingClientRect();
    var halfWidthItem = wrapperRect.width / 2;
    var count = this._$itemList.length;
    var translate;
    var clientRect;
    var translateX;
    if (this._direction === 'next') {
      var wrapperLeft = wrapperRect.left;
      var $min = this._$itemWithMinOrder;
      translate = this._minTranslate;
      clientRect = $min.getBoundingClientRect();
      if (clientRect.right < wrapperLeft - halfWidthItem) {
        $min.dataset.order = this._minOrder + count;
        translate += count;
        $min.dataset.translate = translate;
        translateX = translate * this._width;
        $min.style.transform = 'translateX(' + translateX + 'px)';
        this._refreshExtremeValues();
      }
    } else if (this._direction === 'prev') {
      var wrapperRight = wrapperRect.right;
      var $max = this._$itemWithMaxOrder;
      translate = this._maxTranslate;
      clientRect = $max.getBoundingClientRect();
      if (clientRect.left > wrapperRight + halfWidthItem) {
        $max.dataset.order = this._maxOrder - count;
        translate -= count;
        $max.dataset.translate = translate;
        translateX = translate * this._width;
        $max.style.transform = 'translateX(' + translateX + 'px)';
        this._refreshExtremeValues();
      }
    }
    requestAnimationFrame(this._balancingItems.bind(this));
  };

  // adding listeners
  _addEventListener() {
    var $items = this._$items;
    function onClick(e) {
      var $target = e.target;
      this._autoplay('stop');
      if ($target.classList.contains('slider__control')) {
        e.preventDefault();
        this._direction = $target.dataset.slide;
        this._move();
      } else if ($target.dataset.slideTo) {
        e.preventDefault();
        var index = parseInt($target.dataset.slideTo);
        this._moveTo(index);
      }
      if (this._config.loop) {
        this._autoplay();
      }
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
      this._$root.dispatchEvent(new CustomEvent('transition-end',
          {bubbles: true}));
    }
    function onMouseEnter() {
      this._autoplay('stop');
    }
    function onMouseLeave() {
      if (this._config.loop) {
        this._autoplay();
      }
    }
    function onSwipeStart(e) {
      this._autoplay('stop');
      if (e.target.closest('.slider__control')) {
        return;
      }
      var event = e.type.search('touch') === 0 ? e.touches[0] : e;
      this._swipeStartPosX = event.clientX;
      this._swipeStartPosY = event.clientY;
      this._hasSwipeState = true;
      this._hasSwiping = false;
    }
    function onSwipeMove(e) {
      if (!this._hasSwipeState) {
        return;
      }
      var event = e.type.search('touch') === 0 ? e.touches[0] : e;
      var diffPosX = this._swipeStartPosX - event.clientX;
      var diffPosY = this._swipeStartPosY - event.clientY;
      if (!this._hasSwiping) {
        if (Math.abs(diffPosY) > Math.abs(diffPosX) || Math.abs(diffPosX) === 0) {
          this._hasSwipeState = false;
          return;
        }
        this._hasSwiping = true;
      }
      e.preventDefault();
      if (!this._config.loop) {
        if (this._currentIndex + 1 >= this._$itemList.length && diffPosX >= 0) {
          diffPosX = diffPosX / 4;
        }
        if (this._currentIndex <= 0 && diffPosX <= 0) {
          diffPosX = diffPosX / 4;
        }
      }
      var value = (diffPosX / this._$wrapper.getBoundingClientRect().width);
      var translateX = this._transform - value;
      this._$items.classList.add(TRANSITION_NONE);
      translateX = translateX * this._width;
      this._$items.style.transform = 'translateX(' + translateX + 'px)';
    }
    function onSwipeEnd(e) {
      if (!this._hasSwipeState) {
        return;
      }
      var event = e.type.search('touch') === 0 ? e.changedTouches[0] : e;
      var diffPosX = this._swipeStartPosX - event.clientX;
      if (diffPosX === 0) {
        this._hasSwipeState = false;
        return;
      }
      if (!this._config.loop) {
        if (this._currentIndex + 1 >= this._$itemList.length && diffPosX >= 0) {
          diffPosX = diffPosX / 7;
        }
        if (this._currentIndex <= 0 && diffPosX <= 0) {
          diffPosX = diffPosX / 7;
        }
      }
      var value = (diffPosX / this._$wrapper.getBoundingClientRect().width) * 100;
      this._$items.classList.remove(TRANSITION_NONE);
      if (value > SWIPE_THRESHOLD) {
        this._direction = 'next';
        this._move();
      } else if (value < -SWIPE_THRESHOLD) {
        this._direction = 'prev';
        this._move();
      } else {
        this._direction = 'none';
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
    // click
    this._$root.addEventListener('click', onClick.bind(this));
    // transitionstart and transitionend
    if (this._config.loop) {
      $items.addEventListener('transition-start', onTransitionStart.bind(this));
      $items.addEventListener('transitionend', onTransitionEnd.bind(this));
    }
    // mouseenter and mouseleave
    if (this._config.autoplay) {
      this._$root.addEventListener('mouseenter', onMouseEnter.bind(this));
      this._$root.addEventListener('mouseleave', onMouseLeave.bind(this));
    }
    // swipe
    if (this._config.swipe) {
      var supportsPassive = false;
      try {
        var opts = Object.defineProperty({}, 'passive', {
          get: function() {
            supportsPassive = true;
          },
        });
        window.addEventListener('testPassiveListener', null, opts);
      } catch (err) {}
      this._$root.addEventListener('touchstart', onSwipeStart.bind(this),
          supportsPassive ? {passive: false} : false);
      this._$root.addEventListener('touchmove', onSwipeMove.bind(this),
          supportsPassive ? {passive: false} : false);
      this._$root.addEventListener('mousedown', onSwipeStart.bind(this));
      this._$root.addEventListener('mousemove', onSwipeMove.bind(this));
      document.addEventListener('touchend', onSwipeEnd.bind(this));
      document.addEventListener('mouseup', onSwipeEnd.bind(this));
    }
    this._$root.addEventListener('dragstart', onDragStart.bind(this));
    // при изменении активности вкладки
    document.addEventListener('visibilitychange', onVisibilityChange.bind(this));

    function onResizeObserver(entries) {
      var contentBoxSize = entries[0].contentBoxSize;
      var contentRect = entries[0].contentRect;
      var newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
      var newTranslateX;
      if (this._width.toFixed(1) === newWidth.toFixed(1)) {
        return;
      }
      this._autoplay('stop');
      this._$items.classList.add(TRANSITION_NONE);
      this._width = parseInt(newWidth.toFixed(1), 10);
      newTranslateX = newWidth * parseInt(this._$items.dataset.translate, 10);
      this._$items.style.transform = 'translateX(' + newTranslateX + 'px)';
      var $items = this._$itemList;
      for (var i = 0; i < $items.length; i++) {
        var translateX = parseInt($items[i].dataset.translate);
        newTranslateX = translateX * newWidth;
        $items[i].style.transform = 'translateX(' + newTranslateX + 'px)';
      }
      if (this._config.loop) {
        this._autoplay();
      }
    }
    if (this._supportResizeObserver) {
      var resizeObserver = new ResizeObserver(onResizeObserver.bind(this));
      resizeObserver.observe(this._$wrapper);
      return;
    }
  }

  // перейти к следующему слайду
  next() {
    this._direction = 'next';
    this._move();
  }

  // перейти к предыдущему слайду
  prev() {
    this._direction = 'prev';
    this._move();
  }

  // управление автоматической сменой слайдов
  autoplay(action) {
    this._autoplay('stop');
  }

  moveTo(index, useTransition) {
    this._moveTo(index, useTransition);
  }

}
