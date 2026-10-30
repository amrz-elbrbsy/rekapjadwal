# Insentif Pro

Buat aplikasi web production-ready bernama:



INSENTIF TEKNISI



Aplikasi ini digunakan untuk mengelola data pekerjaan teknisi pemasangan roller blind dan menghitung insentif teknisi secara otomatis.



==================================================

KETENTUAN UTAMA

==================================================



1. Gunakan Lovable sebagai frontend/application builder.

2. Gunakan Supabase sebagai database online.

3. TIDAK ADA LOGIN.

4. TIDAK ADA REGISTER.

5. Jangan menggunakan Google Apps Script.

6. Jangan menggunakan localStorage sebagai database utama.

7. Semua data utama harus tersimpan di Supabase.

8. Aplikasi harus dapat diakses online melalui HP, tablet, dan desktop.

9. Semua perangkat harus melihat data yang sama secara realtime setelah refresh.

10. Buat aplikasi seperti software operasional perusahaan, bukan sekadar template CRUD sederhana.



==================================================

DESAIN UI

==================================================



Buat UI profesional dan modern.



Style:

- SaaS dashboard

- clean

- profesional

- white/off-white background

- navy/dark blue

- blue accent

- border tipis

- radius 10–14px

- typography modern

- whitespace cukup

- tabel profesional

- badge status

- icon Lucide

- responsive



Jangan:

- glassmorphism berlebihan

- 3D

- warna terlalu ramai

- gradient berlebihan

- desain gaming

- desain seperti template AI generik



Sidebar desktop:



Dashboard

Data Project

Rekap Teknisi

Laporan

Master Data

  ├── Teknisi

  ├── Jenis Project

  └── Harga Insentif



Mobile:

gunakan drawer/sidebar yang nyaman untuk Android.



==================================================

REFERENSI FORMAT EXCEL

==================================================



Saya memiliki file Excel referensi:



"INSENTIF PEMASANGAN 2026 ( JULI - SEPT ).xlsx"



Gunakan file tersebut sebagai REFERENSI UTAMA struktur tabel dan laporan.



PENTING:



Jangan membuat format export Excel generik.



Struktur hasil export harus dibuat semirip mungkin dengan workbook tersebut.



Pertahankan konsep:



- sheet per bulan

- section berdasarkan jenis pekerjaan

- kolom teknisi

- Qty

- customer

- tanggal

- subtotal

- total

- rekap teknisi



Jika ada perbedaan antara struktur Excel lama dan business rule aplikasi baru, prioritaskan business rule aplikasi baru untuk PERHITUNGAN, tetapi pertahankan struktur visual/format laporan Excel semaksimal mungkin.



==================================================

JENIS PEKERJAAN

==================================================



Master jenis project:



1. UKUR

2. PASANG RAIL

3. PASANG MANUAL ROLLERBLIND

4. PASANG ZIPBLIND / EXTREME EXTERIOR / MANUAL ZIPBLIND

5. PASANG MOTOR ROLLERBLIND/EXTERIOR

6. SALAH UKUR



Nama jenis pekerjaan harus bisa diedit dari Master Data.



==================================================

HARGA INSENTIF DEFAULT

==================================================



Gunakan harga berdasarkan workbook:



UKUR

Rp500



PASANG RAIL

Rp3.000



PASANG MANUAL ROLLERBLIND

Rp5.000



PASANG ZIPBLIND / EXTREME EXTERIOR / MANUAL ZIPBLIND

Rp50.000



PASANG MOTOR ROLLERBLIND/EXTERIOR

Rp15.000



SALAH UKUR

Rp30.000



Harga dapat diedit.



Jangan hardcode harga di frontend.



Harga harus berasal dari tabel Supabase.



Ketika project dibuat, simpan juga:



incentive_price_snapshot



agar perubahan harga di masa depan tidak mengubah histori project lama.



==================================================

MASTER TEKNISI

==================================================



Teknisi awal:



AMIR

SUKMA

IQBAL

RIDWAN

ASEP

AFAN

ARMAN

FERY

AWANG

YANTO



Teknisi dapat:



- tambah

- edit

- aktifkan

- nonaktifkan



Teknisi nonaktif tidak muncul pada project baru.



Namun histori project lama tetap mempertahankan nama teknisi tersebut.



==================================================

BUSINESS RULE INSENTIF

