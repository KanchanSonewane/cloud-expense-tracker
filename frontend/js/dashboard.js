// =============================================================================
// Dashboard Logic & Analytics
// Fetches financial metrics, renders Chart.js charts, and handles quick actions
// =============================================================================

let categoryChart = null;
let monthlyChart = null;

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  // Set today's date in quick add modal
  const dateInput = document.getElementById('tx-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Initial load
  loadDashboardData();

  // Attach quick add form handler
  const addForm = document.getElementById('form-add-transaction');
  if (addForm) {
    addForm.addEventListener('submit', handleQuickAddTransaction);
  }

  // Cloud architecture info modal trigger
  const cloudInfoBtn = document.getElementById('btn-cloud-info');
  if (cloudInfoBtn) {
    cloudInfoBtn.addEventListener('click', openCloudInfoModal);
  }
});

/**
 * Load all dashboard components
 */
async function loadDashboardData() {
  try {
    await Promise.all([
      loadSummaryCards(),
      loadCategoryChart(),
      loadMonthlyChart(),
      loadRecentTransactions(),
    ]);
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

/**
 * Fetch and render top summary cards
 */
async function loadSummaryCards() {
  try {
    const res = await apiFetch('/api/dashboard/summary');
    const data = res.data;

    document.getElementById('stat-income').textContent = formatCurrency(data.totalIncome);
    document.getElementById('stat-expense').textContent = formatCurrency(data.totalExpenses);

    const balanceElem = document.getElementById('stat-balance');
    balanceElem.textContent = formatCurrency(data.currentBalance);
    if (data.currentBalance < 0) {
      balanceElem.style.color = 'var(--danger)';
    } else {
      balanceElem.style.color = 'var(--primary)';
    }

    document.getElementById('stat-count').textContent = data.transactionCount;
    const receiptsElem = document.getElementById('stat-receipts');
    if (receiptsElem) {
      receiptsElem.textContent = `${data.receiptsStored} receipts stored in S3`;
    }
  } catch (err) {
    showToast(err.message || 'Failed to load financial summary.', 'error');
  }
}

/**
 * Render category-wise spending Doughnut chart
 */
async function loadCategoryChart() {
  try {
    const res = await apiFetch('/api/dashboard/category-summary');
    const categories = res.data;
    const canvas = document.getElementById('chart-categories');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (categoryChart) {
      categoryChart.destroy();
    }

    if (!categories || categories.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('No expense data recorded yet.', canvas.width / 2, canvas.height / 2);
      return;
    }

    const labels = categories.map((c) => c.category);
    const amounts = categories.map((c) => c.amount);

    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#10b981',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
    ];

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: amounts,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`,
            },
          },
        },
        cutout: '65%',
      },
    });
  } catch (err) {
    console.error('Failed to load category chart:', err);
  }
}

/**
 * Render monthly comparison Bar chart
 */
async function loadMonthlyChart() {
  try {
    const res = await apiFetch('/api/dashboard/monthly-summary');
    const monthlyData = res.data;
    const canvas = document.getElementById('chart-monthly');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (monthlyChart) {
      monthlyChart.destroy();
    }

    if (!monthlyData || monthlyData.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('No monthly transaction history yet.', canvas.width / 2, canvas.height / 2);
      return;
    }

    const labels = monthlyData.map((d) => d.month);
    const incomeData = monthlyData.map((d) => d.income);
    const expenseData = monthlyData.map((d) => d.expense);

    monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income (₹)',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 4,
          },
          {
            label: 'Expense (₹)',
            data: expenseData,
            backgroundColor: '#ef4444',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '₹' + val,
            },
          },
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw)}`,
            },
          },
        },
      },
    });
  } catch (err) {
    console.error('Failed to load monthly chart:', err);
  }
}

/**
 * Fetch and render recent transactions table
 */
async function loadRecentTransactions() {
  const tbody = document.getElementById('recent-transactions-body');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Fetching transactions from Amazon RDS...</td></tr>';

    const res = await apiFetch('/api/transactions');
    const list = res.data ? res.data.slice(0, 5) : [];

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transactions recorded yet. Click "+ Add Transaction" to get started.</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map((tx) => {
        const isIncome = tx.type === 'income';
        const receiptBadge = tx.receipt_url
          ? `<a href="${tx.receipt_url}" target="_blank" class="badge badge-s3" title="Stored in Amazon S3: ${tx.receipt_filename || 'Receipt'}">
              ☁ View S3 Receipt
             </a>`
          : '<span style="color: var(--text-light); font-size: 0.8rem;">None</span>';

        return `
          <tr>
            <td><strong>${formatDate(tx.transaction_date)}</strong></td>
            <td>${escapeHtml(tx.description || 'No description')}</td>
            <td><span class="badge badge-category">${escapeHtml(tx.category)}</span></td>
            <td><span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${tx.type.toUpperCase()}</span></td>
            <td class="${isIncome ? 'amount-income' : 'amount-expense'}">
              ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
            </td>
            <td>${receiptBadge}</td>
          </tr>
        `;
      })
      .join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load transactions.</td></tr>';
  }
}

