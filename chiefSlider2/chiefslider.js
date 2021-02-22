'use strict';

const SELECTOR_ITEM = '.slider__item';
const SELECTOR_ITEMS = '.slider__items';
const SELECTOR_WRAPPER = '.slider__wrapper';
const SELECTOR_PREV = '.slider__control[data-slide="prev"]';
const SELECTOR_NEXT = '.slider__control[data-slide="next"]';
const SELECTOR_INDICATOR = '.slider__indicators>li';

const SLIDER_TRANSITION_OFF = 'slider_disable-transition';
const CLASS_CONTROL = 'slider__control';
const CLASS_CONTROL_HIDE = 'slider__control_hide';
const CLASS_ITEM_ACTIVE = 'slider__item_active';
const CLASS_INDICATOR_ACTIVE = 'active';

function hasTouchDevice() {
  return !!('ontouchstart' in window || navigator.maxTouchPoints);
}

function hasElementInVew($elem) {
  const rect = $elem.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  const vertInView = rect.top <= windowHeight && rect.top + rect.height >= 0;
  const horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;
  return vertInView && horInView;
}

function ChiefSlider($elem, config) {
  // configuration of the slider
  this._config = {
    loop: true,
    autoplay: false,
    interval: 5000,
    pauseOnHover: true,
    refresh: true,
    swipe: true,
  };
  // slider properties
  this._widthItem = 0;
  this._widthWrapper = 0;
  this._itemsInVisibleArea = 0;
  this._transform = 0; // текущее значение трансформации
  this._transformStep = 0; // значение шага трансформации
  this._intervalId = null;
  // elements of slider
  this._$root = null; // root element of slider (default ".slider__item")
  this._$wrapper = null; // element with class ".slider__wrapper"
  this._$items = null; // element with class ".slider__items"
  this._$itemList = null; // elements with class ".slider__item"
  this._$controlPrev = null; // element with class .slider__control[data-slide="prev"]
  this._$controlNext = null; // element with class .slider__control[data-slide="next"]
  this._$indicatorList = null; // индикаторы
  // min and min order
  this._minOrder = 0;
  this._maxOrder = 0;
  // items with min and max order
  this._$itemByMinOrder = null;
  this._$itemByMaxOrder = null;
  // min and max value of translate
  this._minTranslate = 0;
  this._maxTranslate = 0;
  // default slider direction
  this._direction = 'next';
  // determines whether the position of item needs to be determined
  this._updateItemPositionFlag = false;
  this._activeItems = [];
  this._isTouchDevice = hasTouchDevice();

  // constructor
  this._init($elem, config);
  this._addEventListener();
}

// initial setup of slider
ChiefSlider.prototype._init = function ($root, config) {
  // elements of slider
  this._$root = $root;
  this._$itemList = $root.querySelectorAll(SELECTOR_ITEM);
  this._$items = $root.querySelector(SELECTOR_ITEMS);
  this._$wrapper = $root.querySelector(SELECTOR_WRAPPER);
  this._$controlPrev = $root.querySelector(SELECTOR_PREV);
  this._$controlNext = $root.querySelector(SELECTOR_NEXT);
  this._$indicatorList = $root.querySelectorAll(SELECTOR_INDICATOR);
  // create some constants
  const $itemList = this._$itemList;
  const widthItem = $itemList[0].offsetWidth;
  const widthWrapper = this._$wrapper.offsetWidth;
  const itemsInVisibleArea = Math.round(widthWrapper / widthItem);
  // initial setting properties
  this._widthItem = widthItem;
  this._widthWrapper = widthWrapper;
  this._itemsInVisibleArea = itemsInVisibleArea;
  this._transformStep = 100 / itemsInVisibleArea;
  for (let key in config) {
    if (this._config.hasOwnProperty(key)) {
      this._config[key] = config[key];
    }
  }
  // initial setting order and translate items
  for (let i = 0, length = $itemList.length; i < length; i++) {
    $itemList[i].dataset.index = i;
    $itemList[i].dataset.order = i;
    $itemList[i].dataset.translate = 0;
    if (i < itemsInVisibleArea) {
      this._activeItems.push(i);
    }
  }
  this._updateClassForActiveItems();
  // hide prev arrow for non-infinite slider
  if (!this._config.loop) {
    if (this._$controlPrev) {
      this._$controlPrev.classList.add(CLASS_CONTROL_HIDE);
    }
    return;
  }
  // translate last item before first
  const count = $itemList.length - 1;
  const translate = -$itemList.length * 100;
  $itemList[count].dataset.order = -1;
  $itemList[count].dataset.translate = -$itemList.length * 100;
  $itemList[count].style.transform = 'translateX('.concat(translate, '%)');
  // update values of extreme properties
  this._updateExtremeProperties();
  this._updateIndicators();
  // calling _autoplay
  this._autoplay();
};