==================================================



INI ADALAH RULE TERPENTING.



Setiap project memiliki Qty sendiri.



Jumlah teknisi dalam setiap project dapat berbeda.



Rumus:



TOTAL INSENTIF PROJECT



Qty × Harga Insentif



INSENTIF MASING-MASING TEKNISI



(Qty ÷ jumlah teknisi) × Harga Insentif



JANGAN:



Qty × jumlah teknisi × harga



==================================================

CONTOH

==================================================



Qty = 23



Teknisi:



AMIR

ASEP

ARMAN



Jumlah teknisi = 3



Harga = Rp50.000



Total project:



23 × 50.000

= Rp1.150.000



Per teknisi:



23 ÷ 3 × 50.000

= Rp383.333,33



Qty masing-masing:



23 ÷ 3

= 7,6667



Tampilkan:



AMIR

Qty: 7,6667

Insentif: Rp383.333



ASEP

Qty: 7,6667

Insentif: Rp383.333



ARMAN

Qty: 7,6667

Insentif: Rp383.333



==================================================

VALIDASI

==================================================



Jika Qty kosong atau <= 0:



"Qty harus lebih dari 0."



Jika tidak ada teknisi:



"Teknisi belum dipilih."



Jika harga tidak tersedia:



"Harga insentif belum tersedia."



Jika teknisi yang sama dipilih dua kali:



"Teknisi sudah dipilih."



Jangan menghitung teknisi duplikat dua kali.



Jika tidak ada teknisi, jangan menghitung insentif.



==================================================

DATA PROJECT

==================================================



Field:



id

nomor_project

tanggal

customer

jenis_project

qty

satuan

harga_insentif

total_insentif

status

catatan

created_at

updated_at



Status:



DRAFT

SELESAI

DIBATALKAN



Hanya project dengan status:



SELESAI



yang masuk ke rekap insentif.



==================================================

TEKNISI PROJECT

==================================================



Satu project dapat mempunyai banyak teknisi.



Gunakan tabel:



project_technicians



Field:



id

project_id

technician_id

allocated_qty

incentive_amount

created_at



allocated_qty:



qty / jumlah_teknisi



incentive_amount:



allocated_qty × harga_insentif



==================================================

HALAMAN DASHBOARD

==================================================



Buat dashboard profesional.



Card:



Total Project

Project Selesai

Total Qty

Total Insentif

Jumlah Teknisi Aktif



Filter:



Bulan

Tahun

Jenis Project

Status



Grafik:



1. Total insentif per bulan

2. Total insentif per teknisi

3. Project berdasarkan jenis pekerjaan

4. Trend total Qty



Tambahkan:



Recent Project



==================================================

HALAMAN DATA PROJECT

==================================================



Jangan tampilkan seluruh project dalam satu tabel panjang.



Pisahkan berdasarkan jenis pekerjaan.



SECTION:



UKUR



PASANG RAIL



PASANG MANUAL ROLLERBLIND



PASANG ZIPBLIND / EXTREME EXTERIOR / MANUAL ZIPBLIND



PASANG MOTOR ROLLERBLIND/EXTERIOR



SALAH UKUR



Setiap section memiliki:



Jumlah Project

Total Qty

Total Insentif



Tabel:



Tanggal

Customer

Qty

Teknisi

Harga

Total Insentif

Status

Action



Action:



Detail

Edit

Hapus



Filter:



Bulan

Tahun

Customer

Jenis Project

Status



Search customer harus realtime.



==================================================

FORM PROJECT

==================================================



Buat modal besar/profesional.



Field:



Tanggal

Customer

Jenis Project

Qty

Satuan

Teknisi

Status

Catatan



Teknisi menggunakan multi-select checkbox.



Saat user memilih:



Qty

Jenis Project

Teknisi



langsung tampilkan kalkulasi:



--------------------------------



PERHITUNGAN INSENTIF



Qty:

23



Jumlah Teknisi:

3



Harga:

Rp50.000



Total Project:

Rp1.150.000



Per Teknisi:

Rp383.333



Qty per Teknisi:

7,6667



--------------------------------



Breakdown:



AMIR

7,6667 Qty

Rp383.333



ASEP

7,6667 Qty

Rp383.333



ARMAN

7,6667 Qty

Rp383.333



==================================================

REKAP TEKNISI

==================================================



