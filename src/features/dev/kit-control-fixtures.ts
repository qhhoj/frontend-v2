/** Fixtures of the control set on `/dev/kit` (KitControls.vue): the placement table and the scales are the rules themselves. */
export const CONTROL_FILTERS = [
  { value: 'all', label: 'Tất cả', count: 55 },
  { value: 'unsolved', label: 'Chưa giải', count: 18 },
  { value: 'solved', label: 'Đã giải', count: 37 },
];

export const CONTROL_TABS = [
  { key: 'statement', label: 'Đề bài' },
  { key: 'mine', label: 'Bài nộp của tôi', count: 2 },
  { key: 'best', label: 'Tốt nhất' },
];

/** Where each thing sits, on every page: the zone, what is at its left, what is at its right. */
export const PLACEMENT = [
  {
    zone: 'Đầu trang',
    left: 'Dòng dẫn (trang cha), tên trang, một dòng phụ',
    right:
      'Các nút của trang; nút chính đứng cuối cùng. Trang có khung phụ: nút chính đứng đầu khung phụ',
  },
  {
    zone: 'Bảng đo',
    left: 'Trạng thái hoặc số đo lớn nhất',
    right: 'Các số đo phụ, rồi nút; nút chính đứng cuối cùng',
  },
  {
    zone: 'Thanh công cụ',
    left: 'Ô tìm, rồi các bộ lọc',
    right: 'Số lượng kết quả hoặc công cụ phụ',
  },
  { zone: 'Đầu mục', left: 'Tên mục', right: 'Ghi chú, liên kết hoặc nút nhẹ' },
  { zone: 'Bảng', left: 'Trạng thái, rồi tên', right: 'Số (căn phải), thời điểm ở cột cuối' },
  {
    zone: 'Nội dung',
    left: 'Cột chính',
    right: 'Khung phụ (rộng cố định); trên điện thoại khung phụ lên trên',
  },
  { zone: 'Cuối bảng', left: 'Đang xem dòng nào', right: 'Trước, Sau' },
];

/** The scales every size, space and duration comes from (src/theme/tokens.css, styles.css). */
export const SCALES = [
  { name: 'Khoảng cách', steps: '2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64' },
  { name: 'Cỡ chữ', steps: '12 (số trong ô) · 13 · 14 · 15 · 16 · 18 · 20 · 24 · 28 · 32 · 40' },
  { name: 'Độ đậm', steps: '400 · 500 · 600 · 650 (tiêu đề) · 700' },
  { name: 'Chiều cao nút và ô', steps: '40 · 32 (44 khi chạm)' },
  { name: 'Dòng bảng', steps: '44 · 52 (điện thoại)' },
  { name: 'Bo góc', steps: '2 (ô nhỏ) · 4 (nút, ô nhập) · 6 (khung) · tròn (nhãn, đèn)' },
  { name: 'Chuyển động', steps: '0,12 s · 0,2 s · 1,2 s (nhịp đang chấm)' },
];
