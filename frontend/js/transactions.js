// =============================================================================
// Transactions Management Logic
// CRUD operations, dynamic filtering, S3 receipt preview, and S3 Versioning demo
// =============================================================================

let allTransactions = [];
let editingTransactionId = null;

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  // Populate today's date in add modal
  const dateInput = document.getElementById('tx-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Load transactions
  loadTransactions();

  // Attach filter event listeners
  const filterType = document.getElementById('filter-type');
  const filterCategory = document.getElementById('filter-category');
  const filterStart = document.getElementById('filter-start');
  const filterEnd = document.getElementById('filter-end');
  const filterSearch = document.getElementById('filter-search');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  [filterType, filterCategory, filterStart, filterEnd].forEach((el) => {
    if (el) el.addEventListener('change', () => loadTransactions());
  });

  if (filterSearch) {
    let timeout = null;
    filterSearch.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadTransactions(), 300);
    });
  }

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      if (filterType) filterType.value = 'all';
      if (filterCategory) filterCategory.value = 'all';
      if (filterStart) filterStart.value = '';
      if (filterEnd) filterEnd.value = '';
      if (filterSearch) filterSearch.value = '';
      loadTransactions();
    });
  }

  // Transaction form submit handler (Add or Edit)
  const txForm = document.getElementById('form-transaction');
  if (txForm) {
    txForm.addEventListener('submit', handleTransactionSubmit);
  }
});

/**
 * Fetch and render transactions matching current filters
 */
