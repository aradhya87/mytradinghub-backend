document.addEventListener('DOMContentLoaded', () => {
  // Update user email and balance from localStorage
  const userData = JSON.parse(localStorage.getItem('myTradingHubUser') || '{}')
  const emailElem = document.getElementById('user-email')
  const balanceElem = document.getElementById('user-balance')
  if (emailElem && userData.email) emailElem.textContent = userData.email
  if (balanceElem && typeof userData.balance === 'number') balanceElem.textContent = userData.balance.toFixed(2)

  // Dropdown toggle for account menu
  const accountBtn = document.querySelector('.account-dropdown > button')
  const dropdownContent = document.querySelector('.dropdown-content')

  if (accountBtn && dropdownContent) {
    accountBtn.addEventListener('click', () => {
      if (dropdownContent.style.display === 'block') {
        dropdownContent.style.display = 'none'
      } else {
        dropdownContent.style.display = 'block'
      }
    })

    // Close dropdown if clicking outside
    window.addEventListener('click', (e) => {
      if (!accountBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
        dropdownContent.style.display = 'none'
      }
    })
  }
})
