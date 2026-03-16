###  Lab 1: Analyze Real System Architecture

## นายจิรกิตติ์ คำป่าตัน 67543210014-6

## เลือกระบบ Grab Food / LINE MAN

## 1) System Overview
ระบบนี้ทำอะไร?

GrabFood / LINE MAN คือแพลตฟอร์ม “Marketplace + Logistics” สำหรับสั่งอาหาร ที่ต้องประสานงาน 4 โลกพร้อมกัน:

 ลูกค้า: ค้นหาร้าน/เมนู → สั่ง → จ่ายเงิน → ติดตาม → รีวิว
- ร้านอาหาร: รับออเดอร์ → ยืนยัน/ปรุง → แจ้งพร้อมรับ → - - - จัดการเมนู/สต๊อก/โปรโมชั่น
- ไรเดอร์: รับงาน → รับอาหาร → ส่ง → อัปเดตสถานะ/ตำแหน่ง
- ระบบกลาง: จับคู่ไรเดอร์, คิดค่าส่ง, จัดการสถานะ,     แจ้งเตือน, ป้องกัน fraud, วิเคราะห์ข้อมูลแบบ real-time

## Stakeholders หลักคือใคร?
- Customer (ผู้สั่งอาหาร)
- Merchant/Restaurant (ร้านอาหาร)
- Rider/Driver (ไรเดอร์)
- Operations / Support (ทีมแก้ปัญหา ออเดอร์ล่ม/คืนเงิน/ข้อร้องเรียน)
- Platform/Engineering (ทีมดูแลระบบ, SRE)
- Payment partners / Banks / Payment gateway
- Regulators / PDPA & Compliance

## Quality Attributes สำคัญ
สำหรับ food delivery “ของจริง” มักเน้น:
 Availability (ล่มตอนเที่ยง = รายได้หาย)
 Performance/Latency (กดสั่ง/จ่าย/ติดตามต้องไว)
 Scalability (พีคเป็นช่วง ๆ + แคมเปญ)
 Reliability/Consistency (สถานะออเดอร์ต้อง “ไม่มั่ว”)
 Security & Privacy (ข้อมูลที่อยู่/การชำระเงิน)
 Observability (ต้องตามหาเหตุขัดข้องข้ามหลาย service ได้)

## 2) Architecture Analysis
ใช้ Architectural Style อะไร?

## Style A: Microservices Architecture

 แยกโดเมนหลักเป็นบริการย่อย เช่น User/Auth, Catalog, Order, Payment, Delivery/Dispatch, Notification, Review ฯลฯ

 ช่วยให้ “แต่ละส่วน scale และ deploy แยก” (เหมาะกับระบบโตเร็ว/ทีมใหญ่)

 Grab มีสื่อสารเรื่องการจัดการ microservices และระบบ platform/mesh ที่รองรับ microservices จำนวนมาก 
Grab Tech
+1

 LINE MAN Wongnai ก็มีเนื้อหาเชิง microservices และ tooling สนับสนุนการ monitor ในหลายบริการ 
life.wongnai.com
+1

## Style B: Event-Driven Architecture (EDA)

แทนที่จะให้ทุกอย่างเรียกกันแบบ synchronous อย่างเดียว จะมี “เหตุการณ์ (events)” เช่น OrderCreated, PaymentConfirmed, FoodPrepared, RiderAssigned, Delivered

ใช้ message/stream platform อย่าง Kafka เพื่อสื่อสารแบบหลวม (decouple) และรองรับงาน real-time

## 3) Quality Attributes Mapping
## Architecture นี้รองรับ QAs อย่างไร?

Availability

 แยกบริการย่อย → ถ้าบริการรีวิวล่ม ไม่จำเป็นต้องทำให้การสั่งอาหารล่มทั้งระบบ

 service mesh / resilience patterns ช่วยรับมือ network failure ในระบบ microservices ขนาดใหญ่ 

Performance

 API Gateway ช่วย cache/aggregate บางหน้าที่เรียกหลายบริการ

 Event-driven ลดการรอ synchronous call ในบาง workflow (เช่น ส่งแจ้งเตือน/อัปเดต analytics)

