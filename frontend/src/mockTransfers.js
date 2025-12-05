// Mock transfer data for UNSEAF Portal
export const mockTransfers = [
  {
    "id": "TRF001",
    "transaction_number": "UNSEAF20250915001",
    "transfer_type": "within_unseaf",
    "recipient_name": "John Smith",
    "recipient_account": "2024001",
    "recipient_bank": "UNSEAF Internal",
    "amount": 1500,
    "charge": 0,
    "paid_amount": 1500,
    "status": "completed",
    "created_at": "2025-09-14T18:49:41.636Z"
  },
  {
    "id": "TRF002",
    "transaction_number": "UNSEAF20250914002",
    "transfer_type": "other_bank",
    "recipient_name": "Sarah Johnson",
    "recipient_account": "1234567890",
    "recipient_bank": "Wells Fargo Bank",
    "amount": 2500,
    "charge": 15,
    "paid_amount": 2515,
    "status": "processing",
    "created_at": "2025-09-13T18:49:41.636Z"
  },
  {
    "id": "TRF003",
    "transaction_number": "UNSEAF20250913003",
    "transfer_type": "wire_transfer",
    "recipient_name": "Michael Brown",
    "recipient_account": "9876543210",
    "recipient_bank": "Chase Bank",
    "amount": 5000,
    "charge": 25,
    "paid_amount": 5025,
    "status": "completed",
    "created_at": "2025-09-12T18:49:41.636Z"
  },
  {
    "id": "TRF004",
    "transaction_number": "UNSEAF20250912004",
    "transfer_type": "within_unseaf",
    "recipient_name": "Emily Davis",
    "recipient_account": "2024005",
    "recipient_bank": "UNSEAF Internal", 
    "amount": 750,
    "charge": 0,
    "paid_amount": 750,
    "status": "completed",
    "created_at": "2025-09-11T14:30:00.000Z"
  },
  {
    "id": "TRF005",
    "transaction_number": "UNSEAF20250911005",
    "transfer_type": "other_bank",
    "recipient_name": "Robert Wilson",
    "recipient_account": "5555666677",
    "recipient_bank": "Bank of America",
    "amount": 3200,
    "charge": 15,
    "paid_amount": 3215,
    "status": "failed",
    "created_at": "2025-09-10T09:15:00.000Z"
  }
];

export default mockTransfers;