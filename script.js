let items = [];
let editIndex = null;

function showToast(msg, ok = true) {
  const t = document.createElement('div');
  t.textContent = msg;

  t.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    display: flex;
    align-items: center;
    justify-content: center;

    padding: 18px 26px;
    background: ${ok ? '#2ecc71' : '#e74c3c'};
    color: #fff;
    border-radius: 8px;
    z-index: 9999;

    max-width: 90vw;
    text-align: center;
    font-size: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,.25);

    opacity: 0;
    transition: opacity 0.35s ease, transform 0.35s ease;
  `;

  document.body.appendChild(t);

  // trigger animation
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  // exit animation
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => t.remove(), 350);
  }, 3000);
}



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



function savePDF() {
  try {
    const data = collectData();

    // get existing pdf book or empty array
    const all = JSON.parse(localStorage.getItem('pdfBook')) || [];

    // push new data at FIRST position
    all.unshift(data);

    // save back to localStorage
    localStorage.setItem('pdfBook', JSON.stringify(all));
    
showToast('Invoice saved successfully');
 setTimeout(()=>{
       window.location.reload()
    },3000)
  } catch (err) {
    console.error(err);
     showToast('Failed to save invoice', false);
  }
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
  const savedData = JSON.parse(localStorage.getItem('pdfBook'));
  console.log(savedData)
  if(savedData){
  updateInvoice();
  const data = collectData();
  const element = document.getElementById('invoiceHistory');


  html2pdf().from(element).set({
    margin: [15, 10, 15, 10],
    filename: data.custName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(()=>{
    localStorage.removeItem('pdfBook');
    showToast('Pdf downloaded successfull',)
    setTimeout(()=>{
       window.location.reload()
    },3000)
   
  })
}else{
  showToast('No saved Invoices to Download')
}
}


function allInvoices(data) {
 
  if (!data) return;

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

  // Create a preview div for previous invoice
  const previewDiv = document.createElement('div');
  previewDiv.classList.add('invoice-preview');
  // previewDiv.style.border = '1px solid #ccc';
  previewDiv.style.padding = '10px';
  previewDiv.style.marginTop = '15px';
  previewDiv.style.background = '#fdfdfd';
  

  previewDiv.innerHTML = `
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

  // Append preview below the main invoice
  document.getElementById('invoiceHistory').appendChild(previewDiv);
}

const Alldata = JSON.parse(localStorage.getItem('pdfBook') || '[]');


function callInvoices(){
  Alldata?.forEach((data)=>{
  allInvoices(data)
})
}
const invoiceHistoryEl = document.getElementById('invoiceHistory');
if (Alldata.length > 0) {
  invoiceHistoryEl.style.display = 'block';
  callInvoices();
} else {
  invoiceHistoryEl.style.display = 'none';
}



