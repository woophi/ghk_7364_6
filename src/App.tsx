import { AmountInput } from '@alfalab/core-components/amount-input/cssm';
import { BottomSheet } from '@alfalab/core-components/bottom-sheet/cssm';
import { Button } from '@alfalab/core-components/button/cssm';
import { Collapse } from '@alfalab/core-components/collapse/cssm';
import { Divider } from '@alfalab/core-components/divider/cssm';
import { Gap } from '@alfalab/core-components/gap/cssm';
import { SuperEllipse } from '@alfalab/core-components/icon-view/cssm/super-ellipse';
import { Spinner } from '@alfalab/core-components/spinner/cssm';
import { Steps } from '@alfalab/core-components/steps/cssm';
import { Tag } from '@alfalab/core-components/tag/cssm';
import { Typography } from '@alfalab/core-components/typography/cssm';
import { CheckmarkMIcon } from '@alfalab/icons-glyph/CheckmarkMIcon';
import { ChevronDownMIcon } from '@alfalab/icons-glyph/ChevronDownMIcon';
import { ChevronUpMIcon } from '@alfalab/icons-glyph/ChevronUpMIcon';
import { DocumentLinesLineMIcon } from '@alfalab/icons-glyph/DocumentLinesLineMIcon';
import { PercentMIcon } from '@alfalab/icons-glyph/PercentMIcon';
import { QuestionCircleLineMIcon } from '@alfalab/icons-glyph/QuestionCircleLineMIcon';
import { Fragment, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import percentImg from './assets/percent.png';
import rubIcon from './assets/rub.png';
import shieldImg from './assets/shield.png';
import { CheckIcon } from './CheckIcon';
import { useTimeout } from './hooks/useTimeout';
import { LS, LSKeys } from './ls';
import { appSt } from './style.css';
import { ThxLayout } from './thx/ThxLayout';
import {
  calcIncomeByMonths,
  calculateInvestmentIncome,
  calculateStateSupport,
  calculateTaxRefund,
  randomDocNumber,
  randomEmailRu,
  randomOtpCode,
} from './utils/calc';
import { sendDataToGA } from './utils/events';

const hiw = [
  {
    title: 'Оформите ПДС в приложении',
    desc: 'На сумму от 30 000 ₽ — это ваш первый взнос в программу, дальше любая сумма',
  },
  {
    title: 'Откройте Альфа‑Вклад',
    desc: 'Сумма не больше первого взноса в ПДС',
  },
  {
    title: 'Получайте больше дохода',
    desc: 'По вкладу с повышенной ставкой и от инвестиций в ПДС',
  },
];

const faqs = [
  {
    question: 'Что такое ПДС?',
    answers: [
      'Программа долгосрочных сбережений (ПДС) — это накопительный продукт с финансовой поддержкой государства. С ним вы можете накопить на долгосрочные цели или создать пенсионный капитал.',
    ],
  },
  {
    question: 'Сколько денег нужно вносить на ПДС-счёт?',
    answers: [
      'Чтобы государство софинансировало ваши взносы, пополнять счёт нужно на сумму не менее 2000 ₽ в год.',
      'Однако вы можете отталкиваться от вашего дохода и пополнять счёт на любую другую сумму.',
      'Деньги можно внести один раз за год или вносить несколькими платежами в течение года. Чтобы не забывать пополнять счёт, подключите автоплатёж.',
    ],
  },
  {
    question: 'На какой срок открывается ПДС?',
    answers: [
      'ПДС открывается на 15 лет или до достижения установленного возраста:',
      '55 лет — для женщин',
      '60 лет — для мужчин',
    ],
  },
  {
    question: 'Сколько лет действует софинансирование от государства?',
    answers: ['Софинансирование от государства предоставляется в течение 10 лет с момента начала участия в программе'],
  },
  {
    question: 'Как начисляются проценты по вкладу?',
    answers: [
      'Проценты начисляются ежемесячно и капитализируются — каждый месяц они прибавляются к сумме вклада, и в следующем месяце доход начисляется уже на увеличенную сумму',
    ],
  },
  {
    question: 'Кому доступна повышенная ставка по вкладу?',
    answers: [
      'Повышенная ставка доступна клиентам, которые впервые открывают ПДС. Оформить можно только один вклад с повышенной ставкой',
    ],
  },
];

const investPeriods = [
  {
    title: '1 месяц',
    value: 1,
    vkladPercent: 0.3603,
  },
  {
    title: '2 месяца',
    value: 2,
    vkladPercent: 0.2701,
  },
  {
    title: '3 месяца',
    value: 3,
    vkladPercent: 0.21,
  },
  {
    title: '6 месяцев',
    value: 6,
    vkladPercent: 0.1802,
  },
  {
    title: '12 месяцев',
    value: 12,
    vkladPercent: 0.15,
  },
];

const btns = [
  {
    title: 'Какие условия',
    icon: <PercentMIcon color="#000000" />,
    link: 'conditions' as const,
  },
  {
    title: 'Как оформить',
    icon: <DocumentLinesLineMIcon color="#000000" />,
    link: 'how-to' as const,
  },
  {
    title: 'Вопросы и ответы',
    icon: <QuestionCircleLineMIcon color="#000000" />,
    link: 'questions' as const,
  },
];

const MIN_INVEST_SUM = 30_000;

const docNumberPds = randomDocNumber();
const docNumberVklad = randomDocNumber();
const emailRu = randomEmailRu();

export const App = () => {
  const [thxShow, setThx] = useState(LS.getItem(LSKeys.ShowThx, false));
  const [showBs, setShowBs] = useState<'conditions' | 'how-to' | 'questions' | ''>('');
  const [collapsedItems, setCollapsedItem] = useState<string[]>([]);
  const [steps, setSteps] = useState<
    'init' | 'step1' | 'step2' | 'step-confirm3' | 'step-confirmed3' | 'step3' | 'step4' | 'step5'
  >('init');
  const [pdsSum, setPdsSum] = useState(MIN_INVEST_SUM);
  const [vkladSum, setVkladSum] = useState(MIN_INVEST_SUM);
  const [error, setError] = useState('');
  const [invetstPeriod, setInvestPeriod] = useState<number>(1);
  const [otpCode, setOtpCode] = useState('');

  const shouldErrorInvestSum = !pdsSum || pdsSum < MIN_INVEST_SUM;
  const shouldErrorVkladSum = vkladSum !== pdsSum;
  const investPeriodData = investPeriods.find(period => period.value === invetstPeriod) ?? investPeriods[0];
  const taxRefund = calculateTaxRefund(pdsSum);
  const govCharity = calculateStateSupport(pdsSum);
  const investmentsIncome = calculateInvestmentIncome(pdsSum, 0);
  const total = investmentsIncome + govCharity + taxRefund;

  const withOtpCode = steps === 'step-confirm3' || steps === 'step5';

  useTimeout(
    () => {
      setOtpCode(randomOtpCode());
    },
    withOtpCode ? 2500 : null,
  );
  useTimeout(
    () => {
      if (steps === 'step-confirm3') {
        window.gtag('event', '7364_sms_pds', { var: 'var6' });
        sendDataToGA({
          sum: pdsSum,
          product_type: 'ПДС',
        });
        setSteps('step-confirmed3');
      }
      if (steps === 'step5') {
        window.gtag('event', '7364_sms_deposit', { var: 'var6' });
        submit();
      }
      setOtpCode('');
    },
    withOtpCode ? 3500 : null,
  );

  useEffect(() => {
    if (!LS.getItem(LSKeys.UserId, null)) {
      LS.setItem(LSKeys.UserId, Date.now());
    }
  }, []);

  const submit = () => {
    sendDataToGA({
      sum: vkladSum,
      product_type: 'Вклад',
    });
    setThx(true);
    LS.setItem(LSKeys.ShowThx, true);
  };

  const goToStep2 = () => {
    window.gtag('event', '7364_open_pds', { var: 'var6' });
    if (shouldErrorInvestSum) {
      setError('Минимальная сумма — 60 000 ₽');
      return;
    }

    setSteps('step2');
  };

  const goToStep4 = () => {
    window.gtag('event', '7364_click_open_deposit_var3');
    if (shouldErrorVkladSum) {
      setError(`Сумма вклада должна быть равна сумме ПДС — ${pdsSum.toLocaleString('ru-RU')} ₽`);
      return;
    }

    setSteps('step4');
  };

  const goToConfirmStep3 = () => {
    window.gtag('event', '7364_pay_pds', { var: 'var6' });
    setSteps('step-confirm3');
  };

  const handleChangeInput = (_: React.ChangeEvent<HTMLInputElement> | null, { value }: { value: number | null }) => {
    if (error) {
      setError('');
    }
    if (steps === 'step3') {
      setVkladSum(value ?? 0);
    } else {
      setPdsSum(value ?? 0);
    }
  };

  if (thxShow) {
    return <ThxLayout />;
  }

  if (steps === 'step4') {
    return (
      <>
        <div className={appSt.container}>
          <Typography.Text view="caps" style={{ marginTop: '1rem' }}>
            ШАГ 2 из 2
          </Typography.Text>

          <Typography.TitleResponsive tag="h1" view="large" font="system" weight="semibold">
            Всё проверьте, и можно оплатить и открыть вклад
          </Typography.TitleResponsive>

          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Номер договора
            </Typography.Text>
            <Typography.Text view="primary-medium">№{docNumberVklad}</Typography.Text>
          </div>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Сумма взноса
            </Typography.Text>
            <Typography.Text view="primary-medium">{vkladSum.toLocaleString('ru-RU')} ₽</Typography.Text>
          </div>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Процент по вкладу
            </Typography.Text>
            <Typography.Text view="primary-medium">
              {(investPeriodData.vkladPercent * 100).toLocaleString('ru-RU')}%
            </Typography.Text>
          </div>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Срок вклада
            </Typography.Text>
            <Typography.Text view="primary-medium">{investPeriodData.title}</Typography.Text>
          </div>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Email
            </Typography.Text>
            <Typography.Text view="primary-medium">{emailRu}</Typography.Text>
          </div>
        </div>

        <Gap size={128} />

        <div className={appSt.bottomBtn()}>
          <Button
            block
            view="primary"
            onClick={() => {
              window.gtag('event', '7364_click_pay_deposit_var3');
              setSteps('step5');
            }}
          >
            Оплатить
          </Button>
        </div>
      </>
    );
  }

  if (steps === 'step3') {
    return (
      <>
        <div className={appSt.container}>
          <Typography.TitleResponsive style={{ marginTop: '1rem' }} tag="h1" view="large" font="system" weight="semibold">
            Повышенная ставка по вкладу при подключении ПДС
          </Typography.TitleResponsive>

          <div className={appSt.btnsContainer}>
            {btns.map(btn => (
              <div
                key={btn.title}
                className={appSt.btnContainer}
                onClick={() => {
                  setShowBs(btn.link);
                }}
              >
                <SuperEllipse>{btn.icon}</SuperEllipse>
                <Typography.Text view="primary-small">{btn.title}</Typography.Text>
              </div>
            ))}
          </div>

          <div />

          <Typography.Text view="caps" style={{ marginTop: '1rem' }}>
            ШАГ 1 из 2
          </Typography.Text>

          <Typography.TitleResponsive tag="h1" view="large" font="system" weight="semibold">
            Открытие вклада
          </Typography.TitleResponsive>

          <div style={{ marginTop: '12px' }}>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Счёт списания
            </Typography.Text>

            <div className={appSt.bannerAccount}>
              <img src={rubIcon} width={48} height={48} alt="rubIcon" />

              <Typography.Text view="primary-small" weight="medium">
                Текущий счёт
              </Typography.Text>
            </div>
          </div>

          <AmountInput
            label="Cумма инвестиций"
            labelView="outer"
            value={vkladSum}
            error={error}
            onChange={handleChangeInput}
            block
            minority={1}
            bold={false}
            min={MIN_INVEST_SUM}
            hint={`Сумма вклада должна быть равна сумме ПДС — ${pdsSum.toLocaleString('ru-RU')} ₽`}
          />
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              На какой срок открыть вклад
            </Typography.Text>
          </div>
        </div>

        <div>
          <Swiper style={{ margin: '-8px 0 1rem 1rem' }} spaceBetween={12} slidesPerView="auto">
            {investPeriods.map(({ title, value }) => (
              <SwiperSlide key={value} className={appSt.swSlide}>
                <Tag
                  view="filled"
                  size="xxs"
                  shape="rectangular"
                  checked={invetstPeriod === value}
                  onClick={() => setInvestPeriod(value)}
                >
                  {title}
                </Tag>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className={appSt.box2}>
          <Typography.TitleResponsive tag="h2" view="xsmall" font="system" weight="semibold">
            Ваша выгода
          </Typography.TitleResponsive>

          <div className={appSt.box3}>
            <div className={appSt.rowSb}>
              <Typography.Text view="primary-small" color="secondary">
                Ставка
              </Typography.Text>
              <Typography.Text view="primary-small">
                {(investPeriodData.vkladPercent * 100).toLocaleString('ru-RU')}% годовых
              </Typography.Text>
            </div>
            <div className={appSt.rowSb}>
              <Typography.Text view="primary-small" color="secondary">
                Срок
              </Typography.Text>
              <Typography.Text view="primary-small">{investPeriodData.title}</Typography.Text>
            </div>
            <Divider />

            <div className={appSt.rowSb}>
              <Typography.Text view="primary-small" color="secondary">
                Доход за срок
              </Typography.Text>
              <Typography.Text view="primary-medium" weight="medium">
                {calcIncomeByMonths(vkladSum, investPeriodData.vkladPercent, invetstPeriod).toLocaleString('ru-RU')} ₽
              </Typography.Text>
            </div>
          </div>
        </div>

        <Gap size={128} />

        <div className={appSt.bottomBtn()}>
          <Button block view="primary" onClick={goToStep4}>
            Открыть
          </Button>
        </div>
        <BottomSheetsInfo
          collapsedItems={collapsedItems}
          setCollapsedItem={setCollapsedItem}
          setShowBs={setShowBs}
          showBs={showBs}
        />
      </>
    );
  }

  if (steps === 'step-confirmed3') {
    return (
      <div style={{ backgroundColor: '#494949', minHeight: '100dvh' }}>
        <div className={appSt.container}>
          <div>
            <Typography.Text
              view="component-primary"
              color="primary-inverted"
              style={{ textAlign: 'center', marginTop: '1rem' }}
              tag="p"
              defaultMargins={false}
            >
              Операция выполнена
            </Typography.Text>
            <Typography.Text
              view="secondary-large"
              color="secondary-inverted"
              style={{ textAlign: 'center' }}
              tag="p"
              defaultMargins={false}
            >
              Текущий счёт
            </Typography.Text>
          </div>

          <div className={appSt.box4}>
            <div style={{ marginTop: '-3rem' }}>
              <SuperEllipse size={80} backgroundColor="#0CC44D">
                <CheckmarkMIcon width={30} height={30} color="#fff" />
              </SuperEllipse>
            </div>
            <Typography.TitleResponsive
              tag="h1"
              view="medium"
              font="system"
              weight="semibold"
              style={{ textAlign: 'center', marginTop: '1rem' }}
            >
              {pdsSum.toLocaleString('ru-RU')} ₽
            </Typography.TitleResponsive>
            <Typography.Text view="primary-small">Деньги зарезервированы и спишутся после открытия вклада</Typography.Text>
            <Typography.Text view="primary-small" color="secondary">
              Договор №{docNumberPds}
            </Typography.Text>
          </div>
        </div>

        <Gap size={128} />

        <div className={appSt.bottomBtn({ confirmed: true })}>
          <Button
            block
            view="secondary"
            onClick={() => {
              window.gtag('event', '7364_open_deposit_after_pds', { var: 'var6' });
              setSteps('step3');
            }}
            style={{ backgroundColor: '#FFFFFF24', color: '#fff' }}
          >
            Открыть вклад
          </Button>
        </div>
      </div>
    );
  }

  if (withOtpCode) {
    return (
      <div className={appSt.container}>
        <Typography.TitleResponsive
          tag="h1"
          view="xsmall"
          font="system"
          weight="semibold"
          style={{ textAlign: 'center', marginTop: '1rem' }}
        >
          Введите код из сообщения
        </Typography.TitleResponsive>

        <div className={appSt.codeInput}>
          <div className={appSt.codeInputItem}>{otpCode[0]}</div>
          <div className={appSt.codeInputItem}>{otpCode[1]}</div>
          <div className={appSt.codeInputItem}>{otpCode[2]}</div>
          <div className={appSt.codeInputItem}>{otpCode[3]}</div>
        </div>
        <Typography.Text view="secondary-large" color="secondary" style={{ textAlign: 'center' }}>
          Код отправлен на +7 ••• ••• •• •8
        </Typography.Text>
        <Spinner style={{ margin: 'auto' }} visible preset={24} />
      </div>
    );
  }

  if (steps === 'step2') {
    return (
      <>
        <div className={appSt.container}>
          <Typography.Text view="caps" style={{ marginTop: '1rem' }}>
            ШАГ 2 из 2
          </Typography.Text>

          <Typography.TitleResponsive tag="h1" view="large" font="system" weight="semibold">
            Всё проверьте, и можно оплатить и открыть ПДС
          </Typography.TitleResponsive>

          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Номер договора
            </Typography.Text>
            <Typography.Text view="primary-medium">№{docNumberPds}</Typography.Text>
          </div>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Сумма взноса
            </Typography.Text>
            <Typography.Text view="primary-medium">{pdsSum.toLocaleString('ru-RU')} ₽</Typography.Text>
          </div>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Email
            </Typography.Text>
            <Typography.Text view="primary-medium">{emailRu}</Typography.Text>
          </div>
        </div>

        <Gap size={128} />

        <div className={appSt.bottomBtn()}>
          <Typography.Text view="primary-small" color="secondary" style={{ textAlign: 'center' }}>
            После откроем вклад на тех же условиях
          </Typography.Text>
          <Button block view="primary" onClick={goToConfirmStep3}>
            Оплатить ПДС
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={appSt.container}>
        <Typography.TitleResponsive style={{ marginTop: '1rem' }} tag="h1" view="large" font="system" weight="semibold">
          Повышенная ставка по вкладу при подключении ПДС
        </Typography.TitleResponsive>

        <div className={appSt.btnsContainer}>
          {btns.map(btn => (
            <div
              key={btn.title}
              className={appSt.btnContainer}
              onClick={() => {
                setShowBs(btn.link);
              }}
            >
              <SuperEllipse>{btn.icon}</SuperEllipse>
              <Typography.Text view="primary-small">{btn.title}</Typography.Text>
            </div>
          ))}
        </div>

        <div />

        <Typography.Text view="caps">ШАГ 1 из 2</Typography.Text>

        <Typography.TitleResponsive tag="h1" view="large" font="system" weight="semibold">
          Открытие ПДС
        </Typography.TitleResponsive>

        <Typography.Text view="primary-medium" color="secondary">
          Далее вы подтвердите открытие ПДС и вклада
        </Typography.Text>

        <div style={{ marginTop: '12px' }}>
          <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
            Счёт списания
          </Typography.Text>

          <div className={appSt.bannerAccount}>
            <img src={rubIcon} width={48} height={48} alt="rubIcon" />

            <Typography.Text view="primary-small" weight="medium">
              Текущий счёт
            </Typography.Text>
          </div>
        </div>

        <div>
          <AmountInput
            label="Cумма инвестиций"
            labelView="outer"
            value={vkladSum}
            error={error}
            onChange={handleChangeInput}
            block
            minority={1}
            bold={false}
            min={MIN_INVEST_SUM}
            hint={`Сумма вклада должна быть равна сумме ПДС — ${pdsSum.toLocaleString('ru-RU')} ₽`}
          />
        </div>

        <div>
          <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
            На какой срок открыть вклад
          </Typography.Text>
        </div>
      </div>

      <div>
        <Swiper style={{ margin: '-8px 0 1rem 1rem' }} spaceBetween={12} slidesPerView="auto">
          {investPeriods.map(({ title, value }) => (
            <SwiperSlide key={value} className={appSt.swSlide}>
              <Tag
                view="filled"
                size="xxs"
                shape="rectangular"
                checked={invetstPeriod === value}
                onClick={() => setInvestPeriod(value)}
              >
                {title}
              </Tag>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className={appSt.box2}>
        <Typography.TitleResponsive tag="h2" view="xsmall" font="system" weight="semibold">
          Ваша выгода по двум продуктам
        </Typography.TitleResponsive>

        <div className={appSt.box3}>
          <Typography.Text view="primary-small" weight="medium">
            Вклад
          </Typography.Text>

          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Ставка
            </Typography.Text>
            <Typography.Text view="primary-small">
              {(investPeriodData.vkladPercent * 100).toLocaleString('ru-RU')}% годовых
            </Typography.Text>
          </div>
          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Срок
            </Typography.Text>
            <Typography.Text view="primary-small">{investPeriodData.title}</Typography.Text>
          </div>
          <Divider />

          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Доход за срок
            </Typography.Text>
            <Typography.Text view="primary-medium" weight="medium">
              {calcIncomeByMonths(vkladSum, investPeriodData.vkladPercent, invetstPeriod).toLocaleString('ru-RU')} ₽
            </Typography.Text>
          </div>
        </div>
        <div className={appSt.box3}>
          <Typography.Text view="primary-small" weight="medium">
            ПДС
          </Typography.Text>

          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Срок
            </Typography.Text>
            <Typography.Text view="primary-small">15 лет</Typography.Text>
          </div>
          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Доход от инвестиций
            </Typography.Text>
            <Typography.Text view="primary-small">{investmentsIncome.toLocaleString('ru-RU')} ₽</Typography.Text>
          </div>
          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Государство добавит
            </Typography.Text>
            <Typography.Text view="primary-small">{govCharity.toLocaleString('ru-RU')} ₽</Typography.Text>
          </div>
          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Налоговые вычеты добавят
            </Typography.Text>
            <Typography.Text view="primary-small">{taxRefund.toLocaleString('ru-RU')} ₽</Typography.Text>
          </div>
          <Divider />

          <div className={appSt.rowSb}>
            <Typography.Text view="primary-small" color="secondary">
              Доход за срок
            </Typography.Text>
            <Typography.Text view="primary-medium" weight="medium">
              {total.toLocaleString('ru-RU')} ₽
            </Typography.Text>
          </div>
        </div>
      </div>

      <Gap size={128} />

      <div className={appSt.bottomBtn()}>
        <Typography.Text view="primary-small" color="secondary" style={{ textAlign: 'center' }}>
          После откроем вклад на тех же условиях
        </Typography.Text>
        <Button block view="primary" onClick={goToStep2}>
          Открыть ПДС
        </Button>
      </div>

      <BottomSheetsInfo
        collapsedItems={collapsedItems}
        setCollapsedItem={setCollapsedItem}
        setShowBs={setShowBs}
        showBs={showBs}
      />
    </>
  );
};

const BottomSheetsInfo = ({
  setShowBs,
  showBs,
  collapsedItems,
  setCollapsedItem,
}: {
  showBs: 'conditions' | 'how-to' | 'questions' | '';
  setShowBs: (v: 'conditions' | 'how-to' | 'questions' | '') => void;
  setCollapsedItem: React.Dispatch<React.SetStateAction<string[]>>;
  collapsedItems: string[];
}) => {
  return (
    <>
      <BottomSheet
        open={showBs === 'conditions'}
        onClose={() => {
          setShowBs('');
        }}
        contentClassName={appSt.btmContent}
      >
        <div className={appSt.container}>
          <div>
            <Typography.TitleResponsive tag="h2" view="small" font="system" weight="medium">
              Два продукта работают вместе
            </Typography.TitleResponsive>
            <Typography.Text view="primary-small" color="secondary">
              Вы получаете доход по вкладу и деньги от государства одновременно
            </Typography.Text>
          </div>

          <div className={appSt.box}>
            <div className={appSt.row}>
              <img src={percentImg} width={32} height={32} alt="percentIcon" />
              <Typography.Text view="primary-medium" weight="medium">
                Альфа-Вклад
              </Typography.Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Процент
                  <br />
                  по вкладу
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <Typography.Text view="primary-small" weight="medium">
                    До 36% годовых
                  </Typography.Text>
                  <CheckIcon />
                </div>
              </div>
              <Divider />
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Минимальная
                  <br />
                  сумма вклада
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <Typography.Text view="primary-small" weight="medium">
                    От 30 000 ₽
                  </Typography.Text>
                  <CheckIcon />
                </div>
              </div>
              <Divider />
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Условия
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <Typography.Text view="primary-small" weight="medium">
                    Без пополнения
                    <br />и снятия
                  </Typography.Text>
                  <CheckIcon />
                </div>
              </div>
            </div>
          </div>
          <div className={appSt.box}>
            <div className={appSt.row}>
              <img src={shieldImg} width={32} height={32} alt="shieldIcon" />
              <Typography.Text view="primary-medium" weight="medium">
                Программа долгосрочных сбережений (ПДС)
              </Typography.Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Налоговый
                  <br />
                  вычет за 15 лет
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <Typography.Text view="primary-small" weight="medium">
                    До 1 320 000 ₽
                  </Typography.Text>
                  <CheckIcon />
                </div>
              </div>
              <Divider />
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Доплата
                  <br />
                  от государства
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <Typography.Text view="primary-small" weight="medium">
                    До 360 000 ₽
                  </Typography.Text>
                  <CheckIcon />
                </div>
              </div>
              <Divider />
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Инвестиционный <br />
                  доход
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <Typography.Text view="primary-small" weight="medium">
                    21,56% <br />
                    годовых
                  </Typography.Text>
                  <CheckIcon />
                </div>
              </div>
              <Divider />
              <div className={appSt.rowSb}>
                <Typography.Text view="primary-small" color="secondary">
                  Первый взнос
                  <br /> в ПДС
                </Typography.Text>
                <div className={appSt.rowSb} style={{ width: '50%' }}>
                  <div>
                    <Typography.Text view="primary-small" weight="medium" tag="p" defaultMargins={false}>
                      от 30 000 ₽
                    </Typography.Text>
                    <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
                      дальше любая сумма
                    </Typography.Text>
                  </div>
                  <CheckIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
      <BottomSheet
        open={showBs === 'how-to'}
        onClose={() => {
          setShowBs('');
        }}
        contentClassName={appSt.btmContent}
      >
        <div className={appSt.container}>
          <Typography.TitleResponsive
            style={{ marginTop: '1rem' }}
            tag="h2"
            view="small"
            font="system"
            weight="medium"
            id="how-to"
          >
            Три шага — и деньги работают
          </Typography.TitleResponsive>

          <Steps isVerticalAlign={true} interactive={false} className={appSt.stepStyle}>
            {hiw.map(item => (
              <span key={item.title}>
                <Typography.Text tag="p" defaultMargins={false} view="component-primary">
                  {item.title}
                </Typography.Text>
                <Typography.Text view="primary-small" color="secondary">
                  {item.desc}
                </Typography.Text>
              </span>
            ))}
          </Steps>
        </div>
      </BottomSheet>
      <BottomSheet
        open={showBs === 'questions'}
        onClose={() => {
          setShowBs('');
        }}
        contentClassName={appSt.btmContent}
      >
        <div className={appSt.container}>
          <Typography.TitleResponsive style={{ marginTop: '1rem' }} tag="h2" view="small" font="system" weight="medium">
            Вопросы и ответы
          </Typography.TitleResponsive>

          {faqs.map((faq, index) => (
            <div key={index}>
              <div
                onClick={() => {
                  window.gtag('event', '7364_bundle_faq', { faq: String(index + 1), var: 'var6' });

                  setCollapsedItem(items =>
                    items.includes(String(index + 1))
                      ? items.filter(item => item !== String(index + 1))
                      : [...items, String(index + 1)],
                  );
                }}
                className={appSt.rowSb}
              >
                <Typography.Text view="primary-medium" weight="medium">
                  {faq.question}
                </Typography.Text>
                {collapsedItems.includes(String(index + 1)) ? (
                  <div style={{ flexShrink: 0 }}>
                    <ChevronUpMIcon />
                  </div>
                ) : (
                  <div style={{ flexShrink: 0 }}>
                    <ChevronDownMIcon />
                  </div>
                )}
              </div>
              <Collapse expanded={collapsedItems.includes(String(index + 1))}>
                {faq.answers.map((answerPart, answerIndex) => (
                  <Fragment key={answerIndex}>
                    <Typography.Text tag="p" defaultMargins={false} view="primary-medium">
                      {answerPart}
                    </Typography.Text>
                    <Gap size={8} />
                  </Fragment>
                ))}
              </Collapse>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
};
