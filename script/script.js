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
// Генерация телефонных номеров с учетом диапазона
function generatePhoneNumbers(count) {
  const prefix = document.getElementById("prefix").value.trim();
  const quantity = parseInt(count);
  const rangeStart = parseInt(document.getElementById("rangeStart").value);
  const rangeEnd = parseInt(document.getElementById("rangeEnd").value);

  if (!/^7\d{0,9}$/.test(prefix)) {
    alert("Префикс должен начинаться с '7' и содержать максимум 10 цифр.");
    return;
  }

  if (isNaN(quantity) || quantity < 1 || quantity > 999) {
    alert("Введите корректное количество номеров (1–999).");
    return;
  }

  // Проверка диапазона, если указан
  let useRange = false;
  if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
    if (rangeStart >= rangeEnd) {
      alert("Начало диапазона должно быть меньше конца");
      return;
    }
    if (rangeStart < 0 || rangeEnd > 9999) {
      alert("Диапазон должен быть между 0000 и 9999");
      return;
    }
    useRange = true;
  }

  const missingDigits = 11 - prefix.length;
  const existingNumbers = new Set(loadHistory());
  const newNumbers = new Set();

  if (useRange) {
    // Генерация в указанном диапазоне
    const rangeSize = rangeEnd - rangeStart + 1;
    
    if (quantity > rangeSize) {
      alert(`Запрошено ${quantity} номеров, но в диапазоне только ${rangeSize} возможных комбинаций.`);
      return;
    }
    
    // Создаем массив всех чисел в диапазоне и перемешиваем
    const rangeNumbers = [];
    for (let i = rangeStart; i <= rangeEnd; i++) {
      rangeNumbers.push(String(i).padStart(missingDigits, '0'));
    }
    shuffleArray(rangeNumbers);
    
    // Берем нужное количество из перемешанного массива
    for (let i = 0; i < Math.min(quantity, rangeNumbers.length); i++) {
      const fullNum = prefix + rangeNumbers[i];
      if (!existingNumbers.has(fullNum)) {
        newNumbers.add(fullNum);
      }
    }
  } else {
    // Стандартная генерация (как было раньше)
    const totalPossible = Math.pow(10, missingDigits);
    const allPossibleSuffixes = [];
    
    for (let i = 0; i < totalPossible; i++) {
      allPossibleSuffixes.push(String(i).padStart(missingDigits, '0'));
    }
    
    shuffleArray(allPossibleSuffixes);
    
    if (quantity >= totalPossible) {
      for (const suffix of allPossibleSuffixes) {
        const fullNum = prefix + suffix;
        if (!existingNumbers.has(fullNum)) {
          newNumbers.add(fullNum);
        }
      }
    } else {
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
  }

  if (newNumbers.size === 0) {
    alert("Не удалось сгенерировать новые уникальные номера. Возможно, все комбинации уже использованы.");
    return;
  }

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
    bad: 0,
    cut: 0
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
  <span class="status-cut">Срезанные: ${counters.cut}</span>
`;

  }

  // Отрисовываем номера на текущей странице
  pageNumbers.forEach(num => {
    const s = status[num] || 'uncalled';
    const div = document.createElement("div");
    div.className = `phone-item ${s === 'called' ? 'called' : s === 'bad' ? 'bad-number' : s === 'alive' ? 'alive-number' : s === 'cut' ? 'cut-number' : ''}`;
  
    // Текстовая метка
    let labelText = "";
    // HTML метка
    let labelHtml = "";
  
    if (s === "bad") {
      labelText = " (нерабочий)";
      labelHtml = " (нерабочий)";
    }
    if (s === "alive") {
      labelText = " (живой)";
      labelHtml = " ";
    }
    if (s === "called") {
      labelText = " (звонили)";
      labelHtml = " (звонили)";
    }
    if (s === "cut") {
      labelText = " (срез)";
      labelHtml = " <span class='cut-label'>(срез)</span>";
    }
  
    div.innerHTML = `
      <div class="number">
        <button class="copy-button" onclick="copyToClipboard('${num}')">📋</button>
        <span>${num}</span> ${labelHtml}
      </div>
      <div class="buttons">
        <button class="call-button" onclick="callNumber('${num}')">📞 Позвонить</button>
        <button class="bad-button" onclick="updateStatus('${num}', 'bad')">Не рабочий</button>
        <button class="alive-button" onclick="updateStatus('${num}', 'alive')">Не взял</button>
        <button class="cut-button" onclick="updateStatus('${num}', 'cut')">✂️ Срез</button>
      </div>
    `;
  
    phoneList.appendChild(div);
    lines.push(num + labelText); // ТОЛЬКО текстовая версия
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
  
    // ✅ Удалим выделение у всех других номеров
    document.querySelectorAll(".phone-item").forEach(item => {
      item.classList.remove("calling-now");
    });
  
    // ✅ Найдём и выделим текущий
    const matchingItem = Array.from(document.querySelectorAll(".phone-item"))
      .find(item => item.querySelector(".number span").textContent === number);
    
    if (matchingItem) {
      matchingItem.classList.add("calling-now");
    }
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
    
    const status = loadStatus(); // Загружаем текущие статусы
    let newNumbers = []; // Для хранения новых номеров
    
    lines.forEach(line => {
      // Ищем номер телефона (формат 7XXXXXXXXXX)
      const phoneMatch = line.match(/^(7\d{10})/);
      if (!phoneMatch) return;
      
      const phoneNumber = phoneMatch[1];
      newNumbers.push(phoneNumber);
      
      // Проверяем наличие статуса в строке
      if (line.includes("(нерабочий)")) {
        status[phoneNumber] = "bad";
      } else if (line.includes("(живой)")) {
        status[phoneNumber] = "alive";
      } else if (line.includes("(звонили)")) {
        status[phoneNumber] = "called";
      } else if (line.includes("(срез)")) {
        status[phoneNumber] = "cut";
      }
      // Если статус не указан, оставляем как есть (или 'uncalled' по умолчанию)
    });

    if (newNumbers.length === 0) {
      alert("Не найдено подходящих номеров телефонов в формате 7XXXXXXXXXX");
      return;
    }

    // Сохраняем новые номера в историю
    saveToHistory(newNumbers);
    // Сохраняем обновленные статусы
    saveStatus(status);
    
    allNumbers = newNumbers;
    currentPage = 1;
    renderList();
    alert(`Успешно загружено ${newNumbers.length} номеров из TXT файла`);
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
  
  /******Check*******/

  document.getElementById('checkButton').addEventListener('click', showCheckModal);

  function showCheckModal() {
    const modal = document.getElementById('checkModal');
    const checkPhoneList = document.getElementById('checkPhoneList');
  
    // Статичный список нужных номеров
    const fixedNumbers = [
      { number: '78127402640', label: 'Ибис СПБ' },
      { number: '74956607500', label: 'Ибис МСК' },
      { number: '+7 (495) 797-87-16', label: 'Библиотека' },
      { number: '74959999999', label: 'Яндекс такси' },
      
    ];
  
    checkPhoneList.innerHTML = '';
  
    fixedNumbers.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'modal-phone-item';
      div.innerHTML = `
        <div>
          <strong>${entry.number}</strong> ${entry.label ? `– ${entry.label}` : ''}
        </div>
        <button onclick="callNumber('${entry.number}')">📞 Позвонить</button>
      `;
      checkPhoneList.appendChild(div);
    });
  
    modal.style.display = 'block';
  }
  

function closeCheckModal() {
  document.getElementById('checkModal').style.display = 'none';
}


/*футер*/

window.addEventListener("DOMContentLoaded", () => {
    const footer = document.getElementById("updateFooter");
    const now = new Date();
  
    const formatted = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  
    if (footer) {
      footer.textContent = `Страница была обновлена в – ${formatted}`;
    }
  });
  