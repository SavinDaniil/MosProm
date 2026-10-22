export type VisitorId = 'andrey' | 'elena';
export type Interest = 'engineering' | 'quality' | 'logistics' | 'recipes' | 'process';
export interface Visitor {
  id: VisitorId;
  name: string;
  role: string;
  badge: string;
  zone: string;
  purpose: string;
  request: string;
  journal: string;
  time: string;
  greeting: string;
  profession: string;
  explanation: string;
  skills: string;
  interests: { id: Interest; text: string }[];
}

export const visitors: Record<VisitorId, Visitor> = {
  andrey: {
    id: 'andrey', name: 'Андрей Волков', role: 'Инженер оборудования', badge: '0142',
    zone: 'Линия розлива № 2', purpose: 'Плановый осмотр', request: 'И-142', journal: 'И-142', time: '08:10',
    greeting: 'Доброе утро. На вторую линию розлива — плановый осмотр. Вот документы.',
    profession: 'Инженер оборудования',
    explanation: 'Если оборудование работает неправильно, наша команда ищет причину и помогает восстановить работу линии. Даже небольшая неисправность влияет на выпуск продукции.',
    skills: 'Техническое мышление · внимательность · системный подход',
    interests: [
      { id: 'engineering', text: 'Как устроена линия розлива' },
      { id: 'quality', text: 'Как проверяют качество напитков' },
      { id: 'logistics', text: 'Как планируют поставки' },
    ],
  },
  elena: {
    id: 'elena', name: 'Елена Миронова', role: 'Технологическая служба', badge: '0256',
    zone: 'Технологический участок', purpose: 'Согласование параметров партии', request: 'T-218', journal: 'T-281', time: '08:25',
    greeting: 'Добрый день. На технологический участок — согласовать параметры партии. Заявка с собой.',
    profession: 'Технолог пищевого производства',
    explanation: 'Работа технолога — не просто придумать вкус. Нужно контролировать параметры производства, соблюдать рецептуры и следить за соответствием каждой партии требованиям.',
    skills: 'Работа с параметрами · точность · понимание процесса',
    interests: [
      { id: 'recipes', text: 'Рецептуры напитков' },
      { id: 'process', text: 'Параметры производственного процесса' },
      { id: 'quality', text: 'Контроль качества' },
    ],
  },
};

export const departmentResponse = (id: VisitorId) => id === 'andrey'
  ? 'Допуск подтверждён ответственным инженером: Андрей Волков, ID 0142. Плановый осмотр линии розлива № 2, заявка И-142. Изменений нет.'
  : 'Выдана исправленная заявка T-281. В T-218 техническая ошибка; прежняя заявка отозвана. Зона и цель совпадают с журналом.';

export const historyText = 'Московский завод открыли 18 декабря 1978 года. Его создание было связано с подготовкой к Олимпиаде-80: новому предприятию предстояло помогать обеспечивать гостей напитками.';

