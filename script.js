let items = [];

function openModal(){
  document.getElementById('itemModal').style.display='flex';
  document.getElementById('modalProductName').value='';
  document.getElementById('modalPrice').value=0;
  document.getElementById('modalQty').value=1;
}

function closeModal(){ document.getElementById('itemModal').style.display='none'; }

function addItemFromModal(){
  const name=document.getElementById('modalProductName').value.trim();
  const price=parseFloat(document.getElementById('modalPrice').value)||0;
  const qty=parseInt(document.getElementById('modalQty').value)||1;
  if(!name){ alert('Product name required'); return; }
  items.push({name,price,qty,total:price*qty});
  closeModal();
  renderItemsList();
  updateInvoice();
}

function removeItem(index){
  items.splice(index,1);
  renderItemsList();
  updateInvoice();
}

function renderItemsList(){
  const container=document.getElementById('itemsListContainer');
  if(items.length===0){ container.innerHTML=''; return; }

  let html='<table><thead><tr><th>No</th><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Action</th></tr></thead><tbody>';
  items.forEach((item,idx)=>{
    html+=`<tr>
      <td>${idx+1}</td>
      <td>${item.name}</td>
      <td>${item.price.toFixed(0)}TK</td>
      <td>${item.qty}</td>
      <td>${item.total.toFixed(0)}TK</td>
      <td><button class="btn btn-remove" onclick="removeItem(${idx})">X</button></td>
    </tr>`;
  });
  html+='</tbody></table>';
  container.innerHTML=html;
}

function collectData(){
  const ordNum=document.getElementById('ordNum').value||'xyz';
  const custName=document.getElementById('custName').value||'Customer Name';
  const custPhone=document.getElementById('custPhone').value||'Phone Number';
  const custAddress=document.getElementById('custAddress').value||'Address';
  const advance=parseFloat(document.getElementById('advance').value)||0;
  const delivery=parseFloat(document.getElementById('delivery').value)||0;

  const itemsTotal=items.reduce((sum,i)=>sum+i.total,0);
  const subTotal=itemsTotal-advance+delivery;
  return {ordNum,custName,custPhone,custAddress,advance,delivery,itemsTotal,subTotal,items};
}

function updateInvoice() {
  const data = collectData();

  let rows = '';
  data.items.forEach((i, idx) => {
 rows += `<tr>
  <td>${idx + 1}</td>
  <td>${i.name}</td>
  <td class="qty">${i.qty}</td>
  <td class="price">${i.price.toFixed(0)} TK</td>
  <td class="amount">${i.total.toFixed(0)} TK</td>
</tr>`;
  });

  if (!data.items.length) rows = '<tr><td colspan="5" style="text-align:center;padding:20px;">No items added yet</td></tr>';

  document.getElementById('invoice').innerHTML = `
    <div class="invoice-container" >
    <div class="invoice-header">
  <div class="logo-area">
    <img src="image/logo.png" class="logo" alt="Flappy Fashion" onerror="this.style.display='none'">
  </div>
  <div class="invoice-meta">
    <div class="invoice-number">Order Number: ${data.ordNum}</div>
    <h1 class="invoice-title">Invoice</h1>
    <div class="date-row">
      Date: ${new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'})}
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
          0 1765-763455<br>     
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
    ${rows}   <!-- your existing rows, but update to 5 columns: -->
    <!-- Example row structure: -->
    <!-- <tr><td>1</td><td>women Slipper</td><td>1</td><td class="price">12102 TK</td><td class="amount">12102 TK</td></tr> -->
    <tr class="total-row">
      <td colspan="4" style="text-align:right; font-weight:bold;">Total</td>
      <td class="amount">${data.itemsTotal.toFixed(0)} TK</td>
    </tr>
  </tbody>
</table>
      <div class="summary-extra">
        <div><strong>Advance:</strong> ${data.advance.toFixed(0)} TK</div>
        <div><strong>Delivery:</strong> ${data.delivery.toFixed(0)} TK</div>
        <div class="grand"><strong>Amount Due:</strong> ${data.subTotal.toFixed(0)} TK</div>
      </div>
      <div class="payment-note">
        <div><strong>Payment method:</strong> Cash</div>
        <div class="note"><strong>Note:</strong> Thank you for choosing us!</div>
      </div>
      <div class="spacer"></div>
      <div class="thank-you">
        <strong>🌸 Thank You! 🌸</strong><br>
        We truly appreciate your support!<br>
        Stay connected for more exciting collections.<br>
        <strong>Team FLAPPY</strong>
      </div>
    </div>
  `;
}

['ordNum','custName','custPhone','custAddress','advance','delivery'].forEach(id=>{
  document.getElementById(id).addEventListener('input',updateInvoice);
});

// Function to open modal
function openModal() {
  document.getElementById('itemModal').classList.add('show'); // Add 'show' class to make it visible
  document.getElementById('modalProductName').value = '';
  document.getElementById('modalPrice').value = 0;
  document.getElementById('modalQty').value = 1;
}

// Function to close modal
function closeModal() {
  document.getElementById('itemModal').classList.remove('show'); // Remove 'show' class to hide it
}

// Close modal when clicking outside the modal
window.onclick = function(e) {
  if (e.target == document.getElementById('itemModal')) {
    closeModal();
  }
}


updateInvoice();

// PDF download
function downloadPDF() {
  updateInvoice();
const data = collectData()
  const element = document.getElementById('invoice');

  html2pdf()
    .from(element)
    .set({
      margin:      [15, 10, 15, 10], 
      padding: [5],  // top, right, bottom, left – more bottom space
      filename:    `${data.custName}`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2.0,                    // higher = sharper, but bigger file
        useCORS: true,
        logging: false,
        scrollY: 0
      },
      jsPDF:       { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak:   { 
        mode: ['avoid-all', 'css'], 
        avoid: ['tr', '.summary-extra', '.thank-you', 'table'] 
      }
    })
    .save();
}


// Close modal when clicking outside
window.onclick = function(e){
  if(e.target==document.getElementById('itemModal')) closeModal();
}