Buat halaman khusus Rekap Teknisi.



Filter:



Bulan

Tahun

Teknisi

Jenis Project



Table:



Teknisi

Jumlah Project

Total Qty

Total Insentif



Contoh:



AMIR

12 project

48,5000 Qty

Rp1.250.000



Klik teknisi untuk membuka detail.



Detail:



Tanggal

Customer

Jenis Project

Qty Project

Jumlah Teknisi

Qty Teknisi

Harga

Insentif



Tambahkan subtotal berdasarkan jenis pekerjaan.



==================================================

REKAP PER JENIS PROJECT

==================================================



Table:



Jenis Project

Jumlah Project

Total Qty

Total Insentif



Tambahkan total keseluruhan.



==================================================

LAPORAN BULANAN

==================================================



Buat halaman laporan.



Contoh:



JULI 2026

AGUSTUS 2026

SEPTEMBER 2026



Laporan menampilkan:



Total Project

Total Qty

Total Insentif



Rekap per jenis pekerjaan.



Rekap per teknisi.



==================================================

EXPORT EXCEL

==================================================



Ini sangat penting.



Buat tombol:



EXPORT EXCEL



User dapat memilih:



- Bulan tertentu

- Semua bulan

- Rekap teknisi

- Rekap project



FORMAT EXCEL HARUS MENYERUPAI FILE REFERENSI.



Untuk export bulanan:



Sheet:



JULI 2026

AGUSTUS 2026

SEPTEMBER 2026



Jika export semua bulan, buat semua sheet tersebut dalam satu workbook.



Setiap sheet memiliki section:



UKUR



PASANG RAIL



PASANG MANUAL ROLLERBLIND



PASANG ZIPBLIND / EXTREME EXTERIOR / MANUAL ZIPBLIND



PASANG MOTOR ROLLERBLIND/EXTERIOR



SALAH UKUR



Gunakan format tabel yang menyerupai workbook referensi.



Pertahankan:



- header

- section title

- kolom tanggal

- customer

- Qty

- teknisi

- total

- subtotal

- total akhir

- rekap teknisi



Gunakan library Excel yang sesuai untuk menghasilkan XLSX.



Jangan hanya export CSV.



==================================================

EXPORT PDF

==================================================



Buat tombol:



EXPORT PDF



Pilihan:



PDF Bulanan

PDF Rekap Teknisi

PDF Detail Project



PDF harus memiliki:



Header perusahaan/aplikasi

Judul laporan

Periode

Tabel

Subtotal

Total



Gunakan layout A4.



Jika tabel panjang:



otomatis lanjut halaman.



Header tabel harus muncul kembali di setiap halaman.



Jangan sampai tabel terpotong secara buruk.



==================================================

FORMAT ANGKA

==================================================



Qty:



gunakan decimal.



Contoh:



7,6667



Nominal:



Rp383.333



Gunakan format Indonesia:



Rp1.150.000



Jangan tampilkan:



383333.333333



==================================================

DATABASE SUPABASE

==================================================



Buat tabel:



technicians



project_types



incentive_prices



projects



project_technicians



audit_logs



==================================================

TABLE TECHNICIANS

==================================================



id

name

status

created_at

updated_at



==================================================

TABLE PROJECT_TYPES

==================================================



id

name

code

status

created_at

updated_at



==================================================

TABLE INCENTIVE_PRICES

==================================================



id

project_type_id

price

effective_date

status

created_at

updated_at



==================================================

TABLE PROJECTS

==================================================



id

project_number

project_date

customer_name

project_type_id

qty

unit

incentive_price_snapshot

total_incentive

status

notes

created_at

updated_at



==================================================

TABLE PROJECT_TECHNICIANS

==================================================



id

project_id

technician_id

allocated_qty

incentive_amount

created_at



Tambahkan unique constraint:



project_id + technician_id



agar teknisi tidak bisa terduplikasi dalam satu project.



==================================================

TABLE AUDIT_LOGS

==================================================



id

action

entity

entity_id

old_value

new_value

created_at



==================================================

SUPABASE RLS

==================================================



Karena aplikasi tidak menggunakan login:



Jangan membuat authentication flow.



Namun tetap desain database dengan aman.



Gunakan RLS policy yang sesuai kebutuhan aplikasi public/internal.



Jangan pernah menaruh service_role key di frontend.



