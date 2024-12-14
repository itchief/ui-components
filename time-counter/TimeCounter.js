export default class TimeCounter {
  constructor(startDate, updateCallback) {
    this.startDate = new Date(startDate); // Указанная дата
    this.updateCallback = updateCallback; // Функция обновления UI
    this.intervalId = null; // ID интервала
    this.prevValues = {}; // Предыдущие значения таймера для оптимизации обновления
    this.start();
  }

  // Склонение чисел (то есть, "1 день", "2 дня", "5 дней")
  static declensionNum(num, words) {
    return words[(num % 100 > 4 && num % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(num % 10 < 5) ? num % 10 : 5]];
  }

  // Запуск таймера
  start() {
    this.update(); // Мгновенное обновление
    this.intervalId = setInterval(() => this.update(), 1000); // Обновление каждую секунду
  }

  // Остановка таймера (например, перед удалением объекта)
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Обновление таймера
  update() {
    const now = new Date();
    const diff = now - this.startDate;

    // Вычисление значений
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    // Получение подписей
    const daysTitle = TimeCounter.declensionNum(days, ['день', 'дня', 'дней']);
    const hoursTitle = TimeCounter.declensionNum(+hours, ['час', 'часа', 'часов']);
    const minutesTitle = TimeCounter.declensionNum(+minutes, ['минута', 'минуты', 'минут']);
    const secondsTitle = TimeCounter.declensionNum(+seconds, ['секунда', 'секунды', 'секунд']);

    const currentValues = { days, hours, minutes, seconds, daysTitle, hoursTitle, minutesTitle, secondsTitle };

    // Проверка изменений значений перед вызовом обновления
    if (JSON.stringify(currentValues) !== JSON.stringify(this.prevValues)) {
      this.updateCallback(currentValues);
      this.prevValues = currentValues;
    }
  }
}
