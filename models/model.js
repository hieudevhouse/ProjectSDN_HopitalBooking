const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho Users
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Không mã hóa password
  role: { type: String, enum: ['patient', 'caregiver', 'doctor', 'admin'], required: true },
  status: { type: String, enum: ['pending_verification', 'active', 'inactive', 'banned'], default: 'pending_verification' },
  login_attempts: { type: Number, default: 0 },
  lock_until: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Patient
const PatientSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date_of_birth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Doctor
const DoctorSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
  years_of_experience: { type: Number, min: 0 },
  price: { type: String, default: "200.00VND" }, // Thêm giá trị mặc định
  location: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  avatar: { type: String, default: "data:image/png;base64,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" }, // Thêm trường avatar
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Service
const ServiceSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Appointment
const AppointmentSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  service_id: { type: Schema.Types.ObjectId },
  date_time: { type: Date, required: true },
  health_issue: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho MedicalRecord
const MedicalRecordSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  diagnosis: { type: String, required: true },
  treatment:{type:String,required:true},
  prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Prescription
const PrescriptionSchema = new Schema({
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  medicine_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }], // Thay thành mảng

  instructions: { type: String, required: true },
  refills: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Medicine
const MedicineSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // antibiotics, painkillers, vitamins, etc.
  illness: { type: String }, // cold, headache, infections, etc.
  ingredients: { type: String },
  usage: { type: String },
  warnings: { type: String },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  requires_prescription: { type: Boolean, default: false },
  status: { type: String, enum: ['available', 'out_of_stock'], default: 'available' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho PrescriptionDetail
const PrescriptionDetailSchema = new Schema({
  prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Order (cho Drugs and Supplements)
const OrderSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  items: [
    {
      medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  total_amount: { type: Number, required: true, min: 0 },
  payment_method: { type: String, required: true },
  delivery_address: { type: String },
  status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Payment
const PaymentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  service_id: { type: Schema.Types.ObjectId, ref: 'Service' },
  order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Feedback
const FeedbackSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  attachment: { type: String }, // Đường dẫn file đính kèm
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
  last_submission: { type: Date }, // Để kiểm tra trùng lặp
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho News
const NewsSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['health_news', 'health_threats', 'community_programs'], required: true },
  priority: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho Insurance
const InsuranceSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true },
  policy_number: { type: String, required: true },
  coverage: { type: String, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Schema cho HealthInfo (dùng cho Health A-Z)
const HealthInfoSchema = new Schema({
  disease_name: { type: String, required: true },
  symptoms: { type: String, required: true },
  description: { type: String },
  treatments: { type: String },
  image: { type: String, default: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUTEhMWFRUXGBUWFxcWFRcdGRgZGxcXGBgdHxsYHSggGBolIBgXITEhJSkrLi4uFyAzODMtNygtLisBCgoKDg0OGxAQGy0lICUvLy0yLS0vLS0vLS8vLy0tLS0tLS0tLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAEAAgMBAQEAAAAAAAAAAAAAAQUDBAYCBwj/xABPEAABAgQDAwkDCAQMBQUBAAABAgMABBEhEjFBBVFhBhMiMnGBocHwQmKRFCNScrGy4fEHQ4LRJDNTY3N0kpOio7PCFTRUg9M1ZKS00kT/xAAZAQACAwEAAAAAAAAAAAAAAAAAAwECBAX/xAAtEQADAAICAgECBQMFAQAAAAAAAQIDESExBBJBIlETM2GB8DJxoRQjUrHBBf/aAAwDAQACEQMRAD8A+0gYM71gBTpb/OAFOtfxgBqeroPstAAp7fh4QIxdLd+cRTX2d34QIrdNhrpABJ6eVqef5QJxdHd+UDfqW36dkDeybHXSABX2PHxhWnR3+cOHtb/xhlY9bQ/ZeAADgzvWAGDO9YioTXH23vQRUt7eQr+JQuZyopsfNf3qyG1ccJJ4QbJS2W4FOlv84Ur0/DwikmhtBQqj5KyD9IuPEDSwCAD8acYr3uTk44PnJzEOxwJ7ChlxtKhwNYrv9CylfL0dDObRZRd15tun01pT9pjTc5TySv8A+yXFN7zf74qZPkitA6Dkun6knhvr+uuYzjYMwbomGSNxll/aH7fCI3X2GKMX/L/BvK5USagB8pa/tA17KZ90ehyklimnO9+Ff/5iqdkJtOTaHR/NuFKv7LgCf8carsypBo4xMIP9CtYHapkLSPjEe1L4GThxV1R00ptqXX82h5tSj7IWnFf3ScQ+EbwODO9Y5PZnyaZKkrWhaQKKBKTQ7lBXVNNCI8rZUysiVeISMkrHONZD2CQUgbkKSDnAr+5FeNzqX/P7nXAYM71gBTpb/OKCR5RgHDNp5utg4DiZJ0qo3aJ3KAFSAFExfAanq6D7LRdNPoz1FS9NE09vw8IEYulu/OIpr7O78IEVumw10iSpJ6eVqef5QJxdHd+UDfqW36dkDeybHXSABX2PHxhWnR3+cOHtb/xhwPW3/ZeAADgzvWAGDO9YC3Xv4wAp1r+MAE/KeEIc4jd4QgAge/3ehEDj1dPKJBxda3rjEA16Jy39kAE/diD7uWsK+zpviScNhcGAAfc7/LPvgfdz1gej1b19aQIw3FyYAH3ortp7VS2QgJLswrqNI61K0ClHJtsHNSt1BU0B1toTzjjhYljRwULz1AUsBQqAAbLeINQk2SCFKthSvc2TIMtJVzV1E4lqKsS1qAsVqN1G1OAsKCILa1yyumtjuOpK5tYdXmllIowm/wBE3eUBquoqKhKY39lNuX52oTSgCq58NwiwAxda1PWsc1tTlzKN1Tj51SfZZGIA5UKycAPCteEVep5bGTVVLhLZ0al0uqyB6EQ06FDomqMv353j5htT9IswsYUNNNpyIXiWrgagpHgfOOfd5VTxFBNLSPooS2kD+ymp7yYU/JhMfPhZHPPDPtc62pSFJbOfo37I0NlyzqFG1BS9wa7vXbHyBrlZtFF0zbh4ENqB/tJMWkn+kydbPTSw4NaoUlR70qoP7MQs8N7Lf6fNEuVp7PsJ93PWNedYK00Sqi611vw9bo4nZf6UZc/xzTjJ1I+cR/hov/DHabP2gy+jnWHUODehQIB3EC4PAw9VNdMyOLxvbRrTew2XUDnhV1Iol0EpdTqKLF6ZWNjS4Ijn3EOMOBl81xV5p2gAcoKlKgLJdABNBZQBUKUKU9ipQpiUQDppfTOME/IomG1NvDommRoQQapUDmlQIBBGRERUpl8Weoe30c2RGGVnFylMOJcsOuyKlTQ+k1qUjVq9h0KUwqhAW24WHjVYGJC6UDqAQMVMgsEgKSMiQRZQi8l9jFSArEASKgU+F4Wk98G7JWOo3XTLRh9K0pU2oKaUApKkkFJSRWoIzEez7uWscnsqa+Su80q0u8un9C8o0I4IcV8Fn37daThsLgw6Xs52TG4rQPud/ln3wPu56wPR6t6+tIEYbi5iRY+9Dt62nlAj2td0KV6RzGnZAAHv93oQHv8Ad6EAMXWt64wScXWt64wATRHomEOYTv8AEQgAiuO2VIVr0d2vZAnF1beuEK16IzGvZAAr7Hj45Qrh6OdfyhX2dd8AcNjcmAB1ONe7L84rtszqmQlLQCn3SUNJIsDSqlqp7CBc77AXUIsK4Lqy+ymecc/sibSXTMOJJU6AlsfybBNWxQ5KXZxWvSANcAiGy8S66LKR2WGmcAUVE4ipZpiWtdcayRbESSd2goAI57avKSXkKpxc8/b5pGm7Gq4bF63vTIGNXl1yzLKlS8sfnaDGuxDQIqABkXKEG9gCCa5R8w35kkkkkkkk3JJNyTnUxmzZ1L1PZt8bx6ud0+H/AJLnbvKOanSedWQ3/JN1DYHvauftW3ARWEgVFPx3dkQhQoK2pe2v4xjUqsYqp1yzpREytStErXXhakeYQihcQIhCADC41qI97L2i7Luh5hZQsUyyUPoqHtJO49ooaGPcazyaGGRTF3KaPubUyZ2XZmWxZaalNRVJyUK60IIPZF2wgqSATcAA61NI+f8A6HtoFTT0uT/FKDqfqrrUDsUhR/bj6IRi6tvXCOnje17HFzNy/wAP7FLysZLjBdSPnJf55NLlQAPOI06yMQ7cJ0jxK7ZUGwAAbdFXDTtjfd2ilTnN4bE4Se22W6OR2DZhLf8AJKcYv/MuKa/2RWnztD8EbXra/VG5Nsh1KkLuFghW++d9Dxi35L7UUtotu3eaOBw5YrdBwDctNFcDiHsxVxrLmfk7yJnJAHNv/wBETZX/AG1HFXRJc3xWXpjvIx+88do7bqca+X5wph6Wdfzgno9a9cvRgBhubgw85Yp7fh4ZwpXpbtOyIp7Wm6BFekMt3ZABNMfCnfCuPhTvgRi6tvXCBOLq29cIAHybj4QiOYVv8TCACT7nf6MOzra+cDbq38YZXHW1H22gAfegPez0hx9rd+EBe6rHTSACt27UtBpWbykNX+io1ey15sOHujV5STKJVpybWKlI6Ca2U4aJbFr507BeNuZOKZYSvIIfc3UI5pseDqvgY4r9Ls6o/JmNKuPH9kBCO0dNZ/ZheSvWWx+CXVqV8nBdI9NZK1rUpRJ9pRNVE03k5R6LYKSQKEZjSPcu6KAGxGRMWmyNlfKPaDcvX5x9RATT2glSrKWbiosnM5AHmJbOzVKFyc8hVfiR8Lfvj1AhIKgimHEvDQ1GHEaX1trCKsZL2tiEIyykq68ooYbU6sCpCch9Y5J+06VgSbekRVKVunpHvZ0guYdSy11lBRrokJFSTuGQ7VCNYHeKHUHMHUHiMo+ocjZJiWHNELEw6OkpxtSceEE4UE1TRIqcNa5qOtOL5abO5ibXQUS7V1O6pNHB/a6X/cEXqHPYjFnV1x0UkY3xaMkeVixii7ND6L39Gs9zW0GwTRLqVtK3XGMeKAP2o+3H3O/0Y/N8pMc2427WnNuNuV+osK8o/Q01PobIANaitr0G+Oh49fS0cny8bdrXyZiygqxISMW+l/GOQS0UTM03vdS4kf0jaCr/ADA5HZm3Uv4xzM0oN7S5zPFLtYh9Vx4DvHOGHWuBPj21f7EOy6kdZJFcqxjW2FAgjQgjQg5iLPae0UuUSkWBrUxXlQhbSN8VTW6WmbXI+aq0phwkqlzzYJqSpulWlV1JRQE6qQqL0e9lpHI7PWG51omyXkLZVxUkF1q/AB8ftx1wNbKsNNIbD2jnZ49baH3IHh1dfOFdPZ3/AIwJpYdXU/beLCST7nf6MD7nf6MCadW/jA26l/GACKL4/EQhzi93hCACSMF86wpTpb/OAGC+dYAU6W/zgAU9vw8IAYulu/OFPb8PCBGLpbvzgArHGw9NUNRgaBt7zhp/px85/Skus6PdZbTT9t0/u8I+ko6U04cqMM5/0j/7o+ZfpQT/AA4K0Uw1TuW6D5Rn8j8tmzw3/uop+S0kl6cYbWkLQSsrSciEtLUKjUYgm0fQpRlLz5ocNFPoQUpRVCGFIaKE40kJBXiJIANgK2Ecj+jZus6T9Flw95W0PMx12xCUdMIUsodnULQkpCgpczzgPTUBSgBzuFgitYp4c7f8+5P/ANGuf59mcltDkNOc67zbaVILiyhRdQCUqUVCo3itO6PDXIGfOaWUcVPH/Ygx9IO1lf8ATP8A+R/5Y8nbCtJV898uPteh78THvemZ15+VLSa/wcxsv9GzYNZl5TvuNgtp71VKz3FMdY3sOWSkIEuzhGQ5pFviIw/8VdI6MsoHc462n/TK48Kn5jUMN8S4tzwwt/bD4xTK+lGfJnu3uq/n7FdOpCFJSkUDc4yEj6IWEEgbhR1QpuNInlpsP5S10ac4jpNk5FVKFJOgULcDQ6RiL6HXmmmnEvL58PPqQQQgIQSMWGyLpaQEm9N9CY6R5NR4xi8vmv2NXiNyt/qfCCMwQQQSCDmCDQgjQg2hHbcvdhChm2xcU54bxkF9osDwv7N+JJjA0duL9kaRFbR945O4HpSVdWMSlMtE3OYSAa771j4Oo0FTpH6A5IyxYkpdtQ6QaQVcCRVQ+JMbvH7Zz/Mekmuy2Iwcaxy/KJNJxk/TYer+y4yR98xczc/zSsIFTQVjnNqTCXZ1BGaJdZI3c66mn+gqH21rRn8fHSpU1wZYzSjGNaU1pU591fKMMSDS4tCjoPeuCeU8oGObWlX8W407elQlLiQ58UFY746sHF0d3laON2k0Xm3EKJONC0EkmtFJKfOOm2RO/KJdlzLG2258UgkfEw2HyzB5MtKWzcr7Hj4wJp0d/nCvsePjCtOjv84YZAo4ONYEYONYA4ONYJGDjWACPlJ3CEevlPCEAEAU61/GIApc9XQfZaJHv93oQHHq6eUAEU19nd+ESRW6bCH3YxzL6W0qWVBLaQVLUTYAZkk5WgAqZ1tS5hxKB+oaO6tHXbRx/wCkPYy+YamKH5pSkLG5tzDRXctIH/cJit2/y3dW+tcoSygpDeIgFakpUpWLpA83XEbZ0pcGw5Z1TjygCVOuLIQMaioqUo0AqonMmMWXND3K5Opgw5JSb0l2dp+iyWJXMO6AIaHbdax8Ob+MdrObPYJU642ioFVLIAOFI1ULkAb4xcndkJlZdDINSBVavpLN1G/HLgAIwbbCnG5hklSAtC20gS7q8QW3QnGjopNVEXyw1OcLhfCE5L9qbMsts2UdQlaEIWhYCkm5CgcjePZ5PymspLntYbP2pjFyS2cuXk2WXSCtCTipkCVKVSutK0rwi3gbbK610UU1snZyXG23JaVDjuINpMu1VeAYlU6Ogp8Y2muTsmk1TKSyTvDDQPgmNDlHsVTszJzIcwCXU5i6BUaLCaEBN800PBVdDFs0500hDpeSQcRwAJTuIUkAE1thub1tS9lLa2Dr4NltsJFEgJG4AAfAR6iYRQCtfZC0qQq4UCk9hFD9sfEVgpTRXWHRPaLH7DH2ydm0NIW64cKEAqUdwF4+V7E5PvTrgJSptoqK3FkEdYlRSio6RvSuQz3Ar0bcdeuzQ2BstUxMMN4FFDjqUlRQrAUg4nBipQnClVqx+hhbrfvjltjS6DNBKBhblGghIGQccAwgcUtp+Dwi92k8tKKgVVUDLIXvQerxvwLUbMHkU8mRSRNbPSo4lkjsOfxjkZWin5pwUw87zKfqspwEf3hdPeY7Fh883jfsACo1tYVNfhHFcnQfk7aiKKcxPKBzCnVKdPiuLXob43t7NN9HVNbDqmpVRR0pYcIqXWylRScwaGOgG2m8Nb13U88ooZl4rWVHX8hEVr4GYHlbfuY42+Ra/mXGQbsvuo4hCqPIHYEupA4ARpx75NOFE2+gfrG2nRxKcTTngGYiHyHlTvHs6rh7W/8AGGVj1tD9l4feh29bTyh5zALde/jACnWv4wHv93oQHv8Ad6EAE84jd4QhRHomEAEA4utb1xiAa9E5DXsia47ZUhWvR3a9kACvs6b4+Z/pR23VYkmz0E4Vu8V2UhPYkYV9pTuj6ZX2PHxyjn+UHJCVmVErQUumnzrZwqOgxChSugAHSBtlSF5Zqp1I7Bcxaqj4tF3yIQkz7GLQuEcVBpdPM90Xj/6OiJgspmqJDaHKqZqogqUkizgFRhF6e0LRtbW2NK7M5gpxuTLjiObdcHRSApIcSSkUbSpK1A4UqVet8MYlgpcs6V+TFr1nls6Z/Ziia4gfrVrG1IyxQDVVeGgikd2jNPAiXKRcpKkNlQQoKFem+Wwq1ckGhpnGE8lXHamZfKga1QSpwCthhKsKBQV/VnOugg9ddmd5aqdNl81tZlTvMoWFrpUhFVBI95SapQTQ0BIrSN2KBvk+WVpdlldMDC4lw9F1FzToCjagSSFJTqag1qL+Ao9fAivnJJaiSF1G41t8IsIRBM25e0Uv/C1+78fwjZl5VaLldtwrQ/GLGNaYXem6IfA38Wr4ZhjBPzYaQVqqcglI6y1E0SlO9SjQDtjHtDaCGqAhSlqs22gVccO5Kd29RoBmSI9MbNcRSbmCkvCzTSbtsYgQSD+sdIqCumVgACcU48br+xFVrj5LTk/s4ss/OEF5SlOuEZFxVyBqUpASga0QIsgMXWt64xRyU8suDEcVTrSLymPhTvjoS1rgxZcdRX1FFy0dJk3EZF0tsCmdHVpbWR2JUo90V4AFhkLCMnKCb56ZQ2OrLguLv+tWkpbT2hClqI99BjHC7e2bfFnUb+4hCEUNJtSsitypSLDUmNEVZnpZRFCrnpc8MaA6K8KsD4iL3Zm00IbwqqCK5DOprFBymm8WF4CnNvSy/wBlLyMX+HFF+Fpmande0tcHZ09rXdClekcxp2QKadPw8M4Ur0t2nZDjmgDF1reuMEnF1reuMKY+FO+FcfCnfABPMJ3+IhEfJuPhCAATi6tvXCFa9EZjXsgfc7/Rh2dbXzgAV9nXfAHDY3Jh96A97PSADnZ+ZLW05YKulxl9s/WxIWj7ix3iOiAw3NxHJcp2S5MYCSlSWUKSoUqhRdUpChxCm0nujdk5pc22CSELbUUOoqaJWADUUuUkUUngoa1inty0P/C3MtvSNvaWxsSi+yvmXTSpAxJcGQDjdgum8FKhkFUtFdObVdl0Y5mXOCtC6woLQkfSWF4VoG+ygN+sdKAder6841XNoNheAG1aG1uMVvHLKxVdJbKdPKBjUuI+uw8kfFSAPGJTyjkycPypgK+iXUA/AmsZ5jYRScUmoIGrSq8yTwGbR+r0bklJMV7m0gjozKSycqru0rSzo6F9ArCr3Yy3FT8GiHNdM2XuUcmmypuXT2vtj/dEI5SSiurMtL+osL+5WNd/arLaggKxOG4aaSVuEHI4EAmnE24x7banXskIlk73jzjv922cCbZVcPEaRWVVdItSme2ROcp5dCFKJcwpFSrmHglI3lRQE+MastOvzQHyVtTaDm/MIKQP6No0U6eJwpvmcouZLk20hQcfUuYdSaoU8QQg6FDaAG0HPpUxcYuh7/d55d0aJ8f5oS8+uJKzY+w25YlfSccWAFuuHE4vUCtglPuJASN0b0zLhaTi6p3ZjdGQe9lpD7saNJLQj2e9mlJ7MCDjrWm/xtGPb+1ksN4wMS1HA03WhccIJAtkLEk6JBOkbG059thsuuKwtild5JNAkJF1KJoABckxyicTrhmHRhURhbbt8y2TUpqLFaqAqItYAVCQTWmpXA/HFZq3RMjLlCekrGtRK3F0piWq6jTQaAaAAaRni5Z2HVNVKoo3pSw7YqphkoUUqzEKaaN0ZIrifg29kNtlR5wiwsCbGNedCAtWDq1t591YwQg3xolT9XtsRpbcl+cln29VNOJHaUmnjG7EiILnTSjmJCHa1SpKVW1xAd2sZSK9IZbuyKPkOr+AsJPVbCmf7pamh9wReHh1dfONCe0cWlptEkYurb1wgTi6tvXCB9zv9GB9zv8ARiSCOYVv8TCFF8fiIQASbdW/jDK462o+20CMF86wpTpb/OABx9rd+EBe6rHTSFPb8PCAGLpbvzgA51CEL2g8XTQBlhFzQVBdXTh/GRXzauYmPlDIK0joOoTm41UkFO9xBJKd4KhqKe5pys3M8CyP8pJ849Qhvk6eLH7Qt9NdHTyc2h1CVtqCmlAFKhkRpeKhzZa8drpr1q2pvMU7DjkspS2BjbWcTrFQMRrdbZNkuHUGiVa0N4v18omBL8+hRWg9EBI+cU4ThDQQaEO4ujhNCDnSL7VLkzavA+Pk2dq7TRLpBNVFRwoQgYluLoSEpSMzQE7gASSACYrTITMwPnllhs25hhdVkfzjwFR9VvDT6So97MlS0r5RNFJmVppStUsoJrzbfwGJeaiNwSBdJUAApJCgddIv2I1pf+mtszZjEugIl2kNjVKEgX1rS5PE3jb4+1u/CB6Ixd8YGppCiSFAqF6es4krpvkqNqY1OXB0wihy4RcyiTgAcNwNfV9IygYulu/OA6fCnn+UVU6exl5faVOujFMYlJUMjQ4TlfS8UgmUyiVOTBKUHohIupxeaUoSLrUaWA46Vidr8pgFFlhHPvJNFAGjbZp+scocJ91IKriwF4pmpVRc559fOvUoDSiG06pbTU4QdSSVHU0AArVLY/Bjty18MHnZhaXpgYcFSywDUNVFMSjkt6lqiyQSBmSduETCzdMqVpHQJ223hqQa7qa9u6KOZfK1FRzPhujFCJdNi8eGYe0I9stlSgkZk0jxGRl0pUFDMGsVGPeuCxmdilKCoKqQKkUp8LxVRaTe2VKThCcNRQmtfhuisAi1a+BeL8TX1m1yIV8063omZmAeGJfOi/8A3Ae+OiJpYdXXzvHM8kyA/Nsj2lMvn9tvm6//AB46YmnR3+cNno52ZathRp1b+MDbqX8YKODjWBGDjWLCiOcXu8IQ+UncIQASBgvnWAFOlv8AOAFOtfxiAKXPV0H2WgAmnt+HhAjF0t35xFNfZ3fhAit02GukAHGqXim5w/zrY+Esx++LbYiEFzpUy6IO/wDfFOg1mZ0jLn0+EtLiNmM++TqzPtiS/QuuUCEAJIpjrpu4+EUHJfZyHn1zikigJaYt1imqFvH6RuptJ0SFUsqMO2JgtsPODNDbix2pQSPsjrNkSiWZdplI6jaEJ7kgC8Xn6q2Z828eNRsrdqyyg4TQkGlCBwiy2WyWkdIZmtN0bYNOtfxiCcN15cbxdTp7E1mdQo0a202VFtRTrQ01pWsVOzGF84FAEBJqT5Rcy0yldSDVI0vbdYxR7d2qpbipeXWUBNOecTmioBDadA4QQon2QRaqgRFa7L4qtJ40uzd2tt5tteBIU47QfNIoSBXNaiQlsfWNTQ0BilnX5iY/jnObR/JMFQrvCnbLUPqhHGseZWWQ2nChISLm2pNySc1KOZJudYywt02acfjTPfLMcuwltIQhISkWCUgADsAjoJHZCCgKXUlQrY5Vyiji0k9sFCQkpxUsDWlvhBOvktnVufoNSflS2vDWozB4RrRmm5kuKxK7OwRhiGMjfqvbsmNqQkFO1oQAMyY1I3Nnz5aJoKg5itIFrfJGT29fp7MU5KltWFXaCNRGCNidmi4rEewAaCNeBkzvS9uyY9WiE/CIUYgseNlrwz6BSgeYWivFpxK0j4OOeMdfWnR3+ccPNHC9KO1pgmEpPY6hbA/xOo+EdxlY9bQ/ZeHY+jm+VOrAODjWCRg41gLde/jACnWv4xczE/KeEIc4jd4QgAge/wB3oRA49XTyiQcXWt64xANeict/ZAA+5A+7lrCvs6b4E4bC4MAHIbMCS++V2SZl2vYmiB3dARabYDQKebpka4cuHfnFNKnpP/1iYHwcVGyBCNnViOJrfwYNoSvOMuNn9YhaP7SSnzjp9izYelmXqEKW22sA5glINCN4Nu6NBzZi0oxGlrkA3ERydVhlnKEqLbj+EHisrA7BioBuAi0cMR5DVpNP50Xg9/u9CMbzeNJSs0BFjxjQ2TMKcUoLNQBWtrHdl6pFmk4utb1xhie0Zbl460Ue0VGUl3XRRajhQ2DZKnFqCGgaXoVKTXhFRJS3NoCalRuVKOa1E1Uo8SST3xZcsHTSWb0VMD4IadcHihMRs2WDiwkmgoT200hVd6RtwV9LyUakI29pyyW14UmooDfMcPW+NSKvg0zSpbQhCEQSImIjIy5hUFUrQg07IAZ5WgixBB4ikeY3tpz3OlNBQCued6fujRiWVhtrbWmegNYnDEoIj0TSAkwxmEqvDjwnDvjDFkravzXNhNDTCTwy+MC18lbdLXqig25X5O6pPWQkuJ+s384nxSI7dlwKSFakAp7xURybiMQKd4I+IpF1yTcK5GWWo9PmGq/WCAD4gxfGZfMXTLUe/wB3oQHv93oQAxda3rjBJxda3rjDTCTRHomEOYTv8RCACK47ZUhWvR3a9kCcXVt64QrXojMa9kACvsePjlCuHo51/KFfZ13wBw2NzABwuycnv61O/wD23h5RYoOEhQ0IPwvHnklKBfOpVXovzleJ+VPCvnGztOXCHCkGooD2V0hGuNnWm036fobk7tjEgpSkiooSfGka3JFFpk1ymCf8lg/bWNGN3kYmrby9DMvV/YKWz9yLS90I8iJjHpfcv0oCsqJia4+FO+BGLq29cIE4urb1whpgOc5VKq7Kp+it0/BpSP8AfGsDGTlQ7/CpVNP1U2e9KpYf7oxQi+zp+Mv9tExEIRU0HUyMogNpokGoBJIF6iKLajAQ4QnKxpurpBjaTiE4Um2lQLRqrWSSSak5mL1SaM+LFc222eYQiYoaBEqTEi0eSYAECKZ2ix2Dh5y+dOj2/vp5xt8oQnCn6Vbb6a92UW9eNiXm1kUaKOIhExUcI3+Rd5UaFt2YRTgh9wJ+Ioe+K+NvkeT/AAlOiJgnuUyy59qlReOzL5a+g6KmPhTvhXHwp3wIxdW3rhAnF1beuEOOcPk3HwhEcwrf4mEAEn3O/wBGHZ1tfOBt1b+MOI62vnaAB96A97PSGlfa3fhAXuqx00gA4jY7ik89QkETU7cHQzTp8421KJNSaneY1JEUL4/9zMn4vLV5xtxnOxH9KYEb3IlsiUSrRbkw4eON9xX2ERuzmy20NlQJxChrXPujW5GE/IZbcW0k8MVzfvhkrTMfkZVcLX3Lo+53+jFZP7TwLwtgWpUmt9YsyadW/jGhPbMC1Ykq7QBXzi1b1wIwuFX19HO7efC5uTUP5Cdr245QGMkRygZSibk0p/6ecr285J1j1Cq7Ojg16cdc/wDZEI39jLQHKrplYnKsettONlYwUy6RGR3ZZmDXGyfxPr9dfuV0IRIEVGCLpez2wzirfDWtczStKbop9IgqO+LJ6F3LrWnogmIhCKjBEkxEIAEZ5SWU4rCnvOgEYItNhzSUFQUaVpQnK1beMSltlMlOZbnsxT+zFNitcQyrSlI1+TCj8omk6YZZZ7+eSfBsRbbZn0FBQkhRNKkZChrn3RT8nlUnHh9NhivYhx4H/U8Ivwq4MtOqwN0dQfc7/Rgfc7/RgTTqX8YG3Uv4w0wkUXx+IhDnF7vCEAEkYL51hSnS3+cAMF86wAp0t/nAApUY/DwgBi6W784U9vw8IEYulu/OADjGT85Mf07ndXCfMHvjPGA2mpsb3ULHYphnzCov9lzjSWilWd6ilcXrKEa2zqK3ONNLfRVF1RABUSBkCTQR62KV/wDDpVKa3abrTPq/ZGPWLTkgv+BS6f5sJ+FU+UTC2U8ivX1evk29mFaEdMXJtXMD1WNwjBxrAHBxrFbOTq2nMKQDYZg3ruhvSMal5aeim5Tp/hsod7E4f8yTjalNmrcTiTQDiTfwjV5QprOsn6Mu+af0jjH/AI4vNjzyA2EKISRXO1aknzhbSdcmqaqcKclK+ypBwqFDGOLHbM2lxQw3AFK7/wAIr4o+zVDblNkQjYkJnm1hVK5xjfcxKKqUqSaQE7e9aJZbK1BKcz6rG5NbIWhOKoVS5pp++NaQmObWFZjXsMWu0NrIKClBJJFK0IoDnnrFklrkTkrIrSlcFFCEIoPEXEhs5tTOJRua3r1aetYp4nEctIlPRTJLpaT0RCEIguI87KcI2g2NFy0wD+y7LU++qPUY9mf+otf1WaHxdlB5RaexWf8ALZ2Kjg41gRg41gDg41gkYONYeckj5SdwhHr5TwhAAmshBzqDuhCAAnqfH7YS/VPf9kIQAcdNf82/9Vj7q49whCK7Otg/LRIix5Jf8qz+1/qrhCJx9ifM/pRdTWYjFO9dHYYQhrMM9nNbc/51H9VH+rHmEITXZ0/H/LQhCEVHCEIQAIQhAAhCEACEIQAIQhAAiNkf+oI/q7v+sxCEWnsT5H5bOtmsxHqayEIQ85RrwhCAD//Z' },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Định nghĩa các model
const User = mongoose.model('User', UserSchema);
const Patient = mongoose.model('Patient', PatientSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);
const Service = mongoose.model('Service', ServiceSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
const Prescription = mongoose.model('Prescription', PrescriptionSchema);
const Medicine = mongoose.model('Medicine', MedicineSchema);
const PrescriptionDetail = mongoose.model('PrescriptionDetail', PrescriptionDetailSchema);
const Order = mongoose.model('Order', OrderSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Feedback = mongoose.model('Feedback', FeedbackSchema);
const News = mongoose.model('News', NewsSchema);
const Insurance = mongoose.model('Insurance', InsuranceSchema);
const HealthInfo = mongoose.model('HealthInfo', HealthInfoSchema);

// Export các model
module.exports = {
  User,
  Patient,
  Doctor,
  Service,
  Appointment,
  MedicalRecord,
  Prescription,
  Medicine,
  PrescriptionDetail,
  Order,
  Payment,
  Feedback,
  News,
  Insurance,
  HealthInfo,
};