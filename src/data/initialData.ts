import { JobItem, SyncSettings } from '../types';

export const INITIAL_SETTINGS: SyncSettings = {
  companyName: 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbzZGiyeLCwTUxLFG0NTrU2GFhz2kvmyS1BQaYqHil-jDpcnNwPtu1U8LPZtGmJypEHZ/exec',
  appSheetWebhookUrl: '',
  lineNotifyToken: '',
  lineChannelAccessToken: 'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=',
  lineTargetUserId: 'U54fd541a6cf7746b1b4f0219634c7a53',
  lineTargetGroupId: 'C341417bcb6e853c320eaf9d80963cda3',
  autoSyncSheets: true,
  autoSendLineFlex: true,
};

export const INITIAL_JOBS: JobItem[] = [
  {
    id: 'job-1',
    jobCode: 'JOB-2026-0901',
    title: 'ติดตั้งเครื่องปรับอากาศ Inverter 18000 BTU บ้านเดี่ยว',
    contactPerson: 'คุณสมชาย วงศ์สวัสดิ์',
    phoneNumber: '081-456-7890',
    date: '2026-09-10',
    time: '09:30',
    status: 'completed',
    location: {
      address: '99/12 หมู่บ้านเพอร์เฟคเพลส ถนนรัตนาธิเบศร์ บางรักพัฒนา นนทบุรี',
      lat: 13.8765,
      lng: 100.4412,
      placeName: 'หมู่บ้านเพอร์เฟคเพลส นนทบุรี'
    },
    photos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        caption: 'ติดตั้งคอมเพรสเซอร์และท่อน้ำยาเรียบร้อย',
        tag: 'after',
        timestamp: '2026-09-10 11:45',
        source: 'camera'
      },
      {
        id: 'p2',
        url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
        caption: 'จุดติดตั้งแฟนคอยล์ภายในห้องนอนใหญ่',
        tag: 'during',
        timestamp: '2026-09-10 10:15',
        source: 'camera'
      }
    ],
    productBrand: 'Daikin',
    productDetails: 'Daikin FTKF-WV2S Inverter 18,100 BTU + ขาแขวนมาตรฐาน',
    price: 26500,
    paymentType: 'cash',
    notes: 'ทดสอบระบบความเย็นและระบบระบายน้ำทิ้งผ่านเกณฑ์ ลูกค้าชำระเงินสดครบถ้วน มอบใบรับประกัน 5 ปี',
    assignedTo: 'ช่างเอกชัย (ทีม A)',
    createdAt: '2026-09-10T09:00:00Z',
    updatedAt: '2026-09-10T12:30:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'job-2',
    jobCode: 'JOB-2026-0902',
    title: 'งานปูกระเบื้องแกรนิตโต้และสุขภัณฑ์ โครงการรีโนเวททาวน์โฮม',
    contactPerson: 'คุณกัญญาภัค พรหมวิชัย (โฟร์แมน)',
    phoneNumber: '089-772-1134',
    date: '2026-09-11',
    time: '13:00',
    status: 'in_progress',
    location: {
      address: '45/8 ซอยสุขุมวิท 101/1 แขวงบางจาก เขตพระโขนง กรุงเทพมหานคร',
      lat: 13.6872,
      lng: 100.6154,
      placeName: 'โครงการบ้านสุขุมวิท 101/1'
    },
    photos: [
      {
        id: 'p3',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        caption: 'ตรวจสอบระดับพื้นและการปรับระดับปูนกาว SCG',
        tag: 'during',
        timestamp: '2026-09-11 13:30',
        source: 'camera'
      }
    ],
    productBrand: 'SCG / COTTO',
    productDetails: 'กระเบื้องปูพื้น COTTO 60x60 cm. + ปูนกาวซีเมนต์ SCG แดง 15 ถุง',
    price: 48900,
    paymentType: 'credit_30',
    notes: 'กำลังปูบริเวณโถงชั้น 1 คาดว่าจะแล้วเสร็จภายในวันพรุ่งนี้ เครดิตเทอม 30 วัน วางบิลปลายเดือน',
    assignedTo: 'ช่างวิทย์ (ทีมงานช่างปูน)',
    createdAt: '2026-09-11T11:00:00Z',
    updatedAt: '2026-09-11T14:15:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'job-3',
    jobCode: 'JOB-2026-0903',
    title: 'ติดตั้งตู้เบรกเกอร์ Main MDB และระบบกราวด์โรงงาน',
    contactPerson: 'วิศวกรประวิทย์ (ผู้จัดการโรงงาน)',
    phoneNumber: '086-339-4455',
    date: '2026-09-11',
    time: '15:30',
    status: 'review',
    location: {
      address: '188 นิคมอุตสาหกรรมบางปู ซอย 9C ตำบลแพรกษา อำเภอเมือง สมุทรปราการ',
      lat: 13.5381,
      lng: 100.6725,
      placeName: 'โรงงานไทยอินดัสเตรียล บางปู'
    },
    photos: [
      {
        id: 'p4',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        caption: 'ประกอบชุด Circuit Breaker และ Busbar เรียบร้อย',
        tag: 'after',
        timestamp: '2026-09-11 16:00',
        source: 'gallery'
      }
    ],
    productBrand: 'Schneider Electric',
    productDetails: 'ตู้คอนซูเมอร์ยูนิตและเบรกเกอร์ Schneider 3 Phase 100A พร้อมระบบกันดูด RCBO',
    price: 85000,
    paymentType: 'credit_60',
    notes: 'รอวิศวกรตรวจเช็คค่าความต้านทานดิน (Ground Resistance) และเซ็นเอกสารส่งมอบงาน',
    assignedTo: 'ช่างนพดล (ทีมวิศวกรรมไฟฟ้า)',
    createdAt: '2026-09-11T14:00:00Z',
    updatedAt: '2026-09-11T16:30:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'job-4',
    jobCode: 'JOB-2026-0904',
    title: 'ส่งมอบสีทาภายนอกกันความร้อน TOA SuperShield สำหรับอาคาร 4 ชั้น',
    contactPerson: 'คุณอารีย์รัตน์ (เจ้าของอาคาร)',
    phoneNumber: '092-123-9988',
    date: '2026-09-08',
    time: '10:00',
    status: 'completed',
    location: {
      address: '12/4 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ',
      lat: 13.8282,
      lng: 100.5678,
      placeName: 'อาคารพาณิชย์ พหลโยธิน'
    },
    photos: [
      {
        id: 'p5',
        url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        caption: 'จัดส่งสีและอุปกรณ์ครบ 30 ถัง',
        tag: 'site_overview',
        timestamp: '2026-09-08 10:40',
        source: 'camera'
      }
    ],
    productBrand: 'TOA',
    productDetails: 'TOA SuperShield Titanium สีกึ่งเงา ขนาด 5 แกลลอน จำนวน 20 ถัง + สีรองพื้นปูนเก่า 10 ถัง',
    price: 63500,
    paymentType: 'transfer',
    notes: 'โอนชำระเงินผ่านบัญชีบริษัทเรียบร้อย พร้อมออกใบกำกับภาษีเต็มรูปแบบ',
    assignedTo: 'ทีมจัดส่ง สายเหนือ',
    createdAt: '2026-09-08T09:15:00Z',
    updatedAt: '2026-09-08T11:00:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'job-5',
    jobCode: 'JOB-2026-0905',
    title: 'สำรวจหน้างานระบบกล้องวงจรปิด CCTV 16 จุด รอบคลังสินค้า',
    contactPerson: 'คุณธวัชชัย (ผู้ดูแลคลัง)',
    phoneNumber: '085-555-1234',
    date: '2026-09-12',
    time: '10:00',
    status: 'pending',
    location: {
      address: '88/2 หมู่ 3 ถนนบางนา-ตราด กม.19 บางพลี สมุทรปราการ',
      lat: 13.6145,
      lng: 100.7489,
      placeName: 'คลังสินค้า บางนา กม.19'
    },
    photos: [
      {
        id: 'p6',
        url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
        caption: 'จุดเสาไฟภายนอกสำหรับติดตั้งกล้องระยะไกล 80m',
        tag: 'before',
        timestamp: '2026-09-09 14:20',
        source: 'gallery'
      }
    ],
    productBrand: 'Hikvision',
    productDetails: 'Hikvision ColorVu IP Camera 4MP 16 ตัว + NVR 16CH 4K + PoE Switch',
    price: 94000,
    paymentType: 'credit_30',
    notes: 'ลูกค้านัดหมายเข้าสำรวจแนวสายไฟเบอร์ออปติกและจุดติดตั้งตู้ Rack',
    assignedTo: 'ช่างเกรียงไกร (ทีมระบบ Security)',
    createdAt: '2026-09-09T14:00:00Z',
    updatedAt: '2026-09-09T14:40:00Z',
    syncStatus: 'pending'
  },
  {
    id: 'job-6',
    jobCode: 'JOB-2026-0828',
    title: 'งานเปลี่ยนปั๊มน้ำบ้านและถังเก็บน้ำสแตนเลส',
    contactPerson: 'คุณรัตนาภรณ์',
    phoneNumber: '082-998-3344',
    date: '2026-08-28',
    time: '11:00',
    status: 'completed',
    location: {
      address: '22/19 ถนนพระราม 2 ซอย 50 แขวงแสมดำ เขตบางขุนเทียน กทม.',
      lat: 13.6621,
      lng: 100.4352,
      placeName: 'บ้านพัก พระราม 2'
    },
    photos: [
      {
        id: 'p7',
        url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
        caption: 'ติดตั้งปั๊มน้ำ Mitsubishi และเดินท่อบายพาส',
        tag: 'after',
        timestamp: '2026-08-28 13:00',
        source: 'camera'
      }
    ],
    productBrand: 'Mitsubishi Electric',
    productDetails: 'ปั๊มน้ำอัตโนมัติ Mitsubishi EP-305R 300W + ถังเก็บน้ำ DOS 1000L',
    price: 19800,
    paymentType: 'cash',
    notes: 'ติดตั้งพร้อมเดินระบบท่อบายพาสสลับน้ำประปา ทดสอบแรงดันน้ำไหลสม่ำเสมอทุกจุด',
    assignedTo: 'ช่างเอกชัย (ทีม A)',
    createdAt: '2026-08-28T09:00:00Z',
    updatedAt: '2026-08-28T14:00:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'job-7',
    jobCode: 'JOB-2026-0815',
    title: 'งานซ่อมแก้ไขปัญหารอยรั่วซึมหลังคาและฝ้าเพดาน',
    contactPerson: 'คุณธีรศักดิ์',
    phoneNumber: '083-441-2299',
    date: '2026-08-15',
    time: '14:00',
    status: 'completed',
    location: {
      address: '77/5 ลาดพร้าว 71 แขวงสะพานสอง เขตวังทองหลาง กทม.',
      lat: 13.7915,
      lng: 100.6087,
      placeName: 'ทาวน์โฮม ลาดพร้าว 71'
    },
    photos: [
      {
        id: 'p8',
        url: 'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&w=800&q=80',
        caption: 'ซีลกันซึมอะคริลิกและเปลี่ยนแผ่นฝ้าเรียบร้อย',
        tag: 'after',
        timestamp: '2026-08-15 16:30',
        source: 'camera'
      }
    ],
    productBrand: 'TOA',
    productDetails: 'TOA PU Waterproof กันซึมโพลียูรีเทน + แผ่นยิปซัมตราช้าง 9 มม.',
    price: 14500,
    paymentType: 'credit_card',
    notes: 'ทากันซึม 3 ชั้น เสริมตาข่ายไฟเบอร์ รับประกันงานซ่อม 1 ปี',
    assignedTo: 'ช่างวิทย์ (ทีมงานช่างปูน)',
    createdAt: '2026-08-15T13:00:00Z',
    updatedAt: '2026-08-15T17:00:00Z',
    syncStatus: 'synced'
  }
];

export const POPULAR_BRANDS = [
  'Daikin',
  'SCG / COTTO',
  'Schneider Electric',
  'TOA',
  'Mitsubishi Electric',
  'Hikvision',
  'Carrier',
  'Panasonic',
  'Hafele',
  'BOSCH',
  'Makita',
  'HomePro',
  'ตราเพชร',
  'DOS',
  'Philips',
  'อื่นๆ'
];
