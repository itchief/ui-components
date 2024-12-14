// Класс для создания таймера обратного отсчета
export default class CountdownTimer {
  /**
   * Конструктор таймера обратного отсчёта.
   * @param {Date} deadline - Дата окончания таймера.
   * @param {Function} onUpdate - Callback-функция, вызываемая при обновлении времени.
   * @param {Function} onComplete - Callback-функция, вызываемая при завершении таймера.
   */
  constructor(deadline, onUpdate, onComplete) {
    if (!(deadline instanceof Date)) {
      throw new Error('`deadline` должен быть объектом Date.');
    }

    this.deadline = deadline;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.timerId = null;

    this.start();
  }

  /**
   * Статический метод для склонения числительных.
   * @param {number} num - Число для склонения.
   * @param {Array<string>} words - Массив вариантов (например, ['день', 'дня', 'дней']).
   * @returns {string} - Слово в правильной форме.
   */
  static declensionNum = (num, words) => words[num % 100 > 4 && num % 100 < 20 ? 2 : [2, 0, 1, 1, 1, 2][(num % 10 < 5) ? num % 10 : 5]];

  /**
   * Запуск таймера.
   */
  start = () => {
    this.update(); // Немедленное обновление
    this.timerId = setInterval(this.update, 1000); // Обновление каждую секунду
  };

  /**
   * Остановка таймера.
   */
  stop = () => {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  };

  /**
   * Расчёт оставшегося времени.
   * @returns {Object} - Объект с данными о времени.
   */
  calculateTime = () => {
    const now = new Date();
    const diff = Math.max(0, this.deadline - now); // Гарантируем, что diff >= 0

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, diff };
  };

  /**
   * Форматирование времени.
   * @param {number} value - Число для форматирования.
   * @returns {string} - Отформатированное число с ведущим нулём.
   */
  formatTime = (value) => String(value).padStart(2, '0');

  /**
   * Обновление таймера.
   */
  update = () => {
    const { days, hours, minutes, seconds, diff } = this.calculateTime();

    const formattedTime = {
      days: this.formatTime(days),
      hours: this.formatTime(hours),
      minutes: this.formatTime(minutes),
      seconds: this.formatTime(seconds),
      daysTitle: CountdownTimer.declensionNum(days, ['день', 'дня', 'дней']),
      hoursTitle: CountdownTimer.declensionNum(hours, ['час', 'часа', 'часов']),
      minutesTitle: CountdownTimer.declensionNum(minutes, ['минута', 'минуты', 'минут']),
      secondsTitle: CountdownTimer.declensionNum(seconds, ['секунда', 'секунды', 'секунд']),
    };

    // Вызываем callback для обновления UI
    this.onUpdate?.(formattedTime);

    // Останавливаем таймер, если время истекло
    if (diff === 0) {
      this.stop();
      this.onComplete?.();
    }
  };
}
