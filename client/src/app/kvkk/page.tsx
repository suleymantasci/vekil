export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            KVKK Aydınlatma Metni
          </h1>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Veri Sorumlusu</h2>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; 
                veri sorumlusu olarak Vekil tarafından aşağıda açıklanan kapsamda işlenebilecektir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Kişisel Verilerin İşlenme Amacı</h2>
              <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Apartman/site yönetimi hizmetlerinin sunulması</li>
                <li>Kimlik doğrulama ve güvenlik</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>İletişim ve bildirim faaliyetleri</li>
                <li>Hizmet kalitesinin artırılması</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. İşlenen Kişisel Veriler</h2>
              <p>İşlenen kişisel veri kategorileri:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kimlik bilgileri (ad, soyad)</li>
                <li>İletişim bilgileri (e-posta, telefon)</li>
                <li>Konut bilgileri (daire numarası, blok)</li>
                <li>Güvenlik verileri (giriş-çıkış logları)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Kişisel Verilerin Aktarımı</h2>
              <p>
                Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda, 
                yasal zorunluluklar çerçevesinde yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Veri İşleme Yöntemi ve Hukuki Sebebi</h2>
              <p>
                Kişisel verileriniz, otomatik veya otomatik olmayan yöntemlerle toplanmakta olup, 
                KVKK'nın 5. ve 6. maddelerinde belirtilen veri işleme şartları ve amaçları kapsamında 
                işlenmektedir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Veri Sahibinin Hakları</h2>
              <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                <li>Silinmesini veya yok edilmesini isteme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. İletişim</h2>
              <p>
                KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki iletişim bilgilerinden 
                bize ulaşabilirsiniz:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p><strong>E-posta:</strong> kvkk@vekil.tasci.cloud</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/register"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Kayıt Sayfasına Dön
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}