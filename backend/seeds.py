"""Seeder for FinancialTracker — realistic Indonesian demo data.

Run from the backend/ directory:
    python seeds.py

Clears existing rows and populates:
  • 5 accounts (2 banks, 3 e-wallets)
  • 10 categories
  • ~250 transactions spread over the last 12 months
    (balance on each account is automatically maintained by the model)
"""
import sqlite3
from random import choice, randint, seed as rseed
from datetime import date, timedelta

from app.db import DB_PATH, init_db
from app.models.account import create_account
from app.models.category import create_category
from app.models.transaction import create_transaction
from app.schemas.account import AccountCreate, AccountType
from app.schemas.category import CategoryCreate
from app.schemas.transaction import TransactionCreate

# ---------------------------------------------------------------------------
# Static data
# ---------------------------------------------------------------------------
CATEGORIES = [
    # (name, type, icon, color)
    ("Makan & Minum",        "expense", "\U0001f37d\ufe0f",  "orange"),
    ("Transport",            "expense", "\U0001f68c",         "sky"),
    ("Belanja",              "expense", "\U0001f6d2",         "violet"),
    ("Hiburan",              "expense", "\U0001f3ad",         "pink"),
    ("Tagihan",              "expense", "\U0001f4a1",         "amber"),
    ("Pendidikan",           "expense", "\U0001f4da",         "indigo"),
    ("Kesehatan",            "expense", "\U0001f48a",         "rose"),
    ("Perawatan",            "expense", "\U0001f485",         "cyan"),
    ("Investasi",            "expense", "\U0001f4c8",         "emerald"),
    ("Lain-lain",            "expense", "\U0001f4e6",         "slate"),
    # Income categories
    ("Gaji",                 "income",  "\U0001f4bc",         "emerald"),
    ("Bonus & Insentif",     "income",  "\U0001f381",         "amber"),
    ("Pendapatan Sampingan", "income",  "\U0001f4b0",         "teal"),
]

ACCOUNTS = [
    ("BCA",     "bank",    0, "bca"),
    ("Mandiri", "bank",    0, "mandiri"),
    ("GoPay",   "ewallet", 0, "gopay"),
    ("OVO",     "ewallet", 0, "ovo"),
    ("Dana",    "ewallet", 0, "dana"),
]

EXPENSE_NOTES = {
    "Makan & Minum": [
        "Makan siang di warteg", "Kopi di Starbucks", "Makan malam bareng keluarga",
        "Sarapan bubur ayam", "Jajan di kantin kantor", "Boba Thai Tea kekinian",
        "Makan di restoran Padang", "Snack camilan sore", "Es kopi susu",
        "Pizza bareng teman-teman", "Mie ayam depan kos", "Bakso setelah pulang kerja",
    ],
    "Transport": [
        "Ojol ke kantor", "Bensin motor mingguan", "Grab ke mall",
        "KRL Commuter Line", "Parkir mall seharian", "Bayar tol Jagorawi",
        "Ojol pulang kerja malam", "Transjakarta busway", "Bensin mobil", "Ojol ke dokter",
        "Tiket bus antar kota", "Bensin pulang kampung",
    ],
    "Belanja": [
        "Belanja bulanan Indomaret", "Alfamart minuman dan snack", "Shopee order baju baru",
        "Belanja sayur di pasar", "Tokopedia elektronik", "Skincare terbaru",
        "Sepatu olahraga baru", "Peralatan dapur rumah tangga", "Fashion online Lazada",
        "Vitamin dan suplemen", "Beli headset bluetooth", "Order baju kerja",
    ],
    "Hiburan": [
        "Langganan Spotify Premium", "Netflix bulanan", "Nonton bioskop CGV",
        "Disney+ Hotstar", "YouTube Premium", "Top-up diamond Mobile Legends",
        "Karaoke bareng teman", "Main futsal weekend", "Top-up game PUBG",
        "Tiket konser musik", "Bowling bareng keluarga", "Escape room game",
    ],
    "Tagihan": [
        "Bayar tagihan listrik PLN", "Tagihan PDAM air bersih", "Internet IndiHome bulanan",
        "Cicilan BPJS Kesehatan", "Iuran listrik kos", "Bayar wifi bulanan",
        "Tagihan telepon pascabayar", "Pulsa Telkomsel", "Top-up e-toll",
        "Iuran kebersihan komplek", "Bayar gas elpiji", "Berlangganan domain hosting",
    ],
    "Pendidikan": [
        "SPP semester ini", "Beli buku kuliah semester baru", "Kursus bahasa Inggris",
        "Langganan Ruangguru Premium", "Beli alat tulis dan buku catatan",
        "Biaya ujian sertifikasi", "Bimbel online persiapan CPNS",
        "Workshop desain grafis Canva", "Kelas coding online Dicoding", "Biaya wisuda kampus",
    ],
    "Kesehatan": [
        "Beli obat flu di apotek", "Konsultasi dokter umum puskesmas",
        "Cek laboratorium klinik", "Beli vitamin C dan zinc", "Periksa gigi rutin",
        "Beli obat maag", "Biaya rawat jalan BPJS", "Beli masker KN95",
        "Konsultasi dokter gizi", "Beli suplemen omega-3 fish oil",
    ],
    "Perawatan": [
        "Potong rambut di barbershop", "Facial treatment di salon", "Laundry baju mingguan",
        "Beli sabun mandi dan shampoo", "Servis motor rutin", "Cat rambut salon",
        "Manikur dan pedikur", "Cuci mobil manual", "Ganti oli motor",
        "Beli parfum terbaru", "Waxing di salon kecantikan",
    ],
    "Investasi": [
        "Top-up reksa dana pasar uang", "Beli saham BBCA lot kecil",
        "Beli emas Antam 1 gram", "Nabung deposito", "Beli SBN Ritel ORI",
        "Top-up Bibit reksa dana", "Transfer ke tabungan berjangka",
    ],
    "Lain-lain": [
        "Transfer ke teman", "Sumbangan masjid lingkungan", "Hadiah ulang tahun teman",
        "Beli kado pernikahan", "Donasi panti asuhan", "Iuran arisan bulanan",
        "Sumbangan bencana alam", "Kado wisuda sahabat",
    ],
}