// подключения обработчиков событий для слайдера
ChiefSlider.prototype._addEventListener = function () {
  const $root = this._$root;

  // on click
  $root.addEventListener('click', this._eventHandler.bind(this));

  // on hover
  if (this._config.autoplay && this._config.pauseOnHover) {
    $root.addEventListener(
      'mouseenter',
      function () {
        this._autoplay('stop');
      }.bind(this)
    );
    $root.addEventListener(
      'mouseleave',
      function () {
        this._autoplay();
      }.bind(this)
    );
  }

  // on resize
  if (this._config.refresh) {
    window.addEventListener(
      'resize',
      function () {
        window.requestAnimationFrame(this._refresh.bind(this));
      }.bind(this)
    );
  }

  // on transitionstart and transitionend
  if (this._config.loop) {
    this._$items.addEventListener(
      'transitionstart',
      function () {
        // transitionstart
        this._updateItemPositionFlag = true;
        window.requestAnimationFrame(this._updateItemPosition.bind(this));
      }.bind(this)
    );
    this._$items.addEventListener(
      'transitionend',
      function () {
        // transitionend
        this._updateItemPositionFlag = false;
      }.bind(this)
    );
  }

  // on touchstart and touchend
  if (this._isTouchDevice && this._config.swipe) {
    $root.addEventListener(
      'touchstart',
      function (e) {
        this._touchStartCoord = e.changedTouches[0].clientX;
      }.bind(this)
    );
    $root.addEventListener(
      'touchend',
      function (e) {
        const touchEndCoord = e.changedTouches[0].clientX;
        const delta = touchEndCoord - this._touchStartCoord;
        if (delta > 50) {
          this._moveToPrev();
        } else if (delta < -50) {
          this._moveToNext();
        }
      }.bind(this)
    );
  }

  // on mousedown and mouseup
  if (!this._isTouchDevice && this._config.swipe) {
    $root.addEventListener(
      'mousedown',
      function (e) {
        this._touchStartCoord = e.clientX;
      }.bind(this)
    );
    $root.addEventListener(
      'mouseup',
      function (e) {
        const touchEndCoord = e.clientX;
        const delta = touchEndCoord - this._touchStartCoord;
        if (delta > 50) {
          this._moveToPrev();
        } else if (delta < -50) {
          this._moveToNext();
        }
      }.bind(this)
    );
  }
};

// update values of extreme properties
ChiefSlider.prototype._updateExtremeProperties = function () {
  const $itemList = this._$itemList;
  this._minOrder = +$itemList[0].dataset.order;
  this._maxOrder = this._minOrder;
  this._$itemByMinOrder = $itemList[0];
  this._$itemByMaxOrder = $itemList[0];
  this._minTranslate = +$itemList[0].dataset.translate;
  this._maxTranslate = this._minTranslate;
  for (let i = 0, length = $itemList.length; i < length; i++) {
    const $item = $itemList[i];
    const order = +$item.dataset.order;
    if (order < this._minOrder) {
      this._minOrder = order;
      this._$itemByMinOrder = $item;
      this._minTranslate = +$item.dataset.translate;
    } else if (order > this._maxOrder) {
      this._maxOrder = order;
      this._$itemByMaxOrder = $item;
      this._minTranslate = +$item.dataset.translate;
    }
  }
};

// update position of item
ChiefSlider.prototype._updateItemPosition = function () {
  if (!this._updateItemPositionFlag) {
    return;
  }
  const $wrapper = this._$wrapper;
  const $wrapperClientRect = $wrapper.getBoundingClientRect();
  const widthHalfItem = $wrapperClientRect.width / this._itemsInVisibleArea / 2;
  const count = this._$itemList.length;
  if (this._direction === 'next') {
    const wrapperLeft = $wrapperClientRect.left;
    const $min = this._$itemByMinOrder;
    let translate = this._minTranslate;
    const clientRect = $min.getBoundingClientRect();
    if (clientRect.right < wrapperLeft - widthHalfItem) {
      $min.dataset.order = this._minOrder + count;
      translate += count * 100;
      $min.dataset.translate = translate;
      $min.style.transform = 'translateX('.concat(translate, '%)');
      // update values of extreme properties
      this._updateExtremeProperties();
    }
  } else {
    const wrapperRight = $wrapperClientRect.right;
    const $max = this._$itemByMaxOrder;
    let translate = this._maxTranslate;
    const clientRect = $max.getBoundingClientRect();
    if (clientRect.left > wrapperRight + widthHalfItem) {
      $max.dataset.order = this._maxOrder - count;
      translate -= count * 100;
      $max.dataset.translate = translate;
      $max.style.transform = 'translateX('.concat(translate, '%)');
      // update values of extreme properties
      this._updateExtremeProperties();
    }
  }
  // updating...
  requestAnimationFrame(this._updateItemPosition.bind(this));
};

// _updateClassForActiveItems
ChiefSlider.prototype._updateClassForActiveItems = function () {
  const activeItems = this._activeItems;
  const $itemList = this._$itemList;
  for (let i = 0, length = $itemList.length; i < length; i++) {
    const $item = $itemList[i];
    const index = +$item.dataset.index;
    if (activeItems.indexOf(index) > -1) {
      $item.classList.add(CLASS_ITEM_ACTIVE);
    } else {
      $item.classList.remove(CLASS_ITEM_ACTIVE);
    }
  }
};

