
const form = document.getElementById("entryForm");

// ช่องแสดงข้อมูลบนหน้าเว็บ
const records = document.getElementById("records");
const totalExpense = document.getElementById("totalExpense");
const totalIncome = document.getElementById("totalIncome");
const netProfit = document.getElementById("netProfit");
const recordCount = document.getElementById("recordCount");
const periodPill = document.getElementById("periodPill");

// ชื่อที่ใช้เก็บข้อมูลในเบราว์เซอร์
const STORAGE_KEY = "farmCostEntries";

// โหลดข้อมูลเก่าที่เคยบันทึกไว้
let entries = [];

try {
    entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(entries)) {
        entries = [];
    }
} catch {
    entries = [];
}

// ตั้งวันที่เริ่มต้นเป็นวันนี้
const dateInput = document.getElementById("date");

if (dateInput && !dateInput.value) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
}

// แปลงตัวเลขเป็นรูปแบบเงินบาท
function formatMoney(amount) {
    return Number(amount).toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ป้องกันข้อความที่ผู้ใช้กรอกไม่ให้กลายเป็น HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// บันทึกข้อมูลลงในเบราว์เซอร์
function saveEntries() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        return true;
    } catch (error) {
        alert("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์");
        return false;
    }
}

// เมื่อกดปุ่มบันทึกรายการ
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const crop = document.getElementById("crop").value.trim();
    const date = document.getElementById("date").value;
    const kind = document.getElementById("kind").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value.trim();

    // ตรวจสอบข้อมูลก่อนบันทึก
    if (!crop || !date || !Number.isFinite(amount) || amount <= 0) {
        alert("กรุณากรอกชื่อพืช วันที่ และจำนวนเงินให้ถูกต้อง");
        return;
    }

    // สร้างรายการใหม่
    const newEntry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        crop: crop,
        date: date,
        kind: kind,
        category: category,
        amount: amount,
        note: note
    };

    // เพิ่มรายการลงในข้อมูล
    entries.push(newEntry);

    // บันทึกก่อนแสดงผล
    if (!saveEntries()) {
        entries.pop();
        return;
    }

    // ล้างแบบฟอร์ม
    form.reset();

    // ตั้งวันที่กลับเป็นวันนี้
    const today = new Date();
    dateInput.value =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // อัปเดตยอดรวมและประวัติ
    render();

    alert("บันทึกรายการเรียบร้อยแล้ว!");
});

// แสดงยอดรวมและรายการย้อนหลัง
function render() {
    const expenses = entries
        .filter(item => item.kind === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    const incomes = entries
        .filter(item => item.kind === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const profit = incomes - expenses;

    // อัปเดตการ์ดสรุปยอด
    totalExpense.textContent = "฿" + formatMoney(expenses);
    totalIncome.textContent = "฿" + formatMoney(incomes);
    netProfit.textContent = "฿" + formatMoney(profit);

    netProfit.style.color =
        profit < 0 ? "#b84a40" :
        profit > 0 ? "#2f7548" : "";

    // จำนวนรายการและรอบการปลูก
    recordCount.textContent = `รายการทั้งหมด ${entries.length} รายการ`;

    const cropCount = new Set(entries.map(item => item.crop)).size;
    periodPill.textContent = `${cropCount} รอบการปลูก`;

    // เรียงวันที่ล่าสุดไว้ด้านบน
    const sortedEntries = [...entries].sort((a, b) =>
        b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    );

    // กรณียังไม่มีข้อมูล
    if (sortedEntries.length === 0) {
        records.innerHTML = `
            <div class="empty">
                <span>🌿</span>
                <b>ยังไม่มีรายการย้อนหลัง</b>
                <p>เพิ่มรายการจากแบบฟอร์มเพื่อเริ่มบันทึกข้อมูล</p>
            </div>
        `;
        return;
    }

    // แสดงรายการย้อนหลัง
    records.innerHTML = sortedEntries.map(item => `
        <div class="record">
            <div class="record-main">
                <div class="record-title">
                    ${escapeHTML(item.crop)}
                </div>

                <div class="record-meta">
                    ${escapeHTML(item.category)}
                    · ${escapeHTML(item.date)}
                    ${item.note ? `<br>${escapeHTML(item.note)}` : ""}
                </div>
            </div>

            <div class="record-right">
                <div class="amount ${item.kind === "income" ? "type-income" : "type-expense"}">
                    ${item.kind === "income" ? "+" : "−"}฿${formatMoney(item.amount)}
                </div>

                <div class="actions">
                    <button class="mini" data-delete="${escapeHTML(item.id)}">
                        ลบ
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

// ลบรายการย้อนหลัง
records.addEventListener("click", function(event) {
    const button = event.target.closest("[data-delete]");

    if (!button) return;

    const id = button.dataset.delete;

    if (confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
        const oldEntries = entries;
        entries = entries.filter(item => item.id !== id);

        if (!saveEntries()) {
            entries = oldEntries;
            return;
        }

        render();
    }
});

// โหลดประวัติที่บันทึกไว้เมื่อเปิดหน้าเว็บ
render();