/**
 * Handle quick add transaction form submission
 */
async function handleQuickAddTransaction(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const formData = new FormData();
  formData.append('type', form.type.value);
  formData.append('amount', form.amount.value);
  formData.append('category', form.category.value);
  formData.append('description', form.description.value);
  formData.append('transaction_date', form.transaction_date.value);

  const fileInput = form.receipt;
  if (fileInput && fileInput.files[0]) {
    formData.append('receipt', fileInput.files[0]);
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving to RDS & S3...';

    const res = await apiFetch('/api/transactions', {
      method: 'POST',
      body: formData,
    });

    showToast('Transaction saved successfully!', 'success');
    closeModal('modal-add-transaction');
    form.reset();
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

    // Refresh dashboard data
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Failed to save transaction.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Transaction';
  }
}

/**
 * Open Cloud Architecture & Diagnostic modal
 */
async function openCloudInfoModal() {
  const modal = document.getElementById('modal-cloud-info');
  const content = document.getElementById('cloud-info-content');
  if (!modal || !content) return;

  content.innerHTML = '<div style="text-align: center; padding: 2rem;">Querying Cloud Architecture Diagnostics...</div>';
  modal.classList.add('active');

  try {
    const res = await apiFetch('/api/cloud/status');
    const data = res.data;

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="background-color: var(--primary-light); padding: 1rem; border-radius: var(--radius-sm); border-left: 4px solid var(--primary);">
          <strong>Lab Course:</strong> ${data.course}<br>
          <strong>System:</strong> ${data.project} v${data.version}<br>
          <strong>Server Time:</strong> ${new Date(data.serverTime).toLocaleString()}
        </div>

        <h4 style="font-size: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.35rem;">AWS Cloud Infrastructure Details</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--aws-squid); font-weight: 700; font-size: 0.85rem;">💻 COMPUTE (EC2 / Host)</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              <strong>Platform:</strong> ${data.compute.platform}<br>
              <strong>Hostname:</strong> ${data.compute.hostname}<br>
              <strong>Node.js:</strong> ${data.compute.nodeVersion}<br>
              <strong>IAM Role Active:</strong> ${data.compute.iamRoleActive ? 'Yes (Least Privilege)' : 'No (Env Credentials)'}
            </div>
          </div>

          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--primary); font-weight: 700; font-size: 0.85rem;">🗄 DATABASE (RDS MySQL)</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              <strong>Engine:</strong> ${data.database.service}<br>
              <strong>Endpoint:</strong> ${data.database.host}<br>
              <strong>Database:</strong> ${data.database.name}<br>
              <strong>Status:</strong> <span class="badge badge-income">${data.database.status}</span>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--aws-orange); font-weight: 700; font-size: 0.85rem;">☁ STORAGE (Amazon S3)</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              <strong>Service:</strong> ${data.storage.service}<br>
              <strong>Bucket:</strong> ${data.storage.bucket}<br>
              <strong>Region:</strong> ${data.storage.region}<br>
              <strong>Versioning:</strong> Supported (Exp 5)
            </div>
          </div>

          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--success); font-weight: 700; font-size: 0.85rem;">🔒 SECURITY & IAM</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              <strong>Password Hash:</strong> ${data.security.passwordEncryption}<br>
              <strong>API Token:</strong> ${data.security.apiAuth}<br>
              <strong>SQL Injections:</strong> Protected (Parameterized)
            </div>
          </div>
        </div>

        <h4 style="font-size: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.35rem; margin-top: 0.5rem;">Cloud Computing Lab Practical Mapping</h4>
        
        <table style="width: 100%; font-size: 0.85rem;">
          <thead>
            <tr>
              <th>Exp #</th>
              <th>AWS Service</th>
              <th>Project Implementation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.labPracticalMapping
              .map(
                (p) => `
                <tr>
                  <td><strong>${p.practicalNo}</strong></td>
                  <td>${p.service}</td>
                  <td>${p.task}</td>
                  <td><span class="badge badge-income">${p.status}</span></td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 2rem;">Failed to fetch cloud diagnostics: ${err.message}</div>`;
  }
}

// Modal opening/closing utilities
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
