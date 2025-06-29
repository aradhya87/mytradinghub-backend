// ====== User Management ======

// Save user info to localStorage
function saveUser(user) {
  localStorage.setItem('myTradingHubUser', JSON.stringify(user));
}

// Get current user info from localStorage
function getUser() {
  return JSON.parse(localStorage.getItem('myTradingHubUser') || '{}');
}

// Clear user data on logout
function logoutUser() {
  localStorage.removeItem('myTradingHubUser');
  window.location.href = 'login.html';
}

// ====== Login / Signup / Demo Account ======

function login(email, password) {
  // For demo, accept any password; validate email format minimally
  if (!validateEmail(email)) return { success: false, message: 'Invalid email' };
  // Save user with fake balance and email
  saveUser({ email, balance: 10000, trades: [] });
  return { success: true };
}

function signup(email, password) {
  // Here, simulate dummy OTP process before saving user
  if (!validateEmail(email)) return { success: false, message: 'Invalid email' };
  // OTP check simulation can be added here (for now accept directly)
  saveUser({ email, balance: 10000, trades: [] });
  return { success: true };
}

function loginDemo() {
  // Create a demo user with random ID and default balance
  const demoEmail = `demo${Date.now()}@mytradinghub.com`;
  saveUser({ email: demoEmail, balance: 5000, trades: [] });
  window.location.href = 'dashboard.html';
}

// ====== Email validation ======
function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

// ====== Dropdown Email Menu ======

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  const emailText = document.getElementById('userEmailText');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const userEmailDropdown = document.getElementById('userEmailDropdown');
  if (emailText) emailText.textContent = user.email || 'Guest';

  if (userEmailDropdown) {
    userEmailDropdown.addEventListener('click', () => {
      if (!dropdownMenu) return;
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', (e) => {
      if (!userEmailDropdown.contains(e.target) && dropdownMenu) {
        dropdownMenu.style.display = 'none';
      }
    });
  }

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Initialize balance display if dashboard page
  if (document.getElementById('fake-balance')) {
    updateBalanceDisplay(user.balance);
  }

  // Search bar on sidebar currency pairs (if exists)
  const searchBar = document.getElementById('search-bar');
  if (searchBar) {
    searchBar.addEventListener('input', () => {
      const filter = searchBar.value.toUpperCase();
      const pairs = document.querySelectorAll('.currency-pair');
      pairs.forEach(pair => {
        const text = pair.textContent || '';
        pair.style.display = text.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
      });
    });
  }
});

// ====== Balance Display ======

function updateBalanceDisplay(balance) {
  const balanceElem = document.getElementById('fake-balance');
  if (balanceElem) {
    balanceElem.textContent = `Balance: $${balance.toFixed(2)}`;
  }
}

// ====== Trade Simulation ======

// Open trade page with type and pair (used by Buy/Sell buttons)
function openTrade(type, pair) {
  const url = new URL('trade.html', window.location.origin);
  if (type) url.searchParams.set('type', type);
  if (pair) url.searchParams.set('pair', pair);
  window.location.href = url.toString();
}

// Save a trade in localStorage (for trade history)
function saveTrade(trade) {
  let user = getUser();
  if (!user.trades) user.trades = [];
  user.trades.push(trade);
  saveUser(user);
  // Update balance after trade close if profit/loss given
  if (trade.closed && trade.profitLoss != null) {
    user.balance = (user.balance || 0) + trade.profitLoss;
    saveUser(user);
  }
}

// Load trades from localStorage
function loadTrades() {
  const user = getUser();
  return user.trades || [];
}

// Close trade and update balance
function closeTrade(tradeId, profitLoss) {
  const user = getUser();
  if (!user.trades) return false;
  const trade = user.trades.find(t => t.id === tradeId);
  if (!trade) return false;
  trade.closed = true;
  trade.profitLoss = profitLoss;
  saveTrade(trade);
  updateBalanceDisplay(user.balance);
  return true;
}

// ====== Trade History Rendering ======

function renderTradeHistory(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const trades = loadTrades();
  if (trades.length === 0) {
    container.innerHTML = '<p>No trades found.</p>';
    return;
  }
  let html = '<table><thead><tr><th>Pair</th><th>Type</th><th>Lots</th><th>Entry Price</th><th>Profit/Loss</th><th>Status</th></tr></thead><tbody>';
  trades.forEach(trade => {
    html += `<tr>
      <td>${trade.pair}</td>
      <td>${trade.type}</td>
      <td>${trade.lots}</td>
      <td>${trade.entryPrice}</td>
      <td>${trade.closed ? (trade.profitLoss ?? 0).toFixed(2) : 'Open'}</td>
      <td>${trade.closed ? 'Closed' : 'Open'}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ====== TradingView Chart Pair Update ======

function selectPair(pair) {
  const chart = document.getElementById('chart-frame');
  if (!chart) return;
  const symbol = pair.replace('/', '');
  chart.src = `https://s.tradingview.com/widgetembed/?symbol=FX:${symbol}&interval=5&theme=light&style=1`;
}

// ====== Utility: Generate random ID ======

function generateId() {
  return 'trade-' + Math.random().toString(36).substr(2, 9);
}

// ====== Example Usage in trade.html ======

// On page load, populate form if parameters exist
function tradePageInit() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'buy';
  const pair = urlParams.get('pair') || 'EUR/USD';

  const pairInput = document.getElementById('pair-input');
  const typeInput = document.getElementById('type-input');

  if (pairInput) pairInput.value = pair;
  if (typeInput) typeInput.value = type;
}

// Submit trade from trade.html
function submitTrade() {
  const pairInput = document.getElementById('pair-input');
  const typeInput = document.getElementById('type-input');
  const lotsInput = document.getElementById('lots-input');
  const entryPriceInput = document.getElementById('entry-price-input');

  if (!pairInput || !typeInput || !lotsInput || !entryPriceInput) return alert('Missing inputs.');

  const trade = {
    id: generateId(),
    pair: pairInput.value,
    type: typeInput.value,
    lots: parseFloat(lotsInput.value),
    entryPrice: parseFloat(entryPriceInput.value),
    closed: false,
    profitLoss: null,
    openDate: new Date().toISOString(),
  };

  // Save trade and redirect to dashboard or history
  saveTrade(trade);
  alert('Trade submitted!');
  window.location.href = 'dashboard.html';
}

// ====== Deposit / Withdrawal Simulation ======

function updateBalance(amount) {
  const user = getUser();
  user.balance = (user.balance || 0) + amount;
  saveUser(user);
  updateBalanceDisplay(user.balance);
}

function deposit(amount) {
  if (amount <= 0) return alert('Invalid deposit amount');
  updateBalance(amount);
  alert(`Deposited $${amount.toFixed(2)} successfully.`);
}

function withdraw(amount) {
  const user = getUser();
  if (amount <= 0) return alert('Invalid withdrawal amount');
  if (amount > user.balance) return alert('Insufficient balance');
  updateBalance(-amount);
  alert(`Withdrawn $${amount.toFixed(2)} successfully.`);
}

// ====== Export functions to global for HTML onclick usage ======
window.selectPair = selectPair;
window.openTrade = openTrade;
window.login = login;
window.signup = signup;
window.loginDemo = loginDemo;
window.logoutUser = logoutUser;
window.tradePageInit = tradePageInit;
window.submitTrade = submitTrade;
window.renderTradeHistory = renderTradeHistory;
window.deposit = deposit;
window.withdraw = withdraw;
window.closeTrade = closeTrade;
window.updateBalanceDisplay = updateBalanceDisplay;
