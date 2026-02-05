// Cấu hình API và Biến toàn cục
const API_URL = 'https://api.escuelajs.co/api/v1/products';
let allProducts = [];       // Chứa toàn bộ dữ liệu từ API
let filteredProducts = [];  // Chứa dữ liệu sau khi search/filter
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { column: null, direction: 'asc' }; // asc hoặc desc

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    
    // Lắng nghe sự kiện đổi số lượng item mỗi trang
    document.getElementById('pageSize').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1; // Reset về trang 1
        renderTable();
    });

    // Lắng nghe sự kiện tìm kiếm
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        filteredProducts = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
        currentPage = 1;
        
        // Nếu đang có sort thì sort lại danh sách đã filter
        if(currentSort.column) {
            sortData(currentSort.column, false); // false để không đảo chiều, chỉ sort lại
        }
        renderTable();
    });
});

// 1. Hàm lấy dữ liệu từ API
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts]; // Ban đầu chưa filter
        renderTable();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        alert("Không thể tải dữ liệu sản phẩm!");
    }
}

// 2. Hàm Render Bảng (có phân trang)
function renderTable() {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';

    // Tính toán phân trang
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = filteredProducts.slice(start, end);

    if (paginatedItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy dữ liệu</td></tr>';
        renderPagination();
        return;
    }

    // Render từng dòng
    paginatedItems.forEach(product => {
        const row = document.createElement('tr');
        // Yêu cầu: Description hiển thị khi di chuột (title attribute)
        row.setAttribute('title', `Description: ${product.description}`);
        
        // Sự kiện click vào item để xem chi tiết
        row.onclick = () => showDetailModal(product.id);

        // Xử lý ảnh (lấy ảnh đầu tiên, xử lý chuỗi JSON nếu cần)
        let imgUrl = "https://via.placeholder.com/50";
        if (product.images && product.images.length > 0) {
            // API này đôi khi trả về chuỗi stringified mảng, cần clean
            let rawImg = product.images[0]; 
            imgUrl = rawImg.replace(/["\[\]]/g, ''); // Clean ký tự lạ nếu có
        }

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${product.category ? product.category.name : 'N/A'}</td>
            <td><img src="${imgUrl}" class="product-img" alt="img"></td>
        `;
        tableBody.appendChild(row);
    });

    renderPagination();
    updateSortIcons();
}

// 3. Hàm Render Phân trang
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationEl = document.getElementById('pagination');
    paginationEl.innerHTML = '';

    // Nút Previous
    paginationEl.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
        </li>
    `;

    // Hiển thị các trang (Rút gọn nếu quá nhiều trang, ở đây làm đơn giản hiển thị tối đa 5 nút)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationEl.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Nút Next
    paginationEl.innerHTML += `
        <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
        </li>
    `;
}

function changePage(page) {
    currentPage = page;
    renderTable();
}

// 4. Hàm Sắp xếp (Sort)
function handleSort(column) {
    // Nếu click lại cột cũ thì đảo chiều, nếu cột mới thì mặc định asc
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    sortData(column, true);
    renderTable();
}

function sortData(column, doSort = true) {
    if (!doSort) return;
    
    filteredProducts.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // So sánh chuỗi hoặc số
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateSortIcons() {
    // Reset icons
    document.querySelectorAll('.sort-icon').forEach(i => i.className = 'fa-solid fa-sort sort-icon');
    
    // Active icon
    if (currentSort.column) {
        const iconId = `sort-${currentSort.column}`;
        const iconEl = document.getElementById(iconId);
        if (iconEl) {
            iconEl.className = currentSort.direction === 'asc' 
                ? 'fa-solid fa-sort-up sort-icon active-sort' 
                : 'fa-solid fa-sort-down sort-icon active-sort';
        }
    }
}

// 5. Chức năng View Detail / Edit
let currentEditingId = null;
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));

function showDetailModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    currentEditingId = id;

    // Reset form state về View Mode
    document.getElementById('editTitle').value = product.title;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editDesc').value = product.description;
    document.getElementById('editId').value = product.id;
    
    let imgUrl = "https://via.placeholder.com/150";
    if (product.images && product.images.length > 0) {
        imgUrl = product.images[0].replace(/["\[\]]/g, '');
    }
    document.getElementById('detailImg').src = imgUrl;

    // Disable inputs
    disableEditMode();

    detailModal.show();
}

function enableEditMode() {
    document.getElementById('editTitle').disabled = false;
    document.getElementById('editPrice').disabled = false;
    document.getElementById('editDesc').disabled = false;
    
    document.getElementById('btnEnableEdit').classList.add('d-none');
    document.getElementById('btnSaveEdit').classList.remove('d-none');
}

function disableEditMode() {
    document.getElementById('editTitle').disabled = true;
    document.getElementById('editPrice').disabled = true;
    document.getElementById('editDesc').disabled = true;
    
    document.getElementById('btnEnableEdit').classList.remove('d-none');
    document.getElementById('btnSaveEdit').classList.add('d-none');
}

// API UPDATE
async function submitUpdate() {
    const title = document.getElementById('editTitle').value;
    const price = parseInt(document.getElementById('editPrice').value);
    const description = document.getElementById('editDesc').value;

    try {
        const res = await fetch(`${API_URL}/${currentEditingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, price, description })
        });

        if (res.ok) {
            alert('Cập nhật thành công!');
            detailModal.hide();
            fetchData(); // Reload data
        } else {
            alert('Lỗi khi cập nhật!');
        }
    } catch (e) {
        console.error(e);
        alert('Có lỗi xảy ra.');
    }
}

// 6. Chức năng Create New
const createModal = new bootstrap.Modal(document.getElementById('createModal'));

async function submitCreate() {
    const title = document.getElementById('createTitle').value;
    const price = parseInt(document.getElementById('createPrice').value);
    const description = document.getElementById('createDesc').value;
    const categoryId = parseInt(document.getElementById('createCatId').value);
    const image = document.getElementById('createImg').value;

    const payload = {
        title,
        price,
        description,
        categoryId,
        images: [image]
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Tạo mới thành công!');
            document.getElementById('createForm').reset();
            createModal.hide();
            fetchData(); // Reload data -> sản phẩm mới sẽ về
        } else {
            alert('Lỗi khi tạo mới!');
        }
    } catch (e) {
        console.error(e);
        alert('Có lỗi xảy ra.');
    }
}

// 7. Chức năng Export CSV
function exportToCSV() {
    if (filteredProducts.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    // Tiêu đề cột
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Price,Category,Description\n";

    // Dữ liệu dòng (lấy từ filteredProducts - danh sách hiện tại đang hiển thị/tìm kiếm)
    filteredProducts.forEach(p => {
        // Xử lý dấu phẩy trong nội dung để tránh lỗi CSV
        const title = p.title.replace(/,/g, " ");
        const desc = p.description.replace(/,/g, " ").replace(/\n/g, " ");
        const cat = p.category ? p.category.name : "N/A";
        
        const row = `${p.id},${title},${p.price},${cat},${desc}`;
        csvContent += row + "\n";
    });

    // Tạo thẻ a ảo để download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}