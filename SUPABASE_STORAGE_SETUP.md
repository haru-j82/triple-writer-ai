# Supabase Storage 설정 가이드

## 1. Storage 버킷 생성

### 1.1 Supabase Dashboard 접근
1. https://app.supabase.com 에서 프로젝트 선택
2. 좌측 메뉴에서 **Storage** 클릭
3. **Create new bucket** 버튼 클릭

### 1.2 버킷 생성 설정

**버킷 이름:** `blog-images`

**공개 여부:** 
- ✅ Public bucket (공개 접근 허용)
- 이유: 생성된 이미지를 웹에서 직접 로드 가능

**생성 완료 후 버킷 구조:**
```
blog-images/
├── blogs/
│   ├── user_001/
│   │   ├── blog_001/
│   │   │   └── images/
│   │   │       ├── image-1691234567-abc123.png
│   │   │       ├── image-1691234568-def456.png
│   │   │       └── ...
│   │   └── blog_002/
│   │       └── images/
│   │           └── ...
│   └── user_002/
│       └── ...
```

## 2. RLS (Row Level Security) 정책 설정

### 2.1 정책 생성 방법

Supabase Dashboard > Storage > Policies 에서:

#### 정책 1: 인증된 사용자만 읽기 가능
```sql
-- 모든 인증된 사용자가 이미지 읽기 가능
CREATE POLICY "Allow authenticated users to read images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);
```

#### 정책 2: 본인 폴더에만 쓰기 가능
```sql
-- 사용자는 자신의 폴더에만 파일 업로드 가능
CREATE POLICY "Allow users to upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images'
  AND auth.uid()::text = (string_to_array(name, '/'))[2]
);
```

#### 정책 3: 본인 파일만 삭제 가능
```sql
-- 사용자는 자신의 파일만 삭제 가능
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images'
  AND auth.uid()::text = (string_to_array(name, '/'))[2]
);
```

### 2.2 정책 없이 공개 버킷 설정 (간편함)

공개 버킷으로 설정하면 RLS 정책 없이도:
- ✅ 누구나 읽기 가능
- ✅ 인증된 사용자만 쓰기/삭제 가능

이 경우 imageApi.ts의 uploadImageToSupabase 함수가 정상 작동합니다.

## 3. 환경 변수 확인

### 3.1 .env.local 필수 설정

```bash
# Supabase URL (공개 정보)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co

# Supabase 공개 키 (클라이언트사이드)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase 서비스 역할 키 (서버사이드)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3.2 환경 변수 확인 방법

1. Supabase Dashboard > Project Settings > API
2. 다음 정보 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 4. CORS 설정 (필요시)

### 4.1 CORS 문제 진단

다음과 같은 에러가 발생하면 CORS 설정 필요:
```
Access to XMLHttpRequest at '...' from origin 'localhost:3000' has been blocked by CORS policy
```

### 4.2 CORS 설정 방법

Supabase Dashboard > Project Settings > CORS:

```json
{
  "allowed_origins": [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://yourdomain.com"
  ],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
  "allowed_headers": ["Content-Type", "Authorization"],
  "max_age": 3600
}
```

## 5. 저장소 관리

### 5.1 저장소 용량 모니터링

1. Supabase Dashboard > Storage > Overview
2. 사용 중인 저장소 용량 확인
3. 용량 제한: 5GB (무료 플랜)

### 5.2 이미지 정리

```typescript
// 불필요한 이미지 삭제
export async function deleteImageFromSupabase(storagePath: string) {
  const { error } = await supabaseAdmin.storage
    .from('blog-images')
    .remove([storagePath]);

  if (error) {
    throw error;
  }
}
```

### 5.3 자동 만료 설정 (선택사항)

Supabase 정책으로 오래된 이미지 자동 삭제:

```sql
-- 1년 이상 된 이미지 자동 삭제 정책
-- (또는 별도의 scheduled function 작성 필요)
```

## 6. 공개 URL 생성

### 6.1 공개 URL 형식

```
https://{project-id}.supabase.co/storage/v1/object/public/blog-images/{path}
```

**예시:**
```
https://ixfizgyfcrrjmahrmovi.supabase.co/storage/v1/object/public/blog-images/blogs/user_001/blog_001/images/image-123.png
```

### 6.2 getPublicUrl() 사용

```typescript
const { data } = supabaseAdmin.storage
  .from('blog-images')
  .getPublicUrl(storagePath);

