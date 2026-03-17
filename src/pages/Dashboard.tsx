import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import WebApp from '@twa-dev/sdk';
import { Zap, BookOpen, PlusCircle, Loader2, CreditCard, X, Users, Copy, Share } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const Dashboard: FC = () => {
  const { profile, quizzes, loading, error } = useSupabaseData();
  const [firstName, setFirstName] = useState('Студент');
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (WebApp?.initDataUnsafe?.user?.first_name) {
      setFirstName(WebApp.initDataUnsafe.user.first_name);
    }
  }, []);

  const handleBuyCredits = () => {
    setIsBuyModalOpen(true);
  };

  const getInviteLink = () => {
    const user = WebApp?.initDataUnsafe?.user;
    const userId = user?.id || (import.meta.env.DEV ? 5701645456 : 'error');
    return `https://t.me/VyudAiBot?start=inv_${userId}`;
  };

  const handleCopyLink = () => {
    const link = getInviteLink();
    navigator.clipboard.writeText(link).then(() => {
      WebApp.showAlert("Ссылка скопирована в буфер обмена!");
    }).catch(() => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        WebApp.showAlert("Ссылка скопирована в буфер обмена!");
      } catch (err) {
        console.error('Copy fallback failed', err);
      }
      document.body.removeChild(textArea);
    });
  };

  const handleInviteFriend = () => {
    const inviteLink = getInviteLink();
    const shareText = `Привет! Попробуй VYUD AI — это бот, который за пару секунд превращает любые лекции, видео и PDF в интерактивные курсы с тестами. Зарегистрируйся и получи бонусные кредиты! 🎁`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    
    try {
      WebApp.openTelegramLink(shareUrl);
    } catch (e) {
      window.open(shareUrl, '_blank');
    }
  };

  const executePayment = async (planId: string) => {
    try {
      setIsBuying(true);
      const user = WebApp?.initDataUnsafe?.user;
      const telegram_id = user?.id || (import.meta.env.DEV ? 5701645456 : 0);

      if (!telegram_id) {
        throw new Error('Пожалуйста, откройте приложение внутри Telegram');
      }

      const response = await fetch(`${API_URL}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'x-telegram-init-data': WebApp?.initData || ''
        },
        body: JSON.stringify({
          telegram_id,
          plan_id: planId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const data = await response.json();
      
      if (data.success && data.invoice_link) {
        try {
          // Telegram openInvoice expects just the slug (e.g., $rt4uFUZ10EnPFAAApWZiZdVXbVI) not the full URL
          const invoiceSlug = data.invoice_link.split('/').pop() || data.invoice_link;
          
          if (WebApp?.openInvoice) {
            WebApp.openInvoice(invoiceSlug, (status) => {
              if (status === 'paid') {
                WebApp.showAlert("Оплата успешна! Кредиты будут зачислены через несколько секунд. Обновите страницу.");
                setIsBuyModalOpen(false);
              } else if (status === 'failed') {
                WebApp.showAlert("Оплата не удалась.");
              }
            });
          } else {
             // Fallback for older Telegram clients
             WebApp.openTelegramLink(data.invoice_link);
          }
        } catch (invoiceError: any) {
          WebApp.showAlert(`Ошибка вызова оплаты: ${invoiceError.message}`);
          // Ultimate fallback
          WebApp.openTelegramLink(data.invoice_link);
        }
      }
    } catch (e: any) {
      WebApp.showAlert(`Ошибка: ${e.message}`);
    } finally {
      setIsBuying(false);
    }
  };

  const renderBuyModal = () => {
    if (!isBuyModalOpen) return null;

    const plans = [
      { id: 'credits_10', title: '10 кредитов', price: 50, desc: 'На пару тестов' },
      { id: 'credits_50', title: '50 кредитов', price: 200, desc: 'Оптимальный выбор' },
      { id: 'credits_100', title: '100 кредитов', price: 350, desc: 'Максимум выгоды' },
    ];

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'var(--color-background)', width: '100%',
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          padding: '20px', paddingBottom: '40px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Пополнение кредитов</h2>
            <button onClick={() => setIsBuyModalOpen(false)} style={{ background: 'none', border: 'none', padding: 0 }}>
              <X size={24} color="var(--color-muted)" />
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>
            Выберите пакет для покупки через Telegram Stars ⭐️
          </p>

          {plans.map(plan => (
            <Card key={plan.id} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{plan.title}</h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>{plan.desc}</p>
              </div>
              <Button 
                onClick={() => executePayment(plan.id)} 
                disabled={isBuying}
                style={{ borderRadius: '20px', display: 'flex', gap: '6px' }}
              >
                {plan.price} ⭐️
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  };


  const renderStreakProgress = () => {
    const currentStreak = profile?.current_streak || 0;
    const maxStreak = 5;
    const progress = currentStreak % maxStreak;
    const daysLeft = maxStreak - progress;

    return (
      <Card style={{ padding: '16px', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span style={{ fontWeight: 'bold' }}>Ударный режим: {currentStreak} дней</span>
          </div>
          <span className="text-muted" style={{ fontSize: '12px' }}>
            {progress === 0 && currentStreak > 0 ? 'Бонус получен!' : `Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft > 1 && daysLeft < 5 ? 'дня' : 'дней'}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {[...Array(maxStreak)].map((_, index) => (
            <div 
              key={index}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background: index < progress || (progress === 0 && currentStreak > 0) 
                  ? 'var(--color-danger)' 
                  : 'var(--color-border)',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'right', color: 'var(--color-primary)' }}>
          🎁 +1 бонусный кредит каждые 5 дней!
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p className="text-muted">Загружаем ваши успехи...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
            Привет, {firstName}! 👋
          </h1>
          <p className="text-muted" style={{ fontSize: '14px' }}>Добро пожаловать в VYUD AI.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleBuyCredits} style={{ borderRadius: '20px', padding: '6px 12px' }}>
          <CreditCard size={14} style={{ marginRight: '6px' }} />
          Пополнить
        </Button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        <Card style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <p className="text-muted" style={{ fontSize: '12px', margin: '0 0 4px 0' }}>Доступно</p>
             <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Zap size={24} color="var(--color-primary)" />
               {profile?.credits ?? 0} <span style={{fontSize: '16px', fontWeight: 'normal'}}>кредитов</span>
             </h3>
          </div>
        </Card>
      </div>

      {renderStreakProgress()}

      <Card style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)', color: 'white', border: 'none' }}>
        <CardHeader style={{ marginBottom: '12px' }}>
          <CardTitle style={{ color: 'white' }}>Новый тест</CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.8)' }}>
            Загрузи PDF или текст, и AI создаст для тебя интерактивный курс.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/create')}
            style={{ backgroundColor: 'white', color: 'var(--color-primary)' }} 
            fullWidth
          >
            <PlusCircle size={18} style={{ marginRight: '8px' }} />
            Создать сейчас
          </Button>
        </CardContent>
      </Card>

      <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px dashed var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,75,75,0.1)', padding: '10px', borderRadius: '50%' }}>
            <Users size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Пригласи друга!</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>Дарим +2 кредита тебе и +1 другу</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background)', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <input 
            type="text" 
            value={getInviteLink()} 
            readOnly 
            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--color-text)', outline: 'none' }}
          />
          <button onClick={handleCopyLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--color-primary)' }}>
            <Copy size={16} />
          </button>
        </div>

        <Button fullWidth onClick={handleInviteFriend} style={{ backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', gap: '8px' }}>
          <Share size={16} />
          Переслать в Telegram
        </Button>
      </Card>

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Мои последние тесты</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {quizzes.length > 0 ? quizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              onClick={() => navigate(`/course/${quiz.id}`)}
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
            >
              <div style={{ background: 'var(--color-primary-light)', padding: '10px', borderRadius: '10px' }}>
                <BookOpen size={20} color="var(--color-primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{quiz.title}</h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                  {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </Card>
          )) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
              У вас пока нет созданных тестов.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--color-danger)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
          ⚠️ Ошибка синхронизации: {error}
        </div>
      )}

      {renderBuyModal()}
    </div>
  );
};

export default Dashboard;