// _updateIndicators
ChiefSlider.prototype._updateIndicators = function () {
  const $indicatorList = this._$indicatorList;
  const $itemList = this._$itemList;
  if (!$indicatorList.length) {
    return;
  }
  for (let index = 0, length = $itemList.length; index < length; index++) {
    const $item = $itemList[index];
    if ($item.classList.contains(CLASS_ITEM_ACTIVE)) {
      $indicatorList[index].classList.add(CLASS_INDICATOR_ACTIVE);
    } else {
      $indicatorList[index].classList.remove(CLASS_INDICATOR_ACTIVE);
    }
  }
};

// move slides
ChiefSlider.prototype._move = function () {
  if (!hasElementInVew(this._$root)) {
    return;
  }

  const step = this._direction === 'next' ? -this._transformStep : this._transformStep;
  const transform = this._transform + step;

  if (!this._config.loop) {
    const endTransformValue =
      this._transformStep * (this._$itemList.length - this._itemsInVisibleArea);
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

  const activeIndex = [];
  if (this._direction === 'next') {
    for (let i = 0, length = this._activeItems.length; i < length; i++) {
      let index = this._activeItems[i];
      let newIndex = ++index;
      if (newIndex > this._$itemList.length - 1) {
        newIndex -= this._$itemList.length;
      }
      activeIndex.push(newIndex);
    }
  } else {
    for (let i = 0, length = this._activeItems.length; i < length; i++) {
      let index = this._activeItems[i];
      let newIndex = --index;
      if (newIndex < 0) {
        newIndex += this._$itemList.length;
      }
      activeIndex.push(newIndex);
    }
  }
  this._activeItems = activeIndex;
  this._updateClassForActiveItems();
  this._updateIndicators();

  this._transform = transform;
  this._$items.style.transform = 'translateX('.concat(transform, '%)');
};

// _moveToNext
ChiefSlider.prototype._moveToNext = function () {
  this._direction = 'next';
  this._move();
};

// _moveToPrev
ChiefSlider.prototype._moveToPrev = function () {
  this._direction = 'prev';
  this._move();
};

// _moveTo
ChiefSlider.prototype._moveTo = function (index) {
  const $indicatorList = this._$indicatorList;
  let nearestIndex = null;
  let diff = null;
  for (let i = 0, length = $indicatorList.length; i < length; i++) {
    const $indicator = $indicatorList[i];
    if ($indicator.classList.contains(CLASS_INDICATOR_ACTIVE)) {
      const slideTo = +$indicator.dataset.slideTo;
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
  for (let i = 1; i <= Math.abs(diff); i++) {
    this._move();
  }
};

// обработчик click для слайдера
ChiefSlider.prototype._eventHandler = function (e) {
  const $target = e.target;
  this._autoplay('stop');
  if ($target.classList.contains(CLASS_CONTROL)) {
    // при клике на кнопки влево и вправо
    e.preventDefault();
    this._direction = $target.dataset.slide;
    this._move();
  } else if ($target.dataset.slideTo) {
    // при клике на индикаторы
    const index = +$target.dataset.slideTo;
    this._moveTo(index);
  }
  this._autoplay();
};

// _autoplay
ChiefSlider.prototype._autoplay = function (action) {
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
      function () {
        this._direction = 'next';
        this._move();
      }.bind(this),
      this._config.interval
    );
  }
};

// _refresh
ChiefSlider.prototype._refresh = function () {
  // create some constants
  const $itemList = this._$itemList;
  const widthItem = $itemList[0].offsetWidth;
  const widthWrapper = this._$wrapper.offsetWidth;
  const itemsInVisibleArea = Math.round(widthWrapper / widthItem);

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
  this._updateItemPositionFlag = false;
  this._activeItems = [];

  // setting order and translate items after reset
  for (let i = 0, length = $itemList.length; i < length; i++) {
    const $item = $itemList[i];
    const position = i;
    $item.dataset.index = position;
    $item.dataset.order = position;
    $item.dataset.translate = 0;
    $item.style.transform = 'translateX(0)';
    if (position < itemsInVisibleArea) {
      this._activeItems.push(position);
    }
  }

  this._updateClassForActiveItems();

  window.requestAnimationFrame(
    function () {
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
  const count = $itemList.length - 1;
  const translate = -$itemList.length * 100;
  $itemList[count].dataset.order = -1;
  $itemList[count].dataset.translate = -$itemList.length * 100;
  $itemList[count].style.transform = 'translateX('.concat(translate, '%)');
  // update values of extreme properties
  this._updateExtremeProperties();
  this._updateIndicators();
  // calling _autoplay
  this._autoplay();
};

// public
ChiefSlider.prototype.next = function () {
  this._moveToNext();
};
ChiefSlider.prototype.prev = function () {
  this._moveToPrev();
};
ChiefSlider.prototype.moveTo = function (index) {
  this._moveTo(index);
};
ChiefSlider.prototype.refresh = function () {
  this._refresh();
};
