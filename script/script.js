// Глобальные переменные
let allNumbers = [];
const HISTORY_KEY = "phoneNumberHistory";
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'all';


// Инициализация при загрузке страницы
window.addEventListener("DOMContentLoaded", () => {
  // Устанавливаем тему
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }

  // Инициализация пагинации
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderList();
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(allNumbers.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderList();
    }
  });

  // Загружаем историю и отображаем
  const historyNumbers = loadHistory();
  if (historyNumbers.length > 0) {
    allNumbers = historyNumbers;
    renderList();
  }
});

// Переключение темы
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});

// Функции работы с localStorage
function loadStatus() {
  try {
    return JSON.parse(localStorage.getItem("numberStatus")) || {};
  } catch {
    return {};
  }
}

function saveStatus(status) {
  localStorage.setItem("numberStatus", JSON.stringify(status));
}

function saveToHistory(numbers) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  numbers.forEach(num => {
    if (!history.includes(num)) {
      history.push(num);
    }
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

// Обновление статуса номера
function updateStatus(number, state) {
  const status = loadStatus();
  status[number] = state;
  saveStatus(status);
  renderList();
}

// Генерация телефонных номеров
function generatePhoneNumbers(count) {
    const prefix = document.getElementById("prefix").value.trim();
    const quantity = parseInt(count);
  
    if (!/^7\d{0,9}$/.test(prefix)) {
      alert("Префикс должен начинаться с '7' и содержать максимум 10 цифр.");
      return;
    }
  
    if (isNaN(quantity) || quantity < 1 || quantity > 999) {
      alert("Введите корректное количество номеров (1–999).");
      return;
    }
  
    const missingDigits = 11 - prefix.length;
    const existingNumbers = new Set(loadHistory());
    const newNumbers = new Set();
  
    const totalPossible = Math.pow(10, missingDigits);
    
    // Создаем массив всех возможных суффиксов
    const allPossibleSuffixes = [];
    for (let i = 0; i < totalPossible; i++) {
      allPossibleSuffixes.push(String(i).padStart(missingDigits, '0'));
    }
  
    // Перемешиваем массив суффиксов
    shuffleArray(allPossibleSuffixes);
  
    if (quantity >= totalPossible) {
      // Если запрошено больше или равно чем возможно, берем все перемешанные
      for (const suffix of allPossibleSuffixes) {
        const fullNum = prefix + suffix;
        if (!existingNumbers.has(fullNum)) {
          newNumbers.add(fullNum);
        }
      }
    } else {
      // Берем только необходимое количество из перемешанного массива
      let added = 0;
      for (const suffix of allPossibleSuffixes) {
        if (added >= quantity) break;
        
        const fullNum = prefix + suffix;
        if (!existingNumbers.has(fullNum)) {
          newNumbers.add(fullNum);
          added++;
        }
      }
    }
  
    if (newNumbers.size === 0) {
      alert("Не удалось сгенерировать новые уникальные номера. Возможно, все комбинации уже использованы.");
      return;
    }
  
    // Преобразуем Set в массив и дополнительно перемешиваем на случай если взяли подпоследовательность
    allNumbers = Array.from(newNumbers);
    shuffleArray(allNumbers);
    
    saveToHistory(allNumbers);
    currentPage = 1;
    renderList();
  
    if (quantity > newNumbers.size) {
      alert(`Запрошено: ${quantity}\nСгенерировано: ${newNumbers.size}\nНе хватило уникальных комбинаций.`);
    }
  }
  
  // Функция для перемешивания массива (алгоритм Фишера-Йетса)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
// Показать всю историю номеров
function showAllHistoryNumbers() {
  const historyNumbers = loadHistory();
  if (historyNumbers.length === 0) {
    alert("История номеров пуста.");
    return;
  }
  
  allNumbers = historyNumbers;
  currentPage = 1;
  currentFilter = 'all';
  renderList();
  
  alert(`Всего в истории: ${historyNumbers.length} номеров`);
}

// Отрисовка списка номеров с пагинацией
function renderList(filter = currentFilter) {
  currentFilter = filter;
  const phoneList = document.getElementById("phoneList");
  const numberList = document.getElementById("numberList");
  const statusSummary = document.getElementById("statusSummary");

  phoneList.innerHTML = "";
  numberList.innerText = "";
  if (statusSummary) statusSummary.innerHTML = "";

  const status = loadStatus();
  const lines = [];
  const filteredNumbers = allNumbers.filter(num => {
    const s = status[num] || 'uncalled';
    return filter === 'all' || s === filter;
  });

  // Обновляем информацию о пагинации
  updatePaginationInfo(filteredNumbers.length);

  // Получаем номера для текущей страницы
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageNumbers = filteredNumbers.slice(startIndex, endIndex);

  // Счетчики статусов
  const counters = {
    uncalled: 0,
    called: 0,
    alive: 0,
    bad: 0
  };

  allNumbers.forEach(num => {
    const s = status[num] || 'uncalled';
    counters[s] = (counters[s] || 0) + 1;
  });

  // Отображаем сводку по статусам
  if (statusSummary) {
    statusSummary.innerHTML = `
      <span class="status-uncalled">Не прозвонено: ${counters.uncalled}</span>
      <span class="status-called">Прозвонено: ${counters.called}</span>
      <span class="status-alive">Живые: ${counters.alive}</span>
      <span class="status-bad">Нерабочие: ${counters.bad}</span>
    `;
  }

  // Отрисовываем номера на текущей странице
  pageNumbers.forEach(num => {
    const s = status[num] || 'uncalled';
    const div = document.createElement("div");
    div.className = `phone-item ${s === 'called' ? 'called' : s === 'bad' ? 'bad-number' : s === 'alive' ? 'alive-number' : s === 'cut' ? 'cut-number' : ''}`;
  
    let label = "";
    if (s === "bad") label = " (нерабочий)";
    if (s === "alive") label = "(Живой)";
    if (s === "called") label = " (звонили)";
    if (s === "cut") label = " <span class='cut-label'>(срез)</span>";
  
    div.innerHTML = `
      <div class="number">
        <button class="copy-button" onclick="copyToClipboard('${num}')">📋</button>
        <span>${num}</span> ${label}
      </div>
      <div class="buttons">
        <button class="call-button" onclick="callNumber('${num}')">📞 Позвонить</button>
        <button class="bad-button" onclick="updateStatus('${num}', 'bad')">Не рабочий</button>
        <button class="alive-button" onclick="updateStatus('${num}', 'alive')">Не взял</button>
        <button class="cut-button" onclick="updateStatus('${num}', 'cut')">✂️ Срез</button>
       
      </div>
    `;
  
    phoneList.appendChild(div);
  
    lines.push(num + label.replace(/<[^>]+>/g, '')); // убираем HTML из текста для текстового списка
  });

  numberList.innerText = lines.join("\n");
  
}

  
// Обновление информации о пагинации
function updatePaginationInfo(totalFiltered) {
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  document.getElementById('pageInfo').textContent = `Страница ${currentPage} из ${totalPages}`;
  
  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= totalPages || totalPages === 0;
}

// Звонок по номеру
function callNumber(number) {
  try {
    const link = document.createElement("a");
    link.href = "sip:" + number;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    alert("Ошибка при попытке SIP-звонка. Убедитесь, что MicroSIP установлен.");
  }
  updateStatus(number, "called");
}

// Фильтрация номеров
function filterNumbers(state) {
  currentPage = 1;
  currentFilter = state;
  renderList(state);
}

// Очистка истории
function clearCallHistory() {
  if (confirm("Удалить ВСЕ данные (номера, статусы, историю)?")) {
    localStorage.removeItem("numberStatus");
    localStorage.removeItem(HISTORY_KEY);
    allNumbers = [];
    currentPage = 1;
    document.getElementById("phoneList").innerHTML = "";
    document.getElementById("numberList").innerText = "";
    document.getElementById("statusSummary").innerHTML = "";
    updatePaginationInfo(0);
  }
}

// Экспорт в Excel
function exportToExcel() {
  if (typeof XLSX === 'undefined') {
      alert("Библиотека для экспорта не загружена. Пожалуйста, обновите страницу.");
      return;
  }

  if (allNumbers.length === 0) {
      alert("Нет номеров для экспорта.");
      return;
  }

  const status = loadStatus();
  const data = allNumbers.map(num => ({
      "Номер телефона": num,
      "Статус": status[num] === 'called' ? 'Позвонили' : 
               status[num] === 'bad' ? 'Не рабочий' : 
               status[num] === 'alive' ? 'Живой' : 'Не звонили'
  }));

  try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Телефонные номера");
      XLSX.writeFile(workbook, "телефонные_номера.xlsx");
  } catch (error) {
      console.error("Ошибка экспорта:", error);
      alert("Ошибка при экспорте: " + error.message);
  }
}

// Экспорт в TXT
function exportToTxt() {
  const status = loadStatus();
  const lines = allNumbers.map(num => {
    const s = status[num] || 'uncalled';
    let label = "";
    if (s === "bad") label = " (нерабочий)";
    if (s === "alive") label = " (живой)";
    if (s === "called") label = " (звонили)";
    return num + label;
  });

  if (lines.length === 0) {
    alert("Нет номеров для экспорта.");
    return;
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "номера.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Загрузка из TXT
function loadFromTxt() {
  const fileInput = document.getElementById("uploadTxt");
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const filtered = lines.filter(line => /^7\d{10}$/.test(line));
    allNumbers = filtered;
    saveToHistory(filtered);
    currentPage = 1;
    renderList();
  };
  reader.readAsText(file);
}

// Загрузка из Excel
function loadFromExcel() {
  const fileInput = document.getElementById("uploadExcel");
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      const numbers = [];
      jsonData.forEach(row => {
        for (const key in row) {
          const value = String(row[key]).trim();
          if (/^7\d{10}$/.test(value)) {
            numbers.push(value);
            break;
          }
        }
      });

      if (numbers.length === 0) {
        alert("Не найдено подходящих номеров телефонов в формате 7XXXXXXXXXX");
        return;
      }

      allNumbers = numbers;
      saveToHistory(numbers);
      currentPage = 1;
      renderList();
      alert(`Успешно загружено ${numbers.length} номеров из Excel файла`);

    } catch (error) {
      console.error("Ошибка при чтении Excel файла:", error);
      alert("Ошибка при чтении Excel файла: " + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// 🔍 Поиск по номеру
function searchPhoneNumber() {
    const input = document.getElementById('searchInput').value.trim();
    const phoneList = document.getElementById('phoneList');
    const items = phoneList.querySelectorAll('.phone-item');
  
    items.forEach(item => {
      const number = item.querySelector('.number span').textContent;
      if (number.includes(input)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  }
  
  /*копирование**/
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      updateStatus(text, "called"); // 👈 Обновляем статус
      showCopyNotification(`Скопировано: ${text}`);
    }).catch(err => {
      console.error('Ошибка копирования:', err);
      showCopyNotification("Ошибка копирования", true);
    });
  }
  
  
  function showCopyNotification(message, isError = false) {
    let notification = document.createElement("div");
    notification.className = `copy-notification ${isError ? 'error' : ''}`;
    notification.innerHTML = `✔️ ${message}`;
    document.body.appendChild(notification);
  
    setTimeout(() => {
      notification.classList.add("show");
    }, 10); // задержка для анимации
  
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000); // 2 секунды видимости
  }
  
  /******Login*******/

  