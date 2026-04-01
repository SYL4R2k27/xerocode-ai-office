import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";

interface PrivacyPageProps { onBack: () => void; }

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="fixed inset-0 bg-[#0A0A0F] z-50 overflow-y-auto">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors">
          <ChevronLeft size={16} /> Назад
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Политика конфиденциальности</h1>
          <p className="text-white/40 text-sm mb-8">платформы XeroCode</p>
          <p className="text-white/30 text-xs mb-8">Дата публикации: 25 марта 2026 г.</p>
          <div className="space-y-8 text-white/60 text-sm leading-relaxed">
            <section><h2 className="text-white font-semibold text-lg mb-3">1. Какие данные мы собираем</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email и имя при регистрации</li>
                <li>API-ключи для подключения ИИ-моделей (хранятся в зашифрованном виде)</li>
                <li>Данные об использовании: цели, задачи, сообщения</li>
                <li>Техническая информация: IP-адрес, тип браузера</li>
              </ul>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">2. Как мы используем данные</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Для предоставления доступа к Платформе</li>
                <li>Для выполнения запросов к ИИ-моделям</li>
                <li>Для улучшения качества сервиса</li>
                <li>Для коммуникации (уведомления, поддержка)</li>
              </ul>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">3. Как мы защищаем данные</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>API-ключи зашифрованы AES-256 (Fernet)</li>
                <li>Пароли хешируются bcrypt (необратимо)</li>
                <li>JWT токены с ограниченным сроком действия (15 минут + refresh 7 дней)</li>
                <li>HTTPS шифрование всего трафика</li>
                <li>Данные хранятся на серверах в РФ (Yandex Cloud)</li>
              </ul>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">4. Передача данных третьим лицам</h2>
              <p>API-ключи передаются только провайдерам ИИ-моделей для выполнения запросов. Мы не продаём и не передаём персональные данные третьим лицам. Данные могут быть предоставлены по запросу уполномоченных органов РФ в соответствии с законодательством.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">5. Ваши права</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Доступ к своим данным через личный кабинет</li>
                <li>Изменение персональных данных</li>
                <li>Удаление аккаунта и всех связанных данных</li>
                <li>Отзыв согласия на обработку данных</li>
              </ul>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">6. Cookies и хранилище</h2>
              <p>Мы используем localStorage для хранения JWT-токена авторизации. Мы не используем cookies для отслеживания или рекламы.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">7. Контакты</h2>
              <p>По вопросам обработки персональных данных:</p>
              <p className="mt-2">Тирских В.С.</p>
              <p>ИНН: 503015361714</p>
              <p>Сайт: <a href="https://xerocode.space" className="text-purple-400">xerocode.space</a></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
