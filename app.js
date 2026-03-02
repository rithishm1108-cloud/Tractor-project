if (!localStorage.getItem('tractor_users')) {
  localStorage.setItem('tractor_users', JSON.stringify([]));
}
if (!localStorage.getItem('work_entries')) {
  localStorage.setItem('work_entries', JSON.stringify([]));
}



// Spinner functions
function showSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.classList.remove('hidden');
}

function hideSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.classList.add('hidden');
}

let viewCustomersSort = { key: 'totalBalance', dir: 'desc' };

function sortCustomers(data, key, dir) {
  return [...data].sort((a, b) => {
    const valA = a[key]; const valB = b[key];
    if (typeof valA === 'string' && typeof valB === 'string')
      return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    if (valA > valB) return dir === 'asc' ? 1 : -1;
    if (valA < valB) return dir === 'asc' ? -1 : 1;
    return 0;
  });
}
function filterCustomersByNameOrNickname(customers, nameFilter) {
  return customers.filter(user =>
    user.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
    (user.nickname && user.nickname.toLowerCase().includes(nameFilter.toLowerCase()))
  );
}
function renderSortedCustomersTable(panel, nameFilter = "") {
  const users = JSON.parse(localStorage.getItem('tractor_users')) || [];
  const workEntries = JSON.parse(localStorage.getItem('work_entries')) || [];
  const baseUsers = users.map(user => {
    const customerWorks = workEntries.filter(e => e.username === user.username);
    const totalAmount = customerWorks.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = customerWorks.reduce((sum, e) => sum + e.paid, 0);
    const balance = totalAmount - totalPaid;
    return { ...user, totalWorkEntries: customerWorks.length, totalBalance: balance };
  });
  let filteredUsers = nameFilter ? filterCustomersByNameOrNickname(baseUsers, nameFilter) : baseUsers;
  let sortedUsers;
  if (viewCustomersSort.key && viewCustomersSort.key !== '') {
    sortedUsers = sortCustomers(filteredUsers, viewCustomersSort.key, viewCustomersSort.dir);
  } else { sortedUsers = filteredUsers; }
  const sortOptions = {
    '': "No Sorting", username: "Username", name: "Name", nickname: "Nickname",
    totalWorkEntries: "Total Work Entries", totalBalance: "Total Balance"
  };
  const optionsHtml = Object.entries(sortOptions).map(([value, label]) => {
    const selected = (value === viewCustomersSort.key) ? 'selected' : '';
    return `<option value="${value}" ${selected}>${label}</option>`;
  }).join('');
  const dirAscSelected = viewCustomersSort.dir === 'asc' ? 'selected' : '';
  const dirDescSelected = viewCustomersSort.dir === 'desc' ? 'selected' : '';
  const sortDirDisabled = (viewCustomersSort.key === '') ? 'disabled' : '';
  const tableHtml = `
    <table id="customers-table" class="modern-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Name</th>
          <th>Nickname</th>
          <th>Total Work</th>
          <th>Total Balance</th>
          <th>View Details</th>
          <th>Update Payment</th>
          <th>Add Work</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        ${sortedUsers.map(user => `
          <tr>
            <td><strong>${user.username}</strong></td>
            <td class="customer-name">${user.name}</td>
            <td>${user.nickname ? user.nickname : '-'}</td>
            <td>${user.totalWorkEntries}</td>
            <td class="amount ${user.totalBalance > 0 ? 'amount-balance' : 'amount-paid'}">₹${user.totalBalance.toFixed(2)}</td>
            <td><button class="table-btn view-btn" onclick="window.location.href='customer-details.html?username=${encodeURIComponent(user.username)}'">View Details</button></td>
            <td><button class="table-btn update-btn" onclick="window.location.href='update.html?username=${encodeURIComponent(user.username)}'">Update Payment</button></td>
            <td><button class="table-btn add-work-btn" onclick="window.location.href='add-work.html?username=${encodeURIComponent(user.username)}'">Add Work</button></td>
            <td><button class="table-btn edit-btn" onclick="window.location.href='edit-customer.html?username=${encodeURIComponent(user.username)}'">Edit</button></td>
            <td><button class="table-btn delete-btn" onclick="deleteCustomer('${user.username}')">Delete</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  if (!document.getElementById('search-name-input')) {
    panel.innerHTML = `
      <h3>All Customers</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px;">
        <input type="text" id="search-name-input" placeholder="Search by customer name or nickname"
          style="padding:6px; flex-grow: 1; max-width: 300px; font-size:1rem;" value="${nameFilter}" />
        <label for="sort-key" style="font-weight:bold; margin-left: auto;">Sort by:</label>
        <select id="sort-key" style="padding:6px; font-size:1rem;">
          ${optionsHtml}
        </select>
        <select id="sort-dir" style="padding:6px; font-size:1rem; width: 120px;" ${sortDirDisabled}>
          <option value="asc" ${dirAscSelected}>Ascending</option>
          <option value="desc" ${dirDescSelected}>Descending</option>
        </select>
      </div>
      <div id="customers-table-container">${tableHtml}</div>
    `;
    const searchInput = document.getElementById('search-name-input');
    searchInput.addEventListener('input', function () { renderSortedCustomersTable(panel, this.value); });
    const sortKeySelect = document.getElementById('sort-key');
    sortKeySelect.addEventListener('change', function () {
      viewCustomersSort.key = this.value;
      const sortDirSelect = document.getElementById('sort-dir');
      sortDirSelect.disabled = (viewCustomersSort.key === '');
      renderSortedCustomersTable(panel, searchInput.value);
    });
    const sortDirSelect = document.getElementById('sort-dir');
    sortDirSelect.addEventListener('change', function () {
      viewCustomersSort.dir = this.value;
      renderSortedCustomersTable(panel, searchInput.value);
    });
  } else {
    document.getElementById('customers-table-container').innerHTML = tableHtml;
    const searchInput = document.getElementById('search-name-input');
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  }
}

