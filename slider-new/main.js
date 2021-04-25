function isTouchDevice () {
  return !!('ontouchstart' in window || navigator.maxTouchPoints);
}

// eslint-disable-next-line no-unused-vars
function Slider(selector, config) {
  this._slider = document.querySelector(selector); // основный элемент блока
  this._sliderContainer = this._slider.querySelector('.slider__items'); // контейнер для .slider-item
  this._sliderItems = this._slider.querySelectorAll('.slider__item'); // коллекция .slider-item
  this._sliderControls = this._slider.querySelectorAll('.slider__control'); // элементы управления
  this._currentPosition = 0; // позиция левого активного элемента
  this._transformValue = 0; // значение трансформации .slider_wrapper
  this._transformStep = 100; // величина шага (для трансформации)
  this._itemsArray = []; // массив элементов
  this._timerId;
  this._indicatorItems;
  this._indicatorIndex = 0;
  this._indicatorIndexMax = this._sliderItems.length - 1;
  this._stepTouch = 50;
  this._config = {
    isAutoplay: false, // автоматическая смена слайдов
    directionAutoplay: 'next', // направление смены слайдов
    delayAutoplay: 5000, // интервал между автоматической сменой слайдов
    isPauseOnHover: true // устанавливать ли паузу при поднесении курсора к слайдеру
  };

  // настройка конфигурации слайдера в зависимости от полученных ключей
  for (var key in config) {
    if (key in this._config) {
      this._config[key] = config[key];
    }
  }

  // наполнение массива _itemsArray
  for (var i = 0, length = this._sliderItems.length; i < length; i++) {
    this._itemsArray.push({ item: this._sliderItems[i], position: i, transform: 0 });
  }
  // добавляем индикаторы к слайдеру
  this._addIndicators();
  // устанавливаем обработчики для событий
  this._setUpListeners();
  // запускаем автоматическую смену слайдов, если установлен соответствующий ключ
  this._startAutoplay();
}
// переменная position содержит методы с помощью которой можно получить минимальный и максимальный индекс элемента, а также соответствующему этому индексу позицию

Slider.prototype.getItemIndex = function (mode) {
  var index = 0;
  for (var i = 0, length = this._itemsArray.length; i < length; i++) {
    if ((this._itemsArray[i].position < this._itemsArray[index].position && mode === 'min') || (this._itemsArray[i].position > this._itemsArray[index].position && mode === 'max')) {
      index = i;
    }
  }
  return index;
};
Slider.prototype.getItemPosition = function (mode) {
  return this._itemsArray[this.getItemIndex(mode)].position;
};

// функция, выполняющая смену слайда в указанном направлении
Slider.prototype._move = function (direction) {
  var nextItem, currentIndicator = this._indicatorIndex;
  if (direction === 'next') {
    this._currentPosition++;
    if (this._currentPosition > this.getItemPosition('max')) {
      nextItem = this.getItemIndex('min');
      this._itemsArray[nextItem].position = this.getItemPosition('max') + 1;
      this._itemsArray[nextItem].transform += this._itemsArray.length * 100;
      this._itemsArray[nextItem].item.style.transform = 'translateX(' + this._itemsArray[nextItem].transform + '%)';
    }
    this._transformValue -= this._transformStep;
    this._indicatorIndex = this._indicatorIndex + 1;
    if (this._indicatorIndex > this._indicatorIndexMax) {
      this._indicatorIndex = 0;
    }
  } else {
    this._currentPosition--;
    if (this._currentPosition < this.getItemPosition('min')) {
      nextItem = this.getItemIndex('max');
      this._itemsArray[nextItem].position = this.getItemPosition('min') - 1;
      this._itemsArray[nextItem].transform -= this._itemsArray.length * 100;
      this._itemsArray[nextItem].item.style.transform = 'translateX(' + this._itemsArray[nextItem].transform + '%)';
    }
    this._transformValue += this._transformStep;
    this._indicatorIndex = this._indicatorIndex - 1;
    if (this._indicatorIndex < 0) {
      this._indicatorIndex = this._indicatorIndexMax;
    }
  }
  this._sliderContainer.style.transform = 'translateX(' + this._transformValue + '%)';
  this._indicatorItems[currentIndicator].classList.remove('active');
  this._indicatorItems[this._indicatorIndex].classList.add('active');
};

