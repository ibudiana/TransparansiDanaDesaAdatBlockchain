# Dana Upacara Desa Adat

Aplikasi Web3 untuk pengelolaan dana upacara desa adat secara transparan di blockchain.

Project ini terdiri dari:

- `frontend` (Next.js 16 + React 19 + Ethers v6)
- `hardhat` (Hardhat 3 + Solidity + TypeScript tests)

## Fitur Utama

### Smart Contract

Contract `DanaUpacaraDesaAdat` mendukung:

- Pembuatan campaign dengan target dana
- Donasi ETH ke campaign aktif
- Pengajuan request pengeluaran oleh admin campaign
- Persetujuan request oleh validator
- Finalisasi request (minimal 2 approval)
- Manajemen validator (tambah/hapus)
- Update target campaign
- Penutupan campaign
- Pengajuan penarikan sisa dana campaign tertutup (tetap via voting)

### Frontend

Antarmuka web menyediakan:

- Koneksi wallet (MetaMask)
- Daftar campaign aktif dan arsip campaign selesai
- Pembuatan campaign baru
- Donasi ke campaign
- Panel admin untuk:
  - request pengeluaran
  - kelola validator
  - update target
  - tutup campaign
  - ajukan penarikan sisa dana
- Panel validator untuk approve/finalize request sesuai hak akses

## Struktur Folder

```text
.
├── frontend/   # UI dan integrasi wallet/contract
└── hardhat/    # Smart contract, test, deploy script
```

## Prasyarat

- Node.js 20+ (disarankan LTS)
- npm
- MetaMask (untuk interaksi frontend)

## Setup Cepat (Local Development)

### 1. Install dependency

```bash
cd hardhat && npm install
cd ../frontend && npm install
```

### 2. Compile dan test smart contract

```bash
cd hardhat
npm run compile
npm run test
```

### 3. Jalankan node lokal Hardhat

Buka terminal baru:

```bash
cd hardhat
npm run dev
```

Node lokal berjalan di `http://127.0.0.1:8545`.

### 4. Deploy contract ke node lokal

Buka terminal baru:

```bash
cd hardhat
npm run deploy
```

Catat `Contract Address` dari output deploy.

### 5. Sinkronkan ABI + alamat contract ke frontend

Frontend membaca:

- ABI: `frontend/lib/hardhat/DanaUpacaraDesaAdat.json`
- Address: `frontend/lib/hardhat/config.ts`

Setelah deploy ulang, pastikan:

1. Copy artifact terbaru dari Hardhat ke frontend:

```bash
cp hardhat/artifacts/contracts/DanaUpacaraDesaAdat.sol/DanaUpacaraDesaAdat.json frontend/lib/hardhat/DanaUpacaraDesaAdat.json
```

2. Update alamat kontrak di file `frontend/lib/hardhat/config.ts`.

### 6. Jalankan frontend

```bash
cd frontend
npm run dev
```

Buka `http://localhost:3000`.

## Konfigurasi MetaMask untuk Localhost

Tambahkan network lokal bila belum ada:

- Network Name: Hardhat Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: ETH

Import salah satu private key akun dari output `npm run dev` (hardhat node) ke MetaMask untuk testing.

## Skrip yang Tersedia

### hardhat

```bash
npm run compile   # Compile contract
npm run test      # Jalankan test
npm run dev       # Jalankan local hardhat node
npm run deploy    # Deploy ke localhost
npm run clean     # Bersihkan cache/artifacts
```

### frontend

```bash
npm run dev       # Jalankan Next.js dev server
npm run build     # Build production
npm run start     # Jalankan hasil build
npm run lint      # Lint code
```

## Deploy ke Sepolia (Opsional)

Di konfigurasi Hardhat, network sepolia memakai:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`

Set environment variable tersebut sebelum deploy ke Sepolia. Setelah deploy, update ABI dan alamat kontrak di frontend seperti langkah sinkronisasi di atas.

## Catatan Pengembangan

- Frontend menggunakan alamat statis di `frontend/lib/hardhat/config.ts`.
- Jika contract di-deploy ulang, frontend harus di-update agar tidak mengarah ke alamat lama.
- Test integration contract tersedia di folder `hardhat/test`.
