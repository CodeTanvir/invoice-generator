let items = [];
let editIndex = null;
let editingInvoiceIndex = null; // Track which saved invoice is being edited
let isSaving = false; // in-memory flag, resets on every page load (that's fine)
let allInvoicesData = []; // Store all invoices for search

// Branding options
const brands = {
  flappy: {
    key: 'flappy',
    name: 'Flappy Fashion',
    address: 'ka/32/Bashundhara',
    phone: '01765-763455',
    email: 'flappy.a.t@gmail.com',
    logo: 'image/flappy.png',
    teamName: 'Team FLAPPY',
    emoji: '🌸'
  },
  flowbit: {
    key: 'flowbit',
    name: 'Flowbit Tech',
    address: 'ka/32/Bashundhara',
    phone: '01765-763455',
    email: 'flowbit35@gmail.com',
    logo: 'image/flowbit.png',
    teamName: 'Team FLOWBIT',
    emoji: '✨'
  }
};

let currentBrand = localStorage.getItem('selectedBrand') || 'flappy';

function setBrand(key) {
  if (!brands[key]) return;
  currentBrand = key;
  // Save brand preference to localStorage
  localStorage.setItem('selectedBrand', key);
  const radio = document.querySelector(`input[name="brand"][value="${key}"]`);
  if (radio) radio.checked = true;
  updateInvoice();
  const invoiceHistoryEl = document.getElementById('invoiceHistory');
  if (invoiceHistoryEl) {
    invoiceHistoryEl.innerHTML = '';
    const Alldata = JSON.parse(localStorage.getItem('pdfBook') || '[]');
    Alldata.forEach((d, idx) => allInvoices(d, idx));
  }
}

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
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translate(-50%, -50%) scale(1)';
  });
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

  const itemData = { name, price, qty, total: price * qty };

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
          <th>No</th><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Action</th>
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

/* ================= INVOICE DATA ================= */

function collectData() {
  const custName = document.getElementById('custName').value || 'Customer Name';
  const custPhone = document.getElementById('custPhone').value || 'Phone Number';
  const custAddress = document.getElementById('custAddress').value || 'Address';
  const advance = parseFloat(document.getElementById('advance').value) || 0;
  const delivery = parseFloat(document.getElementById('delivery').value) || 0;

  const itemsTotal = items.reduce((sum, i) => sum + i.total, 0);
  const subTotal = itemsTotal - advance + delivery;

  return { brand: currentBrand, custName, custPhone, custAddress, advance, delivery, itemsTotal, subTotal, items };
}

function isInvoiceValid() {
  const custName = document.getElementById('custName').value.trim();
  const custPhone = document.getElementById('custPhone').value.trim();
  const custAddress = document.getElementById('custAddress').value.trim();

  if (!custName)   { showToast('Customer name is required', false); return false; }
  if (!custPhone)  { showToast('Phone number is required', false);  return false; }
  if (!custAddress){ showToast('Address is required', false);       return false; }
  if (!items.length){ showToast('Please add at least one item', false); return false; }

  return true;
}

/* ================= SAVE PDF ================= */

function savePDF() {
  if (!isInvoiceValid()) return;

  // Block if sessionStorage has recent save lock (survives reload)
  const lastSave = sessionStorage.getItem('lastSaveTime');
  if (lastSave && Date.now() - parseInt(lastSave, 10) < 10000) {
    console.log('[savePDF] Blocked by sessionStorage lock');
    return;
  }

  // Prevent double-click / rapid re-call within the same page session
  if (isSaving) {
    showToast('Already saving…', false);
    return;
  }
  isSaving = true;

  const saveBtn = document.getElementById('savePdfBtn');
  if (saveBtn) saveBtn.disabled = true;

  try {
    const data = collectData();
    const all = JSON.parse(localStorage.getItem('pdfBook') || '[]');

    // Set lock NOW, before saving, to survive reload
    sessionStorage.setItem('lastSaveTime', String(Date.now()));

    // If editing, update at the original index
    if (editingInvoiceIndex !== null && all[editingInvoiceIndex]) {
      all[editingInvoiceIndex] = data; // Replace at original position
      editingInvoiceIndex = null; // Reset after editing
      updateSaveButton(); // Update button back to "Save PDF"
      console.log('[savePDF] Updated invoice successfully');
      showToast('Invoice updated successfully');
    } else {
      // New invoice - add at beginning
      // Prevent saving an identical invoice twice in a row
      const last = all[0];
      if (last && JSON.stringify(last) === JSON.stringify(data)) {
        showToast('Invoice already saved', false);
        isSaving = false;
        if (saveBtn) saveBtn.disabled = false;
        return;
      }

      all.unshift(data);
      console.log('[savePDF] Saved successfully, total:', all.length);
      showToast('Invoice saved successfully');
    }

    localStorage.setItem('pdfBook', JSON.stringify(all));

    // Reload after toast
    setTimeout(() => window.location.reload(), 3000);

  } catch (err) {
    console.error(err);
    showToast('Failed to save invoice', false);
    isSaving = false;
    if (saveBtn) saveBtn.disabled = false;
  }
}