function selectRole(role) {
  document.getElementById('role-selection').classList.add('hidden');
  if (role === 'owner') {
    document.getElementById('owner-login-section').classList.remove('hidden');
    document.getElementById('owner-login-form').reset();
    document.getElementById('owner-login-error').innerText = '';
    document.getElementById('owner-username').focus();
  } else {
    document.getElementById('customer-section').classList.remove('hidden');
    document.getElementById('customer-username').focus();
  }
}
function goBackToRoleSelection() {
  document.getElementById('owner-login-section').classList.add('hidden');
  document.getElementById('role-selection').classList.remove('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#owner-')) {
    if (sessionStorage.getItem('owner_logged_in') === 'true') {
      document.getElementById('role-selection').classList.add('hidden');
      document.getElementById('owner-section').classList.remove('hidden');
      document.getElementById('owner-login-section').classList.add('hidden');
      const tab = hash.replace('#owner-', '');
      showOwnerTab(tab); return;
    } else {
      document.getElementById('role-selection').classList.add('hidden');
      document.getElementById('owner-login-section').classList.remove('hidden');
      document.getElementById('owner-login-form').reset();
      document.getElementById('owner-login-error').innerText = '';
      return;
    }
  }
  if (hash === '#view-customers') {
    if (sessionStorage.getItem('owner_logged_in') === 'true') {
      document.getElementById('role-selection').classList.add('hidden');
      document.getElementById('owner-section').classList.remove('hidden');
      document.getElementById('owner-login-section').classList.add('hidden');
      showOwnerTab('view-customers'); return;
    } else {
      document.getElementById('role-selection').classList.add('hidden');
      document.getElementById('owner-login-section').classList.remove('hidden');
      document.getElementById('owner-login-form').reset();
      document.getElementById('owner-login-error').innerText = '';
      return;
    }
  }
  if (hash === '#customer-dashboard') {
    const username = sessionStorage.getItem('customer_username');
    if (username) {
      document.getElementById('role-selection').classList.add('hidden');
      document.getElementById('customer-section').classList.remove('hidden');
      document.getElementById('customer-login-form').classList.add('hidden');
      showCustomerDashboard(username); return;
    }
  }
});

document.getElementById('owner-login-form').onsubmit = function(e) {
  e.preventDefault();
  const username = document.getElementById('owner-username').value.trim();
  const password = document.getElementById('owner-password').value;
  if (username === 'spm' && password === 'spm') {
    sessionStorage.setItem('owner_logged_in', 'true');
    document.getElementById('owner-login-section').classList.add('hidden');
    document.getElementById('owner-section').classList.remove('hidden');
    window.location.hash = '#owner-view-customers';
    showOwnerTab('view-customers');
  } else {
    document.getElementById('owner-login-error').innerText = 'Invalid owner username or password.';
  }
};