async function loadTransactions() {
  const tbody = document.getElementById('transactions-body');
  if (!tbody) return;

  const type = document.getElementById('filter-type')?.value || 'all';
  const category = document.getElementById('filter-category')?.value || 'all';
  const startDate = document.getElementById('filter-start')?.value || '';
  const endDate = document.getElementById('filter-end')?.value || '';
  const search = document.getElementById('filter-search')?.value || '';

  const queryParams = new URLSearchParams();
  if (type !== 'all') queryParams.append('type', type);
  if (category !== 'all') queryParams.append('category', category);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (search.trim()) queryParams.append('search', search.trim());

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading from Amazon RDS MySQL...</td></tr>';

  try {
    const res = await apiFetch(`/api/transactions?${queryParams.toString()}`);
    allTransactions = res.data || [];
    renderTransactionsTable(allTransactions);
    updateFilteredSummary(allTransactions);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

/**
 * Render transactions array to HTML table
 */
function renderTransactionsTable(transactions) {
  const tbody = document.getElementById('transactions-body');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No transactions found matching your criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions
    .map((tx) => {
      const isIncome = tx.type === 'income';

      let receiptCell = '<span style="color: var(--text-light); font-size: 0.8rem;">None</span>';
      if (tx.receipt_url) {
        receiptCell = `
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button class="btn btn-sm btn-secondary" onclick="viewReceipt('${tx.id}')" title="Preview receipt from Amazon S3">
              ☁ Preview
            </button>
            <button class="btn btn-sm btn-aws" onclick="viewS3Versions('${tx.id}')" title="Lab Practical 5: View S3 Version History">
              🕒 Versions
            </button>
          </div>
        `;
      }

      return `
        <tr>
          <td><strong>${formatDate(tx.transaction_date)}</strong></td>
          <td><span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${tx.type.toUpperCase()}</span></td>
          <td><span class="badge badge-category">${escapeHtml(tx.category)}</span></td>
          <td>${escapeHtml(tx.description || '-')}</td>
          <td class="${isIncome ? 'amount-income' : 'amount-expense'}" style="font-size: 0.95rem;">
            ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
          </td>
          <td>${receiptCell}</td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-sm btn-secondary" onclick="openEditModal(${tx.id})" title="Edit Transaction">
                ✏ Edit
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${tx.id})" title="Delete Transaction">
                🗑 Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Update summary numbers for currently filtered view
 */
function updateFilteredSummary(transactions) {
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  });

  const net = income - expense;

  const countElem = document.getElementById('filter-summary-count');
  const incomeElem = document.getElementById('filter-summary-income');
  const expenseElem = document.getElementById('filter-summary-expense');
  const netElem = document.getElementById('filter-summary-net');

  if (countElem) countElem.textContent = transactions.length;
  if (incomeElem) incomeElem.textContent = formatCurrency(income);
  if (expenseElem) expenseElem.textContent = formatCurrency(expense);
  if (netElem) {
    netElem.textContent = formatCurrency(net);
    netElem.style.color = net >= 0 ? 'var(--primary)' : 'var(--danger)';
  }
}

/**
 * Open modal to add new transaction
 */
function openAddModal() {
  editingTransactionId = null;
  const form = document.getElementById('form-transaction');
  if (form) form.reset();

  document.getElementById('modal-tx-title').textContent = 'Add New Transaction';
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('receipt-current-info').style.display = 'none';

  openModal('modal-transaction');
}

/**
 * Open modal to edit existing transaction
 */
function openEditModal(id) {
  const tx = allTransactions.find((t) => t.id === id);
  if (!tx) return;

  editingTransactionId = id;
  const form = document.getElementById('form-transaction');

  document.getElementById('modal-tx-title').textContent = 'Edit Transaction';
  form.type.value = tx.type;
  form.amount.value = tx.amount;
  form.category.value = tx.category;
  form.description.value = tx.description || '';
  form.transaction_date.value = tx.transaction_date ? tx.transaction_date.split('T')[0] : '';

  const receiptInfo = document.getElementById('receipt-current-info');
  if (tx.receipt_key) {
    receiptInfo.style.display = 'block';
    receiptInfo.innerHTML = `
      <small style="color: var(--aws-squid);">
        ☁ Current Receipt: <strong>${escapeHtml(tx.receipt_filename || tx.receipt_key)}</strong><br>
        <em>Upload a new file below to replace it (creating a new S3 object version).</em>
      </small>
    `;
  } else {
    receiptInfo.style.display = 'none';
  }

  openModal('modal-transaction');
}

/**
 * Handle form submission for add or update
 */
async function handleTransactionSubmit(e) {
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

    if (editingTransactionId) {
      await apiFetch(`/api/transactions/${editingTransactionId}`, {
        method: 'PUT',
        body: formData,
      });
      showToast('Transaction updated successfully!', 'success');
    } else {
      await apiFetch('/api/transactions', {
        method: 'POST',
        body: formData,
      });
      showToast('Transaction added successfully!', 'success');
    }

    closeModal('modal-transaction');
    loadTransactions();
  } catch (err) {
    showToast(err.message || 'Operation failed.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Transaction';
  }
}

/**
 * Delete a transaction
 */
async function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction? This will also remove the associated receipt from Amazon S3.')) {
    return;
  }

  try {
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    showToast('Transaction deleted successfully.', 'info');
    loadTransactions();
  } catch (err) {
    showToast(err.message || 'Failed to delete transaction.', 'error');
  }
}

/**
 * View receipt modal (Preview JPG/PNG or PDF)
 */
function viewReceipt(id) {
  const tx = allTransactions.find((t) => t.id == id);
  if (!tx || !tx.receipt_url) return;

  const modal = document.getElementById('modal-receipt-preview');
  const previewContainer = document.getElementById('receipt-preview-body');
  const downloadLink = document.getElementById('receipt-download-btn');
  const keyElem = document.getElementById('receipt-s3-key');

  if (keyElem) {
    keyElem.textContent = tx.receipt_key;
  }

  if (downloadLink) {
    downloadLink.href = tx.receipt_url;
    downloadLink.setAttribute('download', tx.receipt_filename || 'receipt');
  }

  const isPdf = (tx.receipt_filename && tx.receipt_filename.toLowerCase().endsWith('.pdf')) ||
                (tx.receipt_key && tx.receipt_key.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    previewContainer.innerHTML = `
      <iframe src="${tx.receipt_url}" style="width: 100%; height: 420px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);"></iframe>
    `;
  } else {
    previewContainer.innerHTML = `
      <div style="text-align: center; background: #000; padding: 1rem; border-radius: var(--radius-sm);">
        <img src="${tx.receipt_url}" alt="Receipt Document" style="max-width: 100%; max-height: 420px; object-fit: contain; border-radius: 4px;" />
      </div>
    `;
  }

  openModal('modal-receipt-preview');
}

/**
 * View Amazon S3 Versioning history for a receipt
 * Directly demonstrates Lab Experiment 5 (S3 Versioning & recovery)
 */
async function viewS3Versions(id) {
  const modal = document.getElementById('modal-s3-versioning');
  const container = document.getElementById('s3-versions-content');
  if (!modal || !container) return;

  container.innerHTML = '<div style="text-align: center; padding: 2rem;">Querying S3 Bucket Object Versions via AWS SDK...</div>';
  openModal('modal-s3-versioning');

  try {
    const res = await apiFetch(`/api/transactions/${id}/receipt-versions`);
    const data = res;

    container.innerHTML = `
      <div style="background-color: var(--warning-bg); border-left: 4px solid var(--aws-orange); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem;">
        <strong>Cloud Practical 5 Demonstration (S3 Versioning):</strong><br>
        When versioning is enabled on the S3 bucket, every overwrite or update creates a new version ID. 
        Old receipt versions are safely preserved and can be retrieved or rolled back at any time.
      </div>

      <div style="font-size: 0.85rem; margin-bottom: 1rem;">
        <strong>S3 Bucket:</strong> <code>${escapeHtml(data.bucket)}</code><br>
        <strong>S3 Object Key:</strong> <code>${escapeHtml(data.receipt_key)}</code><br>
        <strong>Original Filename:</strong> ${escapeHtml(data.receipt_filename || 'receipt')}
      </div>

      <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th>Version ID</th>
            <th>Type</th>
            <th>Last Modified</th>
            <th>Size</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${(data.versions || [])
            .map(
              (v, idx) => `
              <tr>
                <td><code style="font-size: 0.75rem;">${escapeHtml(v.versionId ? v.versionId.substring(0, 16) + '...' : 'Default')}</code></td>
                <td>Version #${data.versions.length - idx}</td>
                <td>${new Date(v.lastModified).toLocaleString()}</td>
                <td>${(v.size / 1024).toFixed(1)} KB</td>
                <td>${v.isLatest ? '<span class="badge badge-income">LATEST</span>' : '<span class="badge badge-category">HISTORICAL</span>'}</td>
                <td>
                  ${v.downloadUrl ? `<a href="${v.downloadUrl}" target="_blank" class="btn btn-sm btn-secondary">Download</a>` : 'N/A'}
                </td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 2rem;">Failed to fetch S3 versions: ${err.message}</div>`;
  }
}

// Global modal helpers
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
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