console.log(data.publicUrl); // 공개 URL 얻기
```

## 7. 보안 최적화

### 7.1 API 키 보안

- ✅ 공개 키(anon): 클라이언트사이드 사용 가능
- ✅ 서비스 역할 키: 서버사이드에서만 사용
- ❌ 공개 키로 민감한 작업 수행 금지

### 7.2 파일 경로 검증

```typescript
// 경로에 ../ 같은 조작 방지
function validateStoragePath(path: string): boolean {
  return !path.includes('..') && !path.includes('//');
}
```

### 7.3 파일 타입 검증

```typescript
// MIME 타입 확인
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

function isValidImageType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}
```

## 8. 문제 해결

### 8.1 403 Forbidden 오류

**원인:** RLS 정책 또는 권한 문제

**해결:**
```sql
-- 정책 확인
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 정책 비활성화 (테스트용)
ALTER POLICY "Public" ON storage.objects DISABLE;
```

### 8.2 413 Payload Too Large

**원인:** 파일 크기 초과

**해결:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (blob.size > MAX_FILE_SIZE) {
  throw new Error('File size exceeds maximum');
}
```

### 8.3 네트워크 타임아웃

**원인:** 대용량 파일 업로드 또는 느린 연결

**해결:**
```typescript
// 재시도 로직
async function uploadWithRetry(
  blob: Blob,
  path: string,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await supabaseAdmin.storage
        .from('blog-images')
        .upload(path, blob);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 8.4 CORS 오류

**원인:** 브라우저 정책

**해결:**
1. CORS 설정 확인 (상단 참고)
2. 프리플라이트 요청 허용
3. 서버사이드 프록시 사용

## 9. 성능 최적화

### 9.1 이미지 압축

```typescript
// 업로드 전 압축
async function compressImage(blob: Blob): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  
  img.src = URL.createObjectURL(blob);
  await new Promise(r => img.onload = r);
  
  canvas.width = img.width * 0.8;
  canvas.height = img.height * 0.8;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.8));
}
```

### 9.2 CDN 캐싱

Supabase 공개 버킷은 자동으로 CDN 캐싱됩니다:
- ✅ 첫 접근: Supabase 저장소에서 로드
- ✅ 이후 접근: CDN에서 로드
- ✅ TTL: 기본값 3600초

### 9.3 배치 업로드 최적화

```typescript
// 한 번에 여러 파일 업로드
async function uploadMultiple(
  files: Array<{ blob: Blob; path: string }>,
  concurrency: number = 3
) {
  const results = [];
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const promises = batch.map(f =>
      supabaseAdmin.storage
        .from('blog-images')
        .upload(f.path, f.blob)
    );
    results.push(...await Promise.all(promises));
  }
  return results;
}
```

## 10. 모니터링 및 로깅

### 10.1 업로드 로그

```typescript
interface StorageLog {
  userId: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
  success: boolean;
  duration: number; // ms
}

async function logStorageOperation(log: StorageLog) {
  await supabaseAdmin
    .from('storage_logs')
    .insert([log]);
}
```

### 10.2 저장소 사용량 모니터링

```typescript
async function getStorageUsage(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('storage_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data?.total_size || 0;
}
```

## 결론

Supabase Storage를 통해:
- ✅ 간단한 파일 관리
- ✅ 자동 CDN 배포
- ✅ 보안 정책 관리
- ✅ 비용 효율성

이제 DALL-E 3로 생성한 이미지를 안전하고 빠르게 저장할 수 있습니다.
