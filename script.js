let items = [];
let editIndex = null;

/* ================= MODAL CONTROL ================= */

function openModal() {
  editIndex = null;

  const modal = document.getElementById('itemModal');
  modal.classList.add('show');

  document.getElementById('modalProductName').value = '';
  document.getElementById('modalPrice').value = 0;
  document.getElementById('modalQty').value = 1;

  document.getElementById('modalSubmitBtn').innerText = 'Add Item';
}

function closeModal() {
  editIndex = null;
  document.getElementById('itemModal').classList.remove('show');
}

// Close modal when clicking outside
window.addEventListener('click', function (e) {
  const modal = document.getElementById('itemModal');
  if (e.target === modal) closeModal();
});

/* ================= ITEMS ================= */

function addItemFromModal() {
  const name = document.getElementById('modalProductName').value.trim();
  const price = parseFloat(document.getElementById('modalPrice').value) || 0;
  const qty = parseInt(document.getElementById('modalQty').value) || 1;

  if (!name) {
    alert('Product name required');
    return;
  }

  const itemData = {
    name,
    price,
    qty,
    total: price * qty
  };

  if (editIndex !== null) {
    items[editIndex] = itemData;
  } else {
    items.push(itemData);
  }

  closeModal();
  renderItemsList();
  updateInvoice();
}

function editItem(index) {
  editIndex = index;
  const item = items[index];

  const modal = document.getElementById('itemModal');
  modal.classList.add('show');

  document.getElementById('modalProductName').value = item.name;
  document.getElementById('modalPrice').value = item.price;
  document.getElementById('modalQty').value = item.qty;

  document.getElementById('modalSubmitBtn').innerText = 'Update Item';
}

function removeItem(index) {
  items.splice(index, 1);
  renderItemsList();
  updateInvoice();
}

/* ================= ITEM LIST ================= */

function renderItemsList() {
  const container = document.getElementById('itemsListContainer');
  if (!items.length) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Product</th>
          <th>Price</th>
          <th>Qty</th>
          <th>Total</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((item, idx) => {
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.name}</td>
        <td>${item.price.toFixed(0)} TK</td>
        <td>${item.qty}</td>
        <td>${item.total.toFixed(0)} TK</td>
        <td style="display:flex;gap:2rem;justify-content:center;">
          <button class="btn btn-remove" onclick="removeItem(${idx})">X</button>
          <button class="btn btn-edit" onclick="editItem(${idx})">Edit</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/* ================= INVOICE ================= */

function collectData() {
  const custName = document.getElementById('custName').value || 'Customer Name';
  const custPhone = document.getElementById('custPhone').value || 'Phone Number';
  const custAddress = document.getElementById('custAddress').value || 'Address';
  const advance = parseFloat(document.getElementById('advance').value) || 0;
  const delivery = parseFloat(document.getElementById('delivery').value) || 0;

  const itemsTotal = items.reduce((sum, i) => sum + i.total, 0);
  const subTotal = itemsTotal - advance + delivery;

  return {
    custName,
    custPhone,
    custAddress,
    advance,
    delivery,
    itemsTotal,
    subTotal,
    items
  };
}

function updateInvoice() {
  const data = collectData();

  let rows = '';
  data.items.forEach((i, idx) => {
    rows += `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name}</td>
        <td>${i.qty}</td>
        <td class="price">${i.price.toFixed(0)} TK</td>
        <td class="amount">${i.total.toFixed(0)} TK</td>
      </tr>
    `;
  });

  if (!data.items.length) {
    rows = `
      <tr>
        <td colspan="5" style="text-align:center;padding:20px;">
          No items added yet
        </td>
      </tr>
    `;
  }

  document.getElementById('invoice').innerHTML = `
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo-area">
          <img src="image/logo.png" class="logo" onerror="this.style.display='none'">
        </div>
        <div class="invoice-meta">
          <h1 class="invoice-title">Invoice</h1>
          <div class="date-row">
            Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div class="parties">
        <div class="billed-to">
          <strong>Billed to:</strong><br>
          ${data.custName}<br>
          ${data.custPhone ? 'Phone: ' + data.custPhone + '<br>' : ''}
          ${data.custAddress.replace(/\n/g, '<br>')}
        </div>
        <div class="from">
          <strong>From:</strong><br>
          Flappy Fashion<br>
          ka/32/Bashundhara<br>
          01765-763455<br>
          flappy.a.t@gmail.com
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="4" style="text-align:right;font-weight:bold;">Total</td>
            <td class="amount">${data.itemsTotal.toFixed(0)} TK</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-extra">
        <div><strong>Advance:</strong> ${data.advance.toFixed(0)} TK</div>
        <div><strong>Delivery:</strong> ${data.delivery.toFixed(0)} TK</div>
        <div class="grand"><strong>Amount Due:</strong> ${data.subTotal.toFixed(0)} TK</div>
      </div>

      <div class="thank-you"> <strong>🌸 Thank You! 🌸</strong><br> We truly appreciate your support!<br> Stay connected for more exciting collections.<br> <strong>Team FLAPPY</strong> </div>
    </div>
  `;
}

/* ================= LIVE UPDATE ================= */

['custName','custPhone','custAddress','advance','delivery'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateInvoice);
});

updateInvoice();

/* ================= PDF ================= */

function downloadPDF() {
  updateInvoice();
  const data = collectData();
  const element = document.getElementById('invoice');

  html2pdf().from(element).set({
    margin: [15, 10, 15, 10],
    filename: data.custName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save();
}
