# Implementation Plan: To Do List Life Dashboard

## Overview

Implementasi dashboard produktivitas single-page menggunakan HTML, CSS, dan Vanilla JavaScript murni. Semua modul ditulis dalam satu file `js/app.js` menggunakan function scope/IIFE pattern, diorkestrasi oleh fungsi `init()` yang dipanggil saat `DOMContentLoaded`. Data disimpan di `localStorage` melalui `StorageManager` sebagai satu-satunya titik akses penyimpanan.

## Tasks

- [x] 1. Buat struktur file proyek dan kerangka HTML
  - Buat direktori `css/` dan `js/` di root proyek
  - Buat `index.html` dengan struktur semantik: section untuk Greeting, Timer, Todo, dan QuickLinks
  - Tambahkan placeholder elemen DOM yang dibutuhkan oleh setiap modul (id/class yang direferensikan di JS)
  - Buat `css/style.css` kosong dan `js/app.js` kosong, lalu hubungkan keduanya dari `index.html`
  - Pastikan tidak ada file tambahan di luar struktur `index.html`, `css/style.css`, `js/app.js`
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implementasi StorageManager
  - [x] 2.1 Implementasi modul StorageManager dengan fungsi `get()`, `set()`, dan `isAvailable()`
    - Gunakan key konstanta `tld_tasks` dan `tld_links`
    - `get(key)` membaca dan parse JSON dari localStorage; kembalikan `null` jika key tidak ada atau JSON tidak valid
    - `set(key, data)` serialize ke JSON dan tulis ke localStorage; kembalikan `false` dan tampilkan pesan error jika gagal (QuotaExceededError, SecurityError)
    - `isAvailable()` melakukan test write/read/delete untuk mengecek ketersediaan localStorage
    - Tangani kasus private browsing: app tetap berjalan dengan state in-memory
    - _Requirements: 5.1, 5.5, 5.6_

  - [ ]* 2.2 Tulis property test untuk StorageManager — Property 18
    - **Property 18: Storage Round-Trip Mempertahankan Data**
    - **Validates: Requirements 5.4**
    - Gunakan `fc.array(taskArb)` dan `fc.array(linkArb)` sebagai generator
    - Verifikasi `get(key)` setelah `set(key, data)` menghasilkan data yang deep-equal dengan input
    - Tag: `// Feature: todo-life-dashboard, Property 18: Storage round-trip`

  - [ ]* 2.3 Tulis property test untuk StorageManager — Property 19
    - **Property 19: Storage Gagal Tidak Menyebabkan Crash**
    - **Validates: Requirements 5.5**
    - Mock `localStorage.setItem` agar melempar exception, verifikasi aplikasi menampilkan pesan error deskriptif dan tidak melempar uncaught exception
    - Tag: `// Feature: todo-life-dashboard, Property 19: Storage failure no crash`

- [x] 3. Implementasi GreetingModule
  - [x] 3.1 Implementasi fungsi `formatTime(hour, minute)`, `formatDate(date)`, dan `getGreeting(hour)`
    - `formatTime`: selalu hasilkan string `HH:MM` dengan zero-padding (dua digit jam dan menit)
    - `formatDate`: hasilkan format "Hari, DD Bulan YYYY" dalam Bahasa Indonesia menggunakan array nama hari dan bulan
    - `getGreeting`: peta jam ke sapaan — [5–11] Pagi, [12–14] Siang, [15–17] Sore, [0–4,18–23] Malam
    - Tangani `Invalid Date`: tampilkan `"-- : --"` untuk jam dan `"Tanggal tidak tersedia"` untuk tanggal tanpa crash
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9_

  - [x] 3.2 Implementasi fungsi `init()` dan `render()` GreetingModule
    - `render()` update DOM dengan jam, tanggal, dan sapaan terkini
    - `init()` panggil `render()` langsung saat inisialisasi (tampilan muncul < 500ms), lalu pasang `setInterval` setiap 1000ms
    - _Requirements: 1.7, 1.8_

  - [ ]* 3.3 Tulis property test untuk GreetingModule — Property 1
    - **Property 1: Format Waktu Selalu HH:MM**
    - **Validates: Requirements 1.1**
    - Generator: `fc.integer({min:0, max:23})` dan `fc.integer({min:0, max:59})`
    - Verifikasi output selalu cocok dengan regex `/^\d{2}:\d{2}$/`
    - Tag: `// Feature: todo-life-dashboard, Property 1: Time format HH:MM`

  - [ ]* 3.4 Tulis property test untuk GreetingModule — Property 2
    - **Property 2: Format Tanggal Bahasa Indonesia**
    - **Validates: Requirements 1.2**
    - Generator: `fc.date()`
    - Verifikasi output mengandung salah satu nama hari (Minggu–Sabtu) dan salah satu nama bulan (Januari–Desember) dan angka tahun 4 digit
    - Tag: `// Feature: todo-life-dashboard, Property 2: Indonesian date format`

  - [ ]* 3.5 Tulis property test untuk GreetingModule — Property 3
    - **Property 3: Sapaan Selalu Sesuai Jam**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - Generator: `fc.integer({min:0, max:23})`
    - Verifikasi pemetaan exhaustive dan tidak tumpang tindih untuk semua 24 nilai jam
    - Tag: `// Feature: todo-life-dashboard, Property 3: Greeting matches hour`

