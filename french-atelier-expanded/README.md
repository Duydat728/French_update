# Français Atelier

Ứng dụng học tiếng Pháp cho người Việt, xây dựng bằng React + TypeScript + Vite + Tailwind CSS.

## Chạy trên máy

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## Deploy Vercel — cách đơn giản nhất

1. Upload **toàn bộ nội dung của thư mục này** vào repository GitHub. Không bọc thêm trong thư mục con.
2. Import repository vào Vercel.
3. Vercel tự nhận diện Vite.
4. Giữ các thiết lập mặc định:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./`
5. Nhấn Deploy.

File `vercel.json` đã được thêm để tất cả route SPA được trả về `index.html`, giúp tránh lỗi 404 khi tải lại hoặc truy cập URL trực tiếp.

## Lưu ý

- Tiến độ học được lưu bằng LocalStorage trên từng trình duyệt/thiết bị.
- Phát âm sử dụng Web Speech API khi trình duyệt hỗ trợ.

## Vocabulary data sources

The expanded vocabulary module loads CEFR-labelled French entries from the community CEFR Vocabulary Dataset and fills each A1–C1 level to at least 1,000 entries with a French frequency list when needed. Word details are enriched on demand through the Free Dictionary API (`fr`) and Vietnamese translations through MyMemory. The CEFR source is unofficial and should be treated as a learning aid rather than an official CEFR vocabulary specification.

### Mở rộng dữ liệu
- Mỗi cấp A1–C1 hướng tới ít nhất 1.000 mục trong giao diện. Các mục CEFR được ưu tiên từ bộ CEFR cộng đồng; phần còn thiếu được bổ sung từ danh sách tần suất tiếng Pháp để bảo đảm kho học không bị trống. Đây là mục tiêu dữ liệu của ứng dụng, không phải “mức tối thiểu chính thức” do CEFR quy định.
- FLELex của UCLouvain là nguồn tham khảo CEFR chính thức hơn cho tiếng Pháp (A1–C2), nhưng ứng dụng trình duyệt hiện ưu tiên nguồn JSON có thể tải trực tiếp và cache cục bộ để thao tác đơn giản.
- API từ điển được gọi khi cần để lấy IPA, nghĩa tiếng Pháp và ví dụ; dịch Việt dùng MyMemory khi khả dụng.
