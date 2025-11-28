import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const RedemptionQRCodePage = () => {
  const { transactionId } = useParams();
  
  // Create QR code data
  const qrData = JSON.stringify({
    type: 'redemption',
    transactionId: parseInt(transactionId),
  });

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
      <h1>Redemption QR Code</h1>
      <p>Transaction ID: {transactionId}</p>
      <p>Show this QR code to a cashier to process your redemption request.</p>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '2rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        margin: '2rem 0',
      }}>
        <QRCodeSVG value={qrData} size={256} />
      </div>
      
      <p style={{ color: '#666', fontSize: '0.875rem' }}>
        The cashier will scan this code to process your redemption.
      </p>
    </div>
  );
};

export default RedemptionQRCodePage;