- [x] 4. Checkpoint — Verifikasi GreetingModule dan StorageManager
  - Pastikan semua tes yang ada lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 5. Implementasi TimerModule
  - [x] 5.1 Implementasi state machine dan logika inti TimerModule
    - Definisikan state: `{ remaining: number(ms), status: 'idle'|'running'|'paused'|'done' }`
    - Implementasi `start()`: mulai/lanjutkan countdown menggunakan waktu absolut (`Date.now() - startTimestamp`) untuk meminimalkan drift
    - Implementasi `stop()`: hentikan countdown, pertahankan `remaining` hingga detik terdekat
    - Implementasi `reset()`: kembalikan `remaining` ke `25 * 60 * 1000` ms, status → `idle`
    - Implementasi `tick()`: kurangi remaining, cek apakah sudah 00:00, panggil `notifyDone()` jika selesai
    - Tolak `start()` jika status `done` (00:00): tidak lakukan apapun
    - Tangani `Date.now()` tidak valid: tampilkan `"--:--"` sebagai placeholder
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.10_

  - [x] 5.2 Implementasi `notifyDone()`, `renderDisplay()`, `updateButtons()`, dan `init()` TimerModule
    - `notifyDone()`: coba Notification API jika tersedia dan izin granted; fallback ke in-page visual message yang tetap terlihat hingga pengguna menutupnya manual
    - `renderDisplay()`: update DOM MM:SS dari nilai `remaining`
    - `updateButtons()`: nonaktifkan Start dan aktifkan Stop saat running; kebalikannya saat idle/paused/done
    - `init()`: render awal tampilan 25:00, pasang event listeners untuk tombol Start, Stop, Reset
    - _Requirements: 2.4, 2.7, 2.8, 2.9_

  - [ ]* 5.3 Tulis property test untuk TimerModule — Property 4
    - **Property 4: Reset Timer Selalu Kembalikan ke 25:00**
    - **Validates: Requirements 2.6**
    - Generator: `fc.integer({min:0, max:1500000})` untuk `remaining` dan `fc.oneof(fc.constant('idle'), fc.constant('running'), fc.constant('paused'), fc.constant('done'))` untuk status
    - Verifikasi setelah `reset()`: `remaining === 25 * 60 * 1000` dan `status === 'idle'`
    - Tag: `// Feature: todo-life-dashboard, Property 4: Reset timer to 25:00`

  - [ ]* 5.4 Tulis property test untuk TimerModule — Property 5
    - **Property 5: Notifikasi Selesai Memilih Strategi yang Tepat**
    - **Validates: Requirements 2.8, 2.9**
    - Generator: `fc.boolean()` × `fc.boolean()` (API support × permission granted)
    - Verifikasi: API tersedia DAN granted → gunakan `new Notification()`; semua kasus lain → tampilkan in-page message
    - Tag: `// Feature: todo-life-dashboard, Property 5: Notification strategy`

