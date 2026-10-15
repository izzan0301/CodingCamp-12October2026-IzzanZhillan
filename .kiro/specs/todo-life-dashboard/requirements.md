# Requirements Document

## Introduction

To Do List Life Dashboard adalah sebuah website single-page yang berfungsi sebagai dashboard produktivitas personal. Website ini dibangun menggunakan HTML, CSS, dan Vanilla JavaScript murni tanpa framework, dan menyimpan semua data di browser menggunakan Local Storage. Dashboard ini menggabungkan empat fitur utama: Greeting dinamis berbasis waktu, Focus Timer bergaya Pomodoro, To-Do List yang persisten, dan Quick Links yang dapat dikustomisasi — semuanya dalam antarmuka yang bersih, ringan, dan dapat langsung dibuka di browser manapun.

---

## Glossary

- **Dashboard**: Halaman utama satu tampilan (single-page) yang menampilkan semua fitur secara terpadu.
- **Greeting_Component**: Bagian halaman yang menampilkan waktu, tanggal, dan sapaan berbasis waktu.
- **Timer_Component**: Bagian halaman yang mengelola Focus Timer bergaya Pomodoro (25 menit).
- **Todo_Component**: Bagian halaman yang mengelola daftar tugas (tambah, edit, selesai, hapus).
- **QuickLinks_Component**: Bagian halaman yang mengelola dan menampilkan tautan favorit.
- **Storage_Manager**: Modul JavaScript yang menangani semua operasi baca/tulis ke Local Storage.
- **Task**: Sebuah item tugas yang memiliki teks, status selesai, dan timestamp pembuatan.
- **QuickLink**: Sebuah item tautan yang memiliki label tampilan dan URL tujuan.
- **Session**: Satu siklus Focus Timer mulai dari start hingga selesai atau di-reset.
- **Local Storage**: Browser API standar untuk menyimpan data secara persisten di sisi klien.

---

## Requirements

### Requirement 1: Tampilan Greeting Dinamis

**User Story:** Sebagai pengguna, saya ingin melihat waktu, tanggal, dan sapaan yang relevan saat membuka dashboard, sehingga saya merasa disambut dan langsung tahu konteks waktu saat ini.

#### Acceptance Criteria

1. THE Greeting_Component SHALL menampilkan waktu saat ini dalam format HH:MM (jam dan menit, 24 jam).
2. THE Greeting_Component SHALL menampilkan tanggal saat ini dalam format nama hari, tanggal bulan tahun dalam Bahasa Indonesia (contoh: "Kamis, 15 Oktober 2026").
3. WHEN waktu berada antara 05:00 dan 11:59, THE Greeting_Component SHALL menampilkan sapaan "Selamat Pagi".
4. WHEN waktu berada antara 12:00 dan 14:59, THE Greeting_Component SHALL menampilkan sapaan "Selamat Siang".
5. WHEN waktu berada antara 15:00 dan 17:59, THE Greeting_Component SHALL menampilkan sapaan "Selamat Sore".
6. WHEN waktu berada antara 18:00 dan 04:59, THE Greeting_Component SHALL menampilkan sapaan "Selamat Malam".
7. WHEN tampilan waktu diperbarui, THE Greeting_Component SHALL memperbarui jam yang ditampilkan setiap 1 detik tanpa memuat ulang halaman.
8. WHEN halaman dimuat, THE Greeting_Component SHALL menampilkan waktu, tanggal, dan sapaan dalam waktu tidak lebih dari 500 milidetik.
9. IF sumber waktu sistem tidak tersedia atau mengembalikan nilai tidak valid, THEN THE Greeting_Component SHALL menampilkan pesan placeholder yang informatif dan tidak menyebabkan crash pada aplikasi.

---

### Requirement 2: Focus Timer (Pomodoro)

**User Story:** Sebagai pengguna, saya ingin menggunakan timer 25 menit bergaya Pomodoro, sehingga saya dapat bekerja dalam sesi fokus yang terstruktur.

#### Acceptance Criteria

