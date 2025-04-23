document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  });
  
  window.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
  });
  
      let allNumbers = [];
      const HISTORY_KEY = "phoneNumberHistory";
  
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
        // Добавляем новые номера, исключая дубликаты
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
  
      function updateStatus(number, state) {
        const status = loadStatus();
        status[number] = state;
        saveStatus(status);
        renderList(allNumbers);
      }
  
      function generatePhoneNumbers(count) {
        const prefix = document.getElementById("prefix").value.trim();
        const quantity = parseInt(count);
        if (!prefix.startsWith("7") || prefix.length > 10) {
          alert("Префикс должен начинаться с '7' и содержать максимум 10 цифр.");
          return;
        }
        if (isNaN(quantity) || quantity < 1 || quantity > 999) {
          alert("Введите корректное количество номеров (1–999).");
          return;
        }
  
        const missingDigits = 11 - prefix.length;
        const newNumbers = [];
        for (let i = 0; i < quantity; i++) {
          const rand = Math.floor(Math.pow(10, missingDigits - 1) + Math.random() * 9 * Math.pow(10, missingDigits - 1));
          const fullNum = prefix + rand;
          newNumbers.push(fullNum);
        }
        allNumbers = newNumbers;
        saveToHistory(newNumbers);
        renderList(newNumbers);
      }
  
      function showAllHistoryNumbers() {
        const historyNumbers = loadHistory();
        if (historyNumbers.length === 0) {
          alert("История номеров пуста.");
          return;
        }
        
        // Отображаем все исторические номера
        allNumbers = historyNumbers;
        renderList(historyNumbers, 'all');
        
        // Показываем количество номеров в истории
        alert(`Всего в истории: ${historyNumbers.length} номеров`);
      }
  
      function renderList(numbers, filter = 'all') {
        const phoneList = document.getElementById("phoneList");
        const numberList = document.getElementById("numberList");
        phoneList.innerHTML = "";
        numberList.innerText = "";
  
        const status = loadStatus();
        const lines = [];
  
        numbers.forEach(num => {
          const s = status[num] || 'uncalled';
          if (filter !== 'all' && s !== filter) return;
  
          const div = document.createElement("div");
          div.className = `phone-item ${s === 'called' ? 'called' : s === 'bad' ? 'bad-number' : s === 'alive' ? 'alive-number' : ''}`;
          
          div.innerHTML = `
            <div class="number">
              <span>${num}</span>
            </div>
            <div class="buttons">
              <button class="call-button" onclick="callNumber('${num}')">Позвонить</button>
              <button class="bad-button" onclick="updateStatus('${num}', 'bad')">Не рабочий</button>
              <button class="alive-button" onclick="updateStatus('${num}', 'alive')">Не взял</button>
            </div>
          `;
          
          phoneList.appendChild(div);
  
          let label = "";
          if (s === "bad") label = " (нерабочий)";
          if (s === "alive") label = " (живой)";
          lines.push(num + label);
        });
  
        numberList.innerText = lines.join("\n");
      }
  
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
  
      function clearCallHistory() {
        if (confirm("Удалить ВСЕ данные (номера, статусы, историю)?")) {
          localStorage.removeItem("numberStatus");
          localStorage.removeItem(HISTORY_KEY);
          allNumbers = [];
          document.getElementById("phoneList").innerHTML = "";
          document.getElementById("numberList").innerText = "";
        }
      }
  
      function filterNumbers(state) {
        renderList(allNumbers, state);
      }
  
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
  
      function exportToTxt() {
        const status = loadStatus();
        const phoneItems = document.querySelectorAll(".phone-item span");
        const lines = [];
  
        phoneItems.forEach(span => {
          const number = span.textContent.replace(/\s*\(.*?\)\s*/g, '').trim();
          let label = "";
  
          if (span.closest('.bad-number')) {
            label = " (нерабочий)";
          } else if (span.closest('.alive-number')) {
            label = " (живой)";
          } else if (span.closest('.called')) {
            label = " (звонили)";
          }
  
          lines.push(`${number}${label}`);
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
          renderList(filtered);
        };
        reader.readAsText(file);
      }