/* ================= UPDATE INVOICE PREVIEW ================= */

function updateInvoice() {
  const data = collectData();
  const brand = brands[data.brand] || brands[currentBrand] || brands.flappy;

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
    rows = `<tr><td colspan="5" style="text-align:center;padding:20px;">No items added yet</td></tr>`;
  }

  document.getElementById('invoice').innerHTML = `
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo-area">
          <img src="${brand.logo}" class="logo" onerror="this.style.display='none'">
        </div>
        <div class="invoice-meta">
          <h1 class="invoice-title">Invoice</h1>
          <div class="date-row">Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
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
          ${brand.name}<br>${brand.address}<br>${brand.phone}<br>${brand.email}
        </div>
      </div>
      <table class="items-table">
        <thead>
          <tr><th>No</th><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
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
      <div class="thank-you">
        <strong>${brand.emoji} Thank You! ${brand.emoji}</strong><br>
        We truly appreciate your support!<br>
        Stay connected for more exciting collections.<br>
        <strong>${brand.teamName}</strong>
      </div>
    </div>
  `;
}

/* ================= LIVE UPDATE ================= */

['custName', 'custPhone', 'custAddress', 'advance', 'delivery'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateInvoice);
});

function initBrandToggle() {
  const radios = document.querySelectorAll('input[name="brand"]');
  radios.forEach(r => {
    r.removeEventListener('change', onBrandChange);
    r.addEventListener('change', onBrandChange);
  });
  // Load saved brand preference
  const savedBrand = localStorage.getItem('selectedBrand') || 'flappy';
  setBrand(savedBrand);
}
function onBrandChange(e) { setBrand(e.target.value); }

initBrandToggle();

/* ================= DOWNLOAD PDF ================= */

// function downloadPDF() {
//   const savedData = JSON.parse(localStorage.getItem('pdfBook') || '[]');

//   if (!savedData || !savedData.length) {
//     showToast('No saved Invoices to Download', false);
//     return;
//   }


//   const temp = document.createElement('div');
//   temp.style.cssText = 'background:#fff;padding:10px;position:fixed;left:-9999px;top:0;';
// savedData.forEach((d, idx) => {
//     const pv = renderInvoicePreview(d, idx);
//     pv.style.pageBreakAfter = 'always';
//     temp.appendChild(pv);
// });

//   document.body.appendChild(temp);

//   html2pdf().from(temp).set({
//     margin: [15, 10, 15, 10],
//     filename: Date.now(),
//     image: { type: 'jpeg', quality: 0.98 },
//     html2canvas: { scale: 2, useCORS: true },
//     jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
//   }).save().then(() => {
//     document.body.removeChild(temp);
//     localStorage.removeItem('pdfBook');
//     showToast('PDF downloaded successfully');
//     setTimeout(() => window.location.reload(), 1200);
//   }).catch(err => {
//     document.body.removeChild(temp);
//     console.error(err);
//     showToast('PDF download failed — check console', false);
//   });
// }