- [x] 6. Implementasi TodoModule
  - [x] 6.1 Implementasi fungsi `validateText(text)` dan data model Task
    - `validateText`: trim input, tolak jika kosong (termasuk whitespace-only), tolak jika > 200 karakter setelah trim; kembalikan `{ valid: boolean, error: string|null }`
    - Implementasi `generateId()` menggunakan `crypto.randomUUID()` dengan fallback ke `'id-' + Date.now() + '-' + Math.random().toString(36).slice(2)`
    - _Requirements: 3.2, 3.3_

  - [ ]* 6.2 Tulis property test untuk TodoModule — Property 7
    - **Property 7: Teks Whitespace-Only Selalu Ditolak**
    - **Validates: Requirements 3.2**
    - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))`
    - Verifikasi `validateText(text)` mengembalikan `{ valid: false }` dan list tidak berubah
    - Tag: `// Feature: todo-life-dashboard, Property 7: Whitespace-only rejected`

  - [ ]* 6.3 Tulis property test untuk TodoModule — Property 8
    - **Property 8: Teks Lebih dari 200 Karakter Selalu Ditolak**
    - **Validates: Requirements 3.3**
    - Generator: `fc.string({minLength:201, maxLength:500})`
    - Verifikasi `validateText(text)` mengembalikan `{ valid: false }` dan list tidak berubah
    - Tag: `// Feature: todo-life-dashboard, Property 8: Text >200 chars rejected`

  - [x] 6.4 Implementasi `addTask(text)`, `deleteTask(id)`, dan `render()` TodoModule
    - `addTask`: validasi → buat Task baru dengan id, text.trim(), completed=false, createdAt=Date.now() → push ke array → simpan via StorageManager → render
    - `deleteTask`: filter array by id → simpan via StorageManager → render
    - `render()`: rebuild seluruh task list DOM dari array state; tampilkan daftar kosong jika tidak ada task (tanpa pesan error)
    - `showError(message)`: tampilkan pesan error di UI untuk input kosong dan teks terlalu panjang
    - _Requirements: 3.1, 3.9, 3.10, 3.12_

  - [ ]* 6.5 Tulis property test untuk TodoModule — Property 6
    - **Property 6: Penambahan Task Valid Selalu Masuk ke List**
    - **Validates: Requirements 3.1**
    - Generator: `fc.string({minLength:1, maxLength:200})` yang setelah trim masih valid
    - Verifikasi: panjang list bertambah tepat 1, `task.text === text.trim()`, `task.completed === false`
    - Tag: `// Feature: todo-life-dashboard, Property 6: Valid task added to list`

  - [ ]* 6.6 Tulis property test untuk TodoModule — Property 12
    - **Property 12: Penghapusan Task Benar-Benar Menghapus dari List**
    - **Validates: Requirements 3.9**
    - Generator: `fc.array(taskArb, {minLength:1})`, pilih satu id secara acak
    - Verifikasi: list tidak mengandung id tersebut setelah `deleteTask(id)`, semua task lain tetap ada
    - Tag: `// Feature: todo-life-dashboard, Property 12: Delete removes task`

  - [x] 6.7 Implementasi `editTask(id, newText)` dan `toggleTask(id)` TodoModule
    - `editTask`: validasi teks baru → jika valid, update `task.text = newText.trim()` (pertahankan `id` dan `createdAt`) → simpan → render; jika whitespace-only, batalkan dan kembalikan teks semula
    - `toggleTask`: flip nilai `task.completed` → simpan → render; tampilkan teks dicoret jika completed
    - Implementasi mode edit inline: tampilkan input dengan teks awal sama persis dengan teks task saat ini
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 6.8 Tulis property test untuk TodoModule — Property 9
    - **Property 9: Edit Task Menerapkan Trim dan Mempertahankan ID**
    - **Validates: Requirements 3.5**
    - Generator: `fc.record({id: fc.string(), text: fc.string(), completed: fc.boolean(), createdAt: fc.integer()})` dan `fc.string({minLength:1, maxLength:200})`
    - Verifikasi: `task.text === newText.trim()`, `task.id` dan `task.createdAt` tidak berubah
    - Tag: `// Feature: todo-life-dashboard, Property 9: Edit trims and preserves ID`

  - [ ]* 6.9 Tulis property test untuk TodoModule — Property 10
    - **Property 10: Edit dengan Whitespace-Only Membatalkan Perubahan**
    - **Validates: Requirements 3.6**
    - Generator: `fc.record({...})` untuk task dan `fc.stringOf(fc.constantFrom(' ', '\t'))` untuk input edit
    - Verifikasi: `task.text` sama persis dengan nilai sebelum mode edit diaktifkan
    - Tag: `// Feature: todo-life-dashboard, Property 10: Whitespace edit cancels`

  - [ ]* 6.10 Tulis property test untuk TodoModule — Property 11
    - **Property 11: Toggle Status Task adalah Round-Trip**
    - **Validates: Requirements 3.7, 3.8**
    - Generator: `fc.record({...completed: fc.boolean()})`
    - Verifikasi: `toggleTask(id)` dua kali berturut-turut menghasilkan nilai `completed` yang identik dengan semula
    - Tag: `// Feature: todo-life-dashboard, Property 11: Toggle round-trip`

  - [x] 6.11 Implementasi `init()` TodoModule dan integrasi dengan StorageManager
    - `init()`: muat data dari `StorageManager.get('tld_tasks')`, inisialisasi array tasks (kosong jika null/tidak valid), pasang event listeners untuk form tambah task (tombol tambah dan Enter), render
    - Pastikan seluruh modifikasi list (tambah, edit, toggle, hapus) memanggil `StorageManager.set()` dalam waktu ≤ 300ms
    - Tangani data Storage tidak valid: tampilkan daftar kosong tanpa pesan error
    - _Requirements: 3.11, 3.13_