function logout() {
  sessionStorage.removeItem('customer_username');
  sessionStorage.removeItem('owner_logged_in');
  sessionStorage.removeItem('language');
  window.location.hash = '';
  document.getElementById('owner-section').classList.add('hidden');
  document.getElementById('owner-login-section').classList.add('hidden');
  document.getElementById('customer-section').classList.add('hidden');
  document.getElementById('customer-dashboard').classList.add('hidden');
  document.getElementById('role-selection').classList.remove('hidden');
  document.getElementById('customer-login-form').reset();
  document.getElementById('customer-login-error').innerText = '';
  document.getElementById('owner-login-form').reset();
  document.getElementById('owner-login-error').innerText = '';
  const tbody = document.querySelector('#work-table tbody');
  if (tbody) tbody.innerHTML = '';
  document.getElementById('total-balance').innerText = '₹0.00';
  document.getElementById('owner-panel-content').innerHTML = '';
  // Redirect to index.html for fresh login flow
  window.location.href = 'index.html';
}

// --- Owner Panel Tabs ---
function showOwnerTab(tab) {
  window.location.hash = `#owner-${tab}`;
  const panel = document.getElementById('owner-panel-content');
  if (tab === 'create-account') {
    panel.innerHTML = `
      <h3>Create Customer Account</h3>
      <form id="create-customer-form">
        <input type="text" id="ca-username" placeholder="Customer Username" required /><br />
        <input type="password" id="ca-password" placeholder="Customer Password" required /><br />
        <input type="text" id="ca-name" placeholder="Customer Name" required /><br />
        <input type="text" id="ca-nickname" placeholder="Customer Nickname (optional)" /><br />
        <button type="submit">Create Account</button>
      </form>
      <div id="ca-error" class="error"></div>
    `;
    document.getElementById('create-customer-form').onsubmit = function(e) {
      e.preventDefault();
      createCustomerAccount();
    };
  }
  else if (tab === 'log-work') {
    panel.innerHTML = `
      <h3>Enter Work Details</h3>
      <form id="work-entry-form">
        <input type="text" id="we-username" placeholder="Customer Username" list="username-list" required /><br />
        <datalist id="username-list"></datalist>
        <input type="date" id="we-date" required /><br />
        <label for="we-cultivator">Type of Cultivator:</label>
        <input type="text" id="we-cultivator" list="cultivator-list" required /><br />
        <datalist id="cultivator-list"></datalist>
        <label for="we-totaltime">Total Time (hours.minutes):</label>
        <input type="text" id="we-totaltime" placeholder="e.g., 1.05 for 1 hour 5 minutes" required /><br />
        <label for="we-rate">Amount per Hour (₹):</label>
        <input type="number" id="we-rate" min="0" step="0.01" required /><br />
        <button type="submit">Log Work</button>
      </form>
      <div id="we-error" class="error"></div>
    `;
    // Add autocomplete functionality for username
    const usernameInput = document.getElementById('we-username');
    const usernameDatalist = document.getElementById('username-list');
    usernameInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      const users = JSON.parse(localStorage.getItem('tractor_users')) || [];
      const filteredUsers = users.filter(user =>
        user.username.toLowerCase().startsWith(query) ||
        user.name.toLowerCase().startsWith(query) ||
        (user.nickname && user.nickname.toLowerCase().startsWith(query))
      );
      usernameDatalist.innerHTML = filteredUsers.map(user => `<option value="${user.username}">`).join('');
    });
    // Close datalist after selection
    usernameInput.addEventListener('change', function() {
      this.blur();
    });
    // Populate cultivator datalist with history
    const workEntries = JSON.parse(localStorage.getItem('work_entries')) || [];
    const uniqueCultivators = [...new Set(workEntries.map(entry => entry.cultivator))];
    const cultivatorDatalist = document.getElementById('cultivator-list');
    cultivatorDatalist.innerHTML = uniqueCultivators.map(type => `<option value="${type}">`).join('');
    document.getElementById('work-entry-form').onsubmit = function(e) {
      e.preventDefault();
      logWorkEntry();
    };
  }
  else if (tab === 'view-customers') {
    window.location.hash = '#owner-view-customers';
    renderSortedCustomersTable(panel);
  }
}