function downloadPDF() {
  const savedData = JSON.parse(localStorage.getItem('pdfBook'));
  console.log(savedData)
  if(savedData){
  updateInvoice();
  const data = collectData();
  const element = document.getElementById('invoiceHistory');
  element.querySelectorAll('button').forEach(btn => btn.remove());
console.log(data)
console.log(element)
  html2pdf().from(element).set({
    margin: [15, 10, 15, 10],
    filename: Date.now(),
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













/* ================= INVOICE HISTORY ================= */

function updateSaveButton() {
  const saveBtn = document.getElementById('savePdfBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (!saveBtn || !cancelBtn) return;
  
  if (editingInvoiceIndex !== null) {
    // In edit mode
    saveBtn.textContent = 'Update PDF';
    saveBtn.style.backgroundColor = '#ff9800'; // Orange color
    saveBtn.style.color = 'white';
    cancelBtn.style.display = 'block'; // Show cancel button
  } else {
    // In new mode
    saveBtn.textContent = 'Save PDF';
    saveBtn.style.backgroundColor = ''; // Reset to default
    saveBtn.style.color = '';
    cancelBtn.style.display = 'none'; // Hide cancel button
  }
}

function cancelEditMode() {
  // Clear form fields
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';
  document.getElementById('advance').value = '0';
  document.getElementById('delivery').value = '120';
  
  // Clear items
  items = [];
  renderItemsList();
  
  // Remove animated border from edited invoice
  if (editingInvoiceIndex !== null) {
    const editedPreview = document.querySelector(`[data-invoice-index="${editingInvoiceIndex}"]`);
    if (editedPreview) {
      editedPreview.classList.remove('editing');
    }
  }
  
  // Reset edit mode
  editingInvoiceIndex = null;
  updateSaveButton();
  updateInvoice();
  
  showToast('Edit cancelled');
}

function editSavedInvoice(index) {
  const all = JSON.parse(localStorage.getItem('pdfBook') || '[]');
  if (!all[index]) return;
  
  const data = all[index];
  // Mark that we're editing this invoice (don't delete yet)
  editingInvoiceIndex = index;
  updateSaveButton(); // Update button appearance
  
  // Load saved invoice data into the form
  document.getElementById('custName').value = data.custName;
  document.getElementById('custPhone').value = data.custPhone;
  document.getElementById('custAddress').value = data.custAddress;
  document.getElementById('advance').value = data.advance;
  document.getElementById('delivery').value = data.delivery;
  
  // Set brand
  setBrand(data.brand);
  
  // Load items
  items = JSON.parse(JSON.stringify(data.items));
  renderItemsList();
  updateInvoice();
  
  showToast('Invoice loaded for editing');
  // Scroll to top and focus on form
  const formTop = document.querySelector('input[name="brand"]')?.closest('.left-panel') || document.body;
  formTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('custName').focus();
}

function deleteSavedInvoice(index) {
  const all = JSON.parse(localStorage.getItem('pdfBook') || '[]');
  if (!all[index]) return;
  
  if (!confirm('Delete this invoice?')) return;
  
  all.splice(index, 1);
  localStorage.setItem('pdfBook', JSON.stringify(all));
  
  // Refresh display
  const invoiceHistoryEl = document.getElementById('invoiceHistory');
  invoiceHistoryEl.innerHTML = '';
  if (all.length > 0) {
    all.forEach((d, idx) => allInvoices(d, idx));
  } else {
    invoiceHistoryEl.style.display = 'none';
  }
  
  showToast('Invoice deleted');
}

function searchInvoices(query) {
  const searchResultsEl = document.getElementById('searchResults');
  const query_lower = query.toLowerCase().trim();
  const all = JSON.parse(localStorage.getItem('pdfBook') || '[]');
  const allPreviews = document.querySelectorAll('[data-invoice-index]');
  
  // If entering search mode with an ongoing edit, clear the form
  if (query_lower && editingInvoiceIndex !== null) {
    // Clear form fields
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custAddress').value = '';
    document.getElementById('advance').value = '0';
    document.getElementById('delivery').value = '120';
    
    // Clear items
    items = [];
    renderItemsList();
    
    // Reset edit mode
    editingInvoiceIndex = null;
    updateSaveButton();
    updateInvoice();
    
    showToast('Edit cancelled - search mode active');
  }
  
  if (!query_lower) {
    // Show all invoices
    searchResultsEl.textContent = '';
    allPreviews.forEach(preview => {
      preview.style.display = 'block';
    });
    return;
  }
  
  // Find matching indices
  const matchingIndices = [];
  all.forEach((invoice, idx) => {
    const name = (invoice.custName || '').toLowerCase();
    const phone = (invoice.custPhone || '').toLowerCase();
    const address = (invoice.custAddress || '').toLowerCase();
    
    if (name.includes(query_lower) || phone.includes(query_lower) || address.includes(query_lower)) {
      matchingIndices.push(idx);
    }
  });
  
  // Hide/show based on search
  allPreviews.forEach((preview, visibleIdx) => {
    const invoiceIndex = parseInt(preview.getAttribute('data-invoice-index'));
    if (matchingIndices.includes(invoiceIndex)) {
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  });
  
  if (matchingIndices.length === 0) {
    searchResultsEl.textContent = 'No invoices found';
    searchResultsEl.style.color = '#999';
  } else {
    searchResultsEl.innerHTML = `<strong style="color: #333;">Found ${matchingIndices.length} invoice(s)</strong>`;
    searchResultsEl.style.color = '#333';
    
    // Scroll to first result
    setTimeout(() => {
      const firstMatch = document.querySelector('[data-invoice-index]:not([style*="display: none"])');
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}

function allInvoices(data, index) {
  if (!data) return;
  document.getElementById('invoiceHistory').appendChild(renderInvoicePreview(data, index));
}

function renderInvoicePreview(data, index) {
  const previewDiv = document.createElement('div');
  previewDiv.classList.add('invoice-preview');
  previewDiv.setAttribute('data-invoice-index', index);
  previewDiv.style.cssText = 'padding:10px;margin-top:15px;background:#fdfdfd;position:relative;';
  
  // Add editing class if this is the invoice being edited
  if (editingInvoiceIndex === index) {
    previewDiv.classList.add('editing');
  }

  const brand = brands[data.brand] || brands[currentBrand] || brands.flappy;

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
    rows = `<tr><td colspan="5" style="text-align:center;padding:20px;">No items added yet</td></tr>`;
  }

  const buttonsHTML = `
    <div style="position:absolute;top:10px;right:10px;display:flex;gap:5px;z-index:100;">
      <button onclick="editSavedInvoice(${index})" style="padding:6px 12px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">Edit</button>
      <button onclick="deleteSavedInvoice(${index})" style="padding:6px 12px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">Delete</button>
    </div>
  `;

  previewDiv.innerHTML = buttonsHTML + `
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo-area">
          <img src="${brand.logo}" class="logo" onerror="this.style.display='none'">
        </div>
        <div class="invoice-meta">
          <h1 class="invoice-title">Invoice</h1>
          <div class="date-row">Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
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
          ${brand.name}<br>${brand.address}<br>${brand.phone}<br>${brand.email}
        </div>
      </div>
      <table class="items-table">
        <thead>
          <tr><th>No</th><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
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
      <div class="thank-you">
        <strong>${brand.emoji} Thank You! ${brand.emoji}</strong><br>
        We truly appreciate your support!<br>
        Stay connected for more exciting collections.<br>
        <strong>${brand.teamName}</strong>
      </div>
    </div>
  `;

  return previewDiv;
}

/* ================= INIT ================= */

const Alldata = JSON.parse(localStorage.getItem('pdfBook') || '[]');

const savedNumber = document.createElement('div');
savedNumber.textContent = `Total Invoice / ${Alldata.length}`;
savedNumber.style.cssText = `
  position: fixed;
  top: 5%;
  right: 2%;
  transform: translateY(-50%);
  background: #111;
  color: #fff;
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 9999;
`;
document.body.appendChild(savedNumber);

const invoiceHistoryEl = document.getElementById('invoiceHistory');
if (Alldata.length > 0) {
  invoiceHistoryEl.style.display = 'block';
  invoiceHistoryEl.innerHTML = ''; // Clear before rendering
  Alldata.forEach((data, idx) => allInvoices(data, idx));
} else {
  invoiceHistoryEl.style.display = 'none';
  invoiceHistoryEl.innerHTML = ''; // Clear if no invoices
}