Gunakan hanya anon/public key di frontend.



Jika operasi database membutuhkan keamanan tambahan, gunakan database function/RPC atau Edge Function.



==================================================

PERHITUNGAN

==================================================



Perhitungan utama harus konsisten.



Saat project disimpan:



1. Ambil harga aktif.

2. Ambil teknisi yang dipilih.

3. Hilangkan duplikat.

4. Hitung jumlah teknisi.

5. Hitung total project.

6. Hitung allocated_qty.

7. Hitung incentive_amount.

8. Simpan project.

9. Simpan project_technicians.

10. Pastikan transaksi konsisten.



Jika memungkinkan, buat database function/RPC untuk kalkulasi agar business rule tidak hanya berada di frontend.



==================================================

IMPORT EXCEL

==================================================



Buat fitur:



IMPORT EXCEL



Gunakan workbook referensi sebagai dasar mapping.



Import:



Tanggal

Customer

Jenis Project

Qty

Teknisi



PENTING:



Jika Excel lama mempunyai pembagian Qty manual kepada teknisi, JANGAN gunakan pembagian manual tersebut sebagai formula baru.



Ambil:



Qty project

Teknisi yang ikut



Kemudian hitung ulang menggunakan:



Qty / jumlah teknisi



==================================================

DATA HISTORIS

==================================================



Import data historis dari workbook:



JULI 2026

AGUSTUS 2026



SEPTEMBER 2026 disiapkan untuk data baru.



Pertahankan tanggal asli dari Excel.



Jangan mengubah tanggal historis hanya karena tidak sesuai dengan nama sheet.



==================================================

TABEL APLIKASI

==================================================



Walaupun data project dipisahkan berdasarkan jenis project, jangan kehilangan kemampuan melihat:



- semua project

- project per bulan

- project per teknisi

- project per jenis



Buat tab/filter:



Semua

UKUR

RAIL

MANUAL

ZIPBLIND

MOTOR

SALAH UKUR



==================================================

BACKUP

==================================================



Buat:



Export Backup JSON



Import Backup JSON



Backup harus berisi:



technicians

project_types

incentive_prices

projects

project_technicians



==================================================

AUDIT

==================================================



Catat perubahan penting:



CREATE PROJECT

UPDATE PROJECT

DELETE PROJECT

UPDATE PRICE

CREATE TECHNICIAN

UPDATE TECHNICIAN



==================================================

RESPONSIVE

==================================================



Desktop:

sidebar + content



Tablet:

sidebar compact



Mobile:

drawer/bottom navigation



Tabel harus tetap nyaman dibaca.



Gunakan horizontal scrolling hanya pada tabel yang memang terlalu lebar.



Jangan membuat seluruh halaman horizontal scroll.



==================================================

PENGALAMAN PENGGUNA

==================================================



Tambahkan:



Toast notification

Loading state

Empty state

Confirmation dialog

Error state

Skeleton loading

Form validation

Search

Filter

Pagination



Contoh empty state:



"Belum ada project pada periode ini."



==================================================

KONSISTENSI DATA

==================================================



Jangan menghitung berdasarkan data frontend yang belum tersimpan.



Dashboard dan laporan harus membaca data dari Supabase.



Setelah menambah/edit project:



refresh data dari database.



Pastikan:



Dashboard

Data Project

Rekap Teknisi

Laporan

Export Excel

Export PDF



menggunakan sumber data yang sama.



==================================================

HASIL AKHIR

==================================================



Saya ingin hasil akhir berupa aplikasi operasional yang benar-benar dapat digunakan.



Bukan prototype.



Bukan sekadar mockup.



Bukan tabel statis.



Semua:



CRUD

Database

Perhitungan

Rekap

Filter

Export Excel

Export PDF



harus benar-benar berfungsi.



Prioritas:



1. Ketepatan perhitungan insentif

2. Konsistensi database

3. Format laporan Excel/PDF

4. Kemudahan penggunaan

5. UI profesional



FORMULA FINAL:



TOTAL PROJECT

=

Qty × Harga



INSENTIF TEKNISI

=

(Qty ÷ Jumlah Teknisi) × Harga



JANGAN PERNAH MENGGUNAKAN:



Qty × Jumlah Teknisi × Harga

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tech-incentive-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6541d9e1-4c95-48e2-b67e-0a58ab05eb8e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