// --- Create Customer Account ---
function createCustomerAccount() {
  showSpinner();
  setTimeout(() => {
    let users = JSON.parse(localStorage.getItem('tractor_users')) || [];
    const username = document.getElementById('ca-username').value.trim();
    const password = document.getElementById('ca-password').value;
    const name = document.getElementById('ca-name').value.trim();
    const nickname = document.getElementById('ca-nickname').value.trim();
    if (users.some(u => u.username === username)) {
      document.getElementById('ca-error').innerText = "Username already exists.";
      hideSpinner();
      return;
    }
    users.push({ username, password, name, nickname: nickname || '', paid: 0 });
    localStorage.setItem("tractor_users", JSON.stringify(users));
    document.getElementById("ca-error").innerText = "Account created!";
    document.getElementById('create-customer-form').reset();
    hideSpinner();
  }, 500); // Simulate processing time
}

// --- Log Work Entry ---
function logWorkEntry() {
  let users = JSON.parse(localStorage.getItem("tractor_users")) || [];
  let workEntries = JSON.parse(localStorage.getItem("work_entries")) || [];
  const username = document.getElementById("we-username").value.trim();
  const date = document.getElementById("we-date").value;
  const cultivator = document.getElementById("we-cultivator").value.trim();
  const totaltimeStr = document.getElementById("we-totaltime").value.trim();
  const rate = parseFloat(document.getElementById("we-rate").value);

  if (!users.some(u => u.username === username)) {
    document.getElementById("we-error").innerText = "Customer not found!";
    return;
  }
  if (isNaN(rate) || rate < 0) {
    document.getElementById("we-error").innerText = "Please enter valid per hour amount.";
    return;
  }

  // Parse time as hours.minutes format
  let totaltime;
  if (totaltimeStr.includes('.')) {
    const parts = totaltimeStr.split('.');
    if (parts.length === 2 && parts[0] && parts[1]) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        document.getElementById("we-error").innerText = "Please enter valid time in hours.minutes format (e.g., 1.05 for 1 hour 5 minutes).";
        return;
      }
      totaltime = hours + minutes / 60;
    } else {
      document.getElementById("we-error").innerText = "Please enter valid time in hours.minutes format (e.g., 1.05 for 1 hour 5 minutes).";
      return;
    }
  } else {
    const hours = parseInt(totaltimeStr, 10);
    if (isNaN(hours) || hours < 0) {
      document.getElementById("we-error").innerText = "Please enter valid time in hours.minutes format (e.g., 1.05 for 1 hour 5 minutes).";
      return;
    }
    totaltime = hours;
  }

  if (totaltime <= 0) {
    document.getElementById("we-error").innerText = "Please enter valid time greater than 0.";
    return;
  }

  let amount = +(totaltime * rate).toFixed(2);
  // Round to nearest 50 rupees
  amount = Math.round(amount / 50) * 50;
  workEntries.push({
    username,
    date,
    cultivator,
    time: totaltime,
    timeStr: totaltimeStr,
    rate: rate,
    amount,
    paid: 0
  });
  localStorage.setItem("work_entries", JSON.stringify(workEntries));
  document.getElementById("we-error").innerText = "Work entry saved.";
  document.getElementById('work-entry-form').reset();
}

// ---- Customer Panel Login ----
document.getElementById("customer-login-form").onsubmit = function(e) {
  e.preventDefault();
  customerLogin();
};
function customerLogin() {
  const username = document.getElementById("customer-username").value.trim();
  const password = document.getElementById("customer-password").value;
  let users = JSON.parse(localStorage.getItem("tractor_users")) || [];
  const customer = users.find(u => u.username === username && u.password === password);
  if (!customer) {
    document.getElementById("customer-login-error").innerText = "Login failed.";
    return;
  }
  sessionStorage.setItem('customer_username', username);
  sessionStorage.setItem('language', 'en');
  window.location.hash = '#customer-dashboard';
  document.getElementById("customer-login-form").classList.add("hidden");
  showCustomerDashboard(username);
}

