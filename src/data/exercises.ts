// Katalog gerakan — Masterplan MVP Lite bagian 7.
// Sumber gambar: free-exercise-db (yuhonas) dengan commit SHA TERKUNCI.
// Wajib jalankan `npm run check-exercises` setiap kali katalog diubah.
// ATURAN: jangan ubah `id` setelah ada log. Hanya `name`, `tips`, `autoPick` yang boleh diedit.

export type LocationMode = "home" | "gym" | "both";
export type ExerciseMetric = "reps" | "duration";
export type MuscleGroup =
  | "glutes_hamstrings"
  | "quads_calves"
  | "core"
  | "back"
  | "chest"
  | "shoulders"
  | "arms";

const GITHUB_SHA = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";

export const CDN_BASE =
  `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@${GITHUB_SHA}/exercises`;

export function imageUrl(id: string, frame: 0 | 1): string {
  return `${CDN_BASE}/${id}/${frame}.jpg`;
}

export interface Exercise {
  /** Nama folder di free-exercise-db. JANGAN diganti setelah ada log. */
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  location: LocationMode;
  equipment: string;
  metric: ExerciseMetric;
  sets: number;
  /** Label tampilan, mis. "10-12" atau "30-45 dtk". */
  target: string;
  /** Nilai awal input bila belum ada riwayat. */
  defaultValue: number;
  restSeconds: number;
  tips: string;
  /** false = tidak dipilih generator jadwal otomatis. */
  autoPick: boolean;
  /** Batas atas target detik, hanya untuk metric "duration". */
  targetSeconds?: number;
}

/** Helper agar setiap entri tetap tervalidasi tipe. */
const ex = (e: Exercise) => e;