- [x] 7. Checkpoint — Verifikasi TodoModule
  - Pastikan semua tes yang ada lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 8. Implementasi QuickLinksModule
  - [x] 8.1 Implementasi `validateLabel(label)` dan `validateUrl(url)` QuickLinksModule
    - `validateLabel`: trim input, tolak jika kosong atau panjang > 50 karakter; kembalikan `{ valid: boolean, error: string|null }`
    - `validateUrl`: tolak jika tidak dimulai `http://` atau `https://`, atau panjang > 2048 karakter; kembalikan `{ valid: boolean, error: string|null }`
    - _Requirements: 4.2, 4.3_

  - [ ]* 8.2 Tulis property test untuk QuickLinksModule — Property 14
    - **Property 14: Label Whitespace-Only Selalu Ditolak**
    - **Validates: Requirements 4.2**
    - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))`
    - Verifikasi `validateLabel(label)` mengembalikan `{ valid: false }`
    - Tag: `// Feature: todo-life-dashboard, Property 14: Whitespace label rejected`

  - [ ]* 8.3 Tulis property test untuk QuickLinksModule — Property 15
    - **Property 15: URL Tidak Valid Selalu Ditolak**
    - **Validates: Requirements 4.3**
    - Generator: URL tanpa prefix `http://`/`https://` atau `fc.string({minLength:2049})`
    - Verifikasi `validateUrl(url)` mengembalikan `{ valid: false }`
    - Tag: `// Feature: todo-life-dashboard, Property 15: Invalid URL rejected`

  - [x] 8.4 Implementasi `addLink(label, url)`, `deleteLink(id)`, `updateAddButtonState()`, dan `render()` QuickLinksModule
    - `addLink`: validasi label dan URL → jika count < 20, buat QuickLink baru → push → simpan → render → update button state; tampilkan indikasi error pada field yang gagal validasi
    - `deleteLink`: filter array by id → simpan → render → update button state
    - `updateAddButtonState()`: disable tombol tambah dan tampilkan pesan jika `links.length >= 20`; enable jika < 20
    - `render()`: rebuild links DOM; setiap link membuka URL di tab baru (`target="_blank"`)
    - Tampilkan daftar kosong tanpa pesan error jika tidak ada QuickLink
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.8, 4.9_

  - [ ]* 8.5 Tulis property test untuk QuickLinksModule — Property 13
    - **Property 13: Penambahan QuickLink Valid Selalu Masuk ke List (count < 20)**
    - **Validates: Requirements 4.1**
    - Generator: `fc.string({minLength:1, maxLength:50})` untuk label, URL arbiter valid, array dengan panjang < 20
    - Verifikasi: panjang list bertambah tepat 1, `link.label === label.trim()`, `link.url === url`
    - Tag: `// Feature: todo-life-dashboard, Property 13: Valid QuickLink added`

  - [ ]* 8.6 Tulis property test untuk QuickLinksModule — Property 16
    - **Property 16: Penghapusan QuickLink Benar-Benar Menghapus dari List**
    - **Validates: Requirements 4.5**
    - Generator: `fc.array(linkArb, {minLength:1})`, pilih satu id secara acak
    - Verifikasi: list tidak mengandung id tersebut setelah `deleteLink(id)`, semua QuickLink lain tetap ada
    - Tag: `// Feature: todo-life-dashboard, Property 16: Delete removes QuickLink`

  - [ ]* 8.7 Tulis property test untuk QuickLinksModule — Property 17
    - **Property 17: Tombol Tambah Sesuai dengan Jumlah QuickLink**
    - **Validates: Requirements 4.9**
    - Generator: `fc.integer({min:0, max:20})`
    - Verifikasi: count < 20 → tombol enabled; count >= 20 → tombol disabled
    - Tag: `// Feature: todo-life-dashboard, Property 17: Add button matches count`

  - [x] 8.8 Implementasi `init()` QuickLinksModule dan integrasi dengan StorageManager
    - `init()`: muat data dari `StorageManager.get('tld_links')`, inisialisasi array links (kosong jika null/tidak valid), pasang event listeners untuk form tambah link, render, update button state
    - Pastikan seluruh modifikasi list memanggil `StorageManager.set()` dalam waktu ≤ 500ms
    - _Requirements: 4.7_

