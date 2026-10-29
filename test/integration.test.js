// =============================================================================
// Comprehensive Automated Test Suite
// Verifies All Functional & Cloud Lab API Requirements
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure app starts
const app = require('../backend/server.js');

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function makeRequest(method, pathUrl, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: process.env.PORT || 3000,
      path: pathUrl,
      method: method,
      headers: { ...headers },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Multipart helper for receipt upload test
function makeMultipartRequest(pathUrl, token, fields, fileField) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let payload = '';

    for (const [key, val] of Object.entries(fields)) {
      payload += `--${boundary}\r\n`;
      payload += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      payload += `${val}\r\n`;
    }

    if (fileField) {
      payload += `--${boundary}\r\n`;
      payload += `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\n`;
      payload += `Content-Type: ${fileField.contentType}\r\n\r\n`;
      payload += fileField.content + '\r\n';
    }

    payload += `--${boundary}--\r\n`;

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: '127.0.0.1',
      port: process.env.PORT || 3000,
      path: pathUrl,
      method: 'POST',
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Cloud Expense Tracker Test Suite ---');
  await delay(1000);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check endpoint returns healthy');

    // 2. Cloud status check
    const cloud = await makeRequest('GET', '/api/cloud/status');
    assert(cloud.status === 200 && cloud.data.data.compute, 'Cloud diagnostics endpoint returns compute/RDS/S3 info');

    // 3. Register user
    const testEmail = `student_${Date.now()}@cloudlab.edu`;
    const regRes = await makeRequest(
      'POST',
      '/api/auth/register',
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        name: 'Test Student',
        email: testEmail,
        password: 'Password@123',
      })
    );
    assert(regRes.status === 201 && regRes.data.token, 'User registration succeeds with JWT token');

    const token = regRes.data.token;

    // 4. Login with user
    const loginRes = await makeRequest(
      'POST',
      '/api/auth/login',
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        email: testEmail,
        password: 'Password@123',
      })
    );
    assert(loginRes.status === 200 && loginRes.data.token, 'User login succeeds and returns valid JWT');

    // 5. Add Income Transaction
    const addIncomeRes = await makeRequest(
      'POST',
      '/api/transactions',
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      JSON.stringify({
        type: 'income',
        amount: 50000.0,
        category: 'Salary',
        description: 'Monthly Research Assistant Fellowship',
        transaction_date: '2026-10-01',
      })
    );
    assert(addIncomeRes.status === 201 && addIncomeRes.data.data.id, 'Adding income transaction succeeds');

    // 6. Add Expense with Receipt Upload (Amazon S3 test)
    const addExpenseRes = await makeMultipartRequest(
      '/api/transactions',
      token,
      {
        type: 'expense',
        amount: '250.00',
        category: 'Food',
        description: 'College Cafeteria Lunch',
        transaction_date: '2026-10-15',
      },
      {
        name: 'receipt',
        filename: 'lunch_receipt.png',
        contentType: 'image/png',
        content: 'FAKE_PNG_BINARY_CONTENT_FOR_RECEIPT_DEMO',
      }
    );
    assert(
      addExpenseRes.status === 201 && addExpenseRes.data.data.receipt_key,
      'Adding expense with S3 receipt upload succeeds'
    );
    const expenseId = addExpenseRes.data.data.id;

    // 7. Get Dashboard Summary
    const summaryRes = await makeRequest('GET', '/api/dashboard/summary', {
      Authorization: `Bearer ${token}`,
    });
    assert(
      summaryRes.status === 200 &&
        summaryRes.data.data.totalIncome === 50000 &&
        summaryRes.data.data.totalExpenses === 250 &&
        summaryRes.data.data.currentBalance === 49750,
      'Dashboard summary metrics calculate correctly (Income: 50000, Expense: 250, Balance: 49750)'
    );

    // 8. Get Category Summary
    const catSummaryRes = await makeRequest('GET', '/api/dashboard/category-summary', {
      Authorization: `Bearer ${token}`,
    });
    assert(
      catSummaryRes.status === 200 &&
        catSummaryRes.data.data.some((c) => c.category === 'Food' && c.amount === 250),
      'Category summary breaks down spending correctly'
    );

    // 9. Get Transactions with Category Filter
    const filterRes = await makeRequest('GET', '/api/transactions?category=Food', {
      Authorization: `Bearer ${token}`,
    });
    assert(
      filterRes.status === 200 && filterRes.data.count === 1,
      'Filtering transactions by category returns exact matches'
    );

    // 10. Test S3 Versioning inspection (Lab Exp 5)
    const versionRes = await makeRequest(
      'GET',
      `/api/transactions/${expenseId}/receipt-versions`,
      { Authorization: `Bearer ${token}` }
    );
    assert(
      versionRes.status === 200 && versionRes.data.versions.length > 0,
      'S3 Versioning endpoint lists object versions and metadata'
    );

    // 11. Update Transaction (replace receipt to test versioning)
    const updateRes = await makeMultipartRequest(
      `/api/transactions/${expenseId}?_method=PUT`,
      token,
      {
        type: 'expense',
        amount: '300.00',
        category: 'Food',
        description: 'College Cafeteria Lunch + Coffee',
        transaction_date: '2026-10-15',
      },
      {
        name: 'receipt',
        filename: 'revised_lunch_receipt.png',
        contentType: 'image/png',
        content: 'REVISED_PNG_BINARY_CONTENT_VERSION_2',
      }
    );
    // Note: since makeMultipartRequest sends POST, let's also test standard PUT
    const putRes = await makeRequest(
      'PUT',
      `/api/transactions/${expenseId}`,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      JSON.stringify({
        amount: 300.0,
        description: 'College Cafeteria Lunch + Beverage',
      })
    );
    assert(putRes.status === 200, 'Updating transaction via PUT succeeds');

    // 12. Delete Transaction
    const deleteRes = await makeRequest('DELETE', `/api/transactions/${expenseId}`, {
      Authorization: `Bearer ${token}`,
    });
    assert(deleteRes.status === 200, 'Deleting transaction succeeds');

    console.log('\n=========================================');
    console.log(` Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log('=========================================');

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