export const EXERCISES: Exercise[] = [
  // ── Bokong & Paha Belakang ────────────────────────────────────────────────
  ex({ id: "Butt_Lift_Bridge", name: "Glute Bridge", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Dorong pinggul ke atas, tahan sejenak di puncak, leher tetap rileks.", autoPick: true }),
  ex({ id: "Glute_Kickback", name: "Kickback Glute", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "12-15/sisi", defaultValue: 12, restSeconds: 60, tips: "Pinggul tetap stabil, dorong tumit ke atas tanpa memutar pinggul.", autoPick: true }),
  ex({ id: "Hip_Lift_with_Band", name: "Hip Lift (Pita)", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Pita elastis", metric: "reps", sets: 3, target: "15-20", defaultValue: 15, restSeconds: 60, tips: "Pita di atas lutut, jaga lutut agar tidak roboh ke dalam.", autoPick: true }),
  ex({ id: "Monster_Walk", name: "Monster Walk", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Pita elastis", metric: "reps", sets: 3, target: "10-12/sisi", defaultValue: 10, restSeconds: 60, tips: "Langkah pendek dalam posisi setengah squat, pita selalu tertarik.", autoPick: true }),
  ex({ id: "Ball_Leg_Curl", name: "Leg Curl dengan Bola", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Bola fitness", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Tarik bola dengan tumit sampai pinggul naik, jangan turunkan pinggul saat menarik.", autoPick: true }),
  ex({ id: "Hyperextensions_With_No_Hyperextension_Bench", name: "Back Extension Lantai", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Gerak pelan, tenaga dari bokong dan belakang paha, bukan punggung bawah.", autoPick: true }),
  ex({ id: "Dumbbell_Lunges", name: "Lunges Dumbbell", muscleGroup: "glutes_hamstrings", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-10/sisi", defaultValue: 8, restSeconds: 75, tips: "Lutut depan di atas pergelangan kaki, jangan menekuk ke dalam.", autoPick: true }),
  ex({ id: "Barbell_Glute_Bridge", name: "Glute Bridge Barbel", muscleGroup: "glutes_hamstrings", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 90, tips: "Beban berat butuh pengawasan — mulai dari bar kosong.", autoPick: false }),
  ex({ id: "Romanian_Deadlift", name: "Romanian Deadlift", muscleGroup: "glutes_hamstrings", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10", defaultValue: 8, restSeconds: 90, tips: "Punggung lurus, dorong pinggul ke belakang — mulai bar kosong.", autoPick: false }),

  // ── Paha Depan & Betis ───────────────────────────────────────────────────
  ex({ id: "Freehand_Jump_Squat", name: "Bodyweight Squat", muscleGroup: "quads_calves", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Turun pelan TANPA melompat, dada tegak, berat di tumit.", autoPick: true }),
  ex({ id: "Chair_Squat", name: "Squat Kursi", muscleGroup: "quads_calves", location: "home", equipment: "Kursi", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Sentuh kursi ringan saja, jangan duduk penuh agar tenaga tetap di kaki.", autoPick: true }),
  ex({ id: "Dumbbell_Squat", name: "Squat Dumbbell", muscleGroup: "quads_calves", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Dumbbell di samping badan, turun sampai paha sejajar lantai.", autoPick: true }),
  ex({ id: "Bodyweight_Walking_Lunge", name: "Walking Lunge", muscleGroup: "quads_calves", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "8-10/sisi", defaultValue: 8, restSeconds: 60, tips: "Langkah panjang, lutut belakang nyaris menyentuh lantai.", autoPick: true }),
  ex({ id: "Calf_Raise_On_A_Dumbbell", name: "Calf Raise (Pegangan Dumbbell)", muscleGroup: "quads_calves", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "15-20", defaultValue: 15, restSeconds: 45, tips: "Tumit menggantung di tepi undakan, angkat-turun dengan rentang penuh.", autoPick: true }),
  ex({ id: "Calf_Raises_-_With_Bands", name: "Calf Raise (Pita)", muscleGroup: "quads_calves", location: "home", equipment: "Pita elastis", metric: "reps", sets: 3, target: "15-20", defaultValue: 15, restSeconds: 45, tips: "Rentang penuh, tahan sejenak di titik tertinggi.", autoPick: true }),
  ex({ id: "Dumbbell_Seated_One-Leg_Calf_Raise", name: "Calf Raise Satu Kaki", muscleGroup: "quads_calves", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "12-15/sisi", defaultValue: 12, restSeconds: 45, tips: "Kerjakan satu kaki bergantian, gerak tetap terkontrol.", autoPick: true }),
  ex({ id: "Leg_Extensions", name: "Leg Extension", muscleGroup: "quads_calves", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 75, tips: "Sesuaikan seat dulu, kaki lurus penuh lalu tahan sekejap.", autoPick: true }),
  ex({ id: "Leg_Press", name: "Leg Press", muscleGroup: "quads_calves", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 90, tips: "Punggung menempel kursi, lutut tidak dikunci di titik atas.", autoPick: true }),
  ex({ id: "Hack_Squat", name: "Hack Squat", muscleGroup: "quads_calves", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 90, tips: "Turun terkontrol sampai dalam, dorong kembali dengan tumit.", autoPick: true }),
  ex({ id: "Calf_Press_On_The_Leg_Press_Machine", name: "Calf Press Mesin", muscleGroup: "quads_calves", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "15-20", defaultValue: 15, restSeconds: 45, tips: "Dorong dengan ujung kaki, jangan biarkan lutut naik-turun.", autoPick: true }),
  ex({ id: "Barbell_Seated_Calf_Raise", name: "Seated Calf Raise Barbel", muscleGroup: "quads_calves", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 45, tips: "Gerak kecil tetap rentang penuh, bahu jangan ikut terangkat.", autoPick: true }),
  ex({ id: "Barbell_Full_Squat", name: "Squat Barbel", muscleGroup: "quads_calves", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10", defaultValue: 8, restSeconds: 90, tips: "Butuh teknik dan pengawasan — mulai bar kosong.", autoPick: false }),
  ex({ id: "Barbell_Walking_Lunge", name: "Walking Lunge Barbel", muscleGroup: "quads_calves", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10/sisi", defaultValue: 8, restSeconds: 75, tips: "Butuh ruang dan keseimbangan beban — mulai bar kosong.", autoPick: false }),

  // ── Core (Perut) ──────────────────────────────────────────────────────────
  ex({ id: "Plank", name: "Plank", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "duration", sets: 3, target: "30-45 dtk", defaultValue: 30, restSeconds: 60, tips: "Badan satu garis lurus, pinggul tidak menjorok atas atau bawah.", autoPick: true, targetSeconds: 45 }),
  ex({ id: "Dead_Bug", name: "Dead Bug", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "duration", sets: 3, target: "30-45 dtk", defaultValue: 30, restSeconds: 60, tips: "Punggung bawah menempel lantai, lengan dan kaki bergerak lambat.", autoPick: true, targetSeconds: 45 }),
  ex({ id: "Mountain_Climbers", name: "Mountain Climbers", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "duration", sets: 3, target: "20-30 dtk", defaultValue: 20, restSeconds: 60, tips: "Pinggul rendah, bahu tetap di atas pergelangan tangan.", autoPick: true, targetSeconds: 30 }),
  ex({ id: "Crunches", name: "Crunch", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Angkat bahu dari lantai, jangan tarik kepala dengan tangan.", autoPick: true }),
  ex({ id: "Flutter_Kicks", name: "Flutter Kicks", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "duration", sets: 3, target: "30-45 dtk", defaultValue: 30, restSeconds: 60, tips: "Tangan di bawah pinggul, punggung bawah tetap menempel lantai.", autoPick: true, targetSeconds: 45 }),
  ex({ id: "Leg_Pull-In", name: "Leg Pull-In", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Tarik lutut ke dada lalu luruskan tanpa menyentuh lantai.", autoPick: true }),
  ex({ id: "Alternate_Heel_Touchers", name: "Heel Touchers", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "12-15/sisi", defaultValue: 12, restSeconds: 60, tips: "Sentuh tumit bergantian kiri kanan, otot perut samping yang bekerja.", autoPick: true }),
  ex({ id: "Cross-Body_Crunch", name: "Crunch Silang", muscleGroup: "core", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "10-12/sisi", defaultValue: 10, restSeconds: 60, tips: "Siku menuju lutut satunya secara diagonal, jangan tarik kepala.", autoPick: true }),
  ex({ id: "Exercise_Ball_Crunch", name: "Crunch Bola", muscleGroup: "core", location: "gym", equipment: "Bola fitness", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Punggung bawah menempel bola, gerak pelan dan terkontrol.", autoPick: true }),
  ex({ id: "Cable_Crunch", name: "Crunch Kabel", muscleGroup: "core", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Melengkungkan punggung ke bawah, jangan tarik dengan lengan.", autoPick: true }),
  ex({ id: "Cable_Reverse_Crunch", name: "Reverse Crunch Kabel", muscleGroup: "core", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Tarik lutut ke arah pinggul, pinggul sedikit terangkat.", autoPick: true }),

  // ── Punggung ──────────────────────────────────────────────────────────────
  ex({ id: "Bodyweight_Mid_Row", name: "Mid Row Lantai", muscleGroup: "back", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Siku bergerak di samping badan, rasakan padatnya punggung tengah.", autoPick: true }),
  ex({ id: "Back_Flyes_-_With_Bands", name: "Rear Delt Fly (Pita)", muscleGroup: "back", location: "home", equipment: "Pita elastis", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Pinggul terlipat ke depan, tarik pita dengan bagian belakang bahu.", autoPick: true }),
  ex({ id: "Band_Pull_Apart", name: "Band Pull Apart", muscleGroup: "back", location: "home", equipment: "Pita elastis", metric: "reps", sets: 3, target: "15-20", defaultValue: 15, restSeconds: 45, tips: "Lengan lurus, buka pita sampai melewati dada.", autoPick: true }),
  ex({ id: "Bent_Over_Two-Dumbbell_Row", name: "Bent-Over Row Dumbbell", muscleGroup: "back", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Pinggul terlipat, tarik ke pinggang, bukan ke dada.", autoPick: true }),
  ex({ id: "One-Arm_Dumbbell_Row", name: "One-Arm Row Dumbbell", muscleGroup: "back", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-10/sisi", defaultValue: 8, restSeconds: 75, tips: "Tumpu satu lutut di kursi, tarik ke pinggang tanpa memutar badan.", autoPick: true }),
  ex({ id: "Inverted_Row", name: "Inverted Row", muscleGroup: "back", location: "home", equipment: "Palang/meja", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Badan lurus, tarik dada ke palang, turun dengan pelan.", autoPick: true }),
  ex({ id: "Dumbbell_Incline_Row", name: "Row Dumbbell Di Bangku", muscleGroup: "back", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Dada menempel bangku, tarik dengan punggung atas.", autoPick: true }),
  ex({ id: "Chin-Up", name: "Chin-Up", muscleGroup: "back", location: "home", equipment: "Palang", metric: "reps", sets: 3, target: "5-8", defaultValue: 5, restSeconds: 90, tips: "Genggam menghadap kamu, tarik sampai dagu lewat palang.", autoPick: false }),
  ex({ id: "Pullups", name: "Pull-Up", muscleGroup: "back", location: "home", equipment: "Palang", metric: "reps", sets: 3, target: "5-8", defaultValue: 5, restSeconds: 90, tips: "Genggam lebar, tenaga dari punggung, bukan lengan.", autoPick: false }),
  ex({ id: "Close-Grip_Front_Lat_Pulldown", name: "Lat Pulldown", muscleGroup: "back", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Dada tegak, tarik bar ke dada atas, turun dengan pelan.", autoPick: true }),
  ex({ id: "Leverage_Iso_Row", name: "Iso Row Mesin", muscleGroup: "back", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Dada menempel pad, sesuaikan seat sebelum mulai.", autoPick: true }),
  ex({ id: "Cable_Rope_Rear-Delt_Rows", name: "Rear Delt Row Kabel", muscleGroup: "back", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Siku tinggi, tarik ke arah wajah, pergelangan tetap netral.", autoPick: true }),
  ex({ id: "Elevated_Cable_Rows", name: "Seated Cable Row", muscleGroup: "back", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Punggung tegak, tarik ke perut, jangan ikut berayun.", autoPick: true }),
  ex({ id: "Bent_Over_Barbell_Row", name: "Bent-Over Row Barbel", muscleGroup: "back", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10", defaultValue: 8, restSeconds: 90, tips: "Pinggul terlipat, punggung lurus — mulai bar kosong.", autoPick: false }),
  ex({ id: "T-Bar_Row_with_Handle", name: "T-Bar Row", muscleGroup: "back", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10", defaultValue: 8, restSeconds: 90, tips: "Beban berat, butuh teknik matang — untuk tahap lanjut.", autoPick: false }),

  // ── Dada ─────────────────────────────────────────────────────────────────
  ex({ id: "Bodyweight_Flyes", name: "Flyes Lantai", muscleGroup: "chest", location: "home", equipment: "Berat badan", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Terlentang, rentangkan kedua lengan lalu gerak memeluk pelan.", autoPick: true }),
  ex({ id: "Incline_Push-Up", name: "Push-Up Incline", muscleGroup: "chest", location: "home", equipment: "Kursi/meja", metric: "reps", sets: 3, target: "10-15", defaultValue: 10, restSeconds: 60, tips: "Pilihan paling ramah pemula, badan satu garis lurus.", autoPick: true }),
  ex({ id: "Close-Grip_Push-Up_off_of_a_Dumbbell", name: "Push-Up Genggam Sempit", muscleGroup: "chest", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 60, tips: "Siku menempel badan, dada mendekati pegangan dumbbell.", autoPick: true }),
  ex({ id: "Dumbbell_Bench_Press", name: "Bench Press Dumbbell", muscleGroup: "chest", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Turun ke sisi dada, siku sekitar 45° dari badan.", autoPick: true }),
  ex({ id: "Dumbbell_Flyes", name: "Flyes Dumbbell", muscleGroup: "chest", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Gerak membuka-memeluk, siku sedikit ditekuk sepanjang gerak.", autoPick: true }),
  ex({ id: "Dumbbell_Floor_Press", name: "Floor Press Dumbbell", muscleGroup: "chest", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Siku berhenti tepat di lantai sebelum dorong ke atas.", autoPick: true }),
  ex({ id: "Cable_Chest_Press", name: "Chest Press Kabel", muscleGroup: "chest", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Dorong lurus ke depan, dada tegak, kaki stabil.", autoPick: true }),
  ex({ id: "Butterfly", name: "Pec Deck", muscleGroup: "chest", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Sesuaikan seat dulu, gerak peluk memakai seluruh lengan.", autoPick: true }),
  ex({ id: "Machine_Bench_Press", name: "Bench Press Mesin", muscleGroup: "chest", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Palang menyentuh dada ringan lalu dorong penuh.", autoPick: true }),
  ex({ id: "Cable_Crossover", name: "Cable Crossover", muscleGroup: "chest", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Boleh saling menyilang sedikit di akhir gerak.", autoPick: true }),
  ex({ id: "Barbell_Bench_Press_-_Medium_Grip", name: "Bench Press Barbel", muscleGroup: "chest", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10", defaultValue: 8, restSeconds: 90, tips: "Butuh spotter dan teknik — mulai bar kosong.", autoPick: false }),

  // ── Bahu ─────────────────────────────────────────────────────────────────
  ex({ id: "Dumbbell_Shoulder_Press", name: "Shoulder Press Dumbbell", muscleGroup: "shoulders", location: "both", equipment: "Dumbbell", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Dorong sampai lengan lurus, bahu jangan ikut naik ke telinga.", autoPick: true }),
  ex({ id: "Lateral_Raise_-_With_Bands", name: "Lateral Raise (Pita)", muscleGroup: "shoulders", location: "home", equipment: "Pita elastis", metric: "reps", sets: 3, target: "15-20", defaultValue: 15, restSeconds: 45, tips: "Angkat sampai sejajar bahu, telapak menghadap lantai di puncak.", autoPick: true }),
  ex({ id: "Front_Dumbbell_Raise", name: "Front Raise Dumbbell", muscleGroup: "shoulders", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 45, tips: "Angkat sampai sejajar mata, badan jangan ikut terayun.", autoPick: true }),
  ex({ id: "Alternating_Deltoid_Raise", name: "Deltoid Raise Selang-seling", muscleGroup: "shoulders", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12/sisi", defaultValue: 10, restSeconds: 45, tips: "Kiri-kanan bergantian dengan ritme yang teratur.", autoPick: true }),
  ex({ id: "Arm_Circles", name: "Arm Circles", muscleGroup: "shoulders", location: "home", equipment: "Berat badan", metric: "duration", sets: 3, target: "30-45 dtk", defaultValue: 30, restSeconds: 45, tips: "Lingkaran kecil lalu besar, ganti arah di tengah durasi.", autoPick: true, targetSeconds: 45 }),
  ex({ id: "Cable_Shoulder_Press", name: "Shoulder Press Kabel", muscleGroup: "shoulders", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Dorong dari posisi dekat dada, pergelangan tetap lurus.", autoPick: true }),
  ex({ id: "Machine_Shoulder_Military_Press", name: "Military Press Mesin", muscleGroup: "shoulders", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Sesuaikan seat agar palang sejajar bahu.", autoPick: true }),
  ex({ id: "Cable_Seated_Lateral_Raise", name: "Lateral Raise Kabel Duduk", muscleGroup: "shoulders", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 45, tips: "Gerak kecil, jangan membiarkan beban menjatuhkan lengan.", autoPick: true }),
  ex({ id: "Standing_Military_Press", name: "Military Press Barbel", muscleGroup: "shoulders", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "8-10", defaultValue: 8, restSeconds: 90, tips: "Butuh mobility bahu baik — mulai bar kosong.", autoPick: false }),
  ex({ id: "Upright_Barbell_Row", name: "Upright Row Barbel", muscleGroup: "shoulders", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Rawan mengiritasi bahu bagi pemula — pilih variasi kabel dulu.", autoPick: false }),

  // ── Lengan ───────────────────────────────────────────────────────────────
  ex({ id: "Dumbbell_Alternate_Bicep_Curl", name: "Bicep Curl Dumbbell Selang-seling", muscleGroup: "arms", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12/sisi", defaultValue: 10, restSeconds: 60, tips: "Siku menempel samping badan, jangan berayun dengan badan.", autoPick: true }),
  ex({ id: "Alternate_Hammer_Curl", name: "Hammer Curl Selang-seling", muscleGroup: "arms", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12/sisi", defaultValue: 10, restSeconds: 60, tips: "Genggam netral seperti memegang palu.", autoPick: true }),
  ex({ id: "Concentration_Curls", name: "Concentration Curl", muscleGroup: "arms", location: "home", equipment: "Dumbbell", metric: "reps", sets: 3, target: "10-12/sisi", defaultValue: 10, restSeconds: 60, tips: "Siku bersandar di bagian dalam paha, gerak hanya dari siku.", autoPick: true }),
  ex({ id: "Bench_Dips", name: "Bench Dip", muscleGroup: "arms", location: "home", equipment: "Kursi/bangku", metric: "reps", sets: 3, target: "10-15", defaultValue: 10, restSeconds: 60, tips: "Siku ke belakang, bahu jangan maju ke depan saat turun.", autoPick: true }),
  ex({ id: "Cable_Hammer_Curls_-_Rope_Attachment", name: "Cable Hammer Curl (Tali)", muscleGroup: "arms", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Genggam netral dengan tali, rentang penuh dan terkontrol.", autoPick: true }),
  ex({ id: "Cable_Rope_Overhead_Triceps_Extension", name: "Overhead Triceps Kabel", muscleGroup: "arms", location: "gym", equipment: "Kabel", metric: "reps", sets: 3, target: "12-15", defaultValue: 12, restSeconds: 60, tips: "Siku mengarah ke atas dan tidak ikut membuka saat meluruskan.", autoPick: true }),
  ex({ id: "Dip_Machine", name: "Dip Mesin", muscleGroup: "arms", location: "gym", equipment: "Mesin", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 75, tips: "Varian dip paling aman untuk pemula, mulai dari beban ringan.", autoPick: true }),
  ex({ id: "Barbell_Curl", name: "Barbell Curl", muscleGroup: "arms", location: "gym", equipment: "Barbel", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Punggung lurus, jangan memantulkan badan untuk tenaga ekstra.", autoPick: false }),
  ex({ id: "EZ-Bar_Curl", name: "EZ-Bar Curl", muscleGroup: "arms", location: "gym", equipment: "Barbel EZ", metric: "reps", sets: 3, target: "10-12", defaultValue: 10, restSeconds: 60, tips: "Genggam miring lebih ramah bagi pergelangan tangan.", autoPick: false }),
  ex({ id: "Dips_-_Triceps_Version", name: "Dips Triceps", muscleGroup: "arms", location: "gym", equipment: "Bar paralel", metric: "reps", sets: 3, target: "8-12", defaultValue: 8, restSeconds: 75, tips: "Menahan seluruh beban tubuh — mulai dengan mesin dip dulu.", autoPick: false }),

  // ── Cardio cadangan (tidak dipilih generator) ────────────────────────────
  ex({ id: "Air_Bike", name: "Air Bike", muscleGroup: "core", location: "gym", equipment: "Sepeda angin", metric: "duration", sets: 1, target: "60-90 dtk", defaultValue: 60, restSeconds: 60, tips: "Opsi cardio cadangan di gym, jaga ritme seimbang.", autoPick: false, targetSeconds: 90 }),
];

export const exerciseMap = new Map(EXERCISES.map((e) => [e.id, e]));

/** Selalu cek null — UI wajib punya fallback untuk ID yang tidak dikenal. */
export function getExercise(id: string): Exercise | null {
  return exerciseMap.get(id) ?? null;
}
