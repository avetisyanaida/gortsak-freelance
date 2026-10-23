# Գործակ (Gortsak)

Հայկական ֆրիլանս շուկա՝ գործատուների և ֆրիլանսերների համար։ Սա սովորական Next.js App Router նախագիծ է՝ Vercel-ի համար, Supabase Auth-ով և Supabase Postgres բազայով։

## Տեղային գործարկում

- Պետք է Node.js 22.13 կամ ավելի նոր տարբերակ և pnpm 11։
- Կախվածությունները տեղադրիր `pnpm install` հրամանով։
- Պատճենիր `.env.example`-ը `.env.local` անունով և լրացրու Supabase-ի արժեքները։
- Տեղային մշակում՝ `pnpm dev`։
- Production build-ի ստուգում՝ `pnpm build`։

## Supabase-ի կարգավորում

1. Եթե հին բազայի աղյուսակների տվյալները պետք չեն, Supabase Dashboard → SQL Editor-ում գործարկիր `supabase/reset-old-schema.sql`։ Այն ընդմիշտ ջնջում է հին marketplace աղյուսակներն ու դրանց տվյալները, բայց Auth օգտահաշիվները չի ջնջում։
2. Հերթով գործարկիր `supabase/schema.sql`, ապա `supabase/seed.sql`։ Seed-ը ավելացնում է 25 տարբեր ոլորտների օրինակային հայտարարություն։ Դրանք ցուցադրական են և դրանց դիմել հնարավոր չէ։
3. Supabase Authentication-ի URL Configuration-ում ավելացրու տեղական և հրապարակված հասցեները, ներառյալ `/auth/callback` հասցեն, օրինակ՝ `http://localhost:3000/auth/callback` և քո Vercel հասցեն։
4. Vercel-ի Project → Settings → Environment Variables-ում ավելացրու `.env.example`-ի փոփոխականները։ `SUPABASE_SECRET_KEY`-ը server-only գաղտնի բանալի է․ այն երբեք մի՛ գրիր `NEXT_PUBLIC_` անունով և մի՛ commit արա GitHub։

Կայքի գրանցումն ու մուտքը կատարում է Supabase Auth-ը։ Պրոֆիլներն ու marketplace տվյալները կարդացվում և գրվում են Next.js server route-երից։ Օրինակային հայտարարությունները database seed են, ոչ թե իրական պատվերներ։

## GitHub-ից Vercel տեղադրում

1. Պահիր ZIP-ը բացված ամբողջ նախագծով GitHub repository-ում։
2. Vercel-ում import արա repository-ն․ framework-ը պետք է ինքնաբերաբար ճանաչվի որպես Next.js։ Build հրամանը `next build` է։
3. Ավելացրու Supabase միջավայրի փոփոխականները Vercel-ում, ապա deploy արա։
4. Supabase Auth-ի թույլատրված redirect հասցեներում ավելացրու վերջնական Vercel domain-ը և `/auth/callback`-ը։

## Վճարումներ

500 դրամ հայտարարության տեղադրման վճարը և ֆրիլանսերի 15% միջնորդավճարը ներկայումս ցուցադրվում են որպես նախատեսված կանոններ։ Իրական գանձում, escrow կամ գումարի փոխանցում այս նախագծում միացված չէ։ Cryptomus-ի meta tag-ը կայքի հաստատման համար է և ինքնին վճարումների ինտեգրում չէ։