const translations = {
  en: {
    about: "About Owner", district: "District:", place: "Place:",
    ownerName: "Owner Name:", contactNumbers: "Contact Numbers:",
    selectLanguage: "Select Language:", yourWorkDetails: "Your Work Details",
    date: "Date", type: "Type", time: "Total Time", amount: "Amount", paid: "Paid", balance: "Balance", total: "Total", logout: "Logout"
  },
  ta: {
    about: "உரிமையாளர் விவரங்கள்", district: "மாவட்டம்:", place: "இடம்:",
    ownerName: "சொந்தக்காரர் பெயர்:", contactNumbers: "தொடர்பு எண்கள்:",
    selectLanguage: "மொழியை தேர்ந்தெடுக்கவும்:", yourWorkDetails: "உங்கள் வேலை விவரங்கள்",
    date: "தேதி", type: "வகை", time: "மொத்த நேரம்", amount: "தொகை", paid: "கொடுத்தது", balance: "மீதம்", total: "மொத்தம்", logout: "வெளியேறு"
  }
};
function getLanguage() { return sessionStorage.getItem('language') || 'en'; }
function setLanguage(lang) {
  sessionStorage.setItem('language', lang); updateTranslations();
}
function updateTranslations() {
  const lang = getLanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
  });
  const headersMap = { 1: 'date', 2: 'type', 3: 'time', 4: 'amount', 5: 'paid', 6: 'balance' };
  const theadCells = document.querySelectorAll('#work-table thead th');
  theadCells.forEach((th, idx) => {
    const key = headersMap[idx + 1];
    if (key && translations[lang] && translations[lang][key]) th.textContent = translations[lang][key];
  });
  const totalCell = document.querySelector('#work-table tfoot tr td strong');
  if (totalCell && translations[lang] && translations[lang]['total']) totalCell.textContent = translations[lang]['total'];
}
function formatTimeDecimal(float) {
  float = parseFloat(float);
  if (isNaN(float)) return "";
  let h = Math.floor(float);
  let decimal = float - h;
  let m = Math.round(decimal * 10);
  return m === 0 ? `${h}` : `${h}.${m.toString().padStart(2,'0')}`;
}
function showCustomerDashboard(username) {
  document.getElementById("customer-dashboard").classList.remove("hidden");
  let users = JSON.parse(localStorage.getItem('tractor_users')) || [];
  let customer = users.find(u => u.username === username);
  const customerAboutDiv = document.querySelector('#customer-about');
  if (customerAboutDiv && customer) {
    let existingCustomerNameDiv = document.getElementById('customer-name-info');
    if (existingCustomerNameDiv) existingCustomerNameDiv.remove();
    const customerNameDiv = document.createElement('div');
    customerNameDiv.id = 'customer-name-info';
    customerNameDiv.style = 'margin-top: 10px; font-weight: 700; font-size: 1.5rem; color: #004d40;';
    customerNameDiv.textContent = `Customer Name: ${customer.name}`;
    customerAboutDiv.appendChild(customerNameDiv);
  }
  let workEntries = JSON.parse(localStorage.getItem("work_entries")) || [];
  let userEntries = workEntries.filter(e => e.username === username);
  let tbody = document.querySelector("#work-table tbody");
  tbody.innerHTML = "";
  let totalBalance = 0;
  const lang = getLanguage();

  userEntries.forEach(entry => {
    const balance = entry.amount - entry.paid;
    totalBalance += balance;
    tbody.innerHTML += `
      <tr>
        <td>${entry.date}</td>
        <td><strong>${entry.cultivator}</strong></td>
        <td>${entry.timeStr || formatTimeDecimal(entry.time)} hrs</td>
        <td class="amount">₹${entry.amount.toFixed(2)}</td>
        <td class="amount amount-paid">₹${entry.paid.toFixed(2)}</td>
        <td class="amount amount-balance">₹${balance.toFixed(2)}</td>
      </tr>
    `;
  });
  document.getElementById("total-balance").innerText = `₹${totalBalance.toFixed(2)}`;
  const langSelect = document.getElementById('language-select');
  if (langSelect) langSelect.value = lang;
  updateTranslations();
}
function deleteCustomer(username) {
  if (confirm(`Are you sure you want to delete the customer "${username}"? This will also delete all their work entries.`)) {
    let users = JSON.parse(localStorage.getItem('tractor_users')) || [];
    let workEntries = JSON.parse(localStorage.getItem('work_entries')) || [];
    users = users.filter(user => user.username !== username);
    workEntries = workEntries.filter(entry => entry.username !== username);
    localStorage.setItem('tractor_users', JSON.stringify(users));
    localStorage.setItem('work_entries', JSON.stringify(workEntries));
    const panel = document.getElementById('owner-panel-content');
    renderSortedCustomersTable(panel);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = getLanguage();
    langSelect.addEventListener('change', function () {
      setLanguage(this.value);
      const username = sessionStorage.getItem('customer_username');
      if (username) showCustomerDashboard(username);
    });
  }
});