// функция, осуществляющая переход к слайду по его порядковому номеру
Slider.prototype._moveTo = function (index) {
  var i = 0, direction = (index > this._indicatorIndex) ? 'next' : 'prev';
  while (index !== this._indicatorIndex && i <= this._indicatorIndexMax) {
    this._move(direction);
    i++;
  }
};

// функция для запуска автоматической смены слайдов через промежутки времени
Slider.prototype._startAutoplay = function () {
  if (!this._config.isAutoplay) {
    return;
  }
  this._stopAutoplay();
  this._timerId = setInterval(function () {
    this._move(this._config.directionAutoplay);
  }, this._config.delayAutoplay);
};

// функция, отключающая автоматическую смену слайдов
Slider.prototype._stopAutoplay = function () {
  clearInterval(this._timerId);
};

// функция, добавляющая индикаторы к слайдеру
Slider.prototype._addIndicators = function () {
  var indicatorsContainer = document.createElement('ol');
  indicatorsContainer.classList.add('slider__indicators');
  for (var i = 0, length = this._sliderItems.length; i < length; i++) {
    var sliderIndicatorsItem = document.createElement('li');
    if (i === 0) {
      sliderIndicatorsItem.classList.add('active');
    }
    sliderIndicatorsItem.setAttribute('data-slide-to', i);
    indicatorsContainer.appendChild(sliderIndicatorsItem);
  }
  this._slider.appendChild(indicatorsContainer);
  this._indicatorItems = this._slider.querySelectorAll('.slider__indicators > li');
};



// функция, осуществляющая установку обработчиков для событий
Slider.prototype._setUpListeners = function () {
  var _startX = 0;
  var that = this;

  

  if (isTouchDevice()) {
    this._slider.addEventListener('touchstart', function (e) {
      that._startX = e.changedTouches[0].clientX;
      that._startAutoplay();
    });
    this._slider.addEventListener('touchend', function (e) {
      var
        _endX = e.changedTouches[0].clientX,
        _deltaX = _endX - _startX;
      if (_deltaX > this._stepTouch) {
        that._move('prev');
      } else if (_deltaX < -this._stepTouch) {
        that._move('next');
      }
      that._startAutoplay();
    });
  } else {
    for (var i = 0, length = this._sliderControls.length; i < length; i++) {
      this._sliderControls[i].classList.add('slider__control_show');
    }
  }
  this._slider.addEventListener('click', function (e) {
    if (e.target.classList.contains('slider__control')) {
      e.preventDefault();
      that._move(e.target.classList.contains('slider__control_next') ? 'next' : 'prev');
      that._startAutoplay();
    } else if (e.target.getAttribute('data-slide-to')) {
      e.preventDefault();
      that._moveTo(parseInt(e.target.getAttribute('data-slide-to')));
      that._startAutoplay();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      that._stopAutoplay();
    } else {
      that._startAutoplay();
    }
  }, false);
  if (this._config.isPauseOnHover && this._config.isAutoplay) {
    this._slider.addEventListener('mouseenter', function () {
      that._stopAutoplay();
    });
    this._slider.addEventListener('mouseleave', function () {
      that._startAutoplay();
    });
  }
};

Slider.prototype._init = function(){
  // добавляем индикаторы к слайдеру
  this._addIndicators();
  // устанавливаем обработчики для событий
  this._setUpListeners();
  // запускаем автоматическую смену слайдов, если установлен соответствующий ключ
  this._startAutoplay();
};




// метод слайдера для перехода к следующему слайду
Slider.prototype.next = function () {
  this._move('next');
};
// метод слайдера для перехода к предыдущему слайду
Slider.prototype.left = function () {
  this._move('prev');
};
// метод отключающий автоматическую смену слайдов
Slider.prototype.stop = function () {
  this._config.isAutoplay = false;
  this._stopAutoplay();
};
// метод запускающий автоматическую смену слайдов
Slider.prototype.cycle = function () {
  this._config.isAutoplay = true;
  this._startAutoplay();
};