1. THE Timer_Component SHALL menampilkan hitungan mundur dengan durasi awal 25 menit 00 detik dalam format MM:SS.
2. WHEN pengguna menekan tombol Start, THE Timer_Component SHALL memulai hitungan mundur dari waktu yang tersisa.
3. WHILE timer sedang berjalan, THE Timer_Component SHALL memperbarui tampilan hitungan mundur setiap 1 detik dengan toleransi drift maksimal 100 milidetik per interval.
4. WHILE timer sedang berjalan, THE Timer_Component SHALL menonaktifkan tombol Start dan mengaktifkan tombol Stop.
5. WHEN pengguna menekan tombol Stop, THE Timer_Component SHALL menghentikan hitungan mundur dan mempertahankan waktu yang tersisa hingga detik terdekat.
6. WHEN pengguna menekan tombol Reset, THE Timer_Component SHALL menghentikan hitungan mundur dan mengembalikan tampilan ke 25:00.
7. WHEN hitungan mundur mencapai 00:00, THE Timer_Component SHALL menghentikan timer secara otomatis dan memicu notifikasi bahwa sesi fokus telah selesai.
8. IF browser mendukung Notification API dan izin notifikasi telah diberikan oleh pengguna, THEN THE Timer_Component SHALL menampilkan notifikasi sistem bahwa sesi fokus telah selesai.
9. IF browser tidak mendukung Notification API atau izin notifikasi ditolak, THEN THE Timer_Component SHALL menampilkan pesan selesai secara visual di dalam halaman yang tetap terlihat hingga pengguna menutupnya secara manual.
10. WHEN pengguna menekan tombol Start saat timer menampilkan 00:00, THE Timer_Component SHALL tidak memulai hitungan mundur dan tampilan tetap pada 00:00.

---

### Requirement 3: Manajemen To-Do List

**User Story:** Sebagai pengguna, saya ingin mengelola daftar tugas saya (tambah, edit, selesai, hapus) yang tersimpan secara permanen, sehingga saya dapat melacak pekerjaan saya bahkan setelah menutup browser.

#### Acceptance Criteria

1. WHEN pengguna memasukkan teks tugas dengan panjang 1 hingga 200 karakter dan menekan tombol tambah atau menekan tombol Enter, THE Todo_Component SHALL menambahkan Task baru ke daftar dengan status belum selesai.
2. IF teks input kosong atau hanya berisi spasi, THEN THE Todo_Component SHALL menolak penambahan tugas, tidak mengubah daftar, dan menampilkan pesan error yang menginformasikan bahwa teks tugas tidak boleh kosong.
3. IF teks input melebihi 200 karakter, THEN THE Todo_Component SHALL menolak penambahan tugas, tidak mengubah daftar, dan menampilkan pesan error yang menginformasikan batas maksimal karakter.
4. WHEN pengguna menekan tombol edit pada sebuah Task, THE Todo_Component SHALL menampilkan teks Task tersebut dalam mode yang dapat diedit dengan teks awal sama persis dengan teks Task saat ini.
5. WHEN pengguna menyimpan hasil edit dengan teks baru yang tidak kosong dan tidak melebihi 200 karakter, THE Todo_Component SHALL memperbarui teks Task dengan teks baru yang telah dipangkas dari spasi di awal dan akhir.
6. IF teks hasil edit kosong atau hanya berisi spasi, THEN THE Todo_Component SHALL membatalkan perubahan dan mengembalikan teks Task ke nilai sebelum mode edit diaktifkan.
7. WHEN pengguna menandai sebuah Task dengan status belum selesai, THE Todo_Component SHALL mengubah status Task menjadi selesai dan menampilkan teks Task dengan gaya teks dicoret.
8. WHEN pengguna menandai sebuah Task dengan status selesai, THE Todo_Component SHALL mengubah status Task menjadi belum selesai dan menghapus gaya teks dicoret.
9. WHEN pengguna menekan tombol hapus pada sebuah Task, THE Todo_Component SHALL menghapus Task tersebut dari daftar secara permanen dan tidak dapat dibatalkan.
10. WHEN daftar Task dimodifikasi (tambah, edit, selesai, hapus), THE Storage_Manager SHALL menyimpan seluruh daftar Task terkini ke Local Storage dalam waktu tidak lebih dari 300 milidetik setelah modifikasi terjadi.
11. WHEN halaman dimuat, THE Storage_Manager SHALL memuat dan menampilkan seluruh daftar Task yang tersimpan di Local Storage dalam waktu tidak lebih dari 500 milidetik.
12. IF Local Storage tidak memiliki data Task, THEN THE Todo_Component SHALL menampilkan daftar kosong tanpa pesan error.
13. IF Local Storage memiliki data Task yang tidak valid atau tidak dapat diurai, THEN THE Storage_Manager SHALL mengabaikan data tersebut dan menampilkan daftar kosong tanpa pesan error.

---

### Requirement 4: Manajemen Quick Links