INCOME_NOTES = [
    "Gaji bulanan", "Gaji + lembur bulan ini", "Transfer gaji dari perusahaan",
    "Bonus kinerja triwulan", "Transfer kiriman dari orang tua",
    "Penghasilan freelance desain", "Hasil penjualan barang online", "Dividen saham",
    "Cashback reward kartu kredit", "Pencairan reksa dana profit",
    "Uang lembur proyek khusus", "Penghasilan kreator konten YouTube",
    "Komisi penjualan referral", "THR lebaran", "Uang saku keluarga besar",
    "Honor ngajar les privat", "Bonus penyelesaian proyek", "Hasil jual barang bekas",
    "Pemasukan affiliate marketing", "Honorarium pembicara seminar",
    "Hadiah kuis berhadiah", "Pengembalian dana cashback",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def random_date(months_back: int = 12) -> str:
    today = date.today()
    start = date(today.year, today.month, 1) - timedelta(days=months_back * 30)
    delta = (today - start).days
    return (start + timedelta(days=randint(0, delta))).isoformat()


def salary_date(months_ago: int) -> str:
    today = date.today()
    m = today.month - months_ago
    y = today.year
    while m <= 0:
        m += 12
        y -= 1
    last_day = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]
    return date(y, m, min(25, last_day)).isoformat()


# ---------------------------------------------------------------------------
# Main seeder
# ---------------------------------------------------------------------------
def seed(num_transactions: int = 250, seed_value: int = 42):
    rseed(seed_value)
    init_db()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Wipe existing data and reset sequences
    for tbl in ("transactions", "accounts", "categories"):
        conn.execute(f"DELETE FROM {tbl}")
    conn.execute("DELETE FROM sqlite_sequence")
    conn.commit()

    # Create accounts (balance starts at 0; transactions update it automatically)
    account_ids = []
    for name, acct_type, _, icon in ACCOUNTS:
        acc = create_account(AccountCreate(type=acct_type, name=name, balance=0, icon=icon), conn)
        account_ids.append(acc.id)
    bank_ids   = account_ids[:2]
    wallet_ids = account_ids[2:]

    # Create categories
    category_map = {}
    income_cats = []
    for name, cat_type, icon, color in CATEGORIES:
        cat = create_category(CategoryCreate(name=name, type=cat_type, icon=icon, color=color), conn)
        category_map[name] = cat.id
        if cat_type == 'income':
            income_cats.append(name)

    count = 0

    # Inject monthly salary for the past 12 months (good bar chart data)
    for mo in range(11, -1, -1):
        amount = randint(4_500_000, 12_000_000)
        create_transaction(TransactionCreate(
            type="income",
            amount_cents=amount,
            date=salary_date(mo),
            note=choice(["Gaji bulanan", "Gaji + lembur bulan ini", "Transfer gaji dari perusahaan"]),
            category_id=category_map["Gaji"],
            account_id=choice(bank_ids),
        ), conn)
        count += 1

    # Extra random income
    for _ in range(num_transactions // 5):
        inc_cat = choice(income_cats)
        create_transaction(TransactionCreate(
            type="income",
            amount_cents=randint(50_000, 3_000_000),
            date=random_date(),
            note=choice(INCOME_NOTES),
            category_id=category_map[inc_cat],
            account_id=choice(account_ids),
        ), conn)
        count += 1

    # Expense transactions
    AMOUNT_RANGES = {
        "Makan & Minum": (15_000,  120_000),
        "Transport":     (10_000,  150_000),
        "Belanja":       (30_000,  800_000),
        "Hiburan":       (15_000,  300_000),
        "Tagihan":       (50_000,  500_000),
        "Pendidikan":    (50_000, 1_500_000),
        "Kesehatan":     (20_000,  500_000),
        "Perawatan":     (20_000,  300_000),
        "Investasi":    (100_000, 2_000_000),
        "Lain-lain":     (10_000,  500_000),
    }
    remaining = num_transactions - count
    for _ in range(remaining):
        cat_name = choice(list(EXPENSE_NOTES.keys()))
        lo, hi = AMOUNT_RANGES[cat_name]
        # Round to nearest 500 for realistic IDR feel
        amount = round(randint(lo, hi) / 500) * 500
        # Casual expenses (food/transport) lean toward e-wallets; bigger ones to bank
        acct_id = choice(wallet_ids) if cat_name in ("Makan & Minum", "Transport", "Hiburan") else choice(account_ids)
        create_transaction(TransactionCreate(
            type="expense",
            amount_cents=amount,
            date=random_date(),
            note=choice(EXPENSE_NOTES[cat_name]),
            category_id=category_map[cat_name],
            account_id=acct_id,
        ), conn)
        count += 1

    conn.close()
    print(f"✓  {len(ACCOUNTS)} accounts · {len(CATEGORIES)} categories · {count} transactions")
    print(f"   DB: {DB_PATH}")


if __name__ == "__main__":
    seed()
