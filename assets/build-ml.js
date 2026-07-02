/* build-ml.js — shared chrome translations for Digital Citizenship Breakouts.
   COMMON holds the 21 chrome/feedback keys that are identical across every
   activity, in 6 non-English languages (es, vi, ar, hi, ur, zh). Generated from the
   verified Grade 3 locale by scripts/gen-common.js — do not hand-edit; re-run the
   generator instead. Merge into a new locale's UI[es..zh] before authoring the
   per-grade keys (header.eyebrow + the 10 breakout-specific chrome strings):

     const {COMMON, mergeCommon} = require('./build-ml.js');
     mergeCommon(B);   // fills UI[es..zh] with the shared keys

   Non-English text is AI-seeded and pending native-speaker review. */
const COMMON = {
 "sect.clues": {
  "es": "🔍 Las pistas",
  "vi": "🔍 Các manh mối",
  "ar": "🔍 الأدلّة",
  "hi": "🔍 सुराग",
  "ur": "🔍 سراغ",
  "zh": "🔍 线索"
 },
 "sect.cluesHint": {
  "es": "Toca cada pista para leerla. (Puedes volver a abrirlas cuando quieras.)",
  "vi": "Chạm vào mỗi manh mối để đọc. (Bạn có thể mở lại bất cứ lúc nào.)",
  "ar": "انقر كل دليل لقراءته. (يمكنك فتحه مجددًا في أي وقت.)",
  "hi": "हर सुराग पढ़ने के लिए उस पर टैप करो। (इन्हें कभी भी दोबारा खोल सकते हो।)",
  "ur": "ہر سراغ پڑھنے کے لیے اس پر ٹیپ کریں۔ (انہیں کبھی بھی دوبارہ کھول سکتے ہیں۔)",
  "zh": "点按每条线索来阅读。（你可以随时重新打开。）"
 },
 "sect.locks": {
  "es": "🔒 Los candados",
  "vi": "🔒 Các ổ khóa",
  "ar": "🔒 الأقفال",
  "hi": "🔒 ताले",
  "ur": "🔒 تالے",
  "zh": "🔒 锁"
 },
 "sect.locksHint": {
  "es": "Resuelve cada candado usando las pistas de arriba.",
  "vi": "Giải mỗi ổ khóa bằng các manh mối ở trên.",
  "ar": "حلّ كل قفل مستعينًا بالأدلّة أعلاه.",
  "hi": "ऊपर के सुरागों की मदद से हर ताला हल करो।",
  "ur": "اوپر دیے گئے سراغوں کی مدد سے ہر تالا حل کریں۔",
  "zh": "用上面的线索解开每一把锁。"
 },
 "crumb.teacher": {
  "es": "‹ Guía del docente",
  "vi": "‹ Trang giáo viên",
  "ar": "‹ صفحة المعلّم",
  "hi": "‹ शिक्षक पृष्ठ",
  "ur": "‹ استاد کا صفحہ",
  "zh": "‹ 教师页面"
 },
 "ui.reset": {
  "es": "↺ Reiniciar",
  "vi": "↺ Đặt lại",
  "ar": "↺ إعادة",
  "hi": "↺ रीसेट",
  "ur": "↺ دوبارہ",
  "zh": "↺ 重置"
 },
 "ui.check": {
  "es": "Comprobar",
  "vi": "Kiểm tra",
  "ar": "تحقّق",
  "hi": "जाँचें",
  "ur": "جانچیں",
  "zh": "检查"
 },
 "ui.gotit": {
  "es": "Entendido",
  "vi": "Đã hiểu",
  "ar": "حسنًا",
  "hi": "समझ गया",
  "ur": "ٹھیک ہے",
  "zh": "知道了"
 },
 "ui.playagain": {
  "es": "Jugar de nuevo",
  "vi": "Chơi lại",
  "ar": "العب مجددًا",
  "hi": "फिर से खेलें",
  "ur": "دوبارہ کھیلیں",
  "zh": "再玩一次"
 },
 "ui.solved": {
  "es": "🔓 ¡Resuelto!",
  "vi": "🔓 Đã giải!",
  "ar": "🔓 تم الحل!",
  "hi": "🔓 हल हो गया!",
  "ur": "🔓 حل ہو گیا!",
  "zh": "🔓 已解开！"
 },
 "ui.pcount": {
  "es": "{n} de {total} candados abiertos",
  "vi": "Đã mở {n}/{total} ổ khóa",
  "ar": "{n} من {total} أقفال مفتوحة",
  "hi": "{total} में से {n} ताले खुले",
  "ur": "{total} میں سے {n} تالے کھلے",
  "zh": "已打开 {n}/{total} 把锁"
 },
 "ui.wordph": {
  "es": "Escribe tu respuesta",
  "vi": "Nhập câu trả lời của bạn",
  "ar": "اكتب إجابتك",
  "hi": "अपना उत्तर लिखें",
  "ur": "اپنا جواب لکھیں",
  "zh": "输入你的答案"
 },
 "ui.clear": {
  "es": "limpiar",
  "vi": "xóa",
  "ar": "مسح",
  "hi": "साफ़",
  "ur": "صاف",
  "zh": "清除"
 },
 "fb.digit": {
  "es": "Ese número no coincide con las pistas. Revisa de nuevo.",
  "vi": "Con số đó không khớp với manh mối. Hãy kiểm tra lại.",
  "ar": "هذا الرقم لا يطابق الأدلّة. تحقّق مرة أخرى.",
  "hi": "यह संख्या सुरागों से मेल नहीं खाती। फिर से जाँचें।",
  "ur": "یہ عدد سراغوں سے میل نہیں کھاتا۔ دوبارہ جانچیں۔",
  "zh": "这个数字与线索不符。请再检查。"
 },
 "fb.word": {
  "es": "Busca en las pistas la palabra que encaja.",
  "vi": "Hãy tìm trong manh mối từ phù hợp.",
  "ar": "ابحث في الأدلّة عن الكلمة المناسبة.",
  "hi": "सही शब्द के लिए सुरागों को देखें।",
  "ur": "صحیح لفظ کے لیے سراغ دیکھیں۔",
  "zh": "在线索中找出合适的词。"
 },
 "fb.mc": {
  "es": "Esa opción no está respaldada por las pistas. Mira otra vez.",
  "vi": "Lựa chọn đó không được manh mối chứng minh. Hãy xem lại.",
  "ar": "هذا الخيار لا تدعمه الأدلّة. انظر مرة أخرى.",
  "hi": "यह विकल्प सुरागों से समर्थित नहीं है। फिर से देखें।",
  "ur": "یہ انتخاب سراغوں سے ثابت نہیں ہوتا۔ دوبارہ دیکھیں۔",
  "zh": "这个选项没有线索支持。请再看看。"
 },
 "fb.multiExtra": {
  "es": "Una de tus elecciones no es evidencia sólida. Sólida significa hechos que las pistas realmente prueban.",
  "vi": "Một lựa chọn không phải bằng chứng vững chắc. Vững chắc nghĩa là sự thật mà manh mối thực sự chứng minh.",
  "ar": "أحد اختياراتك ليس دليلاً قويًا. القويّ يعني حقائق تثبتها الأدلّة فعلاً.",
  "hi": "आपका एक चुनाव मज़बूत प्रमाण नहीं है। मज़बूत यानी वे तथ्य जो सुराग सचमुच साबित करते हैं।",
  "ur": "آپ کا ایک انتخاب مضبوط ثبوت نہیں ہے۔ مضبوط یعنی وہ حقائق جو سراغ واقعی ثابت کرتے ہیں۔",
  "zh": "你的一个选择不是有力证据。有力是指线索真正证明的事实。"
 },
 "fb.multiMissing": {
  "es": "Te falta una prueba sólida. Encuéntralas todas.",
  "vi": "Bạn còn thiếu một bằng chứng vững chắc. Hãy tìm hết.",
  "ar": "ينقصك دليل قويّ. اعثر عليها كلّها.",
  "hi": "आपसे एक मज़बूत प्रमाण छूट रहा है। सभी को खोजें।",
  "ur": "آپ سے ایک مضبوط ثبوت رہ گیا ہے۔ سب تلاش کریں۔",
  "zh": "你还缺一个有力证据。把它们都找齐。"
 },
 "fb.seq": {
  "es": "Ese orden no coincide con las pistas. Inténtalo de nuevo.",
  "vi": "Thứ tự đó không khớp với manh mối. Hãy thử lại.",
  "ar": "هذا الترتيب لا يطابق الأدلّة. حاول مرة أخرى.",
  "hi": "यह क्रम सुरागों से मेल नहीं खाता। फिर से कोशिश करें।",
  "ur": "یہ ترتیب سراغوں سے میل نہیں کھاتی۔ دوبارہ کوشش کریں۔",
  "zh": "这个顺序与线索不符。请再试一次。"
 },
 "footer.privacy": {
  "es": "Privacidad y cumplimiento",
  "vi": "Quyền riêng tư & tuân thủ",
  "ar": "الخصوصية والامتثال",
  "hi": "गोपनीयता और अनुपालन",
  "ur": "رازداری اور تعمیل",
  "zh": "隐私与合规"
 },
 "footer.disclaimer": {
  "es": "Las traducciones son generadas por IA y están pendientes de revisión por hablantes nativos.",
  "vi": "Bản dịch do AI khởi tạo và đang chờ người bản ngữ rà soát.",
  "ar": "التّرجمات مُولّدة بالذكاء الاصطناعي وبانتظار مراجعة متحدّث أصلي.",
  "hi": "अनुवाद AI द्वारा तैयार हैं और मातृभाषी समीक्षा की प्रतीक्षा में हैं।",
  "ur": "تراجم AI سے تیار کیے گئے ہیں اور مقامی بولنے والے کی نظرِ ثانی کے منتظر ہیں۔",
  "zh": "译文由 AI 生成，尚待母语者审校。"
 }
};

const LANGS = ["es","vi","ar","hi","ur","zh"];

function mergeCommon(B) {
  for (const lg of LANGS)
    for (const k of Object.keys(COMMON))
      B.UI[lg][k] = COMMON[k][lg];
  return B;
}

module.exports = { COMMON, LANGS, mergeCommon };
