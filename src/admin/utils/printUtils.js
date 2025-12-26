export const printReceipt = (order) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <html>
      <head>
        <title>Receipt #${order.order_number}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            width: 80mm; 
            margin: 0; 
            padding: 10px; 
            font-size: 14px;
            color: black;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; margin: 5px 0; }
          .info { font-size: 12px; margin-bottom: 10px; }
          .line { border-bottom: 1px dashed black; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 60px; text-align: right; }
          .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ตั้มพานิช</div>
          <div>Tum Panich</div>
          <div class="info">
            Order: #${order.order_number}<br>
            Date: ${new Date(order.created_at).toLocaleString('th-TH')}<br>
            Type: ${order.delivery_type === 'delivery' ? 'Delivery' : 'Dine-in/Pickup'}
          </div>
        </div>
        
        <div class="line"></div>
        
        <div>
          ${order.items.map(item => `
            <div class="item">
              <div class="item-name">${item.name} ${item.note ? `<br><small>(${item.note})</small>` : ''}</div>
              <div class="item-qty">x${item.quantity}</div>
              <div class="item-price">${item.price * item.quantity}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="line"></div>
        
        <div class="item">
          <div>Subtotal</div>
          <div>${order.subtotal || order.total}</div>
        </div>
        ${order.delivery_fee ? `
          <div class="item">
            <div>Delivery Fee</div>
            <div>${order.delivery_fee}</div>
          </div>
        ` : ''}
        
        <div class="total">Total: ฿${order.total}</div>
        
        <div class="footer">
          ขอบคุณที่ใช้บริการ<br>
          Thank you!
        </div>

        <script>
          window.print();
          window.close();
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const printKitchenTicket = (order) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <html>
      <head>
        <title>Kitchen #${order.order_number}</title>
        <style>
          body { 
            font-family: sans-serif; 
            width: 80mm; 
            margin: 0; 
            padding: 10px; 
            color: black;
          }
          .header { margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
          .order-id { font-size: 40px; font-weight: bold; }
          .type { font-size: 20px; font-weight: bold; margin-top: 5px; }
          .time { font-size: 16px; color: #555; }
          .item { margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
          .item-main { font-size: 24px; font-weight: bold; display: flex; gap: 10px; }
          .qty { background: black; color: white; padding: 2px 8px; border-radius: 4px; }
          .note { font-size: 18px; font-weight: bold; color: black; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="order-id">#${order.order_number}</div>
          <div class="type">${order.delivery_type === 'delivery' ? '🛵 DELIVERY' : '🏠 DINE-IN'}</div>
          <div class="time">${new Date(order.created_at).toLocaleTimeString('th-TH')}</div>
          ${order.delivery_note ? `<div style="margin-top:5px; font-weight:bold; font-size:16px;">NOTE: ${order.delivery_note}</div>` : ''}
        </div>
        
        <div>
          ${order.items.map(item => `
            <div class="item">
              <div class="item-main">
                <span class="qty">${item.quantity}</span>
                <span>${item.name}</span>
              </div>
              ${item.note ? `<div class="note">** ${item.note} **</div>` : ''}
            </div>
          `).join('')}
        </div>

        <script>
          window.print();
          window.close();
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
