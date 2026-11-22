# Orix School Admin Front

پنل مدیران، کارکنان و استادان با React، TypeScript و Vite. رابط کاربری بر اساس دیزاین Nucleus است و فارسی/انگلیسی با RTL/LTR پشتیبانی می‌شود.

## اجرا

```powershell
npm install
npm run dev
```

برنامه روی `http://localhost:5173` اجرا می‌شود و در محیط توسعه درخواست‌های `/api` را به `http://localhost:8080` می‌فرستد.

## بررسی

```powershell
npm run lint
npm run build
```

## حساب توسعه

در محیط `dev` شناسه آموزشگاه و ایمیل نمونه در فرم ورود پر می‌شود. رمز را وارد کنید. حساب Bootstrap پیش‌فرض بک‌اند:

- شناسه: `demo-school`
- ایمیل: `admin@example.com`
- رمز: `change-me-now`

در بیلد production فیلدها خالی می‌مانند.

## Docker مستقل

```powershell
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t orix-school-admin .
docker run --rm -p 8081:80 orix-school-admin
```

در استقرار نهایی می‌توان `VITE_API_BASE_URL` را خالی نگه داشت و `/api` را در Reverse Proxy اصلی به Backend هدایت کرد.