**User Story:** Sebagai pengguna, saya ingin menyimpan dan mengakses tautan website favorit saya langsung dari dashboard, sehingga saya dapat membuka website yang sering dikunjungi dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna memasukkan label (1-50 karakter) dan URL yang valid lalu menekan tombol tambah, dan jumlah QuickLink saat ini kurang dari 20, THE QuickLinks_Component SHALL menambahkan QuickLink baru ke daftar.
2. IF label input kosong atau hanya berisi spasi, THEN THE QuickLinks_Component SHALL menolak penambahan QuickLink dan menampilkan indikasi kesalahan pada field label.
3. IF URL input bukan merupakan URL yang valid (tidak dimulai dengan http:// atau https://) atau melebihi 2048 karakter, THEN THE QuickLinks_Component SHALL menolak penambahan QuickLink dan menampilkan indikasi kesalahan pada field URL.
4. WHEN pengguna mengklik sebuah QuickLink, THE QuickLinks_Component SHALL membuka URL tujuan di tab browser baru tanpa menutup atau menavigasi tab yang sedang aktif.
5. WHEN pengguna menekan tombol hapus pada sebuah QuickLink, THE QuickLinks_Component SHALL segera menghapus QuickLink tersebut dari daftar secara permanen dan memperbarui tampilan.
6. WHEN daftar QuickLink dimodifikasi (tambah, hapus), THE Storage_Manager SHALL menyimpan seluruh daftar QuickLink terkini ke Local Storage dalam waktu tidak lebih dari 500 milidetik setelah modifikasi terjadi.
7. WHEN halaman dimuat, THE Storage_Manager SHALL memuat dan menampilkan seluruh daftar QuickLink yang tersimpan di Local Storage dalam waktu tidak lebih dari 1 detik.
8. IF Local Storage tidak memiliki data QuickLink, THEN THE QuickLinks_Component SHALL menampilkan daftar kosong tanpa pesan error.
9. WHEN jumlah QuickLink dalam daftar telah mencapai 20, THE QuickLinks_Component SHALL menonaktifkan tombol tambah dan menampilkan pesan yang menginformasikan bahwa batas maksimal QuickLink telah tercapai.

---

### Requirement 5: Persistensi Data & Kompatibilitas

**User Story:** Sebagai pengguna, saya ingin data saya tersimpan dan dapat diakses kembali saat membuka browser, dan website berfungsi di semua browser modern, sehingga saya tidak perlu setup tambahan.

#### Acceptance Criteria

1. THE Storage_Manager SHALL menggunakan browser Local Storage API sebagai satu-satunya mekanisme penyimpanan data untuk semua data Task dan QuickLink.
2. THE Dashboard SHALL berjalan dengan benar pada Chrome, Firefox, Edge, dan Safari versi terkini (N), dimana N adalah versi major yang dirilis dalam 12 bulan terakhir, mencakup kemampuan membaca, menulis, dan menampilkan data tanpa error pada console browser.
3. THE Dashboard SHALL dapat dibuka dan digunakan sebagai file HTML lokal (via protokol `file://`) tanpa memerlukan server, dengan seluruh fungsionalitas Task dan QuickLink tersedia sepenuhnya.
4. WHEN pengguna menutup dan membuka kembali halaman, THE Storage_Manager SHALL mengembalikan seluruh data Task dan QuickLink ke kondisi terakhir sebelum halaman ditutup dalam waktu kurang dari 2 detik setelah halaman selesai dimuat.
5. IF operasi Local Storage gagal (contoh: mode private browsing atau storage mencapai batas kuota browser), THEN THE Storage_Manager SHALL menampilkan pesan error yang menjelaskan penyebab kegagalan kepada pengguna dalam waktu kurang dari 1 detik, tanpa menyebabkan crash atau hilangnya data yang sudah tersimpan sebelumnya.
6. WHEN Storage_Manager menyimpan data Task atau QuickLink, THE Storage_Manager SHALL menyelesaikan operasi tulis ke Local Storage dalam waktu kurang dari 500 milidetik setelah perubahan data terjadi.

---

### Requirement 6: Struktur File & Kualitas Kode

**User Story:** Sebagai developer, saya ingin struktur file yang bersih dan terorganisir, sehingga kode mudah dipahami dan dipelihara.

#### Acceptance Criteria

1. THE Dashboard SHALL terdiri dari tepat satu file index.html di direktori root, tepat satu file CSS di direktori css/, dan tepat satu file JavaScript di direktori js/, tanpa file tambahan di luar struktur tersebut.
2. THE Dashboard SHALL dibangun hanya menggunakan HTML, CSS, dan Vanilla JavaScript tanpa menggunakan library atau framework eksternal apapun.
3. THE Dashboard SHALL menampilkan seluruh konten tanpa horizontal scrollbar, tanpa elemen yang terpotong, dan tanpa teks yang saling tumpang tindih pada viewport dengan lebar minimum 320px hingga lebar maksimum 1920px.
4. IF halaman Dashboard dibuka di browser, THEN THE Dashboard SHALL tidak menghasilkan error JavaScript di console dan tidak menghasilkan broken layout yang terdeteksi sebagai elemen dengan overflow tersembunyi yang tidak disengaja.
