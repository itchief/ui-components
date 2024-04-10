const now = new Date();
const month = now.toLocaleString('default', { month: 'long' });
const weekday = now.toLocaleString('default', { weekday: 'long' });
const day = now.toLocaleString('default', { day: '2-digit' });
const year = now.toLocaleString('default', { year: 'numeric' });

document.querySelector('.calendar-month').textContent = month;
document.querySelector('.calendar-weekday').textContent = weekday;
document.querySelector('.calendar-day').textContent = day;
document.querySelector('.calendar-year').textContent = year;
