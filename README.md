# Biện pháp thi công thủy lợi, thủy điện

Web app tĩnh (HTML, CSS, JavaScript thuần), không cần cài đặt hay build. Dùng tốt trên iPhone (Safari), có thể thêm vào Màn hình chính.

Nội dung gồm 8 nhóm công tác: đào đất đá hở, đào ngầm, gia cố, khoan phun, đắp đất đá, làm đường, cốt thép, bê tông. Mỗi nhóm có trình tự các bước, yêu cầu kỹ thuật, kiểm tra nghiệm thu, an toàn, hồ sơ và tiêu chuẩn viện dẫn.

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `bien-phap-thi-cong`).
2. Tải toàn bộ các file trong thư mục này lên repository (giữ nguyên cấu trúc thư mục). Có thể dùng "Add file" > "Upload files" trên web GitHub.
3. Vào **Settings** > **Pages**. Ở mục **Source** chọn **Deploy from a branch**, chọn nhánh `main`, thư mục `/ (root)`, bấm **Save**.
4. Sau 1 đến 2 phút, trang chạy tại `https://<tên-tài-khoản>.github.io/bien-phap-thi-cong/`.
5. Trên iPhone: mở link bằng Safari, bấm nút Chia sẻ, chọn **Thêm vào Màn hình chính**.

## Cấu trúc

```
index.html              Trang chính
css/style.css           Giao diện (ưu tiên điện thoại, hỗ trợ chế độ tối, in PDF)
js/app.js               Logic: định tuyến, tìm kiếm, đánh dấu bước
sw.js, manifest.webmanifest, icons/   Cho phép dùng như app, mở lại khi mất mạng
data/index.json         Danh sách hạng mục, lời cảnh báo
data/standards.json     Danh mục tiêu chuẩn
data/methods/*.json     Nội dung từng hạng mục
```

## Thêm hoặc sửa nội dung

- Sửa trực tiếp file trong `data/methods/`. Mỗi bước có `title`, `actions`, `requirements`, `checks`.
- Thêm hạng mục mới: tạo file `data/methods/<id>.json`, rồi thêm một dòng vào `groups` trong `data/index.json`.
- Thêm tiêu chuẩn: thêm một mục vào `data/standards.json` và ghi `id` đó vào `standards` của hạng mục.
- Sau khi commit và push, trang tự cập nhật.

## Lưu ý quan trọng

- Nội dung được tổng hợp, diễn đạt lại từ các tiêu chuẩn và tài liệu công khai, không chép nguyên văn.
- Chỉ dùng để tham khảo khi lập biện pháp thi công. Luôn đối chiếu số hiệu, điều khoản và hiệu lực trên bản gốc, hồ sơ thiết kế và chỉ dẫn kỹ thuật của dự án.
- Một số tiêu chuẩn có ghi chú cần kiểm tra phiên bản hiện hành (ví dụ TCVN 4453, TCVN 8297, TCVN 1651).
- Chưa tìm được tiêu chuẩn thi công riêng cho đường hầm thủy công; nhóm đào ngầm đang tham khảo TCVN 4528:1988 (hầm giao thông).