Scalability

 แต่ละ service scale ตามโหลด (เที่ยง: order/payment/dispatch หนัก)

 ระบบ stream (Kafka) รองรับข้อมูลแบบ real-time และการต่อ service เพิ่มโดยไม่ต้องแก้ของเดิมมาก 

Reliability / Correctness ของสถานะออเดอร์

 ใช้ event log/stream เก็บเหตุการณ์ ทำให้ “ตามรอย” ได้ว่ามีอะไรเกิดขึ้นบ้าง

 แต่ต้องออกแบบ idempotency / delivery guarantees ให้ดี (LINE MAN Wongnai มีบทความลงลึกเรื่อง message delivery guarantees) 

Security & Privacy

 Gateway + Auth service แยกชัด, บังคับ policy/role ได้

 ลดการให้บริการอื่น ๆ เข้าถึงข้อมูลอ่อนไหวโดยตรง

Observability

 ระบบใหญ่ต้องมี logging/monitoring/tracing และฝั่ง LINE MAN Wongnai มีการพูดถึงการทำ library ช่วยด้าน monitoring ใน microservices 
life.wongnai.com

## Trade-offs อะไรบ้าง?

1.Scalability/Decoupling (EDA) vs Consistency

 Event-driven มักนำไปสู่ eventual consistency (สถานะบางอย่างอัปเดตไม่พร้อมกันทุกหน้าจอ)

 ต้องลงทุนกับ outbox/idempotency/retry/ordering มากขึ้น 

2.Microservices vs Complexity/Cost

 ได้ความยืดหยุ่น แต่แลกกับ:

 การดูแลหลาย service

 network latency

 ต้องมี tooling (gateway, service discovery, tracing, CI/CD)

 Grab ระบุภาพรวมว่า microservices ecosystem ใหญ่มาก และต้อง evolve โครงสร้างพื้นฐาน (เช่น service mesh) เพื่อรับความซับซ้อน

3.Performance vs Security

 เพิ่มการตรวจสอบ/เข้ารหัส/ตรวจ fraud → หน่วงเพิ่ม

 ต้องเลือก “ความหน่วงที่ยอมรับได้” + วางจุดตรวจให้เหมาะ (gateway/critical path)

## 4) Lessons Learned
## สิ่งที่เรียนรู้จากการวิเคราะห์

 Food delivery ไม่ใช่แค่ “สั่งอาหาร” แต่คือ distributed workflow หลายขั้นและหลายฝ่าย → event-driven + microservices จึงเหมาะ

 ระบบระดับ Grab/LINE MAN ต้องให้ความสำคัญกับ observability ไม่แพ้ feature เพราะปัญหามักเกิด “ข้าม service”

 เรื่องที่ดูเล็ก (retry, duplicate events, message ordering) กลายเป็นเรื่องใหญ่ใน production → ต้องออกแบบ reliability ตั้งแต่แรก 

## นำไปใช้กับโปรเจกต์ของทีมได้อย่างไร? (ฉบับนักศึกษา)

สำหรับโปรเจกต์ Food Delivery ของทีมเธอ (ขนาดเล็กกว่า) แนะนำ “หยิบแก่น” มาใช้แบบไม่ซับซ้อนเกิน:

 เริ่มจาก Modular Monolith หรือ Microservices แบบ 4–6 services ก็พอ (Order, Payment, Delivery, Notification, User, Merchant)

 ทำ API Gateway (หรืออย่างน้อย BFF layer) เพื่อรวม auth + routing

 ใช้ Event-driven แบบเบา ๆ:

 ในช่วงแรกอาจใช้ “event bus ภายใน” (เช่น message queue / หรือแม้แต่ DB outbox + worker) เพื่อส่ง OrderCreated, PaymentConfirmed ไปแจ้งเตือน/อัปเดตสถานะ

 วาง QAs วัดได้ ตั้งแต่เริ่ม เช่น

 Create order < 2s (p95)

 Uptime 99.5% (งานนักศึกษา)

 ส่ง notification ภายใน 5s หลัง payment confirmed

 ใส่ logging + trace id ตั้งแต่แรก จะช่วยตอนเดโม/แก้บั๊กมาก

## แผนภาพ
 ![1](../lab/images/kafka.png)

 ![2](../lab/images/monolith.png)

 