- [x] 9. Checkpoint — Verifikasi QuickLinksModule
  - Pastikan semua tes yang ada lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 10. Styling dengan CSS dan responsivitas
  - Tulis `css/style.css`: layout grid/flexbox yang menampilkan semua empat komponen dalam satu tampilan
  - Pastikan tidak ada horizontal scrollbar, tidak ada elemen terpotong, tidak ada teks tumpang tindih pada viewport 320px hingga 1920px
  - Berikan gaya teks dicoret (`text-decoration: line-through`) untuk task yang completed
  - Berikan gaya visual yang jelas untuk: state error pada input, tombol disabled, in-page notification timer selesai
  - _Requirements: 6.3_

- [x] 11. Orkestrasi dan wiring di `app.js`
  - [x] 11.1 Tulis fungsi `init()` utama di `app.js` yang mengorkestrasi semua modul
    - Panggil `StorageManager` lebih dulu, cek `isAvailable()`; jika tidak tersedia tampilkan banner peringatan
    - Panggil `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `QuickLinksModule.init()` berurutan
    - Pasang listener `DOMContentLoaded` untuk memanggil fungsi `init()` utama
    - Pastikan tidak ada ES Module import; semua modul menggunakan IIFE pattern agar kompatibel dengan `file://`
    - _Requirements: 5.2, 5.3, 6.2, 6.4_

  - [x] 11.2 Verifikasi tidak ada error JavaScript di console dan tidak ada broken layout
    - Buka `index.html` via `file://` dan pastikan semua komponen terinisialisasi
    - Pastikan tidak ada `console.error` atau uncaught exceptions
    - _Requirements: 6.4_

- [ ] 12. Final Checkpoint — Verifikasi menyeluruh
  - Pastikan semua tes lulus, semua komponen berfungsi secara terintegrasi di `file://`, dan tanyakan kepada pengguna jika ada pertanyaan.

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Property tests menggunakan **fast-check** via CDN: `<script src="https://cdn.jsdelivr.net/npm/fast-check/lib/bundle/fast-check.min.js"></script>`
- Minimum 100 iterasi per property test; gunakan `{ numRuns: 200 }` untuk properti kritis
- Setiap property test diberi tag komentar: `// Feature: todo-life-dashboard, Property N: <deskripsi>`
- Semua modul menggunakan IIFE pattern agar kompatibel dengan protokol `file://` tanpa server
- `StorageManager` diinisialisasi pertama karena semua modul lain bergantung padanya
- Fallback graceful jika localStorage tidak tersedia: app berjalan dengan state in-memory

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5", "6.6", "6.7"] },
    { "id": 8, "tasks": ["6.8", "6.9", "6.10", "6.11"] },
    { "id": 9, "tasks": ["8.1"] },
    { "id": 10, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 11, "tasks": ["8.5", "8.6", "8.7", "8.8"] },
    { "id": 12, "tasks": ["10"] },
    { "id": 13, "tasks": ["11.1"] },
    { "id": 14, "tasks": ["11.2"] }
  ]
}
```
