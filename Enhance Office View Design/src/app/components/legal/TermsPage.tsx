import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";

interface TermsPageProps { onBack: () => void; }

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <div className="fixed inset-0 bg-[#0A0A0F] z-50 overflow-y-auto">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors">
          <ChevronLeft size={16} /> Назад
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Публичная оферта</h1>
          <p className="text-white/40 text-sm mb-8">на предоставление доступа к платформе XeroCode</p>
          <p className="text-white/30 text-xs mb-8">Дата публикации: 25 марта 2026 г.</p>
          <div className="space-y-8 text-white/60 text-sm leading-relaxed">
            <section><h2 className="text-white font-semibold text-lg mb-3">1. Общие положения</h2>
              <p>1.1. Настоящая Публичная оферта является официальным предложением Тирских Владимира Сергеевича, ИНН 503015361714, действующего в качестве самозанятого (далее — «Исполнитель»), адресованным любому лицу (далее — «Пользователь»), заключить договор на условиях, изложенных в настоящей Оферте.</p>
              <p className="mt-2">1.2. Платформа XeroCode (далее — «Платформа») — онлайн-сервис оркестрации ИИ-агентов, доступный по адресу https://xerocode.space.</p>
              <p className="mt-2">1.3. Акцептом настоящей Оферты является регистрация на Платформе и/или оплата любого тарифа.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">2. Предмет оферты</h2>
              <p>2.1. Исполнитель предоставляет Пользователю доступ к Платформе для работы с ИИ-моделями в соответствии с выбранным тарифным планом.</p>
              <p className="mt-2">2.2. Платформа является хабом для оркестрации сторонних ИИ-моделей. Исполнитель не является разработчиком ИИ-моделей и не несёт ответственности за качество и содержание ответов моделей.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">3. Тарифные планы и оплата</h2>
              <p>3.1. Актуальные тарифы размещены на странице https://xerocode.space (раздел «Тарифы»).</p>
              <p className="mt-2">3.2. Тариф START: единоразовый платёж. Тарифы PRO, PRO PLUS, ULTIMA: ежемесячная подписка с автопродлением.</p>
              <p className="mt-2">3.3. Тарифы CORPORATE: оплата по счёту для юридических лиц с НДС.</p>
              <p className="mt-2">3.4. Триальный период: 3 (три) дня бесплатного доступа для тарифов START, PRO и PRO PLUS.</p>
              <p className="mt-2">3.5. Оплата производится через платёжный сервис ЮKassa. Способы оплаты: банковская карта, СБП, МИР.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">4. Права и обязанности сторон</h2>
              <p className="font-medium text-white/80">4.1. Исполнитель обязуется:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>обеспечивать работоспособность Платформы (uptime не менее 99%);</li>
                <li>защищать персональные данные Пользователя;</li>
                <li>шифровать API-ключи Пользователя (AES-256);</li>
                <li>не передавать данные Пользователя третьим лицам.</li>
              </ul>
              <p className="font-medium text-white/80 mt-4">4.2. Пользователь обязуется:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>предоставлять достоверные данные при регистрации;</li>
                <li>не использовать Платформу для незаконной деятельности;</li>
                <li>не пытаться получить несанкционированный доступ к данным других пользователей;</li>
                <li>соблюдать условия использования сторонних ИИ-моделей.</li>
              </ul>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">5. Ответственность</h2>
              <p>5.1. Исполнитель не несёт ответственности за содержание, точность и качество ответов ИИ-моделей.</p>
              <p className="mt-2">5.2. Исполнитель не несёт ответственности за убытки, возникшие в результате использования результатов работы ИИ-моделей.</p>
              <p className="mt-2">5.3. Максимальная ответственность Исполнителя ограничена суммой, уплаченной Пользователем за последний оплаченный месяц.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">6. Персональные данные</h2>
              <p>6.1. Обработка персональных данных осуществляется в соответствии с Федеральным законом №152-ФЗ «О персональных данных».</p>
              <p className="mt-2">6.2. Исполнитель собирает: email, имя, данные об использовании Платформы.</p>
              <p className="mt-2">6.3. API-ключи пользователя хранятся в зашифрованном виде (AES-256) и используются исключительно для выполнения запросов к ИИ-моделям.</p>
              <p className="mt-2">6.4. Пользователь имеет право запросить удаление своих данных.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">7. Отказ от подписки</h2>
              <p>7.1. Пользователь может отказаться от подписки в любой момент через личный кабинет.</p>
              <p className="mt-2">7.2. При отказе доступ сохраняется до конца оплаченного периода.</p>
              <p className="mt-2">7.3. Возврат средств за неиспользованный период не производится, за исключением случаев, предусмотренных законодательством РФ.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">8. Интеллектуальная собственность</h2>
              <p>8.1. Все права на Платформу, включая программный код, дизайн и торговое наименование «XeroCode», принадлежат Исполнителю.</p>
              <p className="mt-2">8.2. Результаты работы ИИ-моделей, созданные Пользователем через Платформу, принадлежат Пользователю.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">9. Изменение условий</h2>
              <p>9.1. Исполнитель вправе изменять условия Оферты, уведомив Пользователей по email не менее чем за 14 дней.</p>
            </section>
            <section><h2 className="text-white font-semibold text-lg mb-3">10. Реквизиты исполнителя</h2>
              <p>Тирских Владимир Сергеевич</p>
              <p>ИНН: 503015361714</p>
              <p>Статус: Самозанятый</p>
              <p>Email: <a href="mailto:support@xerocode.space" className="text-purple-400">support@xerocode.space</a></p>
              <p>Телефон: <a href="tel:+79166859658" className="text-purple-400">+7 (916) 685-96-58</a></p>
              <p>Сайт: <a href="https://xerocode.space" className="text-purple-400">xerocode.space</a